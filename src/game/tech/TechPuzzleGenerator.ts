/**
 * Tech Puzzle Generator
 * Generates contextual puzzles based on game state
 */

import { TechTreeManager, TechNode } from '../TechTreeManager';
import { ResourceManager } from '../ResourceManager';

export enum PuzzleType {
  SEQUENCE_OPTIMIZATION = 'sequence_optimization',
  BUDGET_ALLOCATION = 'budget_allocation',
  SYNERGY_DISCOVERY = 'synergy_discovery',
  COUNTER_PICK = 'counter_pick',
  TIME_GATED = 'time_gated'
}

export interface GeneratedPuzzle {
  puzzleId: string;
  scenarioDescription: string;
  availableOptions: TechNode[];
  constraintWeights: {
    budget?: number;
    time?: number;
    urgency?: number;
  };
  successCondition: string;
  optimalSolution: string[];
  puzzleType: PuzzleType;
  aiNarrative: string;
}

export interface PuzzleContext {
  currentResources: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
  researchedTech: string[];
  availableTech: TechNode[];
  enemyComposition?: {
    hasAir: boolean;
    hasHeavy: boolean;
    hasStealth: boolean;
  };
  mapObjectives?: string[];
  gamePhase: number;
}

export class TechPuzzleGenerator {
  private techManager: TechTreeManager;
  private resourceManager: ResourceManager;

  constructor(techManager: TechTreeManager, resourceManager: ResourceManager) {
    this.techManager = techManager;
    this.resourceManager = resourceManager;
  }

  /**
   * Generate a contextual puzzle based on current game state
   */
  public generateContextualPuzzle(context: PuzzleContext): GeneratedPuzzle | null {
    const puzzleType = this.determinePuzzleType(context);

    switch (puzzleType) {
      case PuzzleType.SYNERGY_DISCOVERY:
        return this.generateSynergyPuzzle(context);
      case PuzzleType.COUNTER_PICK:
        return this.generateCounterPuzzle(context);
      case PuzzleType.BUDGET_ALLOCATION:
        return this.generateBudgetPuzzle(context);
      case PuzzleType.SEQUENCE_OPTIMIZATION:
        return this.generateSequencePuzzle(context);
      default:
        return null;
    }
  }

  /**
   * Determine appropriate puzzle type based on context
   */
  private determinePuzzleType(context: PuzzleContext): PuzzleType {
    // Check for synergy potential
    if (context.researchedTech.length >= 3 && this.hasSynergyPotential(context)) {
      return PuzzleType.SYNERGY_DISCOVERY;
    }

    // Check for enemy threats
    if (context.enemyComposition && this.hasSpecializedThreats(context.enemyComposition)) {
      return PuzzleType.COUNTER_PICK;
    }

    // Check for resource constraints
    const totalResources = context.currentResources.ore + context.currentResources.energy +
      context.currentResources.biomass + context.currentResources.data;
    if (totalResources < 300) {
      return PuzzleType.BUDGET_ALLOCATION;
    }

    return PuzzleType.SEQUENCE_OPTIMIZATION;
  }

  /**
   * Generate synergy discovery puzzle
   */
  private generateSynergyPuzzle(context: PuzzleContext): GeneratedPuzzle {
    // Find techs with synergy relationships
    const synergyClusters = this.findSynergyClusters(context.availableTech, context.researchedTech);

    if (synergyClusters.length === 0) {
      return this.generateSequencePuzzle(context); // Fallback
    }

    const cluster = synergyClusters[0];
    const available = cluster.filter(node => !context.researchedTech.includes(node.nodeId));

    return {
      puzzleId: `synergy_${Date.now()}`,
      scenarioDescription: `You've unlocked several ${cluster[0]?.category} technologies. Research the right combination to unlock a powerful synergy bonus.`,
      availableOptions: available.slice(0, 4),
      constraintWeights: {
        budget: 0.7,
        time: 0.5,
        urgency: 0.3
      },
      successCondition: 'Unlock at least 2 nodes from the synergy cluster',
      optimalSolution: available.slice(0, 2).map(n => n.nodeId),
      puzzleType: PuzzleType.SYNERGY_DISCOVERY,
      aiNarrative: 'Multiple technologies in this cluster work together. Choose wisely to maximize their combined potential.'
    };
  }

  /**
   * Generate counter-pick puzzle
   */
  private generateCounterPuzzle(context: PuzzleContext): GeneratedPuzzle {
    const enemy = context.enemyComposition!;
    const counterTechs = context.availableTech.filter(node => {
      // Find techs that counter enemy composition
      if (enemy.hasAir && node.unitUnlocks.some(id => id.includes('anti_air'))) {
        return true;
      }
      if (enemy.hasHeavy && node.unitUnlocks.some(id => id.includes('heavy') || id.includes('artillery'))) {
        return true;
      }
      if (enemy.hasStealth && node.unitUnlocks.some(id => id.includes('detector') || id.includes('scout'))) {
        return true;
      }
      return false;
    });

    return {
      puzzleId: `counter_${Date.now()}`,
      scenarioDescription: `Enemy forces are deploying specialized units. Choose the right counter-technology to neutralize their advantage.`,
      availableOptions: counterTechs.slice(0, 3),
      constraintWeights: {
        budget: 0.6,
        time: 0.8, // High urgency
        urgency: 0.9
      },
      successCondition: 'Research a counter-technology before enemy advantage becomes overwhelming',
      optimalSolution: counterTechs.length > 0 ? [counterTechs[0].nodeId] : [],
      puzzleType: PuzzleType.COUNTER_PICK,
      aiNarrative: 'Time is critical. The enemy has a tactical advantage that must be countered quickly.'
    };
  }

  /**
   * Generate budget allocation puzzle
   */
  private generateBudgetPuzzle(context: PuzzleContext): GeneratedPuzzle {
    const affordable = context.availableTech.filter(node => {
      const cost = (node.cost.ore || 0) + (node.cost.energy || 0) + 
                   (node.cost.biomass || 0) + (node.cost.data || 0);
      const budget = context.currentResources.ore + context.currentResources.energy +
                    context.currentResources.biomass + context.currentResources.data;
      return cost <= budget * 0.8; // Can afford with some buffer
    });

    return {
      puzzleId: `budget_${Date.now()}`,
      scenarioDescription: `Resources are limited. You can only afford one major research project. Choose the option that maximizes your strategic position.`,
      availableOptions: affordable.slice(0, 4),
      constraintWeights: {
        budget: 1.0, // Critical constraint
        time: 0.4,
        urgency: 0.5
      },
      successCondition: 'Select the tech that provides best value for limited resources',
      optimalSolution: affordable.length > 0 ? [affordable[0].nodeId] : [],
      puzzleType: PuzzleType.BUDGET_ALLOCATION,
      aiNarrative: 'Every resource counts. Make your choice carefully - there may not be a second chance.'
    };
  }

  /**
   * Generate sequence optimization puzzle
   */
  private generateSequencePuzzle(context: PuzzleContext): GeneratedPuzzle {
    const available = context.availableTech.slice(0, 4);

    return {
      puzzleId: `sequence_${Date.now()}`,
      scenarioDescription: `Multiple research paths are available. The order you choose matters - some technologies unlock more powerful options when researched in sequence.`,
      availableOptions: available,
      constraintWeights: {
        budget: 0.5,
        time: 0.6,
        urgency: 0.4
      },
      successCondition: 'Research technologies in optimal sequence to maximize benefits',
      optimalSolution: available.slice(0, 2).map(n => n.nodeId),
      puzzleType: PuzzleType.SEQUENCE_OPTIMIZATION,
      aiNarrative: 'The path you choose now will shape your strategic options later. Plan ahead.'
    };
  }

  /**
   * Find synergy clusters in available tech
   */
  private findSynergyClusters(availableTech: TechNode[], researchedTech: string[]): TechNode[][] {
    const clusters: TechNode[][] = [];
    const processed = new Set<string>();

    for (const node of availableTech) {
      if (processed.has(node.nodeId)) continue;

      const cluster: TechNode[] = [node];
      const toCheck = [...node.synergyNodes];

      while (toCheck.length > 0) {
        const synergyId = toCheck.pop()!;
        const synergyNode = availableTech.find(n => n.nodeId === synergyId);
        
        if (synergyNode && !processed.has(synergyId)) {
          cluster.push(synergyNode);
          processed.add(synergyId);
          toCheck.push(...synergyNode.synergyNodes);
        }
      }

      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Check if context has synergy potential
   */
  private hasSynergyPotential(context: PuzzleContext): boolean {
    const clusters = this.findSynergyClusters(context.availableTech, context.researchedTech);
    return clusters.length > 0;
  }

  /**
   * Check if enemy has specialized threats
   */
  private hasSpecializedThreats(enemy: { hasAir: boolean; hasHeavy: boolean; hasStealth: boolean }): boolean {
    return enemy.hasAir || enemy.hasHeavy || enemy.hasStealth;
  }
}


