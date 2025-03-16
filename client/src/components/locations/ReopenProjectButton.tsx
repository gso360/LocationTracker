import React, { useState } from "react";
import { useNavigate } from "wouter";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw } from "lucide-react";

interface ReopenProjectButtonProps {
  projectId: number;
  onProjectReopened?: () => void;
}

const ReopenProjectButton: React.FC<ReopenProjectButtonProps> = ({
  projectId,
  onProjectReopened
}) => {
  const [isReopening, setIsReopening] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReopen = async () => {
    try {
      setIsReopening(true);
      
      const response = await apiRequest("POST", `/api/projects/${projectId}/reopen`);
      
      toast({
        title: "Project Reopened",
        description: "The project has been successfully reopened and is now in progress.",
        variant: "default",
      });

      setOpen(false);
      
      if (onProjectReopened) {
        onProjectReopened();
      }
    } catch (error: any) {
      console.error("Error reopening project:", error);
      const errorMessage = error.message || "Failed to reopen the project. Please try again.";
      
      toast({
        title: "Reopening Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          className="w-full md:w-auto" 
          variant="outline" 
          disabled={isReopening}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reopen Project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reopen Project</AlertDialogTitle>
          <AlertDialogDescription>
            This action will change the project status back to "In Progress".
            <br /><br />
            You'll be able to add more locations and scan more barcodes. When you're finished, you can submit the project again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleReopen();
            }}
            disabled={isReopening}
          >
            {isReopening ? "Reopening..." : "Reopen Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReopenProjectButton;