// src/components/profile/profile-edit-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api";

// Schema for client-side validation
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(50, { message: "Name must be 50 characters or less." }),
  bio: z.string().max(500, { message: "Bio must be 500 characters or less." }).optional(),
  skills: z.string().optional(),
  hourly_rate: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileEditForm() {
  const { toast } = useToast();
  const { user, userProfile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile?.name || "",
      bio: userProfile?.bio || "",
      skills: userProfile?.skills?.join(", ") || "",
      hourly_rate: userProfile?.hourly_rate?.toString() || "",
    },
  });

  // Update form defaults when userProfile changes
  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name || "",
        bio: userProfile.bio || "",
        skills: userProfile.skills?.join(", ") || "",
        hourly_rate: userProfile.hourly_rate?.toString() || "",
      });
    }
  }, [userProfile, form]);

  const handleFormSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    
    try {
      const profileData = {
        name: values.name,
        bio: values.bio,
        skills: values.skills ? values.skills.split(",").map(s => s.trim()).filter(s => s) : [],
        hourly_rate: values.hourly_rate ? parseFloat(values.hourly_rate) : null,
      };

      const response = await apiClient.updateMyProfile(profileData);
      
      if (response.error) {
        toast({
          title: "Update Failed",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
        });
        
        // Refresh the profile in auth context
        if (refreshProfile) {
          await refreshProfile();
        }
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>Please log in to edit your profile.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Email (Read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input 
            type="email" 
            value={user.email || "No email associated"} 
            readOnly 
            disabled 
            className="bg-muted/50" 
          />
          <p className="text-sm text-muted-foreground">
            Your email address cannot be changed.
          </p>
        </div>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about yourself..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                A brief description of your background and expertise.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Skills */}
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Input 
                  placeholder="React, Node.js, Python, etc." 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                List your skills separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hourly Rate */}
        <FormField
          control={form.control}
          name="hourly_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  placeholder="50.00" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Your hourly rate in USD (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
