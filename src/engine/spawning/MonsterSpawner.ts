/**
 * Monster Spawner System
 * Manages monster spawning, pooling, and lifecycle
 */

import { Monster, MonsterType } from '../entities/Monster';
import { Vector2 } from '../math/Vector2';
import { SeededRandom } from '../../lib/SeededRandom';

export interface SpawnConfig {
  minDistance: number;        // Minimum distance from center to spawn
  maxDistance: number;         // Maximum distance from center
  maxConcurrentMonsters: number; // Max monsters at once
  spawnChance: number;         // Probability per spawn tick (0-1)
  respawnDelay: number;        // Milliseconds between spawn attempts
}

export class MonsterSpawner {
  private gameState: any; // QuaternionGameState
  private config: SpawnConfig;
  private globalSeed: number;
  private spawnPoints: Vector2[] = [];
  private lastSpawnTime: number = 0;
  private spawnCount: number = 0;
  private rng: SeededRandom;

  constructor(gameState: any, config: SpawnConfig, globalSeed: number) {
    this.gameState = gameState;
    this.config = config;
    this.globalSeed = globalSeed;
    this.rng = new SeededRandom(globalSeed);
  }

  /**
   * Set spawn points (typically map edges)
   */
  public setSpawnPoints(points: Vector2[]): void {
    this.spawnPoints = points.map(p => p.clone());
  }

  /**
   * Update spawner (call in game loop)
   */
  public update(deltaTime: number, currentTime: number): void {
    // Check if we can spawn
    if (this.shouldSpawn(currentTime)) {
      this.attemptSpawn(currentTime);
    }
  }

  /**
   * Check if should attempt spawn
   */
  private shouldSpawn(currentTime: number): boolean {
    // Check cooldown
    if (currentTime - this.lastSpawnTime < this.config.respawnDelay) {
      return false;
    }

    // Check max concurrent
    const currentMonsters = this.getCurrentMonsterCount();
    if (currentMonsters >= this.config.maxConcurrentMonsters) {
      return false;
    }

    // Check spawn chance
    return this.rng.next() < this.config.spawnChance;
  }

  /**
   * Attempt to spawn a monster
   */
  private attemptSpawn(currentTime: number): void {
    if (this.spawnPoints.length === 0) {
      return; // No spawn points configured
    }

    // Select random spawn point
    const spawnPoint = this.rng.choice(this.spawnPoints);
    
    // Select monster type (weighted distribution)
    const monsterType = this.selectMonsterType();
    
    // Generate spawn seed (combine global seed with spawn count and time)
    const spawnSeed = this.generateSpawnSeed(currentTime);
    
    // Create monster
    const monster = new Monster(spawnPoint, monsterType, 'enemies', spawnSeed);
    
    // Add to game state
    this.addMonsterToGameState(monster);
    
    // Update tracking
    this.lastSpawnTime = currentTime;
    this.spawnCount++;
  }

  /**
   * Select monster type with weighted distribution
   * 40% spider, 30% goblin, 20% undead, 10% dragon
   */
  private selectMonsterType(): MonsterType {
    const roll = this.rng.next();
    
    if (roll < 0.4) return 'spider';
    if (roll < 0.7) return 'goblin';
    if (roll < 0.9) return 'undead';
    return 'dragon';
  }

  /**
   * Generate deterministic spawn seed
   */
  private generateSpawnSeed(currentTime: number): number {
    // Combine global seed with spawn count and time
    // This ensures determinism while allowing variation
    const timeComponent = Math.floor(currentTime / 1000); // Use seconds, not milliseconds
    return this.globalSeed + this.spawnCount * 1000 + timeComponent;
  }

  /**
   * Get current monster count from game state
   */
  private getCurrentMonsterCount(): number {
    // Get monsters from game state
    if (this.gameState.monsters) {
      return this.gameState.monsters.filter((m: any) => 
        m instanceof Monster && m.isAlive()
      ).length;
    }
    
    return 0;
  }

  /**
   * Add monster to game state
   */
  private addMonsterToGameState(monster: Monster): void {
    // Add to monsters array (always use monsters array)
    if (!this.gameState.monsters) {
      this.gameState.monsters = [];
    }
    this.gameState.monsters.push(monster);
  }

  /**
   * Get all active monsters
   */
  public getActiveMonsters(): Monster[] {
    if (this.gameState.monsters) {
      return this.gameState.monsters.filter((m: any) => 
        m instanceof Monster && m.isAlive()
      );
    }
    return [];
  }

  /**
   * Clear all monsters (for cleanup)
   */
  public clearAllMonsters(): void {
    if (this.gameState.monsters) {
      this.gameState.monsters = this.gameState.monsters.filter((m: any) => 
        !(m instanceof Monster)
      );
    }
  }
}

