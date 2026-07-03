from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IncidentReportViewSet, DashboardStatsView

router = DefaultRouter()
router.register('incidents', IncidentReportViewSet, basename='incident')

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('', include(router.urls)),
]
