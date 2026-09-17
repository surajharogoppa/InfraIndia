from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngestionRunViewSet, DataQualityIssueViewSet

router = DefaultRouter()
router.register("runs", IngestionRunViewSet)
router.register("quality", DataQualityIssueViewSet)

urlpatterns = [path("", include(router.urls))]
