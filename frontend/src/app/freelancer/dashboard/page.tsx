// src/app/freelancer/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Briefcase, 
  DollarSign, 
  Star, 
  MessageSquare, 
  TrendingUp,
  Clock,
  User,
  Plus,
  Eye,
  Edit
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

interface Project {
  id: number;
  title: string;
  description: string;
  budget: number;
  category: string;
  status: string;
  client: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

interface Proposal {
  id: number;
  project: Project;
  cover_letter: string;
  proposed_budget: number;
  estimated_duration: string;
  status: string;
  created_at: string;
}

interface Profile {
  id: number;
  bio: string;
  skills: string[];
  hourly_rate: number;
  rating: number;
  completed_projects: number;
  location: string;
  profile_picture?: string;
  avatar?: string;
  avatar_url?: string;
}

interface DashboardStats {
  total_proposals: number;
  active_projects: number;
  total_earnings: number;
  profile_views: number;
}

export default function FreelancerDashboard() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_proposals: 0,
    active_projects: 0,
    total_earnings: 0,
    profile_views: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile?.role === 'freelancer') {
      fetchDashboardData();
    } else if (user && userProfile?.role !== 'freelancer') {
      router.push('/client/dashboard');
    }
  }, [user, userProfile, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        profileResponse,
        proposalsResponse,
        activeProjectsResponse,
        recentProjectsResponse
      ] = await Promise.all([
        apiClient.getMyProfile(),
        apiClient.getMyProposals(),
        apiClient.getMyActiveProjects(),
        apiClient.getProjects(new URLSearchParams({ limit: '5', status: 'open' }))
      ]);

      if (profileResponse.data) {
        setProfile(profileResponse.data);
      }

             if (proposalsResponse.data) {
         setProposals(proposalsResponse.data);
         setStats(prev => ({
           ...prev,
           total_proposals: proposalsResponse.data?.length || 0
         }));
       }

             if (activeProjectsResponse.data) {
         setActiveProjects(activeProjectsResponse.data);
         setStats(prev => ({
           ...prev,
           active_projects: activeProjectsResponse.data?.length || 0,
           total_earnings: activeProjectsResponse.data?.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0) || 0
         }));
       }

      if (recentProjectsResponse.data) {
        setRecentProjects(recentProjectsResponse.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || userProfile?.role !== 'freelancer') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Access denied. This dashboard is for freelancers only.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome back, {user.first_name}!
          </h1>
          <p className="text-muted-foreground">
            Manage your freelance business and track your progress
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button asChild variant="outline">
            <Link href="/profile/edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
          <Button asChild>
            <Link href="/projects">
              <Plus className="h-4 w-4 mr-2" />
              Find Work
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_proposals}</div>
            <p className="text-xs text-muted-foreground">
              Submitted this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_projects}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_earnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                          <div className="text-2xl font-bold">
                {profile?.rating ? Number(profile.rating).toFixed(1) : '5.0'}
              </div>
            <p className="text-xs text-muted-foreground">
              Based on {profile?.completed_projects || 0} projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposals">My Proposals</TabsTrigger>
          <TabsTrigger value="projects">Active Projects</TabsTrigger>
          <TabsTrigger value="opportunities">New Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url || profile?.avatar} />
                    <AvatarFallback>
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      {profile?.location || 'Location not set'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {profile?.bio || 'No bio available'}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${profile?.hourly_rate || 50}/hr
                      </span>
                                             <span className="flex items-center">
                         <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                         {profile?.rating ? Number(profile.rating).toFixed(1) : '5.0'}
                       </span>
                    </div>
                  </div>
                </div>
                {profile?.skills && profile.skills.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.slice(0, 6).map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {profile.skills.length > 6 && (
                        <Badge variant="outline">
                          +{profile.skills.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proposals.slice(0, 3).map((proposal) => (
                    <div key={proposal.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-sm">
                          Submitted proposal for{' '}
                          <Link 
                            href={`/projects/${proposal.project.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {proposal.project.title}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(proposal.created_at)}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(proposal.status)}
                      >
                        {proposal.status}
                      </Badge>
                    </div>
                  ))}
                  {proposals.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No recent activity. Start by submitting proposals!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Proposals ({proposals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {proposals.length > 0 ? (
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <div key={proposal.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            <Link 
                              href={`/projects/${proposal.project.id}`}
                              className="text-primary hover:underline"
                            >
                              {proposal.project.title}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Client: {proposal.project.client.first_name} {proposal.project.client.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {proposal.cover_letter.substring(0, 150)}...
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(proposal.status)}
                          >
                            {proposal.status}
                          </Badge>
                          <div className="mt-2 text-sm">
                            <div className="font-semibold text-green-600">
                              ${proposal.proposed_budget.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground">
                              {proposal.estimated_duration}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Submitted {formatTimeAgo(proposal.created_at)}</span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/projects/${proposal.project.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Project
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any proposals yet
                  </p>
                  <Button asChild>
                    <Link href="/projects">Browse Projects</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Projects ({activeProjects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {activeProjects.length > 0 ? (
                <div className="space-y-4">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            <Link 
                              href={`/projects/${project.id}`}
                              className="text-primary hover:underline"
                            >
                              {project.title}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Client: {project.client.first_name} {project.client.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {project.description.substring(0, 150)}...
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant="secondary">
                            {project.status}
                          </Badge>
                          <div className="mt-2 text-sm">
                            <div className="font-semibold text-green-600">
                              ${project.budget?.toLocaleString() || 'TBD'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Started {formatTimeAgo(project.created_at)}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/messaging?project=${project.id}`}>
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Message
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No active projects yet
                  </p>
                  <Button asChild>
                    <Link href="/projects">Find Your First Project</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            <Link 
                              href={`/projects/${project.id}`}
                              className="text-primary hover:underline"
                            >
                              {project.title}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {project.category} • Posted {formatTimeAgo(project.created_at)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {project.description.substring(0, 150)}...
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-green-600">
                            ${project.budget?.toLocaleString() || 'Budget TBD'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {project.status}
                        </Badge>
                        <Button size="sm" asChild>
                          <Link href={`/projects/${project.id}`}>
                            View & Apply
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No new opportunities at the moment
                  </p>
                  <Button asChild>
                    <Link href="/projects">Browse All Projects</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
