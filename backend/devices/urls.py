from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeviceViewSet, DeviceLoanViewSet, DeviceVerifyView, GateCheckView

router = DefaultRouter()
router.register('loans', DeviceLoanViewSet, basename='device-loan')
router.register('', DeviceViewSet, basename='device')

urlpatterns = [
    path('verify/', DeviceVerifyView.as_view(), name='device_verify'),
    path('gate-check/', GateCheckView.as_view(), name='gate_check'),
    path('', include(router.urls)),
]
