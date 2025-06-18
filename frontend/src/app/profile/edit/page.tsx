// src/app/profile/edit/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  MapPin, 
  DollarSign, 
  Plus, 
  X,
  Save,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";

interface Profile {
  id: number;
  bio: string;
  skills: string[];
  hourly_rate: number;
  rating: number;
  completed_projects: number;
  location: string;
  avatar?: string;
  avatar_url?: string;
}

export default function EditProfilePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getMyProfile();
      if (response.data) {
        const profileData = response.data;
        setProfile(profileData);
        setBio(profileData.bio || '');
        setLocation(profileData.location || '');
        setHourlyRate(profileData.hourly_rate?.toString() || '');
        setSkills(profileData.skills || []);
      } else if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 20) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    } else if (skills.length >= 20) {
      toast({
        title: "Skill Limit Reached",
        description: "You can add a maximum of 20 skills.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileData = {
        bio: bio.trim(),
        location: location.trim(),
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        skills: skills,
      };

      const response = await apiClient.updateMyProfile(profileData);
      
      if (response.data) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
        
        // Redirect based on user role
        if (userProfile?.role === 'freelancer') {
          router.push('/freelancer/dashboard');
        } else {
          router.push('/client/dashboard');
        }
      } else if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Please log in to edit your profile.
            </p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href={userProfile?.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Edit Profile</h1>
            <p className="text-muted-foreground">
              Update your information to attract the right opportunities
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileImageUpload 
                currentImage={profile?.avatar_url || profile?.avatar}
                onImageUpdate={(imageUrl) => {
                  // Update local state if needed
                  setProfile(prev => prev ? { ...prev, avatar_url: imageUrl } : null);
                }}
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Profile Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profile?.avatar_url || profile?.avatar} />
                  <AvatarFallback className="text-lg">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-muted-foreground capitalize">
                  {userProfile?.role}
                </p>
                {location && (
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {location}
                  </div>
                )}
                {userProfile?.role === 'freelancer' && hourlyRate && (
                  <div className="flex items-center text-sm font-semibold text-green-600 mt-2">
                    <DollarSign className="h-4 w-4 mr-1" />
                    ${hourlyRate}/hr
                  </div>
                )}
              </div>
              
              {bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio</h4>
                  <p className="text-sm text-muted-foreground">
                    {bio}
                  </p>
                </div>
              )}

              {skills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {skills.length > 6 && (
                      <Badge variant="outline">
                        +{skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {profile && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rating:</span>
                                         <span className="font-semibold">
                       ⭐ {profile.rating ? Number(profile.rating).toFixed(1) : '5.0'}
                     </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projects:</span>
                    <span className="font-semibold">
                      {profile.completed_projects || 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself, your experience, and what makes you unique..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bio.length}/1000 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={100}
                  />
                </div>

                {userProfile?.role === 'freelancer' && (
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="50"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      min="1"
                      max="1000"
                    />
                  </div>
                )}
              </div>

              {/* Skills Section */}
              <div className="space-y-4">
                <div>
                  <Label>Skills</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add skills that showcase your expertise
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      maxLength={50}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddSkill}
                      disabled={!newSkill.trim() || skills.length >= 20}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {skills.length}/20 skills added
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-pulse" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  asChild
                  className="flex-1"
                >
                  <Link href={userProfile?.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'}>
                    Cancel
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
