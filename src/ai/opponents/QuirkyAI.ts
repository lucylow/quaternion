/**
 * Quirky AI - Purposefully imperfect AI with flaws and quirks
 * Creates memorable, character-driven AI with obsessions and irrational fears
 */

import { SeededRandom } from '../../lib/SeededRandom';

export type Quirk = 
  | 'overvalues_cavalry'
  | 'fears_naval_warfare'
  | 'obsessed_with_symmetry'
  | 'avoids_forest_terrain'
  | 'overprotects_workers'
  | 'underestimates_artillery'
  | 'addicted_to_tech_research'
  | 'hates_air_units'
  | 'loves_defensive_structures'
  | 'resource_hoarder';

export interface QuirkProfile {
  quirks: Quirk[];
  obsessions: Quirk[];
  irrationalFears: Quirk[];
  quirkHistory: Array<{
    timestamp: number;
    quirk: Quirk;
    triggered: boolean;
    reason: string;
  }>;
}

export class QuirkyAI {
  private quirks: Set<Quirk>;
  private obsessions: Set<Quirk>;
  private irrationalFears: Set<Quirk>;
  private rng: SeededRandom;
  private quirkHistory: Array<{
    timestamp: number;
    quirk: Quirk;
    triggered: boolean;
    reason: string;
  }>;

  constructor(seed: number, initialQuirks?: Quirk[]) {
    this.rng = new SeededRandom(seed);
    this.quirks = new Set(initialQuirks || this.generateQuirks());
    this.obsessions = new Set();
    this.irrationalFears = new Set();
    this.quirkHistory = [];

    // Categorize quirks
    this.categorizeQuirks();
  }

  /**
   * Generate random quirks
   */
  private generateQuirks(): Quirk[] {
    const allQuirks: Quirk[] = [
      'overvalues_cavalry',
      'fears_naval_warfare',
      'obsessed_with_symmetry',
      'avoids_forest_terrain',
      'overprotects_workers',
      'underestimates_artillery',
      'addicted_to_tech_research',
      'hates_air_units',
      'loves_defensive_structures',
      'resource_hoarder'
    ];

    const numQuirks = this.rng.nextInt(1, 4); // 1-3 quirks
    return this.rng.sample(allQuirks, numQuirks);
  }

  /**
   * Categorize quirks into obsessions and fears
   */
  private categorizeQuirks(): void {
    this.quirks.forEach(quirk => {
      if (quirk.includes('overvalues') || quirk.includes('obsessed') || quirk.includes('loves') || quirk.includes('addicted')) {
        this.obsessions.add(quirk);
      } else if (quirk.includes('fears') || quirk.includes('hates') || quirk.includes('avoids') || quirk.includes('underestimates')) {
        this.irrationalFears.add(quirk);
      }
    });
  }

  /**
   * Apply quirks to decision
   */
  public applyQuirksToDecision(
    rationalDecision: string,
    gameState: any
  ): {
    decision: string;
    reasoning: string;
    quirkApplied: Quirk | null;
  } {
    let decision = rationalDecision;
    let quirkApplied: Quirk | null = null;
    let reasoning = 'Standard decision.';

    // Apply quirks that might override rational choice
    for (const quirk of this.quirks) {
      const shouldApply = this.shouldApplyQuirk(quirk, gameState);
      
      if (shouldApply) {
        const quirkDecision = this.applyQuirk(quirk, gameState);
        if (quirkDecision) {
          decision = quirkDecision.decision;
          reasoning = quirkDecision.reasoning;
          quirkApplied = quirk;
          
          // Record quirk trigger
          this.quirkHistory.push({
            timestamp: Date.now(),
            quirk,
            triggered: true,
            reason: reasoning
          });
          
          break; // Only apply one quirk at a time
        }
      }
    }

    return {
      decision,
      reasoning,
      quirkApplied
    };
  }

  /**
   * Check if quirk should be applied
   */
  private shouldApplyQuirk(quirk: Quirk, gameState: any): boolean {
    // Base probability based on quirk type
    let probability = 0.3; // 30% base chance

    // Obsessions are more likely to trigger
    if (this.obsessions.has(quirk)) {
      probability = 0.6;
    }

    // Fears are more likely when threat is present
    if (this.irrationalFears.has(quirk) && gameState.threatLevel > 0.5) {
      probability = 0.7;
    }

    return this.rng.nextFloat() < probability;
  }

  /**
   * Apply specific quirk
   */
  private applyQuirk(quirk: Quirk, gameState: any): {
    decision: string;
    reasoning: string;
  } | null {
    switch (quirk) {
      case 'overvalues_cavalry':
        if (this.shouldUseCavalry(gameState)) {
          return {
            decision: 'cavalry_emphasis',
            reasoning: 'Cavalry is the superior unit! Focusing all resources on mounted forces.'
          };
        }
        break;

      case 'fears_naval_warfare':
        if (this.navalThreatDetected(gameState)) {
          return {
            decision: 'avoid_naval_engagement',
            reasoning: 'Naval combat is... unsettling. Avoiding water-based engagements at all costs.'
          };
        }
        break;

      case 'obsessed_with_symmetry':
        if (!this.isBalanced(gameState)) {
          return {
            decision: 'balance_forces',
            reasoning: 'The asymmetry is disturbing. Must achieve perfect balance in all things.'
          };
        }
        break;

      case 'avoids_forest_terrain':
        if (this.forestTerrainDetected(gameState)) {
          return {
            decision: 'avoid_forest',
            reasoning: 'Forests are... unpredictable. Staying in open terrain where I can see everything.'
          };
        }
        break;

      case 'overprotects_workers':
        if (this.workersAtRisk(gameState)) {
          return {
            decision: 'protect_workers',
            reasoning: 'My workers are precious! Diverting all resources to protect them immediately!'
          };
        }
        break;

      case 'underestimates_artillery':
        if (this.artilleryThreatDetected(gameState)) {
          return {
            decision: 'ignore_artillery',
            reasoning: 'Artillery is overrated. Direct assault is always better.'
          };
        }
        break;

      case 'addicted_to_tech_research':
        if (this.canResearch(gameState)) {
          return {
            decision: 'tech_research',
            reasoning: 'Just one more technology... I need to research everything!'
          };
        }
        break;

      case 'hates_air_units':
        if (this.airUnitsDetected(gameState)) {
          return {
            decision: 'focus_anti_air',
            reasoning: 'Those flying abominations must be destroyed! Prioritizing anti-air defenses!'
          };
        }
        break;

      case 'loves_defensive_structures':
        if (this.shouldBuildDefenses(gameState)) {
          return {
            decision: 'build_defenses',
            reasoning: 'More walls! More towers! Defense is the best offense!'
          };
        }
        break;

      case 'resource_hoarder':
        if (this.shouldSpendResources(gameState)) {
          return {
            decision: 'hoard_resources',
            reasoning: 'I must save these resources. You never know when you\'ll need them...'
          };
        }
        break;
    }

    return null;
  }

  /**
   * Develop new quirks based on traumatic experiences
   */
  public developNewQuirks(playerInteraction: {
    type: string;
    severity: number;
    outcome: 'traumatic' | 'successful' | 'neutral';
  }): void {
    const developProbability = 0.3; // 30% chance to develop quirk

    if (playerInteraction.outcome === 'traumatic' && this.rng.nextFloat() < developProbability) {
      let newQuirk: Quirk | null = null;

      if (playerInteraction.type === 'surprise_naval_attack') {
        newQuirk = 'fears_naval_warfare';
      } else if (playerInteraction.type === 'cavalry_wipe') {
        newQuirk = 'overvalues_cavalry';
      } else if (playerInteraction.type === 'artillery_domination') {
        newQuirk = 'underestimates_artillery';
      } else if (playerInteraction.type === 'air_unit_rush') {
        newQuirk = 'hates_air_units';
      }

      if (newQuirk && !this.quirks.has(newQuirk)) {
        this.quirks.add(newQuirk);
        this.categorizeQuirks();
      }
    }
  }

  /**
   * Helper methods (simplified - would use actual game state analysis)
   */
  private shouldUseCavalry(gameState: any): boolean {
    return true; // Simplified
  }

  private navalThreatDetected(gameState: any): boolean {
    return gameState.navalUnits > 0; // Simplified
  }

  private isBalanced(gameState: any): boolean {
    return Math.abs(gameState.offensiveUnits - gameState.defensiveUnits) < 2;
  }

  private forestTerrainDetected(gameState: any): boolean {
    return gameState.terrainType === 'forest';
  }

  private workersAtRisk(gameState: any): boolean {
    return gameState.workerThreatLevel > 0.3;
  }

  private artilleryThreatDetected(gameState: any): boolean {
    return gameState.artilleryUnits > 0;
  }

  private canResearch(gameState: any): boolean {
    return gameState.researchOptions > 0;
  }

  private airUnitsDetected(gameState: any): boolean {
    return gameState.airUnits > 0;
  }

  private shouldBuildDefenses(gameState: any): boolean {
    return gameState.defensiveStructures < 5;
  }

  private shouldSpendResources(gameState: any): boolean {
    return gameState.resources.total > 1000;
  }

  /**
   * Get quirk profile
   */
  public getQuirkProfile(): QuirkProfile {
    return {
      quirks: Array.from(this.quirks),
      obsessions: Array.from(this.obsessions),
      irrationalFears: Array.from(this.irrationalFears),
      quirkHistory: [...this.quirkHistory]
    };
  }
}

