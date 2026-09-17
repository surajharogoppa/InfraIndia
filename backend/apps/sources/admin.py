from django.contrib import admin
from .models import DataSource


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "source_type", "is_active", "last_successful_sync"]
    list_filter = ["is_active", "source_type"]
    search_fields = ["name", "organization"]
