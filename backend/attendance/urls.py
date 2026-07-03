from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, AttendanceSessionViewSet, AttendanceRecordViewSet,
    CampusEntryViewSet, NFCAttendanceView, NFCCampusEntryView, AttendanceSummaryView
)

router = DefaultRouter()
router.register('courses', CourseViewSet, basename='course')
router.register('sessions', AttendanceSessionViewSet, basename='session')
router.register('records', AttendanceRecordViewSet, basename='record')
router.register('campus-entries', CampusEntryViewSet, basename='campus-entry')

urlpatterns = [
    path('nfc-tap/', NFCAttendanceView.as_view(), name='nfc_attendance'),
    path('campus-nfc-tap/', NFCCampusEntryView.as_view(), name='nfc_campus_entry'),
    path('summary/', AttendanceSummaryView.as_view(), name='attendance_summary'),
    path('', include(router.urls)),
]
