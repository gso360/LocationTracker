import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, ArrowLeft, CheckCircle, RefreshCcw, Info } from "lucide-react";
import { type Project, type Location, type Barcode } from "@shared/schema";
import LocationList from "@/components/locations/LocationList";
import NextLocationSelector from "@/components/locations/NextLocationSelector";
import SubmitProjectButton from "@/components/locations/SubmitProjectButton";
import ReopenProjectButton from "@/components/locations/ReopenProjectButton";
import { useTour } from "@/contexts/TourContext";

export default function ProjectLocations() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id, 10) : undefined;
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const { startTour, hasTakenTour } = useTour();
  
  const { data: projectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await apiRequest('GET', `/api/projects/${projectId}`);
      return await response.json();
    },
    enabled: !!projectId
  });

  const project: Project | null = projectData || null;

  const { data: locationsData, isLoading: isLocationsLoading } = useQuery({
    queryKey: ['/api/projects', projectId, 'locations'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await apiRequest('GET', `/api/projects/${projectId}/locations`);
      return await response.json();
    },
    enabled: !!projectId
  });
  
  const locations: (Location & { barcodes: Barcode[] })[] = locationsData || [];
  
  // Check if this is the first time viewing a project's locations
  useEffect(() => {
    if (!isLocationsLoading && locations.length > 0 && !hasTakenTour('locations')) {
      // Start the tour after a slight delay to ensure the UI is fully rendered
      const timer = setTimeout(() => {
        startTour('locations');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLocationsLoading, locations, hasTakenTour, startTour]);

  if (!projectId) {
    return (
      <div className="container mx-auto py-4 text-center">
        <h2 className="text-xl font-semibold mb-4">Invalid Project ID</h2>
        <Button onClick={() => window.location.href = '/projects'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  if (isProjectLoading) {
    return (
      <div className="container mx-auto py-4 text-center">
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-4 text-center">
        <h2 className="text-xl font-semibold mb-4">Project not found</h2>
        <Button onClick={() => window.location.href = '/projects'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  // If we should show the location selector
  if (showLocationSelector && locations.length > 0) {
    return (
      <NextLocationSelector 
        locations={locations} 
        projectId={projectId} 
        onBack={() => setShowLocationSelector(false)} 
      />
    );
  }

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => window.location.href = '/projects'} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex items-center ml-auto space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center" 
            title="Show Help Tour"
            onClick={() => startTour('locations')}
          >
            <Info className="h-4 w-4 mr-1" />
            Tour
          </Button>
          {project.submitted ? (
            <ReopenProjectButton 
              projectId={projectId} 
              onProjectReopened={() => {
                toast({
                  title: "Project Reopened",
                  description: "You can now continue working on this project.",
                });
                // Refresh the project data
                queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
              }}
            />
          ) : (
            <SubmitProjectButton 
              projectId={projectId} 
              onProjectSubmitted={() => {
                toast({
                  title: "Project Submitted",
                  description: "Project has been successfully submitted.",
                });
                // Refresh the project data
                queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
              }}
            />
          )}
        </div>
      </div>

      {project.description && (
        <p className="text-muted-foreground mb-6">{project.description}</p>
      )}
      
      {project.submitted && (
        <div className="bg-green-50 text-green-800 rounded-md p-4 mb-6 border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <div>
              <p className="font-semibold">This project has been submitted.</p>
              <p className="text-sm">
                Submitted on: {new Date(project.submittedAt || '').toLocaleDateString()} at {new Date(project.submittedAt || '').toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">GroupIDs</h2>
        <div>
          <Button 
            onClick={() => window.location.href = `/projects/${projectId}/add-location`}
            className="add-location-button"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New GroupID
          </Button>
        </div>
      </div>

      {isLocationsLoading ? (
        <div className="text-center">
          <p>Loading GroupIDs...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="font-semibold mb-2">No GroupIDs Added</h3>
          <p className="mb-4">Select the GroupID to work with</p>
          <Button onClick={() => window.location.href = `/projects/${projectId}/add-location`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add First GroupID
          </Button>
        </div>
      ) : (
        <LocationList locations={locations} />
      )}
    </div>
  );
}