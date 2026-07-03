from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from accounts.permissions import IsAdmin, IsAdminOrSecurity

from .models import IncidentReport
from .serializers import IncidentReportSerializer, ResolveIncidentSerializer
from students.models import Student
from devices.models import Device
from attendance.models import CampusEntry, AttendanceRecord, AttendanceSession


class IncidentReportViewSet(ModelViewSet):
    queryset = IncidentReport.objects.select_related(
        'reported_by', 'involved_student', 'involved_device', 'resolved_by'
    ).all()
    serializer_class = IncidentReportSerializer
    permission_classes = [IsAdminOrSecurity]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'severity', 'is_resolved']
    search_fields = ['description', 'involved_student__full_name', 'location']
    ordering_fields = ['created_at', 'severity']

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='resolve', permission_classes=[IsAdmin])
    def resolve(self, request, pk=None):
        incident = self.get_object()
        serializer = ResolveIncidentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incident.resolve(request.user, serializer.validated_data.get('resolution_notes', ''))
        return Response(IncidentReportSerializer(incident).data)


class DashboardStatsView(APIView):
    """Aggregated stats for the admin dashboard."""

    def get(self, request):
        from django.utils import timezone
        today = timezone.localdate()

        return Response({
            'students': {
                'total': Student.objects.count(),
                'active': Student.objects.filter(is_active=True).count(),
            },
            'devices': {
                'total': Device.objects.count(),
                'active': Device.objects.filter(is_active=True).count(),
            },
            'attendance': {
                'today_campus_entries': CampusEntry.objects.filter(entry_time__date=today).count(),
                'students_on_campus': CampusEntry.objects.filter(
                    entry_time__date=today, status=CampusEntry.STATUS_ENTERED
                ).count(),
                'open_sessions': AttendanceSession.objects.filter(is_open=True).count(),
                'records_today': AttendanceRecord.objects.filter(check_in_time__date=today).count(),
            },
            'incidents': {
                'total': IncidentReport.objects.count(),
                'unresolved': IncidentReport.objects.filter(is_resolved=False).count(),
                'high_severity': IncidentReport.objects.filter(
                    is_resolved=False, severity=IncidentReport.SEVERITY_HIGH
                ).count(),
            },
        })
