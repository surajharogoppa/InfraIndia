from django.contrib import admin
from .models import Project, ProjectSnapshot, ProjectChange


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "name", "external_project_id", "state", "sector",
        "ministry", "platform_status", "current_progress", "updated_at"
    ]
    list_filter = ["platform_status", "sector", "state", "ministry"]
    search_fields = ["name", "external_project_id", "contractor_name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ProjectSnapshot)
class ProjectSnapshotAdmin(admin.ModelAdmin):
    list_display = ["project", "snapshot_date", "physical_progress", "project_cost", "source_status"]
    list_filter = ["snapshot_date"]
    search_fields = ["project__name"]
    readonly_fields = ["created_at", "raw_record_hash"]


@admin.register(ProjectChange)
class ProjectChangeAdmin(admin.ModelAdmin):
    list_display = ["project", "change_type", "field_name", "old_value", "new_value", "detected_at"]
    list_filter = ["change_type"]
    search_fields = ["project__name"]
    readonly_fields = ["detected_at"]
