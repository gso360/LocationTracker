import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA support
// Only register in production to avoid development issues
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
} else if (import.meta.env.DEV) {
  console.log('Service Worker registration skipped in development environment');
}

createRoot(document.getElementById("root")!).render(<App />);
