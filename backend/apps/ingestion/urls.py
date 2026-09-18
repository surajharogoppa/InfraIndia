from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngestionRunViewSet, DataQualityIssueViewSet, RawIngestionRecordViewSet

router = DefaultRouter()
router.register("runs", IngestionRunViewSet)
router.register("quality", DataQualityIssueViewSet)
router.register("raw-records", RawIngestionRecordViewSet)

urlpatterns = [path("", include(router.urls))]
