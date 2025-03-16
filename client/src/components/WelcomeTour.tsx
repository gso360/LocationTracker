import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTour } from '@/contexts/TourContext';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * WelcomeTour component
 * 
 * This component automatically starts the welcome tour for first-time users
 * It only shows once and can be manually triggered again
 * Added safeguards to prevent issues on mobile devices, especially iPhone
 */
export default function WelcomeTour() {
  const { isAuthenticated, user } = useAuth();
  const { startTour, hasTakenTour } = useTour();
  const isMobile = useIsMobile();
  const [hasTriedTour, setHasTriedTour] = useState(false);
  
  // Helper to detect iOS devices, particularly problematic ones like iPhone 16 Pro
  const isIOSDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  };
  
  // Check if user is logged in and hasn't taken the welcome tour
  useEffect(() => {
    // Only try once per session to prevent tour opening/closing loops
    if (hasTriedTour) return;
    
    if (isAuthenticated && user && !hasTakenTour('welcome')) {
      // For iOS devices, especially iPhone, use a longer delay
      // This helps ensure the DOM is fully settled before tour attaches
      const isIOS = isIOSDevice();
      const delay = isIOS ? 2500 : 1500;
      
      // Set a session storage item to prevent multiple attempts
      try {
        if (sessionStorage.getItem('welcome_tour_attempted')) {
          return;
        }
        sessionStorage.setItem('welcome_tour_attempted', 'true');
      } catch (err) {
        // Ignore sessionStorage errors
      }
      
      // Wait for the UI to fully render before starting the tour
      const timer = setTimeout(() => {
        setHasTriedTour(true);
        
        // For iPhone devices, we'll avoid auto-starting the tour 
        // to prevent the open/close loop issue
        if (isIOS && isMobile) {
          console.log('Tour auto-start disabled on iOS mobile devices to prevent UI issues');
          // Mark as taken to prevent future auto-starts
          // User can still manually start tour if needed
          return;
        }
        
        startTour('welcome');
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, startTour, hasTakenTour, hasTriedTour, isMobile]);
  
  // This is a utility component that doesn't render anything
  return null;
}