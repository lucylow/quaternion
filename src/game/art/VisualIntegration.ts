/**
 * Visual Integration System
 * Connects visual effects with game state (resources, instability, etc.)
 */

import { VisualEffects } from './VisualEffects';
import { ProceduralFloraPlacer } from './ProceduralFlora';
import { QuaternionArtPalette } from './ArtPalette';
import type { QuaternionGameState } from '@/game/QuaternionGameState';

export interface VisualState {
  instability: number; // 0-1
  resources: {
    matter?: number;
    energy?: number;
    life?: number;
    knowledge?: number;
  };
  dominance: 'matter' | 'energy' | 'life' | 'knowledge' | 'neutral';
  tension: number; // 0-1
}

export class VisualIntegration {
  private visualEffects: VisualEffects;
  private floraPlacer: ProceduralFloraPlacer;
  private activeVeins: Map<string, any> = new Map();
  private currentPalette: ReturnType<typeof QuaternionArtPalette.getPalette>;

  constructor(
    private scene: Phaser.Scene,
    private gameState?: QuaternionGameState
  ) {
    this.visualEffects = new VisualEffects(scene);
    this.floraPlacer = new ProceduralFloraPlacer(scene);
    this.currentPalette = QuaternionArtPalette.NEUTRAL;
  }

  /**
   * Update visuals based on game state
   */
  updateVisuals(state: VisualState): void {
    // Update palette based on dominance
    this.currentPalette = QuaternionArtPalette.getPalette(state.dominance);

    // Update vein intensities based on instability
    this.updateVeinIntensities(state.instability);

    // Spawn particle effects on high instability
    if (state.instability > 0.6) {
      this.triggerInstabilityEffects(state);
    }

    // Update flora based on resources
    this.updateFlora(state.resources);

    // Update background color based on dominance
    this.updateBackgroundColor(state.dominance);
  }

  /**
   * Update vein effect intensities
   */
  private updateVeinIntensities(instability: number): void {
    // Scale vein intensity with instability
    const intensity = Math.min(1, instability * 1.5);
    
    // Could update existing veins here if we track them
    // For now, veins are created per-tile as needed
  }

  /**
   * Create vein effect on a tile
   */
  createTileVeinEffect(
    tileX: number,
    tileY: number,
    tileSize: number,
    resourceType: 'matter' | 'energy' | 'life' | 'knowledge',
    instability: number = 0
  ): void {
    const palette = QuaternionArtPalette.getPalette(resourceType);
    const color = QuaternionArtPalette.toPhaserColor(palette.emissive);
    const key = `${tileX},${tileY}`;

    // Remove existing vein if present
    if (this.activeVeins.has(key)) {
      const existing = this.activeVeins.get(key);
      if (existing._updateTimer) {
        existing._updateTimer.remove();
      }
      existing.destroy();
    }

    // Create new vein effect
    const vein = this.visualEffects.createVeinEffect(
      tileX * tileSize,
      tileY * tileSize,
      {
        intensity: 0.3 + instability * 0.7,
        flowSpeed: 10 + instability * 20,
        color,
        tileSize
      }
    );

    this.activeVeins.set(key, vein);
  }

  /**
   * Trigger instability effects
   */
  private triggerInstabilityEffects(state: VisualState): void {
    // Random chance to spawn particle effect
    if (Math.random() < 0.01) { // 1% chance per frame
      const dominant = state.dominance;
      
      // Find a random position on screen
      const x = Math.random() * this.scene.scale.width;
      const y = Math.random() * this.scene.scale.height;

      this.visualEffects.spawnParticleEffect({
        position: { x, y },
        type: dominant === 'neutral' ? 'energy' : dominant,
        intensity: state.instability,
        duration: 2000
      });
    }
  }

  /**
   * Update flora based on resources
   */
  private updateFlora(resources: VisualState['resources']): void {
    // Flora placement would be handled during map generation
    // This could trigger flora updates based on resource changes
  }

  /**
   * Update background color
   */
  private updateBackgroundColor(dominance: 'matter' | 'energy' | 'life' | 'knowledge' | 'neutral'): void {
    const palette = QuaternionArtPalette.getPalette(dominance);
    const bgColor = QuaternionArtPalette.toPhaserColor(palette.dark);
    
    // Set camera background color
    this.scene.cameras.main.setBackgroundColor(bgColor);
  }

  /**
   * Create AI thought visualization at position
   */
  createAIThoughtVisual(
    x: number,
    y: number,
    type: 'matter' | 'energy' | 'life' | 'knowledge'
  ): Phaser.GameObjects.Graphics {
    return this.visualEffects.createAIThoughtVisual(x, y, type);
  }

  /**
   * Place procedural flora
   */
  placeFlora(
    x: number,
    y: number,
    width: number,
    height: number,
    biome: 'desert' | 'forest' | 'plains' | 'tech',
    seed: number
  ) {
    return this.floraPlacer.placeByBiome(x, y, width, height, biome, seed);
  }

  /**
   * Create dissolve/corrupt effect
   */
  dissolveObject(
    target: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    duration: number = 1000
  ): Phaser.Tweens.Tween {
    return this.visualEffects.createDissolveEffect(target, duration);
  }

  /**
   * Get current palette
   */
  getCurrentPalette(): ReturnType<typeof QuaternionArtPalette.getPalette> {
    return this.currentPalette;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    // Cleanup all veins
    this.activeVeins.forEach(vein => {
      if (vein._updateTimer) {
        vein._updateTimer.remove();
      }
      vein.destroy();
    });
    this.activeVeins.clear();

    // Cleanup effects
    this.visualEffects.cleanup();
    this.floraPlacer.cleanup();
  }
}

