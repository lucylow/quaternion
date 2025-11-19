/**
 * Network Utilities
 * Handles network requests with retry logic, offline detection, and error handling
 */

export interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  offlineFallback?: () => any;
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  // Default to true if we can't determine
  return true;
}

/**
 * Wait for network to come online
 */
export function waitForOnline(timeout: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handler);
      resolve(false);
    }, timeout);

    const handler = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handler);
      resolve(true);
    };

    window.addEventListener('online', handler);
  });
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic, timeout, and offline handling
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    offlineFallback,
    ...fetchOptions
  } = options;

  // Check if offline
  if (!isOnline()) {
    if (offlineFallback) {
      console.warn('Offline: using fallback data');
      const fallbackData = offlineFallback();
      // Create a mock Response object
      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        statusText: 'OK (offline fallback)',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw new Error('Network is offline and no fallback provided');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Merge abort signal with existing signal if provided
      // Note: AbortSignal.any() may not be available in all browsers, use controller.signal as fallback
      let signal: AbortSignal = controller.signal;
      if (fetchOptions.signal) {
        // If AbortSignal.any() is available, use it; otherwise just use the provided signal
        if (typeof AbortSignal.any === 'function') {
          signal = AbortSignal.any([controller.signal, fetchOptions.signal]);
        } else {
          // Fallback: use controller signal and manually abort on fetchOptions.signal abort
          fetchOptions.signal.addEventListener('abort', () => controller.abort());
          signal = controller.signal;
        }
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal
      });

      clearTimeout(timeoutId);

      // Check if response is ok (status 200-299)
      if (!response.ok) {
        // For 5xx errors, retry; for 4xx errors, don't retry
        if (response.status >= 500 && attempt < retries) {
          throw new Error(`Server error ${response.status}: ${response.statusText}`);
        }
        // For other errors, return the response (caller can handle it)
        return response;
      }

      return response;
    } catch (error: any) {
      lastError = error;

      // Don't retry on abort (timeout or user cancellation)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      // Don't retry on network errors if offline
      if (!isOnline()) {
        if (offlineFallback) {
          console.warn('Went offline during request: using fallback data');
          const fallbackData = offlineFallback();
          return new Response(JSON.stringify(fallbackData), {
            status: 200,
            statusText: 'OK (offline fallback)',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw new Error('Network went offline during request');
      }

      // If this was the last attempt, throw the error
      if (attempt >= retries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = retryDelay * Math.pow(2, attempt);
      console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }

  // All retries failed
  throw lastError || new Error('Request failed after all retries');
}

/**
 * Fetch JSON with retry logic
 */
export async function fetchJSON<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`);
  }
}

/**
 * Fetch with offline detection and retry for ElevenLabs API
 */
export async function fetchElevenLabs(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetchWithRetry(url, {
    ...options,
    retries: 2,
    retryDelay: 2000,
    timeout: 15000, // Shorter timeout for API calls
  });
}

/**
 * Fetch with offline detection and retry for game assets
 */
export async function fetchAsset(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetchWithRetry(url, {
    ...options,
    retries: 2,
    retryDelay: 1000,
    timeout: 10000,
    offlineFallback: () => {
      // Return empty response for missing assets
      console.warn(`Asset unavailable offline: ${url}`);
      return null;
    }
  });
}

