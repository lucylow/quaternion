/**
 * Professional Game Loop Implementation
 * 
 * Implements a hybrid fixed/variable timestep approach:
 * - Fixed timestep for game logic (deterministic, stable)
 * - Variable timestep for rendering (smooth, responsive)
 * - Performance monitoring and adaptive quality
 */

export enum GameLoopState {
  Uninitialized = 'uninitialized',
  Initializing = 'initializing',
  Running = 'running',
  Paused = 'paused',
  ShuttingDown = 'shutting_down',
  Error = 'error'
}

export interface GameLoopConfig {
  fixedTimestep: number; // Fixed update interval (default: 1/60 = 60 FPS)
  maxFrameSkip: number; // Maximum updates per frame to prevent spiral of death
  maxDeltaTime: number; // Maximum delta time for variable updates (default: 0.1s)
  targetFPS: number; // Target frame rate for rendering (default: 60)
  enablePerformanceMonitoring: boolean;
  enableAdaptiveQuality: boolean;
}

export interface PerformanceStats {
  fps: number;
  ups: number; // Updates per second (fixed timestep)
  frameTime: number; // Average frame time in ms
  updateTime: number; // Average update time in ms
  renderTime: number; // Average render time in ms
  fixedUpdateTime: number; // Average fixed update time in ms
  droppedFrames: number;
  qualityLevel: number; // 0-1, adaptive quality scaling
}

export interface GameLoopCallbacks {
  initialize?: () => void | Promise<void>;
  fixedUpdate?: (deltaTime: number) => void;
  variableUpdate?: (deltaTime: number) => void;
  render?: (interpolation: number) => void;
  cleanup?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

export class GameLoop {
  private state: GameLoopState = GameLoopState.Uninitialized;
  private config: Required<GameLoopConfig>;
  private callbacks: GameLoopCallbacks;
  
  // Timing
  private lastTime: number = 0;
  private accumulatedTime: number = 0;
  private frameTime: number = 0;
  private lastFrameTime: number = 0;
  
  // Performance monitoring
  private performanceStats: PerformanceStats;
  private frameTimeHistory: number[] = [];
  private updateTimeHistory: number[] = [];
  private renderTimeHistory: number[] = [];
  private fixedUpdateCount: number = 0;
  private frameCount: number = 0;
  private lastStatsUpdate: number = 0;
  
  // Animation frame
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  
  // Error handling
  private errorMessage: string | null = null;
  
  constructor(config: Partial<GameLoopConfig> = {}, callbacks: GameLoopCallbacks = {}) {
    this.config = {
      fixedTimestep: config.fixedTimestep ?? 1.0 / 60.0,
      maxFrameSkip: config.maxFrameSkip ?? 5,
      maxDeltaTime: config.maxDeltaTime ?? 0.1,
      targetFPS: config.targetFPS ?? 60,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      enableAdaptiveQuality: config.enableAdaptiveQuality ?? true
    };
    
    this.callbacks = callbacks;
    
    this.performanceStats = {
      fps: 0,
      ups: 0,
      frameTime: 0,
      updateTime: 0,
      renderTime: 0,
      fixedUpdateTime: 0,
      droppedFrames: 0,
      qualityLevel: 1.0
    };
  }
  
  /**
   * Initialize the game loop
   */
  async initialize(): Promise<void> {
    if (this.state !== GameLoopState.Uninitialized) {
      throw new Error('Game loop already initialized');
    }
    
    try {
      this.state = GameLoopState.Initializing;
      
      if (this.callbacks.initialize) {
        await this.callbacks.initialize();
      }
      
      this.state = GameLoopState.Running;
      this.lastTime = this.getCurrentTime();
      this.lastFrameTime = this.lastTime;
      this.lastStatsUpdate = this.lastTime;
      
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }
  
  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Game loop is already running');
      return;
    }
    
    if (this.state === GameLoopState.Uninitialized) {
      throw new Error('Game loop must be initialized before starting');
    }
    
    if (this.state === GameLoopState.Error) {
      throw new Error(`Game loop is in error state: ${this.errorMessage}`);
    }
    
    this.isRunning = true;
    this.state = GameLoopState.Running;
    this.lastTime = this.getCurrentTime();
    this.lastFrameTime = this.lastTime;
    
    this.tick();
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.state = GameLoopState.ShuttingDown;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Pause the game loop
   */
  pause(): void {
    if (this.state === GameLoopState.Running) {
      this.state = GameLoopState.Paused;
    }
  }
  
  /**
   * Resume the game loop
   */
  resume(): void {
    if (this.state === GameLoopState.Paused) {
      this.state = GameLoopState.Running;
      this.lastTime = this.getCurrentTime();
      this.lastFrameTime = this.lastTime;
    }
  }
  
  /**
   * Main game loop tick (called by requestAnimationFrame)
   */
  private tick = (): void => {
    if (!this.isRunning) {
      return;
    }
    
    try {
      const currentTime = this.getCurrentTime();
      const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
      this.lastTime = currentTime;
      
      // Clamp delta time to prevent spiral of death
      const clampedDelta = Math.min(deltaTime, this.config.maxDeltaTime);
      
      if (this.state === GameLoopState.Running) {
        // Accumulate time for fixed timestep
        this.accumulatedTime += clampedDelta;
        this.frameTime = clampedDelta;
        
        // Process fixed updates
        const fixedUpdateStart = performance.now();
        let updateCount = 0;
        
        while (this.accumulatedTime >= this.config.fixedTimestep && 
               updateCount < this.config.maxFrameSkip) {
          
          if (this.callbacks.fixedUpdate) {
            this.callbacks.fixedUpdate(this.config.fixedTimestep);
          }
          
          this.accumulatedTime -= this.config.fixedTimestep;
          this.fixedUpdateCount++;
          updateCount++;
        }
        
        const fixedUpdateEnd = performance.now();
        
        // Variable updates (non-critical systems)
        if (this.callbacks.variableUpdate) {
          this.callbacks.variableUpdate(this.frameTime);
        }
        
        // Calculate interpolation for smooth rendering
        const interpolation = this.accumulatedTime / this.config.fixedTimestep;
        
        // Render with interpolation
        const renderStart = performance.now();
        if (this.callbacks.render) {
          this.callbacks.render(interpolation);
        }
        const renderEnd = performance.now();
        
        // Update performance stats
        if (this.config.enablePerformanceMonitoring) {
          this.updatePerformanceStats(
            clampedDelta * 1000,
            (fixedUpdateEnd - fixedUpdateStart) / updateCount || 0,
            renderEnd - renderStart
          );
        }
        
        // Adaptive quality adjustment
        if (this.config.enableAdaptiveQuality && this.state === GameLoopState.Running) {
          this.adjustQuality();
        }
      } else if (this.state === GameLoopState.Paused) {
        // Still render when paused (for pause menus, etc.)
        if (this.callbacks.render) {
          this.callbacks.render(0);
        }
      }
      
      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(this.tick);
      
    } catch (error) {
      this.handleError(error as Error);
    }
  };
  
  /**
   * Update performance statistics
   */
  private updatePerformanceStats(
    frameTimeMs: number,
    fixedUpdateTimeMs: number,
    renderTimeMs: number
  ): void {
    const currentTime = this.getCurrentTime();
    
    // Track frame times
    this.frameTimeHistory.push(frameTimeMs);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }
    
    if (fixedUpdateTimeMs > 0) {
      this.updateTimeHistory.push(fixedUpdateTimeMs);
      if (this.updateTimeHistory.length > 60) {
        this.updateTimeHistory.shift();
      }
    }
    
    this.renderTimeHistory.push(renderTimeMs);
    if (this.renderTimeHistory.length > 60) {
      this.renderTimeHistory.shift();
    }
    
    // Update stats every second
    if (currentTime - this.lastStatsUpdate >= 1000) {
      const targetFrameTime = 1000 / this.config.targetFPS;
      
      // Calculate FPS
      this.performanceStats.fps = this.frameCount;
      this.frameCount = 0;
      
      // Calculate UPS (updates per second)
      this.performanceStats.ups = this.fixedUpdateCount;
      this.fixedUpdateCount = 0;
      
      // Calculate average times
      if (this.frameTimeHistory.length > 0) {
        this.performanceStats.frameTime = 
          this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      }
      
      if (this.updateTimeHistory.length > 0) {
        this.performanceStats.updateTime = 
          this.updateTimeHistory.reduce((a, b) => a + b, 0) / this.updateTimeHistory.length;
        this.performanceStats.fixedUpdateTime = this.performanceStats.updateTime;
      }
      
      if (this.renderTimeHistory.length > 0) {
        this.performanceStats.renderTime = 
          this.renderTimeHistory.reduce((a, b) => a + b, 0) / this.renderTimeHistory.length;
      }
      
      // Count dropped frames (frames that took longer than target frame time)
      this.performanceStats.droppedFrames = this.frameTimeHistory.filter(
        t => t > targetFrameTime * 1.1
      ).length;
      
      this.lastStatsUpdate = currentTime;
    }
    
    this.frameCount++;
  }
  
  /**
   * Adaptive quality adjustment based on performance
   */
  private adjustQuality(): void {
    if (this.frameTimeHistory.length < 30) {
      return; // Need some data before adjusting
    }
    
    const averageFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / 
                            this.frameTimeHistory.length;
    const targetFrameTime = 1000 / this.config.targetFPS;
    
    // If consistently dropping below target, reduce quality
    if (averageFrameTime > targetFrameTime * 1.2) {
      // Reduce quality
      this.performanceStats.qualityLevel = Math.max(
        0.5,
        this.performanceStats.qualityLevel - 0.05
      );
    } 
    // If consistently above target with headroom, increase quality
    else if (averageFrameTime < targetFrameTime * 0.8 && 
             this.performanceStats.qualityLevel < 1.0) {
      // Increase quality
      this.performanceStats.qualityLevel = Math.min(
        1.0,
        this.performanceStats.qualityLevel + 0.02
      );
    }
  }
  
  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.state = GameLoopState.Error;
    this.errorMessage = error.message;
    
    console.error('Game loop error:', error);
    
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    } else {
      // Default error handling
      this.stop();
      throw error;
    }
  }
  
  /**
   * Get current time in milliseconds
   */
  private getCurrentTime(): number {
    return performance.now();
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stop();
    
    if (this.callbacks.cleanup) {
      await this.callbacks.cleanup();
    }
    
    this.state = GameLoopState.Uninitialized;
    this.frameTimeHistory = [];
    this.updateTimeHistory = [];
    this.renderTimeHistory = [];
  }
  
  /**
   * Get current state
   */
  getState(): GameLoopState {
    return this.state;
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats };
  }
  
  /**
   * Check if the game loop is running
   */
  isGameRunning(): boolean {
    return this.isRunning && this.state === GameLoopState.Running;
  }
  
  /**
   * Check if the game is paused
   */
  isPaused(): boolean {
    return this.state === GameLoopState.Paused;
  }
  
  /**
   * Get quality level (0-1)
   */
  getQualityLevel(): number {
    return this.performanceStats.qualityLevel;
  }
  
  /**
   * Manually set quality level (0-1)
   */
  setQualityLevel(level: number): void {
    this.performanceStats.qualityLevel = Math.max(0, Math.min(1, level));
  }
}

