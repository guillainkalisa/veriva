from django.contrib import admin
from .models import Directorate


@admin.register(Directorate)
class DirectorateAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'wing', 'is_active']
    list_filter = ['wing', 'is_active']
    search_fields = ['name', 'code']
