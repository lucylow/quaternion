/**
 * Telemetry and Metrics Collection
 * Collects performance and quality metrics for production value assessment
 */

export interface TelemetryMetrics {
  startupTime: number; // seconds to main menu
  fps: number[]; // FPS samples during demo
  memoryUsage: number; // MB at peak
  loadTime: number; // seconds to fully loaded
  bundleSize: number; // MB
  crashCount: number;
  subtitleCoverage: number; // percentage of VO lines subtitled
  polishRating: number; // 1-10 Likert scale
}

export interface PerformanceSample {
  timestamp: number;
  fps: number;
  memory: number;
  frameTime: number;
}

class TelemetryCollector {
  private metrics: Partial<TelemetryMetrics> = {};
  private performanceSamples: PerformanceSample[] = [];
  private startTime: number = 0;
  private fpsSamples: number[] = [];
  private maxSamples: number = 1000; // Limit samples to prevent memory issues
  private isCollecting: boolean = false;

  /**
   * Start collecting metrics
   */
  public start(): void {
    this.startTime = performance.now();
    this.isCollecting = true;
    this.metrics.startupTime = 0;
    this.fpsSamples = [];
    this.performanceSamples = [];

    // Start FPS monitoring
    this.monitorFPS();
    
    // Start memory monitoring
    this.monitorMemory();
  }

  /**
   * Record startup complete
   */
  public recordStartupComplete(): void {
    if (this.startTime > 0) {
      this.metrics.startupTime = (performance.now() - this.startTime) / 1000;
    }
  }

  /**
   * Record load complete
   */
  public recordLoadComplete(): void {
    if (this.startTime > 0) {
      this.metrics.loadTime = (performance.now() - this.startTime) / 1000;
    }
  }

  /**
   * Record crash
   */
  public recordCrash(error: Error): void {
    this.metrics.crashCount = (this.metrics.crashCount || 0) + 1;
    
    // Log crash details
    console.error('Crash recorded:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Send to crash reporting service (if configured)
    this.reportCrash(error);
  }

  /**
   * Record subtitle coverage
   */
  public recordSubtitleCoverage(covered: number, total: number): void {
    this.metrics.subtitleCoverage = total > 0 ? (covered / total) * 100 : 0;
  }

  /**
   * Record polish rating
   */
  public recordPolishRating(rating: number): void {
    this.metrics.polishRating = Math.max(1, Math.min(10, rating));
  }

  /**
   * Monitor FPS
   */
  private monitorFPS(): void {
    if (!this.isCollecting) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let lastFPSUpdate = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      const delta = currentTime - lastFPSUpdate;

      // Update FPS every second
      if (delta >= 1000) {
        const fps = (frameCount * 1000) / delta;
        this.fpsSamples.push(fps);
        
        // Limit sample size
        if (this.fpsSamples.length > this.maxSamples) {
          this.fpsSamples.shift();
        }

        frameCount = 0;
        lastFPSUpdate = currentTime;
      }

      lastTime = currentTime;
      
      if (this.isCollecting) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Monitor memory usage
   */
  private monitorMemory(): void {
    if (!this.isCollecting) return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        
        // Update peak memory
        if (!this.metrics.memoryUsage || usedMB > this.metrics.memoryUsage) {
          this.metrics.memoryUsage = usedMB;
        }

        // Record sample
        this.performanceSamples.push({
          timestamp: performance.now(),
          fps: this.fpsSamples[this.fpsSamples.length - 1] || 0,
          memory: usedMB,
          frameTime: 0, // Would calculate from FPS
        });

        // Limit sample size
        if (this.performanceSamples.length > this.maxSamples) {
          this.performanceSamples.shift();
        }
      }

      if (this.isCollecting) {
        setTimeout(checkMemory, 1000); // Check every second
      }
    };

    checkMemory();
  }

  /**
   * Get average FPS
   */
  public getAverageFPS(): number {
    if (this.fpsSamples.length === 0) return 0;
    const sum = this.fpsSamples.reduce((a, b) => a + b, 0);
    return sum / this.fpsSamples.length;
  }

  /**
   * Get metrics summary
   */
  public getMetrics(): TelemetryMetrics {
    return {
      startupTime: this.metrics.startupTime || 0,
      fps: this.fpsSamples,
      memoryUsage: this.metrics.memoryUsage || 0,
      loadTime: this.metrics.loadTime || 0,
      bundleSize: this.getBundleSize(),
      crashCount: this.metrics.crashCount || 0,
      subtitleCoverage: this.metrics.subtitleCoverage || 0,
      polishRating: this.metrics.polishRating || 0,
    };
  }

  /**
   * Get bundle size (approximate)
   */
  private getBundleSize(): number {
    // Calculate from performance entries
    let totalSize = 0;
    
    if ('getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      resources.forEach(resource => {
        if (resource.transferSize) {
          totalSize += resource.transferSize;
        }
      });
    }

    return totalSize / 1024 / 1024; // Convert to MB
  }

  /**
   * Export metrics as JSON
   */
  public exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }

  /**
   * Report crash to external service
   */
  private reportCrash(error: Error): void {
    // Would integrate with Sentry, LogRocket, or similar
    // For now, just log to console
    console.error('Crash report:', {
      error: error.message,
      stack: error.stack,
      metrics: this.getMetrics(),
    });
  }

  /**
   * Stop collecting
   */
  public stop(): void {
    this.isCollecting = false;
  }
}

// Singleton instance
export const telemetry = new TelemetryCollector();

// Auto-start on module load
if (typeof window !== 'undefined') {
  telemetry.start();
}

