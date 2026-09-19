from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'get_full_name', 'email', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    filter_horizontal = UserAdmin.filter_horizontal + ('assigned_gates',)
    fieldsets = UserAdmin.fieldsets + (
        ('VERIVA', {'fields': ('role', 'phone', 'assigned_gates')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('VERIVA', {'fields': ('role', 'phone')}),
    )
