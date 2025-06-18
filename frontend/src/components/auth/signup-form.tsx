// src/components/auth/signup-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, User, Briefcase } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

const signupFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Password confirmation must be at least 6 characters.",
  }),
  role: z.enum(["client", "freelancer"], {
    required_error: "Please select a role.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'freelancer' ? 'freelancer' : 'client';
  const { register } = useAuth();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: initialRole,
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    console.log("Signup form submitted:", values);

    try {
      const userData = {
        email: values.email,
        password: values.password,
        password_confirm: values.confirmPassword,
        name: values.name,
        role: values.role,
        username: values.email, // Use email as username
      };

      const result = await register(userData);

      if (result.success) {
      toast({
        title: "Account Created Successfully!",
        description: "Welcome to Freelance Fortress.",
      });

      // Redirect user based on role after successful signup
      if (values.role === 'client') {
          router.push('/client/dashboard');
        } else {
          router.push('/freelancer/dashboard');
        }
      } else {
        toast({
          title: "Signup Failed",
          description: result.error || "An error occurred during registration",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Signup process failed:", error);
      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred during signup.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>I am a...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="client" id="client" />
                    <label
                      htmlFor="client"
                      className="flex items-center space-x-2 cursor-pointer font-medium"
                    >
                      <User className="w-5 h-5 text-primary" />
                      <span>Client</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="freelancer" id="freelancer" />
                    <label
                      htmlFor="freelancer"
                      className="flex items-center space-x-2 cursor-pointer font-medium"
                    >
                      <Briefcase className="w-5 h-5 text-primary" />
                      <span>Freelancer</span>
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Account
        </Button>

        <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
            </Link>
        </p>
      </form>
    </Form>
  );
}
