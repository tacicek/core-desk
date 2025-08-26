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

// Enhanced error handling and debugging
try {
  console.log('🚀 Starting Rechnungssystem application...');
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found in DOM');
  }
  
  console.log('✅ Root element found, mounting React app...');
  const root = createRoot(rootElement);
  
  root.render(<App />);
  console.log('✅ React app mounted successfully');
  
} catch (error) {
  console.error('❌ Failed to mount React app:', error);
  
  // Fallback error display
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        background: #f9fafb;
      ">
        <div style="
          background: white; 
          padding: 40px; 
          border-radius: 12px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
        ">
          <h1 style="color: #dc2626; margin-bottom: 16px; font-size: 24px;">⚠️ Application Error</h1>
          <p style="margin-bottom: 20px; color: #6b7280;">The application failed to start. Please check the browser console for details.</p>
          <p style="font-family: monospace; background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 12px; color: #374151;">${error.message}</p>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="
              background: #2563eb; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 6px; 
              cursor: pointer; 
              margin-right: 12px;
            ">🔄 Reload Page</button>
            <a href="/setup" style="
              background: #059669; 
              color: white; 
              text-decoration: none; 
              padding: 12px 24px; 
              border-radius: 6px; 
              display: inline-block;
            ">🔧 Go to Setup</a>
          </div>
        </div>
      </div>
    `;
  }
}
