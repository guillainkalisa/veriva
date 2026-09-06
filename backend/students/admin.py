from django.contrib import admin
from .models import Student, NFCCard, College, School, Department, Program


class NFCCardInline(admin.StackedInline):
    model = NFCCard
    extra = 0


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['registration_number', 'full_name', 'college', 'department', 'program', 'year_of_study', 'is_active']
    list_filter = ['is_active', 'college', 'school', 'department', 'year_of_study']
    search_fields = ['full_name', 'registration_number', 'email']
    list_select_related = ['college', 'school', 'department', 'program']
    inlines = [NFCCardInline]


@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'college', 'is_active']
    list_filter = ['is_active', 'college']
    search_fields = ['name', 'code']
    list_select_related = ['college']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'school', 'is_active']
    list_filter = ['is_active', 'school']
    search_fields = ['name', 'code']
    list_select_related = ['school']


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'department', 'level', 'duration_years', 'is_active']
    list_filter = ['is_active', 'level', 'department']
    search_fields = ['name', 'code']
    list_select_related = ['department']


@admin.register(NFCCard)
class NFCCardAdmin(admin.ModelAdmin):
    list_display = ['uid', 'student', 'status', 'issued_date']
    list_filter = ['status']
    search_fields = ['uid', 'student__full_name', 'student__registration_number']
