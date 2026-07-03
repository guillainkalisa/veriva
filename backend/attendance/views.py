from rest_framework import status, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from accounts.permissions import IsAdmin, IsAdminOrLecturer, IsAdminOrSecurity, IsAdminOrLecturerOrReadOnly

from .models import Course, AttendanceSession, AttendanceRecord, CampusEntry
from .serializers import (
    CourseSerializer, AttendanceSessionSerializer,
    AttendanceRecordSerializer, NFCAttendanceSerializer,
    CampusEntrySerializer, NFCCampusEntrySerializer
)
from students.models import NFCCard, Student


class CourseViewSet(ModelViewSet):
    queryset = Course.objects.select_related('lecturer').all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrLecturerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active', 'department', 'lecturer']
    search_fields = ['name', 'code', 'department']


class AttendanceSessionViewSet(ModelViewSet):
    queryset = AttendanceSession.objects.select_related('course', 'created_by').all()
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAdminOrLecturerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['course', 'date', 'is_open']
    search_fields = ['course__name', 'course__code', 'room']
    ordering_fields = ['date', 'start_time', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='close')
    def close_session(self, request, pk=None):
        session = self.get_object()
        session.close()
        return Response(AttendanceSessionSerializer(session).data)

    @action(detail=True, methods=['get'], url_path='records')
    def session_records(self, request, pk=None):
        session = self.get_object()
        records = session.records.select_related('student', 'nfc_card').all()
        serializer = AttendanceRecordSerializer(records, many=True, context={'request': request})
        return Response(serializer.data)


class AttendanceRecordViewSet(ModelViewSet):
    queryset = AttendanceRecord.objects.select_related('session', 'student', 'nfc_card').all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAdminOrLecturerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['session', 'student', 'method']
    search_fields = ['student__full_name', 'student__registration_number']
    ordering_fields = ['check_in_time']


class NFCAttendanceView(APIView):
    """Record attendance via NFC card tap."""

    def post(self, request):
        serializer = NFCAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['nfc_uid']
        session_id = serializer.validated_data['session_id']

        try:
            card = NFCCard.objects.select_related('student').get(uid=uid)
        except NFCCard.DoesNotExist:
            return Response({'detail': 'NFC card not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not card.is_active:
            return Response({'detail': 'NFC card is not active.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            session = AttendanceSession.objects.get(pk=session_id)
        except AttendanceSession.DoesNotExist:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not session.is_open:
            return Response({'detail': 'This attendance session is closed.'}, status=status.HTTP_400_BAD_REQUEST)

        record, created = AttendanceRecord.objects.get_or_create(
            session=session,
            student=card.student,
            defaults={
                'method': AttendanceRecord.METHOD_NFC,
                'nfc_card': card,
                'recorded_by': request.user,
            }
        )

        if not created:
            return Response(
                {'detail': 'Attendance already recorded for this student.', 'already_recorded': True},
                status=status.HTTP_200_OK
            )

        return Response(
            {'detail': 'Attendance recorded successfully.', 'record': AttendanceRecordSerializer(record).data},
            status=status.HTTP_201_CREATED
        )


class CampusEntryViewSet(ModelViewSet):
    queryset = CampusEntry.objects.select_related('student', 'nfc_card').all()
    serializer_class = CampusEntrySerializer
    permission_classes = [IsAdminOrSecurity]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'gate', 'student']
    search_fields = ['student__full_name', 'student__registration_number']
    ordering_fields = ['entry_time']


class NFCCampusEntryView(APIView):
    """Record campus entry via NFC card tap."""

    def post(self, request):
        serializer = NFCCampusEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['nfc_uid']
        gate = serializer.validated_data.get('gate', 'Main Gate')

        try:
            card = NFCCard.objects.select_related('student').get(uid=uid)
        except NFCCard.DoesNotExist:
            return Response({'detail': 'NFC card not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not card.is_active:
            return Response({'detail': 'NFC card is not active.', 'status': card.status}, status=status.HTTP_403_FORBIDDEN)

        last_entry = CampusEntry.objects.filter(
            student=card.student, status=CampusEntry.STATUS_ENTERED
        ).first()

        if last_entry:
            last_entry.exit_time = timezone.now()
            last_entry.status = CampusEntry.STATUS_EXITED
            last_entry.save()
            action = 'exit'
        else:
            last_entry = CampusEntry.objects.create(
                student=card.student,
                nfc_card=card,
                gate=gate,
                status=CampusEntry.STATUS_ENTERED
            )
            action = 'entry'

        return Response({
            'action': action,
            'student': {
                'full_name': card.student.full_name,
                'registration_number': card.student.registration_number,
                'college': card.student.college,
            },
            'entry': CampusEntrySerializer(last_entry).data,
        }, status=status.HTTP_200_OK)


class AttendanceSummaryView(APIView):
    """Attendance statistics for dashboard."""

    def get(self, request):
        from django.db.models import Count
        today = timezone.localdate()

        return Response({
            'today_entries': CampusEntry.objects.filter(entry_time__date=today).count(),
            'students_on_campus': CampusEntry.objects.filter(
                entry_time__date=today, status=CampusEntry.STATUS_ENTERED
            ).count(),
            'open_sessions': AttendanceSession.objects.filter(is_open=True).count(),
            'total_records_today': AttendanceRecord.objects.filter(check_in_time__date=today).count(),
        })
