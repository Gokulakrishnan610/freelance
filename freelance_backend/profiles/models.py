from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

def user_avatar_path(instance, filename):
    """Generate upload path for user avatars: avatars/user_id/avatar.jpg"""
    return f'avatars/{instance.user.id}/avatar.jpg'

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    headline = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    avatar = models.ImageField(upload_to=user_avatar_path, null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_projects = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} Profile"

class VideoDemo(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='video_demos')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video_file = models.FileField(upload_to='videos/')
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    category = models.CharField(max_length=50)
    tags = models.JSONField(default=list, blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.profile.user.email}"
