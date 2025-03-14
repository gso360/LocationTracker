import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Fix: The server doesn't serve files from the direct root in development
    // So we need to access them from the correct path
    const swPath = import.meta.env.DEV ? './service-worker.js' : '/service-worker.js';
    
    navigator.serviceWorker.register(swPath)
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
