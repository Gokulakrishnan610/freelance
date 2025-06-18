from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter, ChoicesDropdownFilter
from unfold.decorators import display
from .models import Profile, VideoDemo

class VideoDemoInline(TabularInline):
    model = VideoDemo
    extra = 0
    readonly_fields = ['created_at']
    fields = ['title', 'description', 'video_file', 'is_public', 'created_at']

@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
    list_display = ['user', 'get_user_role', 'get_rating_display', 'hourly_rate', 'get_videos_count', 'created_at']
    list_filter = [
        'user__role',
        ('created_at', RangeDateFilter),
        'hourly_rate'
    ]
    search_fields = [
        'user__email', 
        'user__first_name', 
        'user__last_name',
        'bio',
        'location',
        'skills'
    ]
    ordering = ['-created_at']
    list_per_page = 20
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Profile Details', {
            'fields': ('bio', 'location', 'skills', 'hourly_rate')
        }),
        ('Media & Portfolio', {
            'fields': ('profile_picture', 'portfolio_url')
        }),
        ('Rating & Performance', {
            'fields': ('rating',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    inlines = [VideoDemoInline]
    
    # Custom display methods
    @display(description="Role", ordering="user__role")
    def get_user_role(self, obj):
        return obj.user.role.title()
    
    @display(description="Rating", ordering="rating")
    def get_rating_display(self, obj):
        if obj.rating:
            return f"⭐ {obj.rating:.1f}"
        return "No rating"
    
    @display(description="Videos", ordering="videos_count")
    def get_videos_count(self, obj):
        return obj.video_demos.count()
    
    # Custom actions
    actions = ['reset_ratings', 'mark_as_featured']
    
    @admin.action(description='Reset ratings for selected profiles')
    def reset_ratings(self, request, queryset):
        updated = queryset.update(rating=None)
        self.message_user(request, f'{updated} profile ratings were reset.')
    
    @admin.action(description='Mark as featured (set high rating)')
    def mark_as_featured(self, request, queryset):
        updated = queryset.update(rating=5.0)
        self.message_user(request, f'{updated} profiles marked as featured.')

@admin.register(VideoDemo)
class VideoDemoAdmin(ModelAdmin):
    list_display = ['title', 'profile', 'get_user_role', 'is_public', 'get_file_size', 'created_at']
    list_filter = [
        'is_public',
        ('created_at', RangeDateFilter),
        'profile__user__role'
    ]
    search_fields = [
        'title', 
        'description',
        'profile__user__email',
        'profile__user__first_name',
        'profile__user__last_name'
    ]
    ordering = ['-created_at']
    list_per_page = 25
    
    fieldsets = (
        ('Video Information', {
            'fields': ('profile', 'title', 'description')
        }),
        ('File & Visibility', {
            'fields': ('video_file', 'is_public')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ['collapse']
        }),
    )
    
    readonly_fields = ['created_at']
    
    # Custom display methods
    @display(description="User Role", ordering="profile__user__role")
    def get_user_role(self, obj):
        return obj.profile.user.role.title()
    
    @display(description="File Size")
    def get_file_size(self, obj):
        if obj.video_file:
            size = obj.video_file.size
            if size < 1024 * 1024:  # Less than 1MB
                return f"{size / 1024:.1f} KB"
            else:  # 1MB or more
                return f"{size / (1024 * 1024):.1f} MB"
        return "No file"
    
    # Custom actions
    actions = ['make_public', 'make_private']
    
    @admin.action(description='Make selected videos public')
    def make_public(self, request, queryset):
        updated = queryset.update(is_public=True)
        self.message_user(request, f'{updated} videos made public.')
    
    @admin.action(description='Make selected videos private')
    def make_private(self, request, queryset):
        updated = queryset.update(is_public=False)
        self.message_user(request, f'{updated} videos made private.')
