import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTour } from '@/contexts/TourContext';

/**
 * WelcomeTour component
 * 
 * This component automatically starts the welcome tour for first-time users
 * It only shows once and can be manually triggered again
 */
export default function WelcomeTour() {
  const { isAuthenticated, user } = useAuth();
  const { startTour, hasTakenTour } = useTour();
  
  // Check if user is logged in and hasn't taken the welcome tour
  useEffect(() => {
    if (isAuthenticated && user && !hasTakenTour('welcome')) {
      // Wait for the UI to fully render before starting the tour
      const timer = setTimeout(() => {
        startTour('welcome');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, startTour, hasTakenTour]);
  
  // This is a utility component that doesn't render anything
  return null;
}