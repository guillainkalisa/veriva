from rest_framework import serializers
from .models import Directorate, Gate


class DirectorateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Directorate
        fields = ['id', 'name', 'code', 'wing', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class GateSerializer(serializers.ModelSerializer):
    guard_count = serializers.IntegerField(source='guards.count', read_only=True)

    class Meta:
        model = Gate
        fields = ['id', 'name', 'code', 'location', 'is_active', 'guard_count', 'created_at']
        read_only_fields = ['created_at']
