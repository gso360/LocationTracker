import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Menu, Search, MoreVertical } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  const isProjectsPage = location === "/" || location === "/projects" || location.startsWith("/projects/");
  const isLocationsPage = location === "/locations" || location === "/add-location" || location.startsWith("/edit-location");
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <Link href="/">
          <div className={`px-4 py-3 font-medium touch-target ${isProjectsPage ? 'text-[#2962FF] border-b-2 border-[#2962FF]' : 'text-gray-500'}`}>
            Projects
          </div>
        </Link>
        <Link href="/locations">
          <div className={`px-4 py-3 font-medium touch-target ${isLocationsPage ? 'text-[#2962FF] border-b-2 border-[#2962FF]' : 'text-gray-500'}`}>
            GroupIDs
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
