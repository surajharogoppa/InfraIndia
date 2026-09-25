import os
from django.contrib import admin
from django.utils.html import format_html
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "document_type_badge",
        "file_format_badge",
        "data_source",
        "file_link",
        "file_size_display",
        "created_at",
    ]
    list_filter = ["document_type", "data_source", "created_at"]
    search_fields = ["title", "project__name", "source_url"]
    readonly_fields = ["created_at", "updated_at", "file_size_display"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("Document Identification", {
            "fields": ("title", "document_type", "data_source", "project")
        }),
        ("File & External Source", {
            "fields": ("file", "source_url")
        }),
        ("Audit & Metadata", {
            "fields": ("file_size_display", "metadata", "ingestion_run", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def save_model(self, request, obj, form, change):
        if obj.file:
            try:
                obj.file_size_bytes = obj.file.size
            except Exception:
                pass
        super().save_model(request, obj, form, change)

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

    def file_format_badge(self, obj):
        if obj.file:
            ext = os.path.splitext(obj.file.name)[1].upper().replace(".", "")
            colors = {
                "PDF": "#dc2626",
                "XML": "#d97706",
                "CSV": "#16a34a",
                "XLSX": "#059669",
                "JSON": "#2563eb",
            }
            bg = colors.get(ext, "#64748b")
            return format_html(
                '<span style="background-color: {}; color: #ffffff; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; font-family: monospace;">{}</span>',
                bg,
                ext or "FILE",
            )
        return "—"
    file_format_badge.short_description = "Format"

    def file_link(self, obj):
        links = []
        if obj.file:
            links.append(format_html(
                '<a href="{}" target="_blank" style="color: #2563eb; font-weight: 600; text-decoration: underline;">Download File</a>',
                obj.file.url,
            ))
        if obj.source_url:
            links.append(format_html(
                '<a href="{}" target="_blank" style="color: #64748b; font-size: 11px;">External &rarr;</a>',
                obj.source_url,
            ))
        if links:
            return format_html(" | ".join(links))
        return "—"
    file_link.short_description = "Access"

    def file_size_display(self, obj):
        if not obj.file_size_bytes and obj.file:
            try:
                obj.file_size_bytes = obj.file.size
            except Exception:
                pass
        if not obj.file_size_bytes:
            return "—"
        kb = obj.file_size_bytes / 1024
        if kb < 1024:
            return f"{kb:.1f} KB"
        return f"{kb/1024:.2f} MB"
    file_size_display.short_description = "File Size"
