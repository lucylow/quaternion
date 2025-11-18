import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// PATCHED BY CURSOR - 2024-12-19 - safe bootstrap & debug
// Import Phaser shim early to patch input system before Phaser is used
import "./engine/phaserShim";

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
    } catch(e){
      // Ignore logging errors
    }
    oldErr.apply(console, args);
  };
  const oldWarn = console.warn;
  console.warn = function(...args) {
    try { 
      window.__QUAT_LOGS__.push({level:'warn', args: args.map(a => String(a)), ts:Date.now()}); 
      if (window.__QUAT_LOGS__.length > 100) window.__QUAT_LOGS__.shift();
    } catch(e){
      // Ignore logging errors
    }
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

// PATCHED BY CURSOR - phaser hitArea fix - 2024-11-18
// Handle window.postMessage events (e.g., from iframes)
// Gracefully handle iframe-pos and other known message types without warnings
// This handler only processes window.postMessage events and does NOT interfere with button clicks
window.addEventListener('message', (ev) => {
  try {
    // Only process messages with data and type properties
    const data = ev && ev.data;
    if (!data || typeof data !== 'object') return;

    // Handle iframe-related messages (from embedded content, not from game buttons)
    // These should NEVER interfere with click events or game functionality
    if (data.type === 'iframe-pos' || data.type === 'iframe-resize' || data.type === 'iframe-scroll') {
      // Silently store for debug if needed
      window.__QUAT_LAST_IFRAME_POS__ = data;
      // Only log in debug mode, and do it quietly
      if (window.__QUAT_DEBUG__) {
        console.log('[QUAT DEBUG] received iframe message', data.type);
      }
      // Return early - do NOT stop propagation or prevent default
      // This is just a passive listener for iframe messages
      return;
    }

    // For other message types, let them fall through to other handlers
    // We don't stop propagation here - button clicks work independently
  } catch (err) {
    // Log errors but don't let them break anything
    if (window.__QUAT_DEBUG__) {
      console.warn('[QUAT DEBUG] message handler error', err);
    }
  }
}, { passive: true }); // Use passive listener to ensure it doesn't block UI events

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
