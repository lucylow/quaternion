/**
 * Multi-Modal Transportation Intelligence
 * Intelligently chooses and uses different transportation modes
 */

import { TransportMode } from './ContextAwareNavigation';
import { UrgencyLevel } from './RLNavigationAgent';

export interface TransportOption {
  mode: TransportMode;
  available: boolean;
  cost: number;
  speed: number;
  energyCost: number;
  requirements: TransportRequirements;
}

export interface TransportRequirements {
  canSwim?: boolean;
  canClimb?: boolean;
  canFly?: boolean;
  hasVehicle?: boolean;
  hasFastTravelAccess?: boolean;
  minimumEnergy?: number;
}

export interface TransportDecision {
  selectedMode: TransportMode;
  reasoning: string;
  estimatedTime: number;
  estimatedCost: number;
  confidence: number; // 0-1
  alternatives: Array<{
    mode: TransportMode;
    whyNot: string;
  }>;
}

export interface DecisionFactors {
  distance: number;
  urgency: UrgencyLevel;
  cost: number;
  availability: boolean;
  skill: number; // 0-1, agent's skill with this transport
  weather: 'clear' | 'rain' | 'storm' | 'fog';
  social: boolean; // Social norms/preferences
  terrain: {
    difficulty: number; // 0-1
    type: string;
    hasRoads: boolean;
    hasWater: boolean;
  };
}

export class MultiModalTransport {
  private transportModels: Map<TransportMode, TransportModel>;

  constructor() {
    this.transportModels = new Map();
    this.initializeTransportModels();
  }

  /**
   * Choose optimal transportation mode
   */
  public chooseTransportation(
    factors: DecisionFactors,
    availableOptions: TransportOption[]
  ): TransportDecision {
    // Filter to available options
    const available = availableOptions.filter(opt => opt.available);

    if (available.length === 0) {
      return {
        selectedMode: TransportMode.WALKING,
        reasoning: 'No transport options available, defaulting to walking',
        estimatedTime: factors.distance / 3,
        estimatedCost: 0,
        confidence: 0.5,
        alternatives: []
      };
    }

    // Score each option
    const scoredOptions = available.map(option => ({
      option,
      score: this.scoreTransportOption(option, factors),
      reasoning: this.generateReasoning(option, factors)
    }));

    // Sort by score
    scoredOptions.sort((a, b) => b.score - a.score);

    const best = scoredOptions[0];
    const alternatives = scoredOptions.slice(1, 4).map(s => ({
      mode: s.option.mode,
      whyNot: `Score: ${s.score.toFixed(2)} vs ${best.score.toFixed(2)}`
    }));

    const estimatedTime = factors.distance / best.option.speed;
    const estimatedCost = best.option.cost * factors.distance;

    return {
      selectedMode: best.option.mode,
      reasoning: best.reasoning,
      estimatedTime,
      estimatedCost,
      confidence: Math.min(1, best.score),
      alternatives
    };
  }

  /**
   * Score transport option based on factors
   */
  private scoreTransportOption(
    option: TransportOption,
    factors: DecisionFactors
  ): number {
    let score = 0;

    // Speed factor (weighted by urgency)
    const urgencyWeight = this.getUrgencyWeight(factors.urgency);
    const speedScore = option.speed / 10; // Normalize to 0-1
    score += speedScore * urgencyWeight * 0.4;

    // Cost factor (inverse, weighted by distance)
    const costScore = 1 / (1 + option.cost * factors.distance);
    score += costScore * 0.2;

    // Energy efficiency
    const energyScore = 1 / (1 + option.energyCost);
    score += energyScore * 0.15;

    // Skill factor
    score += factors.skill * 0.15;

    // Terrain compatibility
    const terrainScore = this.calculateTerrainCompatibility(option.mode, factors.terrain);
    score += terrainScore * 0.1;

    // Weather compatibility
    const weatherScore = this.calculateWeatherCompatibility(option.mode, factors.weather);
    score += weatherScore * 0.05;

    return score;
  }

  /**
   * Calculate terrain compatibility
   */
  private calculateTerrainCompatibility(
    mode: TransportMode,
    terrain: DecisionFactors['terrain']
  ): number {
    switch (mode) {
      case TransportMode.WALKING:
        if (terrain.hasRoads) return 0.9;
        if (terrain.difficulty < 0.5) return 0.7;
        return 0.5;

      case TransportMode.RUNNING:
        if (terrain.hasRoads) return 0.8;
        if (terrain.difficulty < 0.3) return 0.6;
        return 0.3;

      case TransportMode.VEHICLE:
        if (terrain.hasRoads) return 1.0;
        if (terrain.difficulty < 0.2) return 0.6;
        return 0.2;

      case TransportMode.FLYING:
        return 0.9; // Flying ignores most terrain

      case TransportMode.FAST_TRAVEL:
        return 1.0; // Fast travel ignores terrain

      default:
        return 0.5;
    }
  }

  /**
   * Calculate weather compatibility
   */
  private calculateWeatherCompatibility(
    mode: TransportMode,
    weather: DecisionFactors['weather']
  ): number {
    switch (mode) {
      case TransportMode.WALKING:
        if (weather === 'storm') return 0.5;
        if (weather === 'rain') return 0.7;
        return 1.0;

      case TransportMode.RUNNING:
        if (weather === 'storm') return 0.4;
        if (weather === 'rain') return 0.6;
        return 1.0;

      case TransportMode.VEHICLE:
        if (weather === 'storm') return 0.6;
        if (weather === 'fog') return 0.7;
        return 1.0;

      case TransportMode.FLYING:
        if (weather === 'storm') return 0.3;
        if (weather === 'fog') return 0.5;
        return 1.0;

      case TransportMode.FAST_TRAVEL:
        return 1.0; // Fast travel ignores weather

      default:
        return 0.8;
    }
  }

  /**
   * Get urgency weight
   */
  private getUrgencyWeight(urgency: UrgencyLevel): number {
    switch (urgency) {
      case UrgencyLevel.CRITICAL:
        return 2.0;
      case UrgencyLevel.URGENT:
        return 1.5;
      case UrgencyLevel.NORMAL:
        return 1.0;
      case UrgencyLevel.LEISURE:
        return 0.7;
    }
  }

  /**
   * Generate reasoning for transport choice
   */
  private generateReasoning(
    option: TransportOption,
    factors: DecisionFactors
  ): string {
    const reasons: string[] = [];

    if (factors.urgency === UrgencyLevel.CRITICAL) {
      reasons.push(`Urgent: ${option.mode} is fastest`);
    }

    if (option.speed > 5) {
      reasons.push(`High speed: ${option.speed.toFixed(1)} units/sec`);
    }

    if (option.cost < 0.5) {
      reasons.push(`Low cost: ${option.cost.toFixed(2)} per unit`);
    }

    if (factors.terrain.hasRoads && option.mode === TransportMode.VEHICLE) {
      reasons.push('Roads available for vehicle');
    }

    if (factors.skill > 0.8) {
      reasons.push(`High skill with ${option.mode}`);
    }

    return reasons.length > 0 ? reasons.join('; ') : `Selected ${option.mode}`;
  }

  /**
   * Initialize transport models
   */
  private initializeTransportModels(): void {
    // Would load trained models or use rule-based systems
    // For now, using rule-based scoring
  }

  /**
   * Get available transport options for agent
   */
  public getAvailableOptions(
    agentCapabilities: {
      canSwim: boolean;
      canClimb: boolean;
      canFly: boolean;
      hasVehicle: boolean;
      hasFastTravelAccess: boolean;
      energy: number;
    }
  ): TransportOption[] {
    const options: TransportOption[] = [];

    // Walking - always available
    options.push({
      mode: TransportMode.WALKING,
      available: true,
      cost: 0,
      speed: 3,
      energyCost: 1,
      requirements: {}
    });

    // Running - always available
    options.push({
      mode: TransportMode.RUNNING,
      available: true,
      cost: 0,
      speed: 5,
      energyCost: 2,
      requirements: {
        minimumEnergy: 20
      }
    });

    // Vehicle - if available
    if (agentCapabilities.hasVehicle) {
      options.push({
        mode: TransportMode.VEHICLE,
        available: true,
        cost: 1.5,
        speed: 8,
        energyCost: 0.5,
        requirements: {}
      });
    }

    // Flying - if capable
    if (agentCapabilities.canFly) {
      options.push({
        mode: TransportMode.FLYING,
        available: true,
        cost: 2.0,
        speed: 10,
        energyCost: 3,
        requirements: {
          minimumEnergy: 50
        }
      });
    }

    // Fast travel - if available
    if (agentCapabilities.hasFastTravelAccess) {
      options.push({
        mode: TransportMode.FAST_TRAVEL,
        available: true,
        cost: 5.0,
        speed: 100, // Instant
        energyCost: 0,
        requirements: {}
      });
    }

    // Filter by energy requirements
    return options.filter(opt => {
      if (opt.requirements.minimumEnergy) {
        return agentCapabilities.energy >= opt.requirements.minimumEnergy;
      }
      return true;
    });
  }

  /**
   * Evaluate transport decision quality
   */
  public evaluateDecision(
    decision: TransportDecision,
    actualOutcome: {
      timeTaken: number;
      cost: number;
      success: boolean;
    }
  ): {
    quality: number; // 0-1
    feedback: string;
  } {
    let quality = 0.5;

    // Time accuracy
    const timeError = Math.abs(decision.estimatedTime - actualOutcome.timeTaken) / Math.max(actualOutcome.timeTaken, 1);
    quality += (1 - timeError) * 0.3;

    // Cost accuracy
    const costError = Math.abs(decision.estimatedCost - actualOutcome.cost) / Math.max(actualOutcome.cost, 1);
    quality += (1 - costError) * 0.2;

    // Success
    if (actualOutcome.success) {
      quality += 0.5;
    }

    quality = Math.max(0, Math.min(1, quality));

    const feedback = actualOutcome.success
      ? `Good decision: ${decision.selectedMode} was effective`
      : `Poor decision: ${decision.selectedMode} did not work well`;

    return { quality, feedback };
  }
}

interface TransportModel {
  predict(factors: DecisionFactors): number; // Returns score
}


