'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Trophy, Clock, MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";

interface Freelancer {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  bio: string;
  skills: string[];
  hourly_rate: number;
  rating: number;
  completed_projects?: number;
  project_count?: number;
  location: string;
  profile_picture?: string;
  avatar?: string;
  avatar_url?: string;
}

export function FreelancerRankings() {
  const [topFreelancers, setTopFreelancers] = useState<Freelancer[]>([]);
  const [newcomers, setNewcomers] = useState<Freelancer[]>([]);
  const [featured, setFeatured] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const [topResponse, newcomersResponse, featuredResponse] = await Promise.all([
          apiClient.getTopFreelancers(),
          apiClient.getNewcomerFreelancers(),
          apiClient.getFeaturedFreelancers()
        ]);

        setTopFreelancers(topResponse.data || []);
        setNewcomers(newcomersResponse.data || []);
        setFeatured(featuredResponse.data || []);
      } catch (error) {
        console.error('Error fetching freelancers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, []);

  const FreelancerCard = ({ freelancer, showBadge, badgeText, badgeIcon }: {
    freelancer: Freelancer;
    showBadge?: boolean;
    badgeText?: string;
    badgeIcon?: React.ReactNode;
  }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={freelancer.avatar_url || freelancer.avatar} />
              <AvatarFallback>
                {freelancer.user.first_name?.[0]}{freelancer.user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {freelancer.user.first_name} {freelancer.user.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">{freelancer.location}</p>
            </div>
          </div>
          {showBadge && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {badgeIcon}
              {badgeText}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {freelancer.bio || "Professional freelancer ready to help with your projects."}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{freelancer.rating ? Number(freelancer.rating).toFixed(1) : '5.0'}</span>
            <span className="text-sm text-muted-foreground">
              ({freelancer.completed_projects || freelancer.project_count || 0} projects)
            </span>
          </div>
          <div className="text-right">
            <p className="font-semibold">${freelancer.hourly_rate || 50}/hr</p>
          </div>
        </div>

        {freelancer.skills && freelancer.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {freelancer.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {freelancer.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{freelancer.skills.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button size="sm" asChild className="flex-1">
            <Link href={`/profile/${freelancer.id}`}>View Profile</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/messaging?freelancer=${freelancer.user.id}`}>
              <MessageSquare className="h-4 w-4" />
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
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
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
    <Tabs defaultValue="featured" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="featured" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Featured
        </TabsTrigger>
        <TabsTrigger value="top" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Top Rated
        </TabsTrigger>
        <TabsTrigger value="newcomers" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          New Talent
        </TabsTrigger>
      </TabsList>

      <TabsContent value="featured" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.length > 0 ? (
            featured.map((freelancer) => (
              <FreelancerCard
                key={freelancer.id}
                freelancer={freelancer}
                showBadge
                badgeText="Featured"
                badgeIcon={<Star className="h-3 w-3" />}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No featured freelancers available at the moment.</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="top" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topFreelancers.length > 0 ? (
            topFreelancers.map((freelancer, index) => (
              <FreelancerCard
                key={freelancer.id}
                freelancer={freelancer}
                showBadge
                badgeText={`#${index + 1} Top Rated`}
                badgeIcon={<Trophy className="h-3 w-3" />}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No top-rated freelancers available at the moment.</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="newcomers" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newcomers.length > 0 ? (
            newcomers.map((freelancer) => (
              <FreelancerCard
                key={freelancer.id}
                freelancer={freelancer}
                showBadge
                badgeText="New"
                badgeIcon={<Clock className="h-3 w-3" />}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No new freelancers have joined recently.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
} 