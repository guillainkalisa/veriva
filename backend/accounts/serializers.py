from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from campus.models import Gate
from students.models import Department, School
from .models import CustomUser


def gate_summary(user):
    return [{'id': g.id, 'name': g.name} for g in user.assigned_gates.all()]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.get_full_name()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'full_name': self.user.get_full_name(),
            'email': self.user.email,
            'role': self.user.role,
            'phone': self.user.phone,
            'assigned_gates': gate_summary(self.user),
            'assigned_department': self.user.assigned_department_id,
            'assigned_department_name': self.user.assigned_department.name if self.user.assigned_department else None,
            'assigned_school': self.user.assigned_school_id,
            'assigned_school_name': self.user.assigned_school.name if self.user.assigned_school else None,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    assigned_gates = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Gate.objects.all(), required=False
    )
    assigned_gate_names = serializers.SerializerMethodField()
    assigned_department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), required=False, allow_null=True
    )
    assigned_department_name = serializers.CharField(source='assigned_department.name', read_only=True)
    assigned_school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), required=False, allow_null=True
    )
    assigned_school_name = serializers.CharField(source='assigned_school.name', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone',
            'assigned_gates', 'assigned_gate_names',
            'assigned_department', 'assigned_department_name',
            'assigned_school', 'assigned_school_name',
            'is_active', 'date_joined',
        ]
        read_only_fields = ['date_joined']

    def get_assigned_gate_names(self, obj):
        return [g.name for g in obj.assigned_gates.all()]


class MeSerializer(serializers.ModelSerializer):
    """The signed-in user editing their own profile. Role, gates and status are
    read-only here — only an admin can change those (via /auth/users/)."""
    assigned_gate_names = serializers.SerializerMethodField()
    assigned_department_name = serializers.CharField(source='assigned_department.name', read_only=True)
    assigned_school_name = serializers.CharField(source='assigned_school.name', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone',
            'assigned_gate_names', 'assigned_department', 'assigned_department_name',
            'assigned_school', 'assigned_school_name', 'is_active', 'date_joined',
        ]
        read_only_fields = [
            'id', 'username', 'email', 'role', 'assigned_gate_names',
            'assigned_department', 'assigned_department_name',
            'assigned_school', 'assigned_school_name', 'is_active', 'date_joined',
        ]

    def get_assigned_gate_names(self, obj):
        return [g.name for g in obj.assigned_gates.all()]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    assigned_gates = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Gate.objects.all(), required=False
    )
    assigned_department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), required=False, allow_null=True
    )
    assigned_school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = CustomUser
        fields = [
            'username', 'first_name', 'last_name', 'email', 'role', 'phone', 'password',
            'assigned_gates', 'assigned_department', 'assigned_school',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        gates = validated_data.pop('assigned_gates', [])
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        if gates:
            user.assigned_gates.set(gates)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
