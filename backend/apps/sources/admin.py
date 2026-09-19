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
        inspect_url = reverse("admin:sources_datasource_change", args=[obj.id])
        run_url = reverse("admin:sources_datasource_run_ingestion_single", args=[obj.id])
        return format_html(
            '<div style="display: flex; gap: 6px; align-items: center;">'
            '<a class="button" href="{}" style="padding: 4px 8px; font-size: 11px; background: #2563eb; color: #fff; border-radius: 4px; text-decoration: none; font-weight: 600;">⚙ Inspect</a>'
            '<a class="button" href="{}" style="padding: 4px 8px; font-size: 11px; background: #059669; color: #fff; border-radius: 4px; text-decoration: none; font-weight: 600;" title="Fetch from internet & run sync">⚡ Run Ingestion</a>'
            '</div>',
            inspect_url,
            run_url,
        )
    trigger_button.short_description = "Actions"

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                "run-ingestion/",
                self.admin_site.admin_view(self.run_manual_ingestion_view),
                name="sources_datasource_run_ingestion",
            ),
            path(
                "<int:source_id>/run-ingestion/",
                self.admin_site.admin_view(self.run_manual_ingestion_view),
                name="sources_datasource_run_ingestion_single",
            ),
        ]
        return custom_urls + urls

    def run_manual_ingestion_view(self, request, source_id=None):
        import threading
        import logging
        from django.shortcuts import redirect
        from django.urls import reverse
        from apps.ingestion.services import sync_mospi_flash_report
        from apps.ingestion.models import IngestionRun

        target_source = None
        if source_id:
            try:
                target_source = DataSource.objects.get(id=source_id)
            except DataSource.DoesNotExist:
                self.message_user(request, f"DataSource #{source_id} not found.", messages.ERROR)
                return redirect("admin:sources_datasource_changelist")

        # Check if an ingestion is already running
        running_run = IngestionRun.objects.filter(status=IngestionRun.Status.RUNNING).first()
        if running_run:
            self.message_user(
                request,
                f"Ingestion Run #{running_run.id} is already in progress. Displaying live pipeline progress.",
                messages.INFO,
            )
            return redirect(reverse("admin:ingestion_ingestionrun_progress", args=[running_run.id]))

        if target_source is None:
            target_source = DataSource.objects.filter(name__icontains="paimana").first() or DataSource.objects.first()

        # Create IngestionRun record immediately
        new_run = IngestionRun.objects.create(
            source=target_source,
            status=IngestionRun.Status.RUNNING,
            error_message="Initializing pipeline and checking remote MoSPI server for latest publication asset...",
        )

        # Launch background worker thread to execute without blocking the HTTP request
        def _background_worker():
            try:
                sync_mospi_flash_report(source=target_source, auto_download=True, run=new_run)
            except Exception as exc:
                logging.getLogger(__name__).error(f"Background ingestion failed: {exc}", exc_info=True)

        worker_thread = threading.Thread(target=_background_worker, daemon=True)
        worker_thread.start()

        # Immediately navigate user to the live progress dashboard!
        return redirect(reverse("admin:ingestion_ingestionrun_progress", args=[new_run.id]))

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
        from apps.ingestion.services import sync_mospi_flash_report
        success_count = 0
        for source in queryset:
            try:
                res = sync_mospi_flash_report(source=source, auto_download=True)
                success_count += 1
                self.message_user(
                    request,
                    f"✓ Ingestion completed for {source.name}: {res['records_found']} records ({res['inserted']} new, {res['updated']} updated). Run #{res['run'].id}.",
                    messages.SUCCESS,
                )
            except Exception as e:
                self.message_user(request, f"Failed to run ingestion for {source.name}: {str(e)}", messages.ERROR)
