// src/actions/apply-to-project.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Define the input schema using Zod
const ApplicationSchema = z.object({
  projectId: z.string().min(1, "Project ID is required."),
  message: z.string().min(10, "Application message must be at least 10 characters.").max(1000, "Application message must be 1000 characters or less."),
  proposedBudget: z.coerce.number().positive({ message: "Proposed budget must be a positive number." }),
  timeline: z.string().min(1, "Timeline is required.").max(100, "Timeline must be 100 characters or less."),
  token: z.string().min(1, "Authentication token is required."),
});

export type ApplicationState = {
  errors?: {
    projectId?: string[];
    message?: string[];
    proposedBudget?: string[];
    timeline?: string[];
    token?: string[];
    _form?: string[];
  };
  message?: string | null;
  success?: boolean;
  applicationId?: number;
};

export async function applyToProject(prevState: ApplicationState, formData: FormData): Promise<ApplicationState> {
  // Validate form data using Zod
  const validatedFields = ApplicationSchema.safeParse({
    projectId: formData.get('projectId'),
    message: formData.get('message'),
    proposedBudget: formData.get('proposedBudget'),
    timeline: formData.get('timeline'),
    token: formData.get('token'),
  });

  // If form validation fails, return errors early
  if (!validatedFields.success) {
    console.log("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your input.',
      success: false,
    };
  }

  const { token, projectId, ...applicationData } = validatedFields.data;

  try {
    // Prepare the data for Django API
    const proposalData = {
      project: parseInt(projectId),
      message: applicationData.message,
      proposed_budget: applicationData.proposedBudget,
      timeline: applicationData.timeline,
    };

    // Call Django API to create proposal
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${API_BASE_URL}/projects/proposals/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(proposalData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle validation errors from Django
      if (response.status === 400 && errorData) {
        const errors: any = {};
        
        // Map Django field errors to our error format
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            // Map Django field names to our form field names
            if (field === 'proposed_budget') {
              errors['proposedBudget'] = errorData[field];
            } else if (field === 'project') {
              errors['projectId'] = errorData[field];
            } else {
              errors[field] = errorData[field];
            }
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
        message: 'Failed to submit application. Please try again.',
        success: false,
      };
    }

    const newProposal = await response.json();
    console.log("Application submitted with ID: ", newProposal.id);

    // Revalidate relevant paths
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/freelancer/dashboard');

    return { 
      message: 'Application submitted successfully!', 
      success: true,
      applicationId: newProposal.id
    };

  } catch (error) {
    console.error('Error submitting application:', error);
    
    let errorMessage = 'Network error: Could not submit application. Please try again.';
    if (error instanceof Error) {
      errorMessage = `Network error: ${error.message}`;
    }
    
    return { 
      errors: { _form: [errorMessage] }, 
      success: false 
    };
  }
}