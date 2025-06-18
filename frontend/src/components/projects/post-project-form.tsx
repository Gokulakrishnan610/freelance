// src/components/projects/post-project-form.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useActionState } from "react"; // Import useActionState from react
import { useFormStatus } from 'react-dom'; // Import useFormState and useFormStatus
import { Loader2, PlusCircle, X, AlertCircle } from "lucide-react"; // Import AlertCircle
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { postProject, ProjectPostState } from '@/actions/post-project'; // Import the action and state type
import { useAuth } from "@/context/auth-context"; // Import useAuth
import { useRouter } from "next/navigation"; // Import useRouter
import Link from "next/link"; // Import Link

// Schema for client-side validation (ensure it matches server action schema)
const projectFormSchema = z.object({
  title: z.string().min(5, {
    message: "Project title must be at least 5 characters.",
  }).max(100, { message: "Project title must be 100 characters or less."}),
  description: z.string().min(50, {
    message: "Project description must be at least 50 characters.",
  }).max(2000, { message: "Project description must be 2000 characters or less."}),
  category: z.string({ required_error: "Please select a project category." }),
  budget: z.coerce.number().positive({ message: "Budget must be a positive number." }).optional(), // Optional for now
  skills: z.array(z.string().min(1).max(50)).min(1, {message: "Please add at least one skill."}).max(10, {message: "Maximum 10 skills allowed."}),
  // JWT token is handled dynamically in form submission
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full md:w-auto" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {pending ? 'Posting...' : 'Post Project'}
        </Button>
    );
}


export function PostProjectForm() {
  const [currentSkill, setCurrentSkill] = useState("");
  const { toast } = useToast();
  const { user, userProfile, loading: loadingAuth } = useAuth(); // Use Auth context
  const router = useRouter();

  const initialState: ProjectPostState = { message: null, errors: {}, success: false };
  // Replace useFormState with useActionState
  const [state, dispatch] = useActionState(postProject, initialState);


  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      budget: undefined,
      skills: [],
    },
  });

   // Effect to handle server action response
   useEffect(() => {
     if (state.success && state.projectId) {
       toast({
         title: "Project Posted Successfully!",
         description: state.message || "Your project is now live.",
       });
       form.reset(); // Reset form after successful submission
       router.push(`/projects/${state.projectId}`); // Redirect to the newly created project page
     } else if (state.message && !state.success) {
       // Display specific field errors if available, otherwise general error
        const errorMsg = state.errors?._form?.join(', ') || state.message;
        toast({
           title: "Error Posting Project",
           description: errorMsg || "Could not post your project. Please try again.",
           variant: "destructive",
        });
     }
   }, [state, router, toast, form]); // Depend on state


   const handleAddSkill = () => {
    if (currentSkill.trim() && !form.getValues("skills").includes(currentSkill.trim()) && form.getValues("skills").length < 10) {
      form.setValue("skills", [...form.getValues("skills"), currentSkill.trim()]);
      setCurrentSkill("");
      form.clearErrors("skills"); // Clear error when a skill is added
      // Trigger validation after adding skill
       form.trigger("skills");
    } else if (form.getValues("skills").length >= 10) {
       toast({ title: "Skill Limit Reached", description: "You can add a maximum of 10 skills.", variant: "destructive"})
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    form.setValue("skills", form.getValues("skills").filter(skill => skill !== skillToRemove));
    // Trigger validation after removing skill
    form.trigger("skills");
  };

  // We use `form.handleSubmit` for client-side validation, then call `dispatch`
  const handleFormSubmit = (values: ProjectFormValues) => {
     if (!user || !userProfile) return; // Should be disabled, but safeguard

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in again to post a project.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('description', values.description);
    formData.append('category', values.category);
    if (values.budget) {
        formData.append('budget', values.budget.toString());
    }
    values.skills.forEach(skill => formData.append('skills', skill));
    formData.append('token', token); // Add JWT token for authentication

    dispatch(formData); // Call the server action
  };


  // Disable form if auth is loading, user not logged in, user is not a client, or action is pending
   const isFormDisabled = loadingAuth || !user || (user && userProfile?.role !== 'client');
   const showAuthWarning = !loadingAuth && !user;
   const showRoleWarning = !loadingAuth && user && userProfile?.role !== 'client';


  return (
    <Form {...form}>
       {loadingAuth && <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
       {showAuthWarning && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not Logged In</AlertTitle>
                <AlertDescription>
                Please <Link href="/login?role=client" className="font-semibold underline">log in</Link> or <Link href="/signup?role=client" className="font-semibold underline">sign up</Link> as a client to post a project.
                </AlertDescription>
            </Alert>
        )}
       {showRoleWarning && (
             <Alert variant="destructive">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Incorrect Role</AlertTitle>
                 <AlertDescription>
                 Only users signed up as 'Client' can post projects. Your current role is '{userProfile?.role}'.
                 </AlertDescription>
             </Alert>
        )}

      {/* We pass handleFormSubmit to RHF's handleSubmit for client-side validation first */}
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className={`space-y-8 ${isFormDisabled ? 'opacity-50 pointer-events-none' : ''}`}>

         {/* Hidden input for JWT token will be added dynamically in handleFormSubmit */}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Need a Modern Logo Design" {...field} disabled={isFormDisabled} />
              </FormControl>
              <FormDescription>
                A clear and concise title helps attract the right freelancers.
              </FormDescription>
              {/* Display server errors if they exist */}
               <FormMessage>{form.formState.errors.title?.message ?? state.errors?.title?.join(', ')}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your project in detail. Include goals, deliverables, and any specific requirements..."
                  rows={6}
                  {...field}
                  disabled={isFormDisabled}
                />
              </FormControl>
               <FormDescription>
                Provide as much detail as possible (min 50 characters).
              </FormDescription>
              <FormMessage>{form.formState.errors.description?.message ?? state.errors?.description?.join(', ')}</FormMessage>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormDisabled}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a project category" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="web-development">Web Development</SelectItem>
                    <SelectItem value="mobile-development">Mobile Development</SelectItem>
                    <SelectItem value="graphic-design">Graphic Design</SelectItem>
                    <SelectItem value="writing-translation">Writing & Translation</SelectItem>
                    <SelectItem value="marketing-sales">Marketing & Sales</SelectItem>
                    <SelectItem value="video-animation">Video & Animation</SelectItem>
                    <SelectItem value="data-science-analytics">Data Science & Analytics</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage>{form.formState.errors.category?.message ?? state.errors?.category?.join(', ')}</FormMessage>
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Budget (USD, Optional)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 1500" {...field} disabled={isFormDisabled} onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)} />
                </FormControl>
                 <FormDescription>
                   Enter your estimated budget for this project.
                 </FormDescription>
                 <FormMessage>{form.formState.errors.budget?.message ?? state.errors?.budget?.join(', ')}</FormMessage>
                </FormItem>
            )}
            />
        </div>


         <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Skills</FormLabel>
              <div className="flex flex-col sm:flex-row gap-2">
                 <FormControl>
                   <Input
                    placeholder="e.g., React, Figma, Copywriting"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    disabled={isFormDisabled || field.value.length >= 10}
                    className="flex-grow"
                   />
                 </FormControl>
                 <Button type="button" variant="outline" onClick={handleAddSkill} disabled={isFormDisabled || !currentSkill.trim() || field.value.length >= 10} className="w-full sm:w-auto mt-2 sm:mt-0">
                   <PlusCircle className="h-4 w-4 mr-2" /> Add Skill
                 </Button>
              </div>
               <FormDescription>
                 Add 1 to 10 relevant skills. Press Enter or click Add Skill.
               </FormDescription>
                <FormMessage>{form.formState.errors.skills?.message ?? state.errors?.skills?.join(', ')}</FormMessage>
               {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {field.value.map((skill) => (
                      <span key={skill} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-sm px-3 py-1 rounded-full">
                        {skill}
                         {/* The input name needs to be 'skills' to be picked up by getAll */}
                        <input type="hidden" name="skills" value={skill} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-muted-foreground hover:text-destructive disabled:opacity-50"
                          onClick={() => handleRemoveSkill(skill)}
                          disabled={isFormDisabled}
                          aria-label={`Remove ${skill}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </span>
                    ))}
                  </div>
               )}
            </FormItem>
          )}
        />


        {/* Add fields for duration, attachments later */}

        {/* Display general form errors from server action */}
        {state.errors?._form && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.errors._form.join(', ')}</AlertDescription>
            </Alert>
        )}


        <SubmitButton />
      </form>
    </Form>
  );
}
