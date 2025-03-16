import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

/**
 * Service for handling camera operations using Capacitor's Camera API
 * This provides native camera access on iOS when built as a native app
 */
export class CapacitorCameraService {
  /**
   * Take a photo using the device camera
   * @returns Promise with the captured photo as a base64 string
   */
  static async takePhoto(): Promise<string> {
    // Request camera permissions
    await this.requestPermissions();
    
    try {
      // Capture the photo
      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true,
        width: 1024,
        height: 1024
      });
      
      // Return the base64 string
      if (photo.base64String) {
        return `data:image/jpeg;base64,${photo.base64String}`;
      } else {
        throw new Error('Failed to get base64 string from photo');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }
  
  /**
   * Request camera permissions from the user
   */
  static async requestPermissions(): Promise<void> {
    try {
      const permissionState = await Camera.checkPermissions();
      
      if (permissionState.camera !== 'granted') {
        await Camera.requestPermissions({ permissions: ['camera'] });
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }
  
  /**
   * Check if the app is running as a native app or web
   * @returns boolean True if running in a native environment
   */
  static isNative(): boolean {
    return typeof window !== 'undefined' && 
           window.Capacitor !== undefined && 
           window.Capacitor.isNative === true;
  }
}