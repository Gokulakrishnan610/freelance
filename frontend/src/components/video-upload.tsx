"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, Film, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api";
import Link from "next/link";

// Define possible watermark positions
const WATERMARK_POSITIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "center",
] as const;
type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number];

export function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [watermarkText, setWatermarkText] = useState<string>("");
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user, userProfile, isAuthenticated } = useAuth();

  const MAX_FILE_SIZE_MB = 100;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

   // Set default watermark text from user profile name when available
   useEffect(() => {
     if (userProfile?.name && !watermarkText) {
       setWatermarkText(userProfile.name);
     }
   }, [userProfile, watermarkText]);

  // Draw watermark on canvas
  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && video.readyState >= 2 && watermarkText) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const canvasWidth = Math.min(canvas.parentElement?.clientWidth || 600, 800);
      const canvasHeight = canvasWidth / videoAspectRatio;
      canvas.width = canvasWidth * window.devicePixelRatio;
      canvas.height = canvasHeight * window.devicePixelRatio;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fontSize = Math.max(10, Math.min(18, canvasWidth / 35));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = `rgba(255, 255, 255, ${watermarkOpacity})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 2;

      let x = 0, y = 0;
      const margin = 10;

      switch (watermarkPosition) {
        case "top-left": ctx.textAlign = "left"; ctx.textBaseline = "top"; x = margin; y = margin; break;
        case "top-right": ctx.textAlign = "right"; ctx.textBaseline = "top"; x = canvasWidth - margin; y = margin; break;
        case "bottom-left": ctx.textAlign = "left"; ctx.textBaseline = "bottom"; x = margin; y = canvasHeight - margin; break;
        case "bottom-right": ctx.textAlign = "right"; ctx.textBaseline = "bottom"; x = canvasWidth - margin; y = canvasHeight - margin; break;
        case "center": ctx.textAlign = "center"; ctx.textBaseline = "middle"; x = canvasWidth / 2; y = canvasHeight / 2; break;
      }
      ctx.fillText(watermarkText, x, y);
    }
  }, [watermarkText, watermarkPosition, watermarkOpacity]);

  // Update canvas on video play/seek and resize
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let resizeObserver: ResizeObserver | null = null;
    const parentElement = canvasRef.current?.parentElement;

    const handleResize = () => {
       requestAnimationFrame(drawWatermark);
    };

    if (parentElement) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(parentElement);
    }

    const handleTimeUpdate = () => requestAnimationFrame(drawWatermark);
    const handleSeeked = () => requestAnimationFrame(drawWatermark);
    const handleLoadedData = () => requestAnimationFrame(drawWatermark);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("loadeddata", handleLoadedData);

    if (video.readyState >= 2) requestAnimationFrame(drawWatermark);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("loadeddata", handleLoadedData);
       if (resizeObserver && parentElement) {
         resizeObserver.unobserve(parentElement);
       }
    };
  }, [drawWatermark]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setFile(null);
    setVideoSrc(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setTags("");
    setFileError(null);
    setIsUploaded(false);
    setUploadProgress(0);

    if (selectedFile) {
       if (!selectedFile.type.startsWith("video/")) {
        setFileError("Invalid file type. Please select a video file.");
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`File size exceeds ${MAX_FILE_SIZE_MB} MB limit.`);
        return;
      }

      setFile(selectedFile);
      const fileNameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.');
      setTitle(fileNameWithoutExt || "Untitled Video");

      const reader = new FileReader();
      reader.onload = (e) => setVideoSrc(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast({
        title: "Upload Error",
        description: "Please select a file and provide a title.",
        variant: "destructive",
      });
       return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload videos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video_file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category.trim());
      
      // Parse tags from comma-separated string
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      formData.append('tags', JSON.stringify(tagArray));

      // Simulate upload progress (since fetch doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiClient.createVideoDemo(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.error) {
        throw new Error(response.error);
      }

      setIsUploaded(true);
      toast({
        title: "Upload Successful!",
        description: "Your video demo has been uploaded successfully.",
      });

      // Reset form
      setFile(null);
      setVideoSrc(null);
      setTitle("");
      setDescription("");
      setCategory("");
      setTags("");

    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload video. Please try again.",
        variant: "destructive",
      });
        } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Film className="w-6 h-6" />
            Upload Video Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to be logged in to upload video demos.
            </AlertDescription>
          </Alert>
          <div className="space-x-2">
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="w-6 h-6" />
          Upload Video Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
            <div className="space-y-2">
          <Label htmlFor="video-upload">Select Video File</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
            <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <UploadCloud className="w-12 h-12 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to select a video file (max {MAX_FILE_SIZE_MB}MB)
              </span>
            </label>
          </div>
          {fileError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}
            </div>

        {/* Video Preview */}
            {videoSrc && (
          <div className="space-y-4">
            <Label>Video Preview</Label>
            <div className="relative">
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                className="w-full max-w-md rounded-lg"
                onLoadedData={() => drawWatermark()}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none rounded-lg"
                   />
                 </div>

                {/* Watermark Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                         <Label htmlFor="watermark-text">Watermark Text</Label>
                         <Input
                           id="watermark-text"
                           value={watermarkText}
                           onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Enter watermark text"
                         />
                      </div>
                      <div className="space-y-2">
                <Label htmlFor="watermark-position">Position</Label>
                <select
                  id="watermark-position"
                  value={watermarkPosition}
                  onChange={(e) => setWatermarkPosition(e.target.value as WatermarkPosition)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  {WATERMARK_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                <Label>Opacity: {Math.round(watermarkOpacity * 100)}%</Label>
                <Slider
                  value={[watermarkOpacity]}
                  onValueChange={(value) => setWatermarkOpacity(value[0])}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                         </div>
                      </div>
                   </div>
        )}

        {/* Video Information */}
        {file && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your video demo"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Web Development"
                />
                 </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., React, TypeScript, CSS (comma-separated)"
                />
              </div>
            </div>
              </div>
            )}

        {/* Upload Progress */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Uploading...</span>
              <span className="text-sm">{uploadProgress}%</span>
            </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

        {/* Success Message */}
        {isUploaded && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Upload Successful!</AlertTitle>
                 <AlertDescription>
              Your video demo has been uploaded and is now available in your profile.
                 </AlertDescription>
               </Alert>
             )}
      </CardContent>
       <CardFooter>
         <Button
           onClick={handleUpload}
          disabled={!file || !title.trim() || isLoading}
           className="w-full"
         >
           {isLoading ? (
            <>
             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
           ) : (
            <>
             <UploadCloud className="mr-2 h-4 w-4" />
              Upload Video Demo
            </>
           )}
         </Button>
       </CardFooter>
    </Card>
  );
}
