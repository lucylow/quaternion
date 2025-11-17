/**
 * Clear Win/Lose Conditions System for QUATERNION
 * Implements all victory and defeat types with precise timing and tracking
 */

export enum VictoryType {
  NONE = 'none',
  EQUILIBRIUM = 'equilibrium',      // Resource balance victory (60s)
  TECHNOLOGICAL = 'technological',   // Tech tree completion
  TERRITORIAL = 'territorial',       // Map control victory (60-90s)
  MORAL = 'moral'                    // Ethical/alignment victory
}

export enum DefeatType {
  NONE = 'none',
  RESOURCE_COLLAPSE = 'resource_collapse',    // Any resource at 0 for >10s
  INSTABILITY_OVERFLOW = 'instability_overflow', // Resource overflow >200%
  CORE_NODE_LOST = 'core_node_lost',         // Central node lost for >30s
  MORALITY_COLLAPSE = 'morality_collapse',    // Too many destructive actions
  AI_OVERRUN = 'ai_overrun'                  // Enemy controls >70% nodes
}

export interface VictoryCondition {
  type: VictoryType;
  description: string;
  progress: number; // 0-1
  isActive: boolean;
  requiredTime?: number; // seconds
  currentTime?: number; // seconds
}

export interface DefeatCondition {
  type: DefeatType;
  description: string;
  severity: number; // 0-1 (how close to defeat)
  isActive: boolean;
  timer?: number; // seconds at critical state
}

export interface PostGameAnalysis {
  victoryType: VictoryType;
  defeatType: DefeatType;
  gameDuration: number;
  seed: number;
  performanceMetrics: {
    efficiencyIndex: number;
    equilibriumStability: number;
    ethicalScore: number;
    techProgress: number;
    dominionRating: number;
  };
  replayCode: string;
}

export class VictoryDefeatSystem {
  // Victory conditions
  private equilibriumTimer: number = 0;
  private equilibriumRequiredTime: number = 60; // 60 seconds
  
  private territorialTimer: number = 0;
  private territorialRequiredTime: number = 60; // 60-90 seconds (configurable)
  
  private moralScore: number = 0.5; // 0-1, starts neutral
  private moralRequiredScore: number = 0.8; // 80% positive choices
  private ethicalChoices: Map<string, boolean> = new Map();
  
  // Defeat conditions
  private resourceCollapseTimers: Map<string, number> = new Map(); // resource type -> seconds at zero
  private resourceCollapseThreshold: number = 10; // 10 seconds
  
  private instabilityOverflowTimer: number = 0;
  private instabilityOverflowThreshold: number = 10; // 10 seconds
  private overflowPercentage: number = 2.0; // 200% of baseline
  
  private coreNodeLostTimer: number = 0;
  private coreNodeLostThreshold: number = 30; // 30 seconds
  
  private aiOverrunThreshold: number = 0.7; // 70% control
  
  // Tracking
  private timeInEquilibrium: number = 0;
  private totalGameTime: number = 0;
  private biomassConverted: number = 0;
  private initialBiomass: number = 0;
  
  constructor() {
    // Initialize resource collapse timers
    this.resourceCollapseTimers.set('ore', 0);
    this.resourceCollapseTimers.set('energy', 0);
    this.resourceCollapseTimers.set('biomass', 0);
    this.resourceCollapseTimers.set('data', 0);
  }
  
  /**
   * Check all victory conditions
   */
  public checkVictoryConditions(
    resources: { ore: number; energy: number; biomass: number; data: number },
    researchedTechs: Set<string>,
    centralNodeControlled: boolean,
    centralNodeUnderAttack: boolean,
    gameTime: number
  ): VictoryType {
    this.totalGameTime = gameTime;
    
    // 1. Equilibrium Victory - All resources within 15% for 60 seconds
    if (this.checkEquilibriumVictory(resources)) {
      return VictoryType.EQUILIBRIUM;
    }
    
    // 2. Technological Victory - Terminal tech unlocked
    if (this.checkTechnologicalVictory(researchedTechs)) {
      return VictoryType.TECHNOLOGICAL;
    }
    
    // 3. Territorial Victory - Hold central node for 60-90 seconds while under attack
    if (this.checkTerritorialVictory(centralNodeControlled, centralNodeUnderAttack)) {
      return VictoryType.TERRITORIAL;
    }
    
    // 4. Moral Victory - Ethical choices and high moral score
    if (this.checkMoralVictory()) {
      return VictoryType.MORAL;
    }
    
    return VictoryType.NONE;
  }
  
  /**
   * Check all defeat conditions
   */
  public checkDefeatConditions(
    resources: { ore: number; energy: number; biomass: number; data: number },
    instability: number,
    maxInstability: number,
    centralNodeControlled: boolean,
    enemyNodeControl: number, // 0-1 ratio
    baselineResources: { ore: number; energy: number; biomass: number; data: number },
    deltaTime: number
  ): DefeatType {
    // 1. Resource Collapse - Any resource at 0 for >10 seconds
    const resourceCollapse = this.checkResourceCollapse(resources, deltaTime);
    if (resourceCollapse) return DefeatType.RESOURCE_COLLAPSE;
    
    // 2. Instability Overflow - Any resource >200% baseline for >10 seconds
    const instabilityOverflow = this.checkInstabilityOverflow(resources, baselineResources, deltaTime);
    if (instabilityOverflow) return DefeatType.INSTABILITY_OVERFLOW;
    
    // 3. Core Node Lost - Central node lost for >30 seconds
    const coreLost = this.checkCoreNodeLost(centralNodeControlled, deltaTime);
    if (coreLost) return DefeatType.CORE_NODE_LOST;
    
    // 4. Morality Collapse - Too many destructive actions
    const moralityCollapse = this.checkMoralityCollapse();
    if (moralityCollapse) return DefeatType.MORALITY_COLLAPSE;
    
    // 5. AI Overrun - Enemy controls >70% nodes
    const aiOverrun = this.checkAIOverrun(enemyNodeControl);
    if (aiOverrun) return DefeatType.AI_OVERRUN;
    
    return DefeatType.NONE;
  }
  
  /**
   * Equilibrium Victory: All resources within 15% for 60 seconds
   */
  private checkEquilibriumVictory(resources: { ore: number; energy: number; biomass: number; data: number }): boolean {
    const { ore, energy, biomass, data } = resources;
    const avg = (ore + energy + biomass + data) / 4;
    
    if (avg < 50) return false; // Need minimum resources
    
    const maxDeviation = Math.max(
      Math.abs(ore - avg),
      Math.abs(energy - avg),
      Math.abs(biomass - avg),
      Math.abs(data - avg)
    );
    
    const balanceThreshold = avg * 0.15; // 15% tolerance
    
    if (maxDeviation <= balanceThreshold) {
      this.equilibriumTimer += (1 / 60); // Assuming 60 ticks per second
      this.timeInEquilibrium += (1 / 60);
      
      if (this.equilibriumTimer >= this.equilibriumRequiredTime) {
        return true;
      }
    } else {
      this.equilibriumTimer = 0; // Reset if balance lost
    }
    
    return false;
  }
  
  /**
   * Technological Victory: Terminal tech unlocked
   */
  private checkTechnologicalVictory(researchedTechs: Set<string>): boolean {
    return researchedTechs.has('quantum_ascendancy') || 
           researchedTechs.has('bio_conserve'); // BioConserve is also a terminal tech
  }
  
  /**
   * Territorial Victory: Hold central node for 60-90 seconds while under attack
   */
  private checkTerritorialVictory(centralNodeControlled: boolean, centralNodeUnderAttack: boolean): boolean {
    if (centralNodeControlled && centralNodeUnderAttack) {
      this.territorialTimer += (1 / 60);
      
      if (this.territorialTimer >= this.territorialRequiredTime) {
        return true;
      }
    } else {
      this.territorialTimer = 0; // Reset if not controlled or not under attack
    }
    
    return false;
  }
  
  /**
   * Moral Victory: Ethical choices and high moral score
   */
  private checkMoralVictory(): boolean {
    // Check if moral score meets threshold
    if (this.moralScore < this.moralRequiredScore) return false;
    
    // Check if too many destructive actions (morality collapse check)
    if (this.checkMoralityCollapse()) return false;
    
    // Check if key ethical choices were made
    const ethicalChoiceCount = Array.from(this.ethicalChoices.values()).filter(c => c).length;
    const totalChoices = this.ethicalChoices.size;
    
    if (totalChoices === 0) return false; // Need at least some choices
    
    const ethicalRatio = ethicalChoiceCount / totalChoices;
    
    return ethicalRatio >= 0.6; // At least 60% ethical choices
  }
  
  /**
   * Resource Collapse: Any resource at 0 for >10 seconds
   */
  private checkResourceCollapse(
    resources: { ore: number; energy: number; biomass: number; data: number },
    deltaTime: number
  ): boolean {
    const resourceTypes = ['ore', 'energy', 'biomass', 'data'] as const;
    
    for (const type of resourceTypes) {
      const value = resources[type];
      const timer = this.resourceCollapseTimers.get(type) || 0;
      
      if (value <= 0) {
        const newTimer = timer + deltaTime;
        this.resourceCollapseTimers.set(type, newTimer);
        
        if (newTimer >= this.resourceCollapseThreshold) {
          return true;
        }
      } else {
        this.resourceCollapseTimers.set(type, 0); // Reset timer
      }
    }
    
    return false;
  }
  
  /**
   * Instability Overflow: Any resource >200% baseline for >10 seconds
   */
  private checkInstabilityOverflow(
    resources: { ore: number; energy: number; biomass: number; data: number },
    baselineResources: { ore: number; energy: number; biomass: number; data: number },
    deltaTime: number
  ): boolean {
    const resourceTypes = ['ore', 'energy', 'biomass', 'data'] as const;
    
    for (const type of resourceTypes) {
      const current = resources[type];
      const baseline = baselineResources[type] || 100; // Default baseline
      const overflowThreshold = baseline * this.overflowPercentage;
      
      if (current >= overflowThreshold) {
        this.instabilityOverflowTimer += deltaTime;
        
        if (this.instabilityOverflowTimer >= this.instabilityOverflowThreshold) {
          return true;
        }
      } else {
        this.instabilityOverflowTimer = 0; // Reset if below threshold
      }
    }
    
    return false;
  }
  
  /**
   * Core Node Lost: Central node lost for >30 seconds
   */
  private checkCoreNodeLost(centralNodeControlled: boolean, deltaTime: number): boolean {
    if (!centralNodeControlled) {
      this.coreNodeLostTimer += deltaTime;
      
      if (this.coreNodeLostTimer >= this.coreNodeLostThreshold) {
        return true;
      }
    } else {
      this.coreNodeLostTimer = 0; // Reset if controlled
    }
    
    return false;
  }
  
  /**
   * Morality Collapse: Too many destructive actions
   */
  private checkMoralityCollapse(): boolean {
    // Check if too much biomass was converted (>70%)
    if (this.initialBiomass > 0) {
      const destructionRatio = this.biomassConverted / this.initialBiomass;
      if (destructionRatio > 0.7) return true;
    }
    
    // Check if moral score is too low
    if (this.moralScore < 0.2) return true;
    
    return false;
  }
  
  /**
   * AI Overrun: Enemy controls >70% nodes
   */
  private checkAIOverrun(enemyNodeControl: number): boolean {
    return enemyNodeControl >= this.aiOverrunThreshold;
  }
  
  /**
   * Record an ethical choice
   */
  public recordEthicalChoice(choiceId: string, wasEthical: boolean, moralWeight: number = 0.1): void {
    this.ethicalChoices.set(choiceId, wasEthical);
    
    if (wasEthical) {
      this.moralScore = Math.min(1.0, this.moralScore + moralWeight);
    } else {
      this.moralScore = Math.max(0.0, this.moralScore - (moralWeight * 1.5)); // Harsher penalty
    }
  }
  
  /**
   * Record biomass conversion (for morality tracking)
   */
  public recordBiomassConversion(amount: number): void {
    this.biomassConverted += amount;
  }
  
  /**
   * Set initial biomass (for morality tracking)
   */
  public setInitialBiomass(amount: number): void {
    this.initialBiomass = amount;
  }
  
  /**
   * Get victory progress
   */
  public getVictoryProgress(): Map<VictoryType, VictoryCondition> {
    const progress = new Map<VictoryType, VictoryCondition>();
    
    progress.set(VictoryType.EQUILIBRIUM, {
      type: VictoryType.EQUILIBRIUM,
      description: 'Maintain all four resources within 15% for 60 seconds',
      progress: this.equilibriumTimer / this.equilibriumRequiredTime,
      isActive: this.equilibriumTimer > 0,
      requiredTime: this.equilibriumRequiredTime,
      currentTime: this.equilibriumTimer
    });
    
    progress.set(VictoryType.TERRITORIAL, {
      type: VictoryType.TERRITORIAL,
      description: 'Hold Central Node for 60 seconds while under attack',
      progress: this.territorialTimer / this.territorialRequiredTime,
      isActive: this.territorialTimer > 0,
      requiredTime: this.territorialRequiredTime,
      currentTime: this.territorialTimer
    });
    
    progress.set(VictoryType.MORAL, {
      type: VictoryType.MORAL,
      description: 'Make ethical choices and maintain high moral alignment',
      progress: this.moralScore / this.moralRequiredScore,
      isActive: this.moralScore > 0.5,
      requiredTime: undefined,
      currentTime: undefined
    });
    
    return progress;
  }
  
  /**
   * Get defeat warnings
   */
  public getDefeatWarnings(): Map<DefeatType, DefeatCondition> {
    const warnings = new Map<DefeatType, DefeatCondition>();
    
    // Resource collapse warnings
    this.resourceCollapseTimers.forEach((timer, resource) => {
      if (timer > 0) {
        warnings.set(DefeatType.RESOURCE_COLLAPSE, {
          type: DefeatType.RESOURCE_COLLAPSE,
          description: `${resource} depleted for ${Math.floor(timer)}s`,
          severity: timer / this.resourceCollapseThreshold,
          isActive: true,
          timer: timer
        });
      }
    });
    
    // Instability overflow warning
    if (this.instabilityOverflowTimer > 0) {
      warnings.set(DefeatType.INSTABILITY_OVERFLOW, {
        type: DefeatType.INSTABILITY_OVERFLOW,
        description: 'Resource overflow detected',
        severity: this.instabilityOverflowTimer / this.instabilityOverflowThreshold,
        isActive: true,
        timer: this.instabilityOverflowTimer
      });
    }
    
    // Core node lost warning
    if (this.coreNodeLostTimer > 0) {
      warnings.set(DefeatType.CORE_NODE_LOST, {
        type: DefeatType.CORE_NODE_LOST,
        description: 'Central node lost',
        severity: this.coreNodeLostTimer / this.coreNodeLostThreshold,
        isActive: true,
        timer: this.coreNodeLostTimer
      });
    }
    
    return warnings;
  }
  
  /**
   * Generate post-game analysis
   */
  public generatePostGameAnalysis(
    victoryType: VictoryType,
    defeatType: DefeatType,
    seed: number,
    resources: { ore: number; energy: number; biomass: number; data: number },
    researchedTechs: Set<string>,
    nodeControl: number // 0-1 player control ratio
  ): PostGameAnalysis {
    const efficiencyIndex = this.calculateEfficiencyIndex();
    const equilibriumStability = this.calculateEquilibriumStability();
    const ethicalScore = this.moralScore;
    const techProgress = researchedTechs.size / 10; // Assuming ~10 techs total
    const dominionRating = nodeControl;
    
    const replayCode = this.generateReplayCode(
      victoryType,
      defeatType,
      seed,
      efficiencyIndex,
      equilibriumStability,
      ethicalScore
    );
    
    return {
      victoryType,
      defeatType,
      gameDuration: this.totalGameTime,
      seed,
      performanceMetrics: {
        efficiencyIndex,
        equilibriumStability,
        ethicalScore,
        techProgress,
        dominionRating
      },
      replayCode
    };
  }
  
  private calculateEfficiencyIndex(): number {
    // Simplified: ratio of time in equilibrium vs total time
    if (this.totalGameTime === 0) return 0;
    return Math.min(1.0, this.timeInEquilibrium / this.totalGameTime);
  }
  
  private calculateEquilibriumStability(): number {
    // Percentage of time resources were balanced
    if (this.totalGameTime === 0) return 0;
    return Math.min(1.0, this.timeInEquilibrium / this.totalGameTime);
  }
  
  private generateReplayCode(
    victoryType: VictoryType,
    defeatType: DefeatType,
    seed: number,
    efficiency: number,
    stability: number,
    ethical: number
  ): string {
    const v = victoryType === VictoryType.NONE ? 0 : 
             victoryType === VictoryType.EQUILIBRIUM ? 1 :
             victoryType === VictoryType.TECHNOLOGICAL ? 2 :
             victoryType === VictoryType.TERRITORIAL ? 3 : 4;
    
    const d = defeatType === DefeatType.NONE ? 0 :
             defeatType === DefeatType.RESOURCE_COLLAPSE ? 1 :
             defeatType === DefeatType.INSTABILITY_OVERFLOW ? 2 :
             defeatType === DefeatType.CORE_NODE_LOST ? 3 :
             defeatType === DefeatType.MORALITY_COLLAPSE ? 4 : 5;
    
    return `V${v}D${d}T${Math.floor(this.totalGameTime)}E${Math.floor(efficiency * 100)}S${Math.floor(stability * 100)}M${Math.floor(ethical * 100)}#${seed}`;
  }
  
  /**
   * Reset all timers and state (for new game)
   */
  public reset(): void {
    this.equilibriumTimer = 0;
    this.territorialTimer = 0;
    this.moralScore = 0.5;
    this.ethicalChoices.clear();
    this.resourceCollapseTimers.forEach((_, key) => this.resourceCollapseTimers.set(key, 0));
    this.instabilityOverflowTimer = 0;
    this.coreNodeLostTimer = 0;
    this.timeInEquilibrium = 0;
    this.totalGameTime = 0;
    this.biomassConverted = 0;
    this.initialBiomass = 0;
  }
}

