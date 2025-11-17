/**
 * Kaiju Emergence System - Random giant monster spawns that alter objectives
 * Forces temporary truce mechanics and creates dramatic moments
 */

export interface KaijuEntity {
  id: string;
  name: string;
  type: 'destructive' | 'territorial' | 'resource_drain' | 'chaos';
  health: number;
  maxHealth: number;
  damagePerSecond: number;
  damageRadius: number;
  spawnChance: number;
  behaviors: KaijuBehavior[];
  defeatLoot: Record<string, number>; // resource -> amount
  roarSoundEffects: string[];
  description: string;
}

export interface KaijuBehavior {
  type: 'wander' | 'target_base' | 'destroy_buildings' | 'drain_resources';
  update: (kaiju: KaijuEntity, gameState: any, deltaTime: number) => void;
}

export class KaijuEventSystem {
  private kaijuTypes: KaijuEntity[] = [];
  private activeKaiju: KaijuEntity | null = null;
  private kaijuActive: boolean = false;
  private baseSpawnChance: number = 0.0001; // Per tick (very rare)
  private spawnPosition: { x: number; y: number } | null = null;
  private worldInstability: number = 0;

  constructor() {
    this.initializeKaijuTypes();
  }

  private initializeKaijuTypes(): void {
    this.kaijuTypes = [
      {
        id: 'zyrithon',
        name: 'Zyrithon',
        type: 'destructive',
        health: 5000,
        maxHealth: 5000,
        damagePerSecond: 50,
        damageRadius: 150,
        spawnChance: 0.3,
        behaviors: [
          {
            type: 'wander',
            update: (kaiju, gameState, deltaTime) => {
              // Wander randomly, destroying everything in path
            }
          },
          {
            type: 'destroy_buildings',
            update: (kaiju, gameState, deltaTime) => {
              // Target nearest buildings
            }
          }
        ],
        defeatLoot: {
          ore: 500,
          energy: 300,
          biomass: 200,
          data: 100
        },
        roarSoundEffects: ['roar_1', 'roar_2'],
        description: 'A massive creature of pure destruction'
      },
      {
        id: 'territorial_beast',
        name: 'Territorial Beast',
        type: 'territorial',
        health: 3000,
        maxHealth: 3000,
        damagePerSecond: 30,
        damageRadius: 100,
        spawnChance: 0.4,
        behaviors: [
          {
            type: 'target_base',
            update: (kaiju, gameState, deltaTime) => {
              // Head towards player base
            }
          }
        ],
        defeatLoot: {
          ore: 300,
          energy: 200,
          biomass: 400,
          data: 50
        },
        roarSoundEffects: ['roar_territorial'],
        description: 'Claims territory as its own'
      },
      {
        id: 'resource_drainer',
        name: 'Resource Drainer',
        type: 'resource_drain',
        health: 2000,
        maxHealth: 2000,
        damagePerSecond: 20,
        damageRadius: 80,
        spawnChance: 0.2,
        behaviors: [
          {
            type: 'drain_resources',
            update: (kaiju, gameState, deltaTime) => {
              // Drains resources from nearby nodes
            }
          }
        ],
        defeatLoot: {
          ore: 200,
          energy: 300,
          biomass: 150,
          data: 250
        },
        roarSoundEffects: ['roar_drain'],
        description: 'Siphons resources from the world'
      },
      {
        id: 'chaos_spawn',
        name: 'Chaos Spawn',
        type: 'chaos',
        health: 4000,
        maxHealth: 4000,
        damagePerSecond: 40,
        damageRadius: 120,
        spawnChance: 0.1,
        behaviors: [
          {
            type: 'wander',
            update: (kaiju, gameState, deltaTime) => {
              // Unpredictable movement
            }
          }
        ],
        defeatLoot: {
          ore: 400,
          energy: 400,
          biomass: 400,
          data: 400
        },
        roarSoundEffects: ['roar_chaos'],
        description: 'Pure chaos given form'
      }
    ];
  }

  /**
   * Update kaiju system - check for spawns and update active kaiju
   */
  update(deltaTime: number, gameState: any): {
    spawned: boolean;
    kaiju?: KaijuEntity;
    defeated?: boolean;
    position?: { x: number; y: number };
  } | null {
    // Update world instability from game state
    this.worldInstability = gameState.instability || 0;

    // Check for kaiju spawn
    if (!this.kaijuActive && this.shouldSpawnKaiju()) {
      const kaiju = this.selectKaiju();
      if (kaiju) {
        const position = this.findSpawnPosition(gameState);
        this.spawnKaiju(kaiju, position);
        return {
          spawned: true,
          kaiju,
          position
        };
      }
    }

    // Update active kaiju
    if (this.kaijuActive && this.activeKaiju) {
      this.updateKaijuBehavior(deltaTime, gameState);
      
      // Check for defeat
      if (this.isKaijuDefeated()) {
        const defeated = this.activeKaiju;
        this.defeatKaiju(gameState);
        return {
          spawned: false,
          defeated: true,
          kaiju: defeated
        };
      }
    }

    return null;
  }

  private shouldSpawnKaiju(): boolean {
    // Increase spawn chance based on world instability
    const instabilityBonus = (this.worldInstability / 200) * 0.0005;
    const totalChance = this.baseSpawnChance + instabilityBonus;
    
    return Math.random() < totalChance;
  }

  private selectKaiju(): KaijuEntity | null {
    if (this.kaijuTypes.length === 0) return null;

    // Weight selection by spawn chance
    const totalChance = this.kaijuTypes.reduce((sum, k) => sum + k.spawnChance, 0);
    let random = Math.random() * totalChance;

    for (const kaiju of this.kaijuTypes) {
      random -= kaiju.spawnChance;
      if (random <= 0) {
        return kaiju;
      }
    }

    return this.kaijuTypes[0];
  }

  private findSpawnPosition(gameState: any): { x: number; y: number } {
    // Spawn at edge of map, away from bases
    const mapWidth = gameState.config?.mapWidth || 40;
    const mapHeight = gameState.config?.mapHeight || 30;
    
    // Random edge position
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    
    switch (edge) {
      case 0: // Top
        x = Math.random() * mapWidth * 64;
        y = 0;
        break;
      case 1: // Right
        x = mapWidth * 64;
        y = Math.random() * mapHeight * 64;
        break;
      case 2: // Bottom
        x = Math.random() * mapWidth * 64;
        y = mapHeight * 64;
        break;
      case 3: // Left
        x = 0;
        y = Math.random() * mapHeight * 64;
        break;
    }

    return { x, y };
  }

  private spawnKaiju(kaiju: KaijuEntity, position: { x: number; y: number }): void {
    this.activeKaiju = { ...kaiju }; // Clone kaiju
    this.kaijuActive = true;
    this.spawnPosition = position;

    // Reset health
    this.activeKaiju.health = this.activeKaiju.maxHealth;
  }

  private updateKaijuBehavior(deltaTime: number, gameState: any): void {
    if (!this.activeKaiju) return;

    // Execute behaviors
    this.activeKaiju.behaviors.forEach(behavior => {
      behavior.update(this.activeKaiju!, gameState, deltaTime);
    });

    // Cause environmental damage
    this.causeEnvironmentalDamage(gameState, deltaTime);
  }

  private causeEnvironmentalDamage(gameState: any, deltaTime: number): void {
    if (!this.activeKaiju || !this.spawnPosition) return;

    // Damage buildings and units in radius
    const damage = this.activeKaiju.damagePerSecond * deltaTime;
    
    // This would be implemented with actual game state access
    // For now, it's a placeholder
  }

  private isKaijuDefeated(): boolean {
    return this.activeKaiju?.health !== undefined && this.activeKaiju.health <= 0;
  }

  private defeatKaiju(gameState: any): void {
    if (!this.activeKaiju) return;

    // Award loot to player
    const player = gameState.players?.get(1);
    if (player && this.activeKaiju.defeatLoot) {
      Object.entries(this.activeKaiju.defeatLoot).forEach(([resource, amount]) => {
        if (player.resources[resource] !== undefined) {
          player.resources[resource] += amount;
        }
      });
    }

    // Reset state
    this.kaijuActive = false;
    this.activeKaiju = null;
    this.spawnPosition = null;
  }

  /**
   * Get current kaiju status
   */
  getStatus(): {
    active: boolean;
    kaiju: KaijuEntity | null;
    position: { x: number; y: number } | null;
    healthPercent: number;
  } {
    return {
      active: this.kaijuActive,
      kaiju: this.activeKaiju,
      position: this.spawnPosition,
      healthPercent: this.activeKaiju 
        ? (this.activeKaiju.health / this.activeKaiju.maxHealth) * 100 
        : 0
    };
  }

  /**
   * Damage kaiju (called from combat system)
   */
  damageKaiju(damage: number): void {
    if (this.activeKaiju) {
      this.activeKaiju.health = Math.max(0, this.activeKaiju.health - damage);
    }
  }
}

