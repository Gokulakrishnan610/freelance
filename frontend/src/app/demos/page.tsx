// src/app/demos/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VideoPreviewCard } from "@/components/video-preview-card";
import { Loader2, AlertCircle, Video } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define the structure of a demo video document from Firestore
interface DemoVideo {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string; // Assuming this will be added later
  freelancerName: string;
  freelancerId: string;
  uploadedAt: Timestamp;
  videoUrl: string; // Needed for player link
  // Add other fields like tags if available
}

export default function DemosPage() {
  const [videos, setVideos] = useState<DemoVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const demosCol = collection(db, "userDemos");
        // Query demos, ordered by upload date (newest first)
        const q = query(demosCol, orderBy("uploadedAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedDemos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as DemoVideo[];
        setVideos(fetchedDemos);
      } catch (err) {
        console.error("Error fetching demo videos:", err);
        setError("Failed to load demo videos. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemos();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 lg:py-16 space-y-8">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary flex items-center gap-2 justify-center md:justify-start">
           <Video className="w-7 h-7 sm:w-8 sm:h-8" /> Freelancer Demos
        </h1>
        <p className="text-muted-foreground">Browse video demos uploaded by freelancers.</p>
      </div>

      {/* Search and Filter Bar Placeholder */}
      {/* Add search/filter functionality later */}
      {/*
      <div className="flex flex-col md:flex-row gap-4">
         ... Search/Filter UI ...
      </div>
      */}

      {/* Demo Video Listings */}
       {isLoading && (
         <div className="flex justify-center items-center py-16">
           <Loader2 className="h-12 w-12 animate-spin text-primary" />
         </div>
       )}
       {error && (
           <Alert variant="destructive" className="max-w-xl mx-auto">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Error Loading Demos</AlertTitle>
             <AlertDescription>
               {error}
                <div className="mt-4">
                    <Button onClick={() => window.location.reload()} variant="destructive" size="sm">Retry</Button>
                </div>
             </AlertDescription>
           </Alert>
       )}
       {!isLoading && !error && (
         <>
           {videos.length === 0 ? (
             <div className="text-center py-16">
                <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No demo videos have been uploaded yet.</p>
                 <p className="text-sm text-muted-foreground mt-2">Freelancers can upload demos from their dashboard.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/freelancer/dashboard">Go to Freelancer Dashboard</Link>
                </Button>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {videos.map((video) => (
                 <VideoPreviewCard
                   key={video.id}
                   videoId={video.id} // Pass the document ID
                   title={video.title}
                   description={video.description || ""}
                   thumbnailUrl={video.thumbnailUrl || "https://picsum.photos/320/180"} // Use placeholder if no thumbnail
                   freelancerName={video.freelancerName}
                   // Add tags if available: tags={video.tags}
                 />
               ))}
             </div>
           )}
           {/* Pagination Placeholder - Implement later */}
           {/*
           {videos.length > 0 && (
              <div className="flex justify-center pt-8">
                 <Button variant="outline" disabled>Load More Demos</Button>
              </div>
           )}
           */}
         </>
       )}

    </div>
  );
}
