from django.contrib import admin
from .models import Student, NFCCard


class NFCCardInline(admin.StackedInline):
    model = NFCCard
    extra = 0


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['registration_number', 'full_name', 'college', 'department', 'year_of_study', 'is_active']
    list_filter = ['is_active', 'college', 'year_of_study']
    search_fields = ['full_name', 'registration_number', 'email']
    inlines = [NFCCardInline]


@admin.register(NFCCard)
class NFCCardAdmin(admin.ModelAdmin):
    list_display = ['uid', 'student', 'status', 'issued_date']
    list_filter = ['status']
    search_fields = ['uid', 'student__full_name', 'student__registration_number']
