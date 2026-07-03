from django.db import models
from django.utils import timezone


class Student(models.Model):
    YEAR_CHOICES = [(i, f'Year {i}') for i in range(1, 6)]

    registration_number = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    college = models.CharField(max_length=200)
    department = models.CharField(max_length=200)
    program = models.CharField(max_length=200)
    year_of_study = models.IntegerField(choices=YEAR_CHOICES, default=1)
    photo = models.ImageField(upload_to='students/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return f'{self.full_name} ({self.registration_number})'


class NFCCard(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_LOST = 'lost'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INACTIVE, 'Inactive'),
        (STATUS_LOST, 'Lost/Stolen'),
    ]

    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='nfc_card')
    uid = models.CharField(max_length=100, unique=True)
    issued_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    deactivation_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-issued_date']

    def __str__(self):
        return f'NFC Card [{self.uid}] - {self.student.full_name}'

    def deactivate(self, reason=''):
        self.status = self.STATUS_INACTIVE
        self.deactivated_at = timezone.now()
        self.deactivation_reason = reason
        self.save()

    def report_lost(self, reason='Lost or stolen'):
        self.status = self.STATUS_LOST
        self.deactivated_at = timezone.now()
        self.deactivation_reason = reason
        self.save()

    @property
    def is_active(self):
        return self.status == self.STATUS_ACTIVE
