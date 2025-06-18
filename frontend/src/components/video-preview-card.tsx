import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Removed unused imports: Eye, Star, DollarSign

interface VideoPreviewCardProps {
  title: string;
  description: string;
  thumbnailUrl: string; // Assuming this will come from metadata later
  freelancerName: string;
  tags?: string[];
  videoId: string; // Add videoId to link to a player page
}

export function VideoPreviewCard({
  title,
  description,
  thumbnailUrl,
  freelancerName,
  tags,
  videoId, // Destructure videoId
}: VideoPreviewCardProps) {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col group"> {/* Added group class */}
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full overflow-hidden"> {/* Added overflow-hidden */}
          <Image
            src={thumbnailUrl || "https://picsum.photos/320/180"} // Provide a default placeholder
            alt={`Thumbnail for ${title}`}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-300"
            data-ai-hint="video preview thumbnail abstract" // Adjusted hint
          />
           {/* Simple overlay to hint at protection */}
           <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
             {/* You could add a play icon here that appears on hover */}
           </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">{title || "Untitled Video"}</CardTitle>
        <p className="text-sm text-muted-foreground mb-2">By {freelancerName}</p>
        <p className="text-sm text-foreground line-clamp-3 mb-3">{description || "No description provided."}</p>
         {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
         {/* Removed rating, views, price section */}
        <Button className="w-full" variant="outline" asChild>
          {/* Link to a future video player page, passing videoId */}
          <Link href={`/demos/${videoId}`}>
             View Demo
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
