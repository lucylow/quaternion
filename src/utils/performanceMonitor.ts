/**
 * Performance monitoring utilities for desktop web browser optimization
 * Tracks FPS, load times, and memory usage
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  loadTime: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

class PerformanceMonitor {
  private fps = 0;
  private frameCount = 0;
  private lastTime = performance.now();
  private frameTime = 0;
  private startTime = performance.now();
  private loadTime = 0;
  private rafId: number | null = null;
  private metrics: PerformanceMetrics;

  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      loadTime: 0,
    };
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Measure load time
    window.addEventListener('load', () => {
      this.loadTime = performance.now() - this.startTime;
      this.metrics.loadTime = this.loadTime;

      // Measure First Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                this.metrics.firstContentfulPaint = entry.startTime;
              }
            }
          });
          observer.observe({ entryTypes: ['paint'] });
        } catch (e) {
          // PerformanceObserver not supported
        }
      }

      // Measure Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            this.metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // PerformanceObserver not supported
        }
      }
    });
  }

  start() {
    if (this.rafId !== null) return;

    const measure = () => {
      const now = performance.now();
      const delta = now - this.lastTime;
      
      this.frameCount++;
      this.frameTime = delta;

      // Update FPS every second
      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastTime = now;

        // Update memory usage if available
        if ('memory' in performance) {
          const mem = (performance as any).memory;
          this.metrics.memoryUsage = mem.usedJSHeapSize / 1048576; // Convert to MB
        }

        this.metrics.fps = this.fps;
        this.metrics.frameTime = this.frameTime;
      }

      this.rafId = requestAnimationFrame(measure);
    };

    this.rafId = requestAnimationFrame(measure);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getFPS(): number {
    return this.fps;
  }

  getFrameTime(): number {
    return this.frameTime;
  }

  logMetrics() {
    console.log('Performance Metrics:', {
      FPS: this.metrics.fps,
      'Frame Time (ms)': this.metrics.frameTime.toFixed(2),
      'Load Time (ms)': this.metrics.loadTime.toFixed(2),
      'First Contentful Paint (ms)': this.metrics.firstContentfulPaint?.toFixed(2) || 'N/A',
      'Largest Contentful Paint (ms)': this.metrics.largestContentfulPaint?.toFixed(2) || 'N/A',
      'Memory Usage (MB)': this.metrics.memoryUsage?.toFixed(2) || 'N/A',
    });
  }
}

// Singleton instance
let monitorInstance: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
};

// Auto-start in production for monitoring
if (import.meta.env.PROD) {
  const monitor = getPerformanceMonitor();
  monitor.start();
  
  // Log metrics every 10 seconds in production
  setInterval(() => {
    if (import.meta.env.DEV) {
      monitor.logMetrics();
    }
  }, 10000);
}


