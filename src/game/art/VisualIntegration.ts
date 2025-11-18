/**
 * Visual Integration System
 * Integrates all visual systems (Neo-Biotech graphics, lighting, effects)
 * with the game state
 */

import Phaser from 'phaser';
import type { Scene } from 'phaser';
import { NeoBiotechGraphics, type WorldStabilityState } from './NeoBiotechGraphics';
import { DynamicLightingController } from './DynamicLightingController';
import { VisualEffects } from './VisualEffects';
import type { QuaternionState } from '../strategic/QuaternionState';

export class VisualIntegration {
  private scene: Phaser.Scene;
  private graphics: NeoBiotechGraphics;
  private lighting: DynamicLightingController;
  private visualEffects: VisualEffects;
  
  // Terrain vein graphics cache
  private terrainVeins: Map<string, Phaser.GameObjects.Graphics> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.visualEffects = new VisualEffects(scene);
    this.graphics = new NeoBiotechGraphics(scene, this.visualEffects);
    this.lighting = new DynamicLightingController(scene, this.graphics);
  }

  /**
   * Update visual systems based on game state
   */
  update(deltaTime: number, gameState: QuaternionState): void {
    // Calculate world stability from quaternion state
    const worldState = this.calculateWorldState(gameState);
    
    // Update lighting
    this.lighting.update(deltaTime, worldState);
    
    // Update terrain veins based on faction control
    this.updateTerrainVeins(gameState);
  }

  /**
   * Calculate world stability state from quaternion game state
   */
  private calculateWorldState(gameState: QuaternionState): WorldStabilityState {
    // Calculate stability from balance
    // Perfect balance (all axes equal) = high stability
    const { w, x, y, z } = gameState;
    const total = Math.abs(w) + Math.abs(x) + Math.abs(y) + Math.abs(z);
    
    if (total === 0) {
      return {
        stability: 0.5,
        factionBlend: 0.5,
        pulseIntensity: 0.5
      };
    }

    // Calculate how balanced the state is
    const avg = total / 4;
    const variance = Math.sqrt(
      (Math.pow(Math.abs(w) - avg, 2) +
       Math.pow(Math.abs(x) - avg, 2) +
       Math.pow(Math.abs(y) - avg, 2) +
       Math.pow(Math.abs(z) - avg, 2)) / 4
    );
    
    // Lower variance = higher stability
    const stability = Math.max(0, Math.min(1, 1 - (variance / avg)));

    // Calculate faction blend
    // Quaternion = Life + Knowledge (y + z)
    // Corp = Matter + Energy (w + x)
    const quaternionPower = Math.abs(y) + Math.abs(z);
    const corpPower = Math.abs(w) + Math.abs(x);
    const totalPower = quaternionPower + corpPower;
    
    const factionBlend = totalPower > 0 ? corpPower / totalPower : 0.5;

    // Pulse intensity increases with instability
    const pulseIntensity = 1 - stability;

    return {
      stability,
      factionBlend,
      pulseIntensity
    };
  }

  /**
   * Update terrain veins based on faction control
   */
  private updateTerrainVeins(gameState: QuaternionState): void {
    // This would be called when terrain tiles change ownership
    // For now, it's a placeholder that would integrate with the terrain system
  }

  /**
   * Add bioluminescent veins to a terrain tile
   */
  addTerrainVeins(
    tileX: number,
    tileY: number,
    tileSize: number,
    intensity: number = 1.0
  ): void {
    const key = `${tileX}_${tileY}`;
    
    // Remove existing veins if any
    if (this.terrainVeins.has(key)) {
      const existing = this.terrainVeins.get(key)!;
      if ((existing as any)._updateTimer) {
        (existing as any)._updateTimer.remove();
      }
      existing.destroy();
    }

    // Create new veins
    const veins = this.graphics.createBioluminescentVeins(
      tileX * tileSize,
      tileY * tileSize,
      tileSize,
      intensity
    );

    this.terrainVeins.set(key, veins);
  }

  /**
   * Remove terrain veins from a tile
   */
  removeTerrainVeins(tileX: number, tileY: number): void {
    const key = `${tileX}_${tileY}`;
    const veins = this.terrainVeins.get(key);
    
    if (veins) {
      if ((veins as any)._updateTimer) {
        (veins as any)._updateTimer.remove();
      }
      veins.destroy();
      this.terrainVeins.delete(key);
    }
  }

  /**
   * Trigger ultimate ability cinematic effect
   */
  triggerUltimateEffect(
    focusPoint: { x: number; y: number },
    duration: number = 2000,
    onComplete?: () => void
  ): void {
    this.graphics.triggerUltimateEffect(focusPoint, duration, onComplete);
  }

  /**
   * Create holographic UI panel
   */
  createHolographicPanel(
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Graphics {
    return this.graphics.createHolographicPanel(x, y, width, height);
  }

  /**
   * Create UI glow pulse effect
   */
  createUIGlowPulse(
    target: Phaser.GameObjects.Image | Phaser.GameObjects.Container,
    speed: number = 3.0
  ): Phaser.Tweens.Tween {
    return this.graphics.createUIGlowPulse(target, undefined, speed);
  }

  /**
   * Get current faction color
   */
  getFactionColor(blend?: number): number {
    return this.graphics.getFactionColor(blend);
  }

  /**
   * Trigger dramatic lighting shift
   */
  triggerDramaticLightingShift(
    targetStability: number,
    duration: number = 1000,
    onComplete?: () => void
  ): void {
    this.lighting.triggerDramaticShift(targetStability, duration, onComplete);
  }

  /**
   * Cleanup all visual systems
   */
  cleanup(): void {
    // Cleanup terrain veins
    this.terrainVeins.forEach((veins) => {
      if ((veins as any)._updateTimer) {
        (veins as any)._updateTimer.remove();
      }
      veins.destroy();
    });
    this.terrainVeins.clear();

    // Cleanup graphics systems
    this.graphics.cleanup();
    this.visualEffects.cleanup();
  }

  /**
   * Get graphics system (for advanced usage)
   */
  getGraphics(): NeoBiotechGraphics {
    return this.graphics;
  }

  /**
   * Get lighting controller (for advanced usage)
   */
  getLighting(): DynamicLightingController {
    return this.lighting;
  }
}
