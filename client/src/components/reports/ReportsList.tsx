import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface ReportsListProps {
  reports: Report[];
}

const ReportsList: React.FC<ReportsListProps> = ({ reports }) => {
  const { toast } = useToast();
  
  const handleDownload = (report: Report) => {
    // In a real application, this would download the saved report
    // For this MVP, we'll just show a toast
    toast({
      title: "Download not available",
      description: "In this MVP, reports are not stored. Please generate a new report.",
    });
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
            <button 
              onClick={() => handleDownload(report)}
              className="text-[#2962FF]"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportsList;
