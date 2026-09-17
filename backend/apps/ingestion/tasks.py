"""
Celery tasks for data ingestion pipeline.
"""
import logging
from datetime import datetime, date
from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def run_ingestion(self, source_id: int, file_path: str = None):
    """
    Main ingestion task. Runs the full ETL pipeline for a given DataSource.

    Flow:
        Fetch → Parse → Normalize → Validate → Deduplicate
        → Store Snapshot → Change Detection → Update Project
    """
    from apps.sources.models import DataSource
    from apps.ingestion.models import IngestionRun, DataQualityIssue
    from apps.projects.models import Project, ProjectSnapshot
    from apps.locations.models import State, District
    from apps.organizations.models import Ministry, Department, Organization, Sector
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
        # Select connector based on source type
        connector = _get_connector(source, file_path)
        if connector is None:
            raise ValueError(f"No connector available for source type: {source.source_type}")

        # Fetch
        raw_data = connector.fetch()

        # Parse
        raw_records = list(connector.parse(raw_data))
        run.records_found = len(raw_records)
        run.save(update_fields=["records_found"])

        inserted = updated = rejected = 0
        today = date.today()

        for raw_record in raw_records:
            try:
                # Normalize
                normalized = connector.normalize(raw_record)

                # Validate
                is_valid, errors = connector.validate(normalized)
                if not is_valid:
                    DataQualityIssue.objects.create(
                        ingestion_run=run,
                        raw_record_ref=normalized.get("external_project_id", ""),
                        problem_description="; ".join(errors),
                        raw_data=raw_record,
                    )
                    rejected += 1
                    continue

                # Skip if duplicate raw hash already exists
                raw_hash = normalized.get("raw_record_hash", "")
                if raw_hash and ProjectSnapshot.objects.filter(raw_record_hash=raw_hash).exists():
                    continue

                with transaction.atomic():
                    # Resolve FK entities (get_or_create for all lookups)
                    ministry = _get_or_create_ministry(normalized.get("ministry_name"))
                    department = _get_or_create_department(normalized.get("department_name"), ministry)
                    organization = _get_or_create_organization(normalized.get("organization_name"), department)
                    sector = _get_or_create_sector(normalized.get("sector_name"))
                    state = _get_or_create_state(normalized.get("state_name"))
                    district = _get_or_create_district(normalized.get("district_name"), state)

                    # Find or create project (by external_project_id + source, fallback to name+state)
                    project, created = _find_or_create_project(
                        normalized, source, ministry, department, organization,
                        sector, state, district
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
                        completion_date=normalized.get("current_completion_date")
                                        or normalized.get("original_completion_date"),
                        source_status=normalized.get("source_status", ""),
                        source=source,
                        raw_record_hash=raw_hash,
                    )

                    # Change detection
                    detect_changes(project, snapshot)

                    # Update canonical project record with latest values
                    _update_project_from_snapshot(project, normalized, source)

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
        run.status = IngestionRun.Status.SUCCESS if rejected == 0 else IngestionRun.Status.PARTIAL_SUCCESS
        run.completed_at = datetime.now()
        run.save()

        source.last_successful_sync = datetime.now()
        source.save(update_fields=["last_successful_sync"])

        logger.info(
            f"Ingestion run {run.id} complete: "
            f"{inserted} inserted, {updated} updated, {rejected} rejected"
        )

    except Exception as exc:
        run.status = IngestionRun.Status.FAILED
        run.error_message = str(exc)
        run.completed_at = datetime.now()
        run.save()

        source.last_failed_sync = datetime.now()
        source.save(update_fields=["last_failed_sync"])

        logger.error(f"Ingestion run {run.id} FAILED: {exc}", exc_info=True)
        raise self.retry(exc=exc, countdown=60)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_connector(source, file_path=None):
    from apps.sources.models import DataSource
    from services.connectors.sample_csv.connector import SampleCSVConnector

    if source.source_type in (DataSource.SourceType.CSV, DataSource.SourceType.XLSX):
        if file_path:
            return SampleCSVConnector(file_path)
    return None


def _get_or_create_ministry(name: str | None):
    if not name:
        return None
    from apps.organizations.models import Ministry
    obj, _ = Ministry.objects.get_or_create(name=name.strip(), defaults={"short_name": ""})
    return obj


def _get_or_create_department(name: str | None, ministry):
    if not name:
        return None
    from apps.organizations.models import Department
    obj, _ = Department.objects.get_or_create(name=name.strip(), defaults={"ministry": ministry})
    return obj


def _get_or_create_organization(name: str | None, department):
    if not name:
        return None
    from apps.organizations.models import Organization
    obj, _ = Organization.objects.get_or_create(name=name.strip(), defaults={"department": department})
    return obj


def _get_or_create_sector(name: str | None):
    if not name:
        return None
    from apps.organizations.models import Sector
    obj, _ = Sector.objects.get_or_create(name=name.strip(), defaults={"description": ""})
    return obj


def _get_or_create_state(name: str | None):
    if not name:
        return None
    from apps.locations.models import State
    obj, _ = State.objects.get_or_create(name=name.strip(), defaults={"code": name.strip()[:10].upper()})
    return obj


def _get_or_create_district(name: str | None, state):
    if not name or not state:
        return None
    from apps.locations.models import District
    obj, _ = District.objects.get_or_create(name=name.strip(), state=state)
    return obj


def _find_or_create_project(normalized, source, ministry, department, organization, sector, state, district):
    from apps.projects.models import Project

    ext_id = normalized.get("external_project_id", "").strip()
    name = normalized.get("name", "").strip()

    # Try to find by external ID + source first
    if ext_id:
        project = Project.objects.filter(external_project_id=ext_id, source=source).first()
        if project:
            return project, False

    # Fallback: find by name + state (fuzzy match)
    if name and state:
        project = Project.objects.filter(name__iexact=name, state=state).first()
        if project:
            return project, False

    # Create new
    project = Project.objects.create(
        external_project_id=ext_id,
        name=name,
        ministry=ministry,
        department=department,
        organization=organization,
        sector=sector,
        state=state,
        district=district,
        source=source,
    )
    return project, True


def _update_project_from_snapshot(project, normalized, source):
    """Update the canonical Project record with the latest ingested values."""
    from apps.projects.models import Project

    fields_to_update = [
        "original_cost", "current_cost", "current_expenditure",
        "current_progress", "source_status",
        "original_start_date", "current_start_date",
        "original_completion_date", "current_completion_date",
        "contractor_name", "latitude", "longitude",
    ]

    updated_fields = []
    for field in fields_to_update:
        val = normalized.get(field)
        if val is not None:
            setattr(project, field, val)
            updated_fields.append(field)

    project.source = source
    updated_fields.append("source")
    project.updated_at  # touch
    project.save(update_fields=updated_fields + ["updated_at"])
