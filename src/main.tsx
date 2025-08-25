import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

// Register service worker for caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Preload critical resources
const preloadCriticalResources = () => {
  // Preload dashboard route
  import('./pages/Dashboard.tsx');
  // Preload auth context
  import('./contexts/AuthContext.tsx');
};

// Start preloading after initial render
setTimeout(preloadCriticalResources, 100);

createRoot(document.getElementById("root")!).render(<App />);
