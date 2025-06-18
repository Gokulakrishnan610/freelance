import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="container flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center py-12">
       <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Log in to your Freelance Fortress account.
           </CardDescription>
        </CardHeader>
        <CardContent>
           <LoginForm />
           <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign Up
              </Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
