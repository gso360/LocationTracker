import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";
import Webcam from "react-webcam";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const webcamRef = useRef<Webcam>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        if (videoDevices.length > 0) {
          // Prefer rear-facing camera on mobile if available
          const rearCamera = videoDevices.find(device => {
            const label = device.label.toLowerCase();
            return label.includes('back') || label.includes('rear') || label.includes('environment');
          });
          
          setSelectedDeviceId(rearCamera?.deviceId || videoDevices[0].deviceId);
        } else {
          setError("No camera detected");
        }
      } catch (err) {
        setError("Failed to access camera");
      }
    };
    
    getDevices();
  }, []);
  
  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Optimize image before sending
        compressImage(imageSrc, 0.7, 1280)
          .then(compressedImage => {
            onCapture(compressedImage);
          })
          .catch(err => {
            console.error("Error compressing image:", err);
            // Fallback to original image if compression fails
            onCapture(imageSrc);
          });
      }
    }
  };
  
  // Function to compress image and reduce file size
  const compressImage = (
    imageSrc: string,
    quality: number,
    maxWidth: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw image to canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get compressed image data
        const compressedImage = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedImage);
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
      
      img.src = imageSrc;
    });
  };
  
  // iOS Safari works better with facingMode than deviceId
  const isMobileIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment",
    // Only use exact deviceId on non-iOS devices
    ...(selectedDeviceId && !isMobileIOS ? { deviceId: { exact: selectedDeviceId } } : {})
  };
  
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(e.target.value);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="bg-black text-white p-4 flex items-center">
        <button onClick={onCancel} className="mr-2">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-medium">Take Photo</h2>
      </div>
      
      <div className="relative flex-1 bg-black flex flex-col items-center justify-center">
        {error ? (
          <div className="h-full flex items-center justify-center text-white">
            <div className="text-center p-4">
              <p className="mb-4">{error}</p>
              <button 
                onClick={onCancel}
                className="bg-white text-black px-4 py-2 rounded"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Instructions */}
            <div className="text-white text-center mb-2 px-4">
              <p>Position the item within the frame</p>
            </div>
            
            {/* Camera container with viewfinder overlay */}
            <div className="relative w-full max-w-md aspect-[3/4] mx-auto">
              {/* Camera feed */}
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover rounded-lg"
                videoConstraints={videoConstraints}
              />
              
              {/* Viewfinder corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white opacity-70"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white opacity-70"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white opacity-70"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white opacity-70"></div>
            </div>
            
            {devices.length > 1 && !isMobileIOS && (
              <div className="mt-2 bg-black bg-opacity-50 p-2 rounded">
                <select 
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  className="text-white bg-transparent border border-white rounded px-2 py-1 text-sm"
                >
                  {devices.map((device, key) => (
                    <option value={device.deviceId} key={key}>
                      {device.label || `Camera ${key + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
              <button 
                onClick={handleCapture}
                className="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
              >
                <Camera className="h-8 w-8 text-black" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
