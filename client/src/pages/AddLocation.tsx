import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CameraCapture from "@/components/locations/CameraCapture";
import BarcodeScanner from "@/components/locations/BarcodeScanner";
import AddLocationForm from "@/components/locations/AddLocationForm";
import { useQuery } from "@tanstack/react-query";
import type { Location, Barcode } from "@shared/schema";

interface LocationParams {
  id?: string;
  projectId?: string;
}

const AddLocation = () => {
  const params = useParams<LocationParams>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const locationId = params.id ? parseInt(params.id, 10) : undefined;
  const projectId = params.projectId ? parseInt(params.projectId, 10) : undefined;
  
  const [locationName, setLocationName] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch the next location number if we're adding a new location
  const { data: nextNumberData } = useQuery({
    queryKey: ['/api/projects', projectId, 'next-location-number'],
    queryFn: async () => {
      if (projectId) {
        const response = await apiRequest('GET', `/api/projects/${projectId}/next-location-number`);
        return await response.json();
      } else {
        const response = await apiRequest('GET', '/api/locations/next-number');
        return await response.json();
      }
    },
    enabled: !locationId,
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
        navigate(`/projects/${projectId}`);
      } else {
        navigate("/");
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
    if (!locationName.trim()) {
      toast({
        title: "Error",
        description: "Location name is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create or update the location
      const locationData: any = {
        name: locationName.trim(),
        notes: locationNotes.trim() || null,
        imageData: imageData,
      };
      
      // Add project ID to new locations if specified
      if (projectId && !locationId) {
        locationData.projectId = projectId;
      }
      
      let savedLocation;
      
      if (locationId) {
        // Update existing location
        const response = await apiRequest("PATCH", `/api/locations/${locationId}`, locationData);
        savedLocation = await response.json();
      } else {
        // Create new location
        const response = await apiRequest("POST", "/api/locations", locationData);
        savedLocation = await response.json();
      }
      
      // If we're creating a new location, also save the barcodes
      if (!locationId) {
        // Save barcodes
        await Promise.all(
          barcodes.map(value => 
            apiRequest("POST", "/api/barcodes", {
              value,
              locationId: savedLocation.id,
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
                locationId: savedLocation.id,
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
        title: locationId ? "Location updated" : "Location created",
        description: locationId 
          ? "The location has been updated successfully." 
          : "The new location has been added successfully.",
      });
      
      // Navigate back to the appropriate page
      if (projectId) {
        navigate(`/projects/${projectId}`);
      } else {
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: locationId 
          ? "Failed to update the location. Please try again." 
          : "Failed to create the location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
    return <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} />;
  }
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <button 
          onClick={handleBackClick}
          className="flex items-center text-[#455A64] mb-2"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Locations
        </button>
        <h2 className="text-xl font-medium text-[#455A64]">
          {locationId ? 'Edit Location' : 'Add New Location'}
        </h2>
      </div>
      
      <AddLocationForm 
        locationName={locationName}
        setLocationName={setLocationName}
        locationNotes={locationNotes}
        setLocationNotes={setLocationNotes}
        imageData={imageData}
        handleCapturePhoto={handleCapturePhoto}
        barcodes={barcodes}
        handleRemoveBarcode={handleRemoveBarcode}
        handleScanBarcode={handleScanBarcode}
        handleSaveLocation={handleSaveLocation}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AddLocation;
