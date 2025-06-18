from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, ConversationListSerializer, MessageSerializer
from accounts.models import User

class ConversationListView(generics.ListAPIView):
    """List all conversations for the current user"""
    serializer_class = ConversationListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(client=user) | Q(freelancer=user)
        ).prefetch_related('messages')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_conversation(request):
    """Start a new conversation with a freelancer or client"""
    other_user_id = request.data.get('user_id')
    project_id = request.data.get('project_id')
    
    if not other_user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        other_user = User.objects.get(id=other_user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Determine client and freelancer roles
    if request.user.role == 'client' and other_user.role == 'freelancer':
        client = request.user
        freelancer = other_user
    elif request.user.role == 'freelancer' and other_user.role == 'client':
        client = other_user
        freelancer = request.user
    else:
        return Response({'error': 'Conversations can only be between clients and freelancers'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Get or create conversation
    conversation, created = Conversation.objects.get_or_create(
        client=client,
        freelancer=freelancer,
        project_id=project_id if project_id else None
    )
    
    serializer = ConversationSerializer(conversation, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class ConversationDetailView(generics.RetrieveAPIView):
    """Get a specific conversation with all messages"""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(client=user) | Q(freelancer=user)
        ).prefetch_related('messages__sender')
    
    def retrieve(self, request, *args, **kwargs):
        conversation = self.get_object()
        
        # Mark messages as read for the current user
        Message.objects.filter(
            conversation=conversation,
            is_read=False
        ).exclude(sender=request.user).update(is_read=True)
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    """Send a message in a conversation"""
    try:
        conversation = Conversation.objects.get(
            id=conversation_id,
            **{f'{request.user.role}': request.user}
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
    
    content = request.data.get('content')
    if not content:
        return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    message = Message.objects.create(
        conversation=conversation,
        sender=request.user,
        content=content
    )
    
    # Update conversation timestamp
    conversation.save()
    
    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_messages_count(request):
    """Get count of unread messages for the current user"""
    user = request.user
    unread_count = Message.objects.filter(
        conversation__in=Conversation.objects.filter(
            Q(client=user) | Q(freelancer=user)
        ),
        is_read=False
    ).exclude(sender=user).count()
    
    return Response({'unread_count': unread_count})
