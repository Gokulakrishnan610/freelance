// src/app/client/dashboard/page.tsx
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
  Users, 
  MessageSquare, 
  TrendingUp,
  Clock,
  Plus,
  Eye,
  Edit,
  CheckCircle
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
  created_at: string;
  proposals_count?: number;
}

interface Proposal {
  id: number;
  freelancer: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
    rating: number;
    hourly_rate: number;
  };
  cover_letter: string;
  proposed_budget: number;
  estimated_duration: string;
  status: string;
  created_at: string;
}

interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_spent: number;
  total_proposals: number;
}

export default function ClientDashboard() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentProposals, setRecentProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_projects: 0,
    active_projects: 0,
    total_spent: 0,
    total_proposals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile?.role === 'client') {
      fetchDashboardData();
    } else if (user && userProfile?.role !== 'client') {
      router.push('/freelancer/dashboard');
    }
  }, [user, userProfile, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const projectsResponse = await apiClient.getMyProjects();
      
      if (projectsResponse.data) {
        setProjects(projectsResponse.data);
        
        const totalProjects = projectsResponse.data.length;
                 const activeProjects = projectsResponse.data.filter((p: Project) => 
           p.status === 'open' || p.status === 'in_progress'
         ).length;
        const totalSpent = projectsResponse.data
          .filter((p: Project) => p.status === 'completed')
          .reduce((sum: number, p: Project) => sum + (p.budget || 0), 0);

        setStats(prev => ({
          ...prev,
          total_projects: totalProjects,
          active_projects: activeProjects,
          total_spent: totalSpent,
        }));

        // Fetch proposals for recent projects
        const recentProjectIds = projectsResponse.data.slice(0, 3).map((p: Project) => p.id);
        const proposalPromises = recentProjectIds.map(id => 
          apiClient.getProjectProposals(id.toString())
        );
        
        const proposalResponses = await Promise.all(proposalPromises);
        const allProposals: Proposal[] = [];
        let totalProposalCount = 0;
        
        proposalResponses.forEach(response => {
          if (response.data) {
            allProposals.push(...response.data);
            totalProposalCount += response.data.length;
          }
        });
        
        setRecentProposals(allProposals.slice(0, 5));
        setStats(prev => ({
          ...prev,
          total_proposals: totalProposalCount,
        }));
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
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || userProfile?.role !== 'client') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Access denied. This dashboard is for clients only.
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
            Manage your projects and connect with talented freelancers
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button asChild variant="outline">
            <Link href="/projects">
              <Eye className="h-4 w-4 mr-2" />
              Browse Freelancers
            </Link>
          </Button>
          <Button asChild>
            <Link href="/projects/post">
              <Plus className="h-4 w-4 mr-2" />
              Post Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_projects}</div>
            <p className="text-xs text-muted-foreground">
              Projects posted
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
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_spent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              On completed projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_proposals}</div>
            <p className="text-xs text-muted-foreground">
              Received from freelancers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="proposals">Recent Proposals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <Link 
                            href={`/projects/${project.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {project.title}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {project.category} • {formatTimeAgo(project.created_at)}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(project.status)}
                      >
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No projects yet. Post your first project to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Proposals */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProposals.map((proposal) => (
                    <div key={proposal.id} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {proposal.freelancer.user.first_name[0]}
                          {proposal.freelancer.user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {proposal.freelancer.user.first_name} {proposal.freelancer.user.last_name}
                          </span>
                          {' '}submitted a proposal
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${proposal.proposed_budget.toLocaleString()} • {formatTimeAgo(proposal.created_at)}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getProposalStatusColor(proposal.status)}
                      >
                        {proposal.status}
                      </Badge>
                    </div>
                  ))}
                  {recentProposals.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No proposals yet. Post a project to start receiving proposals!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Projects ({projects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => (
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
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(project.status)}
                          >
                            {project.status}
                          </Badge>
                          <div className="mt-2 text-sm">
                            <div className="font-semibold text-green-600">
                              ${project.budget?.toLocaleString() || 'Budget TBD'}
                            </div>
                            <div className="text-muted-foreground">
                              {project.proposals_count || 0} proposals
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Posted {formatTimeAgo(project.created_at)}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/messaging?project=${project.id}`}>
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Messages
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
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
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    You haven't posted any projects yet
                  </p>
                  <Button asChild>
                    <Link href="/projects/post">Post Your First Project</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Proposals ({recentProposals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {recentProposals.length > 0 ? (
                <div className="space-y-4">
                  {recentProposals.map((proposal) => (
                    <div key={proposal.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {proposal.freelancer.user.first_name[0]}
                              {proposal.freelancer.user.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {proposal.freelancer.user.first_name} {proposal.freelancer.user.last_name}
                            </h4>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <span className="flex items-center">
                                ⭐ {proposal.freelancer.rating ? Number(proposal.freelancer.rating).toFixed(1) : '5.0'}
                              </span>
                              <span className="mx-2">•</span>
                              <span>${proposal.freelancer.hourly_rate}/hr</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {proposal.cover_letter.substring(0, 100)}...
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge 
                            variant="outline" 
                            className={getProposalStatusColor(proposal.status)}
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Submitted {formatTimeAgo(proposal.created_at)}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            View Profile
                          </Button>
                          {proposal.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline">
                                Reject
                              </Button>
                              <Button size="sm">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Accept
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No proposals received yet
                  </p>
                  <Button asChild>
                    <Link href="/projects/post">Post a Project to Get Proposals</Link>
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
