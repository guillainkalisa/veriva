from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from campus.models import Gate
from .models import Student, College, School, Department, Program

User = get_user_model()

NON_ADMIN_ROLES = ['security_chief', 'security', 'lecturer', 'hod', 'dean']


@override_settings(ALLOWED_HOSTS=['testserver'])
class NFCTestCase(TestCase):
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

    def issue_card(self, student=None, card_serial='0116658347'):
        student = student or self.student
        response = self.client_for(self.admin).post(
            f'/api/v1/students/{student.id}/assign-nfc/', {'card_serial': card_serial},
        )
        self.assertEqual(response.status_code, 201, response.data)
        return response.data['uid']


class NFCTokenExposureTests(NFCTestCase):
    """The token and serial are enough to clone a card, so only admins may see them."""

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
            self.assertNotIn('card_serial', card, role)
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
        self.assertNotIn('0116658347', str(tap.data))

    def test_registration_number_filter_is_exact(self):
        Student.objects.create(
            registration_number='2220000011', full_name='Other Student', email='other@ur.ac.rw',
            college=self.student.college, school=self.student.school,
            department=self.student.department, program=self.student.program,
        )
        response = self.client_for(self.admin).get('/api/v1/students/', {'registration_number': '222000001'})
        self.assertEqual([s['id'] for s in response.data['results']], [self.student.id])


class NFCCardSerialTests(NFCTestCase):
    """USB keyboard-wedge readers only see the chip serial, not the token."""

    def test_issuing_requires_card_serial(self):
        response = self.client_for(self.admin).post(f'/api/v1/students/{self.student.id}/assign-nfc/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('card_serial', response.data)

    def test_gate_accepts_serial_and_reports_method(self):
        token = self.issue_card()
        chief = User.objects.create_user(username='chief', password='x', role='security_chief')
        client = self.client_for(chief)

        by_serial = client.post('/api/v1/attendance/campus-nfc-tap/', {'nfc_uid': '0116658347', 'gate': self.gate.id})
        self.assertEqual(by_serial.status_code, 200)
        self.assertEqual(by_serial.data['scan_method'], 'serial')

        by_token = client.post('/api/v1/attendance/campus-nfc-tap/', {'nfc_uid': token, 'gate': self.gate.id})
        self.assertEqual(by_token.status_code, 200)
        self.assertEqual(by_token.data['scan_method'], 'token')

    def test_hex_serial_matches_case_insensitively(self):
        self.issue_card(card_serial='04a1b2c3')
        chief = User.objects.create_user(username='chief', password='x', role='security_chief')
        response = self.client_for(chief).get('/api/v1/students/nfc-lookup/', {'uid': '04A1B2C3'})
        self.assertEqual(response.status_code, 200)

    def test_one_physical_card_per_student(self):
        self.issue_card()
        other = Student.objects.create(
            registration_number='222000002', full_name='Second Student', email='second@ur.ac.rw',
            college=self.student.college, school=self.student.school,
            department=self.student.department, program=self.student.program,
        )
        response = self.client_for(self.admin).post(
            f'/api/v1/students/{other.id}/assign-nfc/', {'card_serial': '0116658347'},
        )
        self.assertEqual(response.status_code, 400)

    def test_lost_card_serial_stops_working_after_replacement(self):
        self.issue_card()
        admin = self.client_for(self.admin)
        admin.post(f'/api/v1/students/{self.student.id}/nfc-status/', {'action': 'report_lost'})
        self.issue_card(card_serial='0999999999')

        chief = User.objects.create_user(username='chief', password='x', role='security_chief')
        client = self.client_for(chief)
        old = client.post('/api/v1/attendance/campus-nfc-tap/', {'nfc_uid': '0116658347', 'gate': self.gate.id})
        self.assertEqual(old.status_code, 404)
        new = client.post('/api/v1/attendance/campus-nfc-tap/', {'nfc_uid': '0999999999', 'gate': self.gate.id})
        self.assertEqual(new.status_code, 200)
