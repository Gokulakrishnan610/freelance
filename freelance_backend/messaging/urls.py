from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/start/', views.start_conversation, name='start-conversation'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:conversation_id>/send/', views.send_message, name='send-message'),
    path('unread-count/', views.unread_messages_count, name='unread-messages-count'),
] 