/**
 * Utility for encoding image paths with special characters
 * Handles special characters like middle dot (·), apostrophes, colons, spaces, etc.
 * This ensures images with special characters in their filenames load correctly
 * Also handles Lovable preview environment (id-preview) paths
 */

/**
 * Get the base path for assets based on the environment
 * Handles Lovable preview (id-preview) and regular Vite dev/prod environments
 */
function getAssetBasePath(): string {
  // Check if we're in Lovable preview environment
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const pathParts = pathname.split('/').filter(p => p);
    
    // Lovable preview URLs contain 'id-preview' in the path
    if (pathname.includes('id-preview')) {
      // Extract the base path from Lovable preview URL
      // Example: /project-name/id-preview/... -> /project-name/id-preview
      const idPreviewIndex = pathParts.findIndex(part => part === 'id-preview');
      if (idPreviewIndex !== -1) {
        // Get everything up to and including 'id-preview'
        const basePath = '/' + pathParts.slice(0, idPreviewIndex + 1).join('/');
        return basePath;
      }
    }
    
    // For other cases, don't add base path - Vite handles public assets from root
    // Public assets in Vite are always served from / regardless of route
  }
  
  // Regular Vite dev/prod - use root (public assets are always at root)
  return '';
}

/**
 * Encodes an image path to handle special characters in filenames
 * Properly encodes each path segment while preserving directory structure
 * Also adjusts for Lovable preview environment paths
 * 
 * @param path - The image path (e.g., "/assets/maps/DALL·E 2024-11-20...")
 * @returns The encoded path safe for use in URLs
 */
export function encodeImagePath(path: string): string {
  if (!path) return path;
  
  try {
    // Get base path for environment (handles Lovable preview)
    const basePath = getAssetBasePath();
    
    // Normalize the path - ensure it starts with /
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    
    // Combine base path with the asset path
    const fullPath = basePath + normalizedPath;
    
    // Split path into segments and encode each segment separately
    // This preserves the directory structure (/) while encoding special characters
    const encoded = fullPath.split('/').map((segment, index) => {
      // Keep empty segments (leading/trailing slashes) and the root segment
      if (!segment || index === 0) return segment;
      
      // Encode each segment to handle special characters:
      // - Middle dot (·) -> %C2%B7
      // - Spaces -> %20
      // - Apostrophes (') -> %27
      // - Colons (:) -> %3A
      // - Parentheses -> %28, %29
      // - All other special characters
      return encodeURIComponent(segment);
    }).join('/');
    
    return encoded;
  } catch (error) {
    console.warn('[encodeImagePath] Error encoding path:', path, error);
    // Fallback: try basic encoding
    try {
      const basePath = getAssetBasePath();
      const normalizedPath = path.startsWith('/') ? path : '/' + path;
      return basePath + encodeURI(normalizedPath);
    } catch (e) {
      // Last resort: return as-is with base path
      console.error('[encodeImagePath] Failed to encode path:', path, e);
      const basePath = getAssetBasePath();
      const normalizedPath = path.startsWith('/') ? path : '/' + path;
      return basePath + normalizedPath;
    }
  }
}

/**
 * Decodes an image path (for debugging purposes)
 */
export function decodeImagePath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch (error) {
    console.warn('[decodeImagePath] Error decoding path:', path, error);
    return path;
  }
}

