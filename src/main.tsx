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
(function installSafeMessageHandler() {
  const allowedTypes = new Set(['iframe-pos', 'iframe-resize', 'iframe-scroll', 'game-event', 'ui-resize']);
  let lastWarnTime = 0;
  const warnThrottleMs = 5000; // Only warn once per 5 seconds for unknown types

  window.addEventListener('message', (ev) => {
    try {
      // Safely extract message data
      if (!ev || !ev.data) return;
      
      const data = ev.data;
      
      // Handle non-object data types (strings, numbers, etc.) - ignore them
      if (typeof data !== 'object' || data === null) return;
      
      // Handle arrays - they're objects but we don't process them
      if (Array.isArray(data)) return;

      // Safely extract message type
      let msgType: string | null = null;
      try {
        msgType = (data && typeof data === 'object' && ('type' in data || 'msgType' in data))
          ? (data.type || data.msgType || null)
          : null;
      } catch (e) {
        // If accessing properties fails, ignore this message
        return;
      }

      if (!msgType || typeof msgType !== 'string') return;

      // Handle known iframe-related messages silently
      if (allowedTypes.has(msgType)) {
        // Silently store for debug if needed
        try {
          if (msgType === 'iframe-pos' || msgType === 'iframe-resize' || msgType === 'iframe-scroll') {
            (window as any).__QUAT_LAST_IFRAME_POS__ = data;
          }
        } catch (e) {
          // Ignore errors when storing debug data
        }
        // Silently handle - no warnings for known types
        return;
      }

      // For unknown message types, throttle warnings to avoid spam
      const now = Date.now();
      if (now - lastWarnTime > warnThrottleMs) {
        if (window.__QUAT_DEBUG__) {
          console.warn('[QUAT DEBUG] Unknown message type (throttled):', msgType);
        }
        lastWarnTime = now;
      }
      // Silently ignore unknown types - don't let them fall through
      return;

    } catch (err) {
      // Log errors but don't let them break anything
      // Only log iframe-pos related errors in debug mode
      if (window.__QUAT_DEBUG__) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        // Only warn if it's not a common benign error
        if (!errorMsg.includes('Cannot read') && !errorMsg.includes('undefined')) {
          console.warn('[QUAT DEBUG] message handler error', err);
        }
      }
    }
  }, { passive: true }); // Use passive listener to ensure it doesn't block UI events
})();

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
