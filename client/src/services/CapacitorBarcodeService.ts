import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Service for handling barcode scanning operations in a native Capacitor app
 * This uses the native camera and image analysis to scan barcodes
 */
export class CapacitorBarcodeService {
  /**
   * Take a photo and analyze it for barcodes using zxing library
   * @returns Promise<string|null> The scanned barcode value or null if not found
   */
  static async scanBarcode(): Promise<string | null> {
    if (!this.isNative()) return null;
    
    try {
      // Request camera permissions
      await this.requestPermissions();
      
      // Take a photo using native camera
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        promptLabelHeader: 'Scan Barcode',
        promptLabelCancel: 'Cancel',
        correctOrientation: true
      });
      
      if (!photo.base64String) return null;
      
      // Analyze the image for barcodes using zxing in the web layer
      const barcodeValue = await this.analyzeImageForBarcode(photo.base64String);
      return barcodeValue;
    } catch (error) {
      console.error('Error scanning barcode:', error);
      return null;
    }
  }
  
  /**
   * Analyze an image for barcodes using the zxing library
   * @param base64Image Base64 encoded image string
   * @returns Promise<string|null> The barcode value or null if not found
   */
  private static async analyzeImageForBarcode(base64Image: string): Promise<string | null> {
    try {
      // Dynamically import the zxing library
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      
      // Create an image element from the base64 string
      const img = new Image();
      img.src = `data:image/jpeg;base64,${base64Image}`;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Create a canvas to draw the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use zxing to decode the barcode
      const reader = new BrowserMultiFormatReader();
      
      // Create an HTMLImageElement for zxing to process
      const tmpImg = document.createElement('img');
      tmpImg.src = canvas.toDataURL('image/jpeg');
      
      await new Promise((resolve) => {
        tmpImg.onload = resolve;
      });
      
      try {
        const result = await reader.decodeFromImage(tmpImg);
        return result ? result.getText() : null;
      } catch (error) {
        console.log('No barcode found in image');
        return null;
      }
    } catch (error) {
      console.error('Error analyzing image for barcode:', error);
      return null;
    }
  }

  /**
   * Request camera permissions
   * @returns Promise<void>
   */
  static async requestPermissions(): Promise<void> {
    if (!this.isNative()) return;
    
    try {
      await Camera.requestPermissions();
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
    }
  }

  /**
   * Check if the app is running as a native app or web
   * @returns boolean True if running in a native environment
   */
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }
}