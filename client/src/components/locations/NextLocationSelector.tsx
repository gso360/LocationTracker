import { useLocation } from "wouter";
import React, { useState } from "react";
import { Plus, ArrowLeft, MapPin, CheckCircle, Download } from "lucide-react";
import type { Location, Barcode } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NextLocationSelectorProps {
  locations: (Location & { barcodes: Barcode[] })[];
  projectId?: number;
  onBack: () => void;
}

const NextLocationSelector = ({ locations, projectId, onBack }: NextLocationSelectorProps) => {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle add next location button click
  const handleAddNextLocation = () => {
    console.log("Adding next location, projectId:", projectId);
    
    // Force navigation by changing window location
    if (projectId) {
      // Direct DOM navigation as a fallback when wouter navigation isn't working
      window.location.href = `/projects/${projectId}/add-location`;
    } else {
      window.location.href = '/add-location';
    }
  };

  // Handle navigation to an existing location
  const handleLocationClick = (locationId: number) => {
    // Direct DOM navigation for consistency with the Add Next GroupID button
    window.location.href = `/edit-location/${locationId}`;
  };
  
  // Handle submission of the project
  const handleSubmit = async () => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "ProjectID is required for submission.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if we have locations
    if (locations.length === 0) {
      toast({
        title: "No GroupIDs found",
        description: "You must add at least one GroupID with barcodes before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    // Count total barcodes
    const totalBarcodes = locations.reduce((total, location) => total + location.barcodes.length, 0);
    if (totalBarcodes === 0) {
      toast({
        title: "No barcodes scanned",
        description: "You must scan at least one barcode before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a report for this project
      const reportData = {
        projectId,
        notes: `Completed project with ${locations.length} GroupIDs and ${totalBarcodes} total barcodes`,
        status: "completed"
      };
      
      const response = await apiRequest("POST", "/api/reports", reportData);
      const report = await response.json();
      
      toast({
        title: "Submission successful!",
        description: `Your project has been successfully submitted with ${locations.length} GroupIDs and ${totalBarcodes} total barcodes.`
      });
      
      // Navigate to project list
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        className="w-full bg-[#2962FF] text-white p-4 rounded-lg font-medium flex items-center justify-center mb-4"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Next GroupID
      </button>
      
      {/* Submit project button - only available when there are locations */}
      {projectId && locations.length > 0 && (
        <div className="pt-4 border-t mt-8">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-800 mb-2">Project Summary</h3>
            <div className="text-sm text-gray-600">
              <p>Total GroupIDs: <span className="font-medium">{locations.length}</span></p>
              <p>Total Barcodes: <span className="font-medium">
                {locations.reduce((total, location) => total + location.barcodes.length, 0)}
              </span></p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full ${isSubmitting ? 'bg-[#00C853]/70' : 'bg-[#00C853]'} text-white p-4 rounded-lg font-medium flex items-center justify-center`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Submit Project
              </>
            )}
          </button>
          
          <p className="text-sm text-gray-500 text-center mt-2">
            This will finalize all data and create a report.
          </p>
        </div>
      )}
    </div>
  );
};

export default NextLocationSelector;