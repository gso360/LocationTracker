# iOS Deployment Guide

This guide provides instructions for building, configuring, and deploying the Showroom Manager application to iOS devices.

## Prerequisites

Before you begin, ensure you have the following:

- A Mac computer with macOS 10.15 (Catalina) or newer
- Xcode 12 or newer installed from the Mac App Store
- An Apple Developer account (for deploying to physical devices and App Store)
- Node.js and npm installed
- CocoaPods installed (`sudo gem install cocoapods`)

## Setup Process

### 1. Install Required Dependencies

The application uses Capacitor to bridge between web and native iOS. All required dependencies should already be installed if you're working with the current repository.

### 2. Build the Web Application

Build the web application that will be wrapped in the native iOS container:

```bash
npm run build
```

### 3. Add iOS Platform

If you haven't already added the iOS platform to your project:

```bash
npx cap add ios
```

### 4. Sync Web Code with iOS

After making changes to your web code, you need to sync those changes to the iOS project:

```bash
npx cap sync ios
```

### 5. Open the iOS Project in Xcode

Launch Xcode with the iOS project:

```bash
npx cap open ios
```

Alternatively, you can use our helper script that handles these steps automatically:

```bash
node scripts/build-ios.js
```

## Xcode Configuration

Once the project is open in Xcode, you need to configure several settings:

### 1. Signing & Capabilities

1. Select the "App" project in the Project Navigator
2. Select the "App" target
3. Go to the "Signing & Capabilities" tab
4. Choose your development team
5. The bundle identifier should match what's in `capacitor.config.ts`

### 2. Device Orientation

By default, the app is configured for portrait orientation only on iPhone and both portrait and landscape on iPad. If you need to change this:

1. Select the "App" project
2. Select the "App" target
3. Go to the "General" tab
4. Scroll to "Deployment Info"
5. Check/uncheck the desired orientations

### 3. Required App Permissions

The app requires several permissions that are already configured in `Info.plist`:

- Camera access (for taking photos and scanning barcodes)
- Photo Library access (for saving photos)
- Bluetooth access (for barcode scanner connectivity)
- Location access (for associating locations with inventory)

## Running on Simulator

1. In Xcode, select the desired iOS simulator from the device menu
2. Click the Run button or press Cmd+R

## Running on Physical Device

1. Connect your iOS device to your Mac with a USB cable
2. Select your device from the device menu in Xcode
3. Click the Run button or press Cmd+R
4. You may need to trust the developer certificate on your device

## Troubleshooting

### Common Issues

1. **Build fails with signing errors**
   - Ensure you have selected a valid development team
   - Check that your Apple Developer account has the necessary permissions

2. **App crashes on startup**
   - Check the Xcode console for error messages
   - Verify that all required permissions are properly configured in `Info.plist`

3. **Camera or Bluetooth functionality not working**
   - Ensure the proper usage descriptions are set in `Info.plist`
   - Verify the app has been granted the necessary permissions in iOS Settings

4. **White screen after launch**
   - Check for JavaScript errors in the Xcode console
   - Verify that the web build completed successfully
   - Ensure Capacitor configuration points to the correct web directory

### Debugging Web Content

You can debug the web content running in the iOS app using Safari's Web Inspector:

1. Enable Web Inspector on your iOS device (Settings → Safari → Advanced → Web Inspector)
2. Connect your device to your Mac
3. Open Safari on your Mac
4. Enable the Develop menu (Safari → Preferences → Advanced → Show Develop menu)
5. Select your device from the Develop menu, then select the app's WebView

## Distribution

### TestFlight

To distribute the app via TestFlight for beta testing:

1. Configure App Store Connect with your app information
2. In Xcode, select "Generic iOS Device" as the build target
3. Go to Product → Archive
4. Once archiving is complete, click "Distribute App"
5. Select "App Store Connect" and follow the prompts

### App Store

The process for App Store distribution is similar to TestFlight:

1. Ensure your app metadata is complete in App Store Connect
2. Archive your app as described above
3. Submit for App Store review through the distribution workflow

## Further Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)