import { useLocation } from "wouter";
import { Plus, ArrowLeft, MapPin } from "lucide-react";
import type { Location, Barcode } from "@shared/schema";

interface NextLocationSelectorProps {
  locations: (Location & { barcodes: Barcode[] })[];
  projectId?: number;
  onBack: () => void;
}

const NextLocationSelector = ({ locations, projectId, onBack }: NextLocationSelectorProps) => {
  const [, navigate] = useLocation();

  // Handle add next location button click
  const handleAddNextLocation = () => {
    console.log("Adding next location, projectId:", projectId);
    
    if (projectId) {
      // This path matches the route in App.tsx
      navigate(`/projects/${projectId}/add-location`);
    } else {
      navigate('/add-location');
    }
  };

  // Handle navigation to an existing location
  const handleLocationClick = (locationId: number) => {
    navigate(`/edit-location/${locationId}`);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <button 
          onClick={onBack}
          className="flex items-center text-[#455A64] mb-2"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <h2 className="text-xl font-medium text-[#455A64]">
          GroupID Selection
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Select an existing GroupID to edit or add the next one
        </p>
      </div>

      {/* List of existing locations */}
      <div className="mb-6 space-y-3">
        {locations.map((location) => (
          <div 
            key={location.id}
            onClick={() => handleLocationClick(location.id)}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-[#2962FF] text-white flex items-center justify-center mr-3">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-[#263238]">GroupID: {location.name}</h3>
                <p className="text-sm text-gray-500">
                  {location.barcodes.length} barcode{location.barcodes.length !== 1 ? 's' : ''} scanned
                </p>
              </div>
            </div>
            <div className="text-[#2962FF]">View</div>
          </div>
        ))}
      </div>

      {/* Add next location button */}
      <button
        onClick={handleAddNextLocation}
        className="w-full bg-[#2962FF] text-white p-4 rounded-lg font-medium flex items-center justify-center"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Next GroupID
      </button>
    </div>
  );
};

export default NextLocationSelector;