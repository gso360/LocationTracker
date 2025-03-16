import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Table, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { generateExcelReport, generatePDFReport } from "@/lib/file-utils";

interface ReportGeneratorsProps {
  projectId?: number;
}

const ReportGenerators = ({ projectId }: ReportGeneratorsProps) => {
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const handleGenerateExcelReport = async () => {
    setIsGeneratingExcel(true);
    try {
      // Add project ID to URL if available
      const url = projectId ? `/api/exports/excel?projectId=${projectId}` : '/api/exports/excel';
      const response = await apiRequest("GET", url);
      const data = await response.json();
      
      if (data.success) {
        const filename = await generateExcelReport(data.data, data.projectData);
        
        // Create report record with project ID if available
        // Use project info for the report name if available
        const reportName = data.projectData 
          ? `Excel Report - ${data.projectData.name} - ${new Date().toLocaleDateString()} - ${data.projectData.scannerName || 'Unknown'}`
          : `Excel Report - ${new Date().toLocaleDateString()}`;
          
        const reportData: any = {
          name: reportName,
          type: "excel",
          emailCopy: false,
          syncAfter: true,
          showPdf: false
        };
        
        // Only add projectId if it exists
        if (projectId) {
          reportData.projectId = projectId;
        }
        
        await apiRequest("POST", "/api/reports", reportData);
        
        // Invalidate both reports and projects to refresh UI
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        
        toast({
          title: "Excel Report Generated",
          description: `Your report has been downloaded as ${filename}`,
        });
      } else {
        throw new Error(data.message || "Failed to generate Excel report");
      }
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Could not generate the Excel report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };
  
  // Define a function to handle PDF generation for a specific project ID
  const generateProjectPDF = async (projectId?: number) => {
    setIsGeneratingPDF(true);
    try {
      // Add projectId parameter to get locations for a specific project
      const url = projectId ? `/api/exports/pdf?projectId=${projectId}` : '/api/exports/pdf';
      const response = await apiRequest("GET", url);
      const data = await response.json();
      
      if (data.success) {
        // Pass both location data and project data to the PDF generator
        const filename = await generatePDFReport(data.data, data.projectData);
        
        // Create report record with project info for the name if available
        const reportName = data.projectData 
          ? `PDF Report - ${data.projectData.name} - ${new Date().toLocaleDateString()} - ${data.projectData.scannerName || 'Unknown'}`
          : `PDF Report - ${new Date().toLocaleDateString()}`;
            
        const reportData: any = {
          name: reportName,
          type: "pdf",
          emailCopy: false,
          syncAfter: true,
          showPdf: false
        };
        
        // Only add projectId if it exists
        if (projectId) {
          reportData.projectId = projectId;
        }
        
        await apiRequest("POST", "/api/reports", reportData);
        
        // Invalidate both reports and projects to refresh UI
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        
        toast({
          title: "PDF Report Generated",
          description: `Your virtual showroom location ID form has been downloaded as ${filename}`,
        });
      } else {
        throw new Error(data.message || "Failed to generate PDF report");
      }
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Could not generate the PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  // Handler for the button click
  const handleGeneratePDFReport = () => {
    generateProjectPDF(projectId);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Excel Report Card */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-lg mb-1">Excel/CSV Report</h3>
            <p className="text-gray-500 text-sm">Export a spreadsheet listing all barcodes with their assigned locations.</p>
          </div>
          <div className="bg-green-50 p-2 rounded-full">
            <Table className="h-5 w-5 text-[#00C853]" />
          </div>
        </div>
        <button 
          onClick={handleGenerateExcelReport}
          disabled={isGeneratingExcel}
          className="bg-[#00C853] text-white px-4 py-2 rounded-lg w-full flex items-center justify-center disabled:opacity-70"
        >
          {isGeneratingExcel ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-1" />
              Generate Excel Report
            </>
          )}
        </button>
      </div>
      
      {/* PDF Report Card */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-lg mb-1">PDF Report</h3>
            <p className="text-gray-500 text-sm">Create a visual report with location photos and associated information.</p>
          </div>
          <div className="bg-red-50 p-2 rounded-full">
            <FileText className="h-5 w-5 text-red-500" />
          </div>
        </div>
        <button 
          onClick={() => handleGeneratePDFReport()}
          disabled={isGeneratingPDF}
          className="bg-red-500 text-white px-4 py-2 rounded-lg w-full flex items-center justify-center disabled:opacity-70"
        >
          {isGeneratingPDF ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-1" />
              Generate PDF Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportGenerators;
