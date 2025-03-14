import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { type Project, type Location, type Barcode } from "@shared/schema";
import LocationList from "@/components/locations/LocationList";
import NextLocationSelector from "@/components/locations/NextLocationSelector";

export default function ProjectLocations() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id, 10) : undefined;
  const [showLocationSelector, setShowLocationSelector] = useState(false);

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

  if (!projectId) {
    return (
      <div className="container mx-auto py-4 text-center">
        <h2 className="text-xl font-semibold mb-4">Invalid Project ID</h2>
        <Button onClick={() => setLocation('/projects')}>
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
        <Button onClick={() => setLocation('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => setLocation('/projects')} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{project.name}</h1>
      </div>

      {project.description && (
        <p className="text-muted-foreground mb-6">{project.description}</p>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">GroupIDs</h2>
        <Button onClick={() => setLocation(`/projects/${projectId}/add-location`)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New GroupID
        </Button>
      </div>

      {isLocationsLoading ? (
        <div className="text-center">
          <p>Loading GroupIDs...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="font-semibold mb-2">No GroupIDs Added</h3>
          <p className="mb-4">Select the GroupID to work with</p>
          <Button onClick={() => setLocation(`/projects/${projectId}/add-location`)}>
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