/**
 * Adaptive Combat AI System
 * Units develop unique combat personalities and adapt to player tactics
 */

import type { UnitInstance } from '../UnitManager';

export interface CombatTraits {
  aggression: number; // 0-1: How aggressive the unit is
  cautious: number; // 0-1: How careful the unit is
  tactical: number; // 0-1: How tactical/strategic
  creative: number; // 0-1: How likely to use unconventional tactics
}

export interface PlayerBehaviorProfile {
  prefersStealth: boolean;
  prefersAggression: boolean;
  prefersRush: boolean;
  prefersDefense: boolean;
  usesFlanking: boolean;
  usesArtillery: boolean;
  averageEngagementRange: number;
}

export interface CombatSituation {
  unitHealth: number;
  enemyCount: number;
  allyCount: number;
  terrainAdvantage: number; // 0-1
  resourceAvailable: number;
  coverAvailable: boolean;
  highGroundAvailable: boolean;
}

export interface CombatDecision {
  type: 'attack' | 'retreat' | 'flank' | 'hold' | 'use_ability' | 'environmental_trap' | 'false_retreat';
  target?: string;
  position?: { x: number; y: number };
  ability?: string;
  confidence: number; // 0-1
}

export class AdaptiveCombatAI {
  private unitTraits: Map<string, CombatTraits> = new Map();
  private playerProfile: PlayerBehaviorProfile | null = null;
  private combatHistory: Map<string, CombatDecision[]> = new Map();

  /**
   * Initialize combat traits for a unit
   */
  initializeUnit(unitId: string, baseTraits?: Partial<CombatTraits>): void {
    this.unitTraits.set(unitId, {
      aggression: baseTraits?.aggression ?? 0.5,
      cautious: baseTraits?.cautious ?? 0.5,
      tactical: baseTraits?.tactical ?? 0.5,
      creative: baseTraits?.creative ?? 0.5
    });
  }

  /**
   * Develop combat personality based on player behavior
   */
  developCombatPersonality(unitId: string, playerProfile: PlayerBehaviorProfile): void {
    this.playerProfile = playerProfile;
    const traits = this.unitTraits.get(unitId) || this.getDefaultTraits();

    if (playerProfile.prefersStealth) {
      traits.cautious = Math.min(1, traits.cautious + 0.1);
      traits.tactical = Math.min(1, traits.tactical + 0.2);
      this.learnMotionSensors(unitId);
    }

    if (playerProfile.prefersAggression) {
      traits.aggression = Math.min(1, traits.aggression + 0.3);
      traits.creative = Math.min(1, traits.creative + 0.1);
      this.learnFlankingPatterns(unitId);
    }

    if (playerProfile.usesFlanking) {
      traits.tactical = Math.min(1, traits.tactical + 0.15);
      this.learnCounterFlanking(unitId);
    }

    if (playerProfile.usesArtillery) {
      traits.cautious = Math.min(1, traits.cautious + 0.2);
      this.learnArtilleryAvoidance(unitId);
    }

    this.unitTraits.set(unitId, traits);
  }

  /**
   * Make tactical decision based on situation and personality
   */
  makeTacticalDecision(
    unitId: string,
    unit: UnitInstance,
    situation: CombatSituation
  ): CombatDecision {
    const traits = this.unitTraits.get(unitId) || this.getDefaultTraits();
    let decision: CombatDecision | null = null;
    let bestScore = 0;

    // Evaluate options based on personality
    if (traits.aggression > 0.7) {
      const aggressiveDecision = this.evaluateAggressiveOptions(unit, situation);
      if (aggressiveDecision.confidence > bestScore) {
        decision = aggressiveDecision;
        bestScore = aggressiveDecision.confidence;
      }
    }

    if (traits.tactical > 0.7) {
      const tacticalDecision = this.evaluateTacticalOptions(unit, situation);
      if (tacticalDecision.confidence > bestScore) {
        decision = tacticalDecision;
        bestScore = tacticalDecision.confidence;
      }
    }

    if (traits.creative > 0.6) {
      const creativeDecision = this.evaluateCreativeOptions(unit, situation);
      if (creativeDecision.confidence > bestScore) {
        decision = creativeDecision;
        bestScore = creativeDecision.confidence;
      }
    }

    if (traits.cautious > 0.7 && situation.unitHealth < 0.3) {
      const cautiousDecision = this.evaluateCautiousOptions(unit, situation);
      if (cautiousDecision.confidence > bestScore) {
        decision = cautiousDecision;
        bestScore = cautiousDecision.confidence;
      }
    }

    // Fallback to default if no good decision
    if (!decision || bestScore < 0.3) {
      decision = {
        type: 'hold',
        confidence: 0.5
      };
    }

    // Record decision for learning
    this.recordDecision(unitId, decision);

    return decision;
  }

  /**
   * Evaluate aggressive combat options
   */
  private evaluateAggressiveOptions(
    unit: UnitInstance,
    situation: CombatSituation
  ): CombatDecision {
    if (situation.enemyCount === 0) {
      return { type: 'hold', confidence: 0.1 };
    }

    // Aggressive units prefer direct attack
    const healthFactor = situation.unitHealth;
    const advantageFactor = situation.terrainAdvantage;

    if (healthFactor > 0.5 && advantageFactor > 0.3) {
      return {
        type: 'attack',
        confidence: 0.8 * healthFactor * (1 + advantageFactor)
      };
    }

    return { type: 'attack', confidence: 0.5 * healthFactor };
  }

  /**
   * Evaluate tactical combat options
   */
  private evaluateTacticalOptions(
    unit: UnitInstance,
    situation: CombatSituation
  ): CombatDecision {
    // Tactical units prefer positioning and flanking
    if (situation.highGroundAvailable) {
      return {
        type: 'hold',
        position: { x: unit.x, y: unit.y }, // Would calculate high ground position
        confidence: 0.7
      };
    }

    if (situation.coverAvailable && situation.unitHealth < 0.5) {
      return {
        type: 'hold',
        confidence: 0.6
      };
    }

    // Flanking opportunity
    if (situation.enemyCount > 0 && situation.allyCount > 1) {
      return {
        type: 'flank',
        confidence: 0.65
      };
    }

    return { type: 'hold', confidence: 0.4 };
  }

  /**
   * Evaluate creative/unconventional tactics
   */
  private evaluateCreativeOptions(
    unit: UnitInstance,
    situation: CombatSituation
  ): CombatDecision {
    const creativeTactics: CombatDecision[] = [];

    // Environmental trap (lure player into hazard)
    if (situation.terrainAdvantage < 0.3) {
      creativeTactics.push({
        type: 'environmental_trap',
        confidence: 0.6
      });
    }

    // False retreat (feign weakness to draw into ambush)
    if (situation.unitHealth < 0.4 && situation.allyCount > 2) {
      creativeTactics.push({
        type: 'false_retreat',
        confidence: 0.7
      });
    }

    // Use ability creatively
    if (unit.definition.abilities && unit.definition.abilities.length > 0) {
      const ability = unit.definition.abilities[0];
      if (unit.abilityCooldowns.get(ability.abilityId) === 0) {
        creativeTactics.push({
          type: 'use_ability',
          ability: ability.abilityId,
          confidence: 0.65
        });
      }
    }

    // Return best creative option
    if (creativeTactics.length > 0) {
      return creativeTactics.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
    }

    return { type: 'hold', confidence: 0.3 };
  }

  /**
   * Evaluate cautious options
   */
  private evaluateCautiousOptions(
    unit: UnitInstance,
    situation: CombatSituation
  ): CombatDecision {
    if (situation.unitHealth < 0.3) {
      return {
        type: 'retreat',
        confidence: 0.8
      };
    }

    if (situation.coverAvailable) {
      return {
        type: 'hold',
        confidence: 0.7
      };
    }

    return { type: 'hold', confidence: 0.5 };
  }

  /**
   * Learn motion sensor usage
   */
  private learnMotionSensors(unitId: string): void {
    // Units learn to use detection abilities when player is stealthy
    // This would integrate with unit abilities system
    console.log(`Unit ${unitId} learned motion sensor tactics`);
  }

  /**
   * Learn flanking patterns
   */
  private learnFlankingPatterns(unitId: string): void {
    // Units learn to flank when player is aggressive
    console.log(`Unit ${unitId} learned flanking patterns`);
  }

  /**
   * Learn counter-flanking
   */
  private learnCounterFlanking(unitId: string): void {
    // Units learn to counter player's flanking attempts
    console.log(`Unit ${unitId} learned counter-flanking`);
  }

  /**
   * Learn artillery avoidance
   */
  private learnArtilleryAvoidance(unitId: string): void {
    // Units learn to spread out and use cover when player uses artillery
    console.log(`Unit ${unitId} learned artillery avoidance`);
  }

  /**
   * Record decision for learning
   */
  private recordDecision(unitId: string, decision: CombatDecision): void {
    if (!this.combatHistory.has(unitId)) {
      this.combatHistory.set(unitId, []);
    }

    const history = this.combatHistory.get(unitId)!;
    history.push(decision);

    // Keep last 20 decisions
    if (history.length > 20) {
      history.shift();
    }
  }

  /**
   * Get default traits
   */
  private getDefaultTraits(): CombatTraits {
    return {
      aggression: 0.5,
      cautious: 0.5,
      tactical: 0.5,
      creative: 0.5
    };
  }

  /**
   * Get unit traits
   */
  getUnitTraits(unitId: string): CombatTraits | null {
    return this.unitTraits.get(unitId) || null;
  }

  /**
   * Update player profile
   */
  updatePlayerProfile(profile: Partial<PlayerBehaviorProfile>): void {
    if (!this.playerProfile) {
      this.playerProfile = {
        prefersStealth: false,
        prefersAggression: false,
        prefersRush: false,
        prefersDefense: false,
        usesFlanking: false,
        usesArtillery: false,
        averageEngagementRange: 0
      };
    }

    this.playerProfile = { ...this.playerProfile, ...profile };
  }
}

