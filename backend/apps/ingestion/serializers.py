from rest_framework import serializers
from .models import IngestionRun, DataQualityIssue, RawIngestionRecord


class IngestionRunSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source="source.name", read_only=True)
    records_unchanged = serializers.SerializerMethodField()

    class Meta:
        model = IngestionRun
        fields = "__all__"

    def get_records_unchanged(self, obj):
        return max(0, obj.records_found - obj.records_inserted - obj.records_updated - obj.records_rejected)


class DataQualityIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataQualityIssue
        fields = "__all__"


class RawIngestionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawIngestionRecord
        fields = ["id", "ingestion_run", "external_record_id", "content_hash",
                  "source_file", "was_accepted", "rejection_reason", "created_at"]
        # Exclude raw_payload from list views for performance; detail view includes it
