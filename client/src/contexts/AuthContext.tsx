import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import offlineStorage from '@/services/OfflineStorageService';
import { useToast } from '@/hooks/use-toast';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOfflineMode: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isOfflineMode: false,
  login: async () => false,
  logout: async () => {},
  checkAuth: async () => false,
});

// Provider component that wraps your app and makes auth object available to any child component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Initialize offline storage when the provider is mounted
  useEffect(() => {
    const initOfflineStorage = async () => {
      try {
        await offlineStorage.init();
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
      }
    };
    
    initOfflineStorage();
    
    // Set up online/offline event listeners
    const handleOffline = () => {
      setIsOfflineMode(true);
      toast({
        title: "You're offline",
        description: "App will continue to work with limited functionality.",
        duration: 4000,
      });
    };
    
    const handleOnline = () => {
      setIsOfflineMode(false);
      toast({
        title: "You're back online",
        description: "Syncing your data...",
        duration: 3000,
      });
      
      // Trigger a sync when coming back online
      offlineStorage.attemptSync().then(success => {
        if (success) {
          toast({
            title: "Sync complete",
            description: "Your data has been synchronized with the server.",
            duration: 3000,
          });
        }
      });
    };
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Set initial offline state
    setIsOfflineMode(!navigator.onLine);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [toast]);

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  // Function to check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Try to get auth from server first
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        
        if (response.ok) {
          const userData = await response.json();
          
          // Save to offline storage for later use
          await offlineStorage.cacheAuthData(userData);
          
          setUser(userData);
          setIsAuthenticated(true);
          return true;
        }
      } catch (error) {
        // If we're offline or server error, try to use cached auth data
        if (!navigator.onLine) {
          const cachedUser = await offlineStorage.getCachedAuthData();
          
          if (cachedUser) {
            setUser(cachedUser);
            setIsAuthenticated(true);
            setIsOfflineMode(true);
            
            toast({
              title: "Offline mode",
              description: "Using cached login information. Some features may be limited.",
              duration: 4000,
            });
            
            return true;
          }
        }
      }
      
      // If we get here, no auth was found
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Store user data in offline storage for offline mode
        await offlineStorage.cacheAuthData(userData);
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // If we were previously in offline mode, attempt to sync
        if (isOfflineMode && navigator.onLine) {
          offlineStorage.attemptSync();
          setIsOfflineMode(false);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Save any pending changes before logging out
      if (await offlineStorage.hasPendingChanges()) {
        await offlineStorage.attemptSync();
      }
      
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear offline data
      await offlineStorage.clearOfflineData();
      
      setUser(null);
      setIsAuthenticated(false);
      setIsOfflineMode(false);
      navigate('/login');
    }
  };

  // Context provider with values
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isOfflineMode,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Higher-order component to ensure authentication
export function withAuth<P>(Component: React.ComponentType<P>) {
  const WithAuth = (props: any) => {
    const { isAuthenticated, isLoading } = useAuth();
    const [, navigate] = useLocation();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        navigate('/login');
      }
    }, [isLoading, isAuthenticated, navigate]);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2962FF]"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect in useEffect
    }

    return <Component {...props} />;
  };
  
  return WithAuth;
}