import shutil
import tempfile
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from campus.models import Gate
from students.models import Student, College, School, Department, Program
from .models import Device, DeviceCheck, DeviceLoan
from .utils import generate_qr_code

User = get_user_model()
MEDIA_ROOT = tempfile.mkdtemp()


@override_settings(ALLOWED_HOSTS=['testserver'], MEDIA_ROOT=MEDIA_ROOT)
class GateCheckTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        college = College.objects.create(name='Science and Technology', code='CST')
        school = School.objects.create(name='ICT', code='ICT', college=college)
        department = Department.objects.create(name='Information Technology', code='IT', school=school)
        program = Program.objects.create(name='BIT', code='BIT', department=department)
        org = dict(college=college, school=school, department=department, program=program)

        cls.owner = Student.objects.create(registration_number='222000001', full_name='Owner', email='o@ur.ac.rw', **org)
        cls.other = Student.objects.create(registration_number='222000002', full_name='Other', email='x@ur.ac.rw', **org)
        cls.gate = Gate.objects.create(name='Main Gate', code='MAIN')

        cls.admin = User.objects.create_user(username='admin', password='x', role='admin')
        cls.guard = User.objects.create_user(username='guard', password='x', role='security')
        cls.guard.assigned_gates.add(cls.gate)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.device = Device(owner=self.owner, brand='HP', model='EliteBook', serial_number='SN-001')
        self.device.save()
        generate_qr_code(self.device).save()

        admin = APIClient()
        admin.force_authenticate(self.admin)
        for student, serial in [(self.owner, '0116658347'), (self.other, '0999999999')]:
            response = admin.post(f'/api/v1/students/{student.id}/assign-nfc/', {'card_serial': serial})
            self.assertEqual(response.status_code, 201)

        self.client = APIClient()
        self.client.force_authenticate(self.guard)

    def check(self, **data):
        return self.client.post('/api/v1/devices/gate-check/', data)

    def test_owner_with_their_device(self):
        response = self.check(student='0116658347', qr_data=self.device.qr_data)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['outcome'], 'owner')
        self.assertEqual(response.data['identified_by'], 'serial')
        self.assertEqual(response.data['gate']['id'], self.gate.id)

    def test_someone_else_with_the_device_is_a_mismatch(self):
        response = self.check(student='0999999999', qr_data=self.device.qr_data)
        self.assertEqual(response.data['outcome'], 'mismatch')
        self.assertEqual(response.data['owner']['id'], self.owner.id)

    def test_borrower_on_active_loan(self):
        now = timezone.now()
        DeviceLoan.objects.create(
            device=self.device, borrower=self.other, lender=self.owner,
            start_date=now - timedelta(hours=1), end_date=now + timedelta(days=1), reason='Project',
        )
        response = self.check(student='0999999999', qr_data=self.device.qr_data)
        self.assertEqual(response.data['outcome'], 'borrower')

    def test_loan_that_has_not_started_does_not_authorise(self):
        now = timezone.now()
        DeviceLoan.objects.create(
            device=self.device, borrower=self.other, lender=self.owner,
            start_date=now + timedelta(days=1), end_date=now + timedelta(days=2), reason='Later',
        )
        response = self.check(student='0999999999', qr_data=self.device.qr_data)
        self.assertEqual(response.data['outcome'], 'mismatch')

    def test_student_only_lists_their_devices(self):
        response = self.check(student='222000001')
        self.assertEqual(response.data['outcome'], 'student_only')
        self.assertEqual(response.data['identified_by'], 'registration_number')
        self.assertEqual([d['id'] for d in response.data['devices']], [self.device.id])

    def test_device_only_shows_owner(self):
        response = self.check(qr_data=self.device.qr_data)
        self.assertEqual(response.data['outcome'], 'device_only')
        self.assertEqual(response.data['owner']['id'], self.owner.id)

    def test_every_check_is_logged(self):
        self.check(student='0999999999', qr_data=self.device.qr_data)
        log = DeviceCheck.objects.get()
        self.assertEqual(
            (log.student, log.device, log.outcome, log.gate, log.checked_by),
            (self.other, self.device, 'mismatch', self.gate, self.guard),
        )

    def test_lost_card_is_refused(self):
        self.owner.nfc_card.report_lost()
        response = self.check(student='0116658347', qr_data=self.device.qr_data)
        self.assertEqual(response.status_code, 403)
        self.assertFalse(DeviceCheck.objects.exists())

    def test_forged_qr_is_refused(self):
        forged = self.device.qr_data.replace('"token":"', '"token":"0')
        response = self.check(student='0116658347', qr_data=forged)
        self.assertEqual(response.status_code, 404)

    def test_needs_student_or_device(self):
        self.assertEqual(self.check().status_code, 400)

    def test_card_token_never_returned(self):
        response = self.check(student='0116658347', qr_data=self.device.qr_data)
        self.assertNotIn('0116658347', str(response.data))
        self.assertNotIn(self.owner.nfc_card.uid, str(response.data))

    def test_lecturers_cannot_run_gate_checks(self):
        lecturer = User.objects.create_user(username='lecturer', password='x', role='lecturer')
        self.client.force_authenticate(lecturer)
        self.assertEqual(self.check(student='222000001').status_code, 403)
