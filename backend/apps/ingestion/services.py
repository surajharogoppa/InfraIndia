import logging
import hashlib
from datetime import datetime, date
from pathlib import Path
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


def sync_mospi_flash_report(
    source=None,
    file_path: str = None,
    auto_download: bool = True,
    dry_run: bool = False,
    log_func=None,
    run=None,
) -> dict:
    """
    Core ingestion service function for MoSPI Flash Report (PAIMANA).
    
    Can be called synchronously or asynchronously from:
    1. Django Admin manual trigger endpoint
    2. Management command 'python manage.py sync_paimana'
    3. Celery / background workers

    Returns:
        dict with run, inserted, updated, unchanged, rejected, and cost/progress change statistics.
    """
    def _log(msg, level="info"):
        if log_func:
            log_func(msg, level=level)
        if level == "error":
            logger.error(msg)
        elif level == "warning":
            logger.warning(msg)
        else:
            logger.info(msg)
        if run and not dry_run:
            try:
                run.error_message = msg
                run.save(update_fields=["error_message"])
            except Exception:
                pass

    # pyrefly: ignore [missing-import]
    from apps.sources.models import DataSource
    # pyrefly: ignore [missing-import]
    from apps.ingestion.models import IngestionRun, DataQualityIssue, RawIngestionRecord
    # pyrefly: ignore [missing-import]
    from apps.projects.models import Project, ProjectSnapshot
    # pyrefly: ignore [missing-import]
    from services.change_detection.detector import detect_changes
    # pyrefly: ignore [missing-import]
    from apps.ingestion.tasks import (
        _get_connector,
        _get_or_create_ministry,
        _get_or_create_sector,
        _get_or_create_state,
        _find_or_create_project,
        _update_project_from_snapshot,
    )
    # pyrefly: ignore [missing-import]
    from services.connectors.mospi_flash_report.downloader import (
        try_download_latest_flash_report
    )

    if source is None:
        source, _ = DataSource.objects.get_or_create(
            name="MoSPI Flash Report (PAIMANA)",
            defaults={
                "organization": "Ministry of Statistics and Programme Implementation (MoSPI), IPMD",
                "source_type": DataSource.SourceType.PDF,
                "access_method": DataSource.AccessMethod.SCHEDULED_DOWNLOAD,
                "base_url": "https://mospi.gov.in/publications-reports",
                "update_frequency": "Monthly",
                "is_active": True,
            }
        )

    _log(f"Starting MoSPI PAIMANA synchronization for source: {source.name}...")
    backend_dir = Path(__file__).resolve().parent.parent.parent
    raw_dir = backend_dir / "data" / "raw" / "flash_reports"
    raw_dir.mkdir(parents=True, exist_ok=True)

    # Resolve file path
    resolved_file = None
    if file_path:
        p = Path(file_path)
        if not p.is_absolute():
            p = (backend_dir / file_path).resolve()
        if p.exists():
            resolved_file = str(p)
        else:
            _log(f"Specified file not found: {file_path}", level="warning")

    if not resolved_file and auto_download:
        _log("Fetching live document from mospi.gov.in...")
        downloaded = try_download_latest_flash_report(raw_dir)
        if downloaded and downloaded.exists():
            resolved_file = str(downloaded)
            _log(f"Successfully downloaded live report: {downloaded.name}")

    if not resolved_file:
        # Fallback to local files in raw_dir, strictly prioritizing complete full PDFs
        if raw_dir.exists():
            pdf_files = sorted(
                list(raw_dir.glob("*.pdf")),
                key=lambda f: (f.stat().st_size, f.stat().st_mtime),
                reverse=True
            )
            csv_files = sorted(
                list(raw_dir.glob("*.csv")),
                key=lambda f: f.stat().st_mtime,
                reverse=True
            )
            candidates = pdf_files + csv_files
            if candidates:
                resolved_file = str(candidates[0])
                _log(f"Using local file repository: {candidates[0].name}")

    if not resolved_file:
        err = "Could not download report from mospi.gov.in and no local report files found in data/raw/flash_reports/."
        if run:
            run.status = IngestionRun.Status.FAILED
            run.error_message = err
            run.completed_at = timezone.now()
            run.save(update_fields=["status", "error_message", "completed_at"])
        raise ValueError(err)

    _log(f"Processing data file: {Path(resolved_file).name} ({Path(resolved_file).stat().st_size / (1024*1024):.2f} MB)")

    # Select connector
    connector = _get_connector(source, resolved_file)
    if connector is None:
        err = f"No connector available for source '{source.name}' and file '{resolved_file}'."
        if run:
            run.status = IngestionRun.Status.FAILED
            run.error_message = err
            run.completed_at = timezone.now()
            run.save(update_fields=["status", "error_message", "completed_at"])
        raise ValueError(err)

    # Fetch & Parse
    _log("Extracting projects from document tables (pages 1 to 350+)...")
    try:
        raw_data = connector.fetch()
        raw_records = list(connector.parse(raw_data))
    except Exception as exc:
        if run:
            run.status = IngestionRun.Status.FAILED
            run.error_message = f"Parse failed: {str(exc)}"
            run.completed_at = timezone.now()
            run.save(update_fields=["status", "error_message", "completed_at"])
        raise

    _log(f"Discovered {len(raw_records)} project records in document.")

    if not raw_records:
        err = "No records found in data document. Verify file structure."
        if run:
            run.status = IngestionRun.Status.FAILED
            run.error_message = err
            run.completed_at = timezone.now()
            run.save(update_fields=["status", "error_message", "completed_at"])
        raise ValueError(err)

    # Normalize & Validate
    _log("Normalizing and validating project records...")
    valid_records = []
    invalid_records = []
    for raw_record in raw_records:
        normalized = connector.normalize(raw_record)
        is_valid, errors = connector.validate(normalized)
        if is_valid:
            valid_records.append((raw_record, normalized))
        else:
            invalid_records.append((raw_record, normalized, errors))

    _log(f"Valid records: {len(valid_records)} | Validation alerts: {len(invalid_records)}")

    if dry_run:
        return {
            "run": None,
            "records_found": len(raw_records),
            "valid_records": len(valid_records),
            "invalid_records": len(invalid_records),
            "inserted": 0,
            "updated": 0,
            "unchanged": 0,
            "rejected": len(invalid_records),
            "cost_changes": 0,
            "progress_changes": 0,
            "date_changes": 0,
        }

    # Create ingestion run record if not provided
    if run is None:
        run = IngestionRun.objects.create(
            source=source,
            status=IngestionRun.Status.RUNNING,
            records_found=len(raw_records),
        )
    else:
        run.records_found = len(raw_records)
        run.save(update_fields=["records_found"])

    today = date.today()
    inserted = updated = unchanged = rejected = 0
    cost_changes = progress_changes = date_changes = 0

    total_valid = len(valid_records)
    _log(f"Synchronizing database records (0/{total_valid} processed)...")

    for idx, (raw_record, normalized) in enumerate(valid_records):
        try:
            # Compute hash
            raw_str = str(sorted(raw_record.items()))
            content_hash = hashlib.sha256(raw_str.encode()).hexdigest()
            ext_id = normalized.get("source_match_key", "")[:50]

            # Audit record
            RawIngestionRecord.objects.create(
                ingestion_run=run,
                external_record_id=ext_id,
                raw_payload=raw_record,
                content_hash=content_hash,
                source_file=str(Path(resolved_file).name),
                was_accepted=True,
            )

            # Deduplication
            raw_hash = normalized.get("raw_record_hash", "")
            if raw_hash and ProjectSnapshot.objects.filter(raw_record_hash=raw_hash).exists():
                unchanged += 1
                if run and (idx + 1) % 50 == 0:
                    run.records_inserted = inserted
                    run.records_updated = updated
                    run.error_message = f"Synchronizing database records ({idx + 1}/{total_valid} processed - {inserted} new, {updated} updated, {unchanged} unchanged)..."
                    run.save(update_fields=["records_inserted", "records_updated", "error_message"])
                continue

            with transaction.atomic():
                ministry = _get_or_create_ministry(normalized.get("ministry_name"))
                sector = _get_or_create_sector(normalized.get("sector_name"))
                state = _get_or_create_state(normalized.get("state_name"))

                project, created = _find_or_create_project(
                    normalized, source, ministry, sector, state
                )

                snapshot = ProjectSnapshot.objects.create(
                    project=project,
                    snapshot_date=today,
                    project_cost=normalized.get("original_cost"),
                    revised_cost=normalized.get("current_cost"),
                    expenditure=normalized.get("current_expenditure"),
                    physical_progress=normalized.get("current_progress"),
                    completion_date=(
                        normalized.get("current_completion_date")
                        or normalized.get("original_completion_date")
                    ),
                    source_status=normalized.get("source_status", ""),
                    source=source,
                    raw_record_hash=raw_hash,
                )

                changes = detect_changes(project, snapshot)
                for ch in changes:
                    if "COST" in ch.change_type:
                        cost_changes += 1
                    elif "PROGRESS" in ch.change_type:
                        progress_changes += 1
                    elif "DATE" in ch.change_type:
                        date_changes += 1

                _update_project_from_snapshot(
                    project, normalized, source, ministry=ministry, sector=sector, state=state
                )

                if created:
                    inserted += 1
                else:
                    updated += 1

            if run and (idx + 1) % 50 == 0:
                run.records_inserted = inserted
                run.records_updated = updated
                run.error_message = f"Synchronizing database records ({idx + 1}/{total_valid} processed - {inserted} new, {updated} updated, {unchanged} unchanged)..."
                run.save(update_fields=["records_inserted", "records_updated", "error_message"])

        except Exception as exc:
            logger.warning(f"Row processing error: {exc}", exc_info=True)
            rejected += 1

    # Log invalid records to quality review queue
    for raw_record, normalized, errors in invalid_records:
        ext_ref = normalized.get("source_match_key", "")[:50] or "Unidentified Record"
        DataQualityIssue.objects.create(
            ingestion_run=run,
            raw_record_ref=ext_ref,
            problem_description="; ".join(errors),
            raw_data=raw_record,
        )
        RawIngestionRecord.objects.create(
            ingestion_run=run,
            external_record_id=ext_ref,
            raw_payload=raw_record,
            content_hash=hashlib.sha256(str(sorted(raw_record.items())).encode()).hexdigest(),
            source_file=str(Path(resolved_file).name),
            was_accepted=False,
            rejection_reason="; ".join(errors),
        )
        rejected += 1

    # Finalize IngestionRun
    run.records_inserted = inserted
    run.records_updated = updated
    run.records_rejected = rejected
    run.status = (
        IngestionRun.Status.SUCCESS if rejected == 0
        else IngestionRun.Status.PARTIAL_SUCCESS
    )
    run.completed_at = timezone.now()
    run.save()

    source.last_successful_sync = timezone.now()
    source.save(update_fields=["last_successful_sync"])

    _log(
        f"Ingestion finalized: {inserted} new projects inserted, {updated} updated, "
        f"{unchanged} unchanged, {rejected} rejected/invalid. Run ID: #{run.id} ({run.status})"
    )

    return {
        "run": run,
        "records_found": len(raw_records),
        "inserted": inserted,
        "updated": updated,
        "unchanged": unchanged,
        "rejected": rejected,
        "cost_changes": cost_changes,
        "progress_changes": progress_changes,
        "date_changes": date_changes,
        "source_file": Path(resolved_file).name,
    }
