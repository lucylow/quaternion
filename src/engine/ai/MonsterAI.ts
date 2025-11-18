/**
 * Monster AI System
 * Behavior tree and decision-making for monsters
 */

import { Monster } from '../entities/Monster';
import { Vector2 } from '../math/Vector2';

export interface AIAction {
  type: 'attack' | 'chase' | 'flee' | 'wander' | 'idle';
  target?: any; // Entity target
  direction?: Vector2; // Movement direction
  reason: string; // Human-readable reason for replay
}

export class MonsterAI {
  private monster: Monster;
  private target: any | null = null;
  private lastDecisionTime: number = 0;
  private decisionCooldown: number = 100; // Milliseconds between decisions
  private acquisitionRange: number = 300; // Pixels
  private replayLogger?: (action: AIAction) => void;

  constructor(monster: Monster, replayLogger?: (action: AIAction) => void) {
    this.monster = monster;
    this.replayLogger = replayLogger;
  }

  /**
   * Update AI (call in game loop)
   */
  public update(deltaTime: number, allEntities: any[]): void {
    const currentTime = Date.now();
    
    // Update target acquisition
    this.updateTarget(allEntities);
    
    // Make decision if cooldown ready
    if (currentTime - this.lastDecisionTime >= this.decisionCooldown) {
      const action = this.decideAction();
      this.executeAction(action, deltaTime, currentTime);
      this.lastDecisionTime = currentTime;
    }
    
    // Update monster state
    this.monster.update(deltaTime);
  }

  /**
   * Update target acquisition
   */
  private updateTarget(allEntities: any[]): void {
    // Clear target if dead or out of range
    if (this.target) {
      const distance = this.monster.position.distanceTo(
        this.getEntityPosition(this.target)
      );
      
      if (distance > this.acquisitionRange * 1.5 || !this.isEntityAlive(this.target)) {
        this.target = null;
        this.monster.targetId = null;
      }
    }
    
    // Find new target if none
    if (!this.target) {
      this.target = this.findNearestHostile(allEntities);
      if (this.target) {
        this.monster.targetId = this.target.id || null;
      }
    }
  }

  /**
   * Find nearest hostile entity
   */
  private findNearestHostile(allEntities: any[]): any | null {
    let nearest: any | null = null;
    let nearestDistance = this.acquisitionRange;
    
    for (const entity of allEntities) {
      // Skip self
      if (entity.id === this.monster.id) continue;
      
      // Skip same faction
      if (entity.faction === this.monster.faction) continue;
      
      // Skip if not alive
      if (!this.isEntityAlive(entity)) continue;
      
      // Calculate distance
      const entityPos = this.getEntityPosition(entity);
      const distance = this.monster.position.distanceTo(entityPos);
      
      if (distance < nearestDistance) {
        nearest = entity;
        nearestDistance = distance;
      }
    }
    
    return nearest;
  }

  /**
   * Get entity position (handles different entity types)
   */
  private getEntityPosition(entity: any): Vector2 {
    if (entity.position instanceof Vector2) {
      return entity.position;
    }
    if (entity.x !== undefined && entity.y !== undefined) {
      return new Vector2(entity.x, entity.y);
    }
    return new Vector2(0, 0);
  }

  /**
   * Check if entity is alive
   */
  private isEntityAlive(entity: any): boolean {
    if (entity instanceof Monster) {
      return entity.isAlive();
    }
    if (entity.hp !== undefined) {
      return entity.hp > 0;
    }
    if (entity.stats?.health !== undefined) {
      return entity.stats.health > 0;
    }
    return true; // Assume alive if we can't determine
  }

  /**
   * Decide next action
   */
  private decideAction(): AIAction {
    const healthPercent = this.monster.getHealthPercent();
    
    // Priority 1: Flee if health too low
    if (healthPercent < this.monster.behavior.fleeThreshold) {
      return {
        type: 'flee',
        direction: this.target ? this.calculateFleeDirection() : this.getRandomDirection(),
        reason: `${this.monster.monsterType} retreats: health < ${Math.round(healthPercent * 100)}%`
      };
    }
    
    // Priority 2: Attack if target in range
    if (this.target) {
      const distance = this.monster.position.distanceTo(
        this.getEntityPosition(this.target)
      );
      
      if (distance <= this.monster.stats.range) {
        const currentTime = Date.now();
        if (this.monster.canAttack(currentTime)) {
          return {
            type: 'attack',
            target: this.target,
            reason: `${this.monster.monsterType} attacks ${this.getEntityType(this.target)} at range ${Math.round(distance)}`
          };
        } else {
          // In range but on cooldown, wait
          return {
            type: 'idle',
            reason: `${this.monster.monsterType} waits for attack cooldown`
          };
        }
      } else {
        // Target out of range, chase
        return {
          type: 'chase',
          target: this.target,
          reason: `${this.monster.monsterType} chases ${this.getEntityType(this.target)} at range ${Math.round(distance)}`
        };
      }
    }
    
    // Priority 3: Wander if no target
    if (this.monster.behavior.aggressiveness > this.randomFloat()) {
      return {
        type: 'wander',
        direction: this.getRandomDirection(),
        reason: `${this.monster.monsterType} wanders (aggressive behavior)`
      };
    }
    
    // Default: idle
    return {
      type: 'idle',
      reason: `${this.monster.monsterType} idles`
    };
  }

  /**
   * Execute action
   */
  private executeAction(action: AIAction, deltaTime: number, currentTime: number): void {
    // Log action for replay
    if (this.replayLogger) {
      this.replayLogger(action);
    }
    
    switch (action.type) {
      case 'attack':
        this.executeAttack(action.target, currentTime);
        break;
      case 'chase':
        this.executeChase(action.target, deltaTime);
        break;
      case 'flee':
        this.executeFlee(action.direction!, deltaTime);
        break;
      case 'wander':
        this.executeWander(action.direction!, deltaTime);
        break;
      case 'idle':
        this.executeIdle();
        break;
    }
  }

  /**
   * Execute attack
   */
  private executeAttack(target: any, currentTime: number): void {
    if (!target) return;
    
    this.monster.animationState = 'attacking';
    this.monster.recordAttack(currentTime);
    
    // Calculate damage with variance
    const damage = this.monster.calculateDamage();
    
    // Apply damage to target
    if (target instanceof Monster) {
      target.takeDamage(damage);
    } else if (target.takeDamage) {
      target.takeDamage(damage);
    } else if (target.hp !== undefined) {
      target.hp = Math.max(0, target.hp - damage);
    } else if (target.stats?.health !== undefined) {
      target.stats.health = Math.max(0, target.stats.health - damage);
    }
  }

  /**
   * Execute chase
   */
  private executeChase(target: any, deltaTime: number): void {
    if (!target) return;
    
    this.monster.animationState = 'moving';
    const targetPos = this.getEntityPosition(target);
    const direction = targetPos.subtract(this.monster.position).normalize();
    this.moveMonster(direction, deltaTime);
  }

  /**
   * Execute flee
   */
  private executeFlee(direction: Vector2, deltaTime: number): void {
    this.monster.animationState = 'fleeing';
    this.moveMonster(direction, deltaTime);
  }

  /**
   * Execute wander
   */
  private executeWander(direction: Vector2, deltaTime: number): void {
    this.monster.animationState = 'moving';
    this.moveMonster(direction, deltaTime);
  }

  /**
   * Execute idle
   */
  private executeIdle(): void {
    this.monster.animationState = 'idle';
  }

  /**
   * Move monster in direction
   */
  private moveMonster(direction: Vector2, deltaTime: number): void {
    const speed = this.monster.stats.speed * deltaTime; // Convert to pixels per second
    const movement = direction.multiply(speed);
    this.monster.position = this.monster.position.add(movement);
  }

  /**
   * Calculate flee direction (away from target)
   */
  private calculateFleeDirection(): Vector2 {
    if (!this.target) {
      return this.getRandomDirection();
    }
    
    const targetPos = this.getEntityPosition(this.target);
    const direction = this.monster.position.subtract(targetPos);
    return direction.normalize();
  }

  /**
   * Get random direction
   */
  private getRandomDirection(): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  /**
   * Get entity type string (for replay)
   */
  private getEntityType(entity: any): string {
    if (entity instanceof Monster) {
      return entity.monsterType;
    }
    return entity.type || entity.constructor?.name || 'unknown';
  }

  /**
   * Random float helper
   */
  private randomFloat(): number {
    return Math.random();
  }

  /**
   * Generate reason string for replay
   */
  public generateReasonString(action: AIAction): string {
    return action.reason;
  }
}

