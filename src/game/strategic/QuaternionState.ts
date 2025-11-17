/**
 * QuaternionState - Core 4-axis game state tracking
 * Represents the four interlinked variables: Ore (Matter), Energy, Biomass (Life), Data (Knowledge)
 */

export interface QuaternionState {
  // Four Axes - Core Resources
  ore: number;           // Matter - Industrial capacity
  energy: number;        // Energy - Power grid stability  
  biomass: number;      // Life - Ecological balance
  data: number;         // Knowledge - Tech progression
  
  // Derived Metrics
  stability: number;     // Overall system stability (0-2)
  entropy: number;       // System chaos/disorder
  progress: number;      // Advancement toward victory
  
  // Victory Conditions Progress
  industrialProgress: number;
  ecologicalProgress: number;
  technologicalProgress: number;
  balancedProgress: number;
}

export class QuaternionStateManager {
  private currentState: QuaternionState;
  private previousState: QuaternionState | null = null;
  private stateHistory: QuaternionState[] = [];
  private maxHistorySize: number = 100;

  constructor(initialState?: Partial<QuaternionState>) {
    this.currentState = {
      ore: initialState?.ore ?? 100,
      energy: initialState?.energy ?? 100,
      biomass: initialState?.biomass ?? 100,
      data: initialState?.data ?? 100,
      stability: initialState?.stability ?? 1.0,
      entropy: initialState?.entropy ?? 0.0,
      progress: initialState?.progress ?? 0.0,
      industrialProgress: initialState?.industrialProgress ?? 0,
      ecologicalProgress: initialState?.ecologicalProgress ?? 0,
      technologicalProgress: initialState?.technologicalProgress ?? 0,
      balancedProgress: initialState?.balancedProgress ?? 0
    };
    
    this.updateDerivedMetrics();
  }

  /**
   * Clone the current state
   */
  clone(): QuaternionState {
    return {
      ore: this.currentState.ore,
      energy: this.currentState.energy,
      biomass: this.currentState.biomass,
      data: this.currentState.data,
      stability: this.currentState.stability,
      entropy: this.currentState.entropy,
      progress: this.currentState.progress,
      industrialProgress: this.currentState.industrialProgress,
      ecologicalProgress: this.currentState.ecologicalProgress,
      technologicalProgress: this.currentState.technologicalProgress,
      balancedProgress: this.currentState.balancedProgress
    };
  }

  /**
   * Get current state
   */
  getState(): QuaternionState {
    return this.clone();
  }

  /**
   * Get previous state
   */
  getPreviousState(): QuaternionState | null {
    return this.previousState ? { ...this.previousState } : null;
  }

  /**
   * Update state with resource changes
   */
  updateState(changes: Partial<QuaternionState>): void {
    this.previousState = this.clone();
    
    Object.keys(changes).forEach(key => {
      if (key in this.currentState) {
        (this.currentState as any)[key] = (changes as any)[key];
      }
    });
    
    this.updateDerivedMetrics();
    this.addToHistory();
  }

  /**
   * Apply resource changes (delta)
   */
  applyResourceChanges(delta: {
    ore?: number;
    energy?: number;
    biomass?: number;
    data?: number;
  }): void {
    this.previousState = this.clone();
    
    if (delta.ore !== undefined) this.currentState.ore += delta.ore;
    if (delta.energy !== undefined) this.currentState.energy += delta.energy;
    if (delta.biomass !== undefined) this.currentState.biomass += delta.biomass;
    if (delta.data !== undefined) this.currentState.data += delta.data;
    
    // Clamp resources to reasonable bounds
    this.currentState.ore = Math.max(0, Math.min(10000, this.currentState.ore));
    this.currentState.energy = Math.max(0, Math.min(5000, this.currentState.energy));
    this.currentState.biomass = Math.max(0, Math.min(3000, this.currentState.biomass));
    this.currentState.data = Math.max(0, Math.min(2000, this.currentState.data));
    
    this.updateDerivedMetrics();
    this.addToHistory();
  }

  /**
   * Update derived metrics (stability, entropy, progress)
   */
  private updateDerivedMetrics(): void {
    // Calculate stability based on resource balance
    const resources = [
      this.currentState.ore,
      this.currentState.energy,
      this.currentState.biomass,
      this.currentState.data
    ];
    
    const mean = resources.reduce((a, b) => a + b, 0) / resources.length;
    const variance = resources.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / resources.length;
    const stdDev = Math.sqrt(variance);
    
    // Stability: higher when resources are balanced (low variance)
    // Normalize to 0-2 range
    const maxStdDev = 2000; // Approximate max standard deviation
    this.currentState.stability = Math.max(0, Math.min(2, 2 - (stdDev / maxStdDev) * 2));
    
    // Entropy: measure of system disorder (variance of resources)
    this.currentState.entropy = variance;
    
    // Progress: weighted sum of victory condition progress
    this.currentState.progress = (
      this.currentState.industrialProgress * 0.25 +
      this.currentState.ecologicalProgress * 0.25 +
      this.currentState.technologicalProgress * 0.25 +
      this.currentState.balancedProgress * 0.25
    );
  }

  /**
   * Calculate resource imbalance (how far from perfect balance)
   */
  getImbalance(): {
    axis: 'ore' | 'energy' | 'biomass' | 'data';
    severity: number; // 0-1, 1 = most imbalanced
  } | null {
    const resources = [
      { name: 'ore' as const, value: this.currentState.ore },
      { name: 'energy' as const, value: this.currentState.energy },
      { name: 'biomass' as const, value: this.currentState.biomass },
      { name: 'data' as const, value: this.currentState.data }
    ];
    
    const mean = resources.reduce((sum, r) => sum + r.value, 0) / resources.length;
    const maxDeviation = Math.max(...resources.map(r => Math.abs(r.value - mean)));
    const maxValue = Math.max(...resources.map(r => r.value));
    
    if (maxValue === 0) return null;
    
    const severity = maxDeviation / maxValue;
    const mostImbalanced = resources.reduce((max, r) => 
      Math.abs(r.value - mean) > Math.abs(max.value - mean) ? r : max
    );
    
    return {
      axis: mostImbalanced.name,
      severity: Math.min(1, severity)
    };
  }

  /**
   * Get quaternion representation [w, x, y, z]
   * where w=stability, x=ore, y=energy, z=biomass (data is implicit in magnitude)
   */
  toQuaternion(): [number, number, number, number] {
    // Normalize resources to unit sphere
    const magnitude = Math.sqrt(
      Math.pow(this.currentState.ore, 2) +
      Math.pow(this.currentState.energy, 2) +
      Math.pow(this.currentState.biomass, 2) +
      Math.pow(this.currentState.data, 2)
    );
    
    if (magnitude === 0) return [1, 0, 0, 0];
    
    const scale = 1 / magnitude;
    return [
      this.currentState.stability, // w component
      this.currentState.ore * scale, // x component
      this.currentState.energy * scale, // y component
      this.currentState.biomass * scale // z component
    ];
  }

  /**
   * Add current state to history
   */
  private addToHistory(): void {
    this.stateHistory.push(this.clone());
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Get state history
   */
  getHistory(): QuaternionState[] {
    return this.stateHistory.map(s => ({ ...s }));
  }

  /**
   * Get state change from previous to current
   */
  getStateChange(): {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
    stability: number;
    entropy: number;
  } | null {
    if (!this.previousState) return null;
    
    return {
      ore: this.currentState.ore - this.previousState.ore,
      energy: this.currentState.energy - this.previousState.energy,
      biomass: this.currentState.biomass - this.previousState.biomass,
      data: this.currentState.data - this.previousState.data,
      stability: this.currentState.stability - this.previousState.stability,
      entropy: this.currentState.entropy - this.previousState.entropy
    };
  }
}

