from django.db import models
from apps.sources.models import DataSource


class IngestionRun(models.Model):
    class Status(models.TextChoices):
        RUNNING = "RUNNING", "Running"
        SUCCESS = "SUCCESS", "Success"
        PARTIAL_SUCCESS = "PARTIAL_SUCCESS", "Partial Success"
        FAILED = "FAILED", "Failed"

    source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name="ingestion_runs")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RUNNING)

    records_found = models.IntegerField(default=0)
    records_inserted = models.IntegerField(default=0)
    records_updated = models.IntegerField(default=0)
    records_rejected = models.IntegerField(default=0)

    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"IngestionRun {self.id} [{self.status}] for {self.source}"


class DataQualityIssue(models.Model):
    class IssueStatus(models.TextChoices):
        PENDING = "PENDING", "Needs Review"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        CORRECTED = "CORRECTED", "Corrected"
        DUPLICATE = "DUPLICATE", "Marked Duplicate"

    ingestion_run = models.ForeignKey(
        IngestionRun, on_delete=models.CASCADE, related_name="quality_issues"
    )
    raw_record_ref = models.CharField(max_length=255, blank=True)
    problem_description = models.TextField()
    raw_data = models.JSONField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=IssueStatus.choices, default=IssueStatus.PENDING)
    admin_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"QualityIssue {self.id} [{self.status}]: {self.problem_description[:60]}"


class RawIngestionRecord(models.Model):
    """
    Immutable raw record captured directly from source before normalization.
    Enables debugging when source formats change.
    One record per row/project in the source file.
    """
    ingestion_run = models.ForeignKey(
        IngestionRun, on_delete=models.CASCADE, related_name="raw_records"
    )
    # External identifier from source (may be project name hash if no ID available)
    external_record_id = models.CharField(max_length=255, blank=True, db_index=True)
    # Original parsed row as received from source (before any normalization)
    raw_payload = models.JSONField(help_text="Original source row dict, pre-normalization")
    # SHA-256 hash of raw_payload for deduplication across runs
    content_hash = models.CharField(max_length=64, db_index=True)
    # Source file name for traceability
    source_file = models.CharField(max_length=500, blank=True)
    # Processing outcome
    was_accepted = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_hash"]),
            models.Index(fields=["ingestion_run", "external_record_id"]),
        ]

    def __str__(self):
        return f"RawRecord {self.id} [{self.external_record_id}] run={self.ingestion_run_id}"
