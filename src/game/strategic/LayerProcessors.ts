/**
 * Layer Processors for Multi-Layer Decision Architecture
 * Generates decisions at different strategic layers
 */

import { StrategicDecision, DecisionType, DecisionLayer } from './DecisionTypes';
import { QuaternionState } from './QuaternionState';

export class TacticalLayerProcessor {
  /**
   * Generate tactical decisions (immediate unit commands, combat reactions)
   */
  generateDecisions(state: QuaternionState, gameContext?: any): StrategicDecision[] {
    const decisions: StrategicDecision[] = [];
    
    // Check if under attack (would need game context for this)
    const isUnderAttack = gameContext?.isUnderAttack || false;
    const hasEnemyWeakness = gameContext?.hasEnemyWeakness || false;
    
    if (isUnderAttack) {
      decisions.push(this.createDefensivePostureDecision());
      decisions.push(this.createCounterAttackDecision());
      decisions.push(this.createRetreatDecision());
    }
    
    if (hasEnemyWeakness) {
      decisions.push(this.createFlankingManeuverDecision());
      decisions.push(this.createResourceDenialDecision());
    }
    
    // Energy management decisions
    if (state.energy < 50 && state.energy > 0) {
      decisions.push(this.createEnergyConservationDecision());
    }
    
    if (state.energy > 200) {
      decisions.push(this.createOverclockDecision());
    }
    
    return decisions;
  }

  private createDefensivePostureDecision(): StrategicDecision {
    return {
      decisionID: `TACTICAL_DEFEND_${Date.now()}`,
      type: DecisionType.TACTICAL_DEFENSE,
      layer: DecisionLayer.TACTICAL,
      description: 'Assume defensive positions and fortify',
      cost: { energy: 20, ore: 10 },
      immediateEffect: {
        defenseBonus: 0.3,
        energyChange: -5,
        movementPenalty: 0.2
      },
      requirements: [],
      utilityScore: 0,
      playerPreference: 0.5,
      riskLevel: 0.2,
      priority: 0.7,
      executionTime: 5
    };
  }

  private createCounterAttackDecision(): StrategicDecision {
    return {
      decisionID: `TACTICAL_ATTACK_${Date.now()}`,
      type: DecisionType.TACTICAL_ATTACK,
      layer: DecisionLayer.TACTICAL,
      description: 'Launch counter-attack on enemy position',
      cost: { energy: 30, ore: 20 },
      immediateEffect: {
        energyChange: -10,
        oreChange: -5
      },
      requirements: [],
      utilityScore: 0,
      playerPreference: 0.6,
      riskLevel: 0.5,
      priority: 0.8,
      executionTime: 10
    };
  }

  private createRetreatDecision(): StrategicDecision {
    return {
      decisionID: `TACTICAL_RETREAT_${Date.now()}`,
      type: DecisionType.TACTICAL_RETREAT,
      layer: DecisionLayer.TACTICAL,
      description: 'Retreat to safer position',
      cost: { energy: 10 },
      immediateEffect: {
        energyChange: -5,
        defenseBonus: 0.1
      },
      requirements: [],
      utilityScore: 0,
      playerPreference: 0.3,
      riskLevel: 0.1,
      priority: 0.5,
      executionTime: 3
    };
  }

  private createFlankingManeuverDecision(): StrategicDecision {
    return {
      decisionID: `TACTICAL_FLANK_${Date.now()}`,
      type: DecisionType.TACTICAL_ATTACK,
      layer: DecisionLayer.TACTICAL,
      description: 'Execute flanking maneuver',
      cost: { energy: 25, ore: 15 },
      immediateEffect: {
        energyChange: -8,
        oreChange: -3
      },
      requirements: [],
      utilityScore: 0,
      playerPreference: 0.7,
      riskLevel: 0.4,
      priority: 0.7,
      executionTime: 8
    };
  }

  private createResourceDenialDecision(): StrategicDecision {
    return {
      decisionID: `TACTICAL_DENIAL_${Date.now()}`,
      type: DecisionType.TACTICAL_ATTACK,
      layer: DecisionLayer.TACTICAL,
      description: 'Deny enemy resource nodes',
      cost: { energy: 20, ore: 10 },
      immediateEffect: {
        energyChange: -5,
        oreChange: -2
      },
      requirements: [],
      utilityScore: 0,
      playerPreference: 0.6,
      riskLevel: 0.3,
      priority: 0.6,
      executionTime: 12
    };
  }

  private createEnergyConservationDecision(): StrategicDecision {
    return {
      decisionID: `TACTICAL_CONSERVE_${Date.now()}`,
      type: DecisionType.TACTICAL_SHIELD,
      layer: DecisionLayer.TACTICAL,
      description: 'Conserve energy by reducing non-essential operations',
      cost: {},
      immediateEffect: {
        energyChange: 5,
        movementPenalty: 0.1
      },
      requirements: [],
      utilityScore: 0,
      playerPreference: 0.5,
      riskLevel: 0.1,
      priority: 0.6,
      executionTime: 2
    };
  }

  private createOverclockDecision(): StrategicDecision {
    return {
      decisionID: `TACTICAL_OVERCLOCK_${Date.now()}`,
      type: DecisionType.TACTICAL_OVERCLOCK,
      layer: DecisionLayer.TACTICAL,
      description: 'Overclock production systems for increased output',
      cost: { energy: 50 },
      immediateEffect: {
        energyChange: -20,
        oreChange: 15,
        entropyChange: 50
      },
      longTermEffect: {
        entropyChange: 100,
        stabilityChange: -0.1
      },
      requirements: [],
      utilityScore: 0,
      playerPreference: 0.6,
      riskLevel: 0.4,
      priority: 0.5,
      executionTime: 5
    };
  }
}

export class OperationalLayerProcessor {
  /**
   * Generate operational decisions (resource allocation, tech sequencing, expansion timing)
   */
  generateDecisions(state: QuaternionState, gameContext?: any): StrategicDecision[] {
    const decisions: StrategicDecision[] = [];
    
    // Resource allocation decisions
    decisions.push(...this.generateResourceAllocationDecisions(state));
    
    // Expansion decisions
    if (state.stability > 1.0 && state.ore > 200) {
      decisions.push(this.createExpansionDecision());
    }
    
    // Tech sequencing decisions
    if (state.data > 50) {
      decisions.push(...this.generateTechDecisions(state));
    }
    
    return decisions;
  }

  private generateResourceAllocationDecisions(state: QuaternionState): StrategicDecision[] {
    const decisions: StrategicDecision[] = [];
    
    // Economy vs military allocation
    if (state.ore > 300) {
      decisions.push({
        decisionID: `OPERATIONAL_ECONOMY_${Date.now()}`,
        type: DecisionType.OPERATIONAL_ECONOMY,
        layer: DecisionLayer.OPERATIONAL,
        description: 'Invest heavily in economy',
        cost: { ore: 200, energy: 50 },
        immediateEffect: {
          oreChange: 50,
          energyChange: 30,
          industrialProgress: 0.1
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.5,
        riskLevel: 0.2,
        priority: 0.6,
        executionTime: 30
      });
    }
    
    // Military allocation
    if (state.instability > 100) {
      decisions.push({
        decisionID: `OPERATIONAL_MILITARY_${Date.now()}`,
        type: DecisionType.OPERATIONAL_MILITARY,
        layer: DecisionLayer.OPERATIONAL,
        description: 'Build up military forces',
        cost: { ore: 250, energy: 100 },
        immediateEffect: {
          oreChange: -100,
          energyChange: -50,
          defenseBonus: 0.2
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.6,
        riskLevel: 0.3,
        priority: 0.7,
        executionTime: 40
      });
    }
    
    return decisions;
  }

  private createExpansionDecision(): StrategicDecision {
    return {
      decisionID: `OPERATIONAL_EXPAND_${Date.now()}`,
      type: DecisionType.OPERATIONAL_EXPANSION,
      layer: DecisionLayer.OPERATIONAL,
      description: 'Expand to new territory',
      cost: { ore: 300, energy: 150, biomass: 50 },
      immediateEffect: {
        oreChange: -150,
        energyChange: -75,
        biomassChange: -25,
        industrialProgress: 0.15
      },
      longTermEffect: {
        oreChange: 100,
        energyChange: 50,
        entropyChange: 200
      },
      requirements: [],
      utilityScore: 0,
      playerPreference: 0.7,
      riskLevel: 0.5,
      priority: 0.6,
      executionTime: 60
    };
  }

  private generateTechDecisions(state: QuaternionState): StrategicDecision[] {
    const decisions: StrategicDecision[] = [];
    
    if (state.data > 80) {
      decisions.push({
        decisionID: `OPERATIONAL_TECH_${Date.now()}`,
        type: DecisionType.OPERATIONAL_TECH,
        layer: DecisionLayer.OPERATIONAL,
        description: 'Prioritize technology research',
        cost: { data: 80, energy: 100 },
        immediateEffect: {
          dataChange: -60,
          energyChange: -50,
          technologicalProgress: 0.2,
          techUnlocks: 1
        },
        longTermEffect: {
          dataChange: 20,
          energyChange: 30
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.6,
        riskLevel: 0.2,
        priority: 0.5,
        executionTime: 100
      });
    }
    
    return decisions;
  }
}

export class StrategicLayerProcessor {
  /**
   * Generate strategic decisions (victory condition pursuit, faction relationships)
   */
  generateDecisions(state: QuaternionState, gameContext?: any): StrategicDecision[] {
    const decisions: StrategicDecision[] = [];
    
    // Victory condition decisions
    decisions.push(...this.generateVictoryDecisions(state));
    
    // Long-term development
    decisions.push(...this.generateDevelopmentDecisions(state));
    
    return decisions;
  }

  private generateVictoryDecisions(state: QuaternionState): StrategicDecision[] {
    const decisions: StrategicDecision[] = [];
    
    // Industrial victory path
    if (state.industrialProgress > 0.3) {
      decisions.push({
        decisionID: `STRATEGIC_INDUSTRIAL_${Date.now()}`,
        type: DecisionType.STRATEGIC_INDUSTRIAL,
        layer: DecisionLayer.STRATEGIC,
        description: 'Construct Mega-Foundry for industrial dominance',
        cost: { ore: 200, energy: 150, biomass: -50 },
        immediateEffect: {
          oreChange: 100,
          industrialProgress: 0.15,
          stabilityChange: -0.1,
          entropyChange: 100
        },
        longTermEffect: {
          oreChange: 50,
          entropyChange: 200
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.6,
        riskLevel: 0.4,
        priority: 0.7,
        executionTime: 120
      });
    }
    
    // Ecological victory path
    if (state.ecologicalProgress > 0.3) {
      decisions.push({
        decisionID: `STRATEGIC_ECOLOGICAL_${Date.now()}`,
        type: DecisionType.STRATEGIC_ECOLOGICAL,
        layer: DecisionLayer.STRATEGIC,
        description: 'Initiate biome regeneration project',
        cost: { biomass: 100, data: 80 },
        immediateEffect: {
          biomassChange: 50,
          ecologicalProgress: 0.12,
          stabilityChange: 0.05
        },
        longTermEffect: {
          biomassChange: 30,
          stabilityChange: 0.1
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.5,
        riskLevel: 0.2,
        priority: 0.6,
        executionTime: 150
      });
    }
    
    // Technological victory path
    if (state.technologicalProgress > 0.3) {
      decisions.push({
        decisionID: `STRATEGIC_TECHNOLOGICAL_${Date.now()}`,
        type: DecisionType.STRATEGIC_TECHNOLOGICAL,
        layer: DecisionLayer.STRATEGIC,
        description: 'Pursue quantum ascendancy research',
        cost: { data: 200, energy: 200 },
        immediateEffect: {
          dataChange: -150,
          energyChange: -100,
          technologicalProgress: 0.25
        },
        longTermEffect: {
          dataChange: 100,
          techUnlocks: 2
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.7,
        riskLevel: 0.3,
        priority: 0.8,
        executionTime: 200
      });
    }
    
    // Balance victory path
    if (state.balancedProgress > 0.2) {
      decisions.push({
        decisionID: `STRATEGIC_BALANCE_${Date.now()}`,
        type: DecisionType.STRATEGIC_BALANCE,
        layer: DecisionLayer.STRATEGIC,
        description: 'Maintain perfect equilibrium',
        cost: { ore: 50, energy: 50, biomass: 50, data: 50 },
        immediateEffect: {
          stabilityChange: 0.1,
          entropyChange: -100,
          balancedProgress: 0.1
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.5,
        riskLevel: 0.1,
        priority: 0.5,
        executionTime: 60
      });
    }
    
    return decisions;
  }

  private generateDevelopmentDecisions(state: QuaternionState): StrategicDecision[] {
    const decisions: StrategicDecision[] = [];
    
    // Build refinery for ore production
    if (state.ore > 150 && state.energy > 100) {
      decisions.push({
        decisionID: `BUILD_REFINERY_${Date.now()}`,
        type: DecisionType.BUILD_REFINERY,
        layer: DecisionLayer.STRATEGIC,
        description: 'Build ore refinery',
        cost: { ore: 150, energy: 100 },
        immediateEffect: {
          oreChange: -100,
          energyChange: -50
        },
        longTermEffect: {
          oreChange: 20
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.6,
        riskLevel: 0.2,
        priority: 0.5,
        executionTime: 90
      });
    }
    
    return decisions;
  }
}

export class EthicalLayerProcessor {
  /**
   * Generate ethical decisions (moral choices, philosophical alignment)
   */
  generateDecisions(state: QuaternionState, gameContext?: any): StrategicDecision[] {
    const decisions: StrategicDecision[] = [];
    
    // AI trade offers
    if (gameContext?.aiTradeOffer) {
      decisions.push({
        decisionID: `ETHICAL_TRADE_${Date.now()}`,
        type: DecisionType.ETHICAL_TRADE,
        layer: DecisionLayer.ETHICAL,
        description: 'Accept AI trade offer for immediate power',
        cost: { biomass: 200 },
        immediateEffect: {
          oreChange: 150,
          energyChange: 100,
          biomassChange: -200
        },
        longTermEffect: {
          stabilityChange: -0.2,
          entropyChange: 300
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.4,
        riskLevel: 0.6,
        priority: 0.5,
        executionTime: 10
      });
      
      decisions.push({
        decisionID: `ETHICAL_REFUSE_${Date.now()}`,
        type: DecisionType.ETHICAL_REFUSE,
        layer: DecisionLayer.ETHICAL,
        description: 'Refuse AI trade offer, maintain ethical stance',
        cost: {},
        immediateEffect: {
          stabilityChange: 0.05
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.6,
        riskLevel: 0.1,
        priority: 0.4,
        executionTime: 1
      });
    }
    
    // Biomass conversion decision
    if (state.biomass > 100 && state.ore < 200) {
      decisions.push({
        decisionID: `ETHICAL_EXPLOIT_${Date.now()}`,
        type: DecisionType.ETHICAL_EXPLOIT,
        layer: DecisionLayer.ETHICAL,
        description: 'Convert biomass to ore (ecological cost)',
        cost: { biomass: 100 },
        immediateEffect: {
          oreChange: 33, // 3:1 conversion
          biomassChange: -100,
          stabilityChange: -0.05,
          entropyChange: 50
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.3,
        riskLevel: 0.3,
        priority: 0.4,
        executionTime: 5
      });
      
      decisions.push({
        decisionID: `ETHICAL_PRESERVE_${Date.now()}`,
        type: DecisionType.ETHICAL_PRESERVE,
        layer: DecisionLayer.ETHICAL,
        description: 'Preserve biomass, find alternative solutions',
        cost: {},
        immediateEffect: {
          stabilityChange: 0.02
        },
        requirements: [],
        utilityScore: 0,
        playerPreference: 0.7,
        riskLevel: 0.1,
        priority: 0.3,
        executionTime: 1
      });
    }
    
    return decisions;
  }
}


