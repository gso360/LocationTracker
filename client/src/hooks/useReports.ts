import { useQuery } from "@tanstack/react-query";
import type { Report } from "@shared/schema";

export const useReports = () => {
  return useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });
};
