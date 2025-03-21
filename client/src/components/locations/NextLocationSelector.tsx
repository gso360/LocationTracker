import { useLocation } from "wouter";
import React, { useState } from "react";
import { Plus, ArrowLeft, MapPin, CheckCircle, Download } from "lucide-react";
import type { Location, Barcode } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generatePDFReport } from "@/lib/file-utils";

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
    // We now allow project submission even if there are locations without barcodes
    // This comment indicates we've removed the check that required at least one barcode
    
    setIsSubmitting(true);
    
    try {
      // Create a report for this project
      const reportData = {
        projectId,
        name: `Project Report - ${new Date().toLocaleDateString()}`,
        type: "pdf",  // Change to PDF type for the virtual showroom format
        emailCopy: false,
        syncAfter: true,
        showPdf: false
      };
      
      // Create the report in the database
      const response = await apiRequest("POST", "/api/reports", reportData);
      const report = await response.json();
      
      // Submit the project (Mark as submitted and set submission date)
      try {
        await apiRequest("POST", `/api/projects/${projectId}/submit`);
        console.log("Project successfully marked as submitted");
      } catch (submitError) {
        console.error("Error submitting project:", submitError);
        toast({
          title: "Submission Warning",
          description: "Report was created but there was an issue marking the project as submitted.",
          variant: "destructive"
        });
        // We'll continue with the report generation even if submission fails
      }
      
      // Generate a PDF report for this project
      try {
        // Get project details and locations with barcodes
        const pdfResponse = await apiRequest("GET", `/api/exports/pdf?projectId=${projectId}`);
        const pdfData = await pdfResponse.json();
        
        if (pdfData.success) {
          // Generate the PDF with the project data included
          const filename = await generatePDFReport(pdfData.data, pdfData.projectData);
          
          toast({
            title: "Virtual Showroom Location ID Form Generated",
            description: `Your location ID form '${filename}' has been downloaded to your downloads folder.`,
          });
        }
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        toast({
          title: "PDF Generation Warning",
          description: "Your project was submitted successfully, but there was an issue creating the PDF report.",
          variant: "default"
        });
        // Don't fail the submission if PDF generation fails
      }
      
      toast({
        title: "Submission successful!",
        description: `Your project has been successfully submitted with ${locations.length} GroupIDs and ${totalBarcodes} total barcodes.`
      });
      
      // Navigate to project list
      setTimeout(() => {
        window.location.href = "/";
      }, 2500); // Increased timeout to allow for PDF download
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

      {/* List of existing locations (sorted by GroupID in ascending order) */}
      <div className="mb-6 space-y-3">
        {[...locations]
          .sort((a, b) => {
            // Parse as numbers if possible for proper numeric sorting
            const numA = parseInt(a.name);
            const numB = parseInt(b.name);
            
            // If both are valid numbers, compare numerically
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            
            // Otherwise, fall back to string comparison
            return a.name.localeCompare(b.name);
          })
          .map((location) => (
          <div 
            key={location.id}
            onClick={() => handleLocationClick(location.id)}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center">
              {location.imageData ? (
                <div className="h-10 w-10 rounded-full overflow-hidden mr-3 border border-gray-200">
                  <img 
                    src={location.imageData} 
                    alt={`GroupID ${location.name}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#2962FF] text-white flex items-center justify-center mr-3">
                  <MapPin className="h-5 w-5" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-[#263238]">GroupID: {location.name}</h3>
                <p className="text-sm text-gray-500">
                  {location.barcodes.length === 0 
                    ? "No barcodes attached" 
                    : `${location.barcodes.length} barcode${location.barcodes.length !== 1 ? 's' : ''} scanned`}
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