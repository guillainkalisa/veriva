from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_SECURITY_CHIEF = 'security_chief'
    ROLE_SECURITY = 'security'
    ROLE_LECTURER = 'lecturer'
    ROLE_STUDENT = 'student'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Administrator'),
        (ROLE_SECURITY_CHIEF, 'Security Chief'),
        (ROLE_SECURITY, 'Security Guard'),
        (ROLE_LECTURER, 'Lecturer'),
        (ROLE_STUDENT, 'Student'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_ADMIN)
    phone = models.CharField(max_length=20, blank=True)
    # Guards are scoped to the gates they are assigned to. Empty for other roles.
    assigned_gates = models.ManyToManyField('campus.Gate', blank=True, related_name='guards')

    def __str__(self):
        return f'{self.get_full_name()} ({self.role})'

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN

    @property
    def is_security_chief(self):
        return self.role == self.ROLE_SECURITY_CHIEF

    @property
    def is_security_guard(self):
        return self.role == self.ROLE_SECURITY

    @property
    def is_lecturer(self):
        return self.role == self.ROLE_LECTURER

    @property
    def sees_all_gates(self):
        return self.role in (self.ROLE_ADMIN, self.ROLE_SECURITY_CHIEF)

    def gate_ids(self):
        """The gate ids a guard is confined to (empty for roles that see all)."""
        return set(self.assigned_gates.values_list('id', flat=True))
