import { useState } from "react";
import { useLocation } from "wouter";
import { Filter, Plus, MapPin } from "lucide-react";
import LocationList from "@/components/locations/LocationList";
import { useToast } from "@/hooks/use-toast";
import { useLocations } from "@/hooks/useLocations";
import NextLocationSelector from "@/components/locations/NextLocationSelector";

const Locations = () => {
  const [, navigate] = useLocation();
  const { data: locations, isLoading, error } = useLocations();
  const { toast } = useToast();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  
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
  
  // Show selector if toggled and locations exist
  if (showLocationSelector && locations && locations.length > 0) {
    return (
      <NextLocationSelector 
        locations={locations} 
        onBack={() => setShowLocationSelector(false)} 
      />
    );
  }

  // Main locations view
  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-[#455A64]">Your Locations</h2>
        <div className="flex items-center">
          {!showEmptyState && (
            <button 
              className="mr-2 px-3 py-2 border border-[#2962FF] text-[#2962FF] rounded-full text-sm font-medium"
              onClick={() => setShowLocationSelector(true)}
            >
              Select Next GroupID
            </button>
          )}
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


