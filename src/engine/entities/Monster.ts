/**
 * Monster Base System
 * Core entity with procedural generation, deterministic stats, and behavior config
 */

import { Vector2 } from '../math/Vector2';
import { SeededRandom } from '../../lib/SeededRandom';

export type MonsterType = 'spider' | 'goblin' | 'undead' | 'dragon';

export interface MonsterStats {
  health: number;
  maxHealth: number;
  damage: number;
  armor: number;
  speed: number;
  range: number;
  attackCooldown: number;
}

export interface MonsterBehavior {
  aggressiveness: number; // 0-1, how likely to attack
  fleeThreshold: number; // Health % to flee (0-1)
  attackPattern: 'melee' | 'ranged' | 'mixed';
  groupBehavior: 'solo' | 'pack' | 'swarm';
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface MonsterVisualParams {
  colorScheme: ColorScheme;
  scaleMultiplier: number;
  animationSpeed: number;
}

export class Monster {
  public readonly id: string;
  public readonly monsterType: MonsterType;
  public readonly faction: string;
  public modelSeed: number;
  
  public position: Vector2;
  public stats: MonsterStats;
  public behavior: MonsterBehavior;
  public visualParams: MonsterVisualParams;
  
  public animationState: 'idle' | 'moving' | 'attacking' | 'fleeing' = 'idle';
  public lastAttackTime: number = 0;
  public targetId: string | null = null;
  
  private rng: SeededRandom;

  constructor(
    position: Vector2,
    monsterType: MonsterType,
    faction: string,
    spawnSeed: number
  ) {
    this.id = `monster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.monsterType = monsterType;
    this.faction = faction;
    this.modelSeed = spawnSeed;
    this.position = position.clone();
    
    this.rng = new SeededRandom(spawnSeed);
    
    // Generate stats deterministically
    this.stats = this.generateStats();
    
    // Generate behavior config
    this.behavior = this.generateBehavior();
    
    // Generate visual parameters
    this.visualParams = this.generateVisualParams();
  }

  /**
   * Generate stats based on monster type and seed
   */
  private generateStats(): MonsterStats {
    const baseStats = this.getBaseStatsForType(this.monsterType);
    
    // Apply ±20% variation based on seed
    const variation = 0.2;
    
    return {
      health: Math.floor(baseStats.health * (1 + this.rng.nextFloat(-variation, variation))),
      maxHealth: Math.floor(baseStats.health * (1 + this.rng.nextFloat(-variation, variation))),
      damage: Math.floor(baseStats.damage * (1 + this.rng.nextFloat(-variation, variation))),
      armor: Math.floor(baseStats.armor * (1 + this.rng.nextFloat(-variation, variation))),
      speed: Math.floor(baseStats.speed * (1 + this.rng.nextFloat(-variation, variation))),
      range: Math.floor(baseStats.range * (1 + this.rng.nextFloat(-variation, variation))),
      attackCooldown: Math.floor(baseStats.attackCooldown * (1 + this.rng.nextFloat(-variation, variation)))
    };
  }

  /**
   * Get base stats for monster type
   */
  private getBaseStatsForType(type: MonsterType): MonsterStats {
    const baseStats: Record<MonsterType, MonsterStats> = {
      'spider': {
        health: 20,
        maxHealth: 20,
        damage: 8,
        armor: 2,
        speed: 200,
        range: 40,
        attackCooldown: 800
      },
      'goblin': {
        health: 30,
        maxHealth: 30,
        damage: 12,
        armor: 3,
        speed: 150,
        range: 50,
        attackCooldown: 600
      },
      'undead': {
        health: 50,
        maxHealth: 50,
        damage: 15,
        armor: 5,
        speed: 100,
        range: 60,
        attackCooldown: 1000
      },
      'dragon': {
        health: 200,
        maxHealth: 200,
        damage: 40,
        armor: 15,
        speed: 120,
        range: 150,
        attackCooldown: 1200
      }
    };
    
    return baseStats[type];
  }

  /**
   * Generate behavior configuration
   */
  private generateBehavior(): MonsterBehavior {
    const baseBehaviors: Record<MonsterType, MonsterBehavior> = {
      'spider': {
        aggressiveness: 0.6,
        fleeThreshold: 0.3,
        attackPattern: 'melee',
        groupBehavior: 'pack'
      },
      'goblin': {
        aggressiveness: 0.7,
        fleeThreshold: 0.25,
        attackPattern: 'mixed',
        groupBehavior: 'pack'
      },
      'undead': {
        aggressiveness: 0.8,
        fleeThreshold: 0.1, // Undead don't flee easily
        attackPattern: 'melee',
        groupBehavior: 'swarm'
      },
      'dragon': {
        aggressiveness: 0.9,
        fleeThreshold: 0.2,
        attackPattern: 'ranged',
        groupBehavior: 'solo'
      }
    };
    
    const base = baseBehaviors[this.monsterType];
    
    // Add slight variation
    return {
      aggressiveness: Math.max(0.1, Math.min(0.9, base.aggressiveness + this.rng.nextFloat(-0.1, 0.1))),
      fleeThreshold: Math.max(0.05, Math.min(0.5, base.fleeThreshold + this.rng.nextFloat(-0.05, 0.05))),
      attackPattern: base.attackPattern,
      groupBehavior: base.groupBehavior
    };
  }

  /**
   * Generate visual parameters (colors, scale, etc.)
   */
  private generateVisualParams(): MonsterVisualParams {
    const colorSchemes: Record<MonsterType, ColorScheme[]> = {
      'spider': [
        { primary: '#8B4513', secondary: '#A0522D', accent: '#CD853F' }, // Brown/tan
        { primary: '#654321', secondary: '#8B4513', accent: '#A0522D' }, // Dark brown
        { primary: '#D2691E', secondary: '#CD853F', accent: '#DEB887' }  // Tan
      ],
      'goblin': [
        { primary: '#228B22', secondary: '#32CD32', accent: '#90EE90' }, // Green
        { primary: '#006400', secondary: '#228B22', accent: '#32CD32' },  // Dark green
        { primary: '#2F4F2F', secondary: '#3CB371', accent: '#66CDAA' } // Forest green
      ],
      'undead': [
        { primary: '#696969', secondary: '#808080', accent: '#A9A9A9' }, // Gray
        { primary: '#2F2F2F', secondary: '#4A4A4A', accent: '#696969' }, // Dark gray
        { primary: '#556B2F', secondary: '#6B8E23', accent: '#9ACD32' }  // Olive (decay)
      ],
      'dragon': [
        { primary: '#8B0000', secondary: '#DC143C', accent: '#FF6347' }, // Red
        { primary: '#2F2F2F', secondary: '#4B0082', accent: '#8B008B' }, // Dark purple
        { primary: '#8B4513', secondary: '#A0522D', accent: '#CD853F' }  // Bronze
      ]
    };
    
    const schemes = colorSchemes[this.monsterType];
    const colorScheme = schemes[this.rng.nextInt(0, schemes.length - 1)];
    
    return {
      colorScheme,
      scaleMultiplier: 1 + this.rng.nextFloat(-0.2, 0.2), // ±20% size variation
      animationSpeed: 1 + this.rng.nextFloat(-0.3, 0.3)    // ±30% animation speed
    };
  }

  /**
   * Take damage
   */
  public takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount - this.stats.armor);
    this.stats.health = Math.max(0, this.stats.health - actualDamage);
    return actualDamage;
  }

  /**
   * Check if monster is alive
   */
  public isAlive(): boolean {
    return this.stats.health > 0;
  }

  /**
   * Get health percentage
   */
  public getHealthPercent(): number {
    return this.stats.health / this.stats.maxHealth;
  }

  /**
   * Check if can attack (cooldown ready)
   */
  public canAttack(currentTime: number): boolean {
    return (currentTime - this.lastAttackTime) >= this.stats.attackCooldown;
  }

  /**
   * Record attack
   */
  public recordAttack(currentTime: number): void {
    this.lastAttackTime = currentTime;
  }

  /**
   * Calculate damage with variance (±20%)
   */
  public calculateDamage(): number {
    const variance = 0.2;
    const multiplier = 1 + this.rng.nextFloat(-variance, variance);
    return Math.max(1, Math.floor(this.stats.damage * multiplier));
  }

  /**
   * Update monster state
   */
  public update(deltaTime: number): void {
    // Update animation state based on current behavior
    // This is handled by MonsterAI, but we can set defaults here
    if (this.animationState === 'attacking') {
      // Reset to idle after attack animation
      // This would be handled by animation system
    }
  }

  /**
   * Get color scheme (for rendering)
   */
  public get colorScheme(): ColorScheme {
    return this.visualParams.colorScheme;
  }

  /**
   * Reset monster (for object pooling)
   */
  public reset(position: Vector2, seed: number): void {
    this.position = position.clone();
    this.modelSeed = seed;
    this.rng = new SeededRandom(seed);
    this.stats = this.generateStats();
    this.behavior = this.generateBehavior();
    this.visualParams = this.generateVisualParams();
    this.animationState = 'idle';
    this.lastAttackTime = 0;
    this.targetId = null;
  }
}

