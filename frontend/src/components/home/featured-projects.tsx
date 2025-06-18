'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, MapPin, User } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";

interface Project {
  id: number;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  skills_required: string[];
  client: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  proposals_count?: number;
}

export function FeaturedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const params = new URLSearchParams({ limit: '6', status: 'open' });
        const response = await apiClient.getProjects(params);
        setProjects(response.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just posted';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return 'Overdue';
    if (diffInDays === 0) return 'Due today';
    if (diffInDays === 1) return 'Due tomorrow';
    if (diffInDays < 7) return `Due in ${diffInDays} days`;
    return `Due ${date.toLocaleDateString()}`;
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {project.title}
            </CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <User className="h-4 w-4 mr-1" />
              {project.client.first_name} {project.client.last_name}
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4 mr-1" />
              {formatTimeAgo(project.created_at)}
            </div>
          </div>
          <Badge variant="secondary">
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-green-600 font-semibold">
            <DollarSign className="h-4 w-4 mr-1" />
            ${project.budget?.toLocaleString() || 'Budget TBD'}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {formatDeadline(project.deadline)}
          </div>
        </div>

        {project.skills_required && project.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.skills_required.slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skills_required.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{project.skills_required.length - 4} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {project.proposals_count || 0} proposals
          </div>
          <Button size="sm" asChild>
            <Link href={`/projects/${project.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse h-64">
            <CardHeader>
              <div className="space-y-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">No projects available at the moment.</p>
            <Button asChild>
              <Link href="/projects/post">Post the First Project</Link>
            </Button>
          </div>
        )}
      </div>
      
      {projects.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/projects">View All Projects</Link>
          </Button>
        </div>
      )}
    </div>
  );
} 