import os
from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source="get_document_type_display", read_only=True)
    file_url = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    preview_url = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()
    format = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()
    source_agency = serializers.SerializerMethodField()
    period = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    records_count = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "description",
            "document_type",
            "document_type_display",
            "format",
            "filename",
            "file",
            "file_url",
            "download_url",
            "preview_url",
            "source_url",
            "source_agency",
            "period",
            "size",
            "records_count",
            "status",
            "data_source",
            "project",
            "ingestion_run",
            "file_size_bytes",
            "metadata",
            "created_at",
            "updated_at",
        ]

    def get_filename(self, obj):
        if obj.file:
            return os.path.basename(obj.file.name)
        if obj.source_url:
            return obj.source_url.split("/")[-1] or "source-document"
        return "document"

    def get_format(self, obj):
        fname = self.get_filename(obj).lower()
        if fname.endswith(".pdf"):
            return "PDF"
        if fname.endswith(".xml"):
            return "XML"
        if fname.endswith(".csv"):
            return "CSV"
        if fname.endswith(".xlsx") or fname.endswith(".xls"):
            return "XLSX"
        if fname.endswith(".json"):
            return "JSON"
        if obj.document_type == Document.DocumentType.FLASH_REPORT:
            return "PDF"
        return "DATA"

    def get_size(self, obj):
        if not obj.file_size_bytes and obj.file:
            try:
                obj.file_size_bytes = obj.file.size
                obj.save(update_fields=["file_size_bytes"])
            except Exception:
                pass
        if not obj.file_size_bytes:
            return "—"
        kb = obj.file_size_bytes / 1024
        if kb < 1024:
            return f"{kb:.1f} KB"
        return f"{kb/1024:.2f} MB"

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_download_url(self, obj):
        request = self.context.get("request")
        path = f"/api/documents/{obj.id}/download/"
        if request:
            return request.build_absolute_uri(path)
        return path

    def get_preview_url(self, obj):
        request = self.context.get("request")
        path = f"/api/documents/{obj.id}/preview/"
        if request:
            return request.build_absolute_uri(path)
        return path

    def get_source_agency(self, obj):
        if obj.data_source:
            return obj.data_source.organization
        return obj.metadata.get("agency", "Ministry of Statistics & Programme Implementation (MoSPI)")

    def get_period(self, obj):
        return obj.metadata.get("period", obj.created_at.strftime("%B %Y") if obj.created_at else "Recent")

    def get_description(self, obj):
        if "description" in obj.metadata:
            return obj.metadata["description"]
        doc_type_name = obj.get_document_type_display()
        agency = self.get_source_agency(obj)
        return f"Official {doc_type_name} managed by {agency}. Ingested and verified for public project tracking."

    def get_records_count(self, obj):
        if "projects_monitored" in obj.metadata:
            return f"{obj.metadata['projects_monitored']} Projects"
        if "records" in obj.metadata:
            return f"{obj.metadata['records']} Records"
        return obj.metadata.get("records_count", "Verified Data")

    def get_status(self, obj):
        return obj.metadata.get("status", "Official Publication")
