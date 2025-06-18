

'use client';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ShieldCheck, LogIn, UserPlus, LayoutDashboard, Briefcase, User, Menu, X, LogOut, MessageSquare, Loader2, PlusCircle } from "lucide-react"; // Import PlusCircle
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import * as React from 'react';
import { useAuth } from "@/context/auth-context"; // Import useAuth
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


export function Header() {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { user, userProfile, loading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const closeSheet = () => setIsSheetOpen(false);

  const handleLogout = async () => {
    closeSheet(); // Close sheet if open
    try {
      await logout();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/'); // Redirect to homepage after logout
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  };

  // Determine the correct dashboard link based on user role
  const dashboardLink = userProfile?.role === 'client' ? '/client/dashboard' : userProfile?.role === 'freelancer' ? '/freelancer/dashboard' : '/';

  const isLoading = loading;


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-primary hidden sm:inline">
            Freelance Fortress
          </span>
           <span className="text-lg font-semibold text-primary sm:hidden">
             FF
          </span>
        </Link>

        {isMobile ? (
          // Mobile Navigation (Sheet)
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-card p-6 flex flex-col">
               <div className="flex justify-between items-center mb-8">
                 <Link href="/" className="flex items-center gap-2" onClick={closeSheet}>
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold text-primary">
                        Freelance Fortress
                    </span>
                 </Link>
                 <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close menu</span>
                    </Button>
                 </SheetClose>
               </div>

              <nav className="flex flex-col gap-4 flex-grow">
                {/* Display loading indicator or navigation based on auth state */}
                {isLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : user ? (
                  <>
                    <Button variant="ghost" size="lg" asChild className="justify-start" onClick={closeSheet}>
                      <Link href={dashboardLink} className="flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5" /> Dashboard
                      </Link>
                    </Button>
                     <Button variant="ghost" size="lg" asChild className="justify-start" onClick={closeSheet}>
                        <Link href="/projects" className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" /> Browse Projects
                        </Link>
                    </Button>
                     {/* Conditional links based on role */}
                     {userProfile?.role === 'client' && (
                         <Button variant="ghost" size="lg" asChild className="justify-start" onClick={closeSheet}>
                            <Link href="/projects/post" className="flex items-center gap-2">
                                <PlusCircle className="h-5 w-5" /> Post Project
                            </Link>
                        </Button>
                     )}
                      {/* Generic Profile Link for all logged-in users */}
                     <Button variant="ghost" size="lg" asChild className="justify-start" onClick={closeSheet}>
                        <Link href="/profile/edit" className="flex items-center gap-2">
                           <User className="h-5 w-5" /> Edit Profile
                        </Link>
                     </Button>
                     <Button variant="ghost" size="lg" asChild className="justify-start" onClick={closeSheet} disabled>
                        <Link href="#" className="flex items-center gap-2">
                           {/* Replace with appropriate icon later */}
                            <MessageSquare className="h-5 w-5" /> Messages (Soon)
                        </Link>
                    </Button>
                    <div className="mt-auto"> {/* Push logout to bottom */}
                      <Button variant="outline" size="lg" onClick={handleLogout} className="w-full flex items-center gap-2 justify-start">
                        <LogOut className="h-5 w-5" /> Log Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="lg" asChild className="justify-start" onClick={closeSheet}>
                      <Link href="/login" className="flex items-center gap-2">
                        <LogIn className="h-5 w-5" /> Log In
                      </Link>
                    </Button>
                    <Button variant="ghost" size="lg" asChild className="justify-start" onClick={closeSheet}>
                        <Link href="/projects" className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" /> Browse Projects
                        </Link>
                    </Button>
                    <div className="mt-auto"> {/* Push signup to bottom */}
                      <Button size="lg" asChild onClick={closeSheet} className="w-full">
                        <Link href="/signup" className="flex items-center gap-2 justify-center">
                          <UserPlus className="h-5 w-5" /> Sign Up
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          // Desktop Navigation
          <nav className="flex items-center gap-4">
             {isLoading ? (
                 <Loader2 className="h-5 w-5 animate-spin text-primary" />
             ) : user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={dashboardLink} className="flex items-center gap-1">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects" className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" /> Projects
                  </Link>
                </Button>
                 {/* Conditional links based on role */}
                 {userProfile?.role === 'client' && (
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/projects/post" className="flex items-center gap-1">
                            <PlusCircle className="h-4 w-4" /> Post
                        </Link>
                    </Button>
                 )}
                 {/* Generic Profile Link for all logged-in users */}
                 <Button variant="ghost" size="sm" asChild>
                    <Link href="/profile/edit" className="flex items-center gap-1">
                        <User className="h-4 w-4" /> Profile
                    </Link>
                 </Button>
                 <Button variant="ghost" size="sm" asChild disabled>
                     <Link href="#" className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" /> Messages (Soon)
                     </Link>
                 </Button>

                <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1">
                  <LogOut className="h-4 w-4" /> Log Out
                </Button>
              </>
            ) : (
              <>
                 <Button variant="ghost" size="sm" asChild>
                    <Link href="/projects" className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" /> Browse Projects
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login" className="flex items-center gap-1">
                    <LogIn className="h-4 w-4" /> Log In
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup" className="flex items-center gap-1">
                    <UserPlus className="h-4 w-4" /> Sign Up
                  </Link>
                </Button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

