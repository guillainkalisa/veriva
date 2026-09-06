from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from accounts.permissions import IsAdminOrReadOnly

from .models import Directorate
from .serializers import DirectorateSerializer


class DirectorateViewSet(ModelViewSet):
    queryset = Directorate.objects.filter(is_active=True).order_by('name')
    serializer_class = DirectorateSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['wing', 'is_active']
    search_fields = ['name', 'code']
