from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from accounts.permissions import IsAdmin, IsAdminOrSecurity, IsAdminOrReadOnly

from .models import Student, NFCCard, College, School, Department, Program
from .crypto import encrypt_registration_number
from .serializers import (
    StudentSerializer, StudentListSerializer, StudentCreateUpdateSerializer,
    NFCCardSerializer, NFCCardIssueSerializer, NFCCardStatusSerializer,
    CollegeSerializer, SchoolSerializer, DepartmentSerializer, ProgramSerializer
)


class CollegeViewSet(ModelViewSet):
    queryset = College.objects.filter(is_active=True).order_by('name')
    serializer_class = CollegeSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']


class SchoolViewSet(ModelViewSet):
    queryset = School.objects.select_related('college').filter(is_active=True).order_by('college', 'name')
    serializer_class = SchoolSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['college', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'college']


class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.select_related('school', 'school__college').filter(is_active=True).order_by('school', 'name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['school', 'school__college', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'school']


class ProgramViewSet(ModelViewSet):
    queryset = Program.objects.select_related('department', 'department__school').filter(is_active=True).order_by('department', 'name')
    serializer_class = ProgramSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'level', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'level', 'department']


class StudentViewSet(ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'registration_number', 'college', 'school', 'department', 'program', 'year_of_study']
    search_fields = ['full_name', 'registration_number', 'email', 'phone']
    ordering_fields = ['full_name', 'registration_number', 'created_at', 'admission_date']
    ordering = ['-admission_date']

    def get_queryset(self):
        qs = Student.objects.select_related(
            'college', 'school', 'department', 'program', 'nfc_card'
        )
        if self.request.user.role == 'lecturer':
            qs = qs.filter(
                course_enrollments__course__lecturer=self.request.user,
                course_enrollments__is_active=True,
            ).distinct()
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return StudentCreateUpdateSerializer
        return StudentSerializer

    @action(detail=True, methods=['post'], url_path='assign-nfc', permission_classes=[IsAdmin])
    def assign_nfc(self, request, pk=None):
        student = self.get_object()
        if hasattr(student, 'nfc_card') and student.nfc_card.is_active:
            return Response(
                {'detail': 'Student already has an active NFC card.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = NFCCardIssueSerializer(data=request.data, context={'student': student})
        serializer.is_valid(raise_exception=True)
        card_serial = serializer.validated_data['card_serial']

        token = encrypt_registration_number(student.registration_number)
        if hasattr(student, 'nfc_card'):
            card = student.nfc_card
            card.uid = token
            card.card_serial = card_serial
            card.status = NFCCard.STATUS_ACTIVE
            card.deactivated_at = None
            card.deactivation_reason = ''
            card.save()
        else:
            card = NFCCard.objects.create(student=student, uid=token, card_serial=card_serial)

        return Response(
            NFCCardSerializer(card, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

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

        return Response(NFCCardSerializer(nfc, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        department_id = request.query_params.get('department_id')
        if not department_id:
            return Response({'detail': 'department_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset().filter(department_id=department_id)
        year = request.query_params.get('year')
        if year:
            queryset = queryset.filter(year_of_study=year)

        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=False, methods=['get'])
    def by_program(self, request):
        program_id = request.query_params.get('program_id')
        if not program_id:
            return Response({'detail': 'program_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset().filter(program_id=program_id)
        year = request.query_params.get('year')
        if year:
            queryset = queryset.filter(year_of_study=year)

        return Response(self.get_serializer(queryset, many=True).data)


class NFCLookupView(APIView):
    """Look up a student by their NFC card UID."""
    permission_classes = [IsAdminOrSecurity]

    def get(self, request):
        uid = request.query_params.get('uid')
        if not uid:
            return Response({'detail': 'UID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            card = NFCCard.objects.select_related(
                'student', 'student__college', 'student__school',
                'student__department', 'student__program',
            ).get(NFCCard.scan_filter(uid))
        except NFCCard.DoesNotExist:
            return Response({'detail': 'Card not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not card.is_active:
            return Response({'detail': 'Card is not active.', 'status': card.status}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'card_status': card.status,
            'scan_method': card.scan_method(uid),
            'student': StudentSerializer(card.student, context={'request': request}).data,
        })
