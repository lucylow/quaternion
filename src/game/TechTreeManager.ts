/**
 * Enhanced Tech Tree Management System
 * Handles research, prerequisites, effects, and unlocks
 */

import { ResourceManager, ResourceType, ResourceCost } from './ResourceManager';
import { UnitManager, UnitType } from './UnitManager';

export enum TechCategory {
  INFRASTRUCTURE = 'infrastructure',
  MILITARY = 'military',
  RESEARCH = 'research',
  SPECIAL = 'special'
}

export enum EffectType {
  RESOURCE_MODIFIER = 'resource_modifier',
  UNIT_STAT = 'unit_stat',
  GLOBAL_MODIFIER = 'global_modifier',
  UNLOCK = 'unlock',
  CAPACITY_INCREASE = 'capacity_increase',
  DECAY_REDUCTION = 'decay_reduction'
}

export interface TechEffect {
  type: EffectType;
  target: string; // e.g., 'matter_generation', 'ore_generation', 'unit_health'
  value: number;
  isMultiplicative: boolean; // true = multiply, false = add
}

export interface TechNode {
  nodeId: string;
  nodeName: string;
  description: string;
  category: TechCategory;
  cost: ResourceCost;
  researchTime: number; // In ticks
  prerequisiteNodes: string[];
  effects: TechEffect[];
  unitUnlocks: string[];
  buildingUnlocks: string[];
  synergyNodes: string[]; // Nodes that work well together
  strategicWeight: number; // For AI decision making
  isHidden: boolean;
  // Runtime state
  isResearched: boolean;
  isAvailable: boolean;
  researchProgress: number; // 0-1
}

export class TechTreeManager {
  private allTechNodes: Map<string, TechNode>;
  private researchedNodes: Set<string>;
  private researchQueue: string[];
  private currentResearch: string | null = null;
  private researchProgress: number = 0;
  
  private resourceManager: ResourceManager | null = null;
  private unitManager: UnitManager | null = null;
  
  private maxConcurrentResearch: number = 1;

  constructor(resourceManager?: ResourceManager, unitManager?: UnitManager) {
    this.resourceManager = resourceManager || null;
    this.unitManager = unitManager || null;
    this.allTechNodes = new Map();
    this.researchedNodes = new Set();
    this.researchQueue = [];
    
    this.initializeTechTree();
    this.updateNodeAvailability();
  }

  private initializeTechTree(): void {
    // Basic Refinery
    this.addTechNode({
      nodeId: 'basic_refinery',
      nodeName: 'Basic Refinery',
      description: 'Increases Matter production efficiency',
      category: TechCategory.INFRASTRUCTURE,
      cost: { matter: 200 },
      researchTime: 20,
      prerequisiteNodes: [],
      effects: [
        {
          type: EffectType.RESOURCE_MODIFIER,
          target: 'matter_generation',
          value: 1.25,
          isMultiplicative: true
        }
      ],
      unitUnlocks: [],
      buildingUnlocks: [],
      synergyNodes: [],
      strategicWeight: 1.2,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Scout AI
    this.addTechNode({
      nodeId: 'scout_ai',
      nodeName: 'Scout AI Systems',
      description: 'Enables Scout Drone production',
      category: TechCategory.MILITARY,
      cost: { matter: 100, knowledge: 30 },
      researchTime: 25,
      prerequisiteNodes: [],
      effects: [],
      unitUnlocks: ['scout'],
      buildingUnlocks: [],
      synergyNodes: [],
      strategicWeight: 1.5,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Reactor Overclock
    this.addTechNode({
      nodeId: 'reactor_overclock',
      nodeName: 'Reactor Overclock',
      description: 'Temporary Energy production boost',
      category: TechCategory.INFRASTRUCTURE,
      cost: { matter: 250, knowledge: 60 },
      researchTime: 45,
      prerequisiteNodes: ['basic_refinery'],
      effects: [
        {
          type: EffectType.RESOURCE_MODIFIER,
          target: 'energy_generation',
          value: 1.5,
          isMultiplicative: true
        }
      ],
      unitUnlocks: [],
      buildingUnlocks: [],
      synergyNodes: [],
      strategicWeight: 1.8,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Bio Conserve (Demo objective)
    this.addTechNode({
      nodeId: 'bio_conserve',
      nodeName: 'Bio-Conservation Protocol',
      description: 'Unlocks advanced biomass utilization and alternative victory',
      category: TechCategory.SPECIAL,
      cost: { life: 150, knowledge: 50 },
      researchTime: 40,
      prerequisiteNodes: [],
      effects: [
        {
          type: EffectType.RESOURCE_MODIFIER,
          target: 'life_efficiency',
          value: 1.4,
          isMultiplicative: true
        }
      ],
      unitUnlocks: [],
      buildingUnlocks: [],
      synergyNodes: [],
      strategicWeight: 2.0,
      isHidden: true,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Quantum Ascendancy (Terminal tech)
    this.addTechNode({
      nodeId: 'quantum_ascendancy',
      nodeName: 'Quantum Ascendancy',
      description: 'Achieve transcendence through perfect harmony',
      category: TechCategory.SPECIAL,
      cost: { matter: 350, energy: 350, life: 350, knowledge: 350 },
      researchTime: 40,
      prerequisiteNodes: ['matter_compression', 'energy_grid', 'genetic_enhancement', 'quantum_computing'],
      effects: [],
      unitUnlocks: [],
      buildingUnlocks: [],
      synergyNodes: [],
      strategicWeight: 3.0,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });
  }

  private addTechNode(node: TechNode): void {
    this.allTechNodes.set(node.nodeId, node);
  }

  /**
   * Start research on a tech
   */
  public startResearch(techId: string): boolean {
    const node = this.allTechNodes.get(techId);
    
    if (!node || !node.isAvailable || node.isResearched) {
      return false;
    }

    if (this.currentResearch !== null) {
      // Add to queue if research slot is full
      if (this.researchQueue.length < 5 && !this.researchQueue.includes(techId)) {
        this.researchQueue.push(techId);
        return true;
      }
      return false;
    }

    // Check if can afford
    if (this.resourceManager && !this.resourceManager.canAfford(node.cost)) {
      return false;
    }

    // Spend resources
    if (this.resourceManager) {
      this.resourceManager.spendResources(node.cost);
    }

    // Start research
    this.currentResearch = techId;
    this.researchProgress = 0;

    return true;
  }

  /**
   * Process research tick (called every game tick)
   */
  public processResearchTick(): void {
    if (this.currentResearch === null) {
      // Start next in queue
      if (this.researchQueue.length > 0) {
        const nextId = this.researchQueue.shift()!;
        this.startResearch(nextId);
      }
      return;
    }

    const node = this.allTechNodes.get(this.currentResearch);
    if (!node) {
      this.currentResearch = null;
      return;
    }

    // Increment progress
    this.researchProgress += 1;
    node.researchProgress = this.researchProgress / node.researchTime;

    // Check if complete
    if (this.researchProgress >= node.researchTime) {
      this.completeResearch(this.currentResearch);
      this.currentResearch = null;
      this.researchProgress = 0;
    }
  }

  /**
   * Complete research
   */
  private completeResearch(techId: string): void {
    const node = this.allTechNodes.get(techId);
    if (!node) return;

    node.isResearched = true;
    node.researchProgress = 1.0;
    this.researchedNodes.add(techId);

    // Apply effects
    this.applyTechEffects(node);

    // Unlock units/buildings
    this.unlockTechContent(node);

    // Update availability of other nodes
    this.updateNodeAvailability();

    // Check for hidden node reveals
    this.checkHiddenNodeReveals();
  }

  /**
   * Apply tech effects
   */
  private applyTechEffects(node: TechNode): void {
    if (!this.resourceManager) return;

    node.effects.forEach(effect => {
      switch (effect.type) {
        case EffectType.RESOURCE_MODIFIER:
          // Resource modifiers are applied during resource generation
          break;
        case EffectType.CAPACITY_INCREASE:
          if (effect.target.includes('matter')) {
            this.resourceManager.increaseMaxCapacity(ResourceType.MATTER, effect.value);
          } else if (effect.target.includes('energy')) {
            this.resourceManager.increaseMaxCapacity(ResourceType.ENERGY, effect.value);
          } else if (effect.target.includes('life')) {
            this.resourceManager.increaseMaxCapacity(ResourceType.LIFE, effect.value);
          } else if (effect.target.includes('knowledge')) {
            this.resourceManager.increaseMaxCapacity(ResourceType.KNOWLEDGE, effect.value);
          }
          break;
        case EffectType.DECAY_REDUCTION:
          if (effect.target.includes('matter')) {
            this.resourceManager.reduceDecayRate(ResourceType.MATTER, effect.value);
          } else if (effect.target.includes('energy')) {
            this.resourceManager.reduceDecayRate(ResourceType.ENERGY, effect.value);
          } else if (effect.target.includes('life')) {
            this.resourceManager.reduceDecayRate(ResourceType.LIFE, effect.value);
          } else if (effect.target.includes('knowledge')) {
            this.resourceManager.reduceDecayRate(ResourceType.KNOWLEDGE, effect.value);
          }
          break;
      }
    });
  }

  /**
   * Unlock tech content (units/buildings)
   */
  private unlockTechContent(node: TechNode): void {
    // Unit unlocks would be handled by UnitManager
    // Building unlocks would be handled by BuildingManager
    // For now, this is a placeholder
  }

  /**
   * Update node availability based on prerequisites
   */
  public updateNodeAvailability(): void {
    this.allTechNodes.forEach(node => {
      // Check if prerequisites are met
      let prerequisitesMet = true;
      for (const prereqId of node.prerequisiteNodes) {
        if (!this.researchedNodes.has(prereqId)) {
          prerequisitesMet = false;
          break;
        }
      }

      node.isAvailable = prerequisitesMet && !node.isResearched;
    });
  }

  /**
   * Check if hidden nodes should be revealed
   */
  private checkHiddenNodeReveals(): void {
    this.allTechNodes.forEach(node => {
      if (node.isHidden && this.shouldRevealNode(node)) {
        node.isHidden = false;
      }
    });
  }

  /**
   * Determine if a hidden node should be revealed
   */
  private shouldRevealNode(node: TechNode): boolean {
    if (!this.resourceManager) return false;

    // Demo: Reveal bio_conserve when player has enough life
    if (node.nodeId === 'bio_conserve') {
      return this.resourceManager.getResourceAmount(ResourceType.LIFE) >= 50;
    }

    return false;
  }

  /**
   * Check if tech is researched
   */
  public isTechResearched(techId: string): boolean {
    return this.researchedNodes.has(techId);
  }

  /**
   * Get researched tech count
   */
  public getResearchedTechCount(): number {
    return this.researchedNodes.size;
  }

  /**
   * Get tech node
   */
  public getTechNode(techId: string): TechNode | undefined {
    return this.allTechNodes.get(techId);
  }

  /**
   * Get all tech nodes
   */
  public getAllTechNodes(): TechNode[] {
    return Array.from(this.allTechNodes.values());
  }

  /**
   * Get available tech nodes
   */
  public getAvailableTechNodes(): TechNode[] {
    return Array.from(this.allTechNodes.values()).filter(node => node.isAvailable);
  }

  /**
   * Get current research progress
   */
  public getCurrentResearch(): { techId: string; progress: number } | null {
    if (this.currentResearch === null) return null;
    
    const node = this.allTechNodes.get(this.currentResearch);
    return node ? {
      techId: this.currentResearch,
      progress: node.researchProgress
    } : null;
  }

  /**
   * Get research queue
   */
  public getResearchQueue(): string[] {
    return [...this.researchQueue];
  }

  /**
   * Cancel research
   */
  public cancelResearch(): boolean {
    if (this.currentResearch === null) return false;

    // Refund 50% of resources
    const node = this.allTechNodes.get(this.currentResearch);
    if (node && this.resourceManager) {
      const refund: ResourceCost = {};
      Object.entries(node.cost).forEach(([type, amount]) => {
        if (amount) {
          refund[type as ResourceType] = Math.floor(amount * 0.5);
        }
      });
      this.resourceManager.addResource(ResourceType.MATTER, refund.matter || 0);
      this.resourceManager.addResource(ResourceType.ENERGY, refund.energy || 0);
      this.resourceManager.addResource(ResourceType.LIFE, refund.life || 0);
      this.resourceManager.addResource(ResourceType.KNOWLEDGE, refund.knowledge || 0);
    }

    this.currentResearch = null;
    this.researchProgress = 0;
    return true;
  }

  /**
   * Set resource manager
   */
  public setResourceManager(resourceManager: ResourceManager): void {
    this.resourceManager = resourceManager;
  }

  /**
   * Set unit manager
   */
  public setUnitManager(unitManager: UnitManager): void {
    this.unitManager = unitManager;
  }
}

