import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.showroommanager.app',
  appName: 'Showroom Manager',
  webDir: 'client',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app',
    url: 'https://f85a51d0-882c-4702-ac4c-1b07686e2727-00-aie57yukdtxg.spock.replit.dev',
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
    limitsNavigationsToAppBoundDomains: false  // Changed to false to allow external connections
  }
};

export default config;
