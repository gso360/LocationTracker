# Showroom Inventory Manager - iOS App

This README provides instructions for working with the native iOS version of the Showroom Inventory Manager application.

## Project Overview

The Showroom Inventory Manager iOS app is built using:

- **React** for the UI and application logic
- **Capacitor** for wrapping the web app into a native iOS container
- **Native iOS APIs** for camera and barcode scanning
- **Express.js** backend for data management

## Architecture

The application follows a hybrid architecture:

1. **Core Web Application**: The main application is built as a React web app
2. **Capacitor Bridge**: Provides access to native iOS APIs
3. **Native Services**: Custom services built to integrate with iOS native features
4. **iOS Container**: Native iOS shell that hosts the web application

## Native Features Implemented

- **Native Camera Integration**: Using `@capacitor/camera` for taking location photos
- **Native Barcode Scanning**: Custom implementation using the native camera and image analysis
- **Native UI Adaptations**: Special UI optimizations when running in native context

## Development Workflow

### Local Development

During development, you can continue working with the web version:

```bash
npm run dev
```

### Previewing Native Features

To test native features during development:

1. Make changes to web app code
2. Build the web app
3. Sync with Capacitor
4. Open in Xcode simulator or device

```bash
npm run build
npx cap sync ios
npx cap open ios
```

### Important Files

- `capacitor.config.ts`: Main configuration for Capacitor and native features
- `client/src/services/CapacitorCameraService.ts`: Native camera integration
- `client/src/services/CapacitorBarcodeService.ts`: Native barcode scanning
- `ios-app-manifest.json`: iOS app configuration for App Store submission

### Components with Native Integration

- `CameraCapture.tsx`: Adapts to use native camera when available
- `BarcodeScanner.tsx`: Uses native barcode scanning on iOS

## Testing Native Features

To properly test native features, you should:

1. Build the app and run it on an actual iOS device
2. Test camera functionality in different lighting conditions
3. Test barcode scanning with various barcode types
4. Verify Bluetooth scanner integration if applicable

## Building for Production

Follow these steps to build the iOS app for production:

1. Update version information in `capacitor.config.ts` and `ios-app-manifest.json`
2. Build the web app: `npm run build`
3. Sync with Capacitor: `npx cap sync ios`
4. Open in Xcode: `npx cap open ios`
5. Set up signing and team in Xcode
6. Build an archive for distribution

## Troubleshooting

### Native Camera Not Working
- Ensure camera permissions are properly requested
- Verify Info.plist has correct privacy descriptions
- Check Capacitor configuration

### Barcode Scanning Issues
- Test in well-lit environments
- Ensure barcode is clearly visible
- Verify zxing library is properly initialized

### Xcode Build Errors
- Check for missing frameworks
- Verify signing certificate is valid
- Ensure all dependencies are installed

## App Store Submission

Refer to the detailed `ios-app-guide.md` for complete App Store submission instructions.

## Maintenance Notes

- Keep Capacitor and plugins updated to latest compatible versions
- Test thoroughly after updating native dependencies
- Maintain consistent behavior between web and native experiences