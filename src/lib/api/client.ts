/**
 * Centralized API Client
 * Provides type-safe, robust API communication with error handling, retries, and interceptors
 */

import { API_CONFIG } from './config';
import type { RequestConfig, ResponseWrapper, ApiError } from './types';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];

  constructor(baseUrl: string = API_CONFIG.GAME_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  private applyRequestInterceptors(config: RequestConfig): RequestConfig {
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = interceptor(finalConfig);
    }
    return finalConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let finalResponse = response;
    for (const interceptor of this.responseInterceptors) {
      finalResponse = await interceptor(finalResponse);
    }
    return finalResponse;
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(status: number): boolean {
    // Retry on network errors, timeouts, and 5xx errors
    return status === 0 || status >= 500 || status === 429;
  }


  /**
   * Core request method with retry logic
   */
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ResponseWrapper<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONFIG.TIMEOUT,
      retries = API_CONFIG.RETRY_ATTEMPTS,
      retryDelay = API_CONFIG.RETRY_DELAY,
      signal,
    } = config;

    // Build full URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Prepare config with interceptors
    const requestConfig: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      signal,
    };

    if (body) {
      requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Apply request interceptors
    const finalConfig = this.applyRequestInterceptors({
      method,
      headers: requestConfig.headers as Record<string, string>,
      body,
      timeout,
      retries,
      retryDelay,
      signal,
    });

    // Update request config if interceptor modified it
    if (finalConfig.headers) {
      requestConfig.headers = finalConfig.headers as HeadersInit;
    }
    if (finalConfig.body) {
      requestConfig.body = typeof finalConfig.body === 'string' 
        ? finalConfig.body 
        : JSON.stringify(finalConfig.body);
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= finalConfig.retries!) {
      try {
        // Log request if enabled
        if (API_CONFIG.ENABLE_REQUEST_LOGGING) {
          console.log(`[API] ${method} ${url}`, { attempt: attempt + 1, body });
        }

        // Create abort controller for timeout
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, timeout);
        
        // Combine abort signals
        if (signal) {
          signal.addEventListener('abort', () => {
            abortController.abort();
            clearTimeout(timeoutId);
          });
        }

        // Make request with timeout
        const fetchPromise = fetch(url, {
          ...requestConfig,
          signal: abortController.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });

        const response = await fetchPromise;

        // Apply response interceptors
        const finalResponse = await this.applyResponseInterceptors(response);

        // Handle HTTP errors
        if (!finalResponse.ok) {
          const errorData = await this.parseErrorResponse(finalResponse);
          
          // Retry if error is retryable and we have retries left
          if (this.isRetryableError(finalResponse.status) && attempt < finalConfig.retries!) {
            attempt++;
            await this.sleep(finalConfig.retryDelay! * attempt); // Exponential backoff
            continue;
          }

          throw this.createApiError(errorData, finalResponse.status);
        }

        // Parse successful response
        const data = await this.parseResponse<T>(finalResponse);

        if (API_CONFIG.ENABLE_REQUEST_LOGGING) {
          console.log(`[API] ${method} ${url} - Success`, { data });
        }

        return {
          data,
          status: finalResponse.status,
          headers: finalResponse.headers,
          ok: true,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort
        if (error instanceof Error && error.name === 'AbortError') {
          throw this.createApiError({ message: 'Request aborted' }, 0);
        }

        // Retry on network errors
        if (attempt < finalConfig.retries!) {
          attempt++;
          await this.sleep(finalConfig.retryDelay! * attempt);
          continue;
        }

        // All retries exhausted
        throw this.createApiError(
          { message: lastError.message || 'Request failed' },
          0
        );
      }
    }

    // Should never reach here, but TypeScript needs it
    throw this.createApiError(
      { message: lastError?.message || 'Request failed after retries' },
      0
    );
  }

  /**
   * Parse response body
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    const text = await response.text();
    
    // Try to parse as JSON anyway
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  /**
   * Parse error response
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return { message: response.statusText || 'Request failed' };
    }
  }

  /**
   * Create standardized API error
   */
  private createApiError(errorData: any, status: number): ApiError {
    return {
      message: errorData.message || errorData.error || 'An error occurred',
      code: errorData.code,
      status,
      details: errorData.details || errorData,
    };
  }

  /**
   * Convenience methods
   */
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ResponseWrapper<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ResponseWrapper<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ResponseWrapper<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ResponseWrapper<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ResponseWrapper<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Add default interceptors

// Request logging interceptor
if (API_CONFIG.ENABLE_REQUEST_LOGGING) {
  apiClient.addRequestInterceptor((config) => {
    // Could add auth tokens, timestamps, etc. here
    return config;
  });
}

// Error reporting interceptor
if (API_CONFIG.ENABLE_ERROR_REPORTING) {
  apiClient.addResponseInterceptor(async (response) => {
    if (!response.ok && response.status >= 500) {
      // Could integrate with error tracking service (Sentry, etc.)
      console.error('[API Error]', {
        status: response.status,
        url: response.url,
        statusText: response.statusText,
      });
    }
    return response;
  });
}

export default apiClient;

