import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo } from 'react';
import { ShepherdJourneyProvider, useShepherd } from 'react-shepherd';
import { useLocation } from 'wouter';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import '../styles/tour.css';

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

// Tour step configuration
interface TourStepConfig {
  id: string;
  title: string;
  text: string;
  attachTo?: {
    element: string;
    on: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  };
  buttons?: {
    text: string;
    type: 'back' | 'next' | 'cancel';
    classes?: string;
    action?: () => void;
  }[];
  beforeShowPromise?: () => Promise<void>;
  when?: {
    show?: () => void;
    hide?: () => void;
  };
  canClickTarget?: boolean;
  highlightClass?: string;
  scrollTo?: boolean;
  modalOverlayOpeningPadding?: number;
}

interface TourConfig {
  [key: string]: {
    defaultStepOptions: {
      classes: string;
      scrollTo: boolean;
      cancelIcon: {
        enabled: boolean;
      };
      modalOverlayOpeningRadius?: number;
    };
    exitOnEsc?: boolean;
    useModalOverlay?: boolean;
    steps: TourStepConfig[];
  };
}

// Create a component to handle the tour logic
const TourManager: React.FC = () => {
  const [, navigate] = useLocation();
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const tourContext = useContext(TourContext);
  const shepherd = useShepherd();

  // Start a tour when currentTour changes
  useEffect(() => {
    if (currentTour && tourContext.isTourActive) {
      const tourConfig = tourConfigs[currentTour];
      
      if (tourConfig && shepherd) {
        // No need to cancel existing tour since ShepherdJourneyProvider handles this
        
        // Set default options
        const tour = new Shepherd.Tour({
          defaultStepOptions: {
            ...tourConfig.defaultStepOptions,
            cancelIcon: {
              enabled: true
            }
          },
          useModalOverlay: tourConfig.useModalOverlay || true
        });

        // Add steps
        tourConfig.steps.forEach((step) => {
          tour.addStep({
            id: step.id,
            title: step.title,
            text: step.text,
            attachTo: step.attachTo,
            buttons: step.buttons?.map(button => ({
              text: button.text,
              action: button.action || 
                (button.type === 'next' ? () => tour.next() : 
                 button.type === 'back' ? () => tour.back() : 
                 () => {
                   tour.cancel();
                   tourContext.endTour();
                 }),
              classes: button.classes || 'shepherd-button-secondary'
            })),
            scrollTo: step.scrollTo || tourConfig.defaultStepOptions.scrollTo,
            canClickTarget: step.canClickTarget,
            highlightClass: step.highlightClass,
            when: step.when
          });
        });

        // Handle tour completion
        tour.on('complete', () => {
          tourContext.markTourComplete(currentTour);
          tourContext.endTour();
        });

        tour.on('cancel', () => {
          tourContext.endTour();
        });

        // Start the tour
        tour.start();

        return () => {
          tour.cancel();
        };
      }
    }
  }, [currentTour, tourContext.isTourActive, shepherd]);

  // Update the currentTour when tourContext changes
  useEffect(() => {
    setCurrentTour(tourContext.currentTour);
  }, [tourContext.currentTour]);

  return null;
};

// Tour configurations
const tourConfigs: TourConfig = {
  'projects': {
    defaultStepOptions: {
      classes: 'shepherd-theme-custom',
      scrollTo: true,
      cancelIcon: {
        enabled: true
      },
      modalOverlayOpeningRadius: 10
    },
    exitOnEsc: true,
    useModalOverlay: true,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to the Inventory App!',
        text: 'This quick tour will show you how to use the application to manage your showroom inventory.',
        buttons: [
          {
            text: 'Skip',
            type: 'cancel',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Next',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'create-project',
        title: 'Create a Project',
        text: 'Start by creating a new project for your showroom inventory.',
        attachTo: {
          element: '.create-project-button',
          on: 'bottom'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Next',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ],
        highlightClass: 'highlight-element'
      },
      {
        id: 'project-list',
        title: 'Your Projects',
        text: 'Here you can see all your existing projects and their status.',
        attachTo: {
          element: '.projects-list',
          on: 'top'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Next',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'project-actions',
        title: 'Project Actions',
        text: 'You can edit, delete, or mark projects as complete. When you\'re ready to add locations, click on "Create GroupIDs".',
        attachTo: {
          element: '.projects-list > :first-child',
          on: 'bottom'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Finish',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      }
    ]
  },
  'locations': {
    defaultStepOptions: {
      classes: 'shepherd-theme-custom',
      scrollTo: true,
      cancelIcon: {
        enabled: true
      }
    },
    exitOnEsc: true,
    useModalOverlay: true,
    steps: [
      {
        id: 'locations-welcome',
        title: 'Manage Locations',
        text: 'This is where you can add and manage locations (GroupIDs) for your project.',
        buttons: [
          {
            text: 'Skip',
            type: 'cancel',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Next',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'add-location',
        title: 'Add a Location',
        text: 'Click here to add a new location to your project.',
        attachTo: {
          element: '.add-location-button',
          on: 'bottom'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Finish',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      }
    ]
  },
  'scanning': {
    defaultStepOptions: {
      classes: 'shepherd-theme-custom',
      scrollTo: true,
      cancelIcon: {
        enabled: true
      }
    },
    exitOnEsc: true,
    useModalOverlay: true,
    steps: [
      {
        id: 'barcode-welcome',
        title: 'Barcode Scanning',
        text: 'Now you can scan barcodes for this location.',
        buttons: [
          {
            text: 'Skip',
            type: 'cancel',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Next',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'scan-button',
        title: 'Start Scanning',
        text: 'Click here to activate the camera and scan barcodes.',
        attachTo: {
          element: '.scan-button',
          on: 'bottom'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Next',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'barcode-list',
        title: 'Scanned Barcodes',
        text: 'Your scanned barcodes will appear here. You can remove items if needed.',
        attachTo: {
          element: '.barcode-list',
          on: 'top'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Finish',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      }
    ]
  }
};

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
        <TourManager />
        {children}
      </TourContext.Provider>
    </ShepherdJourneyProvider>
  );
};

export default TourContext;