from django.db import models
from apps.sources.models import DataSource


class Document(models.Model):
    class DocumentType(models.TextChoices):
        FLASH_REPORT = "FLASH_REPORT", "Monthly Flash Report (PDF)"
        SUMMARY_SHEET = "SUMMARY_SHEET", "Summary Sheet"
        PROJECT_REPORT = "PROJECT_REPORT", "Detailed Project Report"
        DATA_EXPORT = "DATA_EXPORT", "Data Export"
        ANNEXURE = "ANNEXURE", "Statistical Annexure"
        OTHER = "OTHER", "Other Official Document"

    title = models.CharField(max_length=500)
    document_type = models.CharField(
        max_length=50,
        choices=DocumentType.choices,
        default=DocumentType.FLASH_REPORT,
    )
    file = models.FileField(upload_to="documents/%Y/%m/", blank=True, null=True)
    source_url = models.URLField(max_length=1000, blank=True)
    data_source = models.ForeignKey(
        DataSource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    ingestion_run = models.ForeignKey(
        "ingestion.IngestionRun",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    file_size_bytes = models.BigIntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def __str__(self):
        return f"{self.title} ({self.get_document_type_display()})"
