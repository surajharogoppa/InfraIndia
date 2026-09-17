from django.db import models


class DataSource(models.Model):
    class SourceType(models.TextChoices):
        CSV = "CSV", "CSV"
        XLSX = "XLSX", "XLSX"
        JSON = "JSON", "JSON"
        XML = "XML", "XML"
        API = "API", "API"
        PDF = "PDF", "PDF"
        WEB = "WEB", "Web"

    class AccessMethod(models.TextChoices):
        MANUAL_UPLOAD = "MANUAL_UPLOAD", "Manual Upload"
        SCHEDULED_DOWNLOAD = "SCHEDULED_DOWNLOAD", "Scheduled Download"
        API_PULL = "API_PULL", "API Pull"

    name = models.CharField(max_length=255, unique=True)
    organization = models.CharField(max_length=255)
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    base_url = models.URLField(blank=True)
    access_method = models.CharField(max_length=30, choices=AccessMethod.choices)
    update_frequency = models.CharField(max_length=100, blank=True, help_text="e.g. Monthly, Quarterly")
    notes = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)
    last_successful_sync = models.DateTimeField(null=True, blank=True)
    last_failed_sync = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.organization})"
