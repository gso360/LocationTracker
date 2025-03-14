import { useEffect, useRef, useState } from "react";
import { X, QrCode, Check, Bluetooth } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

// Component for barcode entry
const BarcodeInputForm = ({ onSubmit, onCancel }: { onSubmit: (value: string) => void, onCancel: () => void }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle form submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };
  
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

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    
    // Auto-submit if it looks like a scan from a bluetooth scanner
    // Bluetooth scanners typically append a return character
    if (e.target.value.endsWith('\n') || e.target.value.endsWith('\r')) {
      const cleanValue = e.target.value.replace(/[\r\n]/g, '').trim();
      if (cleanValue) {
        onSubmit(cleanValue);
      }
    }
  };
  
  // Listen for "Enter" key which is often sent by bluetooth scanners
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onSubmit(value.trim());
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b">
          <h3 className="font-medium">Enter or Scan Barcode</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <label htmlFor="barcodeInput" className="block text-sm font-medium text-gray-700 mb-1">
              Barcode Value
            </label>
            <input 
              type="text" 
              id="barcodeInput" 
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full p-2 border border-gray-300 rounded" 
              placeholder="Scan with bluetooth scanner or enter manually"
              inputMode={isMobileIOS ? "numeric" : "text"}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <p className="text-xs text-gray-500 mt-1">
              Connect your bluetooth scanner and scan a barcode, or enter the value manually
            </p>
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

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(true);
  
  const handleBarcodeEntry = (value: string) => {
    // Show success notification
    setLastScannedBarcode(value);
    setNotificationVisible(true);
    
    // Hide notification after 2 seconds
    setTimeout(() => {
      setNotificationVisible(false);
    }, 2000);
    
    // Pass the barcode to parent component
    onScan(value);
    
    // Hide the input form after scanning
    setShowBarcodeInput(false);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="bg-black text-white p-4 flex items-center">
        <button onClick={onClose} className="mr-2">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-medium">Scan Barcode</h2>
      </div>
      
      <div className="flex-1 relative">
        <div className="h-full flex flex-col items-center justify-center bg-gray-100 p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
            <Bluetooth className="h-16 w-16 text-[#2962FF] mx-auto mb-4" />
            
            <h3 className="text-xl font-medium mb-2">Bluetooth Barcode Scanner</h3>
            
            <p className="text-gray-600 mb-4">
              Connect your bluetooth scanner to this device and scan product barcodes.
            </p>
            
            {/* Recently scanned barcode notification */}
            {notificationVisible && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-[#00C853] mr-2 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-green-800">Barcode Scanned</p>
                    <p className="text-sm text-green-700">{lastScannedBarcode}</p>
                  </div>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setShowBarcodeInput(true)}
              className="bg-[#2962FF] text-white px-4 py-3 rounded-lg w-full font-medium flex items-center justify-center"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Enter or Scan Barcode
            </button>
            
            {lastScannedBarcode && (
              <div className="mt-4 border-t pt-4">
                <button
                  onClick={() => setShowBarcodeInput(true)}
                  className="text-[#2962FF] font-medium"
                >
                  Scan Another Barcode
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showBarcodeInput && (
        <BarcodeInputForm 
          onSubmit={handleBarcodeEntry} 
          onCancel={() => setShowBarcodeInput(false)} 
        />
      )}
    </div>
  );
};

export default BarcodeScanner;
