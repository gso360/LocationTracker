import { useState } from "react";
import { useLocation } from "wouter";
import { Edit, QrCode, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Location, Barcode } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface LocationCardProps {
  location: Location & { barcodes: Barcode[] };
}

const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOptions, setShowOptions] = useState(false);
  
  const handleEdit = () => {
    navigate(`/edit-location/${location.id}`);
  };
  
  const handleScanBarcode = () => {
    navigate(`/add-location?locationId=${location.id}&mode=scan`);
  };
  
  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/locations/${location.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Location deleted",
        description: "The location has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: "Could not delete the location. Please try again.",
        variant: "destructive",
      });
    }
    setShowOptions(false);
  };
  
  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-medium">Location #{location.name}</h3>
            <p className="text-sm text-gray-500">
              {location.barcodes.length} {location.barcodes.length === 1 ? "barcode" : "barcodes"}
            </p>
          </div>
          <div className="relative">
            <button 
              className="p-1 rounded-full hover:bg-gray-100"
              onClick={toggleOptions}
            >
              <MoreVertical className="h-5 w-5 text-[#455A64]" />
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button 
                    onClick={handleEdit}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="aspect-video bg-gray-200 rounded mb-3 overflow-hidden">
          {location.imageData ? (
            <img 
              src={location.imageData}
              alt={`Location #${location.name}`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {location.barcodes.map((barcode, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
              {barcode.value}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between">
          <button 
            onClick={handleEdit}
            className="text-[#2962FF] flex items-center text-sm"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button 
            onClick={handleScanBarcode}
            className="text-[#2962FF] flex items-center text-sm"
          >
            <QrCode className="h-4 w-4 mr-1" />
            Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationCard;
