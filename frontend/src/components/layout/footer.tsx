import { ShieldCheck } from "lucide-react";
import Link from "next/link"; // Import Link

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row md:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            Freelance Fortress
          </Link>
        </div>
        <p className="text-center text-xs sm:text-sm text-muted-foreground md:order-first md:flex-1 md:text-left">
          © {new Date().getFullYear()} Freelance Fortress. All rights reserved.
          Built securely for freelancers and clients.
        </p>
        <nav className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
          <Link
            href="#" // Replace with actual links
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <Link
            href="#" // Replace with actual links
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="#" // Replace with actual links
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
