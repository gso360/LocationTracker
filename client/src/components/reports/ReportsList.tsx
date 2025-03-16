import { Download, FileText, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { generateExcelReport, generatePDFReport } from "@/lib/file-utils";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface ReportsListProps {
  reports: Report[];
}

const ReportsList: React.FC<ReportsListProps> = ({ reports }) => {
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<number, { excel: boolean, pdf: boolean }>>({});
  
  const handleDownload = (report: Report) => {
    // In a real application, this would download the saved report
    // For this MVP, we'll just show a toast
    toast({
      title: "Download not available",
      description: "In this MVP, reports are not stored. Please generate a new report.",
    });
  };
  
  const generateExcel = async (report: Report) => {
    // Set loading state for this report's Excel button
    setLoadingStates(prev => ({
      ...prev,
      [report.id]: { ...prev[report.id], excel: true }
    }));
    
    try {
      // Add project ID to URL if available
      const url = report.projectId ? `/api/exports/excel?projectId=${report.projectId}` : '/api/exports/excel';
      const response = await apiRequest("GET", url);
      const data = await response.json();
      
      if (data.success) {
        await generateExcelReport(data.data, data.projectData);
        
        toast({
          title: "Excel Report Generated",
          description: "Your report has been downloaded successfully.",
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
      setLoadingStates(prev => ({
        ...prev,
        [report.id]: { ...prev[report.id], excel: false }
      }));
    }
  };
  
  const generatePDF = async (report: Report) => {
    // Set loading state for this report's PDF button
    setLoadingStates(prev => ({
      ...prev,
      [report.id]: { ...prev[report.id], pdf: true }
    }));
    
    try {
      // Add projectId parameter if available
      const url = report.projectId ? `/api/exports/pdf?projectId=${report.projectId}` : '/api/exports/pdf';
      const response = await apiRequest("GET", url);
      const data = await response.json();
      
      if (data.success) {
        await generatePDFReport(data.data, data.projectData);
        
        toast({
          title: "PDF Report Generated",
          description: "Your report has been downloaded successfully.",
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
      setLoadingStates(prev => ({
        ...prev,
        [report.id]: { ...prev[report.id], pdf: false }
      }));
    }
  };
  
  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No reports generated yet. Use the buttons above to create your first report.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      {reports.map((report, index) => (
        <div 
          key={report.id} 
          className={`p-4 ${index !== reports.length - 1 ? 'border-b' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{report.name}</h4>
              <p className="text-xs text-gray-500">Generated on {formatDate(new Date(report.createdAt))}</p>
            </div>
            <div className="flex space-x-3">
              {/* Excel/Spreadsheet Button */}
              <button 
                onClick={() => generateExcel(report)}
                className="text-[#00C853]"
                disabled={loadingStates[report.id]?.excel}
              >
                {loadingStates[report.id]?.excel ? (
                  <div className="animate-spin h-5 w-5 border-2 border-[#00C853] border-t-transparent rounded-full"></div>
                ) : (
                  <Table className="h-5 w-5" />
                )}
              </button>
              
              {/* PDF Button */}
              <button 
                onClick={() => generatePDF(report)}
                className="text-red-500"
                disabled={loadingStates[report.id]?.pdf}
              >
                {loadingStates[report.id]?.pdf ? (
                  <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </button>
              
              {/* Original Download Button */}
              <button 
                onClick={() => handleDownload(report)}
                className="text-[#2962FF]"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportsList;
