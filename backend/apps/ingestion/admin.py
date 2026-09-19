import json
from django.contrib import admin, messages
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils import timezone
from .models import IngestionRun, DataQualityIssue, RawIngestionRecord


class DataQualityIssueInline(admin.TabularInline):
    model = DataQualityIssue
    extra = 0
    fields = ["id", "raw_record_ref", "problem_description", "status", "created_at"]
    readonly_fields = ["id", "raw_record_ref", "problem_description", "created_at"]
    ordering = ["-created_at"]
    show_change_link = True
    max_num = 15


class RawIngestionRecordInline(admin.TabularInline):
    model = RawIngestionRecord
    extra = 0
    can_delete = False
    fields = ["id", "external_record_id", "source_file", "was_accepted", "rejection_reason", "created_at"]
    readonly_fields = ["id", "external_record_id", "source_file", "was_accepted", "rejection_reason", "created_at"]
    ordering = ["-created_at"]
    show_change_link = True
    max_num = 10


@admin.register(IngestionRun)
class IngestionRunAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "source",
        "status_badge",
        "records_found",
        "records_inserted",
        "records_updated",
        "records_rejected_display",
        "duration_display",
        "started_at",
    ]
    list_filter = ["status", "source", "started_at"]
    search_fields = ["source__name", "error_message"]
    readonly_fields = [
        "started_at",
        "completed_at",
        "duration_display",
        "error_inspection",
        "records_found",
        "records_inserted",
        "records_updated",
        "records_rejected",
    ]
    actions = ["rerun_selected_ingestions"]
    inlines = [DataQualityIssueInline, RawIngestionRecordInline]

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:run_id>/progress/",
                self.admin_site.admin_view(self.live_progress_view),
                name="ingestion_ingestionrun_progress",
            ),
            path(
                "<int:run_id>/status-json/",
                self.admin_site.admin_view(self.status_json_view),
                name="ingestion_ingestionrun_status_json",
            ),
        ]
        return custom_urls + urls

    def live_progress_view(self, request, run_id):
        from django.shortcuts import get_object_or_404, render
        run = get_object_or_404(IngestionRun, id=run_id)
        context = {
            **self.admin_site.each_context(request),
            "run": run,
            "title": f"Ingestion Run #{run.id} Live Pipeline",
        }
        return render(request, "admin/ingestion/progress.html", context)

    def status_json_view(self, request, run_id):
        from django.http import JsonResponse
        from django.shortcuts import get_object_or_404
        run = get_object_or_404(IngestionRun, id=run_id)
        return JsonResponse({
            "id": run.id,
            "status": run.status,
            "records_found": run.records_found,
            "records_inserted": run.records_inserted,
            "records_updated": run.records_updated,
            "records_rejected": run.records_rejected,
            "message": run.error_message,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        })

    fieldsets = (
        ("Execution Status", {
            "fields": ("source", "status", "started_at", "completed_at", "duration_display")
        }),
        ("Record Processing Metrics", {
            "fields": ("records_found", "records_inserted", "records_updated", "records_rejected")
        }),
        ("Error & Failure Inspection", {
            "fields": ("error_inspection",),
            "classes": ("collapse",)
        }),
    )

    def status_badge(self, obj):
        colors = {
            "SUCCESS": "#16a34a",
            "FAILED": "#dc2626",
            "RUNNING": "#2563eb",
            "PARTIAL_SUCCESS": "#d97706",
        }
        color = colors.get(obj.status, "#64748b")
        return format_html(
            '<span style="background: {}; color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">{}</span>',
            color,
            obj.status,
        )
    status_badge.short_description = "Status"

    def records_rejected_display(self, obj):
        if obj.records_rejected > 0:
            return format_html(
                '<span style="color: #dc2626; font-weight: 700;">⚠ {}</span>',
                obj.records_rejected,
            )
        return "0"
    records_rejected_display.short_description = "Rejected"

    def duration_display(self, obj):
        if obj.started_at and obj.completed_at:
            seconds = int((obj.completed_at - obj.started_at).total_seconds())
            if seconds < 60:
                return f"{seconds}s"
            mins = seconds // 60
            secs = seconds % 60
            return f"{mins}m {secs}s"
        if obj.status == "RUNNING":
            return mark_safe('<span style="color: #2563eb; font-style: italic;">In progress...</span>')
        return "—"
    duration_display.short_description = "Duration"

    def error_inspection(self, obj):
        if obj.error_message:
            return format_html(
                '<div style="background: #fef2f2; border: 1px solid #f87171; border-left: 4px solid #dc2626; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #991b1b; white-space: pre-wrap;">{}</div>',
                obj.error_message,
            )
        return mark_safe('<span style="color: #16a34a;">✓ No execution errors recorded</span>')
    error_inspection.short_description = "Failure Details & Diagnostics"

    @admin.action(description="⚡ Rerun selected ingestion runs")
    def rerun_selected_ingestions(self, request, queryset):
        from apps.ingestion.tasks import run_ingestion
        triggered = 0
        for run in queryset:
            try:
                run_ingestion.delay(run.source_id)
                triggered += 1
            except Exception:
                try:
                    run_ingestion(run.source_id)
                    triggered += 1
                except Exception as e:
                    self.message_user(request, f"Failed to rerun ingestion: {str(e)}", messages.ERROR)
        if triggered > 0:
            self.message_user(request, f"Triggered rerun for {triggered} ingestion run(s).", messages.SUCCESS)


@admin.register(DataQualityIssue)
class DataQualityIssueAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "ingestion_run",
        "raw_record_ref",
        "problem_description_short",
        "status_badge",
        "created_at",
        "resolved_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["raw_record_ref", "problem_description", "admin_notes"]
    readonly_fields = ["created_at", "resolved_at", "raw_data_formatted"]
    actions = ["mark_as_accepted", "mark_as_rejected", "mark_as_duplicate", "mark_as_corrected"]

    fieldsets = (
        ("Issue Overview", {
            "fields": ("ingestion_run", "raw_record_ref", "status", "problem_description")
        }),
        ("Resolution & Notes", {
            "fields": ("admin_notes", "created_at", "resolved_at")
        }),
        ("Source Payload Inspection", {
            "fields": ("raw_data_formatted",),
            "classes": ("collapse",)
        }),
    )

    def problem_description_short(self, obj):
        desc = obj.problem_description or ""
        return desc[:80] + ("..." if len(desc) > 80 else "")
    problem_description_short.short_description = "Problem Description"

    def status_badge(self, obj):
        colors = {
            "PENDING": "#d97706",
            "ACCEPTED": "#16a34a",
            "REJECTED": "#dc2626",
            "CORRECTED": "#0284c7",
            "DUPLICATE": "#64748b",
        }
        color = colors.get(obj.status, "#64748b")
        return format_html(
            '<span style="background: {}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_status_display(),
        )
    status_badge.short_description = "Review Status"

    def raw_data_formatted(self, obj):
        if obj.raw_data:
            formatted = json.dumps(obj.raw_data, indent=2)
            return format_html(
                '<pre style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px; font-size: 12px; max-height: 400px; overflow-y: auto;">{}</pre>',
                formatted,
            )
        return "—"
    raw_data_formatted.short_description = "Raw Source Payload"

    @admin.action(description="✓ Accept selected issues (override quality check)")
    def mark_as_accepted(self, request, queryset):
        queryset.update(status="ACCEPTED", resolved_at=timezone.now())
        self.message_user(request, "Selected issues marked as ACCEPTED.", messages.SUCCESS)

    @admin.action(description="✕ Reject selected records (exclude from dataset)")
    def mark_as_rejected(self, request, queryset):
        queryset.update(status="REJECTED", resolved_at=timezone.now())
        self.message_user(request, "Selected issues marked as REJECTED.", messages.WARNING)

    @admin.action(description="⊜ Mark selected issues as DUPLICATE")
    def mark_as_duplicate(self, request, queryset):
        queryset.update(status="DUPLICATE", resolved_at=timezone.now())
        self.message_user(request, "Selected issues marked as DUPLICATE.", messages.INFO)

    @admin.action(description="✎ Mark selected issues as CORRECTED")
    def mark_as_corrected(self, request, queryset):
        queryset.update(status="CORRECTED", resolved_at=timezone.now())
        self.message_user(request, "Selected issues marked as CORRECTED.", messages.SUCCESS)


@admin.register(RawIngestionRecord)
class RawIngestionRecordAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "external_record_id",
        "ingestion_run",
        "source_file",
        "was_accepted",
        "content_hash_short",
        "created_at",
    ]
    list_filter = ["was_accepted", "created_at"]
    search_fields = ["external_record_id", "content_hash", "source_file", "rejection_reason"]
    readonly_fields = ["created_at", "content_hash", "raw_payload_formatted"]

    def content_hash_short(self, obj):
        return (obj.content_hash or "")[:12] + "..."
    content_hash_short.short_description = "Hash"

    def raw_payload_formatted(self, obj):
        if obj.raw_payload:
            formatted = json.dumps(obj.raw_payload, indent=2)
            return format_html(
                '<pre style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px; font-size: 12px; max-height: 400px; overflow-y: auto;">{}</pre>',
                formatted,
            )
        return "—"
    raw_payload_formatted.short_description = "Raw Payload"
