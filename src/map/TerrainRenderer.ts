/**
 * Terrain Renderer for Phaser
 * Renders terrain tiles, chokepoints, high ground, and dynamic anomalies
 */

import { TerrainSystem, Tile, DynamicAnomaly } from './TerrainSystem';
import Phaser from 'phaser';

export class TerrainRenderer {
  private scene: Phaser.Scene;
  private terrainSystem: TerrainSystem;
  private tileGraphics: Phaser.GameObjects.Graphics;
  private overlayGraphics: Phaser.GameObjects.Graphics;
  public tileSize: number = 32; // pixels per tile
  private showStrategicOverlay: boolean = false;

  constructor(scene: Phaser.Scene, terrainSystem: TerrainSystem, tileSize: number = 32) {
    this.scene = scene;
    this.terrainSystem = terrainSystem;
    this.tileSize = tileSize;
    
    // Create graphics layers
    this.tileGraphics = scene.add.graphics();
    this.tileGraphics.setDepth(-500);
    
    this.overlayGraphics = scene.add.graphics();
    this.overlayGraphics.setDepth(-400);
    
    this.renderTerrain();
  }

  /**
   * Render all terrain tiles
   */
  public renderTerrain(): void {
    this.tileGraphics.clear();
    this.overlayGraphics.clear();
    
    const tiles = this.terrainSystem.getAllTiles();
    
    for (const tile of tiles) {
      this.renderTile(tile);
    }
    
    // Render chokepoints
    this.renderChokepoints();
    
    // Render high ground
    this.renderHighGround();
    
    // Render dynamic anomalies
    this.renderDynamicAnomalies();
    
    // Render strategic overlay if enabled
    if (this.showStrategicOverlay) {
      this.renderStrategicOverlay();
    }
  }

  /**
   * Render a single tile
   */
  private renderTile(tile: Tile): void {
    const x = tile.x * this.tileSize;
    const y = tile.y * this.tileSize;
    
    // Base color based on biome
    const color = this.getBiomeColor(tile.biome);
    const alpha = 0.3 + (tile.elevation / 100) * 0.2;
    
    // Draw tile
    this.tileGraphics.fillStyle(color, alpha);
    this.tileGraphics.fillRect(x, y, this.tileSize, this.tileSize);
    
    // Draw elevation (darker = higher)
    if (tile.elevation > 20) {
      this.tileGraphics.fillStyle(0xffffff, 0.1);
      this.tileGraphics.fillRect(x, y, this.tileSize, this.tileSize);
    } else if (tile.elevation < -20) {
      this.tileGraphics.fillStyle(0x000000, 0.1);
      this.tileGraphics.fillRect(x, y, this.tileSize, this.tileSize);
    }
    
    // Draw resource indicator
    if (tile.resourceType) {
      const resourceColor = this.getResourceColor(tile.resourceType);
      this.tileGraphics.fillStyle(resourceColor, 0.6);
      this.tileGraphics.fillCircle(x + this.tileSize / 2, y + this.tileSize / 2, 4);
    }
    
    // Draw feature indicator
    if (tile.feature) {
      this.drawFeatureIndicator(x, y, tile.feature);
    }
  }

  /**
   * Get biome color
   */
  private getBiomeColor(biome: string): number {
    switch (biome) {
      case 'neon_plains': return 0x00ffea;
      case 'crater': return 0x444444;
      case 'lava': return 0xff4400;
      case 'swamp': return 0x2d5016;
      case 'forest': return 0x1a5c1a;
      case 'crystal': return 0x9d4edd;
      case 'void': return 0x000000;
      default: return 0x333333;
    }
  }

  /**
   * Get resource color
   */
  private getResourceColor(resourceType: string): number {
    switch (resourceType) {
      case 'ore': return 0x4a90e2;
      case 'crystals': return 0xffd700;
      case 'biomass': return 0x50c878;
      case 'data_nodes': return 0x9d4edd;
      default: return 0xffffff;
    }
  }

  /**
   * Draw feature indicator
   */
  private drawFeatureIndicator(x: number, y: number, feature: string): void {
    const centerX = x + this.tileSize / 2;
    const centerY = y + this.tileSize / 2;
    
    switch (feature) {
      case 'chokepoint':
        this.overlayGraphics.lineStyle(2, 0xff0000, 0.8);
        this.overlayGraphics.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        break;
        
      case 'high_ground':
        this.overlayGraphics.fillStyle(0xffff00, 0.3);
        this.overlayGraphics.fillCircle(centerX, centerY, 6);
        break;
        
      case 'bridge':
        this.overlayGraphics.lineStyle(2, 0x00ffff, 0.6);
        this.overlayGraphics.lineBetween(x, centerY, x + this.tileSize, centerY);
        break;
        
      case 'objective':
        this.overlayGraphics.fillStyle(0x00ff00, 0.5);
        this.overlayGraphics.fillCircle(centerX, centerY, 8);
        break;
    }
  }

  /**
   * Render chokepoints
   */
  private renderChokepoints(): void {
    const chokepoints = this.terrainSystem.getChokepoints();
    
    for (const chokepoint of chokepoints) {
      const x = chokepoint.x * this.tileSize;
      const y = chokepoint.y * this.tileSize;
      const width = chokepoint.width * this.tileSize;
      
      this.overlayGraphics.lineStyle(3, 0xff0000, 0.6);
      this.overlayGraphics.strokeRect(x - width / 2, y - this.tileSize / 2, width, this.tileSize);
    }
  }

  /**
   * Render high ground
   */
  private renderHighGround(): void {
    const highGrounds = this.terrainSystem.getHighGrounds();
    
    for (const highGround of highGrounds) {
      const x = highGround.x * this.tileSize;
      const y = highGround.y * this.tileSize;
      const radius = highGround.radius * this.tileSize;
      
      this.overlayGraphics.lineStyle(2, 0xffff00, 0.4);
      this.overlayGraphics.strokeCircle(x, y, radius);
    }
  }

  /**
   * Render dynamic anomalies
   */
  private renderDynamicAnomalies(): void {
    const anomalies = this.terrainSystem.getActiveAnomalies();
    
    for (const anomaly of anomalies) {
      const x = anomaly.x * this.tileSize;
      const y = anomaly.y * this.tileSize;
      const radius = anomaly.radius * this.tileSize;
      
      // Color based on type
      let color = 0xff0000;
      switch (anomaly.type) {
        case 'lava_vent': color = 0xff4400; break;
        case 'storm': color = 0x4444ff; break;
        case 'sensor_jamming': color = 0x8800ff; break;
        case 'quantum_fracture': color = 0x00ffff; break;
        case 'resource_flux': color = 0x00ff00; break;
      }
      
      // Pulsing effect
      const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;
      
      this.overlayGraphics.fillStyle(color, 0.3 * pulse);
      this.overlayGraphics.fillCircle(x, y, radius);
      
      this.overlayGraphics.lineStyle(2, color, 0.8 * pulse);
      this.overlayGraphics.strokeCircle(x, y, radius);
      
      // Draw countdown if applicable
      if (anomaly.endTime) {
        const timeRemaining = Math.max(0, anomaly.endTime - (this.scene.time.now / 1000));
        if (timeRemaining > 0 && timeRemaining < 10) {
          // Show countdown text (would need text object for this)
        }
      }
    }
  }

  /**
   * Render strategic overlay (heatmap)
   */
  private renderStrategicOverlay(): void {
    const tiles = this.terrainSystem.getAllTiles();
    
    for (const tile of tiles) {
      const x = tile.x * this.tileSize;
      const y = tile.y * this.tileSize;
      const value = tile.strategicValue / 100;
      
      // Color based on strategic value
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x000000),
        Phaser.Display.Color.ValueToColor(0x00ff00),
        100,
        value * 100
      );
      
      this.overlayGraphics.fillStyle(
        Phaser.Display.Color.GetColor(color.r, color.g, color.b),
        0.3
      );
      this.overlayGraphics.fillRect(x, y, this.tileSize, this.tileSize);
    }
  }

  /**
   * Toggle strategic overlay
   */
  public toggleStrategicOverlay(): void {
    this.showStrategicOverlay = !this.showStrategicOverlay;
    this.renderTerrain();
  }

  /**
   * Update dynamic anomalies (call every frame)
   */
  public update(gameTime: number): void {
    this.terrainSystem.updateDynamicAnomalies(gameTime);
    this.renderDynamicAnomalies();
  }

  /**
   * Get tile at world position
   */
  public getTileAtWorldPosition(worldX: number, worldY: number): Tile | undefined {
    const tileX = Math.floor(worldX / this.tileSize);
    const tileY = Math.floor(worldY / this.tileSize);
    return this.terrainSystem.getTile(tileX, tileY);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.tileGraphics.destroy();
    this.overlayGraphics.destroy();
  }
}

