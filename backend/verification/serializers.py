from rest_framework import serializers
from .models import IncidentReport
from students.serializers import StudentListSerializer
from devices.serializers import DeviceSerializer


class IncidentReportSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    involved_student_detail = StudentListSerializer(source='involved_student', read_only=True)

    class Meta:
        model = IncidentReport
        fields = [
            'id', 'type', 'type_display', 'severity', 'severity_display',
            'description', 'reported_by', 'reported_by_name',
            'involved_student', 'involved_student_detail',
            'involved_device', 'location', 'is_resolved',
            'resolution_notes', 'resolved_by', 'resolved_by_name',
            'created_at', 'resolved_at'
        ]
        read_only_fields = ['created_at', 'resolved_at']


class ResolveIncidentSerializer(serializers.Serializer):
    resolution_notes = serializers.CharField(required=False, allow_blank=True)
