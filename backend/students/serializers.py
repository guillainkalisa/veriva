from rest_framework import serializers
from .models import Student, NFCCard, College, School, Department, Program


class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = ['id', 'name', 'code', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class SchoolSerializer(serializers.ModelSerializer):
    college_name = serializers.CharField(source='college.name', read_only=True)

    class Meta:
        model = School
        fields = ['id', 'college', 'college_name', 'name', 'code', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class DepartmentSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    college_name = serializers.CharField(source='school.college.name', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'school', 'school_name', 'college_name', 'name', 'code', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class ProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    school_name = serializers.CharField(source='department.school.name', read_only=True)

    class Meta:
        model = Program
        fields = ['id', 'department', 'department_name', 'school_name', 'name', 'code', 'level', 'duration_years', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class NFCCardSerializer(serializers.ModelSerializer):
    decrypted_registration_number = serializers.SerializerMethodField()

    class Meta:
        model = NFCCard
        fields = [
            'id', 'uid', 'card_serial', 'issued_date', 'status', 'deactivated_at',
            'deactivation_reason', 'is_active', 'decrypted_registration_number',
        ]
        read_only_fields = ['issued_date', 'deactivated_at', 'is_active']

    def get_decrypted_registration_number(self, obj):
        return obj.decrypted_registration_number()

    def to_representation(self, instance):
        # The token and the chip serial are what a gate accepts, so anyone
        # holding them can clone the card. Only admins (who issue cards) see them.
        data = super().to_representation(instance)
        request = self.context.get('request')
        if getattr(getattr(request, 'user', None), 'role', None) != 'admin':
            data.pop('uid')
            data.pop('card_serial')
        return data


class StudentSerializer(serializers.ModelSerializer):
    nfc_card = NFCCardSerializer(read_only=True)
    photo_url = serializers.SerializerMethodField()

    college_name = serializers.CharField(source='college.name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    program_level = serializers.CharField(source='program.level', read_only=True)
    full_organization = serializers.CharField(read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'registration_number', 'full_name', 'email', 'phone',
            'college', 'college_name',
            'school', 'school_name',
            'department', 'department_name',
            'program', 'program_name', 'program_level',
            'year_of_study', 'admission_date',
            'photo', 'photo_url',
            'is_active', 'full_organization',
            'created_at', 'updated_at', 'nfc_card',
        ]
        read_only_fields = ['created_at', 'updated_at', 'admission_date']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return None


class StudentListSerializer(serializers.ModelSerializer):
    has_nfc = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    college_name = serializers.CharField(source='college.name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'registration_number', 'full_name', 'email', 'phone',
            'college', 'school', 'department', 'program',
            'college_name', 'school_name', 'department_name', 'program_name',
            'year_of_study', 'is_active', 'has_nfc', 'photo_url', 'admission_date',
        ]

    def get_has_nfc(self, obj):
        return hasattr(obj, 'nfc_card') and obj.nfc_card.is_active

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return None


class StudentMinimalSerializer(serializers.ModelSerializer):
    """For finding someone to enroll, not for browsing their record."""
    program_name = serializers.CharField(source='program.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'full_name', 'registration_number', 'department_name', 'program_name', 'year_of_study']


class StudentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id', 'registration_number', 'full_name', 'email', 'phone',
            'college', 'school', 'department', 'program',
            'year_of_study', 'photo', 'is_active',
        ]
        extra_kwargs = {'is_active': {'required': False, 'default': True}}

    def validate(self, data):
        college = data.get('college')
        school = data.get('school')
        department = data.get('department')
        program = data.get('program')

        if school and college and school.college_id != college.id:
            raise serializers.ValidationError('School does not belong to the selected college.')
        if department and school and department.school_id != school.id:
            raise serializers.ValidationError('Department does not belong to the selected school.')
        if program and department and program.department_id != department.id:
            raise serializers.ValidationError('Programme does not belong to the selected department.')

        return data


class NFCCardIssueSerializer(serializers.Serializer):
    card_serial = serializers.RegexField(
        r'^[0-9A-Fa-f]+$', max_length=32,
        error_messages={'invalid': 'Enter the serial exactly as the USB reader shows it, with no spaces or colons.'},
    )

    def validate_card_serial(self, value):
        value = value.upper()
        if NFCCard.objects.filter(card_serial=value).exclude(student=self.context['student']).exists():
            raise serializers.ValidationError('This physical card is already assigned to another student.')
        return value


class NFCCardStatusSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['deactivate', 'report_lost', 'reactivate'])
    reason = serializers.CharField(required=False, allow_blank=True)
