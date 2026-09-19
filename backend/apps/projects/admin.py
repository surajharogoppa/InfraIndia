from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import Project, ProjectSnapshot, ProjectChange


class ProjectSnapshotInline(admin.TabularInline):
    model = ProjectSnapshot
    extra = 0
    can_delete = False
    fields = [
        "snapshot_date",
        "physical_progress_display",
        "current_cost_crore_display",
        "expenditure_crore_display",
        "source_status",
    ]
    readonly_fields = [
        "snapshot_date",
        "physical_progress_display",
        "current_cost_crore_display",
        "expenditure_crore_display",
        "source_status",
    ]
    ordering = ["-snapshot_date"]
    show_change_link = True
    max_num = 12

    def physical_progress_display(self, obj):
        if obj.physical_progress is not None:
            return f"{obj.physical_progress:.2f}%"
        return "—"
    physical_progress_display.short_description = "Progress"

    def current_cost_crore_display(self, obj):
        cost = obj.current_cost or obj.project_cost
        if cost:
            return f"₹{cost / 10_000_000:,.2f} Cr"
        return "—"
    current_cost_crore_display.short_description = "Reported Cost"

    def expenditure_crore_display(self, obj):
        if obj.expenditure:
            return f"₹{obj.expenditure / 10_000_000:,.2f} Cr"
        return "—"
    expenditure_crore_display.short_description = "Expenditure"


class ProjectChangeInline(admin.TabularInline):
    model = ProjectChange
    extra = 0
    can_delete = False
    fields = ["change_type_badge", "field_name", "old_value", "new_value", "detected_at"]
    readonly_fields = ["change_type_badge", "field_name", "old_value", "new_value", "detected_at"]
    ordering = ["-detected_at"]
    show_change_link = True
    max_num = 15

    def change_type_badge(self, obj):
        colors = {
            "COST_OVERRUN": "#dc2626",
            "TIME_OVERRUN": "#d97706",
            "STATUS_CHANGE": "#2563eb",
            "PROGRESS_UPDATE": "#16a34a",
            "CONTRACTOR_CHANGE": "#7c3aed",
        }
        color = colors.get(obj.change_type, "#64748b")
        return format_html(
            '<span style="background: {}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_change_type_display(),
        )
    change_type_badge.short_description = "Change Type"


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "name_short",
        "external_project_id",
        "state",
        "sector",
        "ministry",
        "cost_crore_display",
        "progress_badge",
        "platform_status_badge",
        "updated_at",
    ]
    list_filter = ["platform_status", "sector", "state", "ministry"]
    search_fields = ["name", "external_project_id", "contractor_name", "description"]
    list_per_page = 50
    readonly_fields = [
        "created_at",
        "updated_at",
        "cost_crore_display",
        "expenditure_crore_display",
        "cost_overrun_crore_display",
    ]
    inlines = [ProjectSnapshotInline, ProjectChangeInline]

    fieldsets = (
        ("Project Identification", {
            "fields": ("name", "external_project_id", "description")
        }),
        ("Governance & Administrative Hierarchy", {
            "fields": ("ministry", "department", "organization", "sector")
        }),
        ("Geographic Location", {
            "fields": ("state", "district", "latitude", "longitude")
        }),
        ("Financials (Auto-Converted to Crores)", {
            "fields": (
                ("original_cost", "current_cost"),
                ("cost_crore_display", "expenditure_crore_display", "cost_overrun_crore_display"),
                "current_expenditure",
                "currency",
            )
        }),
        ("Schedules & Milestones", {
            "fields": (
                ("original_start_date", "current_start_date"),
                ("original_completion_date", "current_completion_date"),
            )
        }),
        ("Operational Status & Progress", {
            "fields": ("current_progress", "source_status", "platform_status")
        }),
        ("Audit Metadata", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def name_short(self, obj):
        name = obj.name or ""
        return name[:60] + ("..." if len(name) > 60 else "")
    name_short.short_description = "Project Name"

    def cost_crore_display(self, obj):
        if obj.current_cost:
            return f"₹{obj.current_cost / 10_000_000:,.2f} Cr"
        return "—"
    cost_crore_display.short_description = "Current Cost"

    def expenditure_crore_display(self, obj):
        if obj.current_expenditure:
            return f"₹{obj.current_expenditure / 10_000_000:,.2f} Cr"
        return "—"
    expenditure_crore_display.short_description = "Total Spend"

    def cost_overrun_crore_display(self, obj):
        if obj.current_cost and obj.original_cost:
            diff = obj.current_cost - obj.original_cost
            if diff > 0:
                diff_str = f"+₹{diff / 10_000_000:,.2f} Cr"
                return format_html(
                    '<span style="color: #dc2626; font-weight: 700;">{}</span>',
                    diff_str,
                )
            return mark_safe('<span style="color: #16a34a;">₹0 (On Budget)</span>')
        return "—"
    cost_overrun_crore_display.short_description = "Cost Overrun"

    def progress_badge(self, obj):
        if obj.current_progress is not None:
            val = float(obj.current_progress)
            color = "#16a34a" if val >= 75 else "#d97706" if val >= 40 else "#dc2626"
            val_str = f"{val:.1f}%"
            return format_html(
                '<span style="color: {}; font-weight: 700;">{}</span>',
                color,
                val_str,
            )
        return "—"
    progress_badge.short_description = "Progress"

    def platform_status_badge(self, obj):
        colors = {
            "ACTIVE": "#16a34a",
            "COMPLETED": "#2563eb",
            "PLANNED": "#d97706",
            "CLOSED": "#dc2626",
            "UNKNOWN": "#64748b",
        }
        color = colors.get(obj.platform_status, "#64748b")
        return format_html(
            '<span style="background: {}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.platform_status,
        )
    platform_status_badge.short_description = "Status"


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
