from django.conf import settings
from django.db import models
from django.utils import timezone
from students.models import Student
from campus.models import Directorate, Gate


class Device(models.Model):
    owner = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='devices')
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=200, unique=True)
    color = models.CharField(max_length=50, blank=True)
    specifications = models.TextField(blank=True)
    qr_code = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    qr_data = models.CharField(max_length=500, unique=True, blank=True)
    managing_directorate = models.ForeignKey(
        Directorate, on_delete=models.SET_NULL, null=True, blank=True, related_name='devices'
    )
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-registered_at']

    def __str__(self):
        return f'{self.brand} {self.model} (SN: {self.serial_number})'

    def active_loan(self):
        now = timezone.now()
        return self.loans.filter(is_active=True, start_date__lte=now, end_date__gte=now).first()


class DeviceLoan(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='loans')
    borrower = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='borrowed_devices')
    lender = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='lent_devices')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    reason = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.device} loaned to {self.borrower.full_name}'

    @property
    def is_expired(self):
        return timezone.now() > self.end_date


class DeviceCheck(models.Model):
    """One gate check of a person and/or a device, kept as an audit trail of
    devices leaving campus."""
    OUTCOME_OWNER = 'owner'
    OUTCOME_BORROWER = 'borrower'
    OUTCOME_MISMATCH = 'mismatch'
    OUTCOME_STUDENT_ONLY = 'student_only'
    OUTCOME_DEVICE_ONLY = 'device_only'

    OUTCOME_CHOICES = [
        (OUTCOME_OWNER, 'Registered owner'),
        (OUTCOME_BORROWER, 'Authorised borrower'),
        (OUTCOME_MISMATCH, 'Mismatch'),
        (OUTCOME_STUDENT_ONLY, 'Student only'),
        (OUTCOME_DEVICE_ONLY, 'Device only'),
    ]

    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='device_checks')
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, blank=True, related_name='checks')
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES, db_index=True)
    # How the person was identified: card token, card serial, or a typed registration number.
    identified_by = models.CharField(max_length=20, blank=True)
    gate = models.ForeignKey(Gate, on_delete=models.SET_NULL, null=True, related_name='device_checks')
    checked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='device_checks')
    checked_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-checked_at']

    def __str__(self):
        return f'{self.get_outcome_display()} at {self.gate} ({self.checked_at:%Y-%m-%d %H:%M})'
