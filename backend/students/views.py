from rest_framework import generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from accounts.permissions import IsAdmin, IsAdminOrReadOnly

from .models import Student, NFCCard
from .serializers import (
    StudentSerializer, StudentListSerializer,
    NFCCardSerializer, NFCCardCreateSerializer, NFCCardStatusSerializer
)


class StudentViewSet(ModelViewSet):
    queryset = Student.objects.select_related('nfc_card').all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'college', 'department', 'year_of_study']
    search_fields = ['full_name', 'registration_number', 'email', 'phone']
    ordering_fields = ['full_name', 'registration_number', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        return StudentSerializer

    @action(detail=True, methods=['post'], url_path='assign-nfc', permission_classes=[IsAdmin])
    def assign_nfc(self, request, pk=None):
        student = self.get_object()
        if hasattr(student, 'nfc_card') and student.nfc_card.is_active:
            return Response(
                {'detail': 'Student already has an active NFC card.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = NFCCardCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if hasattr(student, 'nfc_card'):
            nfc = student.nfc_card
            nfc.uid = serializer.validated_data['uid']
            nfc.status = NFCCard.STATUS_ACTIVE
            nfc.deactivated_at = None
            nfc.deactivation_reason = ''
            nfc.save()
        else:
            NFCCard.objects.create(student=student, uid=serializer.validated_data['uid'])

        return Response({'detail': 'NFC card assigned successfully.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='nfc-status', permission_classes=[IsAdmin])
    def nfc_status(self, request, pk=None):
        student = self.get_object()
        if not hasattr(student, 'nfc_card'):
            return Response({'detail': 'No NFC card found for this student.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = NFCCardStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nfc = student.nfc_card
        action_type = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '')

        if action_type == 'deactivate':
            nfc.deactivate(reason)
        elif action_type == 'report_lost':
            nfc.report_lost(reason)
        elif action_type == 'reactivate':
            nfc.status = NFCCard.STATUS_ACTIVE
            nfc.deactivated_at = None
            nfc.deactivation_reason = ''
            nfc.save()

        return Response(NFCCardSerializer(nfc).data)


class NFCLookupView(APIView):
    """Public endpoint for NFC reader to verify a card tap."""

    def get(self, request):
        uid = request.query_params.get('uid')
        if not uid:
            return Response({'detail': 'UID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            card = NFCCard.objects.select_related('student').get(uid=uid)
        except NFCCard.DoesNotExist:
            return Response({'detail': 'Card not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not card.is_active:
            return Response({'detail': 'Card is not active.', 'status': card.status}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'card_status': card.status,
            'student': StudentSerializer(card.student, context={'request': request}).data,
        })
