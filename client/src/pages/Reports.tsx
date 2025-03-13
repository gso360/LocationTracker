import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ReportGenerators from "@/components/reports/ReportGenerators";
import ReportsList from "@/components/reports/ReportsList";
import { useReports } from "@/hooks/useReports";

const Reports = () => {
  const { data: reports, isLoading, error } = useReports();
  const { toast } = useToast();
  
  if (error) {
    toast({
      title: "Error loading reports",
      description: "Failed to load your reports. Please try again.",
      variant: "destructive",
    });
  }
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[#455A64] mb-4">Generate Reports</h2>
        <ReportGenerators />
      </div>
      
      <div>
        <h3 className="text-md font-medium text-[#455A64] mb-3">Recent Reports</h3>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2962FF]"></div>
          </div>
        ) : (
          <ReportsList reports={reports || []} />
        )}
      </div>
    </div>
  );
};

export default Reports;
