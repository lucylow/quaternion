/**
 * Deception AI - Psychological warfare and mind games
 * Implements feints, false retreats, bait and switch tactics
 */

import { SeededRandom } from '../../lib/SeededRandom';

export type DeceptionTactic = 
  | 'feigned_weakness'
  | 'false_retreat'
  | 'bait_and_switch'
  | 'overwhelming_force_display'
  | 'resource_starvation_feint'
  | 'tech_rush_feint'
  | 'expansion_feint';

export interface DeceptionPlan {
  tactic: DeceptionTactic;
  target: { x: number; y: number };
  executionTime: number;
  successProbability: number;
  resourcesRequired: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
}

export class DeceptionAI {
  private deceptionTactics: DeceptionTactic[];
  private playerSusceptibility: number; // 0-1, how likely player falls for tricks
  private deceptionCooldown: Map<DeceptionTactic, number>;
  private rng: SeededRandom;
  private deceptionHistory: Array<{
    tactic: DeceptionTactic;
    timestamp: number;
    success: boolean;
  }>;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
    this.deceptionTactics = [
      'feigned_weakness',
      'false_retreat',
      'bait_and_switch',
      'overwhelming_force_display',
      'resource_starvation_feint',
      'tech_rush_feint',
      'expansion_feint'
    ];
    this.playerSusceptibility = 0.5;
    this.deceptionCooldown = new Map();
    this.deceptionHistory = [];
  }

  /**
   * Execute deception tactic
   */
  public executeDeception(
    tactic: DeceptionTactic,
    currentState: any
  ): DeceptionPlan | null {
    // Check cooldown
    if (this.deceptionCooldown.has(tactic)) {
      const lastUsed = this.deceptionCooldown.get(tactic)!;
      if (Date.now() - lastUsed < 300000) { // 5 minute cooldown
        return null;
      }
    }

    // Check if deception should be used
    if (!this.shouldUseDeception(tactic, currentState)) {
      return null;
    }

    // Create deception plan
    const plan = this.createDeceptionPlan(tactic, currentState);
    
    if (plan) {
      this.deceptionCooldown.set(tactic, Date.now());
    }

    return plan;
  }

  /**
   * Record deception outcome
   */
  public recordDeceptionOutcome(tactic: DeceptionTactic, success: boolean): void {
    this.deceptionHistory.push({
      tactic,
      timestamp: Date.now(),
      success
    });

    // Update player susceptibility
    if (success) {
      this.playerSusceptibility = Math.min(0.9, this.playerSusceptibility + 0.1);
    } else {
      this.playerSusceptibility = Math.max(0.1, this.playerSusceptibility - 0.2);
    }
  }

  /**
   * Check if deception should be used
   */
  private shouldUseDeception(tactic: DeceptionTactic, currentState: any): boolean {
    // Base probability based on player susceptibility
    const baseProbability = this.playerSusceptibility * 0.5;

    // Adjust based on game state
    let adjustedProbability = baseProbability;

    if (tactic === 'feigned_weakness' && currentState.militaryAdvantage > 0.3) {
      adjustedProbability += 0.2; // More likely if we're strong
    } else if (tactic === 'false_retreat' && currentState.militaryAdvantage < -0.2) {
      adjustedProbability += 0.3; // More likely if we're weak
    } else if (tactic === 'bait_and_switch' && currentState.resourceAdvantage > 0.2) {
      adjustedProbability += 0.2;
    }

    return this.rng.nextFloat() < adjustedProbability;
  }

  /**
   * Create deception plan
   */
  private createDeceptionPlan(
    tactic: DeceptionTactic,
    currentState: any
  ): DeceptionPlan | null {
    const target = this.selectDeceptionTarget(currentState);
    if (!target) return null;

    const successProbability = this.calculateSuccessProbability(tactic, currentState);
    const resourcesRequired = this.calculateResourcesRequired(tactic);

    return {
      tactic,
      target,
      executionTime: Date.now() + 5000, // 5 seconds to execute
      successProbability,
      resourcesRequired
    };
  }

  /**
   * Select target for deception
   */
  private selectDeceptionTarget(currentState: any): { x: number; y: number } | null {
    // Simplified - would analyze actual map positions
    if (currentState.enemyBase) {
      return currentState.enemyBase;
    }
    return { x: this.rng.nextFloat(0, 1000), y: this.rng.nextFloat(0, 1000) };
  }

  /**
   * Calculate success probability
   */
  private calculateSuccessProbability(tactic: DeceptionTactic, currentState: any): number {
    let baseProbability = this.playerSusceptibility;

    // Adjust based on tactic type
    switch (tactic) {
      case 'feigned_weakness':
        baseProbability *= 0.7; // Harder to pull off
        break;
      case 'false_retreat':
        baseProbability *= 0.8;
        break;
      case 'bait_and_switch':
        baseProbability *= 0.6; // Requires more setup
        break;
      case 'overwhelming_force_display':
        baseProbability *= 0.9; // Easier to show strength
        break;
      default:
        baseProbability *= 0.7;
    }

    // Adjust based on how often we've used this tactic
    const recentUses = this.deceptionHistory.filter(
      h => h.tactic === tactic && Date.now() - h.timestamp < 600000
    ).length;
    baseProbability *= Math.max(0.5, 1 - recentUses * 0.1); // Less effective if overused

    return Math.min(1, Math.max(0, baseProbability));
  }

  /**
   * Calculate resources required for deception
   */
  private calculateResourcesRequired(tactic: DeceptionTactic): {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  } {
    const baseCost = {
      ore: 200,
      energy: 100,
      biomass: 0,
      data: 0
    };

    switch (tactic) {
      case 'overwhelming_force_display':
        return { ...baseCost, ore: 400, energy: 200 }; // More expensive
      case 'tech_rush_feint':
        return { ...baseCost, data: 300 };
      case 'expansion_feint':
        return { ...baseCost, ore: 300, energy: 150 };
      default:
        return baseCost;
    }
  }

  /**
   * Perform feigned weakness
   */
  public performFeignedWeakness(state: any): any {
    // Pull back units from a strong position
    // Make it look like retreat due to weakness
    return {
      type: 'retreat',
      units: state.units,
      reason: 'insufficient_resources',
      actualReason: 'deception'
    };
  }

  /**
   * Perform false retreat
   */
  public performFalseRetreat(state: any): any {
    // Appear to retreat, then ambush
    return {
      type: 'retreat',
      units: state.units,
      reason: 'overwhelmed',
      actualReason: 'ambush_setup',
      ambushPosition: this.selectDeceptionTarget(state)
    };
  }

  /**
   * Perform bait and switch
   */
  public performBaitAndSwitch(state: any): any {
    // Show weak position, then attack from strong position
    return {
      type: 'bait',
      baitPosition: this.selectDeceptionTarget(state),
      actualAttackPosition: { x: state.enemyBase.x + 100, y: state.enemyBase.y + 100 }
    };
  }

  /**
   * Get deception history
   */
  public getDeceptionHistory(): typeof this.deceptionHistory {
    return [...this.deceptionHistory];
  }

  /**
   * Get player susceptibility
   */
  public getPlayerSusceptibility(): number {
    return this.playerSusceptibility;
  }
}

