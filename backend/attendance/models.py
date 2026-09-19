from datetime import datetime

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from accounts.models import CustomUser
from students.models import Student, NFCCard, Department
from campus.models import Gate


class Course(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    lecturer = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses'
    )
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, null=True, blank=True, related_name='courses'
    )
    is_active = models.BooleanField(default=True)
    # Minimum share of class time a student must accumulate to sit the exam.
    min_attendance_percent = models.PositiveSmallIntegerField(
        default=80, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class CourseEnrollment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='course_enrollments')
    is_active = models.BooleanField(default=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['course', 'student']
        ordering = ['student__full_name']

    def __str__(self):
        return f'{self.student.full_name} - {self.course.code}'


class AttendanceSession(models.Model):
    MODE_SINGLE = 'single'
    MODE_DOUBLE = 'double'
    TRACK_MODE_CHOICES = [
        (MODE_SINGLE, 'Single tap (in only)'),
        (MODE_DOUBLE, 'Double tap (in & out)'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField(default=timezone.now)
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    room = models.CharField(max_length=50)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    is_open = models.BooleanField(default=True)
    track_mode = models.CharField(max_length=10, choices=TRACK_MODE_CHOICES, default=MODE_SINGLE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-start_time']

    def __str__(self):
        return f'{self.course.code} - {self.date} {self.start_time}'

    def close(self):
        self.is_open = False
        self.end_time = timezone.localtime(timezone.now()).time()
        self.save()

    @property
    def scheduled_minutes(self):
        """Minutes this session is worth once it has closed; 0 while still open."""
        if not self.end_time:
            return 0
        start = datetime.combine(self.date, self.start_time)
        end = datetime.combine(self.date, self.end_time)
        return max(0, int((end - start).total_seconds() // 60))


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
    check_out_time = models.DateTimeField(null=True, blank=True)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default=METHOD_NFC)
    nfc_card = models.ForeignKey(NFCCard, on_delete=models.SET_NULL, null=True, blank=True)
    recorded_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ['session', 'student']
        ordering = ['-check_in_time']

    def __str__(self):
        return f'{self.student.full_name} - {self.session}'

    @property
    def counted_minutes(self):
        """Minutes this record contributes toward the student's course attendance.

        Single-tap sessions credit the whole session once it's closed. Double-tap
        sessions require a checkout; a tap-in with no checkout counts for nothing.
        """
        if self.session.track_mode == AttendanceSession.MODE_SINGLE:
            return self.session.scheduled_minutes
        if not self.check_out_time:
            return 0
        return max(0, int((self.check_out_time - self.check_in_time).total_seconds() // 60))


class CampusEntry(models.Model):
    STATUS_ENTERED = 'entered'
    STATUS_EXITED = 'exited'
    STATUS_CHOICES = [
        (STATUS_ENTERED, 'Entered'),
        (STATUS_EXITED, 'Exited'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='campus_entries')
    nfc_card = models.ForeignKey(NFCCard, on_delete=models.SET_NULL, null=True, blank=True)
    gate = models.ForeignKey(Gate, on_delete=models.PROTECT, related_name='entries', db_index=True)
    entry_time = models.DateTimeField(auto_now_add=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ENTERED, db_index=True)

    class Meta:
        ordering = ['-entry_time']
        indexes = [
            models.Index(fields=['gate', 'status']),
            models.Index(fields=['entry_time']),
        ]

    def __str__(self):
        return f'{self.student.full_name} - {self.entry_time.strftime("%Y-%m-%d %H:%M")}'
