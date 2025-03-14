import { useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';

export default function MobileQRCode() {
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    // Get the hostname (which will be the Replit app URL)
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    let url: string;
    
    // Check if running on replit.com domain
    if (hostname.includes('replit.app') || hostname.includes('repl.co')) {
      url = `${protocol}//${hostname}`;
    } else {
      // For local development, include the port
      url = `${protocol}//${hostname}${port ? ':' + port : ''}`;
    }
    
    setIpAddress(url);
  }, []);
  
  const copyToClipboard = () => {
    if (ipAddress) {
      navigator.clipboard.writeText(ipAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (!ipAddress) {
    return null;
  }
  
  // Generate QR code URL using a free QR code API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ipAddress)}`;
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-w-xs">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <QrCode className="h-5 w-5 text-gray-700 mr-2" />
          <h3 className="font-medium text-gray-800">Test on Mobile</h3>
        </div>
        <button
          onClick={() => document.getElementById('mobile-qr')?.remove()}
          className="text-gray-400 hover:text-gray-600"
        >
          &times;
        </button>
      </div>
      
      <div className="bg-gray-50 p-2 rounded flex justify-center mb-2">
        <img 
          src={qrCodeUrl} 
          alt="QR Code for mobile testing" 
          className="h-40 w-40"
        />
      </div>
      
      <div className="text-xs text-gray-600 mb-2 text-center">
        Scan with your mobile device to test
      </div>
      
      <div className="flex items-center">
        <input
          type="text"
          readOnly
          value={ipAddress}
          className="text-xs p-1 border rounded flex-1 bg-gray-50"
        />
        <button
          onClick={copyToClipboard}
          className="ml-2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}