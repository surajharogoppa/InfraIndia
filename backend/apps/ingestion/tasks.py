"""
Celery tasks for data ingestion pipeline.

Supported sources:
- MoSPI Flash Report CSV (primary, mirrors exact Flash Report columns)
- MoSPI Flash Report PDF (production, parses real PDF)
- Sample CSV (legacy demo connector)
"""
import logging
import hashlib
from datetime import date
from celery import shared_task
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def run_ingestion(self, source_id: int, file_path: str = None):
    """
    Main ingestion task. Runs the full ETL pipeline for a given DataSource.

    Flow:
        Fetch → Parse → Normalize → Validate → Deduplicate
        → Store Raw Record → Store Snapshot → Change Detection → Update Project

    Args:
        source_id: ID of the DataSource record.
        file_path: Path to local file (required for file-based connectors).
    """
    # pyrefly: ignore [missing-import]
    from apps.sources.models import DataSource
    # pyrefly: ignore [missing-import]
    from apps.ingestion.models import IngestionRun, DataQualityIssue, RawIngestionRecord
    # pyrefly: ignore [missing-import]
    from apps.projects.models import Project, ProjectSnapshot
    # pyrefly: ignore [missing-import]
    from services.change_detection.detector import detect_changes

    try:
        source = DataSource.objects.get(id=source_id)
    except DataSource.DoesNotExist:
        logger.error(f"DataSource {source_id} not found.")
        return

    # Create ingestion run record
    run = IngestionRun.objects.create(source=source)
    logger.info(f"Starting ingestion run {run.id} for source: {source.name}")

    try:
        connector = _get_connector(source, file_path)
        if connector is None:
            raise ValueError(f"No connector available for source: {source.name} (type: {source.source_type})")

        # Fetch
        raw_data = connector.fetch()

        # Parse
        raw_records = list(connector.parse(raw_data))
        run.records_found = len(raw_records)
        run.save(update_fields=["records_found"])
        logger.info(f"Run {run.id}: found {len(raw_records)} records from {source.name}")

        inserted = updated = rejected = unchanged = 0
        today = date.today()
        source_file = file_path or ""

        for raw_record in raw_records:
            try:
                # Normalize
                normalized = connector.normalize(raw_record)

                # Compute raw content hash for deduplication
                raw_str = str(sorted(raw_record.items()))
                content_hash = hashlib.sha256(raw_str.encode()).hexdigest()

                # Store raw record for audit trail
                ext_id = normalized.get("source_match_key") or normalized.get("name", "")[:50]
                raw_rec = RawIngestionRecord.objects.create(
                    ingestion_run=run,
                    external_record_id=ext_id,
                    raw_payload=raw_record,
                    content_hash=content_hash,
                    source_file=source_file,
                )

                # Validate
                is_valid, errors = connector.validate(normalized)
                if not is_valid:
                    DataQualityIssue.objects.create(
                        ingestion_run=run,
                        raw_record_ref=ext_id,
                        problem_description="; ".join(errors),
                        raw_data=raw_record,
                    )
                    raw_rec.was_accepted = False
                    raw_rec.rejection_reason = "; ".join(errors)
                    raw_rec.save(update_fields=["was_accepted", "rejection_reason"])
                    rejected += 1
                    continue

                # Snapshot deduplication — skip if same raw hash already saved
                raw_hash = normalized.get("raw_record_hash", "")
                if raw_hash and ProjectSnapshot.objects.filter(raw_record_hash=raw_hash).exists():
                    unchanged += 1
                    raw_rec.was_accepted = True
                    raw_rec.rejection_reason = "Duplicate snapshot (unchanged data)"
                    raw_rec.save(update_fields=["was_accepted", "rejection_reason"])
                    continue

                with transaction.atomic():
                    # Resolve FK entities
                    ministry = _get_or_create_ministry(normalized.get("ministry_name"))
                    sector = _get_or_create_sector(normalized.get("sector_name"))
                    state = _get_or_create_state(normalized.get("state_name"))

                    # Find or create project
                    project, created = _find_or_create_project(
                        normalized, source, ministry, sector, state
                    )

                    # Create snapshot
                    snapshot = ProjectSnapshot.objects.create(
                        project=project,
                        snapshot_date=today,
                        project_cost=normalized.get("original_cost"),
                        revised_cost=normalized.get("current_cost"),
                        expenditure=normalized.get("current_expenditure"),
                        physical_progress=normalized.get("current_progress"),
                        start_date=normalized.get("original_start_date"),
                        completion_date=(
                            normalized.get("current_completion_date")
                            or normalized.get("original_completion_date")
                        ),
                        source_status=normalized.get("source_status", ""),
                        source=source,
                        raw_record_hash=raw_hash,
                    )

                    # Change detection
                    detect_changes(project, snapshot)

                    # Update canonical project record
                    _update_project_from_snapshot(project, normalized, source, ministry=ministry, sector=sector, state=state)

                    # Mark raw record as accepted
                    raw_rec.was_accepted = True
                    raw_rec.save(update_fields=["was_accepted"])

                    if created:
                        inserted += 1
                    else:
                        updated += 1

            except Exception as row_exc:
                logger.warning(f"Error processing record: {row_exc}", exc_info=True)
                rejected += 1

        # Finalize run
        run.records_inserted = inserted
        run.records_updated = updated
        run.records_rejected = rejected
        run.status = (
            IngestionRun.Status.SUCCESS
            if rejected == 0
            else IngestionRun.Status.PARTIAL_SUCCESS
        )
        run.completed_at = timezone.now()
        run.save()

        source.last_successful_sync = timezone.now()
        source.save(update_fields=["last_successful_sync"])

        logger.info(
            f"Ingestion run {run.id} complete: "
            f"{inserted} inserted, {updated} updated, "
            f"{unchanged} unchanged, {rejected} rejected"
        )

    except Exception as exc:
        run.status = IngestionRun.Status.FAILED
        run.error_message = str(exc)
        run.completed_at = timezone.now()
        run.save()

        source.last_failed_sync = timezone.now()
        source.save(update_fields=["last_failed_sync"])

        logger.error(f"Ingestion run {run.id} FAILED: {exc}", exc_info=True)
        raise self.retry(exc=exc, countdown=60)


@shared_task(name="apps.ingestion.tasks.sync_paimana_flash_report")
def sync_paimana_flash_report(file_path: str = None, auto_download: bool = False):
    """
    Celery task for scheduled MoSPI Flash Report ingestion.
    Runs monthly (see config/celery.py beat schedule).

    If file_path is provided, uses that file.
    If auto_download=True, attempts to download the latest PDF from mospi.gov.in.
    """
    # pyrefly: ignore [missing-import]
    from apps.sources.models import DataSource
    from pathlib import Path

    try:
        source = DataSource.objects.get(name="MoSPI Flash Report (PAIMANA)")
    except DataSource.DoesNotExist:
        logger.error(
            "DataSource 'MoSPI Flash Report (PAIMANA)' not found. "
            "Run 'python manage.py setup_sources' first."
        )
        return

    resolved_file = file_path

    if not resolved_file and auto_download:
        # pyrefly: ignore [missing-import]
        from services.connectors.mospi_flash_report.downloader import (
            try_download_latest_flash_report
        )
        raw_dir = Path(__file__).resolve().parent.parent.parent / "data" / "raw" / "flash_reports"
        downloaded = try_download_latest_flash_report(raw_dir)
        if downloaded:
            resolved_file = str(downloaded)
        else:
            logger.warning(
                "Auto-download failed. Checking for most recent local file..."
            )
            # Use the most recently downloaded file in the raw directory
            if raw_dir.exists():
                pdf_files = sorted(raw_dir.glob("*.pdf"), key=lambda f: f.stat().st_mtime)
                csv_files = sorted(raw_dir.glob("*.csv"), key=lambda f: f.stat().st_mtime)
                all_files = pdf_files + csv_files
                if all_files:
                    resolved_file = str(all_files[-1])
                    logger.info(f"Using most recent local file: {resolved_file}")

    if not resolved_file:
        logger.error(
            "No Flash Report file available. "
            "Provide file_path, enable auto_download, or manually run: "
            "python manage.py sync_paimana --file path/to/report.csv"
        )
        return

    run_ingestion.delay(source.id, resolved_file)


# ── Connector registry ────────────────────────────────────────────────────────

def _get_connector(source, file_path=None):
    """
    Select the appropriate connector based on source name and type.

    Connector selection order:
    1. MoSPI Flash Report sources → CSV or PDF connector based on file extension
    2. Legacy sample CSV → SampleCSVConnector
    3. Unknown → None
    """
    # pyrefly: ignore [missing-import]
    from apps.sources.models import DataSource

    # MoSPI Flash Report connectors
    if "paimana" in source.name.lower() or "flash report" in source.name.lower() or "mospi" in source.name.lower():
        if file_path:
            ext = str(file_path).lower()
            if ext.endswith(".pdf"):
                # pyrefly: ignore [missing-import]
                from services.connectors.mospi_flash_report.connector import (
                    MoSPIFlashReportPDFConnector
                )
                return MoSPIFlashReportPDFConnector(file_path)
            else:
                # Default to CSV connector for .csv and other text files
                # pyrefly: ignore [missing-import]
                from services.connectors.mospi_flash_report.connector import (
                    MoSPIFlashReportCSVConnector
                )
                return MoSPIFlashReportCSVConnector(file_path)
        return None

    # Legacy sample CSV connector
    if source.source_type in (DataSource.SourceType.CSV, DataSource.SourceType.XLSX):
        if file_path:
            # pyrefly: ignore [missing-import]
            from services.connectors.sample_csv.connector import SampleCSVConnector
            return SampleCSVConnector(file_path)

    return None


# ── FK helpers ────────────────────────────────────────────────────────────────

def _get_or_create_ministry(name: str | None):
    if not name:
        return None
    # pyrefly: ignore [missing-import]
    from apps.organizations.models import Ministry
    obj, _ = Ministry.objects.get_or_create(name=name.strip(), defaults={"short_name": ""})
    return obj


def _get_or_create_department(name: str | None, ministry):
    if not name:
        return None
    # pyrefly: ignore [missing-import]
    from apps.organizations.models import Department
    obj, _ = Department.objects.get_or_create(name=name.strip(), defaults={"ministry": ministry})
    return obj


def _get_or_create_organization(name: str | None, department):
    if not name:
        return None
    # pyrefly: ignore [missing-import]
    from apps.organizations.models import Organization
    obj, _ = Organization.objects.get_or_create(name=name.strip(), defaults={"department": department})
    return obj


def _get_or_create_sector(name: str | None):
    if not name:
        return None
    # pyrefly: ignore [missing-import]
    from apps.organizations.models import Sector
    obj, _ = Sector.objects.get_or_create(name=name.strip(), defaults={"description": ""})
    return obj


def _get_or_create_state(name: str | None):
    if not name:
        return None
    # pyrefly: ignore [missing-import]
    from apps.locations.models import State
    obj, _ = State.objects.get_or_create(
        name=name.strip(),
        defaults={"code": name.strip()[:10].upper()}
    )
    return obj


def _find_or_create_project(normalized, source, ministry, sector, state):
    """
    Find existing project or create new one.

    Matching strategy for MoSPI Flash Reports (no external project ID):
    1. Match by source_match_key (hash of name + ministry + state) + source
    2. Match by name + state (case-insensitive)
    3. Create new project
    """
    # pyrefly: ignore [missing-import]
    from apps.projects.models import Project

    name = normalized.get("name", "").strip()
    match_key = normalized.get("source_match_key", "")

    # Strategy 1: Match by source_match_key stored in external_project_id field
    if match_key:
        project = Project.objects.filter(
            external_project_id=f"PAIMANA_{match_key}",
            source=source
        ).first()
        if project:
            return project, False

    # Strategy 2: Match by name + state (case-insensitive, exact name)
    if name and state:
        project = Project.objects.filter(name__iexact=name, state=state).first()
        if project:
            return project, False

    # Strategy 3: Create new project
    project = Project.objects.create(
        external_project_id=f"PAIMANA_{match_key}" if match_key else "",
        name=name,
        ministry=ministry,
        sector=sector,
        state=state,
        source=source,
        source_url="https://mospi.gov.in",
        platform_status=normalized.get("platform_status", "UNKNOWN"),
    )
    return project, True


def _update_project_from_snapshot(project, normalized, source, ministry=None, sector=None, state=None):
    """Update canonical Project with latest ingested values."""
    fields_map = {
        "original_cost": normalized.get("original_cost"),
        "current_cost": normalized.get("current_cost"),
        "current_expenditure": normalized.get("current_expenditure"),
        "current_progress": normalized.get("current_progress"),
        "source_status": normalized.get("source_status", ""),
        "original_completion_date": normalized.get("original_completion_date"),
        "current_completion_date": normalized.get("current_completion_date"),
        "platform_status": normalized.get("platform_status", "UNKNOWN"),
    }

    updated_fields = []
    for field, val in fields_map.items():
        if val is not None:
            setattr(project, field, val)
            updated_fields.append(field)

    if ministry and not project.ministry_id:
        project.ministry = ministry
        updated_fields.append("ministry")
    if sector and not project.sector_id:
        project.sector = sector
        updated_fields.append("sector")
    if state and not project.state_id:
        project.state = state
        updated_fields.append("state")

    project.source = source
    project.source_url = "https://mospi.gov.in"
    updated_fields.extend(["source", "source_url", "updated_at"])
    project.save(update_fields=updated_fields)
