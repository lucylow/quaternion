import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Enable debug mode
window.__QUAT_DEBUG__ = true;

// Global error logging
(function attachConsoleSink() {
  window.__QUAT_LOGS__ = window.__QUAT_LOGS__ || [];
  const oldErr = console.error;
  console.error = function(...args) {
    try { 
      window.__QUAT_LOGS__.push({level:'error', args: args.map(a => String(a)), ts:Date.now()}); 
      if (window.__QUAT_LOGS__.length > 100) window.__QUAT_LOGS__.shift();
    } catch(e){}
    oldErr.apply(console, args);
  };
  const oldWarn = console.warn;
  console.warn = function(...args) {
    try { 
      window.__QUAT_LOGS__.push({level:'warn', args: args.map(a => String(a)), ts:Date.now()}); 
      if (window.__QUAT_LOGS__.length > 100) window.__QUAT_LOGS__.shift();
    } catch(e){}
    oldWarn.apply(console, args);
  };
})();

// Global error handlers
window.addEventListener('error', (e) => {
  console.error('[QUAT DEBUG] uncaught error', e.error || e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (ev) => {
  console.error('[QUAT DEBUG] unhandled rejection', ev.reason);
});

// Handle window.postMessage events (e.g., from iframes)
// Filter unknown message types to avoid console spam
let _lastMsgWarn = 0;
window.addEventListener('message', (ev) => {
  try {
    const data = ev.data;
    
    // Ignore non-object data
    if (!data || typeof data !== 'object') return;
    
    // If using structured messages, require a type field
    if (!data.type || typeof data.type !== 'string') return;

    switch (data.type) {
      case 'iframe-pos':
        // Handle iframe position updates if needed
        // You can add specific handling here
        break;
      
      // Add other supported message types here as needed
      
      default:
        // Silently ignore unknown message types to avoid console spam
        // Only warn in development mode, throttled
        if (import.meta.env.DEV) {
          const now = Date.now();
          if (now - _lastMsgWarn > 5000) {
            console.warn('[QUAT DEBUG] Unknown message type:', data.type);
            _lastMsgWarn = now;
          }
        }
        return;
    }
  } catch (err) {
    // Log meaningful info, but avoid spamming
    console.error('[QUAT DEBUG] message handler error', err);
  }
});

console.log('[QUAT DEBUG] main.tsx loaded');

// Hide initial loading screen once React mounts
const hideLoadingScreen = () => {
  const loader = document.getElementById("initial-loading");
  if (loader) {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => loader.remove(), 300);
  }
};

// Enable mock replay API if env var is set
if (import.meta.env.VITE_USE_REPLAY_MOCK === 'true') {
  import('./mocks/replayMockServer').then(({ setupMockReplayAPI }) => {
    setupMockReplayAPI();
  });
}

// Register service worker for offline capability and caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[QUAT DEBUG] Root element not found!');
  throw new Error('Root element not found');
}

console.log('[QUAT DEBUG] Root element found, creating React root');
const root = createRoot(rootElement);
root.render(<App />);

// Hide loading screen after React renders
setTimeout(hideLoadingScreen, 100);
console.log('[QUAT DEBUG] App rendered');
