from django.contrib import admin
from .models import Device, DeviceLoan


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['brand', 'model', 'serial_number', 'owner', 'is_active', 'registered_at']
    list_filter = ['is_active', 'brand']
    search_fields = ['brand', 'model', 'serial_number', 'owner__full_name']
    readonly_fields = ['qr_code', 'qr_data', 'registered_at', 'updated_at']


@admin.register(DeviceLoan)
class DeviceLoanAdmin(admin.ModelAdmin):
    list_display = ['device', 'borrower', 'lender', 'start_date', 'end_date', 'is_active']
    list_filter = ['is_active']
    search_fields = ['device__serial_number', 'borrower__full_name', 'lender__full_name']
