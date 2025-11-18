/**
 * Enhanced Unit Management System
 * Handles unit production, queues, abilities, and unit lifecycle
 */

import { ResourceManager, ResourceType, ResourceCost } from './ResourceManager';

export enum UnitType {
  WORKER = 'worker',
  INFANTRY = 'soldier',
  ARTILLERY = 'artillery',
  SCOUT = 'scout',
  HEAVY = 'heavy'
}

export enum UnitBehavior {
  IDLE = 'idle',
  MOVING = 'moving',
  ATTACKING = 'attacking',
  CAPTURING = 'capturing',
  GATHERING = 'gathering',
  RETREATING = 'retreating'
}

export interface UnitDefinition {
  unitId: string;
  unitName: string;
  unitType: UnitType;
  cost: ResourceCost;
  productionTime: number; // In ticks
  health: number;
  maxHealth: number;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number; // Attacks per second
  movementSpeed: number;
  abilities?: UnitAbility[];
}

export interface UnitAbility {
  abilityId: string;
  abilityName: string;
  cost: ResourceCost;
  cooldown: number; // In ticks
  duration: number; // In ticks
  effect: AbilityEffect;
}

export enum AbilityEffect {
  DAMAGE = 'damage',
  HEAL = 'heal',
  BUFF = 'buff',
  CAPTURE_BOOST = 'capture_boost',
  SPEED_BOOST = 'speed_boost'
}

export interface ProductionOrder {
  unitType: UnitType;
  spawnPosition: { x: number; y: number };
  productionTime: number;
  progress: number;
  playerId: number;
}

export interface UnitInstance {
  id: string;
  definition: UnitDefinition;
  playerId: number;
  x: number;
  y: number;
  health: number;
  behavior: UnitBehavior;
  targetId?: string;
  targetPosition?: { x: number; y: number };
  abilityCooldowns: Map<string, number>;
  activeAbilities: Map<string, number>; // abilityId -> remaining duration
}

export class UnitManager {
  private unitDefinitions: Map<UnitType, UnitDefinition>;
  private productionQueues: Map<number, ProductionOrder[]>; // playerId -> queue
  private activeUnits: Map<string, UnitInstance>;
  private unitCounts: Map<number, Map<UnitType, number>>; // playerId -> type -> count
  
  private resourceManager: ResourceManager | null = null;
  
  // Limits
  private maxUnits: number = 50;
  private unitCapPerType: number = 10;

  constructor(resourceManager?: ResourceManager) {
    this.resourceManager = resourceManager || null;
    this.unitDefinitions = new Map();
    this.productionQueues = new Map();
    this.activeUnits = new Map();
    this.unitCounts = new Map();
    
    this.initializeUnitDefinitions();
  }

  private initializeUnitDefinitions(): void {
    // Worker Unit - Spec: cost 50 Ore, build 12s, weak combat
    this.unitDefinitions.set(UnitType.WORKER, {
      unitId: 'worker',
      unitName: 'Worker',
      unitType: UnitType.WORKER,
      cost: { ore: 50 },
      productionTime: 12, // 12 ticks (12s at 1 tick/sec, or 720 ticks at 60 ticks/sec)
      health: 50,
      maxHealth: 50,
      attackDamage: 5,
      attackRange: 2,
      attackSpeed: 1,
      movementSpeed: 3
    });

    // Infantry Unit - Spec: cost 100 Ore, build 18s
    this.unitDefinitions.set(UnitType.INFANTRY, {
      unitId: 'soldier',
      unitName: 'Infantry',
      unitType: UnitType.INFANTRY,
      cost: { ore: 100 },
      productionTime: 18, // 18 ticks
      health: 100,
      maxHealth: 100,
      attackDamage: 25,
      attackRange: 5,
      attackSpeed: 0.8,
      movementSpeed: 2.5
    });

    // Artillery Unit - Spec: cost 200 Ore, build 30s, long range siege, slow
    this.unitDefinitions.set(UnitType.ARTILLERY, {
      unitId: 'artillery',
      unitName: 'Artillery',
      unitType: UnitType.ARTILLERY,
      cost: { ore: 200 },
      productionTime: 30, // 30 ticks
      health: 200,
      maxHealth: 200,
      attackDamage: 40,
      attackRange: 8,
      attackSpeed: 0.3,
      movementSpeed: 1.5
    });

    // Scout Unit - Spec: cost 75 Ore + 10 Energy to deploy
    this.unitDefinitions.set(UnitType.SCOUT, {
      unitId: 'scout',
      unitName: 'Scout Drone',
      unitType: UnitType.SCOUT,
      cost: { ore: 75, energy: 10 },
      productionTime: 15, // 15 ticks
      health: 30,
      maxHealth: 30,
      attackDamage: 2,
      attackRange: 1,
      attackSpeed: 2,
      movementSpeed: 5
    });

    // Heavy Unit (not in spec, keeping for compatibility)
    this.unitDefinitions.set(UnitType.HEAVY, {
      unitId: 'heavy',
      unitName: 'Heavy Unit',
      unitType: UnitType.HEAVY,
      cost: { ore: 200, energy: 100, biomass: 50 },
      productionTime: 30,
      health: 500,
      maxHealth: 500,
      attackDamage: 50,
      attackRange: 6,
      attackSpeed: 0.3,
      movementSpeed: 2
    });
  }

  /**
   * Set resource manager reference
   */
  public setResourceManager(resourceManager: ResourceManager): void {
    this.resourceManager = resourceManager;
  }

  /**
   * Queue unit production
   */
  public queueUnitProduction(
    unitType: UnitType,
    spawnPosition: { x: number; y: number },
    playerId: number
  ): boolean {
    const definition = this.getUnitDefinition(unitType);
    if (!definition) {
      return false;
    }

    // Check if can afford
    if (this.resourceManager && !this.resourceManager.canAfford(definition.cost)) {
      return false;
    }

    // Check unit limits
    if (this.getUnitCount(unitType, playerId) >= this.unitCapPerType) {
      return false;
    }

    if (this.getTotalUnitCount(playerId) >= this.maxUnits) {
      return false;
    }

    // Spend resources
    if (this.resourceManager) {
      if (!this.resourceManager.spendResources(definition.cost)) {
        return false;
      }
    }

    // Create production order
    const order: ProductionOrder = {
      unitType,
      spawnPosition,
      productionTime: definition.productionTime,
      progress: 0,
      playerId
    };

    if (!this.productionQueues.has(playerId)) {
      this.productionQueues.set(playerId, []);
    }
    this.productionQueues.get(playerId)!.push(order);

    return true;
  }

  /**
   * Process production queues (called every tick)
   */
  public processProductionTicks(): UnitInstance[] {
    const completedUnits: UnitInstance[] = [];

    this.productionQueues.forEach((queue, playerId) => {
      if (queue.length === 0) return;

      const order = queue[0];
      order.progress += 1;

      if (order.progress >= order.productionTime) {
        // Unit completed
        queue.shift();
        const unit = this.spawnUnit(order.unitType, order.spawnPosition, order.playerId);
        if (unit) {
          completedUnits.push(unit);
        }
      }
    });

    return completedUnits;
  }

  /**
   * Spawn a unit
   */
  private spawnUnit(
    unitType: UnitType,
    position: { x: number; y: number },
    playerId: number
  ): UnitInstance | null {
    const definition = this.getUnitDefinition(unitType);
    if (!definition) {
      return null;
    }

    const unitId = `unit_${playerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const unit: UnitInstance = {
      id: unitId,
      definition,
      playerId,
      x: position.x,
      y: position.y,
      health: definition.health,
      behavior: UnitBehavior.IDLE,
      abilityCooldowns: new Map(),
      activeAbilities: new Map()
    };

    this.activeUnits.set(unitId, unit);

    // Update unit counts
    if (!this.unitCounts.has(playerId)) {
      this.unitCounts.set(playerId, new Map());
    }
    const counts = this.unitCounts.get(playerId)!;
    counts.set(unitType, (counts.get(unitType) || 0) + 1);

    return unit;
  }

  /**
   * Process unit ticks (abilities, cooldowns, etc.)
   */
  public processUnitTicks(): void {
    this.activeUnits.forEach(unit => {
      // Process ability cooldowns
      unit.abilityCooldowns.forEach((cooldown, abilityId) => {
        if (cooldown > 0) {
          unit.abilityCooldowns.set(abilityId, cooldown - 1);
        } else {
          unit.abilityCooldowns.delete(abilityId);
        }
      });

      // Process active abilities
      unit.activeAbilities.forEach((duration, abilityId) => {
        if (duration > 0) {
          unit.activeAbilities.set(abilityId, duration - 1);
        } else {
          unit.activeAbilities.delete(abilityId);
        }
      });
    });
  }

  /**
   * Get unit definition
   */
  public getUnitDefinition(unitType: UnitType): UnitDefinition | undefined {
    return this.unitDefinitions.get(unitType);
  }

  /**
   * Get unit instance
   */
  public getUnit(unitId: string): UnitInstance | undefined {
    return this.activeUnits.get(unitId);
  }

  /**
   * Get all units for a player
   */
  public getPlayerUnits(playerId: number): UnitInstance[] {
    const units: UnitInstance[] = [];
    this.activeUnits.forEach(unit => {
      if (unit.playerId === playerId) {
        units.push(unit);
      }
    });
    return units;
  }

  /**
   * Get unit count for a type
   */
  public getUnitCount(unitType: UnitType, playerId: number): number {
    const counts = this.unitCounts.get(playerId);
    if (!counts) return 0;
    return counts.get(unitType) || 0;
  }

  /**
   * Get total unit count for a player
   */
  public getTotalUnitCount(playerId: number): number {
    return this.getPlayerUnits(playerId).length;
  }

  /**
   * Get surviving units count
   */
  public getSurvivingUnits(playerId: number): number {
    return this.getPlayerUnits(playerId).length;
  }

  /**
   * Remove unit (on death)
   */
  public removeUnit(unitId: string): void {
    const unit = this.activeUnits.get(unitId);
    if (!unit) return;

    // Update counts
    const counts = this.unitCounts.get(unit.playerId);
    if (counts) {
      const currentCount = counts.get(unit.definition.unitType) || 0;
      counts.set(unit.definition.unitType, Math.max(0, currentCount - 1));
    }

    this.activeUnits.delete(unitId);
  }

  /**
   * Use unit ability
   */
  public useAbility(unitId: string, abilityId: string): boolean {
    const unit = this.activeUnits.get(unitId);
    if (!unit || !unit.definition.abilities) {
      return false;
    }

    const ability = unit.definition.abilities.find(a => a.abilityId === abilityId);
    if (!ability) {
      return false;
    }

    // Check cooldown
    if (unit.abilityCooldowns.has(abilityId)) {
      return false;
    }

    // Check cost
    if (this.resourceManager && !this.resourceManager.canAfford(ability.cost)) {
      return false;
    }

    // Spend resources
    if (this.resourceManager) {
      this.resourceManager.spendResources(ability.cost);
    }

    // Apply ability
    unit.abilityCooldowns.set(abilityId, ability.cooldown);
    if (ability.duration > 0) {
      unit.activeAbilities.set(abilityId, ability.duration);
    }

    // Apply effect
    this.applyAbilityEffect(unit, ability);

    return true;
  }

  /**
   * Apply ability effect
   */
  private applyAbilityEffect(unit: UnitInstance, ability: UnitAbility): void {
    switch (ability.effect) {
      case AbilityEffect.HEAL:
        unit.health = Math.min(unit.health + 50, unit.definition.maxHealth);
        break;
      case AbilityEffect.SPEED_BOOST:
        // Speed boost is handled by activeAbilities duration
        break;
      case AbilityEffect.DAMAGE:
        // Damage ability would target enemies
        break;
      // Other effects...
    }
  }

  /**
   * Update unit position
   */
  public updateUnitPosition(unitId: string, x: number, y: number): void {
    const unit = this.activeUnits.get(unitId);
    if (unit) {
      unit.x = x;
      unit.y = y;
    }
  }

  /**
   * Update unit behavior
   */
  public updateUnitBehavior(unitId: string, behavior: UnitBehavior, targetId?: string): void {
    const unit = this.activeUnits.get(unitId);
    if (unit) {
      unit.behavior = behavior;
      if (targetId) {
        unit.targetId = targetId;
      }
    }
  }

  /**
   * Damage unit
   */
  public damageUnit(unitId: string, damage: number): boolean {
    const unit = this.activeUnits.get(unitId);
    if (!unit) return false;

    unit.health = Math.max(0, unit.health - damage);
    
    if (unit.health <= 0) {
      this.removeUnit(unitId);
      return true; // Unit died
    }

    return false; // Unit survived
  }

  /**
   * Get production queue for player
   */
  public getProductionQueue(playerId: number): ProductionOrder[] {
    return this.productionQueues.get(playerId) || [];
  }

  /**
   * Cancel production order
   */
  public cancelProductionOrder(playerId: number, index: number): boolean {
    const queue = this.productionQueues.get(playerId);
    if (!queue || index < 0 || index >= queue.length) {
      return false;
    }

    const order = queue[index];
    const definition = this.getUnitDefinition(order.unitType);
    
    // Refund resources (50% refund)
    if (this.resourceManager && definition) {
      const refund: ResourceCost = {};
      Object.entries(definition.cost).forEach(([type, amount]) => {
        if (amount) {
          refund[type as ResourceType] = Math.floor(amount * 0.5);
        }
      });
      this.resourceManager.addResource(ResourceType.ORE, refund.ore || 0);
      this.resourceManager.addResource(ResourceType.ENERGY, refund.energy || 0);
      this.resourceManager.addResource(ResourceType.BIOMASS, refund.biomass || 0);
      this.resourceManager.addResource(ResourceType.DATA, refund.data || 0);
    }

    queue.splice(index, 1);
    return true;
  }
}

