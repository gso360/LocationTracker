import LocationCard from "./LocationCard";
import type { Location } from "@shared/schema";

interface LocationListProps {
  locations: (Location & { barcodes: any[] })[];
}

const LocationList: React.FC<LocationListProps> = ({ locations }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 location-list">
      {locations.map((location) => (
        <LocationCard 
          key={location.id} 
          location={location} 
        />
      ))}
    </div>
  );
};

export default LocationList;
