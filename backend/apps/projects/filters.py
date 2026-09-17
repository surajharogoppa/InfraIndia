import django_filters
from .models import Project


class ProjectFilter(django_filters.FilterSet):
    state = django_filters.CharFilter(field_name="state__name", lookup_expr="iexact")
    state_id = django_filters.NumberFilter(field_name="state__id")
    district = django_filters.CharFilter(field_name="district__name", lookup_expr="icontains")
    sector = django_filters.CharFilter(field_name="sector__name", lookup_expr="iexact")
    sector_id = django_filters.NumberFilter(field_name="sector__id")
    ministry = django_filters.CharFilter(field_name="ministry__name", lookup_expr="icontains")
    ministry_id = django_filters.NumberFilter(field_name="ministry__id")
    platform_status = django_filters.CharFilter(field_name="platform_status")
    source_status = django_filters.CharFilter(field_name="source_status", lookup_expr="icontains")

    # Cost filters in Crore — converted to paise internally
    min_cost = django_filters.NumberFilter(method="filter_min_cost")
    max_cost = django_filters.NumberFilter(method="filter_max_cost")

    # Progress filters
    progress_min = django_filters.NumberFilter(field_name="current_progress", lookup_expr="gte")
    progress_max = django_filters.NumberFilter(field_name="current_progress", lookup_expr="lte")

    # Year filters
    completion_year = django_filters.NumberFilter(method="filter_completion_year")
    start_year = django_filters.NumberFilter(method="filter_start_year")

    def filter_min_cost(self, queryset, name, value):
        paise = int(float(value) * 10_000_000)
        return queryset.filter(current_cost__gte=paise)

    def filter_max_cost(self, queryset, name, value):
        paise = int(float(value) * 10_000_000)
        return queryset.filter(current_cost__lte=paise)

    def filter_completion_year(self, queryset, name, value):
        return queryset.filter(current_completion_date__year=value)

    def filter_start_year(self, queryset, name, value):
        return queryset.filter(original_start_date__year=value)

    class Meta:
        model = Project
        fields = []
