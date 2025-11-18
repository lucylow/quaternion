/**
 * Tech Tree Puzzle Solver & Recommendation Engine
 * Implements heuristic evaluation, knapsack solving, and sequence optimization
 */

import { TechTreeManager, TechNode, TechCategory } from '../TechTreeManager';
import { ResourceManager, ResourceType, ResourceCost } from '../ResourceManager';

export interface PuzzleContext {
  currentResources: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
  researchedTech: string[];
  availableTech: TechNode[];
  gamePhase: number; // 0-1, where 0 = early game, 1 = late game
  enemyComposition?: {
    hasAir: boolean;
    hasHeavy: boolean;
    hasStealth: boolean;
    unitCount: number;
  };
  mapState?: {
    controlledNodes: number;
    hasChokepoint: boolean;
    hasAirfield: boolean;
    criticalObjectives: string[];
  };
  playerStyle?: 'aggressive' | 'defensive' | 'economic' | 'balanced';
}

export interface TechEvaluation {
  node: TechNode;
  totalScore: number;
  immediateImpact: number;
  longTermValue: number;
  synergyBonus: number;
  urgencyScore: number;
  reasoning: string;
  recommendedSequence?: string[];
}

export class TechTreeSolver {
  private techManager: TechTreeManager;
  private resourceManager: ResourceManager;
  private baseSynergyBonus: number = 0.15;
  private planningHorizon: number = 3; // Turns to look ahead

  constructor(techManager: TechTreeManager, resourceManager: ResourceManager) {
    this.techManager = techManager;
    this.resourceManager = resourceManager;
  }

  /**
   * Evaluate all available techs and return ranked recommendations
   */
  public evaluateAvailableTechs(context: PuzzleContext): TechEvaluation[] {
    const evaluations: TechEvaluation[] = [];

    for (const node of context.availableTech) {
      if (node.isResearched) continue;

      const evaluation: TechEvaluation = {
        node,
        totalScore: 0,
        immediateImpact: 0,
        longTermValue: 0,
        synergyBonus: 0,
        urgencyScore: 0,
        reasoning: ''
      };

      // Calculate component scores
      evaluation.immediateImpact = this.calculateImmediateImpact(node, context);
      evaluation.longTermValue = this.calculateLongTermValue(node, context);
      evaluation.synergyBonus = this.calculateSynergyBonus(node, context);
      evaluation.urgencyScore = this.calculateUrgencyScore(node, context);

      // Combine scores with weights based on game phase
      evaluation.totalScore = this.combineScores(evaluation, context);

      // Generate reasoning
      evaluation.reasoning = this.generateEvaluationReasoning(evaluation, context);

      evaluations.push(evaluation);
    }

    return evaluations.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate immediate impact of a tech node
   */
  private calculateImmediateImpact(node: TechNode, context: PuzzleContext): number {
    let impact = 0;

    // Unit unlocks - high immediate value
    for (const unitId of node.unitUnlocks) {
      impact += this.estimateUnitStrategicValue(unitId, context) * 50;
    }

    // Building unlocks
    for (const buildingId of node.buildingUnlocks) {
      impact += this.estimateBuildingValue(buildingId, context) * 30;
    }

    // Immediate effects
    for (const effect of node.effects) {
      impact += this.estimateEffectValue(effect, context, true);
    }

    // Apply cost efficiency
    const totalCost = this.getTotalCost(node.cost);
    if (totalCost > 0) {
      impact = impact / (1 + totalCost * 0.01);
    }

    return impact;
  }

  /**
   * Calculate long-term value of a tech node
   */
  private calculateLongTermValue(node: TechNode, context: PuzzleContext): number {
    let longTermValue = 0;

    // Long-term effects
    for (const effect of node.effects) {
      longTermValue += this.estimateEffectValue(effect, context, false) * 1.5;
    }

    // Downstream nodes unlocked
    const downstreamNodes = this.getDownstreamNodes(node, context.availableTech);
    for (const downstream of downstreamNodes) {
      longTermValue += downstream.strategicWeight * 0.3;
    }

    // Synergy potential
    longTermValue += this.calculateSynergyPotential(node, context) * 0.5;

    return longTermValue;
  }

  /**
   * Calculate synergy bonus from already-researched synergy nodes
   */
  private calculateSynergyBonus(node: TechNode, context: PuzzleContext): number {
    let synergyBonus = 0;

    // Check for researched synergy nodes
    for (const synergyId of node.synergyNodes) {
      if (context.researchedTech.includes(synergyId)) {
        synergyBonus += this.baseSynergyBonus;
      }
    }

    // Cluster synergy - multiple nodes from same category
    const clusterCount = context.researchedTech.filter(techId => {
      const tech = this.techManager.getTechNode(techId);
      return tech && tech.category === node.category;
    }).length;

    synergyBonus += clusterCount * 0.1;

    return synergyBonus;
  }

  /**
   * Calculate urgency score based on game state
   */
  private calculateUrgencyScore(node: TechNode, context: PuzzleContext): number {
    let urgency = node.strategicWeight * 0.5; // Base urgency from node

    // Enemy composition urgency
    if (context.enemyComposition) {
      if (node.unitUnlocks.some(id => id.includes('anti_air')) && context.enemyComposition.hasAir) {
        urgency += 0.4;
      }
      if (node.unitUnlocks.some(id => id.includes('heavy')) && context.enemyComposition.hasHeavy) {
        urgency += 0.3;
      }
    }

    // Map-based urgency
    if (context.mapState) {
      if (context.mapState.hasAirfield && node.unitUnlocks.some(id => id.includes('air'))) {
        urgency += 0.3;
      }
      if (context.mapState.criticalObjectives.includes(node.nodeId)) {
        urgency += 0.4;
      }
    }

    // Resource scarcity urgency
    if (node.category === TechCategory.INFRASTRUCTURE) {
      const resourceShortage = this.detectResourceShortage(context.currentResources);
      if (resourceShortage > 0.3) {
        urgency += 0.2;
      }
    }

    return Math.min(1.0, urgency);
  }

  /**
   * Combine scores with weights based on game phase
   */
  private combineScores(evaluation: TechEvaluation, context: PuzzleContext): number {
    const gamePhase = context.gamePhase;

    // Early game favors immediate impact
    if (gamePhase < 0.3) {
      return (
        evaluation.immediateImpact * 0.6 +
        evaluation.longTermValue * 0.2 +
        evaluation.synergyBonus * 0.1 +
        evaluation.urgencyScore * 0.1
      );
    }
    // Mid game balanced
    else if (gamePhase < 0.7) {
      return (
        evaluation.immediateImpact * 0.4 +
        evaluation.longTermValue * 0.3 +
        evaluation.synergyBonus * 0.2 +
        evaluation.urgencyScore * 0.1
      );
    }
    // Late game favors synergies and long-term
    else {
      return (
        evaluation.immediateImpact * 0.2 +
        evaluation.longTermValue * 0.4 +
        evaluation.synergyBonus * 0.3 +
        evaluation.urgencyScore * 0.1
      );
    }
  }

  /**
   * Solve knapsack puzzle for budget-constrained selection
   */
  public solveKnapsackPuzzle(
    availableNodes: TechNode[],
    budget: ResourceCost,
    timeLimit: number
  ): TechNode[] {
    // Convert budget to single value for DP
    const budgetValue = this.getTotalCost(budget);
    const n = availableNodes.length;

    // DP table: dp[i][w] = max value with first i items and budget w
    const dp: number[][] = Array(n + 1)
      .fill(null)
      .map(() => Array(Math.floor(budgetValue) + 1).fill(0));

    // Fill DP table
    for (let i = 1; i <= n; i++) {
      const node = availableNodes[i - 1];
      const nodeCost = this.getTotalCost(node.cost);
      const nodeValue = this.estimateNodeValue(node);

      for (let w = 0; w <= Math.floor(budgetValue); w++) {
        if (nodeCost <= w) {
          dp[i][w] = Math.max(
            dp[i - 1][w],
            dp[i - 1][w - Math.floor(nodeCost)] + nodeValue
          );
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }

    // Reconstruct solution
    return this.reconstructSolution(dp, availableNodes, Math.floor(budgetValue));
  }

  /**
   * Reconstruct solution from DP table
   */
  private reconstructSolution(
    dp: number[][],
    nodes: TechNode[],
    budget: number
  ): TechNode[] {
    const solution: TechNode[] = [];
    let w = budget;

    for (let i = nodes.length; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        const node = nodes[i - 1];
        solution.push(node);
        w -= Math.floor(this.getTotalCost(node.cost));
      }
    }

    return solution;
  }

  /**
   * Generate optimal sequence for next N turns
   */
  public generateOptimalSequence(
    context: PuzzleContext,
    turns: number = 2
  ): string[] {
    const sequence: string[] = [];
    const projectedResources = { ...context.currentResources };
    const projectedResearched = [...context.researchedTech];

    for (let turn = 0; turn < turns; turn++) {
      const available = context.availableTech.filter(
        node => !projectedResearched.includes(node.nodeId) && this.canAfford(node.cost, projectedResources)
      );

      if (available.length === 0) break;

      const evaluations = this.evaluateAvailableTechs({
        ...context,
        currentResources: projectedResources,
        researchedTech: projectedResearched,
        availableTech: available
      });

      if (evaluations.length > 0) {
        const best = evaluations[0];
        sequence.push(best.node.nodeId);
        projectedResearched.push(best.node.nodeId);
        // Simulate resource spending
        this.spendResources(best.node.cost, projectedResources);
      }
    }

    return sequence;
  }

  // Helper methods

  private getTotalCost(cost: ResourceCost): number {
    return (cost.ore || 0) + (cost.energy || 0) * 0.8 + (cost.biomass || 0) * 0.6 + (cost.data || 0) * 1.2;
  }

  private canAfford(cost: ResourceCost, resources: PuzzleContext['currentResources']): boolean {
    return (
      (!cost.ore || resources.ore >= cost.ore) &&
      (!cost.energy || resources.energy >= cost.energy) &&
      (!cost.biomass || resources.biomass >= cost.biomass) &&
      (!cost.data || resources.data >= cost.data)
    );
  }

  private spendResources(cost: ResourceCost, resources: PuzzleContext['currentResources']): void {
    if (cost.ore) resources.ore -= cost.ore;
    if (cost.energy) resources.energy -= cost.energy;
    if (cost.biomass) resources.biomass -= cost.biomass;
    if (cost.data) resources.data -= cost.data;
  }

  private estimateNodeValue(node: TechNode): number {
    return node.strategicWeight * 10 + node.effects.length * 5 + node.unitUnlocks.length * 15;
  }

  private estimateUnitStrategicValue(unitId: string, context: PuzzleContext): number {
    // Simple heuristic - can be expanded
    if (unitId.includes('scout')) return 0.5;
    if (unitId.includes('anti_air') && context.enemyComposition?.hasAir) return 2.0;
    if (unitId.includes('heavy')) return 1.5;
    return 1.0;
  }

  private estimateBuildingValue(buildingId: string, context: PuzzleContext): number {
    // Simple heuristic
    if (buildingId.includes('refinery')) return 1.5;
    if (buildingId.includes('reactor')) return 1.3;
    return 1.0;
  }

  private estimateEffectValue(
    effect: any,
    context: PuzzleContext,
    isImmediate: boolean
  ): number {
    // Simplified effect value estimation
    if (effect.type === 'resource_modifier' && effect.isMultiplicative) {
      return (effect.value - 1) * 20;
    }
    if (effect.type === 'unit_stat' && effect.isMultiplicative) {
      return (effect.value - 1) * 15;
    }
    if (effect.type === 'global_modifier' && effect.isMultiplicative) {
      return (effect.value - 1) * 25;
    }
    return effect.value * 5;
  }

  private getDownstreamNodes(node: TechNode, availableTech: TechNode[]): TechNode[] {
    return availableTech.filter(tech =>
      tech.prerequisiteNodes.includes(node.nodeId)
    );
  }

  private calculateSynergyPotential(node: TechNode, context: PuzzleContext): number {
    let potential = 0;
    for (const synergyId of node.synergyNodes) {
      const synergyNode = context.availableTech.find(t => t.nodeId === synergyId);
      if (synergyNode && !synergyNode.isResearched) {
        potential += 0.2;
      }
    }
    return potential;
  }

  private detectResourceShortage(resources: PuzzleContext['currentResources']): number {
    const total = resources.ore + resources.energy + resources.biomass + resources.data;
    const threshold = 200; // Low resource threshold
    return total < threshold ? (threshold - total) / threshold : 0;
  }

  private generateEvaluationReasoning(
    evaluation: TechEvaluation,
    context: PuzzleContext
  ): string {
    const reasons: string[] = [];

    if (evaluation.immediateImpact > 30) {
      reasons.push('high immediate impact');
    }
    if (evaluation.longTermValue > 20) {
      reasons.push('strong long-term value');
    }
    if (evaluation.synergyBonus > 0.2) {
      reasons.push('synergy potential');
    }
    if (evaluation.urgencyScore > 0.6) {
      reasons.push('urgent need');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'balanced choice';
  }
}

