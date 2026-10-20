from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('DTEP', {'fields': ('role', 'phone_number', 'profile_picture', 'created_at')}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ('DTEP', {'fields': ('role', 'phone_number', 'profile_picture')}),
    )
    readonly_fields = ('created_at',)
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'phone_number')
