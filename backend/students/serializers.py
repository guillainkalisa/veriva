from rest_framework import serializers
from .models import Student, NFCCard


class NFCCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = NFCCard
        fields = ['id', 'uid', 'issued_date', 'status', 'deactivated_at', 'deactivation_reason', 'is_active']
        read_only_fields = ['issued_date', 'deactivated_at', 'is_active']


class StudentSerializer(serializers.ModelSerializer):
    nfc_card = NFCCardSerializer(read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'registration_number', 'full_name', 'email', 'phone',
            'college', 'department', 'program', 'year_of_study',
            'photo', 'photo_url', 'is_active', 'created_at', 'updated_at', 'nfc_card'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None


class StudentListSerializer(serializers.ModelSerializer):
    has_nfc = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'registration_number', 'full_name', 'email',
            'college', 'department', 'year_of_study', 'is_active', 'has_nfc', 'photo_url'
        ]

    def get_has_nfc(self, obj):
        return hasattr(obj, 'nfc_card') and obj.nfc_card.is_active

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None


class NFCCardCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NFCCard
        fields = ['uid']

    def validate_uid(self, value):
        if NFCCard.objects.filter(uid=value, status=NFCCard.STATUS_ACTIVE).exists():
            raise serializers.ValidationError('This NFC UID is already assigned to an active card.')
        return value


class NFCCardStatusSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['deactivate', 'report_lost', 'reactivate'])
    reason = serializers.CharField(required=False, allow_blank=True)
