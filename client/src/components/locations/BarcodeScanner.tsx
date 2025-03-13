import { useEffect, useRef, useState } from "react";
import { X, QrCode, Check } from "lucide-react";
import { BrowserBarcodeReader } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

// Component for manual barcode entry
const ManualBarcodeEntry = ({ onSubmit, onCancel }: { onSubmit: (value: string) => void, onCancel: () => void }) => {
  const [value, setValue] = useState('');
  
  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b">
          <h3 className="font-medium">Enter Barcode Manually</h3>
        </div>
        <div className="p-4">
          <label htmlFor="manualBarcodeInput" className="block text-sm font-medium text-gray-700 mb-1">
            Barcode Value
          </label>
          <input 
            type="text" 
            id="manualBarcodeInput" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded" 
            placeholder="Enter barcode number"
            autoFocus
          />
        </div>
        <div className="p-4 flex justify-end space-x-2 border-t">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-700"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#2962FF] text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  
  useEffect(() => {
    let codeReader: BrowserBarcodeReader | null = null;
    
    const startScanner = async () => {
      try {
        codeReader = new BrowserBarcodeReader();
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setCameraError("No camera detected");
          return;
        }
        
        // Prefer rear-facing camera on mobile if available
        let selectedDeviceId = videoInputDevices[0].deviceId;
        for (const device of videoInputDevices) {
          if (device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') || 
              device.label.toLowerCase().includes('environment')) {
            selectedDeviceId = device.deviceId;
            break;
          }
        }
        
        // Start continuous scanning
        await codeReader.decodeFromVideoDevice(
          selectedDeviceId, 
          videoRef.current!, 
          (result, error, controls) => {
            if (result && result.getText()) {
              const barcodeValue = result.getText();
              
              // Show notification
              setLastScannedBarcode(barcodeValue);
              setNotificationVisible(true);
              
              // Hide notification after 2 seconds
              setTimeout(() => {
                setNotificationVisible(false);
              }, 2000);
              
              // Pass the barcode to parent component
              onScan(barcodeValue);
            }
            
            if (error && !(error instanceof TypeError)) {
              // Ignoring TypeErrors as they are common during initialization
              console.error('Barcode scanning error:', error);
            }
          }
        );
      } catch (err) {
        console.error('Failed to start barcode scanner:', err);
        setCameraError("Failed to access camera");
      }
    };
    
    startScanner();
    
    // Cleanup
    return () => {
      if (codeReader) {
        codeReader.reset();
      }
    };
  }, [onScan]);
  
  const handleManualEntry = (value: string) => {
    onScan(value);
    setShowManualEntry(false);
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
        {cameraError ? (
          <div className="h-full flex items-center justify-center bg-black text-white">
            <div className="text-center p-4">
              <p className="mb-4">{cameraError}</p>
              <button 
                onClick={() => setShowManualEntry(true)}
                className="bg-white text-black px-4 py-2 rounded mb-2 w-full"
              >
                Enter Barcode Manually
              </button>
              <button 
                onClick={onClose}
                className="border border-white text-white px-4 py-2 rounded w-full"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="h-full">
              <video ref={videoRef} className="h-full w-full object-cover" />
              
              {/* Scanner overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="p-4 bg-gradient-to-b from-black to-transparent">
                  <p className="text-white text-sm">Position barcode within the frame</p>
                </div>
                
                {/* Scanner target area */}
                <div className="flex items-center justify-center h-full">
                  <div className="w-64 h-32 border-2 border-[#2962FF] rounded-lg"></div>
                </div>
                
                <div className="p-4 bg-gradient-to-t from-black to-transparent absolute bottom-0 left-0 right-0">
                  {/* Recently scanned barcode notification */}
                  {notificationVisible && (
                    <div className="bg-black bg-opacity-50 rounded-lg p-2 mb-2">
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-[#00C853] mr-2" />
                        <div className="text-white">
                          <p className="font-medium">Barcode Scanned</p>
                          <p className="text-xs">{lastScannedBarcode}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setShowManualEntry(true)}
                    className="bg-white text-[#2962FF] px-4 py-2 rounded-full text-sm w-full"
                  >
                    Enter Barcode Manually
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {showManualEntry && (
        <ManualBarcodeEntry 
          onSubmit={handleManualEntry} 
          onCancel={() => setShowManualEntry(false)} 
        />
      )}
    </div>
  );
};

export default BarcodeScanner;
