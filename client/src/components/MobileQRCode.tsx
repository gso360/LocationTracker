import React, { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * MobileQRCode component
 * 
 * Displays a QR code for quickly accessing the application on mobile devices
 * Only visible on desktop screens
 */
export default function MobileQRCode() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Get the current URL to generate QR code
    const host = window.location.host;
    const protocol = window.location.protocol;
    setUrl(`${protocol}//${host}`);
  }, []);

  return (
    <>
      <div 
        className="bg-white rounded-full p-2 hover:bg-blue-50" 
        onClick={() => setOpen(true)}
        title="Scan to open on mobile"
        aria-label="Open QR code for mobile access"
      >
        <QrCode size={32} className="text-primary" />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan to open on mobile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-white p-2 rounded-lg">
              {url && (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`} 
                  alt="QR Code" 
                  width={200} 
                  height={200}
                />
              )}
            </div>
            <p className="text-sm text-center text-muted-foreground mt-4">
              Scan this QR code with your mobile device to open the application
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}