from django.db import models
from apps.locations.models import State, District
from apps.organizations.models import Ministry, Department, Organization, Sector
from apps.sources.models import DataSource


class Project(models.Model):
    """
    Canonical project record. Updated on each ingestion run.
    Historical data lives in ProjectSnapshot + ProjectChange.
    """

    class PlatformStatus(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        CLOSED = "CLOSED", "Closed"
        UNKNOWN = "UNKNOWN", "Unknown"

    # Identifiers
    external_project_id = models.CharField(max_length=255, blank=True, db_index=True)
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)

    # Organization
    ministry = models.ForeignKey(Ministry, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    sector = models.ForeignKey(Sector, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")

    # Location
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Financial — stored as integer paise (1 Crore = 10,000,000 paise)
    # Display helpers in serializer convert to Crore
    original_cost = models.BigIntegerField(null=True, blank=True, help_text="Original project cost in paise")
    current_cost = models.BigIntegerField(null=True, blank=True, help_text="Current/revised project cost in paise")
    currency = models.CharField(max_length=10, default="INR")

    # Expenditure
    current_expenditure = models.BigIntegerField(null=True, blank=True, help_text="Cumulative expenditure in paise")

    # Timeline
    original_start_date = models.DateField(null=True, blank=True)
    current_start_date = models.DateField(null=True, blank=True)
    original_completion_date = models.DateField(null=True, blank=True)
    current_completion_date = models.DateField(null=True, blank=True)

    # Progress (0–100)
    current_progress = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Status
    source_status = models.CharField(max_length=255, blank=True, help_text="Status as reported by source")
    platform_status = models.CharField(
        max_length=20, choices=PlatformStatus.choices,
        default=PlatformStatus.UNKNOWN
    )

    # Contractor
    contractor_name = models.CharField(max_length=500, blank=True)

    # Source tracking
    source = models.ForeignKey(DataSource, on_delete=models.SET_NULL, null=True, blank=True)
    source_url = models.URLField(blank=True)
    source_updated_date = models.DateField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["state"]),
            models.Index(fields=["sector"]),
            models.Index(fields=["ministry"]),
            models.Index(fields=["platform_status"]),
            models.Index(fields=["current_progress"]),
            models.Index(fields=["current_cost"]),
        ]

    def __str__(self):
        return self.name

    # ── Platform-derived helpers ─────────────────────────────────────────────

    @property
    def cost_change_pct(self):
        """Platform-calculated cost change percentage."""
        if self.original_cost and self.current_cost and self.original_cost != 0:
            return round((self.current_cost - self.original_cost) / self.original_cost * 100, 2)
        return None

    @property
    def expenditure_ratio(self):
        """Platform-calculated expenditure ratio (expenditure / current cost)."""
        if self.current_expenditure and self.current_cost and self.current_cost != 0:
            return round(self.current_expenditure / self.current_cost * 100, 2)
        return None

    @property
    def schedule_delay_months(self):
        """Platform-calculated schedule difference in months."""
        if self.original_completion_date and self.current_completion_date:
            delta = (
                (self.current_completion_date.year - self.original_completion_date.year) * 12
                + self.current_completion_date.month - self.original_completion_date.month
            )
            return delta
        return None


class ProjectSnapshot(models.Model):
    """
    Immutable historical record of a project's reported values at a point in time.
    Never overwritten — only appended.
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="snapshots")
    snapshot_date = models.DateField()

    # Financial
    project_cost = models.BigIntegerField(null=True, blank=True)
    revised_cost = models.BigIntegerField(null=True, blank=True)
    expenditure = models.BigIntegerField(null=True, blank=True)

    # Progress
    physical_progress = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Timeline
    start_date = models.DateField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)

    # Status (source-reported)
    source_status = models.CharField(max_length=255, blank=True)

    # Source
    source = models.ForeignKey(DataSource, on_delete=models.SET_NULL, null=True, blank=True)
    raw_record_hash = models.CharField(max_length=64, blank=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-snapshot_date"]
        indexes = [
            models.Index(fields=["project", "snapshot_date"]),
            models.Index(fields=["raw_record_hash"]),
        ]

    def __str__(self):
        return f"Snapshot {self.project_id} @ {self.snapshot_date}"


class ProjectChange(models.Model):
    """
    Change event detected between two consecutive snapshots.
    """

    class ChangeType(models.TextChoices):
        COST_CHANGED = "COST_CHANGED", "Cost Changed"
        PROGRESS_CHANGED = "PROGRESS_CHANGED", "Progress Changed"
        EXPENDITURE_CHANGED = "EXPENDITURE_CHANGED", "Expenditure Changed"
        COMPLETION_DATE_CHANGED = "COMPLETION_DATE_CHANGED", "Completion Date Changed"
        START_DATE_CHANGED = "START_DATE_CHANGED", "Start Date Changed"
        STATUS_CHANGED = "STATUS_CHANGED", "Status Changed"
        OTHER_FIELD_CHANGED = "OTHER_FIELD_CHANGED", "Other Field Changed"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="changes")
    snapshot = models.ForeignKey(
        ProjectSnapshot, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="changes"
    )

    change_type = models.CharField(max_length=40, choices=ChangeType.choices)
    field_name = models.CharField(max_length=100)

    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)

    change_amount = models.FloatField(null=True, blank=True)
    change_percentage = models.FloatField(null=True, blank=True)

    detected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-detected_at"]
        indexes = [
            models.Index(fields=["project", "change_type"]),
            models.Index(fields=["detected_at"]),
        ]

    def __str__(self):
        return f"{self.change_type} on {self.project_id} @ {self.detected_at:%Y-%m-%d}"
