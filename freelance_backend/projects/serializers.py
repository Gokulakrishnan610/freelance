from rest_framework import serializers
from .models import Project, ProjectProposal
from accounts.serializers import UserSerializer

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'budget', 'category', 'skills',
            'client', 'client_name', 'client_email', 'status', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'client', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)

class ProjectDetailSerializer(ProjectSerializer):
    proposals_count = serializers.IntegerField(source='proposals.count', read_only=True)
    client = UserSerializer(read_only=True)
    
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['proposals_count']

class ProjectProposalSerializer(serializers.ModelSerializer):
    freelancer_name = serializers.CharField(source='freelancer.name', read_only=True)
    freelancer_email = serializers.CharField(source='freelancer.email', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = ProjectProposal
        fields = [
            'id', 'project', 'project_title', 'freelancer', 
            'freelancer_name', 'freelancer_email', 'message', 
            'proposed_budget', 'timeline', 'status', 'created_at'
        ]
        read_only_fields = ('id', 'freelancer', 'created_at')
    
    def create(self, validated_data):
        validated_data['freelancer'] = self.context['request'].user
        return super().create(validated_data)