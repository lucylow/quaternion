/**
 * Dynamic Lighting Controller
 * Adapts lighting based on world stability and faction balance
 */

import Phaser from 'phaser';
import type { Scene } from 'phaser';
import { NeoBiotechGraphics, type WorldStabilityState } from './NeoBiotechGraphics';

export interface LightingGradient {
  calm: Phaser.Display.Color;
  tension: Phaser.Display.Color;
  chaos: Phaser.Display.Color;
}

export class DynamicLightingController {
  private scene: Phaser.Scene;
  private graphics: NeoBiotechGraphics;
  private transitionSpeed: number = 1.5;
  private targetStability: number = 0.5;
  private currentStability: number = 0.5;

  // Lighting gradient for stability states
  private gradient: LightingGradient = {
    calm: Phaser.Display.Color.HexStringToColor('#0F3A3A'), // Deep Teal
    tension: Phaser.Display.Color.HexStringToColor('#7DF9B6'), // Chroma Neon
    chaos: Phaser.Display.Color.HexStringToColor('#FF7BA9') // Soft Pink (chaos)
  };

  constructor(scene: Phaser.Scene, graphics: NeoBiotechGraphics) {
    this.scene = scene;
    this.graphics = graphics;
  }

  /**
   * Update lighting based on world state
   */
  update(deltaTime: number, worldState: WorldStabilityState): void {
    // Smoothly transition to target stability
    this.currentStability = Phaser.Math.Linear(
      this.currentStability,
      worldState.stability,
      deltaTime * this.transitionSpeed
    );

    // Update graphics system with current state
    this.graphics.updateWorldState({
      stability: this.currentStability,
      factionBlend: worldState.factionBlend,
      pulseIntensity: this.calculatePulseIntensity(this.currentStability)
    });

    // Update camera tint based on stability
    this.updateCameraTint(this.currentStability);
  }

  /**
   * Calculate pulse intensity based on stability
   * Lower stability = higher pulse (more chaotic)
   */
  private calculatePulseIntensity(stability: number): number {
    // Inverse relationship: chaos = high pulse
    return 1 - stability;
  }

  /**
   * Update camera tint to reflect world state
   */
  private updateCameraTint(stability: number): void {
    const camera = this.scene.cameras.main;
    
    // Interpolate between calm and chaos colors
    let color: Phaser.Display.Color;
    
    if (stability > 0.7) {
      // Calm state - teal
      color = this.gradient.calm;
    } else if (stability < 0.3) {
      // Chaos state - pink
      color = this.gradient.chaos;
    } else {
      // Tension state - blend between calm and chaos
      const t = (0.7 - stability) / 0.4; // 0-1 between 0.7 and 0.3
      color = Phaser.Display.Color.Interpolate.ColorWithColor(
        this.gradient.calm,
        this.gradient.chaos,
        100,
        Math.floor(t * 100)
      );
    }

    // Apply subtle tint (very light to not overwhelm)
    const tintIntensity = 0.05;
    camera.setTint(
      color.r * tintIntensity,
      color.g * tintIntensity,
      color.b * tintIntensity
    );
  }

  /**
   * Set target stability (for smooth transitions)
   */
  setTargetStability(stability: number): void {
    this.targetStability = Phaser.Math.Clamp(stability, 0, 1);
  }

  /**
   * Get current stability
   */
  getCurrentStability(): number {
    return this.currentStability;
  }

  /**
   * Trigger dramatic lighting shift (for events)
   */
  triggerDramaticShift(
    targetStability: number,
    duration: number = 1000,
    onComplete?: () => void
  ): void {
    const originalStability = this.currentStability;
    
    this.scene.tweens.add({
      targets: this,
      currentStability: targetStability,
      duration: duration,
      ease: 'Power2',
      onUpdate: () => {
        this.graphics.updateWorldState({
          stability: this.currentStability,
          pulseIntensity: this.calculatePulseIntensity(this.currentStability)
        });
        this.updateCameraTint(this.currentStability);
      },
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }
}

