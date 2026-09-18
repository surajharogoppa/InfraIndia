from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import IngestionRun, DataQualityIssue, RawIngestionRecord
from .serializers import IngestionRunSerializer, DataQualityIssueSerializer, RawIngestionRecordSerializer


class IngestionRunViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = IngestionRun.objects.select_related("source").all()
    serializer_class = IngestionRunSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["source", "status"]
    ordering = ["-started_at"]


class DataQualityIssueViewSet(viewsets.ModelViewSet):
    queryset = DataQualityIssue.objects.select_related("ingestion_run").all()
    serializer_class = DataQualityIssueSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["status", "ingestion_run"]
    ordering = ["-created_at"]
    http_method_names = ["get", "patch", "head", "options"]

    @action(detail=True, methods=["patch"], url_path="resolve")
    def resolve(self, request, pk=None):
        """Resolve a data quality issue."""
        issue = self.get_object()
        new_status = request.data.get("status")
        if new_status not in dict(DataQualityIssue.IssueStatus.choices):
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )
        issue.status = new_status
        issue.admin_notes = request.data.get("admin_notes", issue.admin_notes)
        issue.resolved_at = timezone.now()
        issue.save()
        return Response(DataQualityIssueSerializer(issue).data)


class RawIngestionRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for raw ingestion audit trail.
    List endpoint excludes raw_payload for performance.
    Detail endpoint includes full raw_payload for debugging.
    """
    queryset = RawIngestionRecord.objects.select_related("ingestion_run").all()
    serializer_class = RawIngestionRecordSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["ingestion_run", "was_accepted"]
    ordering = ["-created_at"]

    def retrieve(self, request, *args, **kwargs):
        """Detail view includes raw_payload field."""
        instance = self.get_object()
        data = RawIngestionRecordSerializer(instance).data
        data["raw_payload"] = instance.raw_payload
        return Response(data)
