import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.showroommanager.app',
  appName: 'Showroom Manager',
  webDir: 'client',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app',
    url: process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : undefined,
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF"
    },
    Camera: {
      presentationStyle: 'fullscreen',
      saveToGallery: false
    }
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,  // Allow external connections
    backgroundColor: "#FFFFFF",
    scheme: "app"
  }
};

export default config;
