// src/actions/update-profile.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Define the input schema using Zod
const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be 50 characters or less."),
  bio: z.string().max(500, "Bio must be 500 characters or less.").optional(),
  skills: z.string().optional(), // Comma-separated skills
  hourly_rate: z.string().optional(),
  token: z.string().min(1, "Authentication token is required."),
});

export type UpdateProfileState = {
  errors?: {
    name?: string[];
    bio?: string[];
    skills?: string[];
    hourly_rate?: string[];
    token?: string[];
    _form?: string[];
  };
  message?: string | null;
  success?: boolean;
};

export async function updateProfile(prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
  // Validate form data using Zod
  const validatedFields = UpdateProfileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
    skills: formData.get('skills'),
    hourly_rate: formData.get('hourly_rate'),
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

  const { token, skills, hourly_rate, ...profileData } = validatedFields.data;

  try {
    // Prepare the data for Django API
    const updateData = {
      ...profileData,
      skills: skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [],
      hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
    };

    // Call Django API to update profile
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${API_BASE_URL}/profiles/me/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
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
        message: 'Failed to update profile. Please try again.',
        success: false,
      };
    }

    console.log("Profile updated successfully");

    // Revalidate relevant paths
    revalidatePath('/profile/edit');
    revalidatePath('/freelancer/dashboard');
    revalidatePath('/client/dashboard');

    return { 
      message: 'Profile updated successfully!', 
      success: true 
    };

  } catch (error) {
    console.error('Error updating profile:', error);
    
    let errorMessage = 'Network error: Could not update profile. Please try again.';
    if (error instanceof Error) {
      errorMessage = `Network error: ${error.message}`;
    }
    
    return { 
      errors: { _form: [errorMessage] }, 
      success: false 
    };
  }
}