/**
 * Visual Effects System for Quaternion
 * Phaser-based visual effects, shaders, and animations
 */

import Phaser from 'phaser';
import type { Scene } from 'phaser';
import { QuaternionArtPalette } from './ArtPalette';

export interface VeinEffectConfig {
  intensity: number; // 0-1
  flowSpeed: number; // pixels per second
  color: number; // Phaser color integer
  tileSize: number;
}

export interface ParticleEffectConfig {
  position: { x: number; y: number };
  type: 'lava' | 'bio' | 'energy' | 'matter';
  intensity: number; // 0-1
  duration?: number; // milliseconds
}

export class VisualEffects {
  private scene: Phaser.Scene;
  private veinGraphics: Phaser.GameObjects.Graphics;
  private particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private overlays: Phaser.GameObjects.Graphics[] = [];
  private animationTweens: Phaser.Tweens.Tween[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
    this.veinGraphics = scene.add.graphics();
    this.veinGraphics.setDepth(10);

    // Create particle manager
    this.particleManager = scene.add.particles(0, 0, 'particle', {
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 20, max: 50 },
      lifespan: 1000,
      frequency: -1 // Don't auto-emit
    });
    this.particleManager.setDepth(20);
  }

  /**
   * Create emissive veins effect on tiles
   */
  createVeinEffect(
    x: number,
    y: number,
    config: VeinEffectConfig
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(5);

    // Draw vein pattern using sine waves
    const drawVeins = () => {
      graphics.clear();
      const time = this.scene.time.now / 1000;
      const offset = (time * config.flowSpeed) % (config.tileSize * 2);

      graphics.lineStyle(2, config.color, config.intensity);
      
      // Draw flowing veins
      const numVeins = 3;
      for (let i = 0; i < numVeins; i++) {
        const phase = (i / numVeins) * Math.PI * 2;
        const path: Phaser.Geom.Point[] = [];
        
        for (let px = 0; px < config.tileSize; px += 2) {
          const py = Math.sin((px + offset) * 0.1 + phase) * (config.tileSize * 0.3) + (config.tileSize / 2);
          path.push(new Phaser.Geom.Point(x + px, y + py));
        }

        if (path.length > 1) {
          graphics.strokePoints(path);
        }
      }

      // Add glow effect
      graphics.lineStyle(4, config.color, config.intensity * 0.5);
      for (let i = 0; i < numVeins; i++) {
        const phase = (i / numVeins) * Math.PI * 2;
        const path: Phaser.Geom.Point[] = [];
        
        for (let px = 0; px < config.tileSize; px += 2) {
          const py = Math.sin((px + offset) * 0.1 + phase) * (config.tileSize * 0.3) + (config.tileSize / 2);
          path.push(new Phaser.Geom.Point(x + px, y + py));
        }

        if (path.length > 1) {
          graphics.strokePoints(path);
        }
      }
    };

    // Update every frame
    const updateTimer = this.scene.time.addEvent({
      delay: 16, // ~60fps
      callback: drawVeins,
      loop: true
    });

    // Store reference for cleanup
    (graphics as any)._updateTimer = updateTimer;

    drawVeins();
    this.overlays.push(graphics);

    return graphics;
  }

  /**
   * Create flowing lava effect
   */
  createLavaEffect(
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number = 1.0
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(6);

    const palette = QuaternionArtPalette.ENERGY;
    const color = QuaternionArtPalette.toPhaserColor(palette.emissive);

    const drawLava = () => {
      graphics.clear();
      const time = this.scene.time.now / 1000;

      // Base lava
      graphics.fillStyle(color, 0.8 * intensity);
      graphics.fillRect(x, y, width, height);

      // Flowing patterns
      graphics.lineStyle(3, color, intensity);
      for (let i = 0; i < 5; i++) {
        const offset = (time * 30 + i * 50) % (height * 2);
        const path: Phaser.Geom.Point[] = [];
        
        for (let py = 0; py < height; py += 2) {
          const px = Math.sin((py + offset) * 0.15) * (width * 0.2) + (width / 2);
          path.push(new Phaser.Geom.Point(x + px, y + py));
        }

        if (path.length > 1) {
          graphics.strokePoints(path);
        }
      }

      // Bubbles
      const bubbleColor = QuaternionArtPalette.toPhaserColor(palette.light);
      for (let i = 0; i < 3; i++) {
        const bx = x + (width * (0.3 + i * 0.2));
        const by = y + height - ((time * 20 + i * 100) % height);
        const bubbleSize = 3 + Math.sin(time * 2 + i) * 2;
        
        graphics.fillStyle(bubbleColor, 0.6 * intensity);
        graphics.fillCircle(bx, by, bubbleSize);
      }
    };

    const updateTimer = this.scene.time.addEvent({
      delay: 16,
      callback: drawLava,
      loop: true
    });

    (graphics as any)._updateTimer = updateTimer;
    drawLava();
    this.overlays.push(graphics);

    return graphics;
  }

  /**
   * Spawn particle effect
   */
  spawnParticleEffect(config: ParticleEffectConfig): Phaser.GameObjects.Particles.ParticleEmitter {
    const palette = QuaternionArtPalette.getPalette(config.type);
    const color = QuaternionArtPalette.toPhaserColor(palette.emissive);
    const accentColor = QuaternionArtPalette.toPhaserColor(palette.accent);

    let emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;

    switch (config.type) {
      case 'lava':
        emitterConfig = {
          x: config.position.x,
          y: config.position.y,
          scale: { start: 0.5 * config.intensity, end: 0 },
          alpha: { start: 1, end: 0 },
          speed: { min: 30, max: 80 * config.intensity },
          angle: { min: 0, max: 360 },
          lifespan: 1000 * config.intensity,
          tint: [color, accentColor],
          frequency: 50 / config.intensity,
          quantity: Math.floor(3 * config.intensity)
        };
        break;

      case 'bio':
        emitterConfig = {
          x: config.position.x,
          y: config.position.y,
          scale: { start: 0.3 * config.intensity, end: 0 },
          alpha: { start: 0.8, end: 0 },
          speed: { min: 10, max: 40 * config.intensity },
          angle: { min: 270 - 30, max: 270 + 30 }, // Upward
          lifespan: 2000 * config.intensity,
          tint: [color, accentColor],
          frequency: 100 / config.intensity,
          quantity: Math.floor(2 * config.intensity)
        };
        break;

      case 'energy':
        emitterConfig = {
          x: config.position.x,
          y: config.position.y,
          scale: { start: 0.4 * config.intensity, end: 0 },
          alpha: { start: 1, end: 0 },
          speed: { min: 50, max: 150 * config.intensity },
          angle: { min: 0, max: 360 },
          lifespan: 500 * config.intensity,
          tint: [color, accentColor],
          frequency: 30 / config.intensity,
          quantity: Math.floor(5 * config.intensity)
        };
        break;

      case 'matter':
        emitterConfig = {
          x: config.position.x,
          y: config.position.y,
          scale: { start: 0.6 * config.intensity, end: 0 },
          alpha: { start: 0.9, end: 0 },
          speed: { min: 20, max: 60 * config.intensity },
          angle: { min: 0, max: 360 },
          lifespan: 1500 * config.intensity,
          tint: [color, accentColor],
          frequency: 60 / config.intensity,
          quantity: Math.floor(2 * config.intensity)
        };
        break;
    }

    const emitter = this.particleManager.createEmitter(emitterConfig);

    // Auto-remove after duration
    if (config.duration) {
      this.scene.time.delayedCall(config.duration, () => {
        emitter.stop();
        emitter.remove();
      });
    }

    return emitter;
  }

  /**
   * Create dissolve/corrupt effect
   */
  createDissolveEffect(
    target: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    duration: number = 1000
  ): Phaser.Tweens.Tween {
    const tween = this.scene.tweens.add({
      targets: target,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        target.setAlpha(0);
        target.setScale(1);
      }
    });

    this.animationTweens.push(tween);
    return tween;
  }

  /**
   * Create AI thought visualization (L-system fractal)
   */
  createAIThoughtVisual(
    x: number,
    y: number,
    palette: 'matter' | 'energy' | 'life' | 'knowledge'
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(15);

    const artPalette = QuaternionArtPalette.getPalette(palette);
    const color = QuaternionArtPalette.toPhaserColor(artPalette.emissive);

    // Simple L-system fractal pattern
    const drawFractal = () => {
      graphics.clear();
      const time = this.scene.time.now / 1000;
      const pulse = (Math.sin(time * 2) + 1) / 2;

      graphics.lineStyle(1 + pulse * 2, color, 0.6 + pulse * 0.4);

      // Draw branching pattern
      const drawBranch = (
        startX: number,
        startY: number,
        angle: number,
        length: number,
        depth: number,
        maxDepth: number = 3
      ) => {
        if (depth > maxDepth || length < 2) return;

        const endX = startX + Math.cos(angle) * length;
        const endY = startY + Math.sin(angle) * length;

        graphics.lineBetween(startX, startY, endX, endY);

        // Recursive branches
        const branchAngle = 0.5;
        const branchLength = length * 0.7;
        
        drawBranch(endX, endY, angle - branchAngle, branchLength, depth + 1, maxDepth);
        drawBranch(endX, endY, angle + branchAngle, branchLength, depth + 1, maxDepth);
      };

      // Start with main branch
      const baseLength = 30 + pulse * 10;
      drawBranch(x, y, -Math.PI / 2, baseLength, 0, 3);
    };

    const updateTimer = this.scene.time.addEvent({
      delay: 50,
      callback: drawFractal,
      loop: true
    });

    (graphics as any)._updateTimer = updateTimer;
    drawFractal();

    return graphics;
  }

  /**
   * Cleanup all effects
   */
  cleanup(): void {
    // Stop all timers
    this.overlays.forEach(overlay => {
      if ((overlay as any)._updateTimer) {
        (overlay as any)._updateTimer.remove();
      }
      overlay.destroy();
    });

    // Stop all tweens
    this.animationTweens.forEach(tween => {
      if (tween.isPlaying()) {
        tween.stop();
      }
    });

    // Destroy particle manager
    this.particleManager.destroy();

    // Clear arrays
    this.overlays = [];
    this.animationTweens = [];
  }
}

