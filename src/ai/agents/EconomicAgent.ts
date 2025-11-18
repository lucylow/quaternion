/**
 * Economic Agent - Specialized AI for resource management and economic expansion
 */

import { BaseAgent, AgentType, AgentRecommendation, AgentAction, GameStateSnapshot, AgentPersonality } from './AgentBase';
import { SeededRandom } from '../../lib/SeededRandom';

interface EconomicAnalysis {
  resourceBalance: number; // -1 to 1 (negative = deficit, positive = surplus)
  expansionPotential: {
    high: number;
    medium: number;
    low: number;
  };
  riskExposure: number; // 0-1
  growthRate: number; // resources per tick
  saturation: number; // 0-1, how well we're using available resources
}

interface EconomicOption {
  optionName: string;
  actions: AgentAction[];
  estimatedCost: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
  expectedROI: number; // estimated return on investment
  riskLevel: number; // 0-1
  timeToPayoff: number; // ticks
}

export class EconomicAgent extends BaseAgent {
  private economicModel: Map<string, number> = new Map(); // Strategy weights

  constructor(personality: AgentPersonality, seed: number) {
    super(personality, seed);
    this.initializeEconomicModel();
  }

  getAgentType(): AgentType {
    return AgentType.ECONOMIC;
  }

  generateRecommendation(gameState: GameStateSnapshot): AgentRecommendation {
    const analysis = this.analyzeEconomicState(gameState);
    const options = this.generateEconomicOptions(analysis, gameState);
    const bestOption = this.scoreEconomicOptions(options, gameState);

    return {
      agentType: AgentType.ECONOMIC,
      priority: this.calculateEconomicPriority(gameState, analysis),
      recommendedActions: bestOption.actions,
      confidence: this.getConfidence(gameState),
      reasoning: this.generateEconomicReasoning(bestOption, analysis),
      estimatedCost: bestOption.estimatedCost
    };
  }

  protected calculateOutcomeScore(
    previousState: GameStateSnapshot,
    newState: GameStateSnapshot,
    action: AgentAction
  ): number {
    // Score based on resource growth
    const resourceGrowth = (newState.resources.total - previousState.resources.total) / Math.max(previousState.resources.total, 1);
    const workerGrowth = (newState.unitComposition.workers - previousState.unitComposition.workers) / Math.max(previousState.unitComposition.workers, 1);
    
    // Positive outcome if resources and workers increased
    return this.clamp((resourceGrowth * 0.6 + workerGrowth * 0.4), -1, 1);
  }

  protected updateStrategyWeights(action: AgentAction, outcome: number): void {
    const strategyKey = `${action.type}_${action.buildingType || action.unitType || 'general'}`;
    const currentWeight = this.economicModel.get(strategyKey) || 0.5;
    const newWeight = currentWeight + (outcome * this.learningRate);
    this.economicModel.set(strategyKey, this.clamp(newWeight, 0, 1));
  }

  private initializeEconomicModel(): void {
    // Initialize strategy weights
    this.economicModel.set('build_worker', 0.7);
    this.economicModel.set('build_extractor', 0.8);
    this.economicModel.set('expand_base', 0.6);
    this.economicModel.set('build_refinery', 0.5);
  }

  private analyzeEconomicState(gameState: GameStateSnapshot): EconomicAnalysis {
    const resources = gameState.resources;
    const workers = gameState.unitComposition.workers;
    
    // Calculate resource balance (ideal vs actual)
    const idealWorkers = Math.max(12, Math.floor(resources.total / 100));
    const workerRatio = workers / Math.max(idealWorkers, 1);
    const resourceBalance = this.clamp((workerRatio - 1) * 0.5, -1, 1);

    // Expansion potential
    const expansionPotential = {
      high: gameState.mapControl.expansionSites > 2 ? 3 : 0,
      medium: gameState.mapControl.expansionSites > 0 ? 2 : 0,
      low: gameState.mapControl.expansionSites
    };

    // Risk exposure (based on threat and resource concentration)
    const riskExposure = gameState.threatAssessment.immediate * 0.6 + 
                        (1 - gameState.mapControl.controlledArea) * 0.4;

    // Growth rate (simplified - would need historical data for accurate calculation)
    const growthRate = workers * 0.5; // Assume each worker generates 0.5 resources per tick

    // Saturation (how well we're using available resources)
    const saturation = this.clamp(workers / Math.max(idealWorkers, 1), 0, 1);

    return {
      resourceBalance,
      expansionPotential,
      riskExposure,
      growthRate,
      saturation
    };
  }

  private generateEconomicOptions(analysis: EconomicAnalysis, gameState: GameStateSnapshot): EconomicOption[] {
    const options: EconomicOption[] = [];

    // Option 1: Aggressive Expansion
    if (this.personality.aggression > 0.6 && analysis.expansionPotential.high > 2) {
      options.push({
        optionName: 'Aggressive Expansion',
        actions: [
          {
            type: 'build',
            buildingType: 'matter_extractor',
            count: 2,
            priority: 0.8,
            reasoning: 'Expand matter production capacity',
            requiredResources: { ore: 200, energy: 100, biomass: 0, data: 0 }
          },
          {
            type: 'train',
            unitType: 'worker',
            count: 4,
            priority: 0.7,
            reasoning: 'Increase worker count for expansion',
            requiredResources: { ore: 200, energy: 50, biomass: 0, data: 0 }
          },
          {
            type: 'expand',
            priority: 0.9,
            reasoning: 'Claim new resource nodes',
            requiredResources: { ore: 400, energy: 200, biomass: 0, data: 0 }
          }
        ],
        estimatedCost: { ore: 800, energy: 350, biomass: 0, data: 0 },
        expectedROI: this.calculateExpansionROI(analysis),
        riskLevel: 0.7,
        timeToPayoff: 120 // ~2 seconds at 60 tps
      });
    }

    // Option 2: Defensive Economy
    if (analysis.riskExposure > 0.5) {
      options.push({
        optionName: 'Defensive Economy',
        actions: [
          {
            type: 'build',
            buildingType: 'defensive_tower',
            count: 3,
            priority: 0.8,
            reasoning: 'Protect economic infrastructure',
            requiredResources: { ore: 300, energy: 150, biomass: 0, data: 0 }
          },
          {
            type: 'research',
            techId: 'economic_fortification',
            priority: 0.6,
            reasoning: 'Improve economic resilience',
            requiredResources: { ore: 200, energy: 100, biomass: 0, data: 50 }
          }
        ],
        estimatedCost: { ore: 500, energy: 250, biomass: 0, data: 50 },
        expectedROI: this.calculateDefensiveROI(analysis),
        riskLevel: 0.3,
        timeToPayoff: 60
      });
    }

    // Option 3: Tech-Focused Economy
    if (this.personality.economicFocus > 0.7 && gameState.resources.total > 500) {
      options.push({
        optionName: 'Tech Investment',
        actions: [
          {
            type: 'research',
            techId: 'advanced_automation',
            priority: 0.9,
            reasoning: 'Boost research efficiency',
            requiredResources: { ore: 300, energy: 200, biomass: 0, data: 100 }
          },
          {
            type: 'build',
            buildingType: 'research_lab',
            count: 1,
            priority: 0.7,
            reasoning: 'Increase research capacity',
            requiredResources: { ore: 400, energy: 300, biomass: 0, data: 50 }
          }
        ],
        estimatedCost: { ore: 700, energy: 500, biomass: 0, data: 150 },
        expectedROI: this.calculateTechROI(analysis),
        riskLevel: 0.5,
        timeToPayoff: 180
      });
    }

    // Option 4: Worker Production (always available)
    if (analysis.saturation < 0.8) {
      options.push({
        optionName: 'Worker Production',
        actions: [
          {
            type: 'train',
            unitType: 'worker',
            count: Math.min(6, Math.ceil((1 - analysis.saturation) * 10)),
            priority: 0.6,
            reasoning: 'Maintain optimal worker count',
            requiredResources: { ore: 300, energy: 100, biomass: 0, data: 0 }
          }
        ],
        estimatedCost: { ore: 300, energy: 100, biomass: 0, data: 0 },
        expectedROI: 0.8,
        riskLevel: 0.1,
        timeToPayoff: 40
      });
    }

    return options;
  }

  private scoreEconomicOptions(options: EconomicOption[], gameState: GameStateSnapshot): EconomicOption {
    if (options.length === 0) {
      // Fallback: basic worker production
      return {
        optionName: 'Basic Worker Production',
        actions: [{
          type: 'train',
          unitType: 'worker',
          count: 2,
          priority: 0.5,
          requiredResources: { ore: 100, energy: 50, biomass: 0, data: 0 }
        }],
        estimatedCost: { ore: 100, energy: 50, biomass: 0, data: 0 },
        expectedROI: 0.5,
        riskLevel: 0.2,
        timeToPayoff: 30
      };
    }

    // Score each option
    const scored = options.map(option => {
      let score = option.expectedROI;
      
      // Adjust for personality
      if (option.riskLevel > 0.6 && this.personality.riskTolerance < 0.4) {
        score *= 0.7; // Risk-averse personality penalizes risky options
      }
      
      // Adjust for current resources
      const canAfford = this.canAffordOption(option, gameState);
      if (!canAfford) {
        score *= 0.5; // Penalize unaffordable options
      }
      
      // Adjust for time to payoff (prefer faster returns)
      score *= (1 - option.timeToPayoff / 300);
      
      // Apply learned strategy weights
      const strategyKey = option.optionName.toLowerCase().replace(/\s+/g, '_');
      const learnedWeight = this.economicModel.get(strategyKey) || 0.5;
      score *= learnedWeight;
      
      return { option, score };
    });

    // Return best option
    return scored.reduce((best, current) => 
      current.score > best.score ? current : best
    ).option;
  }

  private canAffordOption(option: EconomicOption, gameState: GameStateSnapshot): boolean {
    const resources = gameState.resources;
    return resources.ore >= option.estimatedCost.ore &&
           resources.energy >= option.estimatedCost.energy &&
           resources.biomass >= option.estimatedCost.biomass &&
           resources.data >= option.estimatedCost.data;
  }

  private calculateExpansionROI(analysis: EconomicAnalysis): number {
    // ROI based on expansion potential and current saturation
    return analysis.expansionPotential.high * 0.3 + (1 - analysis.saturation) * 0.4;
  }

  private calculateDefensiveROI(analysis: EconomicAnalysis): number {
    // ROI based on risk reduction
    return analysis.riskExposure * 0.5;
  }

  private calculateTechROI(analysis: EconomicAnalysis): number {
    // ROI for tech investments (long-term)
    return 0.6; // Moderate long-term return
  }

  private calculateEconomicPriority(gameState: GameStateSnapshot, analysis: EconomicAnalysis): number {
    let priority = 0.5;
    
    // High priority if resources are low
    if (gameState.resources.total < 200) {
      priority = 0.9;
    }
    
    // High priority if saturation is low
    if (analysis.saturation < 0.5) {
      priority = Math.max(priority, 0.8);
    }
    
    // Lower priority if under threat
    if (gameState.threatAssessment.immediate > 0.7) {
      priority *= 0.7;
    }
    
    // Adjust by personality
    priority *= (0.5 + this.personality.economicFocus * 0.5);
    
    return this.clamp(priority, 0, 1);
  }

  private generateEconomicReasoning(option: EconomicOption, analysis: EconomicAnalysis): string {
    const reasons: Record<string, string[]> = {
      'Aggressive Expansion': [
        'Expanding aggressively to secure resource advantage.',
        'High expansion potential detected. Claiming territory now.',
        'Resource nodes available. Time for rapid expansion.'
      ],
      'Defensive Economy': [
        'Enemy threat detected. Fortifying economic position.',
        'High risk exposure. Prioritizing economic defense.',
        'Protecting critical infrastructure from potential attacks.'
      ],
      'Tech Investment': [
        'Investing in technology for long-term economic advantage.',
        'Research will accelerate future economic growth.',
        'Tech-focused economy for sustainable advantage.'
      ],
      'Worker Production': [
        'Maintaining optimal worker count for resource generation.',
        'Workers are the foundation of economic strength.',
        'Expanding workforce to improve resource collection.'
      ]
    };

    const optionReasons = reasons[option.optionName] || ['Optimizing economic output.'];
    return this.rng.choice(optionReasons);
  }
}


