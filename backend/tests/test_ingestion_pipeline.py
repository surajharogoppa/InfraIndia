"""
Integration tests for the ingestion pipeline.
Tests: full pipeline run, idempotency, change detection, DQ queue.
"""
import tempfile
import os
from datetime import date
from django.test import TestCase
from apps.sources.models import DataSource
from apps.ingestion.models import IngestionRun, DataQualityIssue, RawIngestionRecord
from apps.projects.models import Project, ProjectSnapshot, ProjectChange
from apps.ingestion.tasks import run_ingestion

CRORE = 10_000_000

# Minimal Flash Report CSV for integration tests
BASE_CSV = """Name of Project,Ministry/Deptt.,Sector,State,Approved Cost (Rs Cr),Latest Revised Cost (Rs Cr),Cumm. Expenditure (Rs Cr),Date of Compl. (Orig.),Date of Compl. (Rev.),Physical Progress (%),Source Status
"Highway Test Project Alpha",Ministry of Road Transport & Highways,Roads,Maharashtra,500.00,550.00,420.00,Mar-2022,Sep-2024,76.0,Ongoing
"Power Station Beta",Ministry of Power,Power,Chhattisgarh,2500.00,2800.00,2100.00,Dec-2023,Jun-2025,75.0,Ongoing
"""

# Same projects with updated costs and progress
UPDATED_CSV = """Name of Project,Ministry/Deptt.,Sector,State,Approved Cost (Rs Cr),Latest Revised Cost (Rs Cr),Cumm. Expenditure (Rs Cr),Date of Compl. (Orig.),Date of Compl. (Rev.),Physical Progress (%),Source Status
"Highway Test Project Alpha",Ministry of Road Transport & Highways,Roads,Maharashtra,500.00,620.00,510.00,Mar-2022,Dec-2025,88.0,Ongoing
"Power Station Beta",Ministry of Power,Power,Chhattisgarh,2500.00,3200.00,2600.00,Dec-2023,Mar-2026,82.5,Ongoing
"""

INVALID_CSV = """Name of Project,Ministry/Deptt.,Sector,State,Approved Cost (Rs Cr),Latest Revised Cost (Rs Cr),Cumm. Expenditure (Rs Cr),Date of Compl. (Orig.),Date of Compl. (Rev.),Physical Progress (%),Source Status
"",Ministry of Power,Power,Chhattisgarh,-100.00,2800.00,2100.00,Dec-2023,Jun-2025,110.0,Ongoing
"""


def _write_temp_csv(content: str) -> str:
    """Write CSV content to a temp file and return path."""
    f = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8')
    f.write(content)
    f.close()
    return f.name


def _make_source():
    """Create or retrieve the PAIMANA DataSource."""
    source, _ = DataSource.objects.get_or_create(
        name="MoSPI Flash Report (PAIMANA)",
        defaults={
            "organization": "MoSPI IPMD",
            "source_type": DataSource.SourceType.CSV,
            "base_url": "https://mospi.gov.in",
            "access_method": DataSource.AccessMethod.SCHEDULED_DOWNLOAD,
            "update_frequency": "Monthly",
        }
    )
    return source


class FullPipelineTest(TestCase):
    """Test full ingestion from CSV through to database records."""

    def setUp(self):
        self.source = _make_source()
        self.csv_path = _write_temp_csv(BASE_CSV)

    def tearDown(self):
        os.unlink(self.csv_path)

    def test_creates_projects_on_first_run(self):
        initial_count = Project.objects.count()
        run_ingestion(self.source.id, self.csv_path)
        new_count = Project.objects.count()
        self.assertEqual(new_count - initial_count, 2)

    def test_creates_ingestion_run_record(self):
        run_ingestion(self.source.id, self.csv_path)
        runs = IngestionRun.objects.filter(source=self.source).order_by("-started_at")
        self.assertGreater(runs.count(), 0)
        latest_run = runs.first()
        self.assertEqual(latest_run.records_found, 2)
        self.assertIn(latest_run.status, [
            IngestionRun.Status.SUCCESS, IngestionRun.Status.PARTIAL_SUCCESS
        ])

    def test_creates_snapshots(self):
        run_ingestion(self.source.id, self.csv_path)
        snaps = ProjectSnapshot.objects.filter(source=self.source)
        self.assertGreaterEqual(snaps.count(), 2)

    def test_creates_raw_records(self):
        run_ingestion(self.source.id, self.csv_path)
        run = IngestionRun.objects.filter(source=self.source).latest("started_at")
        raw_records = RawIngestionRecord.objects.filter(ingestion_run=run)
        self.assertEqual(raw_records.count(), 2)
        # Both should be accepted
        self.assertEqual(raw_records.filter(was_accepted=True).count(), 2)

    def test_project_cost_stored_in_paise(self):
        run_ingestion(self.source.id, self.csv_path)
        project = Project.objects.filter(
            name="Highway Test Project Alpha", source=self.source
        ).first()
        self.assertIsNotNone(project)
        # 550 Cr = 550 * CRORE paise
        self.assertEqual(project.current_cost, 550 * CRORE)


class IdempotencyTest(TestCase):
    """Running the same ingestion twice must not create duplicate records."""

    def setUp(self):
        self.source = _make_source()
        self.csv_path = _write_temp_csv(BASE_CSV)

    def tearDown(self):
        os.unlink(self.csv_path)

    def test_no_duplicate_projects(self):
        run_ingestion(self.source.id, self.csv_path)
        count_after_first = Project.objects.filter(source=self.source).count()

        run_ingestion(self.source.id, self.csv_path)
        count_after_second = Project.objects.filter(source=self.source).count()

        self.assertEqual(count_after_first, count_after_second,
                         "Second run should not create new projects for identical data")

    def test_no_duplicate_snapshots(self):
        run_ingestion(self.source.id, self.csv_path)
        snaps_after_first = ProjectSnapshot.objects.filter(source=self.source).count()

        run_ingestion(self.source.id, self.csv_path)
        snaps_after_second = ProjectSnapshot.objects.filter(source=self.source).count()

        self.assertEqual(snaps_after_first, snaps_after_second,
                         "Second run with identical data should create 0 new snapshots")

    def test_second_run_records_unchanged(self):
        run_ingestion(self.source.id, self.csv_path)

        run_ingestion(self.source.id, self.csv_path)
        second_run = IngestionRun.objects.filter(source=self.source).order_by("-started_at").first()
        self.assertEqual(second_run.records_inserted, 0)
        self.assertEqual(second_run.records_updated, 0)
        self.assertEqual(second_run.records_rejected, 0)


class ChangeDetectionTest(TestCase):
    """Test that cost/progress/date changes are detected and stored."""

    def setUp(self):
        self.source = _make_source()
        self.base_path = _write_temp_csv(BASE_CSV)
        self.updated_path = _write_temp_csv(UPDATED_CSV)

    def tearDown(self):
        os.unlink(self.base_path)
        os.unlink(self.updated_path)

    def test_cost_change_detected(self):
        run_ingestion(self.source.id, self.base_path)
        run_ingestion(self.source.id, self.updated_path)

        changes = ProjectChange.objects.filter(
            change_type=ProjectChange.ChangeType.COST_CHANGED
        )
        self.assertGreater(changes.count(), 0,
                           "Cost change should be detected when revised cost increases")

    def test_progress_change_detected(self):
        run_ingestion(self.source.id, self.base_path)
        run_ingestion(self.source.id, self.updated_path)

        changes = ProjectChange.objects.filter(
            change_type=ProjectChange.ChangeType.PROGRESS_CHANGED
        )
        self.assertGreater(changes.count(), 0,
                           "Progress change should be detected")

    def test_completion_date_change_detected(self):
        run_ingestion(self.source.id, self.base_path)
        run_ingestion(self.source.id, self.updated_path)

        changes = ProjectChange.objects.filter(
            change_type=ProjectChange.ChangeType.COMPLETION_DATE_CHANGED
        )
        self.assertGreater(changes.count(), 0,
                           "Completion date change should be detected")

    def test_change_stores_old_and_new_values(self):
        run_ingestion(self.source.id, self.base_path)
        run_ingestion(self.source.id, self.updated_path)

        change = ProjectChange.objects.filter(
            change_type=ProjectChange.ChangeType.COST_CHANGED
        ).first()
        if change:
            self.assertNotEqual(change.old_value, change.new_value)

    def test_no_changes_when_same_data(self):
        run_ingestion(self.source.id, self.base_path)
        changes_before = ProjectChange.objects.count()

        run_ingestion(self.source.id, self.base_path)
        changes_after = ProjectChange.objects.count()

        self.assertEqual(changes_before, changes_after,
                         "No new changes should be detected when data is identical")


class DataQualityQueueTest(TestCase):
    """Test that invalid records go to the DQ queue, not the project table."""

    def setUp(self):
        self.source = _make_source()
        self.invalid_path = _write_temp_csv(INVALID_CSV)

    def tearDown(self):
        os.unlink(self.invalid_path)

    def test_invalid_record_not_saved_as_project(self):
        initial_count = Project.objects.filter(source=self.source).count()
        run_ingestion(self.source.id, self.invalid_path)
        final_count = Project.objects.filter(source=self.source).count()
        self.assertEqual(initial_count, final_count,
                         "Invalid records should not be saved as projects")

    def test_invalid_record_creates_dq_issue(self):
        run_ingestion(self.source.id, self.invalid_path)
        run = IngestionRun.objects.filter(source=self.source).latest("started_at")
        issues = DataQualityIssue.objects.filter(ingestion_run=run)
        self.assertGreater(issues.count(), 0,
                           "Invalid record should create a DataQualityIssue")

    def test_invalid_record_has_rejection_reason(self):
        run_ingestion(self.source.id, self.invalid_path)
        run = IngestionRun.objects.filter(source=self.source).latest("started_at")
        issue = DataQualityIssue.objects.filter(ingestion_run=run).first()
        if issue:
            self.assertTrue(len(issue.problem_description) > 0)
