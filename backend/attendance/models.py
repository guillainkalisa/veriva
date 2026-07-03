from django.db import models
from django.utils import timezone
from accounts.models import CustomUser
from students.models import Student, NFCCard


class Course(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    lecturer = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses'
    )
    department = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class AttendanceSession(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField(default=timezone.now)
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    room = models.CharField(max_length=50)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-start_time']

    def __str__(self):
        return f'{self.course.code} - {self.date} {self.start_time}'

    def close(self):
        self.is_open = False
        self.end_time = timezone.localtime(timezone.now()).time()
        self.save()


class AttendanceRecord(models.Model):
    METHOD_NFC = 'nfc'
    METHOD_MANUAL = 'manual'
    METHOD_CHOICES = [
        (METHOD_NFC, 'NFC Card'),
        (METHOD_MANUAL, 'Manual Entry'),
    ]

    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    check_in_time = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default=METHOD_NFC)
    nfc_card = models.ForeignKey(NFCCard, on_delete=models.SET_NULL, null=True, blank=True)
    recorded_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ['session', 'student']
        ordering = ['-check_in_time']

    def __str__(self):
        return f'{self.student.full_name} - {self.session}'


class CampusEntry(models.Model):
    STATUS_ENTERED = 'entered'
    STATUS_EXITED = 'exited'
    STATUS_CHOICES = [
        (STATUS_ENTERED, 'Entered'),
        (STATUS_EXITED, 'Exited'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='campus_entries')
    nfc_card = models.ForeignKey(NFCCard, on_delete=models.SET_NULL, null=True, blank=True)
    entry_time = models.DateTimeField(auto_now_add=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    gate = models.CharField(max_length=50, blank=True, default='Main Gate')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ENTERED)

    class Meta:
        ordering = ['-entry_time']

    def __str__(self):
        return f'{self.student.full_name} - {self.entry_time.strftime("%Y-%m-%d %H:%M")}'
