from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Project(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    CATEGORY_CHOICES = [
        ('web-development', 'Web Development'),
        ('mobile-development', 'Mobile Development'),
        ('graphic-design', 'Graphic Design'),
        ('writing-translation', 'Writing & Translation'),
        ('marketing-sales', 'Marketing & Sales'),
        ('video-animation', 'Video & Animation'),
        ('data-science-analytics', 'Data Science & Analytics'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    skills = models.JSONField(default=list, blank=True)  # Store as JSON array
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_projects')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.client.email}"

class ProjectProposal(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='proposals')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proposals')
    message = models.TextField()
    proposed_budget = models.DecimalField(max_digits=10, decimal_places=2)
    timeline = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['project', 'freelancer']
    
    def __str__(self):
        return f"{self.freelancer.email} - {self.project.title} ({self.status})"
