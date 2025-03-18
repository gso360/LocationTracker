import { useState, useEffect } from "react";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "./PageTransition";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isIOS, setIsIOS] = useState(false);
  
  // Don't show navigation on scanner, login, or register pages
  const isBarcodeScannerActive = location.includes("/scanner");
  const isAuthPage = location === "/login" || location === "/register";
  
  // Determine when to show header and navigation
  const showHeader = !isBarcodeScannerActive;
  const showNavigation = !isBarcodeScannerActive && !isAuthPage && isAuthenticated;
  
  // Detect iOS platform on mount
  useEffect(() => {
    // Check if we're running in Capacitor native environment
    const isNativeApp = window.Capacitor?.isNative === true;
    // Check if we're on iOS specifically
    const isIOSDevice = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (window.Capacitor?.getPlatform?.() === 'ios') ||
      (window.CapacitorCustomPlatform?.name === 'ios');
    
    // Determine if we're on iOS native
    const isIOSNative = isNativeApp && isIOSDevice;
    setIsIOS(isIOSNative);
    
    // Apply iOS-specific body classes if needed
    
    if (isIOSNative) {
      document.body.classList.add('ios-device');
    }
    
    return () => {
      document.body.classList.remove('ios-device');
    };
  }, []);
  
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {showHeader && <Header />}
      <main className="flex-1 overflow-hidden relative">
        <PageTransition 
          className="absolute inset-0 overflow-auto" 
          duration={isIOS ? 280 : 220} // Slightly longer animation for iOS for better feel
        >
          {children}
        </PageTransition>
      </main>
      {showNavigation && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;
