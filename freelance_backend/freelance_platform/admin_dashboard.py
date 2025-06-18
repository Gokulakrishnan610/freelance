from django.db.models import Count, Avg, Sum
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from projects.models import Project, ProjectProposal
from profiles.models import Profile
from messaging.models import Conversation, Message

def dashboard_callback(request, context):
    """Custom dashboard with platform statistics"""
    
    # Get current date for time-based queries
    now = timezone.now()
    last_30_days = now - timedelta(days=30)
    last_7_days = now - timedelta(days=7)
    
    # User Statistics
    total_users = User.objects.count()
    clients_count = User.objects.filter(role='client').count()
    freelancers_count = User.objects.filter(role='freelancer').count()
    new_users_this_month = User.objects.filter(date_joined__gte=last_30_days).count()
    
    # Project Statistics
    total_projects = Project.objects.count()
    open_projects = Project.objects.filter(status='open').count()
    in_progress_projects = Project.objects.filter(status='in_progress').count()
    completed_projects = Project.objects.filter(status='completed').count()
    projects_this_month = Project.objects.filter(created_at__gte=last_30_days).count()
    
    # Proposal Statistics
    total_proposals = ProjectProposal.objects.count()
    recent_proposals = ProjectProposal.objects.filter(created_at__gte=last_7_days).count()
    
    # Financial Statistics
    total_project_value = Project.objects.aggregate(total=Sum('budget'))['total'] or 0
    avg_project_budget = Project.objects.aggregate(avg=Avg('budget'))['avg'] or 0
    avg_proposal_budget = ProjectProposal.objects.aggregate(avg=Avg('proposed_budget'))['avg'] or 0
    
    # Messaging Statistics
    total_conversations = Conversation.objects.count()
    total_messages = Message.objects.count()
    messages_this_week = Message.objects.filter(created_at__gte=last_7_days).count()
    unread_messages = Message.objects.filter(is_read=False).count()
    
    # Profile Statistics
    profiles_with_rating = Profile.objects.filter(rating__isnull=False).count()
    avg_freelancer_rating = Profile.objects.filter(
        user__role='freelancer', 
        rating__isnull=False
    ).aggregate(avg=Avg('rating'))['avg'] or 0
    
    # Top performing freelancers
    top_freelancers = Profile.objects.filter(
        user__role='freelancer',
        rating__isnull=False
    ).order_by('-rating')[:5]
    
    # Recent activity
    recent_projects = Project.objects.order_by('-created_at')[:5]
    recent_users = User.objects.order_by('-date_joined')[:5]
    
    # Add dashboard data to context
    context.update({
        'dashboard_stats': [
            {
                "title": "Platform Overview",
                "metric": f"{total_users:,}",
                "footer": "Total Users",
                "chart": {
                    "type": "bar",
                    "data": {
                        "labels": ["Clients", "Freelancers", "Admins"],
                        "datasets": [{
                            "data": [
                                clients_count,
                                freelancers_count,
                                User.objects.filter(role='admin').count()
                            ]
                        }]
                    }
                }
            },
            {
                "title": "Project Statistics",
                "metric": f"{total_projects:,}",
                "footer": f"{projects_this_month} new this month",
                "chart": {
                    "type": "doughnut",
                    "data": {
                        "labels": ["Open", "In Progress", "Completed"],
                        "datasets": [{
                            "data": [open_projects, in_progress_projects, completed_projects]
                        }]
                    }
                }
            },
            {
                "title": "Proposal Activity",
                "metric": f"{total_proposals:,}",
                "footer": f"{recent_proposals} this week",
            },
            {
                "title": "Financial Overview",
                "metric": f"${total_project_value:,.0f}",
                "footer": f"Avg: ${avg_project_budget:,.0f} per project",
            },
            {
                "title": "Messaging Activity",
                "metric": f"{total_messages:,}",
                "footer": f"{messages_this_week} messages this week",
                "chart": {
                    "type": "line",
                    "data": {
                        "labels": ["Total", "This Week", "Unread"],
                        "datasets": [{
                            "data": [total_messages, messages_this_week, unread_messages]
                        }]
                    }
                }
            },
            {
                "title": "Quality Metrics",
                "metric": f"{avg_freelancer_rating:.1f}⭐",
                "footer": f"{profiles_with_rating} rated profiles",
            },
            {
                "title": "Recent Activity",
                "metric": f"{new_users_this_month}",
                "footer": "New users this month",
            }
        ]
    })
    
    return context 