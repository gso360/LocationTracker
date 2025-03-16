import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [location] = useLocation();
  const isProjectsPage = location === "/" || location === "/projects" || location.startsWith("/projects/");
  const isLocationsPage = location === "/locations" || location === "/add-location" || location.startsWith("/edit-location");
  const { user, isAuthenticated, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  // Get the user's initials for the avatar
  const getUserInitials = () => {
    if (!user || !user.username) return "U";
    return user.username.charAt(0).toUpperCase();
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* User profile or login/register at top right */}
      <div className="flex justify-between items-center px-4 py-2">
        <h1 className="text-lg font-semibold">Inventory Manager</h1>
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.username || 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Register</Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <Link href="/projects">
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
