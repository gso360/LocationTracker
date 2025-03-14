import { useLocation, Link } from "wouter";
import { MapPin, FileText, Plus } from "lucide-react";

const BottomNavigation = () => {
  const [location, setLocation] = useLocation();
  const isLocationsPage = location === "/" || location.includes("location") || location.includes("projects");
  const isReportsPage = location === "/reports";
  
  return (
    <nav className="bg-white border-t border-gray-200 p-3 bottom-nav">
      <div className="flex justify-around">
        <Link href="/" className={`p-2 flex flex-col items-center touch-target ${isLocationsPage ? 'text-[#2962FF]' : 'text-gray-500'}`}>
          <MapPin className="h-6 w-6" />
          <span className="text-xs mt-1">GroupIDs</span>
        </Link>
        <Link 
          href="/add-location" 
          className="bg-[#2962FF] text-white rounded-full w-14 h-14 flex items-center justify-center -mt-5 shadow-lg touch-target"
          aria-label="Add new location"
        >
          <Plus className="h-6 w-6" />
        </Link>
        <Link href="/reports" className={`p-2 flex flex-col items-center touch-target ${isReportsPage ? 'text-[#2962FF]' : 'text-gray-500'}`}>
          <FileText className="h-6 w-6" />
          <span className="text-xs mt-1">Reports</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavigation;
