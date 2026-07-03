import json
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from accounts.permissions import IsAdmin, IsAdminOrReadOnly, IsAdminOrSecurity

from .models import Device, DeviceLoan
from .serializers import DeviceSerializer, DeviceLoanSerializer, DeviceVerifySerializer
from .utils import generate_qr_code
from students.serializers import StudentSerializer


class DeviceViewSet(ModelViewSet):
    queryset = Device.objects.select_related('owner').prefetch_related('loans').all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'brand', 'owner']
    search_fields = ['brand', 'model', 'serial_number', 'owner__full_name', 'owner__registration_number']
    ordering_fields = ['brand', 'registered_at']

    def perform_create(self, serializer):
        device = serializer.save()
        device = generate_qr_code(device)
        device.save()

    @action(detail=True, methods=['post'], url_path='regenerate-qr')
    def regenerate_qr(self, request, pk=None):
        device = self.get_object()
        device = generate_qr_code(device)
        device.save()
        return Response(DeviceSerializer(device, context={'request': request}).data)


class DeviceLoanViewSet(ModelViewSet):
    queryset = DeviceLoan.objects.select_related('device', 'borrower', 'lender').all()
    serializer_class = DeviceLoanSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'device', 'borrower']
    ordering_fields = ['created_at', 'end_date']

    @action(detail=True, methods=['post'], url_path='close')
    def close_loan(self, request, pk=None):
        loan = self.get_object()
        loan.is_active = False
        loan.save()
        return Response({'detail': 'Loan closed successfully.'})


class DeviceVerifyView(APIView):
    """Verify device ownership by scanning QR data."""

    def post(self, request):
        serializer = DeviceVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_data = serializer.validated_data['qr_data']

        try:
            payload = json.loads(qr_data)
        except (json.JSONDecodeError, ValueError):
            return Response({'detail': 'Invalid QR code format.'}, status=status.HTTP_400_BAD_REQUEST)

        if not payload.get('veriva_device'):
            return Response({'detail': 'Not a VERIVA device QR code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            device = Device.objects.select_related('owner').get(
                serial_number=payload.get('serial'),
                qr_data=qr_data
            )
        except Device.DoesNotExist:
            return Response({'detail': 'Device not found or QR code mismatch.'}, status=status.HTTP_404_NOT_FOUND)

        active_loan = device.loans.filter(is_active=True, end_date__gte=timezone.now()).first()

        return Response({
            'device': DeviceSerializer(device, context={'request': request}).data,
            'owner': StudentSerializer(device.owner, context={'request': request}).data,
            'active_loan': DeviceLoanSerializer(active_loan).data if active_loan else None,
            'verified': True,
        })
