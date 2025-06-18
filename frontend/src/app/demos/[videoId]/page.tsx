// src/app/demos/[videoId]/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, User, CalendarDays, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context"; // For contact button logic
import { format } from 'date-fns'; // For formatting date

// Define the structure of a demo video document from Firestore
interface DemoVideo {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  freelancerName: string;
  freelancerId: string;
  uploadedAt: Timestamp;
  videoUrl: string;
  watermarkText?: string;
  watermarkPosition?: string;
  watermarkOpacity?: number;
  tags?: string[]; // Add tags field
}

export default function DemoVideoPage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const router = useRouter();
  const [videoData, setVideoData] = useState<DemoVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth(); // Get current user for context

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw watermark (reuse logic from video-upload, simplified)
  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && video.readyState >= 2 && videoData?.watermarkText) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

       // Adjust canvas size dynamically based on container and aspect ratio
      const containerWidth = canvas.parentElement?.clientWidth || 800; // Max width of container
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      let canvasWidth = containerWidth;
      let canvasHeight = containerWidth / videoAspectRatio;

      // Ensure canvas doesn't exceed video's natural dimensions scaled down if necessary
      if (canvasWidth > video.videoWidth) {
        canvasWidth = video.videoWidth;
        canvasHeight = video.videoHeight;
      }
      if (canvasHeight > video.videoHeight && canvasHeight > (containerWidth / videoAspectRatio)) {
           // If height is still too large after scaling width, scale by height instead
           canvasHeight = Math.min(video.videoHeight, canvas.parentElement?.clientHeight || 600);
           canvasWidth = canvasHeight * videoAspectRatio;
      }


      // Apply DPR for sharpness
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fontSize = Math.max(10, Math.min(18, canvasWidth / 35));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = `rgba(255, 255, 255, ${videoData.watermarkOpacity ?? 0.7})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 2;

      let x = 0, y = 0;
      const margin = 10;
      const position = videoData.watermarkPosition ?? 'bottom-right';

      switch (position) {
        case "top-left": ctx.textAlign = "left"; ctx.textBaseline = "top"; x = margin; y = margin; break;
        case "top-right": ctx.textAlign = "right"; ctx.textBaseline = "top"; x = canvasWidth - margin; y = margin; break;
        case "bottom-left": ctx.textAlign = "left"; ctx.textBaseline = "bottom"; x = margin; y = canvasHeight - margin; break;
        case "center": ctx.textAlign = "center"; ctx.textBaseline = "middle"; x = canvasWidth / 2; y = canvasHeight / 2; break;
        default: ctx.textAlign = "right"; ctx.textBaseline = "bottom"; x = canvasWidth - margin; y = canvasHeight - margin; break; // Default bottom-right
      }
      ctx.fillText(videoData.watermarkText, x, y);
    }
  }, [videoData?.watermarkText, videoData?.watermarkPosition, videoData?.watermarkOpacity]); // Dependencies updated


  // Effect to draw watermark when video loads/resizes
   useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let resizeObserver: ResizeObserver | null = null;
    const parentElement = canvasRef.current?.parentElement;

    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => requestAnimationFrame(drawWatermark), 50); // Debounce slightly
    };

    if (parentElement) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(parentElement);
    }

    // Use requestAnimationFrame for smoother updates
    const handleTimeUpdate = () => requestAnimationFrame(drawWatermark);
    const handleSeeked = () => requestAnimationFrame(drawWatermark);
    const handleLoadedData = () => {
        console.log("Video loaded data, attempting initial draw");
        requestAnimationFrame(drawWatermark); // Ensure initial draw happens
    }
    // Also draw on 'canplay' as readyState might not be >= 2 yet
    const handleCanPlay = () => {
        console.log("Video can play, attempting draw");
        requestAnimationFrame(drawWatermark);
    }

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);

    // Initial draw attempt if already loaded
    if (video.readyState >= 2) {
        requestAnimationFrame(drawWatermark);
    } else {
        console.log("Video not ready on mount, waiting for events");
    }


    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      if (resizeObserver && parentElement) resizeObserver.unobserve(parentElement);
      clearTimeout(resizeTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawWatermark]); // Only depends on drawWatermark function itself


  useEffect(() => {
    const fetchVideoData = async () => {
      if (!videoId) {
        setError("Video ID is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const videoDocRef = doc(db, "userDemos", videoId);
        const docSnap = await getDoc(videoDocRef);

        if (docSnap.exists()) {
          setVideoData({ id: docSnap.id, ...docSnap.data() } as DemoVideo);
           console.log("Video data fetched:", { id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Demo video not found.");
        }
      } catch (err) {
        console.error("Error fetching video details:", err);
        setError("Failed to load video details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-xl text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
           <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!videoData) {
    // Should be covered by error state, but as a fallback
    return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Video data unavailable.</div>;
  }

  const canContact = user && user.uid !== videoData.freelancerId;
  const formattedDate = videoData.uploadedAt ? format(videoData.uploadedAt.toDate(), 'PPP') : 'N/A'; // Format date like "Jan 1, 2024"


  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 lg:py-16">
      <Card className="max-w-4xl mx-auto shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary break-words">{videoData.title}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="w-4 h-4" /> By: {videoData.freelancerName}</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> Uploaded: {formattedDate}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Player with Watermark Canvas */}
          <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden mx-auto" style={{ maxWidth: '1000px' }}>
             {videoData.videoUrl ? (
                <>
                    <video
                    ref={videoRef}
                    src={videoData.videoUrl}
                    controls
                    playsInline // Important for mobile playback
                    className="absolute inset-0 h-full w-full object-contain z-0"
                    preload="metadata" // Helps with getting dimensions sooner
                    onLoadedMetadata={(e) => { // Use onLoadedMetadata for dimensions
                        console.log("Video metadata loaded");
                        requestAnimationFrame(drawWatermark); // Draw when metadata (size) is known
                    }}
                    onError={(e) => console.error("Video Error:", e)}
                    />
                    <canvas
                    ref={canvasRef}
                    className="pointer-events-none absolute inset-0 h-full w-full z-10"
                    aria-hidden="true"
                    />
                </>
             ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">Video loading or unavailable.</p>
                </div>
             )}
          </div>

          {videoData.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Description</h3>
              <p className="text-foreground whitespace-pre-wrap">{videoData.description}</p>
            </div>
          )}


          {videoData.tags && videoData.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {videoData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}


        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/50 p-4">
           <Button variant="outline" onClick={() => router.push('/demos')} size="sm"> {/* Changed to push for better history */}
             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Demos
           </Button>

           {/* Contact Freelancer Button */}
           {canContact ? (
             <Button size="sm" disabled> {/* Disabled until messaging implemented */}
               <MessageSquare className="mr-2 h-4 w-4" /> Contact {videoData.freelancerName} (Soon)
             </Button>
           ) : !user && !authLoading ? (
              <Button asChild size="sm">
                    <Link href={`/login?redirect=/demos/${videoId}`}>Log in to Contact</Link>
              </Button>
           ) : null /* Don't show if user is the freelancer */}
        </CardFooter>
      </Card>
    </div>
  );
}
