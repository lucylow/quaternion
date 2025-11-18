/**
 * Adaptive Difficulty AI System
 * Dynamically adjusts challenge to match player skill level
 */

import type { QuaternionState } from '../strategic/QuaternionState';

export interface PlayerSkillProfile {
  accuracy: number; // 0-1: Shooting/combat accuracy
  tacticalPositioning: number; // 0-1: Use of cover, positioning
  resourceManagement: number; // 0-1: Efficiency with resources
  adaptability: number; // 0-1: How quickly player adapts to new situations
  creativity: number; // 0-1: Creative problem solving
  overallSkill: number; // 0-1: Calculated overall skill
}

export interface ChallengeAdjustments {
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  enemyAccuracy: number;
  enemyTacticalLevel: number;
  resourceScarcity: number; // 0-1, higher = less resources
  puzzleComplexity: number; // 0-1
  environmentalHazards: number; // 0-1, frequency of hazards
}

export class AdaptiveDifficultyAI {
  private skillProfile: PlayerSkillProfile;
  private currentChallengeLevel: number = 0.5;
  private targetChallengeLevel: number = 0.5;
  private challengeHistory: number[] = [];
  private adjustments: ChallengeAdjustments;

  constructor() {
    this.skillProfile = this.getDefaultSkillProfile();
    this.adjustments = this.getDefaultAdjustments();
  }

  /**
   * Analyze player skill from game state and actions
   */
  analyzePlayerSkill(
    gameState: QuaternionState,
    playerActions: {
      shotsFired?: number;
      shotsHit?: number;
      unitsLost?: number;
      resourcesWasted?: number;
      creativeSolutions?: number;
      adaptationTime?: number;
    }
  ): void {
    // Calculate accuracy
    if (playerActions.shotsFired && playerActions.shotsFired > 0) {
      this.skillProfile.accuracy = Math.min(1, 
        (playerActions.shotsHit || 0) / playerActions.shotsFired
      );
    }

    // Calculate resource management (inverse of waste)
    if (playerActions.resourcesWasted !== undefined) {
      this.skillProfile.resourceManagement = Math.max(0, 
        1 - (playerActions.resourcesWasted / 100)
      );
    }

    // Calculate adaptability (inverse of adaptation time)
    if (playerActions.adaptationTime !== undefined) {
      this.skillProfile.adaptability = Math.max(0, 
        1 - (playerActions.adaptationTime / 60) // Normalize to 60 seconds
      );
    }

    // Calculate creativity (based on creative solutions used)
    if (playerActions.creativeSolutions !== undefined) {
      this.skillProfile.creativity = Math.min(1, 
        playerActions.creativeSolutions / 10 // Normalize to 10 solutions
      );
    }

    // Tactical positioning (simplified - would use actual positioning data)
    this.skillProfile.tacticalPositioning = this.estimateTacticalSkill(gameState);

    // Calculate overall skill
    this.skillProfile.overallSkill = this.calculateOverallSkill();

    // Update challenge level
    this.updateChallengeLevel();
  }

  /**
   * Estimate tactical positioning skill
   */
  private estimateTacticalSkill(gameState: QuaternionState): number {
    // Simplified estimation - would analyze actual unit positions
    // Higher balance = better tactical play
    const balance = this.calculateBalance(gameState);
    return Math.min(1, balance * 1.2);
  }

  /**
   * Calculate balance from quaternion state
   */
  private calculateBalance(gameState: QuaternionState): number {
    const { w, x, y, z } = gameState;
    const total = Math.abs(w) + Math.abs(x) + Math.abs(y) + Math.abs(z);
    
    if (total === 0) return 0.5;

    const avg = total / 4;
    const variance = Math.sqrt(
      (Math.pow(Math.abs(w) - avg, 2) +
       Math.pow(Math.abs(x) - avg, 2) +
       Math.pow(Math.abs(y) - avg, 2) +
       Math.pow(Math.abs(z) - avg, 2)) / 4
    );

    return Math.max(0, Math.min(1, 1 - (variance / avg)));
  }

  /**
   * Calculate overall skill
   */
  private calculateOverallSkill(): number {
    return (
      this.skillProfile.accuracy * 0.25 +
      this.skillProfile.tacticalPositioning * 0.25 +
      this.skillProfile.resourceManagement * 0.2 +
      this.skillProfile.adaptability * 0.15 +
      this.skillProfile.creativity * 0.15
    );
  }

  /**
   * Update challenge level to match player skill
   */
  private updateChallengeLevel(): void {
    // Target challenge should be slightly above player's comfort zone
    this.targetChallengeLevel = Math.min(1, this.skillProfile.overallSkill + 0.1);

    // Smoothly transition to target
    this.currentChallengeLevel = this.currentChallengeLevel * 0.9 + this.targetChallengeLevel * 0.1;

    // Record history
    this.challengeHistory.push(this.currentChallengeLevel);
    if (this.challengeHistory.length > 100) {
      this.challengeHistory.shift();
    }

    // Apply adjustments
    this.applyChallengeAdjustments();
  }

  /**
   * Apply challenge adjustments based on skill profile
   */
  private applyChallengeAdjustments(): void {
    const skill = this.skillProfile.overallSkill;
    const challenge = this.currentChallengeLevel;

    // Base adjustments
    this.adjustments.enemyHealthMultiplier = 0.8 + challenge * 0.4; // 0.8 to 1.2
    this.adjustments.enemyDamageMultiplier = 0.8 + challenge * 0.4;
    this.adjustments.enemyAccuracy = 0.3 + challenge * 0.4; // 0.3 to 0.7
    this.adjustments.enemyTacticalLevel = challenge;
    this.adjustments.resourceScarcity = challenge * 0.3; // 0 to 0.3
    this.adjustments.puzzleComplexity = challenge;
    this.adjustments.environmentalHazards = challenge * 0.5; // 0 to 0.5

    // Skill-specific adjustments
    if (this.skillProfile.accuracy > 0.8) {
      // Player is great at shooting - use more mobile enemies, more cover
      this.adjustments.enemyTacticalLevel = Math.min(1, this.adjustments.enemyTacticalLevel + 0.2);
    }

    if (this.skillProfile.tacticalPositioning > 0.7) {
      // Player uses positioning well - use flanking tactics
      this.adjustments.enemyTacticalLevel = Math.min(1, this.adjustments.enemyTacticalLevel + 0.15);
    }

    if (this.skillProfile.creativity > 0.6) {
      // Player thinks outside box - require creative solutions
      this.adjustments.puzzleComplexity = Math.min(1, this.adjustments.puzzleComplexity + 0.2);
    }

    if (this.skillProfile.resourceManagement < 0.4) {
      // Player struggles with resources - reduce scarcity
      this.adjustments.resourceScarcity = Math.max(0, this.adjustments.resourceScarcity - 0.1);
    }
  }

  /**
   * Get default skill profile
   */
  private getDefaultSkillProfile(): PlayerSkillProfile {
    return {
      accuracy: 0.5,
      tacticalPositioning: 0.5,
      resourceManagement: 0.5,
      adaptability: 0.5,
      creativity: 0.5,
      overallSkill: 0.5
    };
  }

  /**
   * Get default adjustments
   */
  private getDefaultAdjustments(): ChallengeAdjustments {
    return {
      enemyHealthMultiplier: 1.0,
      enemyDamageMultiplier: 1.0,
      enemyAccuracy: 0.5,
      enemyTacticalLevel: 0.5,
      resourceScarcity: 0.15,
      puzzleComplexity: 0.5,
      environmentalHazards: 0.25
    };
  }

  /**
   * Get current challenge adjustments
   */
  getChallengeAdjustments(): ChallengeAdjustments {
    return { ...this.adjustments };
  }

  /**
   * Get player skill profile
   */
  getSkillProfile(): PlayerSkillProfile {
    return { ...this.skillProfile };
  }

  /**
   * Get current challenge level
   */
  getChallengeLevel(): number {
    return this.currentChallengeLevel;
  }

  /**
   * Reset difficulty (for new game)
   */
  reset(): void {
    this.skillProfile = this.getDefaultSkillProfile();
    this.currentChallengeLevel = 0.5;
    this.targetChallengeLevel = 0.5;
    this.challengeHistory = [];
    this.adjustments = this.getDefaultAdjustments();
  }
}

