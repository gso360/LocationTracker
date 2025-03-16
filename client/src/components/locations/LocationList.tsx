import { useState, useEffect } from "react";
import LocationCard from "./LocationCard";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Location, Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface LocationListProps {
  locations: (Location & { barcodes: any[] })[];
}

// Type for our grouped locations
interface GroupedLocations {
  [projectId: string]: {
    project: Project | null;
    locations: (Location & { barcodes: any[] })[];
    isOpen: boolean;
  }
}

const LocationList: React.FC<LocationListProps> = ({ locations }) => {
  // State to track collapsed/expanded project groups
  const [groupedLocations, setGroupedLocations] = useState<GroupedLocations>({});
  
  // Fetch all projects to get their names
  const { data: projectsData } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return await response.json();
    }
  });

  // Group locations by project
  useEffect(() => {
    if (locations && locations.length > 0) {
      const grouped: GroupedLocations = {};
      
      // First add "No Project" group
      grouped["none"] = {
        project: null,
        locations: [],
        isOpen: true
      };
      
      // Group by project
      locations.forEach(location => {
        const projectId = location.projectId ? location.projectId.toString() : "none";
        
        if (!grouped[projectId]) {
          // Find project from our projects data
          const project = projectsData?.find((p: Project) => p.id === location.projectId) || null;
          
          grouped[projectId] = {
            project,
            locations: [],
            isOpen: true // Default to open
          };
        }
        
        grouped[projectId].locations.push(location);
      });
      
      // Remove "No Project" group if empty
      if (grouped["none"].locations.length === 0) {
        delete grouped["none"];
      }
      
      setGroupedLocations(grouped);
    }
  }, [locations, projectsData]);

  // Toggle a group's expanded/collapsed state
  const toggleGroup = (projectId: string) => {
    setGroupedLocations(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        isOpen: !prev[projectId].isOpen
      }
    }));
  };

  return (
    <div className="space-y-6 location-list">
      {Object.entries(groupedLocations).map(([projectId, group]) => (
        <div key={projectId} className="border rounded-lg overflow-hidden shadow-sm">
          {/* Project header */}
          <div 
            className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
            onClick={() => toggleGroup(projectId)}
          >
            <h3 className="font-medium">
              {group.project ? group.project.name : "Unassigned Locations"}
              {group.project?.submitted && <span className="ml-2 text-green-600 text-sm">(Submitted)</span>}
            </h3>
            <div>
              <span className="text-sm text-gray-500 mr-2">{group.locations.length} location{group.locations.length !== 1 ? 's' : ''}</span>
              {group.isOpen ? 
                <ChevronDown className="inline h-5 w-5 text-gray-500" /> : 
                <ChevronRight className="inline h-5 w-5 text-gray-500" />
              }
            </div>
          </div>
          
          {/* Collapsible content */}
          {group.isOpen && (
            <div className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.locations.map((location) => (
                  <LocationCard 
                    key={location.id} 
                    location={location} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Empty state */}
      {Object.keys(groupedLocations).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No locations found
        </div>
      )}
    </div>
  );
};

export default LocationList;
