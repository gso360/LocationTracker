import { useQuery } from "@tanstack/react-query";
import type { Location, Barcode } from "@shared/schema";

export const useLocations = () => {
  return useQuery<(Location & { barcodes: Barcode[] })[]>({
    queryKey: ["/api/locations"],
  });
};

export const useLocation = (id: number | undefined) => {
  return useQuery<Location & { barcodes: Barcode[] }>({
    queryKey: [`/api/locations/${id}`],
    enabled: !!id,
  });
};
