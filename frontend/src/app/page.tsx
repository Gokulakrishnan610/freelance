import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, MessageSquare, Video, Briefcase, Zap, PlayCircle, Star, Trophy, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FreelancerRankings } from "@/components/home/freelancer-rankings";
import { FeaturedProjects } from "@/components/home/featured-projects";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-4 text-primary">
              Freelance Fortress
            </h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground text-base sm:text-lg md:text-xl mb-8 px-2">
              Connect with top-rated freelancers and discover amazing talent. Build lasting professional relationships with our secure messaging and project management platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
              <Button size="lg" asChild className="w-full sm:w-auto">
                 <Link href="/signup?role=client">Hire Top Talent</Link>
               </Button>
               <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/signup?role=freelancer">Find Freelance Work</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Freelancer Rankings Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 text-primary">
                Discover Top Talent
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Browse our featured freelancers, top performers, and newest talent joining our platform
              </p>
            </div>
            <FreelancerRankings />
          </div>
        </section>

        {/* Featured Projects Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 text-primary">
                Latest Opportunities
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover exciting projects posted by clients looking for talented freelancers
              </p>
            </div>
            <FeaturedProjects />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-12 text-center text-primary">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex flex-col items-center gap-2 text-lg md:text-xl">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-accent mb-2" />
                    1. Post or Find
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm md:text-base">Clients post project needs. Freelancers showcase skills and find opportunities.</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex flex-col items-center gap-2 text-lg md:text-xl">
                    <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-accent mb-2" />
                    2. Connect Securely
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm md:text-base">Match based on requirements. Review proposals and profiles with secure messaging.</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex flex-col items-center gap-2 text-lg md:text-xl">
                    <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-accent mb-2" />
                    3. Communicate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm md:text-base">Built-in messaging system for seamless client-freelancer communication.</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex flex-col items-center gap-2 text-lg md:text-xl">
                    <Briefcase className="w-8 h-8 md:w-10 md:h-10 text-accent mb-2" />
                    4. Collaborate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm md:text-base">Hire the best fit and manage projects with integrated tools and ratings.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

         {/* Feature Sections (Client/Freelancer) */}
         <section className="w-full py-12 md:py-24 lg:py-32">
           <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
             {/* For Clients */}
             <div className="space-y-4 order-2 md:order-1">
                <Badge variant="outline" className="py-1 px-3 border-primary text-primary">For Clients</Badge>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary">Find the Perfect Freelancer</h3>
                <p className="text-muted-foreground text-sm md:text-base">Post your project, receive proposals from vetted professionals, and communicate directly through our secure messaging system. Browse top-rated freelancers and newcomers.</p>
                <ul className="space-y-2 text-muted-foreground text-sm md:text-base">
                  <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-accent flex-shrink-0" /> Access top-rated freelancers with proven track records.</li>
                  <li className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-accent flex-shrink-0" /> Direct messaging with freelancers.</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent flex-shrink-0" /> Streamlined project management and proposals.</li>
                </ul>
                 <div className="flex flex-col sm:flex-row gap-3">
                     <Button asChild>
                      <Link href="/projects/post">Post a Project</Link>
                    </Button>
                     <Button variant="outline" asChild>
                      <Link href="/projects">Browse Projects</Link>
                    </Button>
                 </div>
             </div>
             {/* Placeholder Image */}
             <div className="order-1 md:order-2">
                <Image
                  src="https://picsum.photos/600/400?random=1"
                  alt="Client collaborating with freelancer"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-md object-cover w-full h-auto aspect-[3/2]"
                />
             </div>
           </div>
         </section>

         <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
            <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
             {/* Placeholder Image */}
              <div>
                 <Image
                  src="https://picsum.photos/600/400?random=2"
                  alt="Freelancer showcasing work"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-md object-cover w-full h-auto aspect-[3/2]"
                />
              </div>
             {/* For Freelancers */}
             <div className="space-y-4">
                <Badge variant="outline" className="py-1 px-3 border-accent text-accent">For Freelancers</Badge>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary">Showcase Your Skills, Build Your Reputation</h3>
                <p className="text-muted-foreground text-sm md:text-base">Build your profile, connect with clients, and grow your freelance business. Get featured in our rankings as you complete projects and receive positive ratings.</p>
                <ul className="space-y-2 text-muted-foreground text-sm md:text-base">
                  <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent flex-shrink-0" /> Get featured in top freelancer rankings.</li>
                  <li className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-accent flex-shrink-0" /> Direct communication with potential clients.</li>
                  <li className="flex items-center gap-2"><Star className="w-4 h-4 text-accent flex-shrink-0" /> Build your reputation with client ratings and reviews.</li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" asChild>
                      <Link href="/projects">Browse Projects</Link>
                    </Button>
                     <Button asChild>
                        <Link href="/freelancer/dashboard">Go to Dashboard</Link>
                     </Button>
                </div>
              </div>
            </div>
         </section>

      </main>
    </div>
  );
}
