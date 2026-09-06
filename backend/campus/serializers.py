from rest_framework import serializers
from .models import Directorate


class DirectorateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Directorate
        fields = ['id', 'name', 'code', 'wing', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']
