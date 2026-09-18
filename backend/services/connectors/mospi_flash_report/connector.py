"""
MoSPI Flash Report Connectors.

Two connectors are provided:

1. MoSPIFlashReportCSVConnector
   - Reads a CSV file whose columns mirror the actual Flash Report format
   - Used for development, CI, and when a PDF has been pre-converted
   - Primary connector for immediate use

2. MoSPIFlashReportPDFConnector
   - Reads a real Flash Report PDF using pdfplumber
   - Used in production when a real PDF is available
   - Falls back gracefully if PDF structure changes

Both implement BaseProjectSource and produce identical normalized records.

Column mapping (Flash Report → Platform schema):
  "Name of Project"           → name
  "Ministry/Deptt."           → ministry_name
  "Sector"                    → sector_name
  "State"                     → state_name
  "Approved Cost (Rs Cr)"     → original_cost (× CRORE → paise)
  "Latest Revised Cost (Rs Cr)"→ current_cost (× CRORE → paise)
  "Cumm. Expenditure (Rs Cr)" → current_expenditure (× CRORE → paise)
  "Date of Compl. (Orig.)"    → original_completion_date
  "Date of Compl. (Rev.)"     → current_completion_date
  "Physical Progress (%)"     → current_progress
  "Source Status"             → source_status (verbatim)
"""
import csv
import hashlib
import io
import logging
from datetime import date
from pathlib import Path
from typing import Iterator

# pyrefly: ignore [missing-import]
from services.connectors.base import BaseProjectSource
# pyrefly: ignore [missing-import]
from services.normalization.normalizers import (
    normalize_currency_to_paise,
    normalize_date,
    normalize_state_name,
    normalize_progress,
)

logger = logging.getLogger(__name__)

# ── Column maps ───────────────────────────────────────────────────────────────

# CSV column names → canonical platform fields
CSV_COLUMN_MAP = {
    # Primary expected column names (exact Flash Report headers)
    "Name of Project": "name",
    "Ministry/Deptt.": "ministry_name",
    "Sector": "sector_name",
    "State": "state_name",
    "Approved Cost (Rs Cr)": "original_cost_raw",
    "Latest Revised Cost (Rs Cr)": "revised_cost_raw",
    "Cumm. Expenditure (Rs Cr)": "expenditure_raw",
    "Date of Compl. (Orig.)": "original_completion_date_raw",
    "Date of Compl. (Rev.)": "current_completion_date_raw",
    "Physical Progress (%)": "progress_raw",
    "Source Status": "source_status",
    # Alternative/variant column names (handled by _remap_row)
    "Project Name": "name",
    "Ministry": "ministry_name",
    "Department": "ministry_name",
    "Original Cost (Rs Cr)": "original_cost_raw",
    "Original Cost (Cr)": "original_cost_raw",
    "Revised Cost (Rs Cr)": "revised_cost_raw",
    "Revised Cost (Cr)": "revised_cost_raw",
    "Expenditure (Rs Cr)": "expenditure_raw",
    "Expenditure (Cr)": "expenditure_raw",
}

# Canonical parsed-row field names (from pdf_parser.py) → platform fields
PDF_COLUMN_MAP = {
    "name": "name",
    "ministry": "ministry_name",
    "sector": "sector_name",
    "state": "state_name",
    "approved_cost": "original_cost_raw",
    "revised_cost": "revised_cost_raw",
    "expenditure": "expenditure_raw",
    "orig_completion": "original_completion_date_raw",
    "rev_completion": "current_completion_date_raw",
    "progress": "progress_raw",
    "source_status": "source_status",
}


# ── Shared normalization logic ────────────────────────────────────────────────

def _normalize_record(raw: dict, source_file: str = "") -> dict:
    """
    Normalize a remapped raw row dict into the platform schema.
    Both CSV and PDF connectors call this after remapping column names.
    """
    n = {}

    # Identity
    n["name"] = str(raw.get("name", "")).strip()
    n["ministry_name"] = _clean_text(raw.get("ministry_name", ""))
    n["sector_name"] = _clean_text(raw.get("sector_name", ""))
    n["state_name"] = normalize_state_name(raw.get("state_name", ""))
    n["source_status"] = _clean_text(raw.get("source_status", ""))

    # No external project ID in Flash Reports — use composite hash as proxy
    composite = f"{n['name'].lower()}|{n['ministry_name'].lower()}|{n['state_name'] or ''}"
    n["external_project_id"] = ""   # No official ID in public PDFs
    n["source_match_key"] = hashlib.sha256(composite.encode()).hexdigest()[:16]

    # Financial
    n["original_cost"] = normalize_currency_to_paise(raw.get("original_cost_raw"))
    n["current_cost"] = normalize_currency_to_paise(raw.get("revised_cost_raw"))
    n["current_expenditure"] = normalize_currency_to_paise(raw.get("expenditure_raw"))

    # Dates (Flash Report uses formats like "Mar-2022", "Dec-2024")
    n["original_completion_date"] = normalize_date(raw.get("original_completion_date_raw"))
    n["current_completion_date"] = normalize_date(raw.get("current_completion_date_raw"))

    # Progress
    n["current_progress"] = normalize_progress(raw.get("progress_raw"))

    # Platform status derived from source_status + progress
    n["platform_status"] = _derive_platform_status(n["source_status"], n["current_progress"])

    # Source metadata
    n["source_url"] = "https://mospi.gov.in"
    n["source_file"] = source_file

    # Raw record hash for snapshot deduplication
    raw_str = str(sorted(raw.items()))
    n["raw_record_hash"] = hashlib.sha256(raw_str.encode()).hexdigest()

    return n


def _derive_platform_status(source_status: str, progress: float | None) -> str:
    """Derive canonical platform_status from source verbatim status and progress."""
    status_lower = (source_status or "").lower()
    if "complet" in status_lower or (progress is not None and progress >= 95):
        return "COMPLETED"
    if "active" in status_lower or "ongoing" in status_lower or "progress" in status_lower:
        return "ACTIVE"
    if "planned" in status_lower or "new" in status_lower:
        return "PLANNED"
    if "closed" in status_lower or "stopped" in status_lower:
        return "CLOSED"
    if progress and progress > 0:
        return "ACTIVE"
    return "UNKNOWN"


def _validate_normalized(record: dict) -> tuple[bool, list[str]]:
    """Shared validation for normalized records."""
    errors = []

    if not record.get("name"):
        errors.append("Missing project name")

    if record.get("original_cost") is not None and record["original_cost"] < 0:
        errors.append(f"Negative original cost: {record['original_cost']}")

    if record.get("current_cost") is not None and record["current_cost"] < 0:
        errors.append(f"Negative revised cost: {record['current_cost']}")

    if record.get("current_expenditure") is not None and record["current_expenditure"] < 0:
        errors.append(f"Negative expenditure: {record['current_expenditure']}")

    prog = record.get("current_progress")
    if prog is not None and not (0 <= prog <= 100):
        errors.append(f"Progress out of range: {prog}")

    orig = record.get("original_completion_date")
    rev = record.get("current_completion_date")
    if orig and rev and orig > rev:
        # Not necessarily an error (revised date can be earlier for fast completions)
        # but log it
        logger.debug(f"Original completion {orig} > revised {rev} for {record.get('name')}")

    return (len(errors) == 0), errors


def _clean_text(value) -> str:
    if not value:
        return ""
    return str(value).strip().replace("\n", " ").replace("  ", " ")


# ── CSV Connector ─────────────────────────────────────────────────────────────

class MoSPIFlashReportCSVConnector(BaseProjectSource):
    """
    Reads a CSV file whose columns mirror the MoSPI Flash Report format.

    Supports:
    - Exact Flash Report column headers
    - Common header variants across editions
    - UTF-8 with BOM encoding (common in government downloads)

    This is the primary connector for development and for environments
    where the PDF has been pre-converted to CSV.
    """
    source_name = "MoSPI Flash Report (CSV)"

    def __init__(self, file_path: str | Path):
        self.file_path = Path(file_path)

    def fetch(self) -> str:
        logger.info(f"Reading CSV Flash Report: {self.file_path}")
        if not self.file_path.exists():
            raise FileNotFoundError(f"Flash Report CSV not found: {self.file_path}")
        # Support UTF-8 with BOM (utf-8-sig)
        return self.file_path.read_text(encoding="utf-8-sig")

    def parse(self, raw_data: str) -> Iterator[dict]:
        reader = csv.DictReader(io.StringIO(raw_data))
        if not reader.fieldnames:
            logger.warning("CSV has no headers — aborting parse.")
            return
        logger.info(f"CSV columns detected: {list(reader.fieldnames)}")
        for row in reader:
            yield dict(row)

    def normalize(self, record: dict) -> dict:
        # Remap CSV column names to canonical field names
        remapped = {}
        for csv_col, platform_field in CSV_COLUMN_MAP.items():
            if csv_col in record:
                remapped[platform_field] = record[csv_col]
        return _normalize_record(remapped, source_file=str(self.file_path.name))

    def validate(self, record: dict) -> tuple[bool, list[str]]:
        return _validate_normalized(record)


# ── PDF Connector ─────────────────────────────────────────────────────────────

class MoSPIFlashReportPDFConnector(BaseProjectSource):
    """
    Reads a real MoSPI Flash Report PDF using pdfplumber.

    Handles:
    - Multi-page project tables
    - Schema changes (graceful failure with logging)
    - Variable whitespace and merged cells

    Use this connector in production when a real PDF is available.
    """
    source_name = "MoSPI Flash Report (PDF)"

    def __init__(self, file_path: str | Path):
        self.file_path = Path(file_path)

    def fetch(self) -> bytes:
        logger.info(f"Reading PDF Flash Report: {self.file_path}")
        if not self.file_path.exists():
            raise FileNotFoundError(f"Flash Report PDF not found: {self.file_path}")
        return self.file_path.read_bytes()

    def parse(self, raw_data: bytes) -> Iterator[dict]:
        # pyrefly: ignore [missing-import]
        from services.connectors.mospi_flash_report.pdf_parser import parse_flash_report_pdf
        rows = parse_flash_report_pdf(str(self.file_path))
        if not rows:
            logger.warning(
                f"PDF parser returned 0 rows from {self.file_path}. "
                "The PDF structure may have changed. "
                "Check docs/data-sources/paimana.md for known format variations."
            )
        for row in rows:
            yield row

    def normalize(self, record: dict) -> dict:
        # Remap pdf_parser canonical names to platform fields
        remapped = {}
        for pdf_field, platform_field in PDF_COLUMN_MAP.items():
            if pdf_field in record:
                remapped[platform_field] = record[pdf_field]
        return _normalize_record(remapped, source_file=str(self.file_path.name))

    def validate(self, record: dict) -> tuple[bool, list[str]]:
        return _validate_normalized(record)
