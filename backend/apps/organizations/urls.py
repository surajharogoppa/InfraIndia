from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MinistryViewSet, DepartmentViewSet, OrganizationViewSet, SectorViewSet

router = DefaultRouter()
router.register("ministries", MinistryViewSet)
router.register("departments", DepartmentViewSet)
router.register("organizations", OrganizationViewSet)
router.register("sectors", SectorViewSet)

urlpatterns = [path("", include(router.urls))]
