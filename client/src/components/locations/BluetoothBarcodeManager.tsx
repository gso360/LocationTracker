import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the context interface
interface BluetoothBarcodeContextType {
  isListening: boolean;
  startListening: (onScan: (barcode: string) => void) => void;
  stopListening: () => void;
}

// Create the context with a default value
const BluetoothBarcodeContext = createContext<BluetoothBarcodeContextType>({
  isListening: false,
  startListening: () => {},
  stopListening: () => {},
});

// Provider component
export const BluetoothBarcodeProvider = ({ children }: { children: ReactNode }) => {
  const [isListening, setIsListening] = useState(false);
  const [scanCallback, setScanCallback] = useState<((barcode: string) => void) | null>(null);
  const [buffer, setBuffer] = useState('');
  const [lastKeypressTime, setLastKeypressTime] = useState(0);
  
  // Define the timeout for considering it a scanner (faster than human typing)
  const SCANNER_INPUT_TIMEOUT = 50; // milliseconds
  
  // Handle key presses for barcode scanner
  useEffect(() => {
    if (!isListening || !scanCallback) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only if we're actively listening and not in an input field
      if (!isListening || (
          document.activeElement instanceof HTMLInputElement || 
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement instanceof HTMLSelectElement)) {
        return;
      }
      
      const now = Date.now();
      
      // If this is the first keypress or it's fast enough to be from a scanner
      if (buffer === '' || now - lastKeypressTime < SCANNER_INPUT_TIMEOUT) {
        // If Enter key, process the buffer as a complete barcode
        if (e.key === 'Enter' && buffer.length > 0) {
          if (scanCallback) {
            scanCallback(buffer.trim());
          }
          setBuffer('');
          e.preventDefault();
        } 
        // Otherwise add to buffer
        else if (e.key.length === 1) {
          setBuffer(prev => prev + e.key);
          setLastKeypressTime(now);
        }
      } 
      // If it's slow, likely human typing - reset buffer
      else if (now - lastKeypressTime > SCANNER_INPUT_TIMEOUT) {
        setBuffer(e.key.length === 1 ? e.key : '');
        setLastKeypressTime(now);
      }
    };
    
    // Cleanup for the current buffer if paused for too long
    const intervalId = setInterval(() => {
      if (buffer.length > 0 && Date.now() - lastKeypressTime > 500) {
        setBuffer('');
      }
    }, 1000);
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(intervalId);
    };
  }, [isListening, buffer, lastKeypressTime, scanCallback]);
  
  // Start listening for barcode scans
  const startListening = (onScan: (barcode: string) => void) => {
    setIsListening(true);
    setScanCallback(() => onScan);
    setBuffer('');
  };
  
  // Stop listening
  const stopListening = () => {
    setIsListening(false);
    setScanCallback(null);
    setBuffer('');
  };
  
  return (
    <BluetoothBarcodeContext.Provider
      value={{
        isListening,
        startListening,
        stopListening,
      }}
    >
      {children}
    </BluetoothBarcodeContext.Provider>
  );
};

// Custom hook to use the context
export const useBluetoothBarcode = () => useContext(BluetoothBarcodeContext);

// Barcode listener component (to enable listening in specific components)
interface BarcodeListenerProps {
  active?: boolean;
  onScan: (barcode: string) => void;
  children?: ReactNode;
}

export const BarcodeListener = ({ active = true, onScan, children }: BarcodeListenerProps) => {
  const { startListening, stopListening } = useBluetoothBarcode();
  
  useEffect(() => {
    if (active) {
      startListening(onScan);
    }
    
    return () => {
      if (active) {
        stopListening();
      }
    };
  }, [active, onScan, startListening, stopListening]);
  
  return <>{children}</>;
};

export default BluetoothBarcodeProvider;