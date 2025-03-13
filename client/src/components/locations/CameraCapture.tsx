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
        onCapture(imageSrc);
      }
    }
  };
  
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment",
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
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
      
      <div className="relative flex-1 bg-black">
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
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={videoConstraints}
            />
            
            {devices.length > 1 && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 p-2 rounded">
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
            
            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center">
              <button 
                onClick={handleCapture}
                className="bg-white rounded-full w-16 h-16 flex items-center justify-center"
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
