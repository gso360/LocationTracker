# iOS Native Features Guide

This document explains the iOS-specific features implemented in the Showroom Manager application and how to use them effectively.

## iOS Native Integrations

The application leverages Capacitor plugins to provide native iOS functionality while maintaining cross-platform compatibility.

### Camera Integration

The app uses the Capacitor Camera plugin for taking location photos.

#### Implementation Details

- The `CapacitorCameraService` handles photo capture through the native camera
- Photos are processed and stored as base64 strings for cross-platform compatibility
- Privacy permissions are automatically requested when the camera is first used

```typescript
// Example usage:
import { CapacitorCameraService } from '@/services/CapacitorCameraService';

// Request permissions first
await CapacitorCameraService.requestPermissions();

// Take a photo and get result as base64 string
const imageData = await CapacitorCameraService.takePhoto();
```

#### Camera Configuration

The following camera options are configured in `capacitor.config.ts`:

- Photos are taken at 90% quality for high-resolution location images
- Photos are not automatically saved to the device gallery (saveToGallery: false)
- The camera interface uses fullscreen presentation style
- Images are resized to 1024x1024 pixels to maintain consistent storage requirements

### Barcode Scanning

The app implements barcode scanning through the native camera when running as an iOS app.

#### Implementation Details

- The `CapacitorBarcodeService` handles barcode scanning through the native camera
- Barcode detection uses the ZXing library through `BrowserMultiFormatReader`
- The process involves taking a photo with the native camera and then analyzing it for barcodes
- The implementation handles all necessary image processing (creating canvas, drawing image, extracting data)

```typescript
// Example usage:
import { CapacitorBarcodeService } from '@/services/CapacitorBarcodeService';

// Request permissions first
await CapacitorBarcodeService.requestPermissions();

// Scan a barcode and get the value
const barcodeValue = await CapacitorBarcodeService.scanBarcode();
```

### Bluetooth Connectivity

The application supports external Bluetooth barcode scanners for more efficient barcode capture.

#### Implementation Details

- The `BluetoothBarcodeProvider` manages Bluetooth scanner connectivity
- Scanners are detected as HID (Human Interface Device) keyboard inputs
- Barcode input is captured and processed in real-time

```typescript
// Example usage:
import { useBluetoothBarcode, BarcodeListener } from '@/components/locations/BluetoothBarcodeManager';

// In a component
const { isListening, startListening, stopListening } = useBluetoothBarcode();

// Start listening for barcode scans
startListening((barcode) => {
  console.log('Scanned barcode:', barcode);
  // Process barcode...
});

// Or use the BarcodeListener component
<BarcodeListener 
  active={true} 
  onScan={(barcode) => processBarcode(barcode)}
>
  {/* Child components */}
</BarcodeListener>
```

### Deep Linking

The app supports deep linking to allow opening specific pages from external sources.

#### Implementation Details

- The app uses a custom URL scheme defined in `capacitor.config.ts`
- Links using the `app://` scheme can be handled by the application
- Route handling is managed through the app's router

### Offline Support

The application implements robust offline support for field use.

#### Implementation Details

- The `OfflineStorageService` manages data persistence when offline
- IndexedDB is used for storing location data, photos, and barcodes
- Data is automatically synchronized when the device regains connectivity

```typescript
// Example offline storage usage:
import { offlineStorage } from '@/services/OfflineStorageService';

// Save location data offline
const locationId = await offlineStorage.saveLocation({
  name: 'New Location',
  projectId: 123,
  // other location data...
});

// Save barcode data offline
const barcodeId = await offlineStorage.saveBarcode({
  value: '123456789',
  locationId: locationId,
  // other barcode data...
});

// Check for pending changes
const hasPendingChanges = await offlineStorage.hasPendingChanges();
```

## iOS-Specific UI Considerations

### Safe Areas and Notches

The application respects iOS safe areas to ensure content isn't obscured by notches, home indicators, or system bars.

- Bottom navigation uses safe area insets
- Forms and content maintain proper margins
- Modals and dialogs avoid system UI elements

### Gesture Navigation

The app supports iOS gesture navigation:

- Swipe back to navigate to previous screens
- Pull to refresh for data updates
- Scroll bounce effects

### Keyboard Handling

Special considerations for iOS keyboard behavior:

- Input fields adjust when keyboard appears
- Forms scroll to keep the active field visible
- Dismiss keyboard on tap outside or form submission

## Testing iOS-Specific Features

### On Simulator

Most features can be tested on the iOS simulator:

1. Camera functionality can be simulated with pre-recorded images
2. Barcode scanning can be tested with sample images
3. Offline mode can be tested by disabling network in simulator settings

### On Physical Devices

For complete testing, use physical iOS devices:

1. Test camera functionality with actual locations
2. Test barcode scanning with real barcodes
3. Test Bluetooth connectivity with external scanners
4. Verify offline functionality by enabling airplane mode

## Known iOS-Specific Issues

1. **Camera Permission Dialogs**: iOS may show permission dialogs multiple times if the user doesn't select "Allow" initially
2. **Bluetooth Scanner Connectivity**: Some Bluetooth scanners may require specific pairing procedures
3. **Keyboard Height**: The virtual keyboard may sometimes overlap with input fields on smaller devices

## iOS Version Compatibility

- The app is designed to work on iOS 13.0 and above, as specified in the app manifest
- Optimal performance is achieved on iOS 15.0+
- The app leverages Capacitor 7.x which provides enhanced support for modern iOS versions
- App deployment requires Xcode 15+ for development and distribution