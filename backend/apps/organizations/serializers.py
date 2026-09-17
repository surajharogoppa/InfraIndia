from rest_framework import serializers
from .models import Ministry, Department, Organization, Sector


class MinistrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Ministry
        fields = ["id", "name", "short_name"]


class DepartmentSerializer(serializers.ModelSerializer):
    ministry_name = serializers.CharField(source="ministry.name", read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "ministry", "ministry_name"]


class OrganizationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Organization
        fields = ["id", "name", "department", "department_name"]


class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = ["id", "name", "description"]
