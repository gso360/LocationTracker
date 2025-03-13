import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Menu, Search, MoreVertical } from "lucide-react";

const Header = () => {
  const [location, setLocation] = useLocation();
  const isReportsPage = location === "/reports";
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-gray-100 mr-2 md:hidden">
            <Menu className="h-5 w-5 text-[#455A64]" />
          </button>
          <h1 className="text-xl font-medium text-[#455A64]">Inventory Manager</h1>
        </div>
        <div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Search className="h-5 w-5 text-[#455A64]" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <MoreVertical className="h-5 w-5 text-[#455A64]" />
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <Link href="/">
          <a className={`px-4 py-2 font-medium ${!isReportsPage ? 'text-[#2962FF] border-b-2 border-[#2962FF]' : 'text-gray-500'}`}>
            Locations
          </a>
        </Link>
        <Link href="/reports">
          <a className={`px-4 py-2 font-medium ${isReportsPage ? 'text-[#2962FF] border-b-2 border-[#2962FF]' : 'text-gray-500'}`}>
            Reports
          </a>
        </Link>
      </div>
    </header>
  );
};

export default Header;
