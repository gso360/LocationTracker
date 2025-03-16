import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.showroommanager.app',
  appName: 'Showroom Manager',
  webDir: 'client',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app'
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
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;
