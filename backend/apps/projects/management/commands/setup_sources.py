"""
Management command: setup_sources

Seeds the DataSource registry with all known government data sources.
Safe to run multiple times — uses get_or_create.

Usage:
    python manage.py setup_sources
"""
from django.core.management.base import BaseCommand
from apps.sources.models import DataSource


SOURCES = [
    {
        "name": "MoSPI Flash Report (PAIMANA)",
        "organization": "Ministry of Statistics and Programme Implementation (MoSPI), IPMD",
        "source_type": DataSource.SourceType.PDF,
        "base_url": "https://mospi.gov.in",
        "access_method": DataSource.AccessMethod.SCHEDULED_DOWNLOAD,
        "update_frequency": "Monthly",
        "notes": (
            "Monthly Flash Report on Central Sector Infrastructure Projects (≥ ₹150 Cr). "
            "Published by MoSPI/IPMD as PDF. "
            "ipm.mospi.gov.in (PAIMANA) requires government login — not publicly accessible. "
            "Flash Reports are the only verified public access mechanism. "
            "Fields available: Project Name, Ministry, Sector, State, Approved Cost, "
            "Revised Cost, Expenditure, Original Completion Date, Revised Completion Date, Status. "
            "No stable external Project ID in public PDFs — composite name+ministry+state hash used."
        ),
        "is_active": True,
    },
    {
        "name": "Sample CSV (Demo)",
        "organization": "GovProject Platform (Internal)",
        "source_type": DataSource.SourceType.CSV,
        "base_url": "",
        "access_method": DataSource.AccessMethod.MANUAL_UPLOAD,
        "update_frequency": "On demand",
        "notes": "Demo/development data source. Uses CSV files in data/raw/ directory.",
        "is_active": False,  # Inactive by default — for dev use only
    },
]


class Command(BaseCommand):
    help = "Seed the DataSource registry with known government data sources."

    def handle(self, *args, **options):
        self.stdout.write("Setting up data source registry...\n")
        created_count = 0
        updated_count = 0

        for source_data in SOURCES:
            obj, created = DataSource.objects.get_or_create(
                name=source_data["name"],
                defaults=source_data,
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  [CREATED] {obj.name}")
                )
            else:
                # Update non-identifying fields if they've changed
                changed = False
                for field, value in source_data.items():
                    if field == "name":
                        continue
                    if getattr(obj, field) != value:
                        setattr(obj, field, value)
                        changed = True
                if changed:
                    obj.save()
                    updated_count += 1
                    self.stdout.write(f"  [UPDATED] {obj.name}")
                else:
                    self.stdout.write(f"  [EXISTS]  {obj.name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Created: {created_count}, Updated: {updated_count}"
            )
        )
        self.stdout.write(
            "\nTo run a manual sync:\n"
            "  python manage.py sync_paimana --file data/raw/flash_reports/sample_flash_report_june_2026.csv\n"
        )
