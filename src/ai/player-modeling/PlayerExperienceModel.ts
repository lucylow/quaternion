/**
 * Player Experience Modeling & Adaptive Difficulty
 * 
 * Multi-dimensional player modeling system that tracks:
 * - Skill & Performance Metrics
 * - Behavioral Patterns
 * - Emotional State
 * - Physiological Signals (if available)
 * 
 * Based on research in player modeling, reinforcement learning, and affective computing.
 */

export interface SkillMetrics {
  accuracy: number;           // Shooting accuracy, puzzle success rate (0-1)
  efficiency: number;         // Resource usage efficiency, time to complete (0-1)
  adaptability: number;       // Learning speed, strategy changes (0-1)
  consistency: number;        // Performance variance (0-1, higher = more consistent)
  skillVector: Map<string, number>; // Per-mechanic skills (e.g., "combat": 0.7, "economy": 0.5)
}

export interface BehavioralPatterns {
  playStyle: 'aggressive' | 'defensive' | 'exploratory' | 'balanced';
  riskTolerance: number;      // Willingness to take chances (0-1)
  decisionSpeed: number;      // Fast/slow decision making (0-1)
  explorationTendency: number; // How much they wander (0-1)
}

export interface EmotionalState {
  frustrationLevel: number;   // From failures, obstacles (0-1)
  engagementLevel: number;    // Focus and attention (0-1)
  confidence: number;         // Self-efficacy perception (0-1)
  enjoyment: number;          // Positive affect (0-1)
}

export interface PhysiologicalData {
  heartRate?: number;         // Stress/engagement indicator (if available)
  gsr?: number;               // Galvanic skin response - arousal (if available)
  pupilDilation?: number;     // Cognitive load (if available)
  facialExpression?: number;  // Emotion recognition (if available)
}

export interface PlayerModel {
  playerId: string;
  skillMetrics: SkillMetrics;
  behavioralPatterns: BehavioralPatterns;
  emotionalState: EmotionalState;
  physiologicalData?: PhysiologicalData;
  
  // Metadata
  sessionDuration: number;    // Current session duration in seconds
  totalPlayTime: number;      // Total play time in seconds
  sessionStartTime: number;   // Timestamp of session start
  lastUpdateTime: number;     // Last model update timestamp
}

export interface GameplayData {
  // Performance metrics
  actionsPerformed: number;
  successes: number;
  failures: number;
  averageResponseTime: number;
  
  // Behavioral metrics
  rapidRestarts: number;
  pauseFrequency: number;
  complaintInputs: number;    // Button spamming, rage clicks
  progressStagnation: number; // Time stuck in same area
  
  // Engagement metrics
  sessionDuration: number;
  focusActions: number;       // Precise, deliberate inputs
  explorationActions: number;
  skillProgression: number;   // Improvement over session
  
  // Resource metrics
  resourceUsage: number;
  efficiencyScore: number;
  
  // Combat metrics
  combatAccuracy: number;
  unitsLost: number;
  unitsKilled: number;
  
  // Temporal data
  tick: number;
  timestamp: number;
}

/**
 * Multi-dimensional player model that tracks skill, behavior, and emotional state
 */
export class PlayerExperienceModel {
  private model: PlayerModel;
  private gameplayHistory: GameplayData[] = [];
  private readonly maxHistorySize = 1000;
  
  // Weighting factors for different metrics
  private readonly skillWeights = {
    accuracy: 0.3,
    efficiency: 0.25,
    adaptability: 0.25,
    consistency: 0.2
  };
  
  // Time windows for different calculations (in ticks)
  private readonly shortWindow = 300;  // 5 seconds at 60 tps
  private readonly mediumWindow = 1800; // 30 seconds
  private readonly longWindow = 3600;   // 60 seconds
  
  constructor(playerId: string) {
    this.model = {
      playerId,
      skillMetrics: {
        accuracy: 0.5,
        efficiency: 0.5,
        adaptability: 0.5,
        consistency: 0.5,
        skillVector: new Map()
      },
      behavioralPatterns: {
        playStyle: 'balanced',
        riskTolerance: 0.5,
        decisionSpeed: 0.5,
        explorationTendency: 0.5
      },
      emotionalState: {
        frustrationLevel: 0.0,
        engagementLevel: 0.5,
        confidence: 0.5,
        enjoyment: 0.5
      },
      sessionDuration: 0,
      totalPlayTime: 0,
      sessionStartTime: Date.now(),
      lastUpdateTime: Date.now()
    };
  }
  
  /**
   * Update the player model with new gameplay data
   */
  update(gameplayData: GameplayData): void {
    this.gameplayHistory.push(gameplayData);
    if (this.gameplayHistory.length > this.maxHistorySize) {
      this.gameplayHistory.shift();
    }
    
    this.updateSkillMetrics(gameplayData);
    this.updateBehavioralPatterns(gameplayData);
    this.updateEmotionalState(gameplayData);
    this.updateMetadata(gameplayData);
  }
  
  /**
   * Calculate skill metrics from gameplay data
   */
  private updateSkillMetrics(data: GameplayData): void {
    const recent = this.getRecentData(this.mediumWindow);
    
    if (recent.length === 0) return;
    
    // Accuracy: success rate
    const totalAttempts = recent.reduce((sum, d) => sum + d.successes + d.failures, 0);
    if (totalAttempts > 0) {
      const successes = recent.reduce((sum, d) => sum + d.successes, 0);
      this.model.skillMetrics.accuracy = successes / totalAttempts;
    }
    
    // Efficiency: resource usage and time efficiency
    const avgEfficiency = recent.reduce((sum, d) => sum + d.efficiencyScore, 0) / recent.length;
    this.model.skillMetrics.efficiency = Math.max(0, Math.min(1, avgEfficiency));
    
    // Adaptability: learning speed from performance improvement
    if (recent.length >= 10) {
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      const firstAvg = firstHalf.reduce((sum, d) => sum + d.efficiencyScore, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.efficiencyScore, 0) / secondHalf.length;
      this.model.skillMetrics.adaptability = Math.max(0, Math.min(1, (secondAvg - firstAvg) * 2));
    }
    
    // Consistency: inverse of variance in performance
    const efficiencies = recent.map(d => d.efficiencyScore);
    const mean = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
    const variance = efficiencies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / efficiencies.length;
    this.model.skillMetrics.consistency = Math.max(0, Math.min(1, 1 - variance));
    
    // Update per-mechanic skills
    if (data.combatAccuracy >= 0) {
      const currentCombat = this.model.skillMetrics.skillVector.get('combat') || 0.5;
      this.model.skillMetrics.skillVector.set('combat', 
        currentCombat * 0.9 + data.combatAccuracy * 0.1
      );
    }
    
    // Economy skill from resource efficiency
    if (data.resourceUsage >= 0) {
      const currentEconomy = this.model.skillMetrics.skillVector.get('economy') || 0.5;
      const economyScore = 1 - Math.min(1, data.resourceUsage / 1000); // Normalize
      this.model.skillMetrics.skillVector.set('economy',
        currentEconomy * 0.9 + economyScore * 0.1
      );
    }
  }
  
  /**
   * Update behavioral patterns from gameplay data
   */
  private updateBehavioralPatterns(data: GameplayData): void {
    const recent = this.getRecentData(this.longWindow);
    
    if (recent.length === 0) return;
    
    // Risk tolerance: from exploration vs staying safe
    const explorationRatio = recent.reduce((sum, d) => sum + d.explorationActions, 0) / 
                            Math.max(1, recent.reduce((sum, d) => sum + d.actionsPerformed, 0));
    this.model.behavioralPatterns.riskTolerance = Math.max(0, Math.min(1, explorationRatio * 1.5));
    
    // Decision speed: from response times
    const avgResponseTime = recent.reduce((sum, d) => sum + d.averageResponseTime, 0) / recent.length;
    // Normalize: 0ms = fast (1.0), 1000ms+ = slow (0.0)
    this.model.behavioralPatterns.decisionSpeed = Math.max(0, Math.min(1, 1 - (avgResponseTime / 1000)));
    
    // Exploration tendency: from exploration actions
    this.model.behavioralPatterns.explorationTendency = Math.max(0, Math.min(1, 
      recent.reduce((sum, d) => sum + d.explorationActions, 0) / Math.max(1, recent.length * 10)
    ));
    
    // Play style: determine from patterns
    if (this.model.behavioralPatterns.riskTolerance > 0.7) {
      this.model.behavioralPatterns.playStyle = 'aggressive';
    } else if (this.model.behavioralPatterns.explorationTendency > 0.6) {
      this.model.behavioralPatterns.playStyle = 'exploratory';
    } else if (this.model.behavioralPatterns.riskTolerance < 0.3) {
      this.model.behavioralPatterns.playStyle = 'defensive';
    } else {
      this.model.behavioralPatterns.playStyle = 'balanced';
    }
  }
  
  /**
   * Update emotional state using affective computing approach
   * Infers emotions from behavioral patterns
   */
  private updateEmotionalState(data: GameplayData): void {
    const recent = this.getRecentData(this.shortWindow);
    
    if (recent.length === 0) return;
    
    // Frustration: from repeated failures and negative behaviors
    let frustration = 0.0;
    frustration += (recent.reduce((sum, d) => sum + d.failures, 0) / Math.max(1, recent.length)) * 0.3;
    frustration += (recent.reduce((sum, d) => sum + d.rapidRestarts, 0) / Math.max(1, recent.length)) * 0.2;
    frustration += (recent.reduce((sum, d) => sum + d.pauseFrequency, 0) / Math.max(1, recent.length)) * 0.15;
    frustration += (recent.reduce((sum, d) => sum + d.complaintInputs, 0) / Math.max(1, recent.length)) * 0.25;
    frustration += (recent.reduce((sum, d) => sum + d.progressStagnation, 0) / Math.max(1, recent.length * 10)) * 0.1;
    
    this.model.emotionalState.frustrationLevel = Math.max(0, Math.min(1, frustration));
    
    // Engagement: from positive behaviors
    let engagement = 0.0;
    const sessionWeight = Math.min(1, data.sessionDuration / 1800); // 30 minutes = max
    engagement += sessionWeight * 0.2;
    engagement += (recent.reduce((sum, d) => sum + d.focusActions, 0) / Math.max(1, recent.length * 5)) * 0.3;
    engagement += (recent.reduce((sum, d) => sum + d.explorationActions, 0) / Math.max(1, recent.length * 5)) * 0.25;
    engagement += data.skillProgression * 0.25;
    
    this.model.emotionalState.engagementLevel = Math.max(0, Math.min(1, engagement));
    
    // Confidence: from success rate and performance consistency
    const recentSuccesses = recent.reduce((sum, d) => sum + d.successes, 0);
    const recentAttempts = recent.reduce((sum, d) => sum + d.successes + d.failures, 0);
    const successRate = recentAttempts > 0 ? recentSuccesses / recentAttempts : 0.5;
    this.model.emotionalState.confidence = successRate * 0.6 + this.model.skillMetrics.consistency * 0.4;
    
    // Enjoyment: inverse of frustration, boosted by engagement
    this.model.emotionalState.enjoyment = Math.max(0, Math.min(1,
      (1 - this.model.emotionalState.frustrationLevel) * 0.5 + 
      this.model.emotionalState.engagementLevel * 0.5
    ));
  }
  
  /**
   * Update session metadata
   */
  private updateMetadata(data: GameplayData): void {
    this.model.sessionDuration = data.sessionDuration;
    this.model.lastUpdateTime = data.timestamp;
  }
  
  /**
   * Get recent gameplay data within time window
   */
  private getRecentData(windowTicks: number): GameplayData[] {
    if (this.gameplayHistory.length === 0) return [];
    
    const currentTick = this.gameplayHistory[this.gameplayHistory.length - 1].tick;
    return this.gameplayHistory.filter(d => d.tick >= currentTick - windowTicks);
  }
  
  /**
   * Get overall player skill level (weighted average)
   */
  getOverallSkillLevel(): number {
    const { skillMetrics } = this.model;
    return (
      skillMetrics.accuracy * this.skillWeights.accuracy +
      skillMetrics.efficiency * this.skillWeights.efficiency +
      skillMetrics.adaptability * this.skillWeights.adaptability +
      skillMetrics.consistency * this.skillWeights.consistency
    );
  }
  
  /**
   * Get current player model
   */
  getModel(): PlayerModel {
    return { ...this.model };
  }
  
  /**
   * Update physiological data if available
   */
  updatePhysiologicalData(physio: PhysiologicalData): void {
    this.model.physiologicalData = { ...this.model.physiologicalData, ...physio };
  }
  
  /**
   * Reset session (keep skill metrics, reset emotional state)
   */
  resetSession(): void {
    this.model.emotionalState = {
      frustrationLevel: 0.0,
      engagementLevel: 0.5,
      confidence: 0.5,
      enjoyment: 0.5
    };
    this.model.sessionStartTime = Date.now();
    this.gameplayHistory = [];
  }
}

