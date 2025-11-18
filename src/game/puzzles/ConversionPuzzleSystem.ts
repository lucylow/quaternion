/**
 * Conversion Puzzle System
 * Manages resource conversion with efficiency decay and risk
 */

import { ResourceType } from '../ResourceManager';

export interface ConversionRate {
  fromResource: ResourceType;
  toResource: ResourceType;
  baseRate: number; // Output per input unit
  currentEfficiency: number; // 0-1, decays with use
  stability: number; // 0-1, affects catastrophic failure chance
  usesThisRound: number;
  lastResetTime: number;
}

export interface ConversionResult {
  success: boolean;
  inputAmount: number;
  outputAmount: number;
  efficiency: number;
  stability: number;
  wasCatastrophic: boolean;
  error?: string;
}

export class ConversionPuzzleSystem {
  private conversionRates: Map<string, ConversionRate> = new Map();
  private baseEfficiency: number = 0.8;
  private efficiencyDecay: number = 0.05; // Per use
  private stabilityDecay: number = 0.1;
  private catastrophicFailureThreshold: number = 0.2;

  constructor() {
    this.initializeConversionRates();
  }

  private initializeConversionRates(): void {
    // Quantum Ore conversions
    this.conversionRates.set('ore_to_energy', {
      fromResource: ResourceType.ORE,
      toResource: ResourceType.ENERGY,
      baseRate: 1.5, // 1 Ore = 1.5 Energy
      currentEfficiency: this.baseEfficiency,
      stability: 0.8,
      usesThisRound: 0,
      lastResetTime: Date.now()
    });

    this.conversionRates.set('ore_to_research', {
      fromResource: ResourceType.ORE,
      toResource: ResourceType.DATA,
      baseRate: 0.3, // 1 Ore = 0.3 Research
      currentEfficiency: this.baseEfficiency,
      stability: 0.6,
      usesThisRound: 0,
      lastResetTime: Date.now()
    });

    // Energy conversions
    this.conversionRates.set('energy_to_ore', {
      fromResource: ResourceType.ENERGY,
      toResource: ResourceType.ORE,
      baseRate: 0.6, // 1 Energy = 0.6 Ore
      currentEfficiency: this.baseEfficiency,
      stability: 0.7,
      usesThisRound: 0,
      lastResetTime: Date.now()
    });

    // BioMass conversions
    this.conversionRates.set('biomass_to_ore', {
      fromResource: ResourceType.BIOMASS,
      toResource: ResourceType.ORE,
      baseRate: 0.7, // 1 Biomass = 0.7 Ore
      currentEfficiency: this.baseEfficiency,
      stability: 0.5, // Riskier conversion
      usesThisRound: 0,
      lastResetTime: Date.now()
    });

    this.conversionRates.set('biomass_to_energy', {
      fromResource: ResourceType.BIOMASS,
      toResource: ResourceType.ENERGY,
      baseRate: 1.2,
      currentEfficiency: this.baseEfficiency,
      stability: 0.6,
      usesThisRound: 0,
      lastResetTime: Date.now()
    });

    // Research Data conversions
    this.conversionRates.set('data_to_energy', {
      fromResource: ResourceType.DATA,
      toResource: ResourceType.ENERGY,
      baseRate: 2.0,
      currentEfficiency: this.baseEfficiency,
      stability: 0.4, // Very risky
      usesThisRound: 0,
      lastResetTime: Date.now()
    });
  }

  /**
   * Convert resources
   */
  public convertResources(
    conversionId: string,
    amount: number,
    currentResources: Map<ResourceType, number>
  ): ConversionResult {
    const rate = this.conversionRates.get(conversionId);
    if (!rate) {
      return {
        success: false,
        inputAmount: 0,
        outputAmount: 0,
        efficiency: 0,
        stability: 0,
        wasCatastrophic: false,
        error: 'Invalid conversion'
      };
    }

    // Check if player has enough resources
    const currentAmount = currentResources.get(rate.fromResource) || 0;
    if (currentAmount < amount) {
      return {
        success: false,
        inputAmount: 0,
        outputAmount: 0,
        efficiency: 0,
        stability: 0,
        wasCatastrophic: false,
        error: 'Insufficient resources'
      };
    }

    // Check for catastrophic failure
    const catastrophicFailure = this.checkForCatastrophicFailure(rate);

    if (catastrophicFailure) {
      return this.handleCatastrophicFailure(rate, amount);
    }

    // Calculate conversion with efficiency
    const outputAmount = amount * rate.baseRate * rate.currentEfficiency;

    // Update conversion metrics
    this.updateConversionRate(rate);

    return {
      success: true,
      inputAmount: amount,
      outputAmount: Math.floor(outputAmount * 100) / 100, // Round to 2 decimals
      efficiency: rate.currentEfficiency,
      stability: rate.stability,
      wasCatastrophic: false
    };
  }

  private checkForCatastrophicFailure(rate: ConversionRate): boolean {
    // Lower stability increases failure chance
    const failureChance = (1 - rate.stability) * 0.3; // Up to 30% chance at 0 stability
    return Math.random() < failureChance;
  }

  private handleCatastrophicFailure(rate: ConversionRate, amount: number): ConversionResult {
    // Major negative event - lose resources
    const lossAmount = amount * (0.5 + Math.random() * 0.5); // 50-100% loss

    // Additional penalties
    rate.stability = Math.max(0.1, rate.stability - 0.2);
    rate.currentEfficiency = Math.max(0.1, rate.currentEfficiency - 0.15);

    return {
      success: false,
      inputAmount: lossAmount,
      outputAmount: 0,
      efficiency: rate.currentEfficiency,
      stability: rate.stability,
      wasCatastrophic: true,
      error: 'Catastrophic conversion failure!'
    };
  }

  private updateConversionRate(rate: ConversionRate): void {
    // Efficiency decays with use
    rate.currentEfficiency = Math.max(0.1, rate.currentEfficiency - this.efficiencyDecay);
    rate.usesThisRound++;

    // Stability decreases with usage
    rate.stability = Math.max(0.1, rate.stability - this.stabilityDecay);

    // Significant decay after 5 uses
    if (rate.usesThisRound >= 5) {
      rate.currentEfficiency *= 0.8;
      rate.stability *= 0.7;
    }
  }

  /**
   * Get conversion rate info
   */
  public getConversionRate(conversionId: string): ConversionRate | undefined {
    return this.conversionRates.get(conversionId);
  }

  /**
   * Get all available conversions
   */
  public getAvailableConversions(): ConversionRate[] {
    return Array.from(this.conversionRates.values());
  }

  /**
   * Reset conversion rates (call at round end or special events)
   */
  public resetConversionRates(): void {
    this.conversionRates.forEach(rate => {
      rate.currentEfficiency = this.baseEfficiency;
      rate.stability = Math.min(1.0, rate.stability + 0.2); // Partial recovery
      rate.usesThisRound = 0;
      rate.lastResetTime = Date.now();
    });
  }

  /**
   * Boost conversion efficiency (from tech or events)
   */
  public boostConversion(conversionId: string, efficiencyBoost: number, stabilityBoost: number): void {
    const rate = this.conversionRates.get(conversionId);
    if (rate) {
      rate.currentEfficiency = Math.min(1.0, rate.currentEfficiency + efficiencyBoost);
      rate.stability = Math.min(1.0, rate.stability + stabilityBoost);
    }
  }

  /**
   * Get conversion efficiency display string
   */
  public getEfficiencyDisplay(conversionId: string): string {
    const rate = this.conversionRates.get(conversionId);
    if (!rate) return 'N/A';

    const efficiencyPercent = Math.round(rate.currentEfficiency * 100);
    const stabilityPercent = Math.round(rate.stability * 100);
    const riskLevel = rate.stability < 0.3 ? 'High' : rate.stability < 0.6 ? 'Medium' : 'Low';

    return `${efficiencyPercent}% efficiency, ${stabilityPercent}% stability (${riskLevel} risk)`;
  }
}


