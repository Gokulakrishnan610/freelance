"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  File,
  MoreVertical,
  Phone,
  Video,
  Search,
  Smile
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'client' | 'freelancer';
}

interface Message {
  id: number;
  content: string;
  sender: User;
  created_at: string;
  is_read: boolean;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: number;
  filename: string;
  file_size: number;
  file_type: string;
  file_url: string;
}

interface Conversation {
  id: number;
  client: User;
  freelancer: User;
  project?: number;
  updated_at: string;
  last_message?: {
    content: string;
    sender: string;
    created_at: string;
  };
  unread_count: number;
  messages?: Message[];
}

export function EnhancedMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
      // Set up polling for new messages every 5 seconds
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const response = await apiClient.getConversations();
      if (response.data && Array.isArray(response.data)) {
        setConversations(response.data);
        
        // If we have a selected conversation, update its messages
        if (selectedConversation) {
          const updatedConversation = response.data.find(
            (c: Conversation) => c.id === selectedConversation.id
          );
          if (updatedConversation && updatedConversation.messages) {
            setMessages(updatedConversation.messages);
          }
        }
      } else if (response.error) {
        console.error('API Error:', response.error);
        setConversations([]); // Ensure it's always an array
      } else {
        console.warn('Unexpected API response format:', response);
        setConversations([]); // Ensure it's always an array
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId: number) => {
    try {
      const response = await apiClient.getConversation(conversationId);
      if (response.data) {
        setMessages(response.data.messages || []);
        setSelectedConversation(response.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const response = await apiClient.sendMessage(selectedConversation.id, newMessage);
      if (response.data) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        // Update conversation list
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    // For now, show a toast that file attachments are coming soon
    toast({
      title: "File Attachments",
      description: "File attachment feature coming soon!",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherUser = (conversation: Conversation) => {
    return user?.role === 'client' ? conversation.freelancer : conversation.client;
  };

  const filteredConversations = Array.isArray(conversations) ? conversations.filter(conversation => {
    const otherUser = getOtherUser(conversation);
    const fullName = `${otherUser.first_name} ${otherUser.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           otherUser.email.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>Please log in to access messaging.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[580px]">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-3 p-3">
                        <div className="h-12 w-12 bg-muted rounded-full" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start messaging freelancers or clients to see conversations here</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const otherUser = getOtherUser(conversation);
                  const isSelected = selectedConversation?.id === conversation.id;
                  
                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 border-b transition-colors ${
                        isSelected ? 'bg-muted border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => fetchConversationMessages(conversation.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {otherUser.first_name?.[0]}{otherUser.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          {onlineUsers.has(otherUser.id) && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {otherUser.first_name} {otherUser.last_name}
                            </p>
                            <div className="flex items-center gap-2">
                              {conversation.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs px-2 py-1">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conversation.updated_at)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conversation.last_message?.content || 'No messages yet'}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {otherUser.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getOtherUser(selectedConversation).first_name?.[0]}
                        {getOtherUser(selectedConversation).last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {getOtherUser(selectedConversation).first_name} {getOtherUser(selectedConversation).last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getOtherUser(selectedConversation).role}
                        {onlineUsers.has(getOtherUser(selectedConversation).id) && (
                          <span className="ml-2 text-green-500">● Online</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="p-0">
                <ScrollArea className="h-[480px] p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.sender.id === user.id;
                        const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-end gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isOwnMessage && showAvatar && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {message.sender.first_name?.[0]}{message.sender.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {!isOwnMessage && !showAvatar && <div className="w-8" />}
                              
                              <div
                                className={`rounded-lg p-3 ${
                                  isOwnMessage
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {formatMessageTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                {/* Message Input */}
                <div className="p-4">
                  <div className="flex items-end space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFileAttachment}
                      className="shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        className="pr-12"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={sendMessage} 
                      disabled={sending || !newMessage.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a conversation from the list to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}