from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from accounts.permissions import IsStaff, IsAdminOrSecurity, IsAdminOrSecurityChief

from .models import IncidentReport
from .serializers import IncidentReportSerializer, ResolveIncidentSerializer
from students.models import Student
from devices.models import Device
from attendance.models import CampusEntry, AttendanceRecord, AttendanceSession, Course
from attendance.services import course_eligibility


class IncidentReportViewSet(ModelViewSet):
    queryset = IncidentReport.objects.select_related(
        'reported_by', 'involved_student', 'involved_device', 'resolved_by', 'handling_directorate'
    ).all()
    serializer_class = IncidentReportSerializer
    permission_classes = [IsAdminOrSecurity]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'severity', 'is_resolved']
    search_fields = ['description', 'involved_student__full_name', 'location']
    ordering_fields = ['created_at', 'severity']

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='resolve', permission_classes=[IsAdminOrSecurityChief])
    def resolve(self, request, pk=None):
        incident = self.get_object()
        serializer = ResolveIncidentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incident.resolve(request.user, serializer.validated_data.get('resolution_notes', ''))
        return Response(IncidentReportSerializer(incident).data)


class DashboardStatsView(APIView):
    """Dashboard figures, scoped to what the caller's role is responsible for."""
    permission_classes = [IsStaff]

    def get(self, request):
        user = request.user
        today = timezone.localdate()
        role = user.role
        data = {}

        if role in ('admin', 'security_chief', 'security'):
            entries = CampusEntry.objects.filter(entry_time__date=today)
            if not user.sees_all_gates:
                entries = entries.filter(gate_id__in=user.gate_ids())
            data['students'] = {
                'total': Student.objects.count(),
                'active': Student.objects.filter(is_active=True).count(),
            }
            data['campus'] = {
                'today_entries': entries.count(),
                'on_campus': entries.filter(status=CampusEntry.STATUS_ENTERED).count(),
                'all_gates': user.sees_all_gates,
            }
            data['incidents'] = {
                'total': IncidentReport.objects.count(),
                'unresolved': IncidentReport.objects.filter(is_resolved=False).count(),
                'high_severity': IncidentReport.objects.filter(
                    is_resolved=False, severity=IncidentReport.SEVERITY_HIGH
                ).count(),
            }

        if role in ('admin', 'lecturer'):
            data['attendance'] = {
                'open_sessions': AttendanceSession.objects.filter(is_open=True).count(),
                'records_today': AttendanceRecord.objects.filter(check_in_time__date=today).count(),
            }

        if role == 'lecturer':
            courses = Course.objects.filter(lecturer=user, is_active=True)
            at_risk = []
            for course in courses:
                for row in course_eligibility(course):
                    if row['required_minutes'] and not row['eligible']:
                        at_risk.append({
                            'student_name': row['student'].full_name,
                            'registration_number': row['student'].registration_number,
                            'course_code': course.code,
                            'percent': row['percent'],
                            'required_percent': course.min_attendance_percent,
                        })
            at_risk.sort(key=lambda r: r['percent'])
            data['eligibility'] = {
                'courses': courses.count(),
                'at_risk_count': len(at_risk),
                'at_risk': at_risk[:5],
            }

        if role == 'admin':
            data['devices'] = {
                'total': Device.objects.count(),
                'active': Device.objects.filter(is_active=True).count(),
            }

        return Response(data)
