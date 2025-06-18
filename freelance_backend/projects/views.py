from django.shortcuts import render
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project, ProjectProposal
from .serializers import ProjectSerializer, ProjectDetailSerializer, ProjectProposalSerializer

# Create your views here.

class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['title', 'description', 'skills']
    ordering_fields = ['created_at', 'budget']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Project.objects.select_related('client').all()

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.select_related('client').prefetch_related('proposals')
    
    def perform_update(self, serializer):
        # Only allow the client who posted the project to update it
        if self.get_object().client != self.request.user:
            raise PermissionError("You can only update your own projects")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only allow the client who posted the project to delete it
        if instance.client != self.request.user:
            raise PermissionError("You can only delete your own projects")
        instance.delete()

class ProjectProposalListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectProposalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        if project_id:
            return ProjectProposal.objects.filter(project_id=project_id).select_related('freelancer', 'project')
        return ProjectProposal.objects.select_related('freelancer', 'project').all()
    
    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        if project_id:
            serializer.save(project_id=project_id)
        else:
            serializer.save()

class ProposalListCreateView(generics.ListCreateAPIView):
    """General proposals endpoint for creating proposals"""
    serializer_class = ProjectProposalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ProjectProposal.objects.select_related('freelancer', 'project').all()
    
    def perform_create(self, serializer):
        # Ensure only freelancers can create proposals
        if self.request.user.role != 'freelancer':
            raise PermissionError("Only freelancers can submit proposals")
        serializer.save(freelancer=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_projects(request):
    """Get projects posted by the current user (for clients)"""
    if request.user.role != 'client':
        return Response({'error': 'Only clients can view their projects'}, status=status.HTTP_403_FORBIDDEN)
    
    projects = Project.objects.filter(client=request.user).order_by('-created_at')
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_proposals(request):
    """Get proposals submitted by the current user (for freelancers)"""
    if request.user.role != 'freelancer':
        return Response({'error': 'Only freelancers can view their proposals'}, status=status.HTTP_403_FORBIDDEN)
    
    proposals = ProjectProposal.objects.filter(freelancer=request.user).select_related('project').order_by('-created_at')
    serializer = ProjectProposalSerializer(proposals, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_active_projects(request):
    """Get active projects for the current user (works for both clients and freelancers)"""
    if request.user.role == 'client':
        # For clients, get their posted projects that are active
        projects = Project.objects.filter(
            client=request.user,
            status__in=['open', 'in_progress']
        ).order_by('-created_at')
    elif request.user.role == 'freelancer':
        # For freelancers, get projects where they have accepted proposals
        # First get the accepted proposals for this freelancer
        accepted_proposals = ProjectProposal.objects.filter(
            freelancer=request.user,
            status='accepted'
        ).values_list('project_id', flat=True)
        
        # Then get the projects for those proposals
        projects = Project.objects.filter(
            id__in=accepted_proposals,
            status='in_progress'
        ).order_by('-created_at')
    else:
        return Response({'error': 'Invalid user role'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)
