from django.contrib import admin
from .models import State, District

@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ["name", "code"]
    search_fields = ["name", "code"]

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ["name", "state"]
    list_filter = ["state"]
    search_fields = ["name"]
