/**
 * Terrain Game Integration
 * Integrates terrain system with game state and rendering
 */

import { TerrainSystem } from './TerrainSystem';
import { TerrainRenderer } from './TerrainRenderer';
import { TerrainTechIntegration } from './TerrainTechIntegration';
import { TerrainAwareAI } from './TerrainAwareAI';
import { loadMapSeed, MAP_SEEDS } from './MapSpecLoader';
import Phaser from 'phaser';

export class TerrainGameIntegration {
  public terrainSystem: TerrainSystem;
  public terrainRenderer: TerrainRenderer | null = null;
  public techIntegration: TerrainTechIntegration;
  public aiSystem: TerrainAwareAI;
  private scene: Phaser.Scene | null = null;

  constructor(seedName?: string, customSeed?: number) {
    // Load terrain from seed or create default
    if (seedName && MAP_SEEDS[seedName]) {
      const result = loadMapSeed(seedName);
      if (result) {
        this.terrainSystem = result.terrain;
      } else {
        // Fallback to default
        this.terrainSystem = new TerrainSystem(1024, 1024, customSeed || Date.now());
      }
    } else {
      // Create default terrain
      this.terrainSystem = new TerrainSystem(1024, 1024, customSeed || Date.now());
      // Generate default spec
      const defaultSpec = {
        seed: customSeed || Date.now(),
        size: 1024,
        biomes: { neon_plains: 0.5, crater: 0.3, lava: 0.2 },
        resourceClusters: 4,
        chokepoints: 3,
        objectives: 2,
        dynamicAnomalies: [],
        specialFeatures: [],
        startingPositions: [[128, 512], [896, 512]]
      };
      this.terrainSystem.generateFromSpec(defaultSpec);
    }
    
    // Initialize integrations
    this.techIntegration = new TerrainTechIntegration(this.terrainSystem);
    this.aiSystem = new TerrainAwareAI(this.terrainSystem);
  }

  /**
   * Initialize terrain rendering in Phaser scene
   */
  public initializeRendering(scene: Phaser.Scene, tileSize: number = 32): void {
    this.scene = scene;
    this.terrainRenderer = new TerrainRenderer(scene, this.terrainSystem, tileSize);
  }

  /**
   * Update terrain (call every frame)
   */
  public update(gameTime: number): void {
    this.terrainSystem.updateDynamicAnomalies(gameTime);
    if (this.terrainRenderer) {
      this.terrainRenderer.update(gameTime);
    }
  }

  /**
   * Get available map seeds
   */
  public static getAvailableSeeds(): Array<{ name: string; description: string; tacticalProfile: string }> {
    return Object.values(MAP_SEEDS).map(seed => ({
      name: seed.name,
      description: seed.description,
      tacticalProfile: seed.tacticalProfile
    }));
  }

  /**
   * Check if tech is available based on terrain
   */
  public isTechAvailable(techId: string, playerId: number, gameTime: number) {
    return this.techIntegration.isTechAvailable(techId, playerId, gameTime);
  }

  /**
   * Register tile control
   */
  public registerTileControl(x: number, y: number, playerId: number, gameTime: number): void {
    this.techIntegration.registerTileControl(x, y, playerId, gameTime);
  }

  /**
   * Get tile at world position
   */
  public getTileAtWorldPosition(worldX: number, worldY: number) {
    if (this.terrainRenderer) {
      return this.terrainRenderer.getTileAtWorldPosition(worldX, worldY);
    }
    return null;
  }

  /**
   * Get movement cost for path
   */
  public getMovementCost(fromX: number, fromY: number, toX: number, toY: number): number {
    // Convert world coordinates to tile coordinates
    const tileSize = this.terrainRenderer?.tileSize || 32;
    const fromTileX = Math.floor(fromX / tileSize);
    const fromTileY = Math.floor(fromY / tileSize);
    const toTileX = Math.floor(toX / tileSize);
    const toTileY = Math.floor(toY / tileSize);
    
    return this.terrainSystem.getMovementCost(fromTileX, fromTileY, toTileX, toTileY);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.terrainRenderer) {
      this.terrainRenderer.destroy();
    }
  }
}


