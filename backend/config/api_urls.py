"""API URL routing"""
from django.urls import path, include

urlpatterns = [
    path("projects/", include("apps.projects.urls")),
    path("locations/", include("apps.locations.urls")),
    path("organizations/", include("apps.organizations.urls")),
    path("analytics/", include("apps.analytics.urls")),
    path("sources/", include("apps.sources.urls")),
    path("ingestion/", include("apps.ingestion.urls")),
    path("documents/", include("apps.documents.urls")),
    path("alerts/", include("apps.alerts.urls")),
]
