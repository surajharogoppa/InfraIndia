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
