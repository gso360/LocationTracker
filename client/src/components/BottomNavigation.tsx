import { useLocation, Link } from "wouter";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BottomNavigation = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  
  // Extract project ID from URL if we're in a project-specific page
  useEffect(() => {
    const match = location.match(/\/projects\/(\d+)/);
    if (match && match[1]) {
      setCurrentProjectId(parseInt(match[1], 10));
    } else {
      setCurrentProjectId(null);
    }
  }, [location]);
  
  // Fetch projects for selection dialog
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return await response.json();
    },
    enabled: showProjectSelection,
  });
  
  // Handle add button click based on context
  const handleAddClick = (e: React.MouseEvent) => {
    // If we're already in a project context, use that
    if (currentProjectId) {
      // Navigate directly to add location with project context
      return; // Let the Link component handle navigation
    }
    
    // Otherwise, show project selection first
    e.preventDefault();
    setShowProjectSelection(true);
  };
  
  const handleProjectSelect = (projectId: number) => {
    setShowProjectSelection(false);
    
    // Navigate to add location with selected project
    window.location.href = `/add-location?projectId=${projectId}`;
  };
  
  return (
    <>
      <nav className="bg-white border-t border-gray-200 p-3 bottom-nav">
        <div className="flex justify-center">
          <Link 
            href={currentProjectId ? `/add-location?projectId=${currentProjectId}` : "/add-location"} 
            onClick={handleAddClick}
            className="bg-[#2962FF] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg touch-target"
            aria-label="Add new location"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>
      </nav>
      
      {/* Project Selection Dialog */}
      <Dialog open={showProjectSelection} onOpenChange={setShowProjectSelection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Project</DialogTitle>
            <DialogDescription>
              Choose a project to add a new GroupID to
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {projects.length > 0 ? (
              projects.map((project: any) => (
                <Button 
                  key={project.id} 
                  onClick={() => handleProjectSelect(project.id)}
                  variant="outline"
                  className="justify-start h-auto py-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.status === 'in_progress' ? 'In Progress' : 'Completed'}
                    </div>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No active projects found. Please create a project first.
              </div>
            )}
          </div>
          
          <Button variant="outline" onClick={() => setShowProjectSelection(false)}>
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BottomNavigation;