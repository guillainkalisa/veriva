from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.utils import timezone
from accounts.permissions import IsAdmin, IsAdminOrSecurity, IsAdminOrReadOnly

from campus.gates import resolve_gate
from students.models import NFCCard, Student
from students.serializers import StudentSerializer

from .models import Device, DeviceCheck, DeviceLoan
from .serializers import DeviceSerializer, DeviceLoanSerializer, DeviceVerifySerializer, GateCheckSerializer
from .utils import find_device_by_qr, generate_qr_code


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
    permission_classes = [IsAdminOrSecurity]

    def post(self, request):
        serializer = DeviceVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        device = find_device_by_qr(serializer.validated_data['qr_data'])
        active_loan = device.active_loan()

        return Response({
            'device': DeviceSerializer(device, context={'request': request}).data,
            'owner': StudentSerializer(device.owner, context={'request': request}).data,
            'active_loan': DeviceLoanSerializer(active_loan).data if active_loan else None,
            'verified': True,
        })


def identify_student(value):
    """The student behind a card tap (token or chip serial) or a typed
    registration number, as (student, identified_by)."""
    card = NFCCard.objects.select_related('student').filter(NFCCard.scan_filter(value)).first()
    if card:
        if not card.is_active:
            raise PermissionDenied(f'This NFC card is {card.get_status_display().lower()}.')
        return card.student, card.scan_method(value)

    student = Student.objects.filter(registration_number=value.upper()).first()
    if student:
        return student, 'registration_number'
    raise NotFound('No student card or registration number matches.')


class GateCheckView(APIView):
    """Check a person and/or a device at a gate. With both, decides whether the
    person may take the device: its owner, or the borrower on an active loan."""
    permission_classes = [IsAdminOrSecurity]

    def post(self, request):
        serializer = GateCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        gate, err = resolve_gate(request.user, data.get('gate'))
        if err is not None:
            return err

        student = identified_by = device = active_loan = None
        if data.get('student', '').strip():
            student, identified_by = identify_student(data['student'].strip())
        if data.get('qr_data', '').strip():
            device = find_device_by_qr(data['qr_data'].strip())
            active_loan = device.active_loan()

        if student and device:
            if device.owner_id == student.id:
                outcome = DeviceCheck.OUTCOME_OWNER
            elif active_loan and active_loan.borrower_id == student.id:
                outcome = DeviceCheck.OUTCOME_BORROWER
            else:
                outcome = DeviceCheck.OUTCOME_MISMATCH
        elif student:
            outcome = DeviceCheck.OUTCOME_STUDENT_ONLY
        else:
            outcome = DeviceCheck.OUTCOME_DEVICE_ONLY

        check = DeviceCheck.objects.create(
            student=student, device=device, outcome=outcome, identified_by=identified_by or '',
            gate=gate, checked_by=request.user,
        )

        context = {'request': request}
        response = {
            'check_id': check.id,
            'outcome': outcome,
            'identified_by': identified_by,
            'gate': {'id': gate.id, 'name': gate.name},
            'student': StudentSerializer(student, context=context).data if student else None,
            'device': DeviceSerializer(device, context=context).data if device else None,
            'owner': StudentSerializer(device.owner, context=context).data if device else None,
            'active_loan': DeviceLoanSerializer(active_loan).data if active_loan else None,
        }
        if outcome == DeviceCheck.OUTCOME_STUDENT_ONLY:
            now = timezone.now()
            devices = Device.objects.filter(
                Q(owner=student) | Q(
                    loans__borrower=student, loans__is_active=True,
                    loans__start_date__lte=now, loans__end_date__gte=now,
                ),
                is_active=True,
            ).distinct()
            response['devices'] = DeviceSerializer(devices, many=True, context=context).data
        return Response(response)
