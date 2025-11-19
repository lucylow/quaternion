// src/utils/assetUrl.ts

// Universal runtime resolver for assets that works with Lovable transformation and local dev.
// The Lovable pipeline/tool should replace /mnt/data/... paths with a public URL. If not, we fall back to VITE_ASSET_PREFIX.

export function assetUrl(localPath: string): string {
  // 1) If a Lovable runtime resolver exists (injected in the host), use it.
  const win = typeof window !== 'undefined' ? (window as any) : undefined;
  if (win && typeof win.__LOVABLE_ASSET_RESOLVER === 'function') {
    try {
      const resolved = win.__LOVABLE_ASSET_RESOLVER(localPath);
      if (typeof resolved === 'string' && resolved.length) return resolved;
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
    return `${devPrefix.replace(/\/$/, '')}/${basename}`;
  }

  // 3) Handle existing /assets paths - these should work as-is but ensure they're properly resolved
  if (localPath.startsWith('/assets/')) {
    // If we have a dev prefix, use it; otherwise return as-is (browser will resolve relative to origin)
    if (devPrefix) {
      return `${devPrefix.replace(/\/$/, '')}${localPath}`;
    }
    return localPath;
  }

  // 4) If the path already looks like a URL, return it.
  if (/^https?:\/\//.test(localPath) || localPath.startsWith('/')) {
    return localPath;
  }

  // 5) Last resort: return localPath (browser might not be able to fetch it without transformation).
  return localPath;
}

