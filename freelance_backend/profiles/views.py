from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from django.db import models
from django.db.models import Avg, Count, Q, Sum, Case, When, F, Value, DecimalField
from django.db.models.functions import Cast
from django.utils import timezone
from datetime import timedelta
import math
from .models import Profile, VideoDemo
from .serializers import ProfileSerializer, VideoDemoSerializer

class ProfileListView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        return Profile.objects.select_related('user').all()

class ProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        return Profile.objects.select_related('user').all()
    
    def perform_update(self, serializer):
        # Only allow the profile owner to update
        if self.get_object().user != self.request.user:
            raise PermissionError("You can only update your own profile")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only allow the profile owner to delete
        if instance.user != self.request.user:
            raise PermissionError("You can only delete your own profile")
        instance.delete()

class MyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        # Get or create profile for the current user
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    """Get the current user's profile"""
    try:
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)
    except Profile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_my_profile(request):
    """Update the current user's profile"""
    try:
        profile = Profile.objects.get(user=request.user)
        
        # Handle base64 image upload
        if 'avatar_data' in request.data:
            import base64
            import io
            from django.core.files.base import ContentFile
            from PIL import Image
            
            try:
                # Extract base64 data
                avatar_data = request.data['avatar_data']
                if avatar_data.startswith('data:image'):
                    # Remove data URL prefix
                    format, imgstr = avatar_data.split(';base64,')
                    ext = format.split('/')[-1]
                else:
                    imgstr = avatar_data
                    ext = 'jpg'
                
                # Decode base64
                img_data = base64.b64decode(imgstr)
                
                # Create image file
                img = Image.open(io.BytesIO(img_data))
                
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Save to BytesIO
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=85, optimize=True)
                output.seek(0)
                
                # Create filename - the upload_to function will handle the path
                filename = 'avatar.jpg'
                
                # Save to profile
                profile.avatar.save(
                    filename,
                    ContentFile(output.getvalue()),
                    save=False
                )
                
            except Exception as e:
                return Response({'error': f'Invalid image data: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update other profile fields
        serializer = ProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Profile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def top_freelancers(request):
    """
    Get top-rated freelancers using a sophisticated scoring algorithm that considers:
    - Rating (40% weight): Higher ratings get more points
    - Completed Projects (25% weight): More completed projects = more experience
    - Success Rate (20% weight): Percentage of accepted proposals
    - Recent Activity (10% weight): Active in last 30 days gets bonus
    - Profile Completeness (5% weight): Complete profiles rank higher
    """
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    freelancers = Profile.objects.filter(
        user__role='freelancer'
    ).annotate(
        # Core metrics
        completed_projects=Count('user__proposals__project', 
                               filter=Q(user__proposals__project__status='completed')),
        total_proposals=Count('user__proposals'),
        accepted_proposals=Count('user__proposals', 
                               filter=Q(user__proposals__project__status__in=['in_progress', 'completed'])),
        recent_activity=Count('user__proposals', 
                            filter=Q(user__proposals__created_at__gte=thirty_days_ago)),
        
        # Calculate success rate (accepted proposals / total proposals)
        success_rate=Case(
            When(total_proposals=0, then=Value(0.0)),
            default=F('accepted_proposals') * 100.0 / F('total_proposals'),
            output_field=DecimalField(max_digits=5, decimal_places=2)
        ),
        
        # Profile completeness score (0-100)
        profile_completeness=Case(
            When(bio='', then=Value(0)),
            default=Value(20)  # Has bio
        ) + Case(
            When(skills__len=0, then=Value(0)),
            default=Value(20)  # Has skills
        ) + Case(
            When(hourly_rate__isnull=True, then=Value(0)),
            default=Value(20)  # Has hourly rate
        ) + Case(
            When(location='', then=Value(0)),
            default=Value(20)  # Has location
        ) + Case(
            When(avatar='', then=Value(0)),
            default=Value(20)  # Has avatar
        ),
        
        # Calculate composite score (0-100)
        composite_score=(
            # Rating score (40% weight): (rating/5) * 40
            Cast(F('rating'), DecimalField()) / Cast(Value(5.0), DecimalField()) * Cast(Value(40.0), DecimalField()) +
            
            # Experience score (25% weight): min(completed_projects/10, 1) * 25
            Case(
                When(completed_projects__gte=10, then=Value(25.0)),
                default=Cast(F('completed_projects'), DecimalField()) * Cast(Value(2.5), DecimalField()),
                output_field=DecimalField(max_digits=5, decimal_places=2)
            ) +
            
            # Success rate score (20% weight): (success_rate/100) * 20
            Cast(F('success_rate'), DecimalField()) / Cast(Value(100.0), DecimalField()) * Cast(Value(20.0), DecimalField()) +
            
            # Recent activity bonus (10% weight): has recent activity gets full points
            Case(
                When(recent_activity__gt=0, then=Value(10.0)),
                default=Value(0.0),
                output_field=DecimalField(max_digits=5, decimal_places=2)
            ) +
            
            # Profile completeness (5% weight): (completeness/100) * 5
            Cast(F('profile_completeness'), DecimalField()) / Cast(Value(100.0), DecimalField()) * Cast(Value(5.0), DecimalField())
        )
    ).filter(
        # Minimum requirements for top freelancers
        rating__gte=3.5,  # At least 3.5 rating
        total_proposals__gte=1,  # At least 1 proposal submitted
    ).order_by('-composite_score', '-rating', '-completed_projects')[:10]
    
    serializer = ProfileSerializer(freelancers, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def newcomer_freelancers(request):
    """
    Get promising newcomer freelancers using a scoring system that considers:
    - Recency (30% weight): More recent joiners get higher scores
    - Early Activity (25% weight): Proposals submitted soon after joining
    - Profile Quality (25% weight): Complete and professional profiles
    - Initial Success (20% weight): Early wins and positive responses
    """
    ninety_days_ago = timezone.now() - timedelta(days=90)  # Extended to 90 days for more candidates
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    newcomers = Profile.objects.filter(
        user__role='freelancer',
        user__date_joined__gte=ninety_days_ago
    ).annotate(
        # Activity metrics
        total_proposals=Count('user__proposals'),
        early_proposals=Count('user__proposals', 
                            filter=Q(user__proposals__created_at__lte=F('user__date_joined') + timedelta(days=7))),
        accepted_proposals=Count('user__proposals', 
                               filter=Q(user__proposals__project__status__in=['in_progress', 'completed'])),
        
        # Days since joining (for recency calculation) - simplified approach
        days_since_joining=Case(
            When(user__date_joined__gte=timezone.now() - timedelta(days=1), then=Value(1)),
            When(user__date_joined__gte=timezone.now() - timedelta(days=7), then=Value(7)),
            When(user__date_joined__gte=timezone.now() - timedelta(days=30), then=Value(30)),
            When(user__date_joined__gte=timezone.now() - timedelta(days=60), then=Value(60)),
            default=Value(90),
            output_field=models.IntegerField()
        ),
        
        # Profile completeness (same as top freelancers)
        profile_completeness=Case(
            When(bio='', then=Value(0)),
            default=Value(20)
        ) + Case(
            When(skills__len=0, then=Value(0)),
            default=Value(20)
        ) + Case(
            When(hourly_rate__isnull=True, then=Value(0)),
            default=Value(20)
        ) + Case(
            When(location='', then=Value(0)),
            default=Value(20)
        ) + Case(
            When(avatar='', then=Value(0)),
            default=Value(20)
        ),
        
        # Calculate newcomer score (0-100)
        newcomer_score=(
            # Recency score (30% weight): newer = higher score
            Case(
                When(days_since_joining__lte=7, then=Value(30.0)),
                When(days_since_joining__lte=30, then=Value(25.0)),
                When(days_since_joining__lte=60, then=Value(15.0)),
                default=Value(5.0),
                output_field=DecimalField(max_digits=5, decimal_places=2)
            ) +
            
            # Early activity score (25% weight): proposals within first week
            Case(
                When(early_proposals__gte=3, then=Value(25.0)),
                When(early_proposals__gte=1, then=Value(15.0)),
                When(total_proposals__gte=1, then=Value(10.0)),
                default=Value(0.0),
                output_field=DecimalField(max_digits=5, decimal_places=2)
            ) +
            
            # Profile quality score (25% weight)
            Cast(F('profile_completeness'), DecimalField()) / Cast(Value(100.0), DecimalField()) * Cast(Value(25.0), DecimalField()) +
            
            # Initial success score (20% weight)
            Case(
                When(accepted_proposals__gte=1, then=Value(20.0)),
                When(total_proposals__gte=3, then=Value(10.0)),
                When(total_proposals__gte=1, then=Value(5.0)),
                default=Value(0.0),
                output_field=DecimalField(max_digits=5, decimal_places=2)
            )
        )
    ).filter(
        # Basic quality filters
        profile_completeness__gte=40,  # At least 40% profile completion
    ).order_by('-newcomer_score', '-user__date_joined')[:10]
    
    serializer = ProfileSerializer(newcomers, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def featured_freelancers(request):
    """
    Get featured freelancers using an advanced algorithm that balances multiple factors:
    - Overall Performance (30% weight): Rating + success rate + completed projects
    - Market Demand (25% weight): Skills in high-demand categories + competitive rates
    - Reliability (20% weight): Consistent activity + project completion rate
    - Professional Presence (15% weight): Profile quality + portfolio demos
    - Client Satisfaction (10% weight): Repeat clients + positive feedback patterns
    
    This creates a balanced mix of established performers and rising stars.
    """
    thirty_days_ago = timezone.now() - timedelta(days=30)
    ninety_days_ago = timezone.now() - timedelta(days=90)
    
    # High-demand skill categories (can be made configurable)
    high_demand_skills = [
        'react', 'python', 'javascript', 'node.js', 'aws', 'machine learning',
        'ui/ux design', 'mobile development', 'data analysis', 'digital marketing'
    ]
    
    featured = Profile.objects.filter(
        user__role='freelancer'
    ).annotate(
        # Core performance metrics
        completed_projects=Count('user__proposals__project', 
                               filter=Q(user__proposals__project__status='completed')),
        total_proposals=Count('user__proposals'),
        accepted_proposals=Count('user__proposals', 
                               filter=Q(user__proposals__project__status__in=['in_progress', 'completed'])),
        recent_proposals=Count('user__proposals', 
                             filter=Q(user__proposals__created_at__gte=thirty_days_ago)),
        consistent_activity=Count('user__proposals', 
                                filter=Q(user__proposals__created_at__gte=ninety_days_ago)),
        
        # Portfolio and professional presence
        video_demos_count=Count('video_demos', filter=Q(video_demos__is_public=True)),
        
        # Success and completion rates
        success_rate=Case(
            When(total_proposals=0, then=Value(0.0)),
            default=Cast(F('accepted_proposals'), DecimalField()) * Cast(Value(100.0), DecimalField()) / Cast(F('total_proposals'), DecimalField()),
            output_field=DecimalField(max_digits=5, decimal_places=2)
        ),
        
        completion_rate=Case(
            When(accepted_proposals=0, then=Value(0.0)),
            default=Cast(F('completed_projects'), DecimalField()) * Cast(Value(100.0), DecimalField()) / Cast(F('accepted_proposals'), DecimalField()),
            output_field=DecimalField(max_digits=5, decimal_places=2)
        ),
        
        # High-demand skills count (simplified - in production, use more sophisticated matching)
        high_demand_skills_count=Case(
            When(skills__icontains='react', then=Value(1)),
            default=Value(0)
        ) + Case(
            When(skills__icontains='python', then=Value(1)),
            default=Value(0)
        ) + Case(
            When(skills__icontains='javascript', then=Value(1)),
            default=Value(0)
        ) + Case(
            When(skills__icontains='design', then=Value(1)),
            default=Value(0)
        ),
        
        # Profile completeness
        profile_completeness=Case(
            When(bio='', then=Value(0)),
            default=Value(20)
        ) + Case(
            When(skills__len=0, then=Value(0)),
            default=Value(20)
        ) + Case(
            When(hourly_rate__isnull=True, then=Value(0)),
            default=Value(20)
        ) + Case(
            When(location='', then=Value(0)),
            default=Value(20)
        ) + Case(
            When(avatar='', then=Value(0)),
            default=Value(20)
        ),
        
        # Calculate featured score (0-100)
        featured_score=(
            # Overall Performance (30% weight)
            (
                # Rating component (40% of performance score)
                Cast(F('rating'), DecimalField()) / Cast(Value(5.0), DecimalField()) * Cast(Value(12.0), DecimalField()) +
                
                # Success rate component (35% of performance score)
                Cast(F('success_rate'), DecimalField()) / Cast(Value(100.0), DecimalField()) * Cast(Value(10.5), DecimalField()) +
                
                # Experience component (25% of performance score)
                Case(
                    When(completed_projects__gte=5, then=Value(7.5)),
                    default=Cast(F('completed_projects'), DecimalField()) * Cast(Value(1.5), DecimalField()),
                    output_field=DecimalField(max_digits=5, decimal_places=2)
                )
            ) +
            
            # Market Demand (25% weight)
            (
                # High-demand skills bonus
                Cast(F('high_demand_skills_count'), DecimalField()) * Cast(Value(5.0), DecimalField()) +
                
                # Competitive pricing (if hourly rate is reasonable)
                Case(
                    When(hourly_rate__isnull=True, then=Value(0.0)),
                    When(hourly_rate__lte=50, then=Value(10.0)),
                    When(hourly_rate__lte=100, then=Value(7.5)),
                    default=Value(5.0),
                    output_field=DecimalField(max_digits=5, decimal_places=2)
                ) +
                
                # Category diversity bonus
                Case(
                    When(skills__len__gte=5, then=Value(10.0)),
                    When(skills__len__gte=3, then=Value(5.0)),
                    default=Value(0.0),
                    output_field=DecimalField(max_digits=5, decimal_places=2)
                )
            ) +
            
            # Reliability (20% weight)
            (
                # Completion rate
                Cast(F('completion_rate'), DecimalField()) / Cast(Value(100.0), DecimalField()) * Cast(Value(10.0), DecimalField()) +
                
                # Consistent activity
                Case(
                    When(consistent_activity__gte=3, then=Value(10.0)),
                    When(consistent_activity__gte=1, then=Value(5.0)),
                    default=Value(0.0),
                    output_field=DecimalField(max_digits=5, decimal_places=2)
                )
            ) +
            
            # Professional Presence (15% weight)
            (
                # Profile completeness
                Cast(F('profile_completeness'), DecimalField()) / Cast(Value(100.0), DecimalField()) * Cast(Value(10.0), DecimalField()) +
                
                # Portfolio demos
                Case(
                    When(video_demos_count__gte=2, then=Value(5.0)),
                    When(video_demos_count__gte=1, then=Value(2.5)),
                    default=Value(0.0),
                    output_field=DecimalField(max_digits=5, decimal_places=2)
                )
            ) +
            
            # Client Satisfaction (10% weight) - simplified for now
            (
                # Recent activity bonus (indicates client demand)
                Case(
                    When(recent_proposals__gte=2, then=Value(10.0)),
                    When(recent_proposals__gte=1, then=Value(5.0)),
                    default=Value(0.0),
                    output_field=DecimalField(max_digits=5, decimal_places=2)
                )
            )
        )
    ).filter(
        # Quality thresholds for featured status
        rating__gte=3.0,  # Minimum rating
        total_proposals__gte=1,  # Has submitted proposals
        profile_completeness__gte=60,  # Well-completed profile
    ).order_by('-featured_score', '-rating', '-completed_projects')[:6]
    
    serializer = ProfileSerializer(featured, many=True, context={'request': request})
    return Response(serializer.data)

class VideoDemoListCreateView(generics.ListCreateAPIView):
    serializer_class = VideoDemoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return VideoDemo.objects.select_related('profile__user').all()
    
    def perform_create(self, serializer):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)

class VideoDemoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VideoDemoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return VideoDemo.objects.filter(
                models.Q(is_public=True) | models.Q(profile__user=self.request.user)
            ).select_related('profile__user')
        return VideoDemo.objects.filter(is_public=True).select_related('profile__user')
    
    def perform_update(self, serializer):
        # Only allow owner to update
        if self.get_object().profile.user != self.request.user:
            raise PermissionError("You can only update your own demos")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only allow owner to delete
        if instance.profile.user != self.request.user:
            raise PermissionError("You can only delete your own demos")
        instance.delete()
