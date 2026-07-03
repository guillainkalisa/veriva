from rest_framework import serializers
from .models import Course, AttendanceSession, AttendanceRecord, CampusEntry
from students.serializers import StudentListSerializer
from accounts.serializers import UserSerializer


class CourseSerializer(serializers.ModelSerializer):
    lecturer_name = serializers.CharField(source='lecturer.get_full_name', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'lecturer', 'lecturer_name', 'department', 'is_active']


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
            'attendance_count', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_attendance_count(self, obj):
        return obj.records.count()


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_detail = StudentListSerializer(source='student', read_only=True)
    session_info = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'session', 'session_info', 'student', 'student_detail',
            'check_in_time', 'method', 'nfc_card', 'recorded_by'
        ]
        read_only_fields = ['check_in_time']

    def get_session_info(self, obj):
        return f'{obj.session.course.code} - {obj.session.date}'


class NFCAttendanceSerializer(serializers.Serializer):
    nfc_uid = serializers.CharField()
    session_id = serializers.IntegerField()


class CampusEntrySerializer(serializers.ModelSerializer):
    student_detail = StudentListSerializer(source='student', read_only=True)

    class Meta:
        model = CampusEntry
        fields = [
            'id', 'student', 'student_detail', 'nfc_card', 'entry_time',
            'exit_time', 'gate', 'status'
        ]
        read_only_fields = ['entry_time']


class NFCCampusEntrySerializer(serializers.Serializer):
    nfc_uid = serializers.CharField()
    gate = serializers.CharField(required=False, default='Main Gate')
