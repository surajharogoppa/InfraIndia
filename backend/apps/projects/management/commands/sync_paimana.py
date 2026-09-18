"""
Management command: sync_paimana

Runs the complete MoSPI Flash Report ingestion pipeline synchronously.
Suitable for development, debugging, and manual monthly syncs.

Usage:
    # Sync from a local CSV (mirrors Flash Report columns)
    python manage.py sync_paimana --file data/raw/flash_reports/sample_flash_report_june_2026.csv

    # Sync from a real PDF Flash Report
    python manage.py sync_paimana --file path/to/flash_report_june_2026.pdf

    # Attempt auto-download of latest PDF from mospi.gov.in (best-effort)
    python manage.py sync_paimana --auto-download

Expected output:
    Starting MoSPI PAIMANA synchronization...
    Source: MoSPI Flash Report (PAIMANA)
    Fetching latest dataset...
    Records found: 30
    Normalizing...
    Valid records: 29
    Invalid records: 1
    Creating/updating projects...
    New projects: 5
    Updated projects: 24
    Unchanged: 0
    Cost changes: 2
    Progress changes: 8
    Completion date changes: 1
    Sync completed successfully.
"""
import logging
from pathlib import Path
from datetime import datetime

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Synchronize projects from MoSPI Flash Report (CSV or PDF)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            help="Path to Flash Report CSV or PDF file (absolute or relative to backend/).",
        )
        parser.add_argument(
            "--auto-download",
            action="store_true",
            default=False,
            help="Attempt to auto-download the latest Flash Report from mospi.gov.in.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Parse and normalize data but do NOT write to the database.",
        )

    def handle(self, *args, **options):
        # pyrefly: ignore [missing-import]
        from apps.sources.models import DataSource
        # pyrefly: ignore [missing-import]
        from apps.ingestion.models import IngestionRun, DataQualityIssue, RawIngestionRecord
        # pyrefly: ignore [missing-import]
        from apps.projects.models import Project, ProjectSnapshot
        # pyrefly: ignore [missing-import]
        from services.change_detection.detector import detect_changes
        # pyrefly: ignore [missing-import]
        from apps.ingestion.tasks import _get_connector
        from datetime import date
        import hashlib

        self.stdout.write(self.style.HTTP_INFO("\nStarting MoSPI PAIMANA synchronization..."))
        self.stdout.write(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}\n")

        # Resolve source
        try:
            source = DataSource.objects.get(name="MoSPI Flash Report (PAIMANA)")
        except DataSource.DoesNotExist:
            raise CommandError(
                "DataSource 'MoSPI Flash Report (PAIMANA)' not found.\n"
                "Run first:  python manage.py setup_sources"
            )

        self.stdout.write(f"Source: {source.name}")
        self.stdout.write(f"Organization: {source.organization}\n")

        # Resolve file path
        file_path = options.get("file")
        auto_download = options.get("auto_download")
        dry_run = options.get("dry_run")

        if not file_path and auto_download:
            self.stdout.write("Attempting auto-download from mospi.gov.in...")
            # pyrefly: ignore [missing-import]
            from services.connectors.mospi_flash_report.downloader import (
                try_download_latest_flash_report
            )
            raw_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / "data" / "raw" / "flash_reports"
            downloaded = try_download_latest_flash_report(raw_dir)
            if downloaded:
                file_path = str(downloaded)
                self.stdout.write(self.style.SUCCESS(f"Downloaded: {file_path}"))
            else:
                # Fall back to most recent local file
                if raw_dir.exists():
                    all_files = sorted(
                        list(raw_dir.glob("*.pdf")) + list(raw_dir.glob("*.csv")),
                        key=lambda f: f.stat().st_mtime,
                        reverse=True
                    )
                    if all_files:
                        file_path = str(all_files[0])
                        self.stdout.write(
                            self.style.WARNING(
                                f"Auto-download failed. Using most recent local file: {file_path}"
                            )
                        )
                    else:
                        raise CommandError(
                            "Auto-download failed and no local files found.\n"
                            "Please manually download from https://mospi.gov.in and use --file."
                        )
                else:
                    raise CommandError(
                        "Auto-download failed. Provide --file or place a file in "
                        "backend/data/raw/flash_reports/"
                    )

        if not file_path:
            raise CommandError(
                "No file specified. Use --file <path> or --auto-download.\n"
                "Example:\n"
                "  python manage.py sync_paimana --file data/raw/flash_reports/sample_flash_report_june_2026.csv"
            )

        # Resolve relative paths
        file_path = str(Path(file_path).resolve())
        if not Path(file_path).exists():
            raise CommandError(f"File not found: {file_path}")

        self.stdout.write(f"Data file: {file_path}")

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no database changes will be made.\n"))

        # Get connector
        connector = _get_connector(source, file_path)
        if connector is None:
            raise CommandError(f"No connector available for source: {source.name}")

        self.stdout.write("Fetching latest dataset...")
        raw_data = connector.fetch()

        self.stdout.write("Parsing...")
        raw_records = list(connector.parse(raw_data))
        self.stdout.write(f"Records found: {len(raw_records)}")

        if not raw_records:
            self.stdout.write(self.style.WARNING("No records found. Check file format."))
            return

        # Normalize and validate
        self.stdout.write("Normalizing...")
        valid_records = []
        invalid_records = []
        for raw_record in raw_records:
            normalized = connector.normalize(raw_record)
            is_valid, errors = connector.validate(normalized)
            if is_valid:
                valid_records.append((raw_record, normalized))
            else:
                invalid_records.append((raw_record, normalized, errors))

        self.stdout.write(f"Valid records: {len(valid_records)}")
        self.stdout.write(f"Invalid records: {len(invalid_records)}")
        for _, _, errors in invalid_records[:5]:  # Show first 5
            self.stdout.write(self.style.WARNING(f"  - {'; '.join(errors)}"))

        if dry_run:
            self.stdout.write(self.style.SUCCESS("\nDry run complete. No changes written."))
            return

        # Create ingestion run
        run = IngestionRun.objects.create(source=source)
        run.records_found = len(raw_records)
        run.save(update_fields=["records_found"])

        today = date.today()
        inserted = updated = rejected = unchanged = 0
        cost_changes = progress_changes = date_changes = 0

        self.stdout.write("\nCreating/updating projects...")

        for raw_record, normalized in valid_records:
            try:
                # Compute hash
                raw_str = str(sorted(raw_record.items()))
                content_hash = hashlib.sha256(raw_str.encode()).hexdigest()
                ext_id = normalized.get("source_match_key", "")[:50]

                # Store raw record
                RawIngestionRecord.objects.create(
                    ingestion_run=run,
                    external_record_id=ext_id,
                    raw_payload=raw_record,
                    content_hash=content_hash,
                    source_file=str(Path(file_path).name),
                    was_accepted=True,
                )

                # Dedup check
                raw_hash = normalized.get("raw_record_hash", "")
                if raw_hash and ProjectSnapshot.objects.filter(raw_record_hash=raw_hash).exists():
                    unchanged += 1
                    continue

                with transaction.atomic():
                    # pyrefly: ignore [missing-import]
                    from apps.ingestion.tasks import (
                        _get_or_create_ministry, _get_or_create_sector,
                        _get_or_create_state, _find_or_create_project,
                        _update_project_from_snapshot
                    )
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

                    _update_project_from_snapshot(project, normalized, source, ministry=ministry, sector=sector, state=state)

                    if created:
                        inserted += 1
                    else:
                        updated += 1

            except Exception as exc:
                logger.warning(f"Row error: {exc}", exc_info=True)
                rejected += 1

        # Log invalid records to DQ queue
        for raw_record, normalized, errors in invalid_records:
            DataQualityIssue.objects.create(
                ingestion_run=run,
                raw_record_ref=normalized.get("source_match_key", "")[:50],
                problem_description="; ".join(errors),
                raw_data=raw_record,
            )
            RawIngestionRecord.objects.create(
                ingestion_run=run,
                external_record_id=normalized.get("source_match_key", "")[:50],
                raw_payload=raw_record,
                content_hash=hashlib.sha256(str(sorted(raw_record.items())).encode()).hexdigest(),
                source_file=str(Path(file_path).name),
                was_accepted=False,
                rejection_reason="; ".join(errors),
            )
            rejected += 1

        # Finalize run
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

        # Print summary
        self.stdout.write("\n" + "-" * 50)
        self.stdout.write(f"New projects:       {inserted}")
        self.stdout.write(f"Updated projects:   {updated}")
        self.stdout.write(f"Unchanged:          {unchanged}")
        self.stdout.write(f"Invalid/Rejected:   {rejected}")
        self.stdout.write("\nChanges detected:")
        self.stdout.write(f"  Cost changes:           {cost_changes}")
        self.stdout.write(f"  Progress changes:       {progress_changes}")
        self.stdout.write(f"  Completion date changes: {date_changes}")
        self.stdout.write("-" * 50)

        if run.status == IngestionRun.Status.SUCCESS:
            self.stdout.write(self.style.SUCCESS(f"\nSync completed successfully. [Run ID: {run.id}]"))
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"\nSync completed with {rejected} rejected records. "
                    f"[Run ID: {run.id}]\n"
                    f"Review issues at: GET /api/ingestion/quality/?ingestion_run={run.id}"
                )
            )
