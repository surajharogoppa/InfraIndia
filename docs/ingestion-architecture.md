# Ingestion Architecture

## Overview

The platform uses a layered ETL (Extract → Transform → Load) pipeline to ingest
government project data from external sources and convert it into a clean, normalized,
change-tracked internal database.

```
External Source (PDF/CSV/API)
        │
        ▼
┌─────────────────────────┐
│  Connector              │  Fetch raw bytes, parse into row dicts
│  BaseProjectSource      │  (mospi_flash_report, sample_csv, ...)
└───────────┬─────────────┘
            │ raw row dicts
            ▼
┌─────────────────────────┐
│  Normalizer             │  Canonical field mapping + type coercion
│  (connector.normalize)  │  Currency → paise, dates → date, state names
└───────────┬─────────────┘
            │ normalized dicts
            ▼
┌─────────────────────────┐
│  Validator              │  Business rule checks
│  (connector.validate)   │  Name present? Cost non-negative? Progress in range?
└───────────┬─────────────┘
            │ valid | invalid
     ┌──────┴──────────┐
     │                 │
     ▼                 ▼
┌─────────┐    ┌──────────────────────┐
│  DQ     │    │  Deduplication       │
│  Queue  │    │  SHA-256 content hash│
│  (Issue)│    │  vs existing snaps   │
└─────────┘    └──────────┬───────────┘
                          │ new record only
                          ▼
               ┌──────────────────────┐
               │  RawIngestionRecord  │  Immutable audit record (pre-normalization)
               └──────────┬───────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │  Project (FK lookup) │  Find by match_key or name+state
               │  get_or_create       │  Create if new
               └──────────┬───────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │  ProjectSnapshot     │  Point-in-time record for every sync
               └──────────┬───────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │  Change Detection    │  Compare current vs previous snapshot
               │  detector.py        │  Emit ProjectChange records for deltas
               └──────────┬───────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │  Project (update)    │  Refresh canonical project with latest values
               └──────────────────────┘
```

---

## Key Components

### Connectors (`services/connectors/`)

| Connector | Type | Status | Use Case |
|---|---|---|---|
| `MoSPIFlashReportCSVConnector` | CSV | ✅ Active | Primary — reads Flash Report-format CSV |
| `MoSPIFlashReportPDFConnector` | PDF | ✅ Active | Production — parses real Flash Report PDFs |
| `SampleCSVConnector` | CSV | Demo only | Legacy demo connector |

All connectors implement `BaseProjectSource`:
```python
class BaseProjectSource:
    def fetch(self) -> bytes | str       # Retrieve raw data
    def parse(self, raw) -> Iterator[dict]  # Convert to row dicts
    def normalize(self, row: dict) -> dict  # Map to platform schema
    def validate(self, normalized: dict) -> tuple[bool, list[str]]
```

### Normalization (`services/normalization/normalizers.py`)

| Function | Input | Output |
|---|---|---|
| `normalize_currency_to_paise` | "500 Cr", 500.0, "₹500" | int (paise) |
| `normalize_date` | "Mar-2022", "2022-03-01", date | `date` \| `None` |
| `normalize_state_name` | "UP", "J&K", "Orissa" | canonical state name |
| `normalize_progress` | "75%", 75.0, "75" | float 0–100 \| `None` |

### Change Detection (`services/change_detection/detector.py`)

Compares current `ProjectSnapshot` against previous latest snapshot for the same project.
Emits `ProjectChange` records for each field that has changed.

Tracked fields: `project_cost`, `revised_cost`, `expenditure`, `physical_progress`,
`completion_date`, `source_status`

### Models

```
DataSource         — Registry of known data sources
    │
IngestionRun       — One record per sync execution
    │
RawIngestionRecord — Immutable raw row (pre-normalization, for auditing)
    │
DataQualityIssue   — Rejected records with reason (routed to admin DQ queue)

Project            — Canonical project entity
    │
ProjectSnapshot    — Point-in-time state for each sync
    │
ProjectChange      — Individual field-level change record
```

---

## Data Flow: MoSPI Flash Report

```
1. Admin downloads PDF from mospi.gov.in/ipmd  (monthly, ~6–8 weeks lag)
   OR: system attempts auto-download via known URL patterns

2. python manage.py sync_paimana --file flash_report.pdf
   OR: Celery beat fires on 1st of month at 06:00 IST

3. MoSPIFlashReportCSVConnector (CSV) or MoSPIFlashReportPDFConnector (PDF)
   fetches + parses rows

4. Each row normalized:
   "1247.00" Cr → 12_470_000_000 paise
   "Mar-2022"   → date(2022, 3, 1)
   "UP"         → "Uttar Pradesh"

5. Validated — invalid rows → DataQualityIssue

6. SHA-256 content hash computed
   Already exists? → skip (idempotent)

7. Project matched by:
   (a) external_project_id = "PAIMANA_<match_key>"
   (b) name (case-insensitive) + state
   (c) Create new project

8. ProjectSnapshot created

9. Change detection: compare vs previous snapshot
   → ProjectChange records for cost/progress/date deltas

10. Project canonical record updated with latest values

11. IngestionRun finalized (status, counts, timestamps)
```

---

## Scheduling

Monthly Celery beat (configured in `config/celery.py`):
```
Task: apps.ingestion.tasks.sync_paimana_flash_report
Schedule: 1st of each month at 06:00 IST
Auto-download: True (best-effort PDF download from mospi.gov.in)
```

If auto-download fails (mospi.gov.in URL structure changes), it falls back to
the most recently downloaded local file in `data/raw/flash_reports/`.

---

## Project Matching Strategy (No External ID in Flash Reports)

Public Flash Reports do not publish a stable project ID. Matching uses:

```python
match_key = SHA-256(
    name.strip().lower() + "|" +
    ministry.strip().lower() + "|" +
    state.strip().lower()
)[:16]

external_project_id = f"PAIMANA_{match_key}"
```

Projects with name variations between monthly editions → routed to `DataQualityIssue`
with problem_description "Low-confidence name match" for manual admin review.

---

## APIs

| Endpoint | Description |
|---|---|
| `GET /api/ingestion/runs/` | List all ingestion runs |
| `GET /api/ingestion/runs/{id}/` | Run details + counts |
| `GET /api/ingestion/quality/` | Data quality issues queue |
| `PATCH /api/ingestion/quality/{id}/resolve/` | Resolve a DQ issue |
| `GET /api/ingestion/raw-records/` | Raw audit trail (list) |
| `GET /api/ingestion/raw-records/{id}/` | Raw record with payload |

---

## Adding a New Source

1. Create `services/connectors/<source_name>/connector.py`
2. Implement `BaseProjectSource` (fetch, parse, normalize, validate)
3. Add a `DataSource` entry via `setup_sources` management command
4. Register connector in `apps/ingestion/tasks._get_connector()`
5. (Optional) Add Celery beat schedule in `config/celery.py`
6. Add tests in `tests/test_<source_name>_connector.py`
