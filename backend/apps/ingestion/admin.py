from django.contrib import admin
from .models import IngestionRun, DataQualityIssue


@admin.register(IngestionRun)
class IngestionRunAdmin(admin.ModelAdmin):
    list_display = ["id", "source", "status", "records_found", "records_inserted", "records_updated", "records_rejected", "started_at"]
    list_filter = ["status", "source"]
    readonly_fields = ["started_at", "completed_at"]


@admin.register(DataQualityIssue)
class DataQualityIssueAdmin(admin.ModelAdmin):
    list_display = ["id", "ingestion_run", "raw_record_ref", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["raw_record_ref", "problem_description"]
    readonly_fields = ["created_at"]
