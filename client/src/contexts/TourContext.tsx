import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
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
  'welcome': {
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
        id: 'app-welcome',
        title: 'Welcome to the Inventory App! 👋',
        text: 'This guided tour will help you get started with our powerful inventory management system. Follow along to learn how to create projects, add locations, and scan barcodes.',
        buttons: [
          {
            text: 'Skip Tour',
            type: 'cancel',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Start Tour',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'app-overview',
        title: 'App Overview',
        text: 'The app helps you manage showroom inventory efficiently. You\'ll create projects for different showrooms, add locations within each project, and scan barcodes to track inventory items.',
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
        id: 'navigation',
        title: 'Navigation',
        text: 'Use the navigation menu to access your projects, locations, and reports. The + button is your quick action for adding new items.',
        attachTo: {
          element: 'nav',
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
        id: 'lets-start',
        title: 'Let\'s Get Started!',
        text: 'Now let\'s create your first project and learn how to use the app\'s features.',
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Continue',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      }
    ]
  },
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
        id: 'projects-intro',
        title: 'Projects Dashboard',
        text: 'This is your projects dashboard where you can manage all your showroom inventory projects.',
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
        text: 'Click here to create a new project for your showroom inventory. Each project represents a different showroom or inventory collection.',
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
        text: 'Here you can see all your existing projects and their status. Projects can be "In Progress" or "Completed".',
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
            text: 'Next',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'project-completion',
        title: 'Project Workflow',
        text: 'The typical workflow is: 1) Create a project, 2) Add locations/GroupIDs, 3) Scan barcodes for each location, 4) Submit your project when complete.',
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Finish Tour',
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
        title: 'GroupID Management',
        text: 'This is where you can see and manage all GroupIDs (locations) for your project. Each GroupID represents a specific location in your showroom.',
        buttons: [
          {
            text: 'Skip Tour',
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
        title: 'Add a GroupID',
        text: 'Click here to add a new GroupID to your project. Each GroupID should correspond to a physical location in your showroom.',
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
            text: 'Next',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'location-cards',
        title: 'GroupID Cards',
        text: 'Each card represents a location you\'ve added. You can see the location name, photo, and how many barcodes have been scanned.',
        attachTo: {
          element: '.location-list',
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
        id: 'submit-project',
        title: 'Submit Project',
        text: 'When you\'ve added all GroupIDs and scanned all barcodes, you can submit your project for reporting and analysis.',
        attachTo: {
          element: '.submit-project-button',
          on: 'bottom'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Finish Tour',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      }
    ]
  },
  'add-location-detail': {
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
        id: 'add-location-intro',
        title: 'Adding a GroupID',
        text: 'This is where you can add details for a new GroupID (location). The system automatically assigns a sequential ID number.',
        buttons: [
          {
            text: 'Skip Tour',
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
        id: 'project-dropdown',
        title: 'Select Project',
        text: 'If needed, you can switch between different projects using this dropdown menu.',
        attachTo: {
          element: '.project-dropdown',
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
        id: 'location-photo',
        title: 'Capture Photo',
        text: 'Click here to take a photo of the location. This helps identify the physical location in the showroom.',
        attachTo: {
          element: '.photo-capture-button',
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
        id: 'scan-barcodes',
        title: 'Scan Barcodes',
        text: 'After capturing a photo, click here to start scanning barcodes for this location.',
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
        id: 'save-location',
        title: 'Save GroupID',
        text: 'After adding all details, click Save to store this GroupID. You\'ll be guided to add barcodes next.',
        attachTo: {
          element: '.save-location-button',
          on: 'top'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Finish Tour',
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
        text: 'Now you can scan barcodes for this location. Position barcodes within the camera frame to scan them automatically.',
        buttons: [
          {
            text: 'Skip Tour',
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
        id: 'camera-viewfinder',
        title: 'Camera Viewfinder',
        text: 'Position barcodes within these markers for best scanning results. The system works with most standard barcode formats.',
        attachTo: {
          element: '.scanner-viewfinder',
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
        id: 'scanned-list',
        title: 'Scanned Items',
        text: 'Scanned barcodes appear here. The system automatically prevents duplicate scans and saves your progress.',
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
            text: 'Next',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'finish-scanning',
        title: 'Finishing Up',
        text: 'When you\'ve scanned all items, click here to save and move to the next step. You\'ll see options to add another GroupID or finish your project.',
        attachTo: {
          element: '.finish-scanning-button',
          on: 'top'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Finish Tour',
            type: 'next',
            classes: 'shepherd-button-primary'
          }
        ]
      }
    ]
  },
  'reports': {
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
        id: 'reports-welcome',
        title: 'Reports & Analytics',
        text: 'This is your reports dashboard where you can generate and view analytical data from your projects.',
        buttons: [
          {
            text: 'Skip Tour',
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
        id: 'generate-report',
        title: 'Generate Reports',
        text: 'Click here to generate different types of reports from your project data, including Excel and PDF formats.',
        attachTo: {
          element: '.generate-report-button',
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
        id: 'report-list',
        title: 'Report History',
        text: 'Previously generated reports appear here. You can download or view them again at any time.',
        attachTo: {
          element: '.report-list',
          on: 'top'
        },
        buttons: [
          {
            text: 'Back',
            type: 'back',
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Finish Tour',
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