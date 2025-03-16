// Type declarations for Capacitor
interface Window {
  Capacitor?: {
    isNative: boolean;
    getPlatform: () => string;
    convertFileSrc: (path: string) => string;
    registerPlugin: (name: string, methods: string[]) => any;
  };
  CapacitorCustomPlatform?: {
    name: string;
  };
}