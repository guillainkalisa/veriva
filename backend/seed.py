"""Populate a fresh database with demo users and sample data.

    python seed.py

Safe to run repeatedly - it only creates rows that are missing.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import CustomUser
from campus.models import Directorate
from students.models import College, School, Department, Program, Student, NFCCard
from devices.models import Device
from devices.utils import generate_qr_code
from attendance.models import Course


def get_or_create(model, defaults=None, **lookup):
    obj, created = model.objects.get_or_create(defaults=defaults or {}, **lookup)
    if created:
        print(f'  + {model.__name__}: {obj}')
    return obj


def upsert_user(username, password, **fields):
    user, created = CustomUser.objects.get_or_create(username=username, defaults=fields)
    if not created:
        for k, v in fields.items():
            setattr(user, k, v)
    user.set_password(password)
    user.save()
    print(f'  {"+" if created else "~"} {username} / {password}  ({user.role})')
    return user


# --- Users -------------------------------------------------------------------
print('Users')
admin = upsert_user('admin', 'admin1234', email='admin@veriva.ur.ac.rw',
                    first_name='System', last_name='Administrator', role='admin',
                    is_staff=True, is_superuser=True)
security = upsert_user('security01', 'security1234', email='security@veriva.ur.ac.rw',
                       first_name='Jean', last_name='Mutabazi', role='security')
lecturer = upsert_user('lecturer01', 'lecturer1234', email='lecturer@veriva.ur.ac.rw',
                       first_name='Marie', last_name='Uwimana', role='lecturer')


# --- Campus administration -------------------------------------------------
print('Directorates')
directorates = {
    d['code']: get_or_create(Directorate, code=d['code'], defaults=d)
    for d in [
        dict(code='OCA', name='Office of the Campus Administrator', wing='administrative'),
        dict(code='DAHRM', name='Directorate of Administration and Human Resource Management', wing='administrative'),
        dict(code='DF', name='Directorate of Finance', wing='administrative'),
        dict(code='DASM', name='Directorate of Asset and Services Management', wing='administrative'),
    ]
}
asset_office = directorates['DASM']


# --- Organisation: College > School > Department > Programme ---------------
print('Organisation')
cst = get_or_create(College, code='CST', defaults=dict(
    name='College of Science and Technology'))

school_ict = get_or_create(School, college=cst, code='ICT', defaults=dict(
    name='School of ICT'))
school_eng = get_or_create(School, college=cst, code='ENG', defaults=dict(
    name='School of Engineering'))

dept_csit = get_or_create(Department, school=school_ict, code='CSIT', defaults=dict(
    name='Computer Science and Information Technology'))
dept_civil = get_or_create(Department, school=school_eng, code='CE', defaults=dict(
    name='Civil Engineering'))

programs = {
    'BIT': get_or_create(Program, department=dept_csit, code='BIT', defaults=dict(
        name='Bachelor of Information Technology', level='bachelor', duration_years=4)),
    'BCS': get_or_create(Program, department=dept_csit, code='BCS', defaults=dict(
        name='Bachelor of Computer Science', level='bachelor', duration_years=4)),
    'BCE': get_or_create(Program, department=dept_civil, code='BCE', defaults=dict(
        name='Bachelor of Civil Engineering', level='bachelor', duration_years=4)),
}


# --- Students ------------------------------------------------------------
print('Students')
students = [
    ('224010001', 'Alice Mukamana', 'alice@stud.ur.ac.rw', 'BIT', 2, '0781000001', 'A1B2C3D4'),
    ('224010002', 'Bob Ntwari', 'bob@stud.ur.ac.rw', 'BCS', 3, '0781000002', 'E5F6A7B8'),
    ('224010003', 'Claire Ingabire', 'claire@stud.ur.ac.rw', 'BIT', 1, '0781000003', 'C9D0E1F2'),
    ('224010004', 'David Habimana', 'david@stud.ur.ac.rw', 'BCE', 4, '0781000004', 'B3C4D5E6'),
]
for reg, name, email, prog_code, year, phone, uid in students:
    program = programs[prog_code]
    student = get_or_create(
        Student, registration_number=reg,
        defaults=dict(
            full_name=name, email=email, phone=phone, year_of_study=year,
            college=cst, school=program.department.school,
            department=program.department, program=program,
        ),
    )
    NFCCard.objects.get_or_create(student=student, defaults=dict(uid=uid))


# --- Devices -----------------------------------------------------------
print('Devices')
for student in Student.objects.all():
    if student.devices.exists():
        continue
    device = Device(
        owner=student, brand='HP', model='EliteBook 840',
        serial_number=f'SN-{student.registration_number}', color='Silver',
        specifications='Intel Core i5, 8GB RAM, 256GB SSD',
        managing_directorate=asset_office,
    )
    device.save()
    generate_qr_code(device)
    device.save()
    print(f'  + Device for {student.full_name}')


# --- Courses --------------------------------------------------------
print('Courses')
courses = [
    ('CSIT1101', 'Introduction to Programming'),
    ('CSIT2201', 'Database Systems'),
    ('CSIT3301', 'Web Application Development'),
]
for code, name in courses:
    get_or_create(Course, code=code, defaults=dict(
        name=name, department=dept_csit.name, lecturer=lecturer))


print('\nDone. Logins:')
print('  admin / admin1234   security01 / security1234   lecturer01 / lecturer1234')
