from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter, ChoicesDropdownFilter
from unfold.decorators import display
from .models import Project, ProjectProposal

class ProjectProposalInline(TabularInline):
    model = ProjectProposal
    extra = 0
    readonly_fields = ['created_at']
    fields = ['freelancer', 'message', 'proposed_budget', 'status', 'created_at']

@admin.register(Project)
class ProjectAdmin(ModelAdmin):
    list_display = ['title', 'client', 'get_budget_display', 'status', 'get_proposals_count', 'created_at']
    list_filter = [
        ('status', ChoicesDropdownFilter),
        ('created_at', RangeDateFilter),
        'client__role'
    ]
    search_fields = ['title', 'description', 'client__email', 'client__first_name', 'client__last_name']
    ordering = ['-created_at']
    list_per_page = 20
    
    fieldsets = (
        ('Project Details', {
            'fields': ('title', 'description', 'client')
        }),
        ('Project Specifications', {
            'fields': ('budget', 'deadline', 'skills_required', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProjectProposalInline]
    
    # Custom display methods
    @display(description="Budget", ordering="budget")
    def get_budget_display(self, obj):
        if obj.budget:
            return f"${obj.budget:,}"
        return "Not specified"
    
    @display(description="Proposals", ordering="proposals_count")
    def get_proposals_count(self, obj):
        return obj.proposals.count()
    
    # Custom actions
    actions = ['mark_as_open', 'mark_as_closed', 'mark_as_in_progress']
    
    @admin.action(description='Mark selected projects as Open')
    def mark_as_open(self, request, queryset):
        updated = queryset.update(status='open')
        self.message_user(request, f'{updated} projects marked as Open.')
    
    @admin.action(description='Mark selected projects as In Progress')
    def mark_as_in_progress(self, request, queryset):
        updated = queryset.update(status='in_progress')
        self.message_user(request, f'{updated} projects marked as In Progress.')
    
    @admin.action(description='Mark selected projects as Closed')
    def mark_as_closed(self, request, queryset):
        updated = queryset.update(status='closed')
        self.message_user(request, f'{updated} projects marked as Closed.')

@admin.register(ProjectProposal)
class ProjectProposalAdmin(ModelAdmin):
    list_display = ['project', 'freelancer', 'get_budget_display', 'timeline', 'created_at']
    list_filter = [
        ('created_at', RangeDateFilter),
        'project__status'
    ]
    search_fields = [
        'project__title', 
        'freelancer__email', 
        'freelancer__first_name', 
        'freelancer__last_name',
        'message'
    ]
    ordering = ['-created_at']
    list_per_page = 25
    
    fieldsets = (
        ('Proposal Details', {
            'fields': ('project', 'freelancer', 'message')
        }),
        ('Financial & Timeline', {
            'fields': ('proposed_budget', 'timeline')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ['collapse']
        }),
    )
    
    readonly_fields = ['created_at']
    
    # Custom display methods
    @display(description="Proposed Budget", ordering="proposed_budget")
    def get_budget_display(self, obj):
        return f"${obj.proposed_budget:,}" if obj.proposed_budget else "Not specified"
    
    # Custom actions
    actions = ['delete_selected_proposals']
    
    @admin.action(description='Delete selected proposals')
    def delete_selected_proposals(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} proposals deleted.')
