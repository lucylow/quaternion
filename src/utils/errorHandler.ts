/**
 * Error Handler and Crash Reporting
 * Provides graceful error handling and crash reporting for production
 */

import { telemetry } from './telemetry';

export interface ErrorContext {
  component?: string;
  action?: string;
  gameState?: any;
  userAgent?: string;
  timestamp?: string;
}

class ErrorHandler {
  private errorListeners: Array<(error: Error, context: ErrorContext) => void> = [];
  private isInitialized: boolean = false;

  /**
   * Initialize error handler
   */
  public initialize(): void {
    if (this.isInitialized) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(
        new Error(event.message),
        {
          component: 'global',
          action: 'unhandled_error',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }
      );
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.handleError(error, {
        component: 'global',
        action: 'unhandled_promise_rejection',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    });

    this.isInitialized = true;
  }

  /**
   * Handle error
   */
  public handleError(error: Error, context: ErrorContext = {}): void {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error:', error, 'Context:', context);
    }

    // Record in telemetry
    telemetry.recordCrash(error);

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    // Show user-friendly error message
    this.showUserError(error, context);
  }

  /**
   * Show user-friendly error message
   */
  private showUserError(error: Error, context: ErrorContext): void {
    // Don't show errors for known non-critical issues
    if (this.isNonCriticalError(error)) {
      return;
    }

    // Create error notification
    const errorMessage = this.getUserFriendlyMessage(error);
    
    // Would integrate with toast/notification system
    // For now, log to console
    console.error('User-facing error:', errorMessage);
    
    // Could dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('app:error', {
      detail: { message: errorMessage, error, context }
    }));
  }

  /**
   * Check if error is non-critical
   */
  private isNonCriticalError(error: Error): boolean {
    const nonCriticalPatterns = [
      /ResizeObserver/i,
      /Network request failed/i,
      /Failed to fetch/i,
    ];

    return nonCriticalPatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: Error): string {
    // Map technical errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      'NetworkError': 'Connection issue. Please check your internet connection.',
      'TypeError': 'An unexpected error occurred. Please try refreshing the page.',
      'ReferenceError': 'An error occurred. Please try refreshing the page.',
      'RangeError': 'An error occurred. Please try refreshing the page.',
    };

    const errorType = error.constructor.name;
    return errorMessages[errorType] || 'An unexpected error occurred. Please try refreshing the page.';
  }

  /**
   * Add error listener
   */
  public onError(listener: (error: Error, context: ErrorContext) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  public removeErrorListener(listener: (error: Error, context: ErrorContext) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Wrap async function with error handling
   */
  public wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: ErrorContext = {}
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(
          error instanceof Error ? error : new Error(String(error)),
          { ...context, action: fn.name }
        );
        throw error;
      }
    }) as T;
  }

  /**
   * Wrap sync function with error handling
   */
  public wrapSync<T extends (...args: any[]) => any>(
    fn: T,
    context: ErrorContext = {}
  ): T {
    return ((...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handleError(
          error instanceof Error ? error : new Error(String(error)),
          { ...context, action: fn.name }
        );
        throw error;
      }
    }) as T;
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Auto-initialize
if (typeof window !== 'undefined') {
  errorHandler.initialize();
}

