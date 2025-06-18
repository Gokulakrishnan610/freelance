// src/components/projects/apply-to-project-dialog.tsx
"use client";

import { useEffect, useState, useActionState } from 'react'; // Import useActionState from react
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input'; // Hidden inputs
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { applyToProject, ApplyState } from '@/actions/apply-to-project';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context'; // To get freelancer name

interface ApplyToProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectId: string;
  projectTitle: string;
  freelancerId: string;
  onApplicationSuccess: () => void; // Callback for successful application
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Submit Application
    </Button>
  );
}

export function ApplyToProjectDialog({
  isOpen,
  onOpenChange,
  projectId,
  projectTitle,
  freelancerId,
  onApplicationSuccess,
}: ApplyToProjectDialogProps) {
  const initialState: ApplyState = { message: null, errors: {}, success: false };
  // Replace useFormState with useActionState
  const [state, dispatch] = useActionState(applyToProject, initialState);
  const { toast } = useToast();
  const { userProfile } = useAuth(); // Get user profile for name
  const [proposalText, setProposalText] = useState(''); // Local state for textarea

  const freelancerName = userProfile?.name || 'Unknown Freelancer'; // Get name, provide fallback

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Application Submitted!",
        description: state.message,
      });
      setProposalText(''); // Clear textarea on success
      onApplicationSuccess(); // Call the success callback
    } else if (state.message && state.errors && (state.errors._form || state.errors.proposalText)) {
        // Display validation or general form errors
        const errorMsg = state.errors._form?.join(', ') || state.errors.proposalText?.join(', ') || state.message;
         toast({
            title: "Application Failed",
            description: errorMsg,
            variant: "destructive",
         });
    } else if (state.message && !state.success) { // Handle other non-success messages
        toast({
            title: "Notice",
            description: state.message,
            variant: "destructive" // Assume non-success messages are errors/warnings
        });
    }
  }, [state, toast, onApplicationSuccess]);


  // Reset local textarea state when dialog closes or opens
   useEffect(() => {
      if (!isOpen) {
          setProposalText(''); // Clear on close
          // Reset server state? Might not be necessary if useActionState handles it.
      }
   }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Apply to: {projectTitle}</DialogTitle>
          <DialogDescription>
            Write a compelling proposal to explain why you're the best fit for this project.
          </DialogDescription>
        </DialogHeader>
        <form action={dispatch} className="grid gap-4 py-4">
          {/* Hidden fields for IDs and name */}
          <Input type="hidden" name="projectId" value={projectId} />
          <Input type="hidden" name="freelancerId" value={freelancerId} />
          <Input type="hidden" name="freelancerName" value={freelancerName} /> {/* Pass the fetched name */}

          <div className="grid gap-2">
            <Label htmlFor="proposalText">Your Proposal</Label>
            <Textarea
              id="proposalText"
              name="proposalText" // Ensure name attribute matches FormData key
              placeholder="Introduce yourself, highlight relevant experience, and explain your approach..."
              rows={8}
              required
              value={proposalText} // Control textarea with local state
              onChange={(e) => setProposalText(e.target.value)} // Update local state
              aria-describedby="proposal-error"
              className={state.errors?.proposalText ? 'border-destructive' : ''}
            />
             {state.errors?.proposalText && (
                <p id="proposal-error" className="text-sm text-destructive">
                  {state.errors.proposalText.join(', ')}
                </p>
              )}
            <p className="text-sm text-muted-foreground">Minimum 50 characters, maximum 2000.</p>
          </div>

           {/* Display general form errors */}
           {state.errors?._form && (
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>
                 {state.errors._form.join(', ')}
               </AlertDescription>
             </Alert>
           )}

          <DialogFooter>
             <DialogClose asChild>
                 <Button type="button" variant="outline">Cancel</Button>
             </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
