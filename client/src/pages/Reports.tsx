import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportGenerators from "@/components/reports/ReportGenerators";
import ReportsList from "@/components/reports/ReportsList";
import { useReports } from "@/hooks/useReports";

const Reports = () => {
  const { data: reports, isLoading, error } = useReports();
  const { toast } = useToast();
  const params = useParams();
  const [location, setLocation] = useLocation();
  const [projectData, setProjectData] = useState<any>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  
  // Extract projectId from URL params (if present)
  const projectId = params.id ? parseInt(params.id, 10) : undefined;
  
  // Fetch project details if projectId is present
  useEffect(() => {
    if (projectId) {
      const fetchProject = async () => {
        setProjectLoading(true);
        try {
          const response = await apiRequest('GET', `/api/projects/${projectId}`);
          const projectData = await response.json();
          setProjectData(projectData);
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to load project details",
            variant: "destructive"
          });
        } finally {
          setProjectLoading(false);
        }
      };
      
      fetchProject();
    }
  }, [projectId, toast]);
  
  if (error) {
    toast({
      title: "Error loading reports",
      description: "Failed to load your reports. Please try again.",
      variant: "destructive",
    });
  }
  
  return (
    <div className="p-4">
      {projectId && (
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-2"
            onClick={() => setLocation(`/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Project
          </Button>
          
          {projectLoading ? (
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
          ) : projectData ? (
            <h1 className="text-2xl font-medium mb-1">{projectData.name} Reports</h1>
          ) : null}
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[#455A64] mb-4">Generate Reports</h2>
        <ReportGenerators projectId={projectId} />
      </div>
      
      <div>
        <h3 className="text-md font-medium text-[#455A64] mb-3">
          {projectId ? "Project Reports" : "Recent Reports"}
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2962FF]"></div>
          </div>
        ) : (
          <ReportsList 
            reports={
              projectId 
                ? (reports || []).filter(report => report.projectId === projectId)
                : (reports || [])
            } 
          />
        )}
      </div>
    </div>
  );
};

export default Reports;
