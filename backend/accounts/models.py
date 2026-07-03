from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_SECURITY = 'security'
    ROLE_LECTURER = 'lecturer'
    ROLE_STUDENT = 'student'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Administrator'),
        (ROLE_SECURITY, 'Security Officer'),
        (ROLE_LECTURER, 'Lecturer'),
        (ROLE_STUDENT, 'Student'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_ADMIN)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f'{self.get_full_name()} ({self.role})'

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN

    @property
    def is_security(self):
        return self.role == self.ROLE_SECURITY

    @property
    def is_lecturer(self):
        return self.role == self.ROLE_LECTURER
