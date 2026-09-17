from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import Project, ProjectSnapshot, ProjectChange
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer,
    ProjectSnapshotSerializer, ProjectChangeSerializer,
    ProjectCompareSerializer,
)
from .filters import ProjectFilter


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    filterset_class = ProjectFilter
    search_fields = [
        "name", "external_project_id", "description",
        "contractor_name", "ministry__name", "department__name",
        "organization__name", "state__name", "district__name", "sector__name",
    ]
    ordering_fields = [
        "name", "current_cost", "current_progress",
        "current_completion_date", "updated_at",
    ]
    ordering = ["-updated_at"]

    def get_queryset(self):
        return (
            Project.objects
            .select_related(
                "state", "district", "sector", "ministry",
                "department", "organization", "source",
            )
            .all()
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProjectDetailSerializer
        return ProjectListSerializer

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        """Return all historical snapshots for a project."""
        project = self.get_object()
        snapshots = ProjectSnapshot.objects.filter(project=project).order_by("-snapshot_date")
        serializer = ProjectSnapshotSerializer(snapshots, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="changes")
    def changes(self, request, pk=None):
        """Return all detected changes for a project."""
        project = self.get_object()
        changes = ProjectChange.objects.filter(project=project).order_by("-detected_at")
        serializer = ProjectChangeSerializer(changes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="compare")
    def compare(self, request):
        """Compare 2-5 projects by IDs."""
        ids = request.data.get("ids", [])
        if not (2 <= len(ids) <= 5):
            return Response(
                {"error": "Please provide 2 to 5 project IDs."},
                status=status.HTTP_400_BAD_REQUEST
            )
        projects = Project.objects.select_related(
            "state", "sector", "ministry"
        ).filter(id__in=ids)
        serializer = ProjectCompareSerializer(projects, many=True)
        return Response(serializer.data)
