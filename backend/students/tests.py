from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from campus.models import Gate
from .models import Student, College, School, Department, Program

User = get_user_model()

NON_ADMIN_ROLES = ['security_chief', 'security', 'lecturer', 'hod', 'dean']


@override_settings(ALLOWED_HOSTS=['testserver'])
class NFCTokenExposureTests(TestCase):
    """The card token is enough to clone a card, so only admins may see it."""

    @classmethod
    def setUpTestData(cls):
        college = College.objects.create(name='Science and Technology', code='CST')
        school = School.objects.create(name='ICT', code='ICT', college=college)
        department = Department.objects.create(name='Information Technology', code='IT', school=school)
        program = Program.objects.create(name='BIT', code='BIT', department=department)
        cls.student = Student.objects.create(
            registration_number='222000001', full_name='Test Student', email='student@ur.ac.rw',
            college=college, school=school, department=department, program=program,
        )
        cls.gate = Gate.objects.create(name='Main Gate', code='MAIN')
        cls.admin = User.objects.create_user(username='admin', password='x', role='admin')

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    def issue_card(self):
        response = self.client_for(self.admin).post(f'/api/v1/students/{self.student.id}/assign-nfc/')
        self.assertEqual(response.status_code, 201)
        return response.data['uid']

    def test_admin_receives_token_when_issuing(self):
        token = self.issue_card()
        self.assertTrue(token)
        response = self.client_for(self.admin).get(f'/api/v1/students/{self.student.id}/')
        self.assertEqual(response.data['nfc_card']['uid'], token)

    def test_non_admins_cannot_issue_cards(self):
        for role in NON_ADMIN_ROLES:
            user = User.objects.create_user(username=role, password='x', role=role)
            response = self.client_for(user).post(f'/api/v1/students/{self.student.id}/assign-nfc/')
            self.assertEqual(response.status_code, 403, role)

    def test_student_detail_hides_token_from_non_admins(self):
        self.issue_card()
        for role in ['security_chief', 'security', 'hod', 'dean']:
            user = User.objects.create_user(username=role, password='x', role=role)
            response = self.client_for(user).get(f'/api/v1/students/{self.student.id}/')
            self.assertEqual(response.status_code, 200, role)
            card = response.data['nfc_card']
            self.assertNotIn('uid', card, role)
            self.assertEqual(card['decrypted_registration_number'], '222000001')

    def test_scan_responses_hide_token(self):
        token = self.issue_card()
        chief = User.objects.create_user(username='chief', password='x', role='security_chief')
        client = self.client_for(chief)

        lookup = client.get('/api/v1/students/nfc-lookup/', {'uid': token})
        self.assertEqual(lookup.status_code, 200)
        self.assertNotIn('uid', lookup.data['student']['nfc_card'])

        tap = client.post('/api/v1/attendance/campus-nfc-tap/', {'nfc_uid': token, 'gate': self.gate.id})
        self.assertEqual(tap.status_code, 200)
        self.assertNotIn(token, str(tap.data))
