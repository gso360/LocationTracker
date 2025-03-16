# iOS App Store Submission Guide

This guide will walk you through the final steps needed to prepare your Showroom Inventory Manager app for iOS App Store submission.

## Prerequisites

1. **Apple Developer Account** - You must have an active Apple Developer account ($99/year)
2. **Xcode** - Latest version of Xcode installed on a Mac computer
3. **iOS Device** - For testing the native app (optional but recommended)

## Setup Instructions

### 1. Install Capacitor CLI Globally

```bash
npm install -g @capacitor/cli
```

### 2. Build Your Web App

```bash
npm run build
```

### 3. Initialize iOS Platform

```bash
npx cap add ios
```

### 4. Update Capacitor Configuration

The `capacitor.config.ts` file should be properly configured (already done).

### 5. Copy Web Assets to Native Platform

```bash
npx cap sync ios
```

### 6. Open the iOS Project in Xcode

```bash
npx cap open ios
```

## Xcode Configuration

Once your project is open in Xcode, you'll need to:

1. **Set Bundle Identifier** - Use the one specified in the manifest: `com.showroommanager.app`

2. **Signing & Capabilities**
   - Select your development team
   - Ensure provisioning profiles are set up correctly

3. **App Icons & Launch Screen**
   - Add the app icons in the `Assets.xcassets` folder
   - Configure the launch screen storyboard

4. **Privacy Descriptions**
   - Ensure camera usage description is properly set in Info.plist
   - Add Bluetooth usage descriptions if using Bluetooth scanners

## App Store Connect Setup

1. **Create New App**
   - Log in to [App Store Connect](https://appstoreconnect.apple.com/)
   - Click "My Apps" and then "+"
   - Fill in required information:
     - Bundle ID (same as in Xcode)
     - App name: "Showroom Inventory Manager"
     - Primary language
     - SKU (unique identifier)
     - User access (full access recommended)

2. **App Information**
   - App Store icon (1024×1024px)
   - App previews and screenshots (required for all device sizes)
   - Description
   - Keywords
   - Support URL
   - Marketing URL (optional)
   - Privacy Policy URL (required)

3. **Pricing and Availability**
   - Select price (or free)
   - Choose availability by territory

4. **App Review Information**
   - Contact information
   - Demo account login information (if needed)
   - Notes for App Review team

## Building for Distribution

1. **Test Flight (Recommended before App Store)**
   - Archive your app in Xcode
   - Select "Distribute App" > "TestFlight & App Store"
   - Follow the prompts and upload
   - Configure test groups and add testers

2. **App Store Submission**
   - Archive your app in Xcode
   - Select "Distribute App" > "App Store Connect"
   - Upload the build
   - In App Store Connect, select the build for review
   - Submit for review

## Common Issues and Troubleshooting

### Capacitor Issue: Plugin Not Found
- Ensure all plugins are properly installed and native projects are synced
- Run `npx cap sync ios` after adding plugins

### Xcode Build Errors
- Check signing certificates and provisioning profiles
- Ensure team is selected correctly
- Clean build folder (Shift+Cmd+K) and try again

### App Rejection Issues
- Privacy policy not properly implemented
- Incomplete metadata
- App crashes during review
- Functionality issues
- Review guidelines not followed

## Final Checklist Before Submission

- [ ] App builds without errors
- [ ] All features work correctly in native iOS environment
- [ ] App icon and splash screen configured
- [ ] Privacy descriptions in Info.plist
- [ ] App Store metadata complete
- [ ] Privacy policy created and URL provided
- [ ] Test account credentials provided (if needed)
- [ ] App tested on multiple iOS devices/versions

## Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight Beta Testing](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)