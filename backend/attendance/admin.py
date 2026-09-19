from django.contrib import admin
from .models import Course, AttendanceSession, AttendanceRecord, CampusEntry, CourseEnrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'department', 'lecturer', 'min_attendance_percent', 'is_active']
    list_filter = ['is_active', 'department']
    search_fields = ['name', 'code']


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'is_active', 'enrolled_at']
    list_filter = ['is_active', 'course']
    search_fields = ['student__full_name', 'course__code']


@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ['course', 'date', 'start_time', 'room', 'track_mode', 'is_open']
    list_filter = ['is_open', 'track_mode', 'date']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'session', 'check_in_time', 'check_out_time', 'method']
    list_filter = ['method']
    search_fields = ['student__full_name', 'student__registration_number']


@admin.register(CampusEntry)
class CampusEntryAdmin(admin.ModelAdmin):
    list_display = ['student', 'entry_time', 'exit_time', 'gate', 'status']
    list_filter = ['status', 'gate']
    search_fields = ['student__full_name']
