/**
 * Military Agent - Specialized AI for combat, defense, and tactical operations
 */

import { BaseAgent, AgentType, AgentRecommendation, AgentAction, GameStateSnapshot, AgentPersonality } from './AgentBase';
import { SeededRandom } from '../../lib/SeededRandom';

interface ThreatAnalysis {
  immediateThreats: Array<{
    position: { x: number; y: number };
    type: string;
    threatLevel: number;
    distance: number;
  }>;
  strategicThreats: Array<{
    description: string;
    severity: number;
    timeline: number;
  }>;
  defenseVulnerabilities: Array<{
    location: { x: number; y: number };
    severity: number;
  }>;
  threatTimeline: number; // ticks until major threat
}

interface OpportunityAnalysis {
  weakTargets: Array<{
    position: { x: number; y: number };
    type: string;
    health: number;
    value: number;
  }>;
  undefendedAreas: Array<{
    position: { x: number; y: number };
    value: number;
  }>;
  flankingOpportunities: Array<{
    position: { x: number; y: number };
    successProbability: number;
  }>;
}

interface MilitaryOption {
  optionName: string;
  strategyType: 'defensive' | 'offensive' | 'expansion' | 'harassment';
  actions: AgentAction[];
  successProbability: number;
  resourceCost: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
  riskLevel: number;
}

export class MilitaryAgent extends BaseAgent {
  private tacticalPlanner: Map<string, number> = new Map(); // Tactic success rates

  constructor(personality: AgentPersonality, seed: number) {
    super(personality, seed);
    this.initializeTacticalPlanner();
  }

  getAgentType(): AgentType {
    return AgentType.MILITARY;
  }

  generateRecommendation(gameState: GameStateSnapshot): AgentRecommendation {
    const threats = this.analyzeThreats(gameState);
    const opportunities = this.findAttackOpportunities(gameState);
    const options = this.generateMilitaryOptions(threats, opportunities, gameState);
    const bestOption = this.selectBestMilitaryOption(options, gameState);

    return {
      agentType: AgentType.MILITARY,
      priority: this.calculateMilitaryPriority(threats, opportunities),
      recommendedActions: bestOption.actions,
      confidence: this.getConfidence(gameState),
      reasoning: this.generateMilitaryReasoning(bestOption, threats, opportunities),
      estimatedCost: bestOption.resourceCost
    };
  }

  protected calculateOutcomeScore(
    previousState: GameStateSnapshot,
    newState: GameStateSnapshot,
    action: AgentAction
  ): number {
    // Score based on military advantage change
    const prevMilitary = previousState.unitComposition.offensiveUnits + previousState.unitComposition.defensiveUnits;
    const newMilitary = newState.unitComposition.offensiveUnits + newState.unitComposition.defensiveUnits;
    const militaryGrowth = (newMilitary - prevMilitary) / Math.max(prevMilitary, 1);
    
    // Also consider threat reduction
    const threatReduction = previousState.threatAssessment.immediate - newState.threatAssessment.immediate;
    
    return this.clamp((militaryGrowth * 0.6 + threatReduction * 0.4), -1, 1);
  }

  protected updateStrategyWeights(action: AgentAction, outcome: number): void {
    const tacticKey = `${action.type}_${(action as any).strategyType || 'general'}`;
    const currentWeight = this.tacticalPlanner.get(tacticKey) || 0.5;
    const newWeight = currentWeight + (outcome * this.learningRate);
    this.tacticalPlanner.set(tacticKey, this.clamp(newWeight, 0, 1));
  }

  private initializeTacticalPlanner(): void {
    this.tacticalPlanner.set('defensive', 0.6);
    this.tacticalPlanner.set('offensive', 0.5);
    this.tacticalPlanner.set('expansion', 0.5);
    this.tacticalPlanner.set('harassment', 0.4);
  }

  private analyzeThreats(gameState: GameStateSnapshot): ThreatAnalysis {
    const immediateThreats = gameState.enemyVisibility.units.map(unit => ({
      position: unit.position,
      type: unit.type,
      threatLevel: this.calculateThreatLevel(unit),
      distance: this.calculateDistance(unit.position, { x: 0, y: 0 }) // Simplified - would use actual base position
    }));

    const strategicThreats: ThreatAnalysis['strategicThreats'] = [];
    
    // Check for large enemy force
    if (gameState.enemyVisibility.units.length > 10) {
      strategicThreats.push({
        description: 'Large enemy force detected',
        severity: 0.8,
        timeline: 60 // 1 second at 60 tps
      });
    }

    // Check for tech disadvantage
    if (gameState.techProgress.researchedCount < 3) {
      strategicThreats.push({
        description: 'Technological disadvantage',
        severity: 0.6,
        timeline: 300
      });
    }

    const defenseVulnerabilities: ThreatAnalysis['defenseVulnerabilities'] = [];
    // Simplified - would analyze actual map positions
    if (gameState.mapControl.chokepointsHeld < 2) {
      defenseVulnerabilities.push({
        location: { x: 0, y: 0 },
        severity: 0.7
      });
    }

    return {
      immediateThreats,
      strategicThreats,
      defenseVulnerabilities,
      threatTimeline: this.estimateThreatTimeline(gameState)
    };
  }

  private findAttackOpportunities(gameState: GameStateSnapshot): OpportunityAnalysis {
    const weakTargets = gameState.enemyVisibility.units
      .filter(unit => unit.health < 50) // Low health units
      .map(unit => ({
        position: unit.position,
        type: unit.type,
        health: unit.health,
        value: this.calculateTargetValue(unit)
      }));

    const undefendedAreas: OpportunityAnalysis['undefendedAreas'] = [];
    // Simplified - would analyze actual map
    if (gameState.mapControl.expansionSites > 0) {
      undefendedAreas.push({
        position: { x: 0, y: 0 }, // Would be actual expansion site
        value: 0.7
      });
    }

    const flankingOpportunities: OpportunityAnalysis['flankingOpportunities'] = [];
    // Simplified - would analyze actual tactical positions
    if (gameState.enemyVisibility.units.length > 3) {
      flankingOpportunities.push({
        position: { x: 0, y: 0 },
        successProbability: 0.6
      });
    }

    return {
      weakTargets,
      undefendedAreas,
      flankingOpportunities
    };
  }

  private generateMilitaryOptions(
    threats: ThreatAnalysis,
    opportunities: OpportunityAnalysis,
    gameState: GameStateSnapshot
  ): MilitaryOption[] {
    const options: MilitaryOption[] = [];

    // Defensive Options
    if (threats.immediateThreats.length > 0 || this.personality.aggression < 0.4) {
      options.push({
        optionName: 'Reinforce Defenses',
        strategyType: 'defensive',
        actions: this.generateDefensiveActions(threats, gameState),
        successProbability: this.simulateDefensiveSuccess(threats, gameState),
        resourceCost: this.calculateDefensiveCost(threats),
        riskLevel: 0.3
      });
    }

    // Offensive Options
    if (opportunities.weakTargets.length > 0 && this.personality.aggression > 0.3) {
      options.push({
        optionName: 'Surgical Strike',
        strategyType: 'offensive',
        actions: this.generateSurgicalStrikeActions(opportunities, gameState),
        successProbability: this.simulateStrikeSuccess(opportunities, gameState),
        resourceCost: this.calculateStrikeCost(opportunities),
        riskLevel: 0.6
      });
    }

    // Expansion Options
    if (opportunities.undefendedAreas.length > 0 && this.personality.aggression > 0.5) {
      options.push({
        optionName: 'Territorial Expansion',
        strategyType: 'expansion',
        actions: this.generateExpansionActions(opportunities, gameState),
        successProbability: this.simulateExpansionSuccess(opportunities, gameState),
        resourceCost: this.calculateExpansionCost(opportunities),
        riskLevel: 0.5
      });
    }

    // Harassment Options
    if (this.personality.aggression > 0.6 && gameState.enemyVisibility.units.length > 0) {
      options.push({
        optionName: 'Harassment Raid',
        strategyType: 'harassment',
        actions: this.generateHarassmentActions(opportunities, gameState),
        successProbability: 0.5,
        resourceCost: { ore: 200, energy: 100, biomass: 0, data: 0 },
        riskLevel: 0.4
      });
    }

    // Always have a basic unit production option
    if (gameState.unitComposition.offensiveUnits < 5) {
      options.push({
        optionName: 'Unit Production',
        strategyType: 'defensive',
        actions: [{
          type: 'train',
          unitType: 'soldier',
          count: 3,
          priority: 0.6,
          reasoning: 'Building basic military force',
          requiredResources: { ore: 300, energy: 150, biomass: 0, data: 0 }
        }],
        successProbability: 0.8,
        resourceCost: { ore: 300, energy: 150, biomass: 0, data: 0 },
        riskLevel: 0.2
      });
    }

    return options;
  }

  private selectBestMilitaryOption(options: MilitaryOption[], gameState: GameStateSnapshot): MilitaryOption {
    if (options.length === 0) {
      // Fallback
      return {
        optionName: 'Basic Defense',
        strategyType: 'defensive',
        actions: [],
        successProbability: 0.5,
        resourceCost: { ore: 0, energy: 0, biomass: 0, data: 0 },
        riskLevel: 0.3
      };
    }

    const scored = options.map(option => {
      let score = option.successProbability;
      
      // Adjust for personality
      if (option.strategyType === 'offensive' && this.personality.aggression > 0.7) {
        score *= 1.2;
      } else if (option.strategyType === 'defensive' && this.personality.aggression < 0.4) {
        score *= 1.2;
      }
      
      // Adjust for risk tolerance
      if (option.riskLevel > 0.6 && this.personality.riskTolerance < 0.4) {
        score *= 0.7;
      }
      
      // Adjust for affordability
      const canAfford = this.canAffordOption(option, gameState);
      if (!canAfford) {
        score *= 0.5;
      }
      
      // Apply learned tactics
      const tacticWeight = this.tacticalPlanner.get(option.strategyType) || 0.5;
      score *= tacticWeight;
      
      return { option, score };
    });

    return scored.reduce((best, current) => 
      current.score > best.score ? current : best
    ).option;
  }

  private generateDefensiveActions(threats: ThreatAnalysis, gameState: GameStateSnapshot): AgentAction[] {
    const actions: AgentAction[] = [];
    
    // Build defensive structures
    actions.push({
      type: 'build',
      buildingType: 'defensive_tower',
      count: Math.min(3, Math.ceil(threats.immediateThreats.length / 2)),
      priority: 0.8,
      reasoning: 'Fortifying defensive positions',
      requiredResources: { ore: 300, energy: 150, biomass: 0, data: 0 }
    });

    // Train defensive units
    if (gameState.unitComposition.defensiveUnits < 5) {
      actions.push({
        type: 'train',
        unitType: 'defender',
        count: 3,
        priority: 0.7,
        reasoning: 'Reinforcing defensive capabilities',
        requiredResources: { ore: 300, energy: 100, biomass: 0, data: 0 }
      });
    }

    return actions;
  }

  private generateSurgicalStrikeActions(opportunities: OpportunityAnalysis, gameState: GameStateSnapshot): AgentAction[] {
    const actions: AgentAction[] = [];
    
    // Target weak enemies
    opportunities.weakTargets.slice(0, 3).forEach(target => {
      actions.push({
        type: 'attack',
        target: target,
        position: target.position,
        priority: 0.8,
        reasoning: `Targeting weak ${target.type} at strategic position`
      });
    });

    // Scout before attack
    actions.push({
      type: 'scout',
      position: opportunities.weakTargets[0]?.position || { x: 0, y: 0 },
      priority: 0.6,
      reasoning: 'Gathering intelligence before strike'
    });

    return actions;
  }

  private generateExpansionActions(opportunities: OpportunityAnalysis, gameState: GameStateSnapshot): AgentAction[] {
    const actions: AgentAction[] = [];
    
    opportunities.undefendedAreas.slice(0, 2).forEach(area => {
      actions.push({
        type: 'expand',
        position: area.position,
        priority: 0.7,
        reasoning: 'Securing strategic territory',
        requiredResources: { ore: 400, energy: 200, biomass: 0, data: 0 }
      });
    });

    return actions;
  }

  private generateHarassmentActions(opportunities: OpportunityAnalysis, gameState: GameStateSnapshot): AgentAction[] {
    const actions: AgentAction[] = [];
    
    // Quick strike units
    actions.push({
      type: 'train',
      unitType: 'raider',
      count: 2,
      priority: 0.6,
      reasoning: 'Building harassment force',
      requiredResources: { ore: 200, energy: 100, biomass: 0, data: 0 }
    });

    return actions;
  }

  private calculateThreatLevel(unit: { type: string; health: number }): number {
    // Simplified threat calculation
    const baseThreat: Record<string, number> = {
      'soldier': 0.5,
      'tank': 0.8,
      'air_unit': 0.7,
      'worker': 0.1
    };
    
    return (baseThreat[unit.type] || 0.5) * (unit.health / 100);
  }

  private calculateTargetValue(unit: { type: string; health: number }): number {
    // High value for low health, high threat units
    const threat = this.calculateThreatLevel(unit);
    const healthRatio = unit.health / 100;
    return threat * (1 - healthRatio);
  }

  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private estimateThreatTimeline(gameState: GameStateSnapshot): number {
    // Simplified - would use actual unit positions and movement speeds
    if (gameState.enemyVisibility.units.length > 0) {
      return 60; // 1 second
    }
    return 300; // 5 seconds
  }

  private simulateDefensiveSuccess(threats: ThreatAnalysis, gameState: GameStateSnapshot): number {
    const defensiveStrength = gameState.unitComposition.defensiveUnits;
    const threatStrength = threats.immediateThreats.reduce((sum, t) => sum + t.threatLevel, 0);
    
    if (defensiveStrength > threatStrength * 1.5) {
      return 0.9;
    } else if (defensiveStrength > threatStrength) {
      return 0.7;
    } else {
      return 0.5;
    }
  }

  private simulateStrikeSuccess(opportunities: OpportunityAnalysis, gameState: GameStateSnapshot): number {
    if (opportunities.weakTargets.length === 0) return 0.3;
    
    const avgTargetValue = opportunities.weakTargets.reduce((sum, t) => sum + t.value, 0) / opportunities.weakTargets.length;
    const militaryStrength = gameState.unitComposition.offensiveUnits;
    
    return this.clamp(avgTargetValue * 0.6 + (militaryStrength / 10) * 0.4, 0, 1);
  }

  private simulateExpansionSuccess(opportunities: OpportunityAnalysis, gameState: GameStateSnapshot): number {
    return opportunities.undefendedAreas.length > 0 ? 0.7 : 0.3;
  }

  private calculateDefensiveCost(threats: ThreatAnalysis): { ore: number; energy: number; biomass: number; data: number } {
    return {
      ore: 300 + threats.immediateThreats.length * 100,
      energy: 150 + threats.immediateThreats.length * 50,
      biomass: 0,
      data: 0
    };
  }

  private calculateStrikeCost(opportunities: OpportunityAnalysis): { ore: number; energy: number; biomass: number; data: number } {
    return {
      ore: 200,
      energy: 100,
      biomass: 0,
      data: 0
    };
  }

  private calculateExpansionCost(opportunities: OpportunityAnalysis): { ore: number; energy: number; biomass: number; data: number } {
    return {
      ore: 400 * opportunities.undefendedAreas.length,
      energy: 200 * opportunities.undefendedAreas.length,
      biomass: 0,
      data: 0
    };
  }

  private canAffordOption(option: MilitaryOption, gameState: GameStateSnapshot): boolean {
    const resources = gameState.resources;
    return resources.ore >= option.resourceCost.ore &&
           resources.energy >= option.resourceCost.energy &&
           resources.biomass >= option.resourceCost.biomass &&
           resources.data >= option.resourceCost.data;
  }

  private calculateMilitaryPriority(threats: ThreatAnalysis, opportunities: OpportunityAnalysis): number {
    let priority = 0.5;
    
    // High priority if immediate threats
    if (threats.immediateThreats.length > 0) {
      priority = 0.9;
    }
    
    // High priority if good opportunities
    if (opportunities.weakTargets.length > 3) {
      priority = Math.max(priority, 0.8);
    }
    
    // Adjust by personality
    priority *= (0.5 + this.personality.aggression * 0.5);
    
    return this.clamp(priority, 0, 1);
  }

  private generateMilitaryReasoning(
    option: MilitaryOption,
    threats: ThreatAnalysis,
    opportunities: OpportunityAnalysis
  ): string {
    const reasons: Record<string, string[]> = {
      'Reinforce Defenses': [
        'Enemy forces detected. Fortifying positions.',
        'Threat assessment indicates defensive measures required.',
        'Securing base perimeter against potential attacks.'
      ],
      'Surgical Strike': [
        'Weak targets identified. Executing precision strike.',
        'Opportunity for tactical advantage. Engaging now.',
        'Enemy vulnerabilities detected. Capitalizing on weakness.'
      ],
      'Territorial Expansion': [
        'Undefended territory available. Expanding control.',
        'Strategic positions unclaimed. Securing now.',
        'Map control is key. Expanding military presence.'
      ],
      'Harassment Raid': [
        'Disrupting enemy operations with harassment.',
        'Maintaining pressure on enemy forces.',
        'Quick strike to keep enemy off balance.'
      ],
      'Unit Production': [
        'Building military force for future operations.',
        'Maintaining military readiness.',
        'Preparing for upcoming engagements.'
      ]
    };

    const optionReasons = reasons[option.optionName] || ['Executing military strategy.'];
    return this.rng.choice(optionReasons);
  }
}


