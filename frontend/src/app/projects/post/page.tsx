// src/app/projects/post/page.tsx
import { PostProjectForm } from "@/components/projects/post-project-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Post New Project | Freelance Fortress",
    description: "Describe your project requirements to attract the right freelance talent on Freelance Fortress.",
};


export default function PostProjectPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Post a New Project</CardTitle>
          <CardDescription>
            Describe your project requirements to attract the right freelance talent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* PostProjectForm now uses useFormState internally */}
          <PostProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
