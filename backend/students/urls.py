from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, NFCLookupView

router = DefaultRouter()
router.register('', StudentViewSet, basename='student')

urlpatterns = [
    path('nfc-lookup/', NFCLookupView.as_view(), name='nfc_lookup'),
    path('', include(router.urls)),
]
