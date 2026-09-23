from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator


class College(models.Model):
    """One of the six colleges of the University of Rwanda (Law 71/2013, art. 4)."""
    name = models.CharField(max_length=200, unique=True, db_index=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class School(models.Model):
    """An organ of a college, made up of departments (Law 71/2013, art. 2)."""
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='schools', db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['college', 'name']
        unique_together = ['college', 'code']
        indexes = [
            models.Index(fields=['college', 'is_active']),
        ]

    def __str__(self):
        return f'{self.college.code} - {self.name}'


class Department(models.Model):
    """The basic academic organ of a school; owns the curricula (Law 71/2013, art. 2)."""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='departments', db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['school', 'name']
        unique_together = ['school', 'code']
        indexes = [
            models.Index(fields=['school', 'is_active']),
        ]

    def __str__(self):
        return f'{self.school.code} - {self.name}'


class Program(models.Model):
    """A degree programme run by a department."""
    LEVEL_CHOICES = [
        ('diploma', 'Diploma'),
        ('bachelor', "Bachelor's"),
        ('master', "Master's"),
        ('phd', 'PhD'),
    ]

    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='programs', db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    code = models.CharField(max_length=20)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='bachelor', db_index=True)
    duration_years = models.PositiveIntegerField(default=3)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['department', 'name']
        unique_together = ['department', 'code']
        indexes = [
            models.Index(fields=['department', 'is_active']),
            models.Index(fields=['level']),
        ]

    def __str__(self):
        return f'{self.department.code} - {self.name} ({self.level})'


class Student(models.Model):
    YEAR_CHOICES = [(i, f'Year {i}') for i in range(1, 6)]

    registration_number = models.CharField(
        max_length=50, unique=True, db_index=True,
        validators=[RegexValidator(
            regex=r'^[A-Z0-9]+$',
            message='Registration number must contain only uppercase letters and numbers',
            code='invalid_registration_number',
        )],
    )
    full_name = models.CharField(max_length=200, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True)

    college = models.ForeignKey(College, on_delete=models.PROTECT, related_name='students', db_index=True)
    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name='students', db_index=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='students', db_index=True)
    program = models.ForeignKey(Program, on_delete=models.PROTECT, related_name='students', db_index=True)
    year_of_study = models.IntegerField(choices=YEAR_CHOICES, default=1, db_index=True)

    photo = models.ImageField(upload_to='students/', null=True, blank=True)

    is_active = models.BooleanField(default=True, db_index=True)
    admission_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']
        indexes = [
            models.Index(fields=['college', 'is_active']),
            models.Index(fields=['department', 'is_active']),
            models.Index(fields=['year_of_study']),
            models.Index(fields=['is_active', 'admission_date']),
        ]

    def __str__(self):
        return f'{self.full_name} ({self.registration_number})'

    @property
    def full_organization(self):
        return f'{self.college.name} > {self.school.name} > {self.department.name} > {self.program.name}'


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
    # Holds the encrypted registration number written to the physical tag
    # (see students/crypto.py). Widened past a raw uid's length for the Fernet token.
    uid = models.CharField(max_length=255, unique=True, db_index=True)
    # Factory serial of the chip, as typed by a keyboard-wedge USB reader.
    # Those readers can't see the token in the tag's memory, so gates using
    # them match on this instead (see docs/NFC_SECURITY.md).
    card_serial = models.CharField(max_length=32, unique=True, null=True, blank=True)
    issued_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    deactivation_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-issued_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['uid']),
        ]

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

    @staticmethod
    def scan_filter(value):
        """Match a scan against either the token (phone/NDEF readers) or the
        chip serial (USB readers). Use with .get(); check scan_method() after."""
        return models.Q(uid=value) | models.Q(card_serial=value.upper())

    def scan_method(self, value):
        return 'token' if value == self.uid else 'serial'

    def decrypted_registration_number(self):
        """The registration number encoded in this card's token, or None for
        a legacy card issued before encryption (its uid won't decrypt)."""
        from .crypto import decrypt_nfc_token
        from cryptography.fernet import InvalidToken
        try:
            return decrypt_nfc_token(self.uid)
        except InvalidToken:
            return None
