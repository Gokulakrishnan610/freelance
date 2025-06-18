from rest_framework import serializers
from .models import Profile, VideoDemo
from accounts.serializers import UserSerializer

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'headline', 'bio', 'skills', 'hourly_rate',
            'location', 'website', 'avatar', 'avatar_url', 'rating', 'total_projects',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'user', 'rating', 'total_projects', 'created_at', 'updated_at')
    
    def get_avatar_url(self, obj):
        """Return the full URL for the avatar image"""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

class VideoDemoSerializer(serializers.ModelSerializer):
    profile_name = serializers.CharField(source='profile.user.name', read_only=True)
    
    class Meta:
        model = VideoDemo
        fields = [
            'id', 'profile', 'profile_name', 'title', 'description',
            'video_file', 'thumbnail', 'category', 'tags', 'is_public',
            'created_at'
        ]
        read_only_fields = ('id', 'profile', 'created_at')
    
    def create(self, validated_data):
        # Set the profile to the current user's profile
        validated_data['profile'] = self.context['request'].user.profile
        return super().create(validated_data) 