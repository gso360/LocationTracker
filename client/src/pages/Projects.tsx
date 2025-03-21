import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle, FileText, Info } from "lucide-react";
import { type Project } from "@shared/schema";
import { useTour } from "@/contexts/TourContext";

export default function Projects() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [lineVendor, setLineVendor] = useState("");
  const [scannerName, setScannerName] = useState("");
  const [tourId, setTourId] = useState("");
  const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupIdType, setGroupIdType] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startTour, hasTakenTour } = useTour();
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return await response.json();
    }
  });
  
  // Check if the user has taken the projects tour
  useEffect(() => {
    // Only start the tour after projects are loaded and if it hasn't been taken before
    if (!isLoading && !hasTakenTour('projects')) {
      // Start the tour after a slight delay to ensure the UI is fully rendered
      const timer = setTimeout(() => {
        startTour('projects');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, startTour, hasTakenTour]);

  const projects: Project[] = data || [];

  // Handle creating a new project
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Showroom name is required",
        variant: "destructive"
      });
      return;
    }

    if (!scannerName.trim()) {
      toast({
        title: "Error",
        description: "Scanner's name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/projects', {
        name: projectName,
        lineVendor: lineVendor || null,
        scannerName: scannerName || null,
        tourId: tourId || null,
        scanDate: scanDate || null,
        groupIdType: groupIdType || null,
        description: projectDescription || null
      });

      toast({
        title: "Success",
        description: "Project created successfully"
      });

      // Reset form and close dialog
      setProjectName("");
      setLineVendor("");
      setScannerName("");
      setTourId("");
      setScanDate("");
      setGroupIdType("1-400");
      setProjectDescription("");
      setIsCreateDialogOpen(false);

      // Refresh projects list
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a project
  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);
    try {
      await apiRequest('DELETE', `/api/projects/${selectedProject.id}`);

      toast({
        title: "Success",
        description: "Project deleted successfully"
      });

      setIsDeleteDialogOpen(false);
      setSelectedProject(null);

      // Refresh projects list
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggling project status
  const handleToggleStatus = async (projectId: number, currentStatus: string) => {
    try {
      await apiRequest('PATCH', `/api/projects/${projectId}/toggle-status`);

      const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';

      toast({
        title: "Status Updated",
        description: `Project marked as ${newStatus === 'completed' ? 'completed' : 'in progress'}`
      });

      // Refresh projects list
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Showroom Projects</h1>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2 flex items-center" 
            title="Start tour"
            onClick={() => startTour('projects')}
          >
            <Info className="h-4 w-4 mr-1" />
            Tour
          </Button>
        </div>
        <Button 
          className="create-project-button"
          onClick={() => {
            setProjectName("");
            setProjectDescription("");
            setIsCreateDialogOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">No Projects Created</h2>
          <p className="mb-4">Create your first showroom project to get started</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 projects-list">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        setSelectedProject(project);
                        setProjectName(project.name);
                        setLineVendor(project.lineVendor || "");
                        setScannerName(project.scannerName || "");
                        setTourId(project.tourId || "");
                        setScanDate(project.scanDate || "");
                        setGroupIdType(project.groupIdType || "1-400");
                        setProjectDescription(project.description || "");
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        setSelectedProject(project);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  {project.submitted ? (
                    <Badge 
                      variant="outline"
                      className="mb-2 bg-green-50 text-green-700 border-green-200"
                    >
                      Submitted
                    </Badge>
                  ) : (
                    <Badge 
                      variant={project.status === 'completed' ? 'default' : 'secondary'}
                      className="mb-2"
                    >
                      {project.status === 'completed' ? 'Completed' : 'In Progress'}
                    </Badge>
                  )}
                  
                  {!project.submitted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(project.id, project.status);
                      }}
                      title={project.status === 'completed' ? 'Mark as in progress' : 'Mark as completed'}
                    >
                      {project.status === 'completed' ? (
                        <XCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      {project.status === 'completed' ? 'Reopen' : 'Complete'}
                    </Button>
                  )}
                </div>
                {project.submitted && project.submittedAt && (
                  <div className="flex items-center text-xs text-green-700 mb-2">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    <span>Submitted: {new Date(project.submittedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                )}
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = `/projects/${project.id}`}
                  >
                    {project.submitted ? 'View GroupIDs' : 'Create GroupIDs'}
                  </Button>
                  {(project.status === 'completed' || project.submitted) && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = `/projects/${project.id}/reports`}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Reports
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogDescription>
              {selectedProject 
                ? "Update your showroom project information." 
                : "Enter the details for your new showroom project."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Project Creation Form */}
            <div>
              <Label htmlFor="project-name">Showroom Name</Label>
              <Input 
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter showroom name"
              />
            </div>

            <div>
              <Label htmlFor="line-vendor">Line/Vendor</Label>
              <Input 
                id="line-vendor"
                value={lineVendor}
                onChange={(e) => setLineVendor(e.target.value)}
                placeholder="Enter line or vendor name"
              />
            </div>

            <div>
              <Label htmlFor="scanner-name">Scanner's Name (First and Last)</Label>
              <Input 
                id="scanner-name"
                value={scannerName}
                onChange={(e) => setScannerName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="tour-id">Tour ID (Market, Season, Year)</Label>
              <Input 
                id="tour-id"
                value={tourId}
                onChange={(e) => setTourId(e.target.value)}
                placeholder="e.g., Fall 2025"
              />
            </div>

            <div>
              <Label htmlFor="scan-date">Date</Label>
              <Input 
                id="scan-date"
                type="date"
                value={scanDate}
                onChange={(e) => setScanDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="group-id-type">GroupID Prefix</Label>
              <Input
                id="group-id-type"
                value={groupIdType}
                onChange={(e) => setGroupIdType(e.target.value)}
                placeholder="S25- for example"
              />
            </div>

            <div>
              <Label htmlFor="project-description">Additional Notes (Optional)</Label>
              <Textarea 
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter any additional notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setSelectedProject(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (selectedProject) {
                  // Update existing project
                  setIsSubmitting(true);
                  try {
                    if (!projectName.trim()) {
                      throw new Error("Showroom name is required");
                    }

                    if (!scannerName.trim()) {
                      throw new Error("Scanner's name is required");
                    }

                    await apiRequest('PATCH', `/api/projects/${selectedProject.id}`, {
                      name: projectName,
                      lineVendor: lineVendor || null,
                      scannerName: scannerName || null,
                      tourId: tourId || null,
                      scanDate: scanDate || null,
                      groupIdType: groupIdType || null,
                      description: projectDescription || null
                    });

                    toast({
                      title: "Success",
                      description: "Project updated successfully"
                    });

                    setIsCreateDialogOpen(false);
                    setSelectedProject(null);

                    // Reset form fields
                    setProjectName("");
                    setLineVendor("");
                    setScannerName("");
                    setTourId("");
                    setScanDate("");
                    setGroupIdType("1-400");
                    setProjectDescription("");

                    // Refresh projects list
                    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Failed to update project";
                    toast({
                      title: "Error",
                      description: errorMessage,
                      variant: "destructive"
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                } else {
                  // Create new project
                  await handleCreateProject();
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : selectedProject ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the project "{selectedProject?.name}"? 
              This will also delete all locations and barcodes associated with this project.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}