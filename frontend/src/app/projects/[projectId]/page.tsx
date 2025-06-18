// src/app/projects/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, DollarSign, User, Tag, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { ApplyToProjectDialog } from "@/components/projects/apply-to-project-dialog";
import { apiClient } from "@/lib/api";

interface Project {
  id: number;
  title: string;
  description: string;
  budget?: number;
  deadline: string;
  skills_required: string[];
  status: string;
  client: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  proposals_count?: number;
}

interface Proposal {
  id: number;
  freelancer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  message: string;
  proposed_budget: number;
  created_at: string;
  status: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) {
        setError("Project ID is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.getProject(projectId);
        if (response.data) {
          setProject(response.data);
          
          // Check if user has already applied (for freelancers)
          if (user?.role === 'freelancer') {
            const proposalsResponse = await apiClient.getMyProposals();
            if (proposalsResponse.data) {
              const hasProposal = proposalsResponse.data.some(
                (proposal: any) => proposal.project.id === parseInt(projectId)
              );
              setHasApplied(hasProposal);
            }
          }

          // Fetch proposals if user is the client
          if (user?.role === 'client' && user.id === response.data.client.id) {
            const proposalsResponse = await apiClient.getProjectProposals(projectId);
            if (proposalsResponse.data) {
              setProposals(proposalsResponse.data);
            }
          }
        } else {
          setError("Project not found.");
        }
      } catch (err) {
        console.error("Error fetching project details:", err);
        setError("Failed to load project details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId, user]);

  const canApply = user &&
                   user.role === 'freelancer' &&
                   project?.status === 'open' &&
                   user.id !== project?.client.id &&
                   !hasApplied;

  const isOwner = user && user.id === project?.client.id;

  const handleApplicationSuccess = () => {
    setHasApplied(true);
    setShowApplyDialog(false);
    // Refresh the page to show updated data
    window.location.reload();
  };

  const startConversation = async (freelancerId: number) => {
    if (!user || startingConversation) return;

    setStartingConversation(true);
    try {
      const response = await apiClient.startConversation(freelancerId, project?.id);
      if (response.data) {
        router.push('/messaging');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setStartingConversation(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return 'Overdue';
    if (diffInDays === 0) return 'Due today';
    if (diffInDays === 1) return 'Due tomorrow';
    return `Due in ${diffInDays} days`;
  };

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-xl text-destructive">{error}</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  if (!project) {
    return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Project data unavailable.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 lg:py-16">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Project Details Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <CardTitle className="text-2xl md:text-3xl font-bold text-primary">{project.title}</CardTitle>
              <Badge variant={project.status === 'open' ? 'default' : project.status === 'in_progress' ? 'secondary' : 'outline'} className="capitalize text-sm px-3 py-1">
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" /> 
                Posted by: {project.client.first_name} {project.client.last_name}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" /> 
                Posted on: {formatDate(project.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" /> 
                {formatDeadline(project.deadline)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {project.budget && (
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <DollarSign className="w-5 h-5" /> Budget: ${project.budget.toLocaleString()}
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Project Description</h3>
              <p className="text-foreground whitespace-pre-wrap">{project.description}</p>
            </div>

            {project.skills_required && project.skills_required.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{project.proposals_count || 0} proposals received</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/projects">Back to Projects</Link>
            </Button>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {canApply && (
                <Button onClick={() => setShowApplyDialog(true)}>
                  Apply Now
                </Button>
              )}
              {hasApplied && (
                <Badge variant="secondary" className="px-4 py-2">
                  Already Applied
                </Badge>
              )}
              {user && user.role === 'client' && user.id !== project.client.id && (
                <Button 
                  variant="outline" 
                  onClick={() => startConversation(project.client.id)}
                  disabled={startingConversation}
                  className="flex items-center gap-2"
                >
                  {startingConversation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  Message Client
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Proposals Section (for project owner) */}
        {isOwner && proposals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Proposals ({proposals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <Card key={proposal.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">
                            {proposal.freelancer.first_name} {proposal.freelancer.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Applied on {formatDate(proposal.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            ${proposal.proposed_budget.toLocaleString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {proposal.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{proposal.message}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => startConversation(proposal.freelancer.id)}
                          disabled={startingConversation}
                          className="flex items-center gap-2"
                        >
                          {startingConversation ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          Message
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/profile/${proposal.freelancer.id}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Apply Dialog */}
      {showApplyDialog && project && user && (
        <ApplyToProjectDialog
          isOpen={showApplyDialog}
          onOpenChange={setShowApplyDialog}
          projectId={project.id.toString()}
          projectTitle={project.title}
          freelancerId={user.id.toString()}
          onApplicationSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
}

    