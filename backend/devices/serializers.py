from rest_framework import serializers
from django.utils import timezone
from .models import Device, DeviceLoan
from students.serializers import StudentListSerializer


class DeviceSerializer(serializers.ModelSerializer):
    owner_detail = StudentListSerializer(source='owner', read_only=True)
    qr_code_url = serializers.SerializerMethodField()
    active_loan = serializers.SerializerMethodField()
    managing_directorate_name = serializers.CharField(source='managing_directorate.name', read_only=True)

    class Meta:
        model = Device
        fields = [
            'id', 'owner', 'owner_detail', 'brand', 'model', 'serial_number',
            'color', 'specifications', 'qr_code', 'qr_code_url', 'qr_data',
            'managing_directorate', 'managing_directorate_name',
            'is_active', 'registered_at', 'updated_at', 'active_loan'
        ]
        read_only_fields = ['qr_code', 'qr_data', 'registered_at', 'updated_at']

    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
        return None

    def get_active_loan(self, obj):
        loan = obj.loans.filter(is_active=True, end_date__gte=timezone.now()).first()
        if loan:
            return DeviceLoanSerializer(loan).data
        return None


class DeviceLoanSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source='borrower.full_name', read_only=True)
    lender_name = serializers.CharField(source='lender.full_name', read_only=True)
    device_info = serializers.SerializerMethodField()

    class Meta:
        model = DeviceLoan
        fields = [
            'id', 'device', 'device_info', 'borrower', 'borrower_name',
            'lender', 'lender_name', 'start_date', 'end_date', 'reason',
            'is_active', 'is_expired', 'created_at'
        ]
        read_only_fields = ['created_at', 'is_expired']

    def get_device_info(self, obj):
        return f'{obj.device.brand} {obj.device.model}'

    def validate(self, data):
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError('End date must be after start date.')
        if data.get('borrower') == data.get('lender'):
            raise serializers.ValidationError('Borrower and lender must be different students.')
        return data


class DeviceVerifySerializer(serializers.Serializer):
    qr_data = serializers.CharField()
