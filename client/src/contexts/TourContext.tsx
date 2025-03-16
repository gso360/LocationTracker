import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ShepherdJourneyProvider } from 'react-shepherd';
import 'shepherd.js/dist/css/shepherd.css';

// Tour Context type definitions
interface TourContextProps {
  startTour: (tourName: string) => void;
  endTour: () => void;
  isTourActive: boolean;
  currentTour: string | null;
  hasTakenTour: (tourName: string) => boolean;
  markTourComplete: (tourName: string) => void;
}

const TourContext = createContext<TourContextProps>({
  startTour: () => {},
  endTour: () => {},
  isTourActive: false,
  currentTour: null,
  hasTakenTour: () => false,
  markTourComplete: () => {}
});

export const useTour = () => useContext(TourContext);

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  
  // Store completed tours in localStorage to avoid showing repeatedly
  const [completedTours, setCompletedTours] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completedTours');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Error loading completed tours from localStorage', err);
      return [];
    }
  });

  // Save completed tours to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('completedTours', JSON.stringify(completedTours));
    } catch (err) {
      console.error('Error saving completed tours to localStorage', err);
    }
  }, [completedTours]);

  // Check if a tour has been completed
  const hasTakenTour = (tourName: string): boolean => {
    return completedTours.includes(tourName);
  };

  // Mark a tour as completed
  const markTourComplete = (tourName: string) => {
    if (!hasTakenTour(tourName)) {
      setCompletedTours(prev => [...prev, tourName]);
    }
  };

  // Start a specific tour
  const startTour = (tourName: string) => {
    console.log(`Starting tour: ${tourName}`);
    setCurrentTour(tourName);
    setIsTourActive(true);
    // In a real implementation, we would start the actual tour here
  };

  // End the active tour
  const endTour = () => {
    console.log('Ending tour');
    setIsTourActive(false);
    setCurrentTour(null);
  };

  return (
    <ShepherdJourneyProvider>
      <TourContext.Provider
        value={{
          startTour,
          endTour,
          isTourActive,
          currentTour,
          hasTakenTour,
          markTourComplete
        }}
      >
        {children}
      </TourContext.Provider>
    </ShepherdJourneyProvider>
  );
};

export default TourContext;