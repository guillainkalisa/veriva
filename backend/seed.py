"""
Run with: python seed.py
Creates default admin user and sample data for development.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veriva_backend.settings')
django.setup()

from accounts.models import CustomUser
from students.models import Student, NFCCard
from devices.models import Device
from devices.utils import generate_qr_code
from attendance.models import Course
import datetime

print("Creating default admin user...")
if not CustomUser.objects.filter(username='admin').exists():
    CustomUser.objects.create_superuser(
        username='admin',
        email='admin@veriva.ur.ac.rw',
        password='admin1234',
        first_name='System',
        last_name='Administrator',
        role='admin',
    )
    print("  Admin created: username=admin, password=admin1234")
else:
    print("  Admin already exists.")

print("Creating security officer...")
if not CustomUser.objects.filter(username='security01').exists():
    CustomUser.objects.create_user(
        username='security01',
        email='security@veriva.ur.ac.rw',
        password='security1234',
        first_name='Jean',
        last_name='Mutabazi',
        role='security',
    )
    print("  Security officer created.")

print("Creating lecturer...")
if not CustomUser.objects.filter(username='lecturer01').exists():
    lecturer = CustomUser.objects.create_user(
        username='lecturer01',
        email='lecturer@veriva.ur.ac.rw',
        password='lecturer1234',
        first_name='Marie',
        last_name='Uwimana',
        role='lecturer',
    )
    print("  Lecturer created.")
else:
    lecturer = CustomUser.objects.get(username='lecturer01')

print("Creating sample students...")
students_data = [
    {
        'registration_number': '224010001',
        'full_name': 'Alice Mukamana',
        'email': 'alice@stud.ur.ac.rw',
        'college': 'College of Science and Technology',
        'department': 'Information Technology',
        'program': 'Bachelor of Information Technology',
        'year_of_study': 2,
        'phone': '0781000001',
        'nfc_uid': 'A1B2C3D4',
    },
    {
        'registration_number': '224010002',
        'full_name': 'Bob Ntwari',
        'email': 'bob@stud.ur.ac.rw',
        'college': 'College of Science and Technology',
        'department': 'Computer Science',
        'program': 'Bachelor of Computer Science',
        'year_of_study': 3,
        'phone': '0781000002',
        'nfc_uid': 'E5F6G7H8',
    },
    {
        'registration_number': '224010003',
        'full_name': 'Claire Ingabire',
        'email': 'claire@stud.ur.ac.rw',
        'college': 'College of Science and Technology',
        'department': 'Information Technology',
        'program': 'Bachelor of Information Technology',
        'year_of_study': 1,
        'phone': '0781000003',
        'nfc_uid': 'I9J0K1L2',
    },
]

for data in students_data:
    nfc_uid = data.pop('nfc_uid')
    student, created = Student.objects.get_or_create(
        registration_number=data['registration_number'],
        defaults=data
    )
    if created:
        NFCCard.objects.create(student=student, uid=nfc_uid)
        print(f"  Created student: {student.full_name}")
    else:
        print(f"  Student already exists: {student.full_name}")

print("Creating sample devices...")
for student in Student.objects.all():
    if not student.devices.exists():
        device = Device(
            owner=student,
            brand='HP',
            model='EliteBook 840',
            serial_number=f'SN-{student.registration_number}',
            color='Silver',
            specifications='Intel Core i5, 8GB RAM, 256GB SSD',
        )
        device.save()
        device = generate_qr_code(device)
        device.save()
        print(f"  Device registered for {student.full_name}")

print("Creating sample courses...")
courses_data = [
    {'name': 'Introduction to Programming', 'code': 'CST101', 'department': 'Information Technology'},
    {'name': 'Database Systems', 'code': 'CST201', 'department': 'Computer Science'},
    {'name': 'Web Development', 'code': 'CST301', 'department': 'Information Technology'},
]
for data in courses_data:
    course, created = Course.objects.get_or_create(
        code=data['code'],
        defaults={**data, 'lecturer': lecturer}
    )
    if created:
        print(f"  Course created: {course.code}")

print("\nDone! Login credentials:")
print("  Admin:    admin / admin1234")
print("  Security: security01 / security1234")
print("  Lecturer: lecturer01 / lecturer1234")
