from django.db.models import Count, Sum, Avg, Min, Max, Q
from django.db.models.functions import Coalesce
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.projects.models import Project


CRORE = 10_000_000


def paise_to_crore(val):
    return round(val / CRORE, 2) if val else 0


class OverviewView(APIView):
    """Top-level KPI dashboard stats."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Project.objects.all()
        total = qs.count()
        agg = qs.aggregate(
            total_cost=Sum("current_cost"),
            total_expenditure=Sum("current_expenditure"),
            avg_progress=Avg("current_progress"),
        )
        active = qs.filter(platform_status="ACTIVE").count()
        completed = qs.filter(platform_status="COMPLETED").count()
        unknown = qs.filter(platform_status="UNKNOWN").count()

        return Response({
            "total_projects": total,
            "total_cost_crore": paise_to_crore(agg["total_cost"]),
            "total_expenditure_crore": paise_to_crore(agg["total_expenditure"]),
            "avg_progress": round(agg["avg_progress"] or 0, 1),
            "active_projects": active,
            "completed_projects": completed,
            "unknown_projects": unknown,
            # Note: these counts are platform-derived classifications
            "platform_derived": True,
        })


class StateAnalyticsView(APIView):
    """Per-state breakdown."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Project.objects.filter(state__isnull=False)
        sector = request.query_params.get("sector")
        if sector:
            if sector.isdigit():
                qs = qs.filter(sector_id=int(sector))
            else:
                qs = qs.filter(sector__name__iexact=sector)
        status = request.query_params.get("status")
        if status:
            qs = qs.filter(platform_status=status)

        rows = (
            qs
            .values("state__id", "state__name", "state__code")
            .annotate(
                project_count=Count("id"),
                total_cost=Sum("current_cost"),
                total_expenditure=Sum("current_expenditure"),
                avg_progress=Avg("current_progress"),
            )
            .order_by("-project_count")
        )
        return Response([
            {
                "state_id": r["state__id"],
                "state_name": r["state__name"],
                "state_code": r["state__code"],
                "project_count": r["project_count"],
                "total_cost_crore": paise_to_crore(r["total_cost"]),
                "total_expenditure_crore": paise_to_crore(r["total_expenditure"]),
                "avg_progress": round(r["avg_progress"] or 0, 1),
            }
            for r in rows
        ])


class SectorAnalyticsView(APIView):
    """Per-sector breakdown."""
    permission_classes = [AllowAny]

    def get(self, request):
        rows = (
            Project.objects
            .filter(sector__isnull=False)
            .values("sector__id", "sector__name")
            .annotate(
                project_count=Count("id"),
                total_cost=Sum("current_cost"),
                total_expenditure=Sum("current_expenditure"),
                avg_progress=Avg("current_progress"),
            )
            .order_by("-project_count")
        )
        return Response([
            {
                "sector_id": r["sector__id"],
                "sector_name": r["sector__name"],
                "project_count": r["project_count"],
                "total_cost_crore": paise_to_crore(r["total_cost"]),
                "total_expenditure_crore": paise_to_crore(r["total_expenditure"]),
                "avg_progress": round(r["avg_progress"] or 0, 1),
            }
            for r in rows
        ])


class MinistryAnalyticsView(APIView):
    """Per-ministry breakdown."""
    permission_classes = [AllowAny]

    def get(self, request):
        rows = (
            Project.objects
            .filter(ministry__isnull=False)
            .values("ministry__id", "ministry__name", "ministry__short_name")
            .annotate(
                project_count=Count("id"),
                total_cost=Sum("current_cost"),
                total_expenditure=Sum("current_expenditure"),
                avg_progress=Avg("current_progress"),
            )
            .order_by("-project_count")
        )
        return Response([
            {
                "ministry_id": r["ministry__id"],
                "ministry_name": r["ministry__name"],
                "ministry_short": r["ministry__short_name"],
                "project_count": r["project_count"],
                "total_cost_crore": paise_to_crore(r["total_cost"]),
                "total_expenditure_crore": paise_to_crore(r["total_expenditure"]),
                "avg_progress": round(r["avg_progress"] or 0, 1),
            }
            for r in rows
        ])


class CostAnalyticsView(APIView):
    """Cost distribution analytics."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Project.objects.filter(current_cost__isnull=False)
        agg = qs.aggregate(
            avg=Avg("current_cost"),
            minimum=Min("current_cost"),
            maximum=Max("current_cost"),
        )
        # All values in Crore for readability
        buckets = _cost_distribution(qs)
        return Response({
            "avg_cost_crore": paise_to_crore(agg["avg"]),
            "min_cost_crore": paise_to_crore(agg["minimum"]),
            "max_cost_crore": paise_to_crore(agg["maximum"]),
            "distribution": buckets,
            "platform_derived": True,
        })


class ProgressDistributionView(APIView):
    """Progress bucket distribution."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Project.objects
        return Response({
            "0_25": qs.filter(current_progress__gte=0, current_progress__lt=25).count(),
            "25_50": qs.filter(current_progress__gte=25, current_progress__lt=50).count(),
            "50_75": qs.filter(current_progress__gte=50, current_progress__lt=75).count(),
            "75_100": qs.filter(current_progress__gte=75, current_progress__lt=100).count(),
            "completed": qs.filter(current_progress=100).count(),
            "unknown": qs.filter(current_progress__isnull=True).count(),
            "platform_derived": True,
        })


class YearAnalyticsView(APIView):
    """Projects by completion year."""
    permission_classes = [AllowAny]

    def get(self, request):
        from django.db.models.functions import ExtractYear
        rows = (
            Project.objects
            .filter(current_completion_date__isnull=False)
            .annotate(year=ExtractYear("current_completion_date"))
            .values("year")
            .annotate(count=Count("id"), total_cost=Sum("current_cost"))
            .order_by("year")
        )
        return Response([
            {
                "year": r["year"],
                "project_count": r["count"],
                "total_cost_crore": paise_to_crore(r["total_cost"]),
            }
            for r in rows
        ])


def _cost_distribution(qs):
    """Return cost bucket counts (in Crore ranges)."""
    CRORE = 10_000_000
    return [
        {"label": "< ₹10 Cr", "count": qs.filter(current_cost__lt=10 * CRORE).count()},
        {"label": "₹10–100 Cr", "count": qs.filter(current_cost__gte=10 * CRORE, current_cost__lt=100 * CRORE).count()},
        {"label": "₹100–500 Cr", "count": qs.filter(current_cost__gte=100 * CRORE, current_cost__lt=500 * CRORE).count()},
        {"label": "₹500–1,000 Cr", "count": qs.filter(current_cost__gte=500 * CRORE, current_cost__lt=1000 * CRORE).count()},
        {"label": "> ₹1,000 Cr", "count": qs.filter(current_cost__gte=1000 * CRORE).count()},
    ]
