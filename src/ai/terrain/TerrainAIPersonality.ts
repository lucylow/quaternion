/**
 * Terrain-Aware AI Personality System
 * Implements strategic personalities that react intelligently to terrain features
 */

import { SeededRandom } from '../../lib/SeededRandom';

export enum AIPersonality {
  CAUTIOUS_GEOLOGIST = 'cautious_geologist',   // Values defensive positions, resource control
  RECKLESS_STORM_CHASER = 'reckless_storm_chaser', // Aggressive, risks dynamic tiles
  METHODICAL_ENGINEER = 'methodical_engineer',  // Focuses tech and terrain manipulation
  ADAPTIVE_SURVIVOR = 'adaptive_survivor'     // Reacts to opponent, counters terrain advantages
}

export interface TerrainAIPersonalityConfig {
  personality: AIPersonality;
  expansionWeight: number;    // 0-1
  defenseWeight: number;       // 0-1
  resourceWeight: number;      // 0-1
  techWeight: number;          // 0-1
  riskTolerance: number;       // 0-1
}

export interface TerrainAIAgent {
  personality: AIPersonality;
  config: TerrainAIPersonalityConfig;
  faction?: string;
  strategicValueCache: Map<string, number>;
  recentDecisions: Array<{
    action: string;
    reasoning: string;
    timestamp: number;
    outcome?: number;
  }>;
}

export class TerrainAIPersonalityManager {
  private rng: SeededRandom;
  
  // Personality-based weight modifiers
  private static readonly PERSONALITY_MODIFIERS: Record<AIPersonality, {
    expansion: number;
    defense: number;
    resource: number;
    tech: number;
    risk: number;
  }> = {
    [AIPersonality.CAUTIOUS_GEOLOGIST]: {
      expansion: 0.2,
      defense: 0.4,
      resource: 0.3,
      tech: 0.1,
      risk: -0.3
    },
    [AIPersonality.RECKLESS_STORM_CHASER]: {
      expansion: 0.4,
      defense: 0.1,
      resource: 0.2,
      tech: 0.1,
      risk: 0.4
    },
    [AIPersonality.METHODICAL_ENGINEER]: {
      expansion: 0.1,
      defense: 0.2,
      resource: 0.2,
      tech: 0.4,
      risk: 0.1
    },
    [AIPersonality.ADAPTIVE_SURVIVOR]: {
      expansion: 0.3,
      defense: 0.3,
      resource: 0.2,
      tech: 0.2,
      risk: 0.0
    }
  };

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Create a terrain-aware AI agent with specified personality
   */
  createAgent(
    personality: AIPersonality,
    faction?: string
  ): TerrainAIAgent {
    const modifiers = TerrainAIPersonalityManager.PERSONALITY_MODIFIERS[personality];
    
    const config: TerrainAIPersonalityConfig = {
      personality,
      expansionWeight: 0.3 + modifiers.expansion,
      defenseWeight: 0.25 + modifiers.defense,
      resourceWeight: 0.2 + modifiers.resource,
      techWeight: 0.15 + modifiers.tech,
      riskTolerance: 0.1 + modifiers.risk
    };

    // Normalize weights
    const total = config.expansionWeight + config.defenseWeight + 
                  config.resourceWeight + config.techWeight;
    config.expansionWeight /= total;
    config.defenseWeight /= total;
    config.resourceWeight /= total;
    config.techWeight /= total;

    return {
      personality,
      config,
      faction,
      strategicValueCache: new Map(),
      recentDecisions: []
    };
  }

  /**
   * Get personality weight modifier for a specific trait
   */
  getPersonalityWeight(
    personality: AIPersonality,
    baseWeight: number,
    trait: 'expansion' | 'defense' | 'resource' | 'tech' | 'risk'
  ): number {
    const modifiers = TerrainAIPersonalityManager.PERSONALITY_MODIFIERS[personality];
    const modifier = modifiers[trait];
    return baseWeight * (1 + modifier);
  }

  /**
   * Record a decision for learning purposes
   */
  recordDecision(
    agent: TerrainAIAgent,
    action: string,
    reasoning: string
  ): void {
    agent.recentDecisions.push({
      action,
      reasoning,
      timestamp: Date.now()
    });

    // Keep only recent decisions (last 50)
    if (agent.recentDecisions.length > 50) {
      agent.recentDecisions.shift();
    }
  }

  /**
   * Get personality description
   */
  getPersonalityDescription(personality: AIPersonality): string {
    const descriptions: Record<AIPersonality, string> = {
      [AIPersonality.CAUTIOUS_GEOLOGIST]: 
        'Values defensive positions and resource control. Prefers secure expansion over risky gambits.',
      [AIPersonality.RECKLESS_STORM_CHASER]: 
        'Aggressive and opportunistic. Willing to risk dynamic tiles for tactical advantages.',
      [AIPersonality.METHODICAL_ENGINEER]: 
        'Focuses on technological advancement and terrain manipulation. Systematic and precise.',
      [AIPersonality.ADAPTIVE_SURVIVOR]: 
        'Reacts to opponent behavior and counters terrain advantages. Highly adaptable.'
    };
    return descriptions[personality];
  }

  /**
   * Get recommended actions for personality
   */
  getRecommendedActions(personality: AIPersonality): string[] {
    const actions: Record<AIPersonality, string[]> = {
      [AIPersonality.CAUTIOUS_GEOLOGIST]: [
        'Secure defensible chokepoints',
        'Control resource nodes safely',
        'Build defensive structures',
        'Avoid risky dynamic tiles'
      ],
      [AIPersonality.RECKLESS_STORM_CHASER]: [
        'Rush dynamic tile opportunities',
        'Aggressive expansion',
        'Strike vulnerable enemy positions',
        'Take calculated risks'
      ],
      [AIPersonality.METHODICAL_ENGINEER]: [
        'Research terrain manipulation tech',
        'Build tech synergy structures',
        'Systematic expansion',
        'Optimize resource efficiency'
      ],
      [AIPersonality.ADAPTIVE_SURVIVOR]: [
        'Counter opponent strategies',
        'Adapt to terrain advantages',
        'React to enemy movements',
        'Flexible tactical approach'
      ]
    };
    return actions[personality];
  }
}

