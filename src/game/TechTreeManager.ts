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
  urgencyFactor: number; // 0-1, where 0=long-term, 1=immediate need
  isHidden: boolean;
  discoveryConditions?: string[]; // Conditions for revealing hidden nodes
  counterTech?: string[]; // Techs that counter this one
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
    // Basic Refinery - Spec: Cost 200 Ore, Time 20s → increases Ore per node +25%
    this.addTechNode({
      nodeId: 'basic_refinery',
      nodeName: 'Basic Refinery',
      description: 'Increases Ore production efficiency by 25%',
      category: TechCategory.INFRASTRUCTURE,
      cost: { ore: 200 },
      researchTime: 20, // 20 seconds = 1200 ticks at 60 ticks/sec
      prerequisiteNodes: [],
      effects: [
        {
          type: EffectType.RESOURCE_MODIFIER,
          target: 'ore_generation',
          value: 1.25,
          isMultiplicative: true
        }
      ],
      unitUnlocks: [],
      buildingUnlocks: [],
      synergyNodes: ['reactor_overclock'],
      strategicWeight: 1.2,
      urgencyFactor: 0.3,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Scout AI - Spec: Cost 100 Ore, 30 Data, Time 25s → enables Scout Drone
    this.addTechNode({
      nodeId: 'scout_ai',
      nodeName: 'Scout AI Systems',
      description: 'Enables Scout Drone production',
      category: TechCategory.MILITARY,
      cost: { ore: 100, data: 30 },
      researchTime: 25, // 25 seconds
      prerequisiteNodes: [],
      effects: [],
      unitUnlocks: ['scout'],
      buildingUnlocks: [],
      synergyNodes: [],
      strategicWeight: 1.5,
      urgencyFactor: 0.9,
      counterTech: ['stealth_tech'],
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Reactor Overclock - Spec: Cost 250 Ore, 60 Data, Time 45s → Energy production +50% for 3 ticks
    this.addTechNode({
      nodeId: 'reactor_overclock',
      nodeName: 'Reactor Overclock',
      description: 'Energy production +50% for 3 ticks (high payoff if timed)',
      category: TechCategory.INFRASTRUCTURE,
      cost: { ore: 250, data: 60 },
      researchTime: 45, // 45 seconds
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
      synergyNodes: ['basic_refinery'],
      strategicWeight: 1.8,
      urgencyFactor: 0.6,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Bio Conserve - Spec: Cost 150 Biomass, 50 Data, Time 40s → reduces BioMass conversion loss
    this.addTechNode({
      nodeId: 'bio_conserve',
      nodeName: 'Bio-Conservation Protocol',
      description: 'Reduces Biomass conversion loss and unlocks unique endings',
      category: TechCategory.SPECIAL,
      cost: { biomass: 150, data: 50 },
      researchTime: 40, // 40 seconds
      prerequisiteNodes: [],
      effects: [
        {
          type: EffectType.RESOURCE_MODIFIER,
          target: 'biomass_efficiency',
          value: 1.4,
          isMultiplicative: true
        }
      ],
      unitUnlocks: [],
      buildingUnlocks: [],
      synergyNodes: [],
      strategicWeight: 2.0,
      urgencyFactor: 0.4,
      discoveryConditions: ['biomass_threshold'],
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
      urgencyFactor: 0.2,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Add more puzzle-focused tech nodes

    // Fast Anti-Air - Demo Puzzle A example
    this.addTechNode({
      nodeId: 'fast_anti_air',
      nodeName: 'Rapid Anti-Air Systems',
      description: 'Quick-deployment anti-air defenses',
      category: TechCategory.MILITARY,
      cost: { ore: 200, data: 50 },
      researchTime: 20,
      prerequisiteNodes: [],
      effects: [],
      unitUnlocks: ['anti_air_turret'],
      buildingUnlocks: [],
      synergyNodes: ['energy_shielding'],
      strategicWeight: 1.5,
      urgencyFactor: 0.9,
      counterTech: ['stealth_tech', 'armored_air'],
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Energy Shielding - Synergy with anti-air
    this.addTechNode({
      nodeId: 'energy_shielding',
      nodeName: 'Energy Shielding',
      description: 'Protective energy barriers for units',
      category: TechCategory.INFRASTRUCTURE,
      cost: { ore: 150, energy: 100, data: 40 },
      researchTime: 35,
      prerequisiteNodes: [],
      effects: [
        {
          type: EffectType.UNIT_STAT,
          target: 'unit_health',
          value: 1.2,
          isMultiplicative: true
        }
      ],
      unitUnlocks: [],
      buildingUnlocks: [],
      synergyNodes: ['fast_anti_air', 'reactor_overclock'],
      strategicWeight: 1.3,
      urgencyFactor: 0.5,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Drone Bay - Synergy cluster example
    this.addTechNode({
      nodeId: 'drone_bay',
      nodeName: 'Drone Bay',
      description: 'Enables basic drone production',
      category: TechCategory.MILITARY,
      cost: { ore: 150, data: 30 },
      researchTime: 15,
      prerequisiteNodes: [],
      effects: [],
      unitUnlocks: ['scout_drone'],
      buildingUnlocks: [],
      synergyNodes: ['drone_ai', 'reactive_swarm'],
      strategicWeight: 1.0,
      urgencyFactor: 0.4,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Drone AI - Part of synergy cluster
    this.addTechNode({
      nodeId: 'drone_ai',
      nodeName: 'Drone AI Systems',
      description: 'Advanced AI for drone coordination',
      category: TechCategory.RESEARCH,
      cost: { ore: 200, data: 100 },
      researchTime: 30,
      prerequisiteNodes: ['drone_bay'],
      effects: [
        {
          type: EffectType.UNIT_STAT,
          target: 'unit_speed',
          value: 1.3,
          isMultiplicative: true
        }
      ],
      unitUnlocks: [],
      buildingUnlocks: [],
      synergyNodes: ['drone_bay', 'reactive_swarm'],
      strategicWeight: 1.2,
      urgencyFactor: 0.5,
      isHidden: false,
      isResearched: false,
      isAvailable: false,
      researchProgress: 0
    });

    // Reactive Swarm - Synergy cluster payoff
    this.addTechNode({
      nodeId: 'reactive_swarm',
      nodeName: 'Reactive Swarm Protocol',
      description: 'Exponential swarm bonus when combined with drone tech',
      category: TechCategory.SPECIAL,
      cost: { ore: 300, energy: 150, data: 150 },
      researchTime: 45,
      prerequisiteNodes: ['drone_bay', 'drone_ai'],
      effects: [
        {
          type: EffectType.GLOBAL_MODIFIER,
          target: 'swarm_multiplier',
          value: 2.0,
          isMultiplicative: true
        }
      ],
      unitUnlocks: [],
      buildingUnlocks: [],
      synergyNodes: ['drone_bay', 'drone_ai'],
      strategicWeight: 2.5,
      urgencyFactor: 0.3,
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
          if (effect.target.includes('ore') || effect.target.includes('matter')) {
            this.resourceManager.increaseMaxCapacity(ResourceType.ORE, effect.value);
          } else if (effect.target.includes('energy')) {
            this.resourceManager.increaseMaxCapacity(ResourceType.ENERGY, effect.value);
          } else if (effect.target.includes('biomass') || effect.target.includes('life')) {
            this.resourceManager.increaseMaxCapacity(ResourceType.BIOMASS, effect.value);
          } else if (effect.target.includes('data') || effect.target.includes('knowledge')) {
            this.resourceManager.increaseMaxCapacity(ResourceType.DATA, effect.value);
          }
          break;
        case EffectType.DECAY_REDUCTION:
          if (effect.target.includes('ore') || effect.target.includes('matter')) {
            this.resourceManager.reduceDecayRate(ResourceType.ORE, effect.value);
          } else if (effect.target.includes('energy')) {
            this.resourceManager.reduceDecayRate(ResourceType.ENERGY, effect.value);
          } else if (effect.target.includes('biomass') || effect.target.includes('life')) {
            this.resourceManager.reduceDecayRate(ResourceType.BIOMASS, effect.value);
          } else if (effect.target.includes('data') || effect.target.includes('knowledge')) {
            this.resourceManager.reduceDecayRate(ResourceType.DATA, effect.value);
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

    // Demo: Reveal bio_conserve when player has enough biomass
    if (node.nodeId === 'bio_conserve') {
      return this.resourceManager.getResourceAmount(ResourceType.BIOMASS) >= 50;
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
      this.resourceManager.addResource(ResourceType.ORE, refund.ore || 0);
      this.resourceManager.addResource(ResourceType.ENERGY, refund.energy || 0);
      this.resourceManager.addResource(ResourceType.BIOMASS, refund.biomass || 0);
      this.resourceManager.addResource(ResourceType.DATA, refund.data || 0);
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

  /**
   * Get affordable tech nodes (for opportunity cost calculation)
   */
  public getAffordableTechs(resourceManager: ResourceManager): TechNode[] {
    return this.getAvailableTechNodes().filter(node => {
      if (node.isResearched) return false;
      return resourceManager.canAfford(node.cost);
    });
  }

  /**
   * Get tech nodes by category
   */
  public getTechNodesByCategory(category: TechCategory): TechNode[] {
    return Array.from(this.allTechNodes.values()).filter(node => node.category === category);
  }

  /**
   * Get synergy cluster for a node
   */
  public getSynergyCluster(nodeId: string): TechNode[] {
    const node = this.allTechNodes.get(nodeId);
    if (!node) return [];

    const cluster: TechNode[] = [node];
    const processed = new Set<string>([nodeId]);
    const toCheck = [...node.synergyNodes];

    while (toCheck.length > 0) {
      const synergyId = toCheck.pop()!;
      if (processed.has(synergyId)) continue;

      const synergyNode = this.allTechNodes.get(synergyId);
      if (synergyNode) {
        cluster.push(synergyNode);
        processed.add(synergyId);
        toCheck.push(...synergyNode.synergyNodes);
      }
    }

    return cluster;
  }
}

