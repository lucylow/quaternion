/**
 * Sequence Simulator
 * Provides "what-if" analysis for tech research sequences
 */

import { TechTreeManager, TechNode } from '../TechTreeManager';
import { ResourceManager, ResourceType } from '../ResourceManager';
import { TechTreeSolver, PuzzleContext } from './TechTreeSolver';

export interface SequencePreview {
  sequence: TechNode[];
  projectedResources: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
  projectedEffects: string[];
  totalCost: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
  totalTime: number;
  synergyBonus: number;
}

export class SequenceSimulator {
  private techManager: TechTreeManager;
  private resourceManager: ResourceManager;
  private solver: TechTreeSolver;

  constructor(
    techManager: TechTreeManager,
    resourceManager: ResourceManager,
    solver: TechTreeSolver
  ) {
    this.techManager = techManager;
    this.resourceManager = resourceManager;
    this.solver = solver;
  }

  /**
   * Preview a 2-turn sequence starting with a given node
   */
  public previewSequence(
    startingNode: TechNode,
    currentContext: PuzzleContext
  ): SequencePreview {
    const sequence: TechNode[] = [startingNode];
    const projectedResources = { ...currentContext.currentResources };
    const projectedResearched = [...currentContext.researchedTech];
    const projectedEffects: string[] = [];
    let totalTime = startingNode.researchTime;
    let synergyBonus = 0;

    // Simulate first research
    this.simulateResearch(startingNode, projectedResources, projectedResearched, projectedEffects);
    synergyBonus += this.calculateSynergyBonus(startingNode, projectedResearched);

    // Find best follow-up research
    const availableAfterFirst = this.getAvailableAfterResearch(
      startingNode,
      currentContext.availableTech,
      projectedResearched
    );

    if (availableAfterFirst.length > 0) {
      // Use solver to find best follow-up
      const followUpContext: PuzzleContext = {
        ...currentContext,
        currentResources: projectedResources,
        researchedTech: projectedResearched,
        availableTech: availableAfterFirst
      };

      const evaluations = this.solver.evaluateAvailableTechs(followUpContext);
      if (evaluations.length > 0 && this.canAfford(evaluations[0].node.cost, projectedResources)) {
        const followUp = evaluations[0].node;
        sequence.push(followUp);
        totalTime += followUp.researchTime;
        this.simulateResearch(followUp, projectedResources, projectedResearched, projectedEffects);
        synergyBonus += this.calculateSynergyBonus(followUp, projectedResearched);
      }
    }

    // Calculate total cost
    const totalCost = {
      ore: sequence.reduce((sum, node) => sum + (node.cost.ore || 0), 0),
      energy: sequence.reduce((sum, node) => sum + (node.cost.energy || 0), 0),
      biomass: sequence.reduce((sum, node) => sum + (node.cost.biomass || 0), 0),
      data: sequence.reduce((sum, node) => sum + (node.cost.data || 0), 0)
    };

    return {
      sequence,
      projectedResources,
      projectedEffects,
      totalCost,
      totalTime,
      synergyBonus
    };
  }

  /**
   * Simulate researching a node (spend resources, apply effects)
   */
  private simulateResearch(
    node: TechNode,
    resources: PuzzleContext['currentResources'],
    researched: string[],
    effects: string[]
  ): void {
    // Spend resources
    if (node.cost.ore) resources.ore -= node.cost.ore;
    if (node.cost.energy) resources.energy -= node.cost.energy;
    if (node.cost.biomass) resources.biomass -= node.cost.biomass;
    if (node.cost.data) resources.data -= node.cost.data;

    // Mark as researched
    researched.push(node.nodeId);

    // Collect effect descriptions
    for (const effect of node.effects) {
      if (effect.type === 'resource_modifier') {
        const multiplier = effect.isMultiplicative ? effect.value : 1;
        effects.push(`${effect.target}: ${multiplier > 1 ? '+' : ''}${((multiplier - 1) * 100).toFixed(0)}%`);
      } else {
        effects.push(`${effect.target}: ${effect.value > 0 ? '+' : ''}${effect.value}`);
      }
    }

    // Add unit/building unlocks
    for (const unitId of node.unitUnlocks) {
      effects.push(`Unlocks: ${unitId}`);
    }
    for (const buildingId of node.buildingUnlocks) {
      effects.push(`Unlocks: ${buildingId}`);
    }
  }

  /**
   * Get available techs after researching a node
   */
  private getAvailableAfterResearch(
    researchedNode: TechNode,
    availableTech: TechNode[],
    projectedResearched: string[]
  ): TechNode[] {
    return availableTech.filter(node => {
      if (projectedResearched.includes(node.nodeId)) return false;
      if (node.isResearched) return false;

      // Check if prerequisites are met
      return node.prerequisiteNodes.every(prereq => 
        projectedResearched.includes(prereq) || prereq === researchedNode.nodeId
      );
    });
  }

  /**
   * Calculate synergy bonus for a node given researched techs
   */
  private calculateSynergyBonus(node: TechNode, researched: string[]): number {
    let bonus = 0;
    for (const synergyId of node.synergyNodes) {
      if (researched.includes(synergyId)) {
        bonus += 0.15; // Base synergy bonus
      }
    }
    return bonus;
  }

  /**
   * Check if can afford a cost
   */
  private canAfford(
    cost: TechNode['cost'],
    resources: PuzzleContext['currentResources']
  ): boolean {
    return (
      (!cost.ore || resources.ore >= cost.ore) &&
      (!cost.energy || resources.energy >= cost.energy) &&
      (!cost.biomass || resources.biomass >= cost.biomass) &&
      (!cost.data || resources.data >= cost.data)
    );
  }

  /**
   * Compare two sequences and return the better one
   */
  public compareSequences(
    sequence1: SequencePreview,
    sequence2: SequencePreview
  ): SequencePreview {
    // Simple comparison: prefer higher synergy bonus, lower total time
    const score1 = sequence1.synergyBonus * 100 - sequence1.totalTime * 0.1;
    const score2 = sequence2.synergyBonus * 100 - sequence2.totalTime * 0.1;

    return score1 > score2 ? sequence1 : sequence2;
  }

  /**
   * Generate optimal sequence for next N turns
   */
  public generateOptimalSequence(
    context: PuzzleContext,
    turns: number = 2
  ): SequencePreview {
    const optimalSequence = this.solver.generateOptimalSequence(context, turns);
    const nodes = optimalSequence
      .map(id => this.techManager.getTechNode(id))
      .filter((node): node is TechNode => node !== undefined);

    if (nodes.length === 0) {
      return {
        sequence: [],
        projectedResources: context.currentResources,
        projectedEffects: [],
        totalCost: { ore: 0, energy: 0, biomass: 0, data: 0 },
        totalTime: 0,
        synergyBonus: 0
      };
    }

    // Simulate the sequence
    const projectedResources = { ...context.currentResources };
    const projectedResearched = [...context.researchedTech];
    const projectedEffects: string[] = [];
    let totalTime = 0;
    let synergyBonus = 0;

    for (const node of nodes) {
      totalTime += node.researchTime;
      this.simulateResearch(node, projectedResources, projectedResearched, projectedEffects);
      synergyBonus += this.calculateSynergyBonus(node, projectedResearched);
    }

    const totalCost = {
      ore: nodes.reduce((sum, node) => sum + (node.cost.ore || 0), 0),
      energy: nodes.reduce((sum, node) => sum + (node.cost.energy || 0), 0),
      biomass: nodes.reduce((sum, node) => sum + (node.cost.biomass || 0), 0),
      data: nodes.reduce((sum, node) => sum + (node.cost.data || 0), 0)
    };

    return {
      sequence: nodes,
      projectedResources,
      projectedEffects,
      totalCost,
      totalTime,
      synergyBonus
    };
  }
}

