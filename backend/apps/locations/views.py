from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import State, District
from .serializers import StateSerializer, DistrictSerializer


class StateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = State.objects.all()
    serializer_class = StateSerializer
    permission_classes = [AllowAny]
    search_fields = ["name", "code"]


class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = District.objects.select_related("state").all()
    serializer_class = DistrictSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["state"]
    search_fields = ["name"]
