from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from students.models import Student, College, School, Department, Program
from .models import Course, CourseEnrollment

User = get_user_model()


@override_settings(ALLOWED_HOSTS=['testserver'])
class CourseEnrollmentScopeTests(TestCase):
    """A module belongs to one department; only admin or that department's HoD
    may enroll students from elsewhere (shared modules)."""

    @classmethod
    def setUpTestData(cls):
        college = College.objects.create(name='Science and Technology', code='CST')
        ict = School.objects.create(name='ICT', code='ICT', college=college)
        eng = School.objects.create(name='Engineering', code='ENG', college=college)
        cls.it = Department.objects.create(name='Information Technology', code='IT', school=ict)
        cls.civil = Department.objects.create(name='Civil Engineering', code='CE', school=eng)
        it_prog = Program.objects.create(name='BIT', code='BIT', department=cls.it)
        ce_prog = Program.objects.create(name='BCE', code='BCE', department=cls.civil)

        cls.it_student = Student.objects.create(
            registration_number='222000001', full_name='Ivan IT', email='it@ur.ac.rw',
            college=college, school=ict, department=cls.it, program=it_prog,
        )
        cls.civil_student = Student.objects.create(
            registration_number='222000002', full_name='Cedric Civil', email='ce@ur.ac.rw',
            college=college, school=eng, department=cls.civil, program=ce_prog,
        )

        cls.lecturer = User.objects.create_user(username='lecturer', password='x', role='lecturer')
        cls.it_hod = User.objects.create_user(username='it_hod', password='x', role='hod', assigned_department=cls.it)
        cls.civil_hod = User.objects.create_user(username='ce_hod', password='x', role='hod', assigned_department=cls.civil)
        cls.admin = User.objects.create_user(username='admin', password='x', role='admin')
        cls.course = Course.objects.create(name='Web Development', code='IT301', lecturer=cls.lecturer, department=cls.it)

    def as_user(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    def enroll(self, user, *students):
        return self.as_user(user).post(
            f'/api/v1/attendance/courses/{self.course.id}/enroll/',
            {'student_ids': [s.id for s in students]}, format='json',
        )

    def enrollable(self, user, all_departments=False):
        params = {'all_departments': 'true'} if all_departments else {}
        response = self.as_user(user).get(f'/api/v1/attendance/courses/{self.course.id}/enrollable-students/', params)
        self.assertEqual(response.status_code, 200)
        return {s['id'] for s in response.data}

    def enrolled(self):
        return set(CourseEnrollment.objects.filter(course=self.course, is_active=True).values_list('student_id', flat=True))

    def test_lecturer_only_finds_department_students(self):
        self.assertEqual(self.enrollable(self.lecturer), {self.it_student.id})
        self.assertEqual(self.enrollable(self.lecturer, all_departments=True), {self.it_student.id})

    def test_lecturer_cannot_enroll_other_department(self):
        response = self.enroll(self.lecturer, self.it_student, self.civil_student)
        self.assertEqual(response.data, {'enrolled': 1, 'skipped': 1})
        self.assertEqual(self.enrolled(), {self.it_student.id})

    def test_department_hod_can_override(self):
        self.assertEqual(self.enrollable(self.it_hod), {self.it_student.id})
        self.assertEqual(self.enrollable(self.it_hod, all_departments=True), {self.it_student.id, self.civil_student.id})
        self.assertEqual(self.enroll(self.it_hod, self.civil_student).data['enrolled'], 1)
        self.assertEqual(self.enrolled(), {self.civil_student.id})

    def test_admin_can_override(self):
        self.assertEqual(self.enroll(self.admin, self.civil_student).data['enrolled'], 1)

    def test_other_department_hod_has_no_access(self):
        self.assertEqual(self.enroll(self.civil_hod, self.civil_student).status_code, 403)
        roster = self.as_user(self.civil_hod).get(f'/api/v1/attendance/courses/{self.course.id}/roster/')
        self.assertEqual(roster.status_code, 403)

    def test_department_hod_can_read_roster(self):
        roster = self.as_user(self.it_hod).get(f'/api/v1/attendance/courses/{self.course.id}/roster/')
        self.assertEqual(roster.status_code, 200)

    def test_other_lecturer_has_no_access(self):
        other = User.objects.create_user(username='other', password='x', role='lecturer')
        self.assertEqual(self.enroll(other, self.it_student).status_code, 404)
