/**
 * Stealth Adaptation System
 * 
 * Immersion-preserving difficulty adjustments that players don't notice.
 * Maintains game believability while adapting to player skill.
 */

import { DifficultyAction } from './AdaptiveDifficultyAgent';
import { PlayerModel } from './PlayerExperienceModel';

export interface StealthAdjustment {
  type: 'probabilistic' | 'spatial' | 'temporal' | 'narrative';
  description: string;
  implementation: string;
  impact: number; // Expected effect on difficulty (0-1)
}

export interface ResourceBalance {
  ammoSpawnRate: number;       // Multiplier for ammo spawn frequency
  healthPackFrequency: number; // Multiplier for health pack spawns
  currencyDrops: number;       // Multiplier for currency drop amounts
  resourceNodeYield: number;   // Multiplier for resource node yields
}

export interface EnemyBehavior {
  reactionTime: number;        // Multiplier for AI reaction time
  accuracy: number;            // Multiplier for AI shooting accuracy
  tacticalComplexity: number;  // Complexity of AI tactics (0-1)
  aggression: number;          // AI aggressiveness level (0-1)
}

/**
 * Stealth Adaptation System
 * Makes invisible difficulty adjustments to preserve immersion
 */
export class StealthAdaptation {
  
  /**
   * Calculate hidden assistance based on player frustration
   * Returns assistance level that can be applied probabilistically
   */
  calculateHiddenAssistance(playerModel: PlayerModel): number {
    // Assistance increases with frustration, capped at 30%
    const frustration = playerModel.emotionalState.frustrationLevel;
    return Math.min(0.3, frustration * 0.5);
  }
  
  /**
   * Adjust resource flow based on player performance
   */
  adjustResourceFlow(
    baseResources: ResourceBalance,
    playerModel: PlayerModel,
    difficultyAction: DifficultyAction
  ): ResourceBalance {
    const { efficiency } = playerModel.skillMetrics;
    const { frustrationLevel } = playerModel.emotionalState;
    
    // Adjust based on difficulty action
    const abundanceMod = 1.0 + difficultyAction.resourceAbundance;
    
    // Boost resources if struggling (high frustration, low efficiency)
    const struggleBoost = (frustrationLevel * 0.3) + ((1 - efficiency) * 0.2);
    const totalBoost = abundanceMod + struggleBoost;
    
    return {
      ammoSpawnRate: Math.max(0.5, Math.min(2.0, baseResources.ammoSpawnRate * totalBoost)),
      healthPackFrequency: Math.max(0.5, Math.min(2.0, baseResources.healthPackFrequency * totalBoost)),
      currencyDrops: Math.max(0.5, Math.min(2.0, baseResources.currencyDrops * totalBoost)),
      resourceNodeYield: Math.max(0.5, Math.min(2.0, baseResources.resourceNodeYield * totalBoost))
    };
  }
  
  /**
   * Adjust enemy behavior based on player skill
   */
  adjustEnemyBehavior(
    baseBehavior: EnemyBehavior,
    playerModel: PlayerModel,
    difficultyAction: DifficultyAction
  ): EnemyBehavior {
    const skill = playerModel.skillMetrics.accuracy;
    const combatSkill = playerModel.skillMetrics.skillVector.get('combat') || 0.5;
    const overallSkill = (skill + combatSkill) / 2;
    
    // Adjust based on difficulty action
    const reactionMod = 1.0 + difficultyAction.aiReactionTimeModifier;
    const healthMod = 1.0 + difficultyAction.enemyHealthModifier;
    
    // Scale difficulty with player skill
    const skillBasedReaction = 0.5 + overallSkill * 0.5; // 0.5 to 1.0 range
    
    return {
      reactionTime: Math.max(0.3, Math.min(1.0, baseBehavior.reactionTime * reactionMod * skillBasedReaction)),
      accuracy: Math.max(0.2, Math.min(1.0, baseBehavior.accuracy * skillBasedReaction)),
      tacticalComplexity: Math.max(0.2, Math.min(1.0, baseBehavior.tacticalComplexity * skillBasedReaction)),
      aggression: Math.max(0.3, Math.min(1.0, baseBehavior.aggression * skillBasedReaction))
    };
  }
  
  /**
   * Generate stealth adjustments that preserve immersion
   */
  generateStealthAdjustments(
    playerModel: PlayerModel,
    difficultyAction: DifficultyAction
  ): StealthAdjustment[] {
    const adjustments: StealthAdjustment[] = [];
    const { frustrationLevel, engagementLevel } = playerModel.emotionalState;
    
    // Probabilistic assistance (if struggling)
    if (frustrationLevel > 0.5) {
      adjustments.push({
        type: 'probabilistic',
        description: 'Enemy AI occasional hesitation',
        implementation: `AI reaction time has ${(frustrationLevel * 20).toFixed(0)}% chance of being delayed by 100-300ms`,
        impact: frustrationLevel * 0.15
      });
      
      adjustments.push({
        type: 'spatial',
        description: 'Slightly larger hitboxes for player attacks',
        implementation: `Player attack hitboxes expanded by ${(frustrationLevel * 10).toFixed(0)}%`,
        impact: frustrationLevel * 0.1
      });
    }
    
    // Resource adjustments
    if (difficultyAction.resourceAbundance !== 0) {
      adjustments.push({
        type: 'temporal',
        description: 'Resource spawn frequency adjustment',
        implementation: `Resource spawn rate modified by ${(difficultyAction.resourceAbundance * 100).toFixed(0)}%`,
        impact: Math.abs(difficultyAction.resourceAbundance) * 0.3
      });
    }
    
    // Puzzle complexity adjustments
    if (difficultyAction.puzzleComplexity !== 0) {
      adjustments.push({
        type: 'temporal',
        description: 'Puzzle solution hints in environment',
        implementation: `Environmental hints appear ${difficultyAction.puzzleComplexity > 0 ? 'less' : 'more'} frequently`,
        impact: Math.abs(difficultyAction.puzzleComplexity) * 0.2
      });
    }
    
    // Time pressure adjustments
    if (difficultyAction.timePressure !== 0) {
      adjustments.push({
        type: 'temporal',
        description: 'Time limit modifications',
        implementation: `Time limits adjusted by ${(difficultyAction.timePressure * 100).toFixed(0)}%`,
        impact: Math.abs(difficultyAction.timePressure) * 0.25
      });
    }
    
    // Low engagement: add narrative hooks
    if (engagementLevel < 0.4) {
      adjustments.push({
        type: 'narrative',
        description: 'Environmental storytelling hints',
        implementation: 'Additional narrative elements appear in environment to draw attention',
        impact: (1 - engagementLevel) * 0.1
      });
    }
    
    return adjustments;
  }
  
  /**
   * Create narrative explanation for noticeable difficulty changes
   * Returns null if change is subtle enough to not need explanation
   */
  createNarrativeExplanation(difficultyAction: DifficultyAction): string | null {
    // Only explain if changes are significant (>10%)
    const significantChanges: string[] = [];
    
    if (Math.abs(difficultyAction.enemyHealthModifier) > 0.1) {
      if (difficultyAction.enemyHealthModifier < 0) {
        significantChanges.push('These enemies appear malnourished and weak');
      } else {
        significantChanges.push('These enemies appear unusually resilient');
      }
    }
    
    if (difficultyAction.resourceAbundance > 0.1) {
      significantChanges.push('You discover an abandoned supply cache');
    } else if (difficultyAction.resourceAbundance < -0.1) {
      significantChanges.push('Resources seem scarcer than usual');
    }
    
    if (Math.abs(difficultyAction.aiReactionTimeModifier) > 0.1) {
      if (difficultyAction.aiReactionTimeModifier > 0) {
        significantChanges.push('Friendly scouts have weakened the enemy forces');
      }
    }
    
    if (difficultyAction.puzzleComplexity < -0.1) {
      significantChanges.push('Ancient mechanisms appear recently maintained');
    }
    
    return significantChanges.length > 0 ? significantChanges.join('. ') + '.' : null;
  }
  
  /**
   * Calculate if adjustment is subtle enough to be invisible
   */
  isAdjustmentSubtle(difficultyAction: DifficultyAction): boolean {
    const totalChange = 
      Math.abs(difficultyAction.enemyHealthModifier) +
      Math.abs(difficultyAction.resourceAbundance) +
      Math.abs(difficultyAction.puzzleComplexity) +
      Math.abs(difficultyAction.timePressure) +
      Math.abs(difficultyAction.hintFrequency) +
      Math.abs(difficultyAction.aiReactionTimeModifier);
    
    // Total change < 15% = subtle
    return totalChange < 0.15;
  }
  
  /**
   * Apply stealth adjustments to game state
   * Returns modified game parameters
   */
  applyStealthAdjustments<T extends Record<string, any>>(
    baseParams: T,
    adjustments: StealthAdjustment[]
  ): T {
    const modified = { ...baseParams };
    
    for (const adjustment of adjustments) {
      // Apply adjustment based on type
      switch (adjustment.type) {
        case 'probabilistic':
          // Probabilistic adjustments are applied at runtime, not here
          break;
        case 'spatial':
        case 'temporal':
        case 'narrative':
          // These affect game state parameters
          // Implementation depends on specific game systems
          break;
      }
    }
    
    return modified;
  }
}


