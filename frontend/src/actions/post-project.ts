// src/actions/post-project.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Define the input schema using Zod (matches the form schema)
const ProjectSchema = z.object({
  title: z.string().min(5, "Project title must be at least 5 characters.").max(100, "Project title must be 100 characters or less."),
  description: z.string().min(50, "Project description must be at least 50 characters.").max(2000, "Project description must be 2000 characters or less."),
  category: z.string({ required_error: "Please select a project category." }),
  budget: z.coerce.number().positive({ message: "Budget must be a positive number." }).optional(),
  skills: z.array(z.string().min(1).max(50)).min(1, "Please add at least one skill.").max(10, "Maximum 10 skills allowed."),
  token: z.string().min(1, "Authentication token is required."),
});

export type ProjectPostState = {
  errors?: {
    title?: string[];
    description?: string[];
    category?: string[];
    budget?: string[];
    skills?: string[];
    token?: string[];
    _form?: string[]; // General form errors
  };
  message?: string | null;
  success?: boolean;
  projectId?: number; // Return the ID of the newly created project
};

export async function postProject(prevState: ProjectPostState, formData: FormData): Promise<ProjectPostState> {
  // Extract skills - FormData can represent arrays with multiple entries for the same key
  const skills = formData.getAll('skills').filter(skill => typeof skill === 'string' && skill.trim() !== '') as string[];

  // Validate form data using Zod
  const validatedFields = ProjectSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    budget: formData.get('budget') ? Number(formData.get('budget')) : undefined, // Handle empty budget
    skills: skills,
    token: formData.get('token'), // JWT token for authentication
  });

  // If form validation fails, return errors early.
  if (!validatedFields.success) {
    console.log("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your input.',
      success: false,
    };
  }

  const { token, ...projectData } = validatedFields.data;

  try {
    // Call Django API to create project
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${API_BASE_URL}/projects/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle validation errors from Django
      if (response.status === 400 && errorData) {
        const errors: any = {};
        
        // Map Django field errors to our error format
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            errors[field] = errorData[field];
          }
        });
        
        return {
          errors,
          message: 'Please correct the errors below.',
          success: false,
        };
      }
      
      // Handle other errors
      return {
        errors: { _form: [errorData.detail || `Server error: ${response.status}`] },
        message: 'Failed to post project. Please try again.',
        success: false,
      };
    }

    const newProject = await response.json();
    console.log("Project posted with ID: ", newProject.id);

    // Revalidate the projects page path to show the new project
    revalidatePath('/projects');
    revalidatePath('/client/dashboard'); // Also revalidate client dashboard

    // Return success state with the new project ID
    return { 
      message: 'Project posted successfully!', 
      success: true, 
      projectId: newProject.id 
    };

  } catch (error) {
    console.error('Error posting project:', error);
    
    let errorMessage = 'Network error: Could not post project. Please try again.';
    if (error instanceof Error) {
      errorMessage = `Network error: ${error.message}`;
    }
    
    return { 
      errors: { _form: [errorMessage] }, 
      success: false 
    };
  }
}
