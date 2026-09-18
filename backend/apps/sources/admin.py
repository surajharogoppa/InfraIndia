from django.contrib import admin, messages
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.urls import reverse
from .models import DataSource
from apps.ingestion.models import IngestionRun


class IngestionRunInline(admin.TabularInline):
    model = IngestionRun
    extra = 0
    can_delete = False
    fields = ["id", "status_badge", "started_at", "completed_at", "records_found", "records_inserted", "records_updated", "records_rejected"]
    readonly_fields = ["id", "status_badge", "started_at", "completed_at", "records_found", "records_inserted", "records_updated", "records_rejected"]
    ordering = ["-started_at"]
    show_change_link = True
    max_num = 10

    def status_badge(self, obj):
        colors = {
            "SUCCESS": "#16a34a",
            "FAILED": "#dc2626",
            "RUNNING": "#2563eb",
            "PARTIAL_SUCCESS": "#d97706",
        }
        color = colors.get(obj.status, "#64748b")
        return format_html(
            '<span style="background: {}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.status,
        )
    status_badge.short_description = "Status"


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "organization",
        "source_type_badge",
        "access_method",
        "update_frequency",
        "is_active_toggle",
        "last_sync_display",
        "trigger_button",
    ]
    list_filter = ["is_active", "source_type", "access_method", "update_frequency"]
    search_fields = ["name", "organization", "base_url"]
    readonly_fields = ["created_at", "updated_at", "last_successful_sync", "last_failed_sync"]
    actions = ["enable_selected_sources", "disable_selected_sources", "trigger_ingestion_for_sources"]
    inlines = [IngestionRunInline]

    fieldsets = (
        ("Core Identity", {
            "fields": ("name", "organization", "source_type", "base_url")
        }),
        ("Ingestion Cadence & Method", {
            "fields": ("access_method", "update_frequency", "notes")
        }),
        ("Operational Status", {
            "fields": ("is_active",)
        }),
        ("Synchronization History", {
            "fields": ("last_successful_sync", "last_failed_sync", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def source_type_badge(self, obj):
        colors = {
            "PDF": "#dc2626",
            "CSV": "#059669",
            "XLSX": "#16a34a",
            "JSON": "#d97706",
            "XML": "#0284c7",
            "API": "#7c3aed",
            "WEB": "#0891b2",
        }
        color = colors.get(obj.source_type, "#475569")
        return format_html(
            '<span style="background: {}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.source_type,
        )
    source_type_badge.short_description = "Type"

    def is_active_toggle(self, obj):
        if obj.is_active:
            return mark_safe(
                '<span style="color: #16a34a; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">'
                '● Active</span>'
            )
        return mark_safe(
            '<span style="color: #94a3b8; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">'
            '○ Disabled</span>'
        )
    is_active_toggle.short_description = "Status"

    def last_sync_display(self, obj):
        if obj.last_successful_sync:
            return format_html(
                '<span style="font-size: 12px; color: #16a34a; font-weight: 600;">✓ {}</span>',
                obj.last_successful_sync.strftime("%d %b %Y, %H:%M"),
            )
        if obj.last_failed_sync:
            return format_html(
                '<span style="font-size: 12px; color: #dc2626; font-weight: 600;">✕ {}</span>',
                obj.last_failed_sync.strftime("%d %b %Y, %H:%M"),
            )
        return mark_safe('<span style="color: #94a3b8;">Never</span>')
    last_sync_display.short_description = "Last Sync"

    def trigger_button(self, obj):
        url = reverse("admin:sources_datasource_change", args=[obj.id])
        return format_html(
            '<a class="button" href="{}" style="padding: 3px 8px; font-size: 11px; background: #2563eb; color: #fff; border-radius: 4px; text-decoration: none;">⚙ Inspect / Edit</a>',
            url
        )
    trigger_button.short_description = "Controls"

    @admin.action(description="✓ Enable selected data sources")
    def enable_selected_sources(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Successfully activated {updated} data source(s).", messages.SUCCESS)

    @admin.action(description="✕ Disable selected data sources")
    def disable_selected_sources(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Successfully deactivated {updated} data source(s).", messages.WARNING)

    @admin.action(description="⚡ Trigger Manual Ingestion for selected sources")
    def trigger_ingestion_for_sources(self, request, queryset):
        from apps.ingestion.tasks import run_ingestion
        triggered = 0
        for source in queryset:
            try:
                run_ingestion.delay(source.id)
                triggered += 1
            except Exception:
                # Fallback to direct synchronous execution if Celery broker is unavailable
                try:
                    run_ingestion(source.id)
                    triggered += 1
                except Exception as e:
                    self.message_user(request, f"Failed to run ingestion for {source.name}: {str(e)}", messages.ERROR)
        if triggered > 0:
            self.message_user(
                request,
                f"Ingestion triggered for {triggered} source(s). Inspect progress in Ingestion Runs.",
                messages.SUCCESS,
            )
