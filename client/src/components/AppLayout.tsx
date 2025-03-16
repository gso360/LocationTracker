import { useState } from "react";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Don't show navigation on scanner, login, or register pages
  const isBarcodeScannerActive = location.includes("/scanner");
  const isAuthPage = location === "/login" || location === "/register";
  
  // Determine when to show header and navigation
  const showHeader = !isBarcodeScannerActive;
  const showNavigation = !isBarcodeScannerActive && !isAuthPage && isAuthenticated;
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {showHeader && <Header />}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      {showNavigation && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;
