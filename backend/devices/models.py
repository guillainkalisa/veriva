from django.db import models
from django.utils import timezone
from students.models import Student


class Device(models.Model):
    owner = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='devices')
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=200, unique=True)
    color = models.CharField(max_length=50, blank=True)
    specifications = models.TextField(blank=True)
    qr_code = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    qr_data = models.CharField(max_length=500, unique=True, blank=True)
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-registered_at']

    def __str__(self):
        return f'{self.brand} {self.model} (SN: {self.serial_number})'


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
