from django.contrib import admin
from .models import Course, AttendanceSession, AttendanceRecord, CampusEntry


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'department', 'lecturer', 'is_active']
    list_filter = ['is_active', 'department']
    search_fields = ['name', 'code']


@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ['course', 'date', 'start_time', 'room', 'is_open']
    list_filter = ['is_open', 'date']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'session', 'check_in_time', 'method']
    list_filter = ['method']
    search_fields = ['student__full_name', 'student__registration_number']


@admin.register(CampusEntry)
class CampusEntryAdmin(admin.ModelAdmin):
    list_display = ['student', 'entry_time', 'exit_time', 'gate', 'status']
    list_filter = ['status', 'gate']
    search_fields = ['student__full_name']
