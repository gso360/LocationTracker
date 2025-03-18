# iOS App Development Guide

This guide provides detailed instructions for setting up and running the Showroom Inventory Manager app in Xcode as a native iOS application.

## Prerequisites

Before starting, ensure you have:

- macOS computer with the latest version
- Xcode 14.0 or higher installed
- Node.js 18.0 or higher installed
- CocoaPods installed (`sudo gem install cocoapods`)
- An Apple Developer account (for deployment to physical devices and App Store)

## Initial Setup

1. Clone the repository from GitHub and install dependencies:

```bash
git clone [your-repo-url]
cd [your-project-directory]
npm install
```

2. Install Capacitor CLI globally (if not already installed):

```bash
npm install -g @capacitor/cli
```

## Building for iOS

1. Build the web application:

```bash
npm run build
```

2. Initialize and sync Capacitor (first time only):

```bash
npx cap sync ios
```

3. Open the project in Xcode:

```bash
npx cap open ios
```

## Xcode Configuration

Once the project is open in Xcode, you need to:

1. **Set up your Team for signing**:
   - Click on the project name in the Project Navigator
   - Select the app target
   - In the "Signing & Capabilities" tab, select your team from the dropdown

2. **Update Bundle Identifier** (optional):
   - The default is `com.showroommanager.app`
   - You can customize this based on your organization

3. **Privacy Descriptions**:
   - Ensure the following entries are in your Info.plist:
     - NSCameraUsageDescription
     - NSPhotoLibraryUsageDescription
     - NSPhotoLibraryAddUsageDescription
     - NSLocationWhenInUseUsageDescription
     - NSBluetoothAlwaysUsageDescription (if using Bluetooth scanners)

## Running on Simulator

1. In Xcode, select a simulator from the device dropdown
2. Click the Run button (▶️) or press Cmd+R
3. Wait for the simulator to launch and the app to install

## Running on Physical Device

1. Connect your iOS device to your Mac
2. Select your device from the device dropdown in Xcode
3. Ensure you've set up your team for signing
4. Click the Run button (▶️) or press Cmd+R
5. You may need to trust the developer certificate on your device

## Updating Web Code

When you make changes to the web code:

1. Rebuild the web application:

```bash
npm run build
```

2. Sync the changes to the iOS project:

```bash
npx cap sync ios
```

3. If Xcode is already open, you can simply Cmd+R to run with the updated web code

## Configuration Files

Important files for iOS configuration:

- **capacitor.config.ts**: Main Capacitor configuration
- **ios/App/App/Info.plist**: iOS app information and permissions
- **ios/App/App/capacitor.config.json**: Generated Capacitor config for iOS

## Native Plugin Integration

The app uses several Capacitor plugins:

- **@capacitor/camera**: For taking photos of locations
- **@capacitor/core**: Core Capacitor functionality
- **@capacitor/ios**: iOS-specific Capacitor code

Custom native integrations:

- **CapacitorCameraService**: Native camera handling
- **CapacitorBarcodeService**: Barcode scanning with native camera

## Debugging iOS Issues

If you encounter problems:

1. **Camera not working**:
   - Check Info.plist for proper privacy descriptions
   - Verify Camera plugin permissions are requested
   - Try different iOS device or simulator

2. **Barcode scanning issues**:
   - Test in good lighting conditions
   - Check image capture settings
   - Verify ZXing library integration

3. **Network connectivity**:
   - Check ATS settings in Info.plist
   - Verify server URL in capacitor.config.ts
   - Test API endpoints separately

4. **App crashes**:
   - Check Xcode console for error messages
   - Inspect Safari web inspector for JavaScript errors
   - Look for any Capacitor plugin errors

## App Store Submission

To prepare for App Store submission:

1. Update app version in capacitor.config.ts
2. Ensure all privacy descriptions are properly filled
3. Create App Store screenshots for different device sizes
4. Generate app icons using appropriate tools
5. Set up App Store Connect with your app details
6. Archive your app in Xcode and upload to App Store Connect

## App Icon and Splash Screen

Icons and splash screens are located in:

- ios/App/App/Assets.xcassets/AppIcon.appiconset/
- ios/App/App/Assets.xcassets/Splash.imageset/

You can update these with your own branded assets.

## Advanced Usage

### Live Reload During Development

For faster development with live reload:

```bash
npm run dev
npx cap run ios --livereload --external
```

### Custom Capacitor Plugins

If you need to create custom native functionality:

1. Create a plugin structure in a separate directory
2. Implement iOS native code in Swift
3. Create JavaScript interface
4. Add to your project with npm link or as a local dependency

## Common Issues and Solutions

1. **"App not working with iOS 16+"**:
   - Update Capacitor to latest version
   - Check for deprecated APIs
   - Update Swift version in podfile

2. **White screen on app launch**:
   - Check for JavaScript errors
   - Verify correct WKWebView configuration
   - Make sure web assets are properly bundled

3. **Permissions dialogs not showing**:
   - Verify Info.plist has proper usage descriptions
   - Check Capacitor plugin initialization
   - Test on physical device (some permissions don't work in simulator)

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Swift Programming Guide](https://swift.org/documentation/)