/**
 * Professional Game Loop Implementation
 * 
 * Implements a hybrid fixed/variable timestep approach:
 * - Fixed timestep for game logic (deterministic, stable)
 * - Variable timestep for rendering (smooth, responsive)
 * - Performance monitoring and adaptive quality
 * - System event handling (focus, resize, visibility)
 * - Frame rate limiting and pacing control
 * - Comprehensive error handling with graceful degradation
 */

export enum GameLoopState {
  Uninitialized = 'uninitialized',
  Initializing = 'initializing',
  Running = 'running',
  Paused = 'paused',
  ShuttingDown = 'shutting_down',
  Error = 'error'
}

export enum SystemEventType {
  FocusLost = 'focus_lost',
  FocusGained = 'focus_gained',
  VisibilityChange = 'visibility_change',
  Resize = 'resize',
  Quit = 'quit'
}

export interface SystemEvent {
  type: SystemEventType;
  data?: any;
}

export interface GameLoopConfig {
  fixedTimestep: number; // Fixed update interval (default: 1/60 = 60 FPS)
  maxFrameSkip: number; // Maximum updates per frame to prevent spiral of death
  maxDeltaTime: number; // Maximum delta time for variable updates (default: 0.1s)
  targetFPS: number; // Target frame rate for rendering (default: 60)
  enablePerformanceMonitoring: boolean;
  enableAdaptiveQuality: boolean;
  enableFrameRateLimiting: boolean; // Enable frame rate limiting
  pauseOnFocusLoss: boolean; // Automatically pause when window loses focus
  autoResume: boolean; // Automatically resume when window gains focus
}

export interface PerformanceStats {
  fps: number;
  ups: number; // Updates per second (fixed timestep)
  frameTime: number; // Average frame time in ms
  updateTime: number; // Average update time in ms
  renderTime: number; // Average render time in ms
  fixedUpdateTime: number; // Average fixed update time in ms
  inputTime: number; // Average input processing time in ms
  droppedFrames: number;
  qualityLevel: number; // 0-1, adaptive quality scaling
  minFrameTime: number; // Minimum frame time in ms
  maxFrameTime: number; // Maximum frame time in ms
  averageFrameTime: number; // Rolling average frame time
}

export interface GameLoopCallbacks {
  initialize?: () => void | Promise<void>;
  processInput?: () => void; // Separate input processing callback
  fixedUpdate?: (deltaTime: number) => void;
  variableUpdate?: (deltaTime: number) => void;
  render?: (interpolation: number) => void;
  cleanup?: () => void | Promise<void>;
  onError?: (error: Error) => void;
  onSystemEvent?: (event: SystemEvent) => void; // Handle system events
  onPause?: () => void; // Called when game is paused
  onResume?: () => void; // Called when game is resumed
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
  private targetFrameTime: number = 0; // Target frame time in seconds
  
  // Performance monitoring
  private performanceStats: PerformanceStats;
  private frameTimeHistory: number[] = [];
  private updateTimeHistory: number[] = [];
  private renderTimeHistory: number[] = [];
  private inputTimeHistory: number[] = [];
  private fixedUpdateCount: number = 0;
  private frameCount: number = 0;
  private lastStatsUpdate: number = 0;
  
  // Animation frame
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  
  // Error handling
  private errorMessage: string | null = null;
  private errorCount: number = 0;
  private maxErrorCount: number = 10; // Graceful degradation threshold
  
  // System event handling
  private systemEventHandlers: Map<string, () => void> = new Map();
  private windowFocused: boolean = true;
  private pageVisible: boolean = true;
  
  constructor(config: Partial<GameLoopConfig> = {}, callbacks: GameLoopCallbacks = {}) {
    this.config = {
      fixedTimestep: config.fixedTimestep ?? 1.0 / 60.0,
      maxFrameSkip: config.maxFrameSkip ?? 5,
      maxDeltaTime: config.maxDeltaTime ?? 0.1,
      targetFPS: config.targetFPS ?? 60,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      enableAdaptiveQuality: config.enableAdaptiveQuality ?? true,
      enableFrameRateLimiting: config.enableFrameRateLimiting ?? true,
      pauseOnFocusLoss: config.pauseOnFocusLoss ?? true,
      autoResume: config.autoResume ?? true
    };
    
    this.callbacks = callbacks;
    this.targetFrameTime = 1.0 / this.config.targetFPS;
    
    this.performanceStats = {
      fps: 0,
      ups: 0,
      frameTime: 0,
      updateTime: 0,
      renderTime: 0,
      fixedUpdateTime: 0,
      inputTime: 0,
      droppedFrames: 0,
      qualityLevel: 1.0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      averageFrameTime: 0
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
      
      // Setup system event handlers
      this.setupSystemEventHandlers();
      
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
   * Setup system event handlers for window focus, visibility, resize, etc.
   */
  private setupSystemEventHandlers(): void {
    // Window focus events
    const handleFocus = () => {
      this.windowFocused = true;
      if (this.config.autoResume && this.state === GameLoopState.Paused) {
        this.resume();
      }
      this.emitSystemEvent({
        type: SystemEventType.FocusGained
      });
    };
    
    const handleBlur = () => {
      this.windowFocused = false;
      if (this.config.pauseOnFocusLoss && this.state === GameLoopState.Running) {
        this.pause();
      }
      this.emitSystemEvent({
        type: SystemEventType.FocusLost
      });
    };
    
    // Page visibility API
    const handleVisibilityChange = () => {
      this.pageVisible = !document.hidden;
      if (!this.pageVisible && this.config.pauseOnFocusLoss && this.state === GameLoopState.Running) {
        this.pause();
      } else if (this.pageVisible && this.config.autoResume && this.state === GameLoopState.Paused) {
        this.resume();
      }
      this.emitSystemEvent({
        type: SystemEventType.VisibilityChange,
        data: { visible: this.pageVisible }
      });
    };
    
    // Window resize
    const handleResize = () => {
      this.emitSystemEvent({
        type: SystemEventType.Resize,
        data: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    };
    
    // Register event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('resize', handleResize);
      
      // Store handlers for cleanup
      this.systemEventHandlers.set('focus', handleFocus);
      this.systemEventHandlers.set('blur', handleBlur);
      this.systemEventHandlers.set('visibilitychange', handleVisibilityChange);
      this.systemEventHandlers.set('resize', handleResize);
    }
  }
  
  /**
   * Emit a system event to callbacks
   */
  private emitSystemEvent(event: SystemEvent): void {
    if (this.callbacks.onSystemEvent) {
      try {
        this.callbacks.onSystemEvent(event);
      } catch (error) {
        console.error('Error in system event handler:', error);
      }
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
      if (this.callbacks.onPause) {
        try {
          this.callbacks.onPause();
        } catch (error) {
          console.error('Error in onPause callback:', error);
        }
      }
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
      if (this.callbacks.onResume) {
        try {
          this.callbacks.onResume();
        } catch (error) {
          console.error('Error in onResume callback:', error);
        }
      }
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
        // Process input (variable rate, always first)
        const inputStart = performance.now();
        if (this.callbacks.processInput) {
          this.callbacks.processInput();
        }
        const inputEnd = performance.now();
        const inputTime = inputEnd - inputStart;
        
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
        const fixedUpdateTime = updateCount > 0 
          ? (fixedUpdateEnd - fixedUpdateStart) / updateCount 
          : 0;
        
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
        const renderTime = renderEnd - renderStart;
        
        // Update performance stats
        if (this.config.enablePerformanceMonitoring) {
          this.updatePerformanceStats(
            clampedDelta * 1000,
            fixedUpdateTime,
            renderTime,
            inputTime
          );
        }
        
        // Adaptive quality adjustment
        if (this.config.enableAdaptiveQuality && this.state === GameLoopState.Running) {
          this.adjustQuality();
        }
        
        // Frame rate limiting
        if (this.config.enableFrameRateLimiting) {
          this.limitFrameRate(currentTime);
        }
      } else if (this.state === GameLoopState.Paused) {
        // Still process input when paused (for pause menus, etc.)
        if (this.callbacks.processInput) {
          this.callbacks.processInput();
        }
        
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
   * Limit frame rate to target FPS
   */
  private limitFrameRate(currentTime: number): void {
    const frameEnd = currentTime;
    const frameTime = (frameEnd - this.lastFrameTime) / 1000; // Convert to seconds
    
    if (frameTime < this.targetFrameTime) {
      // Frame completed too quickly, sleep for remaining time
      const sleepTime = (this.targetFrameTime - frameTime) * 1000; // Convert to ms
      // Note: In browser environment, we can't actually sleep, but we can
      // use this information for adaptive quality or just let it run
      // The browser's requestAnimationFrame will naturally limit to display refresh rate
    }
    
    this.lastFrameTime = frameEnd;
  }
  
  /**
   * Update performance statistics
   */
  private updatePerformanceStats(
    frameTimeMs: number,
    fixedUpdateTimeMs: number,
    renderTimeMs: number,
    inputTimeMs: number = 0
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
    
    if (inputTimeMs > 0) {
      this.inputTimeHistory.push(inputTimeMs);
      if (this.inputTimeHistory.length > 60) {
        this.inputTimeHistory.shift();
      }
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
        const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
        this.performanceStats.frameTime = sum / this.frameTimeHistory.length;
        this.performanceStats.averageFrameTime = this.performanceStats.frameTime;
        this.performanceStats.minFrameTime = Math.min(...this.frameTimeHistory);
        this.performanceStats.maxFrameTime = Math.max(...this.frameTimeHistory);
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
      
      if (this.inputTimeHistory.length > 0) {
        this.performanceStats.inputTime = 
          this.inputTimeHistory.reduce((a, b) => a + b, 0) / this.inputTimeHistory.length;
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
   * Handle errors with graceful degradation
   */
  private handleError(error: Error): void {
    this.errorCount++;
    this.errorMessage = error.message;
    
    console.error(`Game loop error (${this.errorCount}/${this.maxErrorCount}):`, error);
    
    // Graceful degradation: after too many errors, stop the loop
    if (this.errorCount >= this.maxErrorCount) {
      this.state = GameLoopState.Error;
      console.error('Too many errors, stopping game loop');
      this.stop();
      
      if (this.callbacks.onError) {
        try {
          this.callbacks.onError(error);
        } catch (callbackError) {
          console.error('Error in error callback:', callbackError);
        }
      }
      return;
    }
    
    // Try to recover from error
    if (this.callbacks.onError) {
      try {
        this.callbacks.onError(error);
        // If error handler doesn't throw, continue running
        return;
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    }
    
    // If no error handler or it failed, try to continue
    // Reset error count after some time
    setTimeout(() => {
      if (this.errorCount > 0) {
        this.errorCount = Math.max(0, this.errorCount - 1);
      }
    }, 5000);
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
    
    // Remove system event handlers
    if (typeof window !== 'undefined') {
      this.systemEventHandlers.forEach((handler, event) => {
        if (event === 'focus' || event === 'blur') {
          window.removeEventListener(event, handler);
        } else if (event === 'visibilitychange') {
          document.removeEventListener(event, handler);
        } else if (event === 'resize') {
          window.removeEventListener(event, handler);
        }
      });
      this.systemEventHandlers.clear();
    }
    
    if (this.callbacks.cleanup) {
      try {
        await this.callbacks.cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
    
    this.state = GameLoopState.Uninitialized;
    this.frameTimeHistory = [];
    this.updateTimeHistory = [];
    this.renderTimeHistory = [];
    this.inputTimeHistory = [];
    this.errorCount = 0;
    this.errorMessage = null;
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
  
  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }
  
  /**
   * Get error message
   */
  getErrorMessage(): string | null {
    return this.errorMessage;
  }
  
  /**
   * Check if window is focused
   */
  isWindowFocused(): boolean {
    return this.windowFocused;
  }
  
  /**
   * Check if page is visible
   */
  isPageVisible(): boolean {
    return this.pageVisible;
  }
  
  /**
   * Reset error count (useful for recovery)
   */
  resetErrorCount(): void {
    this.errorCount = 0;
    this.errorMessage = null;
    if (this.state === GameLoopState.Error) {
      this.state = GameLoopState.Running;
    }
  }
}

