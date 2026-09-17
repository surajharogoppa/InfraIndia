from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StateViewSet, DistrictViewSet

router = DefaultRouter()
router.register("states", StateViewSet)
router.register("districts", DistrictViewSet)

urlpatterns = [path("", include(router.urls))]
