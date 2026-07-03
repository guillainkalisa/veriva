from django.contrib import admin
from .models import IncidentReport


@admin.register(IncidentReport)
class IncidentReportAdmin(admin.ModelAdmin):
    list_display = ['type', 'severity', 'reported_by', 'is_resolved', 'created_at']
    list_filter = ['type', 'severity', 'is_resolved']
    search_fields = ['description', 'involved_student__full_name']
    readonly_fields = ['created_at', 'resolved_at']
