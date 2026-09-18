from django.contrib import admin
from django.utils.html import format_html
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "document_type_badge",
        "data_source",
        "project",
        "file_link",
        "file_size_display",
        "created_at",
    ]
    list_filter = ["document_type", "data_source", "created_at"]
    search_fields = ["title", "project__name", "source_url"]
    readonly_fields = ["created_at", "updated_at", "file_size_display"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("Document Details", {
            "fields": ("title", "document_type", "file", "source_url")
        }),
        ("Associated Records", {
            "fields": ("data_source", "project", "ingestion_run")
        }),
        ("Metadata & Timestamps", {
            "fields": ("file_size_display", "metadata", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def document_type_badge(self, obj):
        colors = {
            "FLASH_REPORT": "#2563eb",
            "SUMMARY_SHEET": "#059669",
            "PROJECT_REPORT": "#7c3aed",
            "DATA_EXPORT": "#d97706",
            "ANNEXURE": "#0891b2",
            "OTHER": "#475569",
        }
        color = colors.get(obj.document_type, "#475569")
        return format_html(
            '<span style="background-color: {}; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_document_type_display(),
        )
    document_type_badge.short_description = "Type"

    def file_link(self, obj):
        if obj.file:
            return format_html(
                '<a href="{}" target="_blank" style="color: #2563eb; font-weight: 600;">Download File</a>',
                obj.file.url,
            )
        if obj.source_url:
            return format_html(
                '<a href="{}" target="_blank" style="color: #2563eb; font-weight: 600;">External Link &rarr;</a>',
                obj.source_url,
            )
        return "—"
    file_link.short_description = "Access"

    def file_size_display(self, obj):
        if not obj.file_size_bytes:
            return "—"
        kb = obj.file_size_bytes / 1024
        if kb < 1024:
            return f"{kb:.1f} KB"
        return f"{kb/1024:.2f} MB"
    file_size_display.short_description = "File Size"
