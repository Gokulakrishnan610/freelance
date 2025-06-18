'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Calendar, DollarSign, MessageCircle, Briefcase } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'freelancer' | 'client';
  bio?: string;
  location?: string;
  hourly_rate?: number;
  skills?: string[];
  rating?: number;
  completed_projects?: number;
  avatar?: string;
  date_joined: string;
  avatar_url?: string;
}

export default function ProfilePage() {
  const params = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Use a public method to get profile data
        const response = await fetch(`http://localhost:8000/api/profiles/${params.id}/`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Profile not found');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        setError(error.message || 'Failed to load profile');
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
  }, [params.id, toast]);

  const handleStartConversation = async () => {
    try {
      if (!profile) return;
      
      // Start a conversation with this user
      const response = await apiClient.startConversation(profile.id);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        toast({
          title: "Conversation Started",
          description: "Redirecting to messaging...",
        });
        
        // Redirect to messaging page
        window.location.href = '/messaging';
      } else {
        throw new Error("Failed to start conversation - no data returned");
      }
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="bg-gray-200 h-6 rounded w-1/3"></div>
              <div className="bg-gray-200 h-4 rounded w-2/3"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested profile could not be found.'}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || profile.avatar} alt={profile.username} />
                <AvatarFallback className="text-2xl">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    <p className="text-gray-600">@{profile.username}</p>
                    <Badge variant={profile.role === 'freelancer' ? 'default' : 'secondary'} className="mt-2">
                      {profile.role === 'freelancer' ? 'Freelancer' : 'Client'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleStartConversation} className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {profile.bio || 'No bio available.'}
                </p>
              </CardContent>
            </Card>

            {/* Skills (for freelancers) */}
            {profile.role === 'freelancer' && profile.skills && profile.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.role === 'freelancer' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="font-medium">
                          {profile.rating ? Number(profile.rating).toFixed(1) : '5.0'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Projects Completed</span>
                      <span className="font-medium">{profile.completed_projects || 0}</span>
                    </div>

                    {profile.hourly_rate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Hourly Rate</span>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span className="font-medium">${profile.hourly_rate}/hr</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="font-medium">
                      {new Date(profile.date_joined).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {profile.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Location</span>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="font-medium">{profile.location}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}