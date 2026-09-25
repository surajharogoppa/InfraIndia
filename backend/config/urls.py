"""URL configuration for GovProject Intelligence Platform"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_header = "InfraIndia Administration"
admin.site.site_title = "InfraIndia Admin Portal"
admin.site.index_title = "Admin Dashboard & Control Center"

_orig_admin_index = admin.site.index

def custom_admin_index(request, extra_context=None):
    from apps.projects.models import Project
    from apps.sources.models import DataSource
    from apps.ingestion.models import IngestionRun, DataQualityIssue
    from apps.documents.models import Document
    from django.contrib.auth import get_user_model
    from django.contrib.admin.models import LogEntry

    User = get_user_model()
    extra_context = extra_context or {}
    try:
        extra_context.update({
            "total_projects": Project.objects.count(),
            "active_projects": Project.objects.filter(platform_status="ACTIVE").count(),
            "completed_projects": Project.objects.filter(platform_status="COMPLETED").count(),
            "total_sources": DataSource.objects.count(),
            "active_sources": DataSource.objects.filter(is_active=True).count(),
            "total_runs": IngestionRun.objects.count(),
            "failed_runs_count": IngestionRun.objects.filter(status="FAILED").count(),
            "recent_runs": IngestionRun.objects.select_related("source").order_by("-started_at")[:6],
            "pending_quality_issues": DataQualityIssue.objects.filter(status="PENDING").count(),
            "recent_quality_issues": DataQualityIssue.objects.select_related("ingestion_run").order_by("-created_at")[:5],
            "total_documents": Document.objects.count(),
            "total_users": User.objects.count(),
            "recent_logs": LogEntry.objects.select_related("user", "content_type").order_by("-action_time")[:6],
        })
    except Exception:
        pass
    return _orig_admin_index(request, extra_context=extra_context)

admin.site.index = custom_admin_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("config.api_urls")),
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
