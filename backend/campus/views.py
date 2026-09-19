from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from accounts.permissions import IsAdminOrReadOnly

from .models import Directorate, Gate
from .serializers import DirectorateSerializer, GateSerializer


class DirectorateViewSet(ModelViewSet):
    queryset = Directorate.objects.filter(is_active=True).order_by('name')
    serializer_class = DirectorateSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['wing', 'is_active']
    search_fields = ['name', 'code']


class GateViewSet(ModelViewSet):
    queryset = Gate.objects.prefetch_related('guards').order_by('name')
    serializer_class = GateSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'location']
