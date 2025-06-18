from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter, ChoicesDropdownFilter
from unfold.decorators import display
from .models import Conversation, Message, MessageAttachment

class MessageInline(TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['created_at']
    fields = ['sender', 'content', 'is_read', 'created_at']
    ordering = ['-created_at']

class MessageAttachmentInline(TabularInline):
    model = MessageAttachment
    extra = 0
    readonly_fields = ['uploaded_at']
    fields = ['filename', 'file', 'file_size', 'uploaded_at']

@admin.register(Conversation)
class ConversationAdmin(ModelAdmin):
    list_display = ['get_conversation_title', 'client', 'freelancer', 'get_project_title', 'get_messages_count', 'get_last_message_time', 'updated_at']
    list_filter = [
        ('created_at', RangeDateFilter),
        ('updated_at', RangeDateFilter),
        'client__role',
        'freelancer__role'
    ]
    search_fields = [
        'client__email',
        'client__first_name', 
        'client__last_name',
        'freelancer__email',
        'freelancer__first_name',
        'freelancer__last_name',
        'project__title'
    ]
    ordering = ['-updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('Conversation Participants', {
            'fields': ('client', 'freelancer', 'project')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    inlines = [MessageInline]
    
    # Custom display methods
    @display(description="Conversation", ordering="client__email")
    def get_conversation_title(self, obj):
        return f"{obj.client.first_name or obj.client.email} ↔ {obj.freelancer.first_name or obj.freelancer.email}"
    
    @display(description="Project", ordering="project__title")
    def get_project_title(self, obj):
        return obj.project.title if obj.project else "General conversation"
    
    @display(description="Messages", ordering="messages_count")
    def get_messages_count(self, obj):
        return obj.messages.count()
    
    @display(description="Last Message", ordering="updated_at")
    def get_last_message_time(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return last_message.created_at.strftime("%Y-%m-%d %H:%M")
        return "No messages"
    
    # Custom actions
    actions = ['mark_all_messages_read']
    
    @admin.action(description='Mark all messages in selected conversations as read')
    def mark_all_messages_read(self, request, queryset):
        total_updated = 0
        for conversation in queryset:
            updated = conversation.messages.filter(is_read=False).update(is_read=True)
            total_updated += updated
        self.message_user(request, f'{total_updated} messages marked as read across {queryset.count()} conversations.')

@admin.register(Message)
class MessageAdmin(ModelAdmin):
    list_display = ['get_conversation_title', 'sender', 'get_content_preview', 'is_read', 'get_attachments_count', 'created_at']
    list_filter = [
        'is_read',
        ('created_at', RangeDateFilter),
        'sender__role'
    ]
    search_fields = [
        'content',
        'sender__email',
        'sender__first_name',
        'sender__last_name',
        'conversation__client__email',
        'conversation__freelancer__email'
    ]
    ordering = ['-created_at']
    list_per_page = 30
    
    fieldsets = (
        ('Message Details', {
            'fields': ('conversation', 'sender', 'content')
        }),
        ('Status & Attachments', {
            'fields': ('is_read',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ['collapse']
        }),
    )
    
    readonly_fields = ['created_at']
    inlines = [MessageAttachmentInline]
    
    # Custom display methods
    @display(description="Conversation", ordering="conversation__client__email")
    def get_conversation_title(self, obj):
        return f"{obj.conversation.client.first_name or obj.conversation.client.email} ↔ {obj.conversation.freelancer.first_name or obj.conversation.freelancer.email}"
    
    @display(description="Content Preview")
    def get_content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    
    @display(description="Attachments", ordering="attachments_count")
    def get_attachments_count(self, obj):
        return obj.attachments.count()
    
    # Custom actions
    actions = ['mark_as_read', 'mark_as_unread']
    
    @admin.action(description='Mark selected messages as read')
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} messages marked as read.')
    
    @admin.action(description='Mark selected messages as unread')
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} messages marked as unread.')

@admin.register(MessageAttachment)
class MessageAttachmentAdmin(ModelAdmin):
    list_display = ['filename', 'get_message_preview', 'get_file_size_display', 'uploaded_at']
    list_filter = [
        ('uploaded_at', RangeDateFilter),
    ]
    search_fields = [
        'filename',
        'message__content',
        'message__sender__email'
    ]
    ordering = ['-uploaded_at']
    list_per_page = 25
    
    fieldsets = (
        ('Attachment Details', {
            'fields': ('message', 'filename', 'file')
        }),
        ('File Information', {
            'fields': ('file_size',)
        }),
        ('Timestamps', {
            'fields': ('uploaded_at',),
            'classes': ['collapse']
        }),
    )
    
    readonly_fields = ['uploaded_at', 'file_size']
    
    # Custom display methods
    @display(description="Message", ordering="message__created_at")
    def get_message_preview(self, obj):
        return f"From {obj.message.sender.email}: {obj.message.content[:30]}..."
    
    @display(description="File Size", ordering="file_size")
    def get_file_size_display(self, obj):
        if obj.file_size:
            if obj.file_size < 1024 * 1024:  # Less than 1MB
                return f"{obj.file_size / 1024:.1f} KB"
            else:  # 1MB or more
                return f"{obj.file_size / (1024 * 1024):.1f} MB"
        return "Unknown size"
