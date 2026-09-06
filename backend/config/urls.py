from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/campus/', include('campus.urls')),
    path('api/v1/students/', include('students.urls')),
    path('api/v1/devices/', include('devices.urls')),
    path('api/v1/attendance/', include('attendance.urls')),
    path('api/v1/verification/', include('verification.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
