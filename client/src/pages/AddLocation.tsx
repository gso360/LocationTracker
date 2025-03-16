import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CameraCapture from "@/components/locations/CameraCapture";
import BarcodeScanner from "@/components/locations/BarcodeScanner";
import AddLocationForm from "@/components/locations/AddLocationForm";
import NextLocationSelector from "@/components/locations/NextLocationSelector";
import { useQuery } from "@tanstack/react-query";
import type { Location, Barcode } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LocationParams {
  id?: string;
  projectId?: string;
}

const AddLocation = () => {
  const params = useParams<LocationParams>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get locationId from URL params
  const locationId = params.id ? parseInt(params.id, 10) : undefined;
  
  // Get projectId from either URL params or query string
  const getProjectIdFromUrl = () => {
    // First check path parameters
    if (params.projectId) {
      return parseInt(params.projectId, 10);
    }
    
    // Then check query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const projectIdParam = searchParams.get('projectId');
    if (projectIdParam) {
      return parseInt(projectIdParam, 10);
    }
    
    return undefined;
  };
  
  const projectId = getProjectIdFromUrl();
  
  // State to track if we should show the project selection dialog
  const [showProjectSelection, setShowProjectSelection] = useState<boolean>(!projectId && !locationId);
  
  const [locationName, setLocationName] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [pinPlacement, setPinPlacement] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedLocation, setSavedLocation] = useState<any>(null);
  
  // Fetch all locations for the GroupID selector
  const { data: allLocations = [] } = useQuery({
    queryKey: projectId ? ['/api/projects', projectId, 'locations'] : ['/api/locations'],
    queryFn: async () => {
      if (projectId) {
        const response = await apiRequest('GET', `/api/projects/${projectId}/locations`);
        return await response.json();
      } else {
        const response = await apiRequest('GET', '/api/locations');
        return await response.json();
      }
    }
  });
  
  // Check if projects exist to show project selection if needed
  const { data: projectsData } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return await response.json();
    },
    enabled: !projectId && !locationId, // Only fetch if we don't have a project ID and aren't editing
  });
  
  // Fetch the next location number if we're adding a new location
  const { data: nextNumberData } = useQuery({
    queryKey: ['/api/projects', projectId, 'next-location-number'],
    queryFn: async () => {
      if (projectId) {
        // Use project-specific endpoint if we have a projectId
        const response = await apiRequest('GET', `/api/projects/${projectId}/next-location-number`);
        return await response.json();
      } else {
        // Without a projectId, we shouldn't be able to proceed
        return { nextNumber: null, error: "No project selected" };
      }
    },
    enabled: !locationId && !!projectId, // Only enabled when we have a projectId and aren't editing
  });
  
  // If editing, fetch the existing location data
  const { data: existingLocationData, isLoading: isLoadingLocation } = useQuery({
    queryKey: ['/api/locations', locationId],
    queryFn: async () => {
      if (locationId) {
        const response = await apiRequest('GET', `/api/locations/${locationId}`);
        return await response.json();
      }
      return null;
    },
    enabled: !!locationId,
  });
  
  const existingLocation = existingLocationData || null;
  
  useEffect(() => {
    // If we got the next number, set it as the location name
    if (nextNumberData && !locationId && !locationName) {
      setLocationName(nextNumberData.nextNumber);
    }
    
    // If we're editing and have loaded the location data
    if (locationId && existingLocation) {
      setLocationName(existingLocation.name);
      setLocationNotes(existingLocation.notes || '');
      setPinPlacement(existingLocation.pinPlacement || '');
      setImageData(existingLocation.imageData || null);
      setBarcodes(existingLocation.barcodes.map((b: Barcode) => b.value));
    }
  }, [nextNumberData, existingLocation, locationId, locationName]);
  
  const handleBackClick = () => {
    if (showCamera) {
      setShowCamera(false);
    } else if (showScanner) {
      setShowScanner(false);
    } else {
      if (projectId) {
        window.location.href = `/projects/${projectId}`;
      } else {
        window.location.href = "/";
      }
    }
  };
  
  const handleCapturePhoto = () => {
    setShowCamera(true);
  };
  
  const handlePhotoTaken = (data: string) => {
    setImageData(data);
    setShowCamera(false);
  };
  
  const handleScanBarcode = () => {
    setShowScanner(true);
  };
  
  const handleBarcodeScanned = (value: string) => {
    // Skip if this barcode is already in the list
    if (!barcodes.includes(value)) {
      setBarcodes([...barcodes, value]);
    }
  };
  
  const handleRemoveBarcode = (index: number) => {
    const newBarcodes = [...barcodes];
    newBarcodes.splice(index, 1);
    setBarcodes(newBarcodes);
  };
  
  const handleSaveLocation = async () => {
    return new Promise<any>((resolve, reject) => {
      if (!locationName.trim()) {
        toast({
          title: "Error",
          description: "GroupID name is required.",
          variant: "destructive",
        });
        return reject("GroupID name is required");
      }
      
      setIsSubmitting(true);
      
      // Create or update the location
      const locationData: any = {
        name: locationName.trim(),
        notes: locationNotes.trim() || null,
        pinPlacement: pinPlacement.trim() || null,
        imageData: imageData,
      };
      
      // Add project ID to new locations if specified
      if (projectId && !locationId) {
        locationData.projectId = projectId;
      }
      
      const saveAsync = async () => {
        try {
          let savedLocationData;
          
          if (locationId) {
            // Update existing location
            const response = await apiRequest("PATCH", `/api/locations/${locationId}`, locationData);
            savedLocationData = await response.json();
          } else {
            // Create new location
            const response = await apiRequest("POST", "/api/locations", locationData);
            savedLocationData = await response.json();
          }
          
          // If we're creating a new location, also save the barcodes
          if (!locationId) {
            // Save barcodes
            await Promise.all(
              barcodes.map(value => 
                apiRequest("POST", "/api/barcodes", {
                  value,
                  locationId: savedLocationData.id,
                })
              )
            );
          } else {
            // If editing, first get existing barcodes
            const existingBarcodesResponse = await apiRequest("GET", `/api/locations/${locationId}/barcodes`);
            const existingBarcodesData = await existingBarcodesResponse.json();
            
            // Delete barcodes that are no longer in the list
            await Promise.all(
              existingBarcodesData
                .filter((b: Barcode) => !barcodes.includes(b.value))
                .map((b: Barcode) => apiRequest("DELETE", `/api/barcodes/${b.id}`))
            );
            
            // Add new barcodes
            await Promise.all(
              barcodes
                .filter(value => !existingBarcodesData.some((b: Barcode) => b.value === value))
                .map(value => 
                  apiRequest("POST", "/api/barcodes", {
                    value,
                    locationId: savedLocationData.id,
                  })
                )
            );
          }
          
          // Refresh the relevant query caches
          queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
          
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'locations'] });
          }
          
          toast({
            title: locationId ? "GroupID updated" : "GroupID created",
            description: locationId 
              ? "The GroupID has been updated successfully." 
              : "The new GroupID has been added successfully.",
          });
          
          // Save the location data for reference
          setSavedLocation(savedLocationData);
          
          // Resolve the promise with the saved location
          resolve(savedLocationData);
        } catch (error) {
          toast({
            title: "Error",
            description: locationId 
              ? "Failed to update the GroupID. Please try again." 
              : "Failed to create the GroupID. Please try again.",
            variant: "destructive",
          });
          reject(error);
        } finally {
          setIsSubmitting(false);
        }
      };
      
      // Start the async operation
      saveAsync();
    });
  };
  
  // Show loading state while fetching existing location data
  if (locationId && isLoadingLocation) {
    return (
      <div className="p-4 flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2962FF]"></div>
      </div>
    );
  }
  
  // Show camera if active
  if (showCamera) {
    return <CameraCapture onCapture={handlePhotoTaken} onCancel={() => setShowCamera(false)} />;
  }
  
  // Show barcode scanner if active
  if (showScanner) {
    return <BarcodeScanner 
      onScan={handleBarcodeScanned} 
      onClose={() => {
        // First mark the scanner as closed to prevent re-renders
        setShowScanner(false);
        
        // Only proceed with save if we have barcodes and a valid GroupID name
        if (barcodes.length > 0 && locationName.trim()) {
          toast({
            title: "Saving GroupID...",
            description: "Please wait while we save your data.",
          });
          
          // Simplified auto-save approach
          const saveAsync = async () => {
            try {
              // Create or update the location
              const locationData: any = {
                name: locationName.trim(),
                notes: locationNotes.trim() || null,
                pinPlacement: pinPlacement.trim() || null,
                imageData: imageData,
              };
              
              // Add project ID to new locations if specified
              if (projectId && !locationId) {
                locationData.projectId = projectId;
              }
              
              let savedLocationData;
              
              if (locationId) {
                // Update existing location
                const response = await apiRequest("PATCH", `/api/locations/${locationId}`, locationData);
                savedLocationData = await response.json();
              } else {
                // Create new location
                const response = await apiRequest("POST", "/api/locations", locationData);
                savedLocationData = await response.json();
              }
              
              // If we're creating a new location, also save the barcodes
              if (!locationId) {
                // Save barcodes
                await Promise.all(
                  barcodes.map(value => 
                    apiRequest("POST", "/api/barcodes", {
                      value,
                      locationId: savedLocationData.id,
                    })
                  )
                );
              } else {
                // If editing, first get existing barcodes
                const existingBarcodesResponse = await apiRequest("GET", `/api/locations/${locationId}/barcodes`);
                const existingBarcodesData = await existingBarcodesResponse.json();
                
                // Delete barcodes that are no longer in the list
                await Promise.all(
                  existingBarcodesData
                    .filter((b: Barcode) => !barcodes.includes(b.value))
                    .map((b: Barcode) => apiRequest("DELETE", `/api/barcodes/${b.id}`))
                );
                
                // Add new barcodes
                await Promise.all(
                  barcodes
                    .filter(value => !existingBarcodesData.some((b: Barcode) => b.value === value))
                    .map(value => 
                      apiRequest("POST", "/api/barcodes", {
                        value,
                        locationId: savedLocationData.id,
                      })
                    )
                );
              }
              
              // Refresh the relevant query caches
              queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
              
              if (projectId) {
                queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'locations'] });
              }
              
              toast({
                title: "GroupID saved successfully",
                description: "Choose your next GroupID to scan.",
              });
              
              // Show location selector for next steps
              setShowLocationSelector(true);
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to save GroupID. Going back to list.",
                variant: "destructive",
              });
              
              // If there's an error, navigate back to list after a short delay
              setTimeout(() => {
                if (projectId) {
                  window.location.href = `/projects/${projectId}`;
                } else {
                  window.location.href = "/";
                }
              }, 1500);
            }
          };
          
          // Start the async operation
          saveAsync();
        } else {
          // If we don't have barcodes or a name, just go back to the previous screen
          toast({
            title: "No data to save",
            description: "Going back to GroupID list.",
          });
          
          setTimeout(() => {
            if (projectId) {
              window.location.href = `/projects/${projectId}`;
            } else {
              window.location.href = "/";
            }
          }, 1000);
        }
      }} 
      existingBarcodes={barcodes} 
    />;
  }
  
  // Show location selector if active
  if (showLocationSelector) {
    return <NextLocationSelector 
      locations={allLocations} 
      projectId={projectId ? Number(projectId) : undefined}
      onBack={() => {
        setShowLocationSelector(false);
        if (projectId) {
          window.location.href = `/projects/${projectId}`;
        } else {
          window.location.href = "/";
        }
      }} 
    />;
  }
  
  // Function to handle project selection
  const handleProjectSelect = (selectedProjectId: number) => {
    setShowProjectSelection(false);
    // Navigate to add location with selected project
    window.location.href = `/add-location?projectId=${selectedProjectId}`;
  };
  
  return (
    <>
      <div className="p-4">
        <div className="mb-4">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-[#455A64] mb-2"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to GroupID List
          </button>
          <h2 className="text-xl font-medium text-[#455A64]">
            {locationId ? 'Edit GroupID' : 'Add New GroupID'}
          </h2>
        </div>
        
        <AddLocationForm 
          locationName={locationName}
          setLocationName={setLocationName}
          locationNotes={locationNotes}
          setLocationNotes={setLocationNotes}
          pinPlacement={pinPlacement}
          setPinPlacement={setPinPlacement}
          imageData={imageData}
          handleCapturePhoto={handleCapturePhoto}
          barcodes={barcodes}
          handleRemoveBarcode={handleRemoveBarcode}
          handleScanBarcode={handleScanBarcode}
          handleSaveLocation={handleSaveLocation}
          isSubmitting={isSubmitting}
        />
      </div>
      
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
            {projectsData && projectsData.length > 0 ? (
              projectsData.map((project: any) => (
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
          
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go to Home
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddLocation;
