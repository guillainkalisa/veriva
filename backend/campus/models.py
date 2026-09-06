from django.db import models


class Directorate(models.Model):
    """An administrative office of the campus (e.g. a directorate under the Campus Administrator)."""
    WING_ACADEMIC = 'academic'
    WING_ADMIN = 'administrative'
    WING_CHOICES = [
        (WING_ACADEMIC, 'Academic & Research'),
        (WING_ADMIN, 'Administrative'),
    ]

    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    wing = models.CharField(max_length=20, choices=WING_CHOICES, default=WING_ADMIN, db_index=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
