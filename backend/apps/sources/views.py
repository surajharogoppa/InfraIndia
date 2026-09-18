from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DataSource
from .serializers import DataSourceSerializer


class DataSourceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DataSource.objects.all()
    serializer_class = DataSourceSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["is_active", "source_type"]

    @action(detail=True, methods=["post"], url_path="trigger")
    def trigger_ingestion(self, request, pk=None):
        """Manually trigger ingestion for a source."""
        # pyrefly: ignore [missing-import]
        from apps.ingestion.tasks import run_ingestion
        source = self.get_object()
        run_ingestion.delay(source.id)
        return Response({"status": "queued", "source_id": source.id})
