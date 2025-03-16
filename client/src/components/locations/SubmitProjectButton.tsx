import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SubmitProjectButtonProps {
  projectId: number;
  onProjectSubmitted?: () => void;
}

const SubmitProjectButton: React.FC<SubmitProjectButtonProps> = ({
  projectId,
  onProjectSubmitted
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", `/api/projects/${projectId}/submit`);
      
      // Invalidate projects query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      toast({
        title: "Project Submitted",
        description: "The project has been successfully submitted and marked as complete.",
        variant: "default",
      });

      setOpen(false);
      
      if (onProjectSubmitted) {
        onProjectSubmitted();
      } else {
        // Navigate to the projects list after a short delay using direct DOM navigation
        setTimeout(() => {
          window.location.href = "/projects";
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error submitting project:", error);
      const errorMessage = error.message || "Failed to submit the project. Please try again.";
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          className="w-full md:w-auto submit-project-button" 
          variant="default" 
          disabled={isSubmitting}
        >
          Submit Project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit Project</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the project as complete and generate a final report.
            <br /><br />
            <span className="font-medium">Make sure that:</span>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>All locations have been documented with photos</li>
              <li>All barcodes have been scanned and associated with locations</li>
              <li>All information is accurate and complete</li>
            </ul>
            <br />
            You can reopen this project later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SubmitProjectButton;