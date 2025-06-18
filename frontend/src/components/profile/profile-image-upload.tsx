"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, RotateCcw, Check } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageUpdate?: (imageUrl: string) => void;
}

export function ProfileImageUpload({ currentImage, onImageUpdate }: ProfileImageUploadProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const processImageToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not available'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Set canvas size for square crop (300x300)
        const size = 300;
        canvas.width = size;
        canvas.height = size;

        // Calculate crop dimensions to maintain aspect ratio
        const minDimension = Math.min(img.width, img.height);
        const scale = size / minDimension;
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        const offsetX = (size - scaledWidth) / 2;
        const offsetY = (size - scaledHeight) / 2;

        // Clear canvas and draw image
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

        // Convert to base64 with compression
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Process image to base64
      const base64Image = await processImageToBase64(selectedFile);
      
      // Update profile with base64 image data
      const response = await apiClient.updateMyProfile({
        avatar_data: base64Image,
        avatar_filename: selectedFile.name,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Profile Image Updated",
        description: "Your profile image has been successfully updated.",
      });

      // Call callback if provided
      if (onImageUpdate && (response.data?.avatar_url || response.data?.avatar)) {
        onImageUpdate(response.data.avatar_url || response.data.avatar);
      }

      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowPreview(false);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, processImageToBase64, toast, onImageUpdate]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowPreview(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Canvas for image processing (hidden) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Current/Preview Image */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            <AvatarImage 
              src={showPreview ? previewUrl || undefined : currentImage} 
              alt="Profile" 
            />
            <AvatarFallback className="text-2xl">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          
          {/* Camera overlay button */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0 shadow-lg"
            onClick={triggerFileSelect}
            disabled={isUploading}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        {/* Upload controls */}
        {showPreview && (
          <Card className="w-full max-w-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Preview - Image will be cropped to square
                </Label>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Image
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload button when no preview */}
        {!showPreview && (
          <Button
            variant="outline"
            onClick={triggerFileSelect}
            disabled={isUploading}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Change Profile Picture</span>
          </Button>
        )}
      </div>

      {/* File requirements */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Supported formats: JPEG, PNG, WebP</p>
        <p>Maximum size: 5MB</p>
        <p>Image will be automatically cropped to square</p>
      </div>
    </div>
  );
} 