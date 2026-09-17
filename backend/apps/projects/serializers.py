from rest_framework import serializers
from .models import Project, ProjectSnapshot, ProjectChange


def paise_to_crore(value):
    """Convert integer paise to display Crore float."""
    if value is None:
        return None
    return round(value / 10_000_000, 2)


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list/search views."""
    state_name = serializers.CharField(source="state.name", read_only=True)
    sector_name = serializers.CharField(source="sector.name", read_only=True)
    ministry_name = serializers.CharField(source="ministry.name", read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    current_cost_crore = serializers.SerializerMethodField()
    original_cost_crore = serializers.SerializerMethodField()
    current_expenditure_crore = serializers.SerializerMethodField()

    def get_current_cost_crore(self, obj):
        return paise_to_crore(obj.current_cost)

    def get_original_cost_crore(self, obj):
        return paise_to_crore(obj.original_cost)

    def get_current_expenditure_crore(self, obj):
        return paise_to_crore(obj.current_expenditure)

    class Meta:
        model = Project
        fields = [
            "id", "external_project_id", "name",
            "state_name", "district_name", "sector_name", "ministry_name", "organization_name",
            "original_cost_crore", "current_cost_crore", "current_expenditure_crore",
            "current_progress", "platform_status", "source_status",
            "original_completion_date", "current_completion_date",
            "updated_at",
        ]


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Full serializer for project detail page."""
    state_name = serializers.CharField(source="state.name", read_only=True)
    state_code = serializers.CharField(source="state.code", read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)
    sector_name = serializers.CharField(source="sector.name", read_only=True)
    ministry_name = serializers.CharField(source="ministry.name", read_only=True)
    ministry_short = serializers.CharField(source="ministry.short_name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    source_name = serializers.CharField(source="source.name", read_only=True)

    original_cost_crore = serializers.SerializerMethodField()
    current_cost_crore = serializers.SerializerMethodField()
    current_expenditure_crore = serializers.SerializerMethodField()

    # Platform-derived — clearly named
    platform_cost_change_pct = serializers.FloatField(source="cost_change_pct", read_only=True)
    platform_expenditure_ratio = serializers.FloatField(source="expenditure_ratio", read_only=True)
    platform_schedule_delay_months = serializers.IntegerField(source="schedule_delay_months", read_only=True)

    def get_original_cost_crore(self, obj):
        return paise_to_crore(obj.original_cost)

    def get_current_cost_crore(self, obj):
        return paise_to_crore(obj.current_cost)

    def get_current_expenditure_crore(self, obj):
        return paise_to_crore(obj.current_expenditure)

    class Meta:
        model = Project
        fields = [
            "id", "external_project_id", "name", "description",
            "state_name", "state_code", "district_name",
            "sector_name", "ministry_name", "ministry_short",
            "department_name", "organization_name",
            "contractor_name",
            "original_cost_crore", "current_cost_crore", "current_expenditure_crore", "currency",
            "original_start_date", "current_start_date",
            "original_completion_date", "current_completion_date",
            "current_progress",
            "source_status", "platform_status",
            "source_name", "source_url", "source_updated_date",
            "latitude", "longitude",
            "platform_cost_change_pct", "platform_expenditure_ratio", "platform_schedule_delay_months",
            "created_at", "updated_at",
        ]


class ProjectSnapshotSerializer(serializers.ModelSerializer):
    project_cost_crore = serializers.SerializerMethodField()
    revised_cost_crore = serializers.SerializerMethodField()
    expenditure_crore = serializers.SerializerMethodField()

    def get_project_cost_crore(self, obj):
        return paise_to_crore(obj.project_cost)

    def get_revised_cost_crore(self, obj):
        return paise_to_crore(obj.revised_cost)

    def get_expenditure_crore(self, obj):
        return paise_to_crore(obj.expenditure)

    class Meta:
        model = ProjectSnapshot
        fields = [
            "id", "snapshot_date",
            "project_cost_crore", "revised_cost_crore", "expenditure_crore",
            "physical_progress", "start_date", "completion_date",
            "source_status", "created_at",
        ]


class ProjectChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectChange
        fields = [
            "id", "change_type", "field_name",
            "old_value", "new_value",
            "change_amount", "change_percentage",
            "detected_at",
        ]


class ProjectCompareSerializer(serializers.ModelSerializer):
    """Serializer for comparison view."""
    state_name = serializers.CharField(source="state.name", read_only=True)
    sector_name = serializers.CharField(source="sector.name", read_only=True)
    ministry_name = serializers.CharField(source="ministry.name", read_only=True)
    current_cost_crore = serializers.SerializerMethodField()
    original_cost_crore = serializers.SerializerMethodField()
    current_expenditure_crore = serializers.SerializerMethodField()
    platform_cost_change_pct = serializers.FloatField(source="cost_change_pct", read_only=True)
    platform_schedule_delay_months = serializers.IntegerField(source="schedule_delay_months", read_only=True)

    def get_current_cost_crore(self, obj):
        return paise_to_crore(obj.current_cost)

    def get_original_cost_crore(self, obj):
        return paise_to_crore(obj.original_cost)

    def get_current_expenditure_crore(self, obj):
        return paise_to_crore(obj.current_expenditure)

    class Meta:
        model = Project
        fields = [
            "id", "name", "state_name", "sector_name", "ministry_name",
            "original_cost_crore", "current_cost_crore", "current_expenditure_crore",
            "current_progress", "source_status", "platform_status",
            "original_start_date", "current_start_date",
            "original_completion_date", "current_completion_date",
            "platform_cost_change_pct", "platform_schedule_delay_months",
            "contractor_name",
        ]
