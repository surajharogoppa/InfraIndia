from django.contrib import admin
from .models import Ministry, Department, Organization, Sector


@admin.register(Ministry)
class MinistryAdmin(admin.ModelAdmin):
    list_display = ["name", "short_name"]
    search_fields = ["name"]


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["name", "ministry"]
    list_filter = ["ministry"]
    search_fields = ["name"]


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "department"]
    search_fields = ["name"]


@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]
