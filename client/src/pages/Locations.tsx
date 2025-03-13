import { useState } from "react";
import { useLocation } from "wouter";
import { Filter, Plus } from "lucide-react";
import LocationList from "@/components/locations/LocationList";
import { useToast } from "@/hooks/use-toast";
import { useLocations } from "@/hooks/useLocations";

const Locations = () => {
  const [, navigate] = useLocation();
  const { data: locations, isLoading, error } = useLocations();
  const { toast } = useToast();
  
  const handleAddLocation = () => {
    navigate("/add-location");
  };
  
  const showEmptyState = !isLoading && (!locations || locations.length === 0);
  
  if (error) {
    toast({
      title: "Error loading locations",
      description: "Failed to load your locations. Please try again.",
      variant: "destructive",
    });
  }
  
  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-[#455A64]">Your Locations</h2>
        <div>
          <button className="p-2 mr-2 rounded-full hover:bg-gray-100">
            <Filter className="h-5 w-5 text-[#455A64]" />
          </button>
          <button 
            onClick={handleAddLocation}
            className="bg-[#2962FF] text-white px-4 py-2 rounded-full flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2962FF]"></div>
        </div>
      ) : showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <MapPin className="h-8 w-8 text-[#455A64]" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Locations Yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm">Start by adding your first inventory location to organize your items.</p>
          <button 
            onClick={handleAddLocation}
            className="bg-[#2962FF] text-white px-6 py-2 rounded-full flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Add First Location</span>
          </button>
        </div>
      ) : (
        <LocationList locations={locations || []} />
      )}
    </div>
  );
};

export default Locations;

// Import the MapPin icon at the top of the file
import { MapPin } from "lucide-react";
