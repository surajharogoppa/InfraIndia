from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Ministry, Department, Organization, Sector
from .serializers import (
    MinistrySerializer, DepartmentSerializer, OrganizationSerializer, SectorSerializer
)


class MinistryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ministry.objects.all()
    serializer_class = MinistrySerializer
    permission_classes = [AllowAny]
    search_fields = ["name", "short_name"]


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.select_related("ministry").all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["ministry"]
    search_fields = ["name"]


class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Organization.objects.select_related("department").all()
    serializer_class = OrganizationSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["department"]
    search_fields = ["name"]


class SectorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sector.objects.all()
    serializer_class = SectorSerializer
    permission_classes = [AllowAny]
    search_fields = ["name"]
