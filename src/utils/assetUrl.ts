// src/utils/assetUrl.ts

// Universal runtime resolver for assets that works with Lovable transformation and local dev.
// The Lovable pipeline/tool should replace /mnt/data/... paths with a public URL. If not, we fall back to VITE_ASSET_PREFIX.

import { encodeImagePath } from './imagePathEncoder';

export function assetUrl(localPath: string): string {
  if (!localPath) return localPath;

  // 1) If a Lovable runtime resolver exists (injected in the host), use it.
  const win = typeof window !== 'undefined' ? (window as any) : undefined;
  if (win && typeof win.__LOVABLE_ASSET_RESOLVER === 'function') {
    try {
      const resolved = win.__LOVABLE_ASSET_RESOLVER(localPath);
      if (typeof resolved === 'string' && resolved.length) {
        // Still encode the resolved path to handle special characters
        return encodeImagePath(resolved);
      }
    } catch (err) {
      // fall through to other strategies
      // console.warn('Lovable resolver failed', err);
    }
  }

  // 2) If localPath looks like the uploaded file (e.g., /mnt/data/...), we expect the deploy-time tool to transform it.
  // If not transformed, attempt to map using env prefix + basename (helpful for dev).
  const basename = localPath.split('/').pop();

  const devPrefix =
    // Vite (import.meta.env) or fallback environment variable prefixed into the build
    (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_ASSET_PREFIX) ||
    (typeof process !== 'undefined' && (process.env.REACT_APP_ASSET_PREFIX || process.env.VITE_ASSET_PREFIX)) ||
    '';

  if (localPath.startsWith('/mnt/data/') && devPrefix) {
    // devPrefix is expected to be e.g. "https://neural-frontier-hq.lovable.app/assets"
    const resolved = `${devPrefix.replace(/\/$/, '')}/${basename}`;
    return encodeImagePath(resolved);
  }

  // 3) Handle existing /assets paths - these should work as-is but ensure they're properly resolved
  if (localPath.startsWith('/assets/')) {
    // Check if we're in Lovable preview environment (iframe)
    if (typeof window !== 'undefined') {
      const isLovablePreview = window.location.pathname.includes('id-preview') || 
                               window.location.pathname.includes('/preview/') ||
                               (window.parent !== window && (document.referrer.includes('lovable.dev') || window.location.hostname.includes('lovable.dev')));
      
      if (isLovablePreview) {
        // In Lovable preview iframe, public assets are served from root of the iframe
        // Construct full URL using current origin + encoded path
        const origin = window.location.origin;
        // In iframe, assets might be at root or might need base path
        // Try root first (most common)
        const encodedPath = encodeImagePath(localPath);
        const fullUrl = `${origin}${encodedPath}`;
        console.log('[assetUrl] Lovable preview detected, using:', fullUrl, 'from path:', localPath);
        return fullUrl;
      }
    }
    
    // If we have a dev prefix, use it; otherwise encode and return the path
    if (devPrefix) {
      return encodeImagePath(`${devPrefix.replace(/\/$/, '')}${localPath}`);
    }
    // Use encodeImagePath to handle special characters and Lovable preview paths
    return encodeImagePath(localPath);
  }

  // 4) If the path already looks like a URL, return it encoded.
  if (/^https?:\/\//.test(localPath)) {
    return localPath; // URLs don't need encoding
  }

  // 5) For other absolute paths, encode them
  if (localPath.startsWith('/')) {
    return encodeImagePath(localPath);
  }

  // 6) Last resort: encode and return localPath (browser might not be able to fetch it without transformation).
  return encodeImagePath(localPath);
}

