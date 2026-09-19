from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DirectorateViewSet, GateViewSet

router = DefaultRouter()
router.register('directorates', DirectorateViewSet, basename='directorate')
router.register('gates', GateViewSet, basename='gate')

urlpatterns = [
    path('', include(router.urls)),
]
