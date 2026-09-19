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
        from apps.ingestion.services import sync_mospi_flash_report

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

        file_path = options.get("file")
        auto_download = options.get("auto_download")
        dry_run = options.get("dry_run")

        if not file_path and not auto_download:
            raise CommandError(
                "No file specified. Use --file <path> or --auto-download.\n"
                "Example:\n"
                "  python manage.py sync_paimana --auto-download"
            )

        def log_cb(msg, level="info"):
            if level == "error":
                self.stdout.write(self.style.ERROR(msg))
            elif level == "warning":
                self.stdout.write(self.style.WARNING(msg))
            elif "Success" in msg or "Downloaded" in msg:
                self.stdout.write(self.style.SUCCESS(msg))
            else:
                self.stdout.write(msg)

        try:
            res = sync_mospi_flash_report(
                source=source,
                file_path=file_path,
                auto_download=auto_download,
                dry_run=dry_run,
                log_func=log_cb,
            )
        except Exception as e:
            raise CommandError(f"Synchronization failed: {e}")

        # Summary
        self.stdout.write("\n" + "-" * 50)
        self.stdout.write(f"Records discovered: {res['records_found']}")
        self.stdout.write(f"New projects:       {res['inserted']}")
        self.stdout.write(f"Updated projects:   {res['updated']}")
        self.stdout.write(f"Unchanged:          {res['unchanged']}")
        self.stdout.write(f"Invalid/Rejected:   {res['rejected']}")
        self.stdout.write("\nChanges detected:")
        self.stdout.write(f"  Cost changes:           {res['cost_changes']}")
        self.stdout.write(f"  Progress changes:       {res['progress_changes']}")
        self.stdout.write(f"  Completion date changes: {res['date_changes']}")
        self.stdout.write("-" * 50)

        if dry_run:
            self.stdout.write(self.style.SUCCESS("\nDry run complete. No changes written."))
        elif res["rejected"] == 0:
            self.stdout.write(self.style.SUCCESS(f"\nSync completed successfully. [Run ID: #{res['run'].id}]"))
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"\nSync completed with {res['rejected']} rejected records. "
                    f"[Run ID: #{res['run'].id}]\n"
                    f"Review issues in Django Admin Quality Queue."
                )
            )
