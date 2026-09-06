from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, NFCLookupView,
    CollegeViewSet, SchoolViewSet, DepartmentViewSet, ProgramViewSet
)

router = DefaultRouter()

router.register('colleges', CollegeViewSet, basename='college')
router.register('schools', SchoolViewSet, basename='school')
router.register('departments', DepartmentViewSet, basename='department')
router.register('programs', ProgramViewSet, basename='program')
router.register('', StudentViewSet, basename='student')

urlpatterns = [
    path('nfc-lookup/', NFCLookupView.as_view(), name='nfc_lookup'),
    path('', include(router.urls)),
]
