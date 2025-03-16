import { useCallback, useEffect, useRef, useState } from "react";
import { X, QrCode, Check, Bluetooth, ListChecks } from "lucide-react";
import { useBluetoothBarcode, BarcodeListener } from "./BluetoothBarcodeManager";

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
  existingBarcodes?: string[]; // Optional array of existing barcodes
}

// Component for continuous barcode scanning
const BarcodeScanForm = ({ 
  onSubmit, 
  onDone, 
  onCancel,
  existingBarcodes = [],
  onShowManualEntry,
  scannedCount = 0
}: { 
  onSubmit: (value: string) => void, 
  onDone: () => void,
  onCancel: () => void,
  existingBarcodes?: string[],
  onShowManualEntry?: () => void,
  scannedCount?: number
}) => {
  const [value, setValue] = useState('');
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [lastDuplicate, setLastDuplicate] = useState<string | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // iOS keyboard optimization - detect if iOS and ensure proper focus behavior
  const isMobileIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  useEffect(() => {
    // Delay focus slightly to ensure modal is fully rendered
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        
        // For iOS, also try to position the cursor at the end
        if (isMobileIOS) {
          const length = inputRef.current.value.length;
          inputRef.current.selectionStart = length;
          inputRef.current.selectionEnd = length;
        }
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [isMobileIOS]);

  // Handle manual submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (value.trim()) {
      processBarcode(value.trim());
    }
  };

  // Process a scanned or entered barcode
  const processBarcode = (barcode: string) => {
    // Check if barcode already exists in our current scanning session
    // or in the existing barcodes for this specific GroupID
    const isDuplicate = scannedCodes.includes(barcode) || existingBarcodes.includes(barcode);
    
    if (isDuplicate) {
      // Show duplicate warning
      setLastDuplicate(barcode);
      setShowDuplicateWarning(true);
      
      // Auto-hide warning after 2 seconds
      setTimeout(() => {
        setShowDuplicateWarning(false);
      }, 2000);
    } else {
      // Add to our local list of scanned codes
      setScannedCodes(prev => [...prev, barcode]);
      
      // Pass to parent component
      onSubmit(barcode);
    }
    
    // Always clear input field after scan for next barcode
    setValue('');
    
    // Refocus the input for the next scan
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    
    // Auto-submit if it looks like a scan from a bluetooth scanner
    // Bluetooth scanners typically append a return character
    if (e.target.value.endsWith('\n') || e.target.value.endsWith('\r')) {
      const cleanValue = e.target.value.replace(/[\r\n]/g, '').trim();
      if (cleanValue) {
        processBarcode(cleanValue);
      }
    }
  };
  
  // Listen for "Enter" key which is often sent by bluetooth scanners
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      processBarcode(value.trim());
    }
  };
  
  // Combine all scanned codes for display
  const totalScannedCount = scannedCount + scannedCodes.length;
  
  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="bg-white w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium">Scan Multiple Barcodes</h3>
          <div className="text-sm text-gray-500">
            {totalScannedCount} scanned
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <label htmlFor="barcodeInput" className="block text-sm font-medium text-gray-700 mb-1">
              Barcode Scanner Input
            </label>
            <input 
              type="text" 
              id="barcodeInput" 
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full p-2 border border-gray-300 rounded" 
              placeholder="Scan with bluetooth scanner"
              inputMode={isMobileIOS ? "numeric" : "text"}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <p className="text-xs text-gray-500 mt-1">
              Scanned barcodes will appear below. Continue scanning multiple barcodes without interruption.
            </p>
            
            {/* Manual entry button - appears directly below the scanner input */}
            <button 
              type="button"
              onClick={onShowManualEntry}
              className="mt-4 bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg w-full font-medium flex items-center justify-center"
            >
              Manual Entry
            </button>
            
            {/* Duplicate warning */}
            {showDuplicateWarning && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800 flex items-start">
                <div className="flex-shrink-0 mr-2 mt-0.5">⚠️</div>
                <div>
                  Duplicate for this GroupID: <span className="font-medium">{lastDuplicate}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Recently scanned barcodes */}
          {(scannedCodes.length > 0 || totalScannedCount > 0) && (
            <div className="px-4 pb-2">
              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ListChecks className="h-4 w-4 mr-1" />
                Recent Scans
              </div>
              <div className="max-h-40 overflow-y-auto border rounded">
                {scannedCodes.slice().reverse().map((code, idx) => (
                  <div key={idx} className="p-2 border-b last:border-b-0 flex items-center">
                    <Check className="h-4 w-4 text-[#00C853] mr-2" />
                    <span className="text-sm">{code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-4 flex justify-between items-center border-t">
            <button 
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={onDone}
              className="px-4 py-2 bg-[#00C853] text-white rounded min-h-[44px]"
            >
              Done Scanning
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Component for manual barcode entry
const ManualBarcodeEntry = ({ 
  onSubmit, 
  onCancel,
  existingBarcodes = []
}: { 
  onSubmit: (value: string) => void, 
  onCancel: () => void,
  existingBarcodes?: string[]
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // iOS keyboard optimization
  const isMobileIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!value.trim()) {
      return;
    }
    
    // Check for duplicates within this specific GroupID
    if (existingBarcodes.includes(value.trim())) {
      setError("This barcode has already been added to this GroupID.");
      return;
    }
    
    onSubmit(value.trim());
    onCancel();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b">
          <h3 className="font-medium">Enter Barcode Manually</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <label htmlFor="manualBarcodeInput" className="block text-sm font-medium text-gray-700 mb-1">
              Barcode Value
            </label>
            <input 
              type="text" 
              id="manualBarcodeInput" 
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter barcode number"
              inputMode={isMobileIOS ? "numeric" : "text"}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          
          <div className="p-4 flex justify-end space-x-2 border-t">
            <button 
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-[#2962FF] text-white rounded min-h-[44px]"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, existingBarcodes = [] }) => {
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(true); // Start with barcode input shown
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const { startListening, stopListening } = useBluetoothBarcode();
  
  // Handle barcode entry from continuous scanner - use useCallback to prevent infinite loops
  const handleBarcodeEntry = useCallback((value: string) => {
    // Prevent processing duplicates
    if (existingBarcodes.includes(value)) {
      // Show duplicate notification
      setLastScannedBarcode(value);
      setNotificationVisible(true);
      
      // Hide notification after 2 seconds
      setTimeout(() => {
        setNotificationVisible(false);
      }, 2000);
      return;
    }
    
    // Show success notification
    setLastScannedBarcode(value);
    setNotificationVisible(true);
    setScannedCount(prev => prev + 1);
    
    // Hide notification after 2 seconds
    setTimeout(() => {
      setNotificationVisible(false);
    }, 2000);
    
    // Pass the barcode to parent component
    onScan(value);
  }, [existingBarcodes, onScan]);
  
  // Start listening when in barcode scanning mode
  // Using a ref to store the handler to prevent infinite loop with useEffect
  const handleBarcodeEntryRef = useRef(handleBarcodeEntry);
  
  // Update the ref value when the callback changes
  useEffect(() => {
    handleBarcodeEntryRef.current = handleBarcodeEntry;
  }, [handleBarcodeEntry]);
  
  useEffect(() => {
    if (showBarcodeInput) {
      // Use the ref's current value instead of the callback directly
      startListening((barcode: string) => handleBarcodeEntryRef.current(barcode));
    } else {
      stopListening();
    }
    
    return () => {
      stopListening();
    };
  }, [showBarcodeInput, startListening, stopListening]);
  
  return (
    <div className="h-full flex flex-col">
      <div className="bg-black text-white p-4 flex items-center">
        <button onClick={onClose} className="mr-2">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-medium">Scan Barcodes</h2>
      </div>
      
      {/* Always show the barcode input form since showBarcodeInput is true by default */}
      <BarcodeScanForm 
        onSubmit={handleBarcodeEntry}
        onDone={onClose}
        onCancel={() => setShowBarcodeInput(false)}
        existingBarcodes={existingBarcodes}
        onShowManualEntry={() => setShowManualEntry(true)}
        scannedCount={scannedCount}
      />
      
      {showManualEntry && (
        <ManualBarcodeEntry 
          onSubmit={handleBarcodeEntry}
          onCancel={() => setShowManualEntry(false)}
          existingBarcodes={existingBarcodes}
        />
      )}
    </div>
  );
};

export default BarcodeScanner;
