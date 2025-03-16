import { useLocation, Link } from "wouter";
import { Plus } from "lucide-react";

const BottomNavigation = () => {
  return (
    <nav className="bg-white border-t border-gray-200 p-3 bottom-nav">
      <div className="flex justify-center">
        <Link 
          href="/add-location" 
          className="bg-[#2962FF] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg touch-target"
          aria-label="Add new location"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavigation;