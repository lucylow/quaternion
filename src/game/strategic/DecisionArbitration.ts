/**
 * Decision Arbitration System
 * Resolves conflicts between competing decisions across layers
 */

import { StrategicDecision, DecisionConflict, DecisionLayer } from './DecisionTypes';
import { QuaternionState } from './QuaternionState';

export class DecisionArbitrationSystem {
  /**
   * Arbitrate decisions from multiple layers and resolve conflicts
   */
  arbitrateDecisions(
    layerDecisions: Map<DecisionLayer, StrategicDecision[]>,
    state: QuaternionState
  ): StrategicDecision[] {
    // Collect all decisions
    const allDecisions: StrategicDecision[] = [];
    layerDecisions.forEach((decisions) => {
      allDecisions.push(...decisions);
    });
    
    // Identify conflicts
    const conflicts = this.identifyDecisionConflicts(allDecisions);
    
    // Resolve conflicts
    const resolvedDecisions = this.resolveConflicts(conflicts, allDecisions, state);
    
    // Apply layer priorities (Strategic > Operational > Tactical > Ethical)
    const prioritizedDecisions = this.applyLayerPriorities(resolvedDecisions);
    
    // Enforce resource constraints
    const feasibleDecisions = this.enforceResourceConstraints(prioritizedDecisions, state);
    
    // Return top 3 decisions
    return feasibleDecisions.slice(0, 3);
  }

  /**
   * Identify conflicts between decisions
   */
  private identifyDecisionConflicts(
    decisions: StrategicDecision[]
  ): DecisionConflict[] {
    const conflicts: DecisionConflict[] = [];
    
    for (let i = 0; i < decisions.length; i++) {
      for (let j = i + 1; j < decisions.length; j++) {
        const conflict = this.checkConflict(decisions[i], decisions[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Check if two decisions conflict
   */
  private checkConflict(
    decisionA: StrategicDecision,
    decisionB: StrategicDecision
  ): DecisionConflict | null {
    // Resource conflict
    if (this.hasResourceConflict(decisionA, decisionB)) {
      return {
        decisionA,
        decisionB,
        conflictType: 'resource',
        severity: this.calculateResourceConflictSeverity(decisionA, decisionB)
      };
    }
    
    // Strategic direction conflict
    if (this.hasStrategicConflict(decisionA, decisionB)) {
      return {
        decisionA,
        decisionB,
        conflictType: 'strategic',
        severity: 0.7
      };
    }
    
    // Temporal conflict (can't execute simultaneously)
    if (this.hasTemporalConflict(decisionA, decisionB)) {
      return {
        decisionA,
        decisionB,
        conflictType: 'temporal',
        severity: 0.5
      };
    }
    
    // Territorial conflict (competing for same territory)
    if (this.hasTerritorialConflict(decisionA, decisionB)) {
      return {
        decisionA,
        decisionB,
        conflictType: 'territorial',
        severity: 0.6
      };
    }
    
    return null;
  }

  /**
   * Check for resource conflict
   */
  private hasResourceConflict(
    decisionA: StrategicDecision,
    decisionB: StrategicDecision
  ): boolean {
    const costA = decisionA.cost;
    const costB = decisionB.cost;
    
    // Check if combined costs exceed reasonable limits
    const totalOre = (costA.ore || 0) + (costB.ore || 0);
    const totalEnergy = (costA.energy || 0) + (costB.energy || 0);
    const totalBiomass = (costA.biomass || 0) + (costB.biomass || 0);
    const totalData = (costA.data || 0) + (costB.data || 0);
    
    // Conflict if both require significant resources of the same type
    return (totalOre > 500) || (totalEnergy > 300) || (totalBiomass > 200) || (totalData > 300);
  }

  /**
   * Calculate resource conflict severity
   */
  private calculateResourceConflictSeverity(
    decisionA: StrategicDecision,
    decisionB: StrategicDecision
  ): number {
    const costA = decisionA.cost;
    const costB = decisionB.cost;
    
    const totalOre = (costA.ore || 0) + (costB.ore || 0);
    const totalEnergy = (costA.energy || 0) + (costB.energy || 0);
    const totalBiomass = (costA.biomass || 0) + (costB.biomass || 0);
    const totalData = (costA.data || 0) + (costB.data || 0);
    
    // Severity based on how much resources are needed
    const maxResource = Math.max(totalOre, totalEnergy, totalBiomass, totalData);
    return Math.min(1, maxResource / 1000);
  }

  /**
   * Check for strategic conflict (opposing goals)
   */
  private hasStrategicConflict(
    decisionA: StrategicDecision,
    decisionB: StrategicDecision
  ): boolean {
    // Check if decisions have opposing effects
    const effectA = decisionA.immediateEffect;
    const effectB = decisionB.immediateEffect;
    
    // Opposing stability changes
    if ((effectA.stabilityChange || 0) * (effectB.stabilityChange || 0) < 0) {
      return true;
    }
    
    // Opposing entropy changes
    if ((effectA.entropyChange || 0) * (effectB.entropyChange || 0) < 0) {
      const magnitudeA = Math.abs(effectA.entropyChange || 0);
      const magnitudeB = Math.abs(effectB.entropyChange || 0);
      if (magnitudeA > 50 && magnitudeB > 50) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for temporal conflict (can't execute at same time)
   */
  private hasTemporalConflict(
    decisionA: StrategicDecision,
    decisionB: StrategicDecision
  ): boolean {
    // If both decisions require the same building/unit and have overlapping execution times
    if (decisionA.executionTime && decisionB.executionTime) {
      const overlap = Math.min(decisionA.executionTime, decisionB.executionTime);
      return overlap > 10; // Significant overlap
    }
    
    return false;
  }

  /**
   * Check for territorial conflict
   */
  private hasTerritorialConflict(
    decisionA: StrategicDecision,
    decisionB: StrategicDecision
  ): boolean {
    // Check if both decisions target the same location
    if (decisionA.worldPosition && decisionB.worldPosition) {
      const dist = Math.sqrt(
        Math.pow(decisionA.worldPosition.x - decisionB.worldPosition.x, 2) +
        Math.pow(decisionA.worldPosition.y - decisionB.worldPosition.y, 2)
      );
      return dist < 50; // Too close
    }
    
    return false;
  }

  /**
   * Resolve conflicts by selecting best decision or creating compromise
   */
  private resolveConflicts(
    conflicts: DecisionConflict[],
    allDecisions: StrategicDecision[],
    state: QuaternionState
  ): StrategicDecision[] {
    const resolvedDecisions = [...allDecisions];
    const toRemove = new Set<string>();
    
    conflicts.forEach(conflict => {
      const scoreA = conflict.decisionA.utilityScore * this.getLayerPriority(conflict.decisionA.layer);
      const scoreB = conflict.decisionB.utilityScore * this.getLayerPriority(conflict.decisionB.layer);
      
      if (scoreA > scoreB) {
        toRemove.add(conflict.decisionB.decisionID);
      } else if (scoreB > scoreA) {
        toRemove.add(conflict.decisionA.decisionID);
      } else {
        // Create compromise decision
        const compromise = this.createCompromiseDecision(conflict, state);
        if (compromise) {
          toRemove.add(conflict.decisionA.decisionID);
          toRemove.add(conflict.decisionB.decisionID);
          resolvedDecisions.push(compromise);
        } else {
          // Remove lower priority decision
          if (this.getLayerPriority(conflict.decisionA.layer) < this.getLayerPriority(conflict.decisionB.layer)) {
            toRemove.add(conflict.decisionA.decisionID);
          } else {
            toRemove.add(conflict.decisionB.decisionID);
          }
        }
      }
    });
    
    return resolvedDecisions.filter(d => !toRemove.has(d.decisionID));
  }

  /**
   * Get layer priority (higher = more important)
   */
  private getLayerPriority(layer: DecisionLayer): number {
    switch (layer) {
      case DecisionLayer.STRATEGIC:
        return 4.0;
      case DecisionLayer.OPERATIONAL:
        return 3.0;
      case DecisionLayer.TACTICAL:
        return 2.0;
      case DecisionLayer.ETHICAL:
        return 1.0;
      default:
        return 1.0;
    }
  }

  /**
   * Create compromise decision from conflict
   */
  private createCompromiseDecision(
    conflict: DecisionConflict,
    state: QuaternionState
  ): StrategicDecision | null {
    // Only create compromise for resource conflicts
    if (conflict.conflictType !== 'resource') {
      return null;
    }
    
    const decisionA = conflict.decisionA;
    const decisionB = conflict.decisionB;
    
    // Average the costs and effects
    const compromiseCost = {
      ore: ((decisionA.cost.ore || 0) + (decisionB.cost.ore || 0)) / 2,
      energy: ((decisionA.cost.energy || 0) + (decisionB.cost.energy || 0)) / 2,
      biomass: ((decisionA.cost.biomass || 0) + (decisionB.cost.biomass || 0)) / 2,
      data: ((decisionA.cost.data || 0) + (decisionB.cost.data || 0)) / 2
    };
    
    const compromiseEffect = {
      oreChange: ((decisionA.immediateEffect.oreChange || 0) + (decisionB.immediateEffect.oreChange || 0)) / 2,
      energyChange: ((decisionA.immediateEffect.energyChange || 0) + (decisionB.immediateEffect.energyChange || 0)) / 2,
      biomassChange: ((decisionA.immediateEffect.biomassChange || 0) + (decisionB.immediateEffect.biomassChange || 0)) / 2,
      dataChange: ((decisionA.immediateEffect.dataChange || 0) + (decisionB.immediateEffect.dataChange || 0)) / 2,
      stabilityChange: ((decisionA.immediateEffect.stabilityChange || 0) + (decisionB.immediateEffect.stabilityChange || 0)) / 2
    };
    
    return {
      decisionID: `COMPROMISE_${Date.now()}`,
      type: decisionA.type, // Use first decision's type
      layer: decisionA.layer,
      description: `Compromise between ${decisionA.description} and ${decisionB.description}`,
      cost: compromiseCost,
      immediateEffect: compromiseEffect,
      requirements: [],
      utilityScore: (decisionA.utilityScore + decisionB.utilityScore) / 2,
      playerPreference: (decisionA.playerPreference + decisionB.playerPreference) / 2,
      riskLevel: (decisionA.riskLevel + decisionB.riskLevel) / 2,
      priority: (decisionA.priority + decisionB.priority) / 2
    };
  }

  /**
   * Apply layer priorities to decisions
   */
  private applyLayerPriorities(decisions: StrategicDecision[]): StrategicDecision[] {
    return decisions.sort((a, b) => {
      const priorityA = this.getLayerPriority(a.layer) * a.utilityScore;
      const priorityB = this.getLayerPriority(b.layer) * b.utilityScore;
      return priorityB - priorityA;
    });
  }

  /**
   * Enforce resource constraints
   */
  private enforceResourceConstraints(
    decisions: StrategicDecision[],
    state: QuaternionState
  ): StrategicDecision[] {
    const feasible: StrategicDecision[] = [];
    let remainingOre = state.ore;
    let remainingEnergy = state.energy;
    let remainingBiomass = state.biomass;
    let remainingData = state.data;
    
    for (const decision of decisions) {
      const cost = decision.cost;
      const canAfford = 
        (cost.ore || 0) <= remainingOre &&
        (cost.energy || 0) <= remainingEnergy &&
        (cost.biomass || 0) <= remainingBiomass &&
        (cost.data || 0) <= remainingData;
      
      if (canAfford) {
        feasible.push(decision);
        remainingOre -= cost.ore || 0;
        remainingEnergy -= cost.energy || 0;
        remainingBiomass -= cost.biomass || 0;
        remainingData -= cost.data || 0;
      }
    }
    
    return feasible;
  }
}

