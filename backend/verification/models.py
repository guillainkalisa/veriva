from django.db import models
from django.utils import timezone
from accounts.models import CustomUser
from students.models import Student
from devices.models import Device


class IncidentReport(models.Model):
    TYPE_DEVICE_MISMATCH = 'device_mismatch'
    TYPE_CARD_SHARING = 'card_sharing'
    TYPE_UNAUTHORIZED_ENTRY = 'unauthorized_entry'
    TYPE_STOLEN_DEVICE = 'stolen_device'
    TYPE_STRANGER = 'stranger'
    TYPE_OTHER = 'other'

    TYPE_CHOICES = [
        (TYPE_DEVICE_MISMATCH, 'Device Ownership Mismatch'),
        (TYPE_CARD_SHARING, 'NFC Card Sharing Attempt'),
        (TYPE_UNAUTHORIZED_ENTRY, 'Unauthorized Campus Entry'),
        (TYPE_STOLEN_DEVICE, 'Stolen Device Report'),
        (TYPE_STRANGER, 'Unregistered Person on Campus'),
        (TYPE_OTHER, 'Other'),
    ]

    SEVERITY_LOW = 'low'
    SEVERITY_MEDIUM = 'medium'
    SEVERITY_HIGH = 'high'

    SEVERITY_CHOICES = [
        (SEVERITY_LOW, 'Low'),
        (SEVERITY_MEDIUM, 'Medium'),
        (SEVERITY_HIGH, 'High'),
    ]

    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default=SEVERITY_MEDIUM)
    description = models.TextField()
    reported_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, related_name='reported_incidents'
    )
    involved_student = models.ForeignKey(
        Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidents'
    )
    involved_device = models.ForeignKey(
        Device, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidents'
    )
    location = models.CharField(max_length=200, blank=True)
    is_resolved = models.BooleanField(default=False)
    resolution_notes = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_incidents'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_type_display()} - {self.created_at.strftime("%Y-%m-%d %H:%M")}'

    def resolve(self, user, notes=''):
        self.is_resolved = True
        self.resolved_by = user
        self.resolution_notes = notes
        self.resolved_at = timezone.now()
        self.save()
