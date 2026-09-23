from rest_framework import serializers
from .models import Course, AttendanceSession, AttendanceRecord, CampusEntry, CourseEnrollment
from campus.models import Gate
from students.serializers import StudentListSerializer


class CourseSerializer(serializers.ModelSerializer):
    lecturer_name = serializers.CharField(source='lecturer.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'lecturer', 'lecturer_name', 'department', 'department_name',
            'is_active', 'min_attendance_percent',
        ]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and getattr(request.user, 'role', None) == 'lecturer':
            # A lecturer only ever adjusts their own attendance threshold -
            # identity, assignment and status are admin/HoD/dean decisions.
            for name in ('name', 'code', 'department', 'lecturer', 'is_active'):
                fields[name].read_only = True
        return fields


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    student_detail = StudentListSerializer(source='student', read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'course', 'student', 'student_detail', 'is_active', 'enrolled_at']
        read_only_fields = ['enrolled_at']


class AttendanceSessionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    attendance_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'course', 'course_name', 'course_code', 'date', 'start_time',
            'end_time', 'room', 'created_by', 'created_by_name', 'is_open',
            'track_mode', 'attendance_count', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_attendance_count(self, obj):
        return obj.records.count()


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_detail = StudentListSerializer(source='student', read_only=True)
    session_info = serializers.SerializerMethodField()
    counted_minutes = serializers.ReadOnlyField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'session', 'session_info', 'student', 'student_detail',
            'check_in_time', 'check_out_time', 'counted_minutes', 'method',
            'nfc_card', 'recorded_by'
        ]
        read_only_fields = ['check_in_time']

    def get_session_info(self, obj):
        return f'{obj.session.course.code} - {obj.session.date}'


class NFCAttendanceSerializer(serializers.Serializer):
    nfc_uid = serializers.CharField()
    session_id = serializers.IntegerField()


class CampusEntrySerializer(serializers.ModelSerializer):
    student_detail = StudentListSerializer(source='student', read_only=True)
    gate_name = serializers.CharField(source='gate.name', read_only=True)

    class Meta:
        model = CampusEntry
        fields = [
            'id', 'student', 'student_detail', 'nfc_card', 'entry_time',
            'exit_time', 'gate', 'gate_name', 'status'
        ]
        read_only_fields = ['entry_time']


class NFCCampusEntrySerializer(serializers.Serializer):
    nfc_uid = serializers.CharField()
    # Which gate the tap is for. Optional: a guard assigned to exactly one gate
    # doesn't need to send it; the view resolves and enforces it.
    gate = serializers.PrimaryKeyRelatedField(
        queryset=Gate.objects.filter(is_active=True), required=False, allow_null=True,
    )
