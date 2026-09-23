from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.utils import timezone
from accounts.permissions import (
    IsStaff, IsAdminOrLecturer, IsAdminOrSecurity, IsCourseOwnerOrAdmin,
    IsCourseOwnerOrAdminStrict, IsAdminOrLecturerOrReadOnly, IsCourseManagerOrAdmin,
)

from .models import Course, AttendanceSession, AttendanceRecord, CampusEntry, CourseEnrollment
from .serializers import (
    CourseSerializer, AttendanceSessionSerializer,
    AttendanceRecordSerializer, NFCAttendanceSerializer,
    CampusEntrySerializer, NFCCampusEntrySerializer, CourseEnrollmentSerializer,
)
from students.models import NFCCard, Student
from students.serializers import StudentSerializer, StudentMinimalSerializer


class CourseViewSet(ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsCourseManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active', 'department', 'lecturer']
    search_fields = ['name', 'code', 'department__name']

    def get_queryset(self):
        qs = Course.objects.select_related('lecturer', 'department', 'department__school')
        if self.request.user.role == 'lecturer':
            qs = qs.filter(lecturer=self.request.user)
        return qs

    def perform_create(self, serializer):
        # Lecturers can't create courses at all (see IsCourseManagerOrAdmin);
        # a HoD can only ever create within their own department.
        if self.request.user.role == 'hod':
            serializer.save(department=self.request.user.assigned_department)
        else:
            serializer.save()

    @action(detail=True, methods=['post'], url_path='enroll', permission_classes=[IsCourseOwnerOrAdmin])
    def enroll(self, request, pk=None):
        course = self.get_object()
        student_ids = request.data.get('student_ids', [])
        valid_ids = list(Student.objects.filter(id__in=student_ids).values_list('id', flat=True))
        for sid in valid_ids:
            enrollment, created = CourseEnrollment.objects.get_or_create(course=course, student_id=sid)
            if not created and not enrollment.is_active:
                enrollment.is_active = True
                enrollment.save(update_fields=['is_active'])
        return Response({'enrolled': len(valid_ids), 'skipped': len(student_ids) - len(valid_ids)})

    @action(detail=True, methods=['post'], url_path='unenroll', permission_classes=[IsCourseOwnerOrAdmin])
    def unenroll(self, request, pk=None):
        course = self.get_object()
        student_ids = request.data.get('student_ids', [])
        updated = CourseEnrollment.objects.filter(
            course=course, student_id__in=student_ids
        ).update(is_active=False)
        return Response({'unenrolled': updated})

    @action(detail=True, methods=['get'], url_path='enrollable-students', permission_classes=[IsCourseOwnerOrAdminStrict])
    def enrollable_students(self, request, pk=None):
        course = self.get_object()
        search = request.query_params.get('q', '').strip()
        enrolled_ids = course.enrollments.filter(is_active=True).values_list('student_id', flat=True)
        qs = Student.objects.filter(is_active=True).exclude(id__in=enrolled_ids)
        if search:
            qs = qs.filter(Q(full_name__icontains=search) | Q(registration_number__icontains=search))
        qs = qs.select_related('program')[:20]
        return Response(StudentMinimalSerializer(qs, many=True).data)

    @action(detail=True, methods=['get'], url_path='roster', permission_classes=[IsCourseOwnerOrAdminStrict])
    def roster(self, request, pk=None):
        course = self.get_object()
        from .services import course_eligibility
        rows = course_eligibility(course)
        return Response([{
            'student': StudentSerializer(row['student'], context={'request': request}).data,
            'counted_minutes': row['counted_minutes'],
            'required_minutes': row['required_minutes'],
            'percent': row['percent'],
            'eligible': row['eligible'],
        } for row in rows])


class AttendanceSessionViewSet(ModelViewSet):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsCourseOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['course', 'date', 'is_open']
    search_fields = ['course__name', 'course__code', 'room']
    ordering_fields = ['date', 'start_time', 'created_at']

    def get_queryset(self):
        qs = AttendanceSession.objects.select_related('course', 'created_by')
        if self.request.user.role == 'lecturer':
            qs = qs.filter(course__lecturer=self.request.user)
        return qs

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if self.request.user.role == 'lecturer' and course.lecturer_id != self.request.user.id:
            raise PermissionDenied("You can only open sessions for your own courses.")
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
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAdminOrLecturerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['session', 'student', 'method']
    search_fields = ['student__full_name', 'student__registration_number']
    ordering_fields = ['check_in_time']

    def get_queryset(self):
        qs = AttendanceRecord.objects.select_related('session', 'student', 'nfc_card')
        if self.request.user.role == 'lecturer':
            qs = qs.filter(session__course__lecturer=self.request.user)
        return qs


class NFCAttendanceView(APIView):
    """Record attendance via NFC card tap."""
    permission_classes = [IsAdminOrLecturer]

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

        if request.user.role == 'lecturer' and session.course.lecturer_id != request.user.id:
            return Response(
                {'detail': 'You can only record attendance for your own course sessions.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not CourseEnrollment.objects.filter(
            course=session.course, student=card.student, is_active=True
        ).exists():
            return Response(
                {'detail': 'Student is not enrolled in this course.'}, status=status.HTTP_403_FORBIDDEN
            )

        student_data = StudentSerializer(card.student, context={'request': request}).data

        if session.track_mode == AttendanceSession.MODE_DOUBLE:
            open_record = AttendanceRecord.objects.filter(
                session=session, student=card.student, check_out_time__isnull=True
            ).first()
            if open_record:
                open_record.check_out_time = timezone.now()
                open_record.save(update_fields=['check_out_time'])
                return Response(
                    {'detail': 'Check-out recorded.', 'action': 'out', 'student': student_data,
                     'record': AttendanceRecordSerializer(open_record).data},
                    status=status.HTTP_200_OK
                )
            record = AttendanceRecord.objects.create(
                session=session, student=card.student,
                method=AttendanceRecord.METHOD_NFC, nfc_card=card, recorded_by=request.user,
            )
            return Response(
                {'detail': 'Check-in recorded.', 'action': 'in', 'student': student_data,
                 'record': AttendanceRecordSerializer(record).data},
                status=status.HTTP_201_CREATED
            )

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
                {'detail': 'Attendance already recorded for this student.', 'already_recorded': True,
                 'action': 'in', 'student': student_data},
                status=status.HTTP_200_OK
            )

        return Response(
            {'detail': 'Attendance recorded successfully.', 'action': 'in', 'student': student_data,
             'record': AttendanceRecordSerializer(record).data},
            status=status.HTTP_201_CREATED
        )


class CampusEntryViewSet(ModelViewSet):
    serializer_class = CampusEntrySerializer
    permission_classes = [IsAdminOrSecurity]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'gate', 'student']
    search_fields = ['student__full_name', 'student__registration_number']
    ordering_fields = ['entry_time']

    def get_queryset(self):
        qs = CampusEntry.objects.select_related('student', 'nfc_card', 'gate')
        user = self.request.user
        if not user.sees_all_gates:  # a gate guard sees only their gates
            qs = qs.filter(gate_id__in=user.gate_ids())
        return qs


class NFCCampusEntryView(APIView):
    """Record a campus entry/exit from an NFC tap at a gate."""
    permission_classes = [IsAdminOrSecurity]

    def resolve_gate(self, request, requested_gate):
        """Which gate this tap counts for. A guard is confined to their assigned
        gates; admin and the security chief may tap any gate."""
        user = request.user
        if user.sees_all_gates:
            if requested_gate is None:
                return None, Response({'detail': 'Gate is required.'}, status=status.HTTP_400_BAD_REQUEST)
            return requested_gate, None

        allowed = user.gate_ids()
        if not allowed:
            return None, Response({'detail': 'You are not assigned to any gate.'}, status=status.HTTP_403_FORBIDDEN)
        if requested_gate is not None:
            if requested_gate.id not in allowed:
                return None, Response({'detail': 'You are not assigned to that gate.'}, status=status.HTTP_403_FORBIDDEN)
            return requested_gate, None
        if len(allowed) == 1:
            return user.assigned_gates.first(), None
        return None, Response({'detail': 'Specify which of your assigned gates.'}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        serializer = NFCCampusEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['nfc_uid']
        gate, err = self.resolve_gate(request, serializer.validated_data.get('gate'))
        if err is not None:
            return err

        try:
            card = NFCCard.objects.select_related(
                'student', 'student__college', 'student__school',
                'student__department', 'student__program',
            ).get(uid=uid)
        except NFCCard.DoesNotExist:
            return Response({'detail': 'NFC card not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not card.is_active:
            return Response({'detail': 'NFC card is not active.', 'status': card.status}, status=status.HTTP_403_FORBIDDEN)

        open_entry = CampusEntry.objects.filter(
            student=card.student, status=CampusEntry.STATUS_ENTERED
        ).first()

        if open_entry:
            open_entry.exit_time = timezone.now()
            open_entry.status = CampusEntry.STATUS_EXITED
            open_entry.save()
            entry, action = open_entry, 'exit'
        else:
            entry = CampusEntry.objects.create(
                student=card.student, nfc_card=card, gate=gate,
                status=CampusEntry.STATUS_ENTERED,
            )
            action = 'entry'

        return Response({
            'action': action,
            'student': StudentSerializer(card.student, context={'request': request}).data,
            'entry': CampusEntrySerializer(entry).data,
        })


class AttendanceSummaryView(APIView):
    """Attendance statistics for dashboard. Gate figures are scoped to a guard's gates."""
    permission_classes = [IsStaff]

    def get(self, request):
        today = timezone.localdate()
        entries = CampusEntry.objects.filter(entry_time__date=today)
        if not request.user.sees_all_gates:
            entries = entries.filter(gate_id__in=request.user.gate_ids())

        return Response({
            'today_entries': entries.count(),
            'students_on_campus': entries.filter(status=CampusEntry.STATUS_ENTERED).count(),
            'open_sessions': AttendanceSession.objects.filter(is_open=True).count(),
            'total_records_today': AttendanceRecord.objects.filter(check_in_time__date=today).count(),
        })
