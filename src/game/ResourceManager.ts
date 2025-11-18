/**
 * Enhanced Resource Management System
 * Handles resource generation, decay, conversion, and capacity management
 */

export enum ResourceType {
  ORE = 'ore',
  ENERGY = 'energy',
  BIOMASS = 'biomass',
  DATA = 'data'
}

export interface ResourceData {
  type: ResourceType;
  currentAmount: number;
  maxCapacity: number;
  generationRate: number; // Per tick
  decayRate: number; // Per tick (percentage)
  displayColor: string;
}

export interface ResourceCost {
  ore?: number;
  energy?: number;
  biomass?: number;
  data?: number;
}

export type ResourceChangeCallback = (type: ResourceType, amount: number) => void;
export type ResourceCriticalCallback = (type: ResourceType) => void;

export class ResourceManager {
  private resources: Map<ResourceType, ResourceData>;
  private onResourceChanged: ResourceChangeCallback | null = null;
  private onResourceCritical: ResourceCriticalCallback | null = null;
  
  // Generation settings
  private baseGenerationPerNode: Map<ResourceType, number>;
  
  // Conversion efficiency
  private conversionEfficiency: Map<string, number> = new Map();

  // Event modifiers (from ResourceEventGenerator)
  private eventModifiers: Map<ResourceType, number> = new Map();

  // Instability system (0-200 scale)
  private instability: number = 50;
  private maxInstability: number = 200;

  // Synergy tracking
  private synergies: {
    industrial: boolean; // Matter + Energy
    biotech: boolean; // Life + Knowledge
    harmonic: boolean; // All balanced
  } = {
    industrial: false,
    biotech: false,
    harmonic: false
  };

  constructor() {
    this.resources = new Map();
    this.baseGenerationPerNode = new Map();
    this.initializeResources();
    this.initializeConversionEfficiency();
    this.calculateInstability();
  }

  private initializeResources(): void {
    // Ore (Quantum Ore) - primary currency for construction & unit production
    this.resources.set(ResourceType.ORE, {
      type: ResourceType.ORE,
      currentAmount: 0,
      maxCapacity: 10000,
      generationRate: 0,
      decayRate: 0.01, // 1% per tick (minimal decay)
      displayColor: '#4a90e2'
    });

    // Energy (Energy Cells) - powers abilities, accelerates buildings
    this.resources.set(ResourceType.ENERGY, {
      type: ResourceType.ENERGY,
      currentAmount: 0,
      maxCapacity: 5000,
      generationRate: 0,
      decayRate: 0.03, // 3% per tick (moderate decay)
      displayColor: '#ffd700'
    });

    // Biomass - found in swamps/biomes, powers creature upgrades
    this.resources.set(ResourceType.BIOMASS, {
      type: ResourceType.BIOMASS,
      currentAmount: 0,
      maxCapacity: 3000,
      generationRate: 0,
      decayRate: 0.05, // 5% per tick (decays faster)
      displayColor: '#50c878'
    });

    // Data (Research Data) - accrues slowly, spent on tech
    this.resources.set(ResourceType.DATA, {
      type: ResourceType.DATA,
      currentAmount: 0,
      maxCapacity: 2000,
      generationRate: 0,
      decayRate: 0.005, // 0.5% per tick (persists longest)
      displayColor: '#9d4edd'
    });

    // Base generation rates per controlled node (per 30s tick)
    // Spec: Ore 40, Energy 20, Biomass 10, Data 5
    this.baseGenerationPerNode.set(ResourceType.ORE, 40);
    this.baseGenerationPerNode.set(ResourceType.ENERGY, 20);
    this.baseGenerationPerNode.set(ResourceType.BIOMASS, 10);
    this.baseGenerationPerNode.set(ResourceType.DATA, 5);
  }

  private initializeConversionEfficiency(): void {
    // Conversion efficiencies (output / input)
    // Spec: 3 Biomass -> 1 Ore (33% efficiency)
    this.conversionEfficiency.set(`${ResourceType.BIOMASS}_${ResourceType.ORE}`, 0.33);
    this.conversionEfficiency.set(`${ResourceType.ORE}_${ResourceType.ENERGY}`, 0.8); // 80% efficiency
    this.conversionEfficiency.set(`${ResourceType.ENERGY}_${ResourceType.ORE}`, 0.6); // 60% efficiency
    this.conversionEfficiency.set(`${ResourceType.BIOMASS}_${ResourceType.DATA}`, 0.7); // 70% efficiency
    this.conversionEfficiency.set(`${ResourceType.DATA}_${ResourceType.BIOMASS}`, 0.5); // 50% efficiency
  }

  /**
   * Set initial resources (for game start)
   */
  public setInitialResources(ore: number, energy: number, biomass: number, data: number): void {
    this.setResource(ResourceType.ORE, ore);
    this.setResource(ResourceType.ENERGY, energy);
    this.setResource(ResourceType.BIOMASS, biomass);
    this.setResource(ResourceType.DATA, data);
  }


  /**
   * Check if player can afford a cost
   */
  public canAfford(cost: ResourceCost): boolean {
    for (const [type, amount] of Object.entries(cost)) {
      if (amount && amount > 0) {
        const resource = this.resources.get(type as ResourceType);
        if (!resource || resource.currentAmount < amount) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Spend resources (returns false if can't afford)
   */
  public spendResources(cost: ResourceCost): boolean {
    if (!this.canAfford(cost)) {
      return false;
    }

    for (const [type, amount] of Object.entries(cost)) {
      if (amount && amount > 0) {
        const resource = this.resources.get(type as ResourceType);
        if (resource) {
          resource.currentAmount = Math.max(0, resource.currentAmount - amount);
          this.notifyResourceChanged(type as ResourceType, resource.currentAmount);
        }
      }
    }

    return true;
  }

  /**
   * Add resource (respects max capacity)
   */
  public addResource(type: ResourceType, amount: number): void {
    const resource = this.resources.get(type);
    if (resource) {
      resource.currentAmount = Math.min(
        resource.currentAmount + amount,
        resource.maxCapacity
      );
      this.notifyResourceChanged(type, resource.currentAmount);
    }
  }

  /**
   * Set resource amount (respects max capacity)
   */
  public setResource(type: ResourceType, amount: number): void {
    const resource = this.resources.get(type);
    if (resource) {
      resource.currentAmount = Math.min(amount, resource.maxCapacity);
      this.notifyResourceChanged(type, resource.currentAmount);
    }
  }

  /**
   * Get resource amount
   */
  public getResourceAmount(type: ResourceType): number {
    const resource = this.resources.get(type);
    return resource ? resource.currentAmount : 0;
  }

  /**
   * Get resource data
   */
  public getResourceData(type: ResourceType): ResourceData | undefined {
    return this.resources.get(type);
  }

  /**
   * Get all resources as a simple object
   */
  public getAllResources(): { ore: number; energy: number; biomass: number; data: number } {
    return {
      ore: this.getResourceAmount(ResourceType.ORE),
      energy: this.getResourceAmount(ResourceType.ENERGY),
      biomass: this.getResourceAmount(ResourceType.BIOMASS),
      data: this.getResourceAmount(ResourceType.DATA)
    };
  }

  /**
   * Convert resources (with efficiency loss)
   */
  public convertResources(
    fromType: ResourceType,
    toType: ResourceType,
    amount: number,
    efficiency?: number
  ): boolean {
    const resource = this.resources.get(fromType);
    if (!resource || resource.currentAmount < amount) {
      return false;
    }

    const conversionKey = `${fromType}_${toType}`;
    const conversionEfficiency = efficiency || this.conversionEfficiency.get(conversionKey) || 0.5;
    const outputAmount = amount * conversionEfficiency;

    resource.currentAmount -= amount;
    this.notifyResourceChanged(fromType, resource.currentAmount);

    this.addResource(toType, outputAmount);

    return true;
  }

  /**
   * Get total resource value (for scoring)
   */
  public getTotalResources(): number {
    let total = 0;
    this.resources.forEach(resource => {
      total += resource.currentAmount;
    });
    return Math.floor(total);
  }

  /**
   * Check for critical resource levels
   */
  private checkCriticalResources(): void {
    this.resources.forEach((resource, type) => {
      const threshold = resource.maxCapacity * 0.1; // 10% threshold
      if (resource.currentAmount < threshold && resource.currentAmount > 0) {
        this.notifyResourceCritical(type);
      }
    });
  }

  /**
   * Set callback for resource changes
   */
  public onResourceChange(callback: ResourceChangeCallback): void {
    this.onResourceChanged = callback;
  }

  /**
   * Set callback for critical resources
   */
  public onResourceCriticalLevel(callback: ResourceCriticalCallback): void {
    this.onResourceCritical = callback;
  }

  private notifyResourceChanged(type: ResourceType, amount: number): void {
    if (this.onResourceChanged) {
      this.onResourceChanged(type, amount);
    }
  }

  private notifyResourceCritical(type: ResourceType): void {
    if (this.onResourceCritical) {
      this.onResourceCritical(type);
    }
  }

  /**
   * Increase max capacity (from tech upgrades)
   */
  public increaseMaxCapacity(type: ResourceType, amount: number): void {
    const resource = this.resources.get(type);
    if (resource) {
      resource.maxCapacity += amount;
    }
  }

  /**
   * Modify generation rate (from tech upgrades)
   */
  public modifyGenerationRate(type: ResourceType, multiplier: number): void {
    const resource = this.resources.get(type);
    if (resource) {
      resource.generationRate *= multiplier;
    }
  }

  /**
   * Reduce decay rate (from tech upgrades)
   */
  public reduceDecayRate(type: ResourceType, reduction: number): void {
    const resource = this.resources.get(type);
    if (resource) {
      resource.decayRate = Math.max(0, resource.decayRate - reduction);
    }
  }

  /**
   * Set event modifier for a resource type (from ResourceEventGenerator)
   */
  public setEventModifier(type: ResourceType, modifier: number): void {
    this.eventModifiers.set(type, modifier);
  }

  /**
   * Clear event modifier for a resource type
   */
  public clearEventModifier(type: ResourceType): void {
    this.eventModifiers.delete(type);
  }

  /**
   * Clear all event modifiers
   */
  public clearAllEventModifiers(): void {
    this.eventModifiers.clear();
  }

  /**
   * Get event modifier for a resource type
   */
  public getEventModifier(type: ResourceType): number {
    return this.eventModifiers.get(type) || 1.0;
  }

  /**
   * Calculate instability based on resource imbalance
   * Instability = 0-200, where 0 is perfect balance, 200 is maximum imbalance
   */
  private calculateInstability(): void {
    const values = [
      this.getResourceAmount(ResourceType.ORE),
      this.getResourceAmount(ResourceType.ENERGY),
      this.getResourceAmount(ResourceType.BIOMASS),
      this.getResourceAmount(ResourceType.DATA)
    ];

    // Calculate mean
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    if (mean === 0) {
      this.instability = 0;
      return;
    }

    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Normalize stdDev relative to mean (coefficient of variation)
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

    // Map to 0-200 scale (0 = perfect balance, 200 = maximum imbalance)
    // Using a sigmoid-like curve for smoother scaling
    this.instability = Math.min(this.maxInstability, coefficientOfVariation * 200);

    // Check synergies
    this.checkSynergies();
  }

  /**
   * Check for resource synergies
   */
  private checkSynergies(): void {
    const ore = this.getResourceAmount(ResourceType.ORE);
    const energy = this.getResourceAmount(ResourceType.ENERGY);
    const biomass = this.getResourceAmount(ResourceType.BIOMASS);
    const data = this.getResourceAmount(ResourceType.DATA);

    // Industrial synergy: Matter + Energy (within 20% of each other)
    const matterEnergyDiff = Math.abs(ore - energy) / Math.max(ore, energy, 1);
    this.synergies.industrial = matterEnergyDiff <= 0.2 && ore > 50 && energy > 50;

    // BioTech synergy: Life + Knowledge (within 20% of each other)
    const lifeKnowledgeDiff = Math.abs(biomass - data) / Math.max(biomass, data, 1);
    this.synergies.biotech = lifeKnowledgeDiff <= 0.2 && biomass > 20 && data > 20;

    // Harmonic synergy: All resources within 10% of each other
    const max = Math.max(ore, energy, biomass, data);
    const min = Math.min(ore, energy, biomass, data);
    const harmonicDiff = max > 0 ? (max - min) / max : 1;
    this.synergies.harmonic = harmonicDiff <= 0.1 && min > 50;
  }

  /**
   * Get current instability (0-200)
   */
  public getInstability(): number {
    return this.instability;
  }

  /**
   * Check if resources are perfectly balanced (within 10% of median)
   */
  public isPerfectlyBalanced(): boolean {
    const values = [
      this.getResourceAmount(ResourceType.ORE),
      this.getResourceAmount(ResourceType.ENERGY),
      this.getResourceAmount(ResourceType.BIOMASS),
      this.getResourceAmount(ResourceType.DATA)
    ];

    const sorted = [...values].sort((a, b) => a - b);
    const median = (sorted[1] + sorted[2]) / 2;

    if (median === 0) return false;

    // Check if all values are within 10% of median
    return values.every(val => {
      const diff = Math.abs(val - median) / median;
      return diff <= 0.1;
    });
  }

  /**
   * Get instability penalties
   */
  public getInstabilityPenalties(): { productionReduction: number; damageToUnits: number } {
    if (this.instability < 50) {
      return { productionReduction: 0, damageToUnits: 0 };
    }

    // Scale penalties from 0% to 50% based on instability
    const penaltyFactor = (this.instability - 50) / 150; // 0-1 scale for 50-200 instability

    return {
      productionReduction: penaltyFactor * 0.5, // Up to 50% reduction
      damageToUnits: penaltyFactor * 2 // Up to 2 damage per tick
    };
  }

  /**
   * Get active synergies
   */
  public getActiveSynergies(): { industrial: boolean; biotech: boolean; harmonic: boolean } {
    return { ...this.synergies };
  }

  /**
   * Get synergy bonuses
   */
  public getSynergyBonuses(): {
    constructionSpeed: number; // Industrial bonus
    researchSpeed: number; // BioTech bonus
    generationMultiplier: number; // Harmonic bonus
  } {
    return {
      constructionSpeed: this.synergies.industrial ? 1.1 : 1.0, // 10% faster construction
      researchSpeed: this.synergies.biotech ? 1.15 : 1.0, // 15% faster research
      generationMultiplier: this.synergies.harmonic ? 1.2 : 1.0 // 20% resource generation increase
    };
  }

  /**
   * Override addResource to recalculate instability
   */
  public addResource(type: ResourceType, amount: number): void {
    const resource = this.resources.get(type);
    if (resource) {
      resource.currentAmount = Math.min(
        resource.currentAmount + amount,
        resource.maxCapacity
      );
      this.notifyResourceChanged(type, resource.currentAmount);
      this.calculateInstability();
    }
  }

  /**
   * Override setResource to recalculate instability
   */
  public setResource(type: ResourceType, amount: number): void {
    const resource = this.resources.get(type);
    if (resource) {
      resource.currentAmount = Math.min(amount, resource.maxCapacity);
      this.notifyResourceChanged(type, resource.currentAmount);
      this.calculateInstability();
    }
  }

  /**
   * Override spendResources to recalculate instability
   */
  public spendResources(cost: ResourceCost): boolean {
    if (!this.canAfford(cost)) {
      return false;
    }

    for (const [type, amount] of Object.entries(cost)) {
      if (amount && amount > 0) {
        const resource = this.resources.get(type as ResourceType);
        if (resource) {
          resource.currentAmount = Math.max(0, resource.currentAmount - amount);
          this.notifyResourceChanged(type as ResourceType, resource.currentAmount);
        }
      }
    }

    this.calculateInstability();
    return true;
  }

  /**
   * Override processResourceTick to recalculate instability
   */
  public processResourceTick(
    controlledNodes: Map<ResourceType, number> = new Map(),
    buildingProduction: Map<ResourceType, number> = new Map()
  ): void {
    // Calculate generation from controlled nodes (with event modifiers)
    controlledNodes.forEach((nodeCount, type) => {
      const baseRate = this.baseGenerationPerNode.get(type) || 0;
      let generation = nodeCount * baseRate;
      
      // Apply event modifiers
      const modifier = this.eventModifiers.get(type) || 1.0;
      generation *= modifier;
      
      this.addResource(type, generation);
    });

    // Add building production (with event modifiers)
    buildingProduction.forEach((amount, type) => {
      const modifier = this.eventModifiers.get(type) || 1.0;
      this.addResource(type, amount * modifier);
    });

    // Apply decay
    this.resources.forEach((resource, type) => {
      if (resource.currentAmount > 0) {
        const decayAmount = resource.currentAmount * resource.decayRate;
        resource.currentAmount = Math.max(0, resource.currentAmount - decayAmount);
        this.notifyResourceChanged(type, resource.currentAmount);
      }
    });

    // Recalculate instability after all changes
    this.calculateInstability();

    // Check for critical levels
    this.checkCriticalResources();
  }
}

