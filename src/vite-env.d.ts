/// <reference types="vite/client" />

// Extend Window interface for dataLayer (Google Tag Manager / Analytics)
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export {};
