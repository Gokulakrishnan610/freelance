from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.decorators import display
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    # Unfold customizations
    list_display = ['email', 'get_full_name', 'role', 'is_active', 'date_joined', 'get_projects_count']
    list_filter = ['role', 'is_active', 'is_staff', ('date_joined', RangeDateFilter)]
    search_fields = ['email', 'first_name', 'last_name', 'name']
    ordering = ['-date_joined']
    list_per_page = 25
    
    # Custom fieldsets for better organization
    fieldsets = (
        ('Personal Info', {
            'fields': ('email', 'first_name', 'last_name', 'name')
        }),
        ('Account Details', {
            'fields': ('username', 'role', 'password')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ['collapse']
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ['collapse']
        }),
    )
    
    add_fieldsets = (
        ('Create New User', {
            'fields': ('email', 'first_name', 'last_name', 'name', 'role', 'password1', 'password2')
        }),
    )
    
    # Custom display methods
    @display(description="Full Name", ordering="first_name")
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}" if obj.first_name and obj.last_name else obj.name or obj.email
    
    @display(description="Projects", ordering="projects_count")
    def get_projects_count(self, obj):
        if obj.role == 'client':
            return obj.posted_projects.count()
        elif obj.role == 'freelancer':
            return obj.proposals.count()
        return 0
    
    # Custom actions
    actions = ['activate_users', 'deactivate_users']
    
    @admin.action(description='Activate selected users')
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users were successfully activated.')
    
    @admin.action(description='Deactivate selected users')
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users were successfully deactivated.')
