# iOS Splash Screens

This directory should contain splash screen images for iOS app launch screens.

## Required Splash Screen Sizes

### iPhone
- LaunchImage-Portrait@2x~iphone.png (640×960px)
- LaunchImage-Portrait@3x~iphone.png (1125×2436px) - iPhone X
- LaunchImage-Portrait-812h@3x~iphone.png (1125×2436px) - iPhone X
- LaunchImage-Portrait-896h@2x~iphone.png (828×1792px) - iPhone XR
- LaunchImage-Portrait-896h@3x~iphone.png (1242×2688px) - iPhone XS Max

### iPad
- LaunchImage-Portrait@2x~ipad.png (1536×2048px)
- LaunchImage-Portrait@1x~ipad.png (768×1024px)
- LaunchImage-Landscape@2x~ipad.png (2048×1536px)
- LaunchImage-Landscape@1x~ipad.png (1024×768px)

## Splash Screen Guidelines

- Use PNG format
- Include your app logo and/or name
- Keep the design minimal and clean
- Use consistent branding with your app icons
- Test on multiple device sizes to ensure proper display
- Consider using a storyboard-based launch screen for better adaptability

## Modern Approach

For modern iOS versions, it's recommended to use a Launch Screen Storyboard instead of static images. Capacitor will set this up automatically, but you can customize it in Xcode.