import { useState } from "react";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const isBarcodeScannerActive = location.includes("/scanner");
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {!isBarcodeScannerActive && <Header />}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      {!isBarcodeScannerActive && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;
