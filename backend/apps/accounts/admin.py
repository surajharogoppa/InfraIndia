from django.contrib import admin
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.utils.safestring import mark_safe


@admin.register(LogEntry)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = [
        "action_time",
        "user",
        "action_type_badge",
        "content_type",
        "object_repr",
        "change_message_short",
    ]
    list_filter = ["action_time", "action_flag", "content_type"]
    search_fields = ["object_repr", "change_message", "user__username"]
    date_hierarchy = "action_time"
    readonly_fields = [
        "action_time",
        "user",
        "content_type",
        "object_id",
        "object_repr",
        "action_flag",
        "change_message",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def action_type_badge(self, obj):
        if obj.action_flag == ADDITION:
            return mark_safe('<span style="background: #16a34a; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">ADD</span>')
        elif obj.action_flag == CHANGE:
            return mark_safe('<span style="background: #2563eb; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">CHANGE</span>')
        elif obj.action_flag == DELETION:
            return mark_safe('<span style="background: #dc2626; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">DELETE</span>')
        return mark_safe('<span style="background: #64748b; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">LOG</span>')
    action_type_badge.short_description = "Action"

    def change_message_short(self, obj):
        msg = obj.get_change_message() or ""
        return msg[:80] + ("..." if len(msg) > 80 else "")
    change_message_short.short_description = "Message / Changes"
