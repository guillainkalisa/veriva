from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DirectorateViewSet

router = DefaultRouter()
router.register('directorates', DirectorateViewSet, basename='directorate')

urlpatterns = [
    path('', include(router.urls)),
]
