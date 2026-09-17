from django.urls import path
from .views import (
    OverviewView, StateAnalyticsView, SectorAnalyticsView,
    MinistryAnalyticsView, CostAnalyticsView,
    ProgressDistributionView, YearAnalyticsView,
)

urlpatterns = [
    path("overview/", OverviewView.as_view(), name="analytics-overview"),
    path("states/", StateAnalyticsView.as_view(), name="analytics-states"),
    path("sectors/", SectorAnalyticsView.as_view(), name="analytics-sectors"),
    path("ministries/", MinistryAnalyticsView.as_view(), name="analytics-ministries"),
    path("costs/", CostAnalyticsView.as_view(), name="analytics-costs"),
    path("progress/", ProgressDistributionView.as_view(), name="analytics-progress"),
    path("years/", YearAnalyticsView.as_view(), name="analytics-years"),
]
