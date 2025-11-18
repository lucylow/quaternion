/**
 * Neo-Biotech Planet Graphics System
 * Implements the "Neo-Biotech Planet" visual identity with bioluminescent terrain,
 * dynamic lighting, faction color shifts, and cinematic effects
 */

import Phaser from 'phaser';
import type { Scene } from 'phaser';
import { QuaternionArtPalette } from './ArtPalette';
import { VisualEffects } from './VisualEffects';

export interface FactionColors {
  quaternion: {
    primary: number; // Phaser color
    glow: number;
    emissive: number;
  };
  corp: {
    primary: number;
    glow: number;
    emissive: number;
  };
}

export interface WorldStabilityState {
  stability: number; // 0-1, where 0 = chaos, 1 = balance
  factionBlend: number; // 0-1, where 0 = Quaternion, 1 = Corp
  pulseIntensity: number; // 0-1
}

export class NeoBiotechGraphics {
  private scene: Phaser.Scene;
  private visualEffects: VisualEffects;
  
  // Faction colors - Neo-Biotech palette
  public factionColors: FactionColors;
  
  // Dynamic lighting
  private ambientLight: Phaser.GameObjects.Graphics | null = null;
  private lightTween: Phaser.Tweens.Tween | null = null;
  
  // World pulse system
  private worldPulseEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private pulseGraphics: Phaser.GameObjects.Graphics | null = null;
  
  // Current world state
  private worldState: WorldStabilityState = {
    stability: 0.5,
    factionBlend: 0.5,
    pulseIntensity: 0.5
  };

  constructor(scene: Phaser.Scene, visualEffects: VisualEffects) {
    this.scene = scene;
    this.visualEffects = visualEffects;
    
    // Initialize Neo-Biotech faction colors
    this.factionColors = {
      quaternion: {
        primary: Phaser.Display.Color.GetColor(125, 249, 182), // Chroma Neon #7DF9B6
        glow: Phaser.Display.Color.GetColor(15, 58, 58), // Deep Teal #0F3A3A
        emissive: Phaser.Display.Color.GetColor(125, 249, 182) // Chroma Neon
      },
      corp: {
        primary: Phaser.Display.Color.GetColor(255, 211, 107), // Reactor Gold #FFD36B
        glow: Phaser.Display.Color.GetColor(255, 123, 169), // Soft Pink #FF7BA9
        emissive: Phaser.Display.Color.GetColor(255, 211, 107) // Reactor Gold
      }
    };

    this.initializeSystems();
  }

  /**
   * Initialize all graphics systems
   */
  private initializeSystems(): void {
    this.createAmbientLighting();
    this.createWorldPulseSystem();
  }

  /**
   * Create ambient lighting system that responds to world stability
   */
  private createAmbientLighting(): void {
    this.ambientLight = this.scene.add.graphics();
    this.ambientLight.setDepth(-1000);
    this.ambientLight.setScrollFactor(0); // Fixed to camera
    this.updateAmbientLight();
  }

  /**
   * Update ambient lighting based on world stability
   */
  private updateAmbientLight(): void {
    if (!this.ambientLight) return;

    const { stability, factionBlend } = this.worldState;
    
    // Blend between Quaternion (teal) and Corp (orange) based on faction control
    const quaternionColor = Phaser.Display.Color.IntegerToColor(this.factionColors.quaternion.primary);
    const corpColor = Phaser.Display.Color.IntegerToColor(this.factionColors.corp.primary);
    
    const blendedColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      quaternionColor,
      corpColor,
      100,
      Math.floor(factionBlend * 100)
    );

    // Adjust intensity based on stability (chaos = brighter/more intense)
    const intensity = 0.3 + (1 - stability) * 0.4;
    const alpha = intensity * 0.15; // Subtle overlay

    this.ambientLight.clear();
    this.ambientLight.fillStyle(blendedColor.color, alpha);
    this.ambientLight.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
  }

  /**
   * Create world pulse particle system
   */
  private createWorldPulseSystem(): void {
    // Create particle emitter for bioluminescent motes
    const particleManager = this.scene.add.particles(0, 0, 'particle', {
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.6, end: 0 },
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      lifespan: 2000,
      frequency: 100,
      tint: this.factionColors.quaternion.emissive
    });
    particleManager.setDepth(5);
    
    this.worldPulseEmitter = particleManager.createEmitter({
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.6, end: 0 },
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      lifespan: 2000,
      frequency: 100,
      tint: this.factionColors.quaternion.emissive
    });

    // Create pulse graphics for terrain veins
    this.pulseGraphics = this.scene.add.graphics();
    this.pulseGraphics.setDepth(4);
  }

  /**
   * Update world pulse based on instability
   */
  private updateWorldPulse(): void {
    if (!this.worldPulseEmitter || !this.pulseGraphics) return;

    const { pulseIntensity, factionBlend } = this.worldState;
    
    // Update particle emission rate based on pulse intensity
    const baseRate = 2;
    const emissionRate = baseRate + pulseIntensity * 10;
    
    this.worldPulseEmitter.setFrequency(1000 / emissionRate);

      // Blend particle color based on faction control
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(this.factionColors.quaternion.emissive),
        Phaser.Display.Color.IntegerToColor(this.factionColors.corp.emissive),
        100,
        Math.floor(factionBlend * 100)
      );
    
    this.worldPulseEmitter.setTint(color.color);
  }

  /**
   * Create bioluminescent terrain veins on a tile
   */
  createBioluminescentVeins(
    x: number,
    y: number,
    tileSize: number,
    intensity: number = 1.0
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(3);

    const { factionBlend, pulseIntensity } = this.worldState;
    const pulseSpeed = 1.0 + pulseIntensity * 2.0;

    const drawVeins = () => {
      graphics.clear();
      const time = this.scene.time.now / 1000;
      const pulse = (Math.sin(time * pulseSpeed) + 1) / 2;

      // Blend colors based on faction control
      const quaternionColor = this.factionColors.quaternion.emissive;
      const corpColor = this.factionColors.corp.emissive;
      const blendedColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(quaternionColor),
        Phaser.Display.Color.IntegerToColor(corpColor),
        100,
        Math.floor(factionBlend * 100)
      );

      const veinIntensity = intensity * (0.5 + pulse * 0.5);
      const color = blendedColor.color;

      // Draw main veins
      graphics.lineStyle(2, color, veinIntensity);
      
      const numVeins = 3;
      for (let i = 0; i < numVeins; i++) {
        const phase = (i / numVeins) * Math.PI * 2;
        const offset = (time * 30) % (tileSize * 2);
        const path: Phaser.Geom.Point[] = [];
        
        for (let px = 0; px < tileSize; px += 2) {
          const py = Math.sin((px + offset) * 0.1 + phase) * (tileSize * 0.3) + (tileSize / 2);
          path.push(new Phaser.Geom.Point(x + px, y + py));
        }

        if (path.length > 1) {
          graphics.strokePoints(path);
        }
      }

      // Add glow layer
      graphics.lineStyle(4, color, veinIntensity * 0.5);
      for (let i = 0; i < numVeins; i++) {
        const phase = (i / numVeins) * Math.PI * 2;
        const offset = (time * 30) % (tileSize * 2);
        const path: Phaser.Geom.Point[] = [];
        
        for (let px = 0; px < tileSize; px += 2) {
          const py = Math.sin((px + offset) * 0.1 + phase) * (tileSize * 0.3) + (tileSize / 2);
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

    (graphics as any)._updateTimer = updateTimer;
    drawVeins();

    return graphics;
  }

  /**
   * Update world state (called from game loop)
   */
  updateWorldState(state: Partial<WorldStabilityState>): void {
    this.worldState = {
      ...this.worldState,
      ...state
    };

    this.updateAmbientLight();
    this.updateWorldPulse();
  }

  /**
   * Trigger cinematic ultimate camera effect
   */
  triggerUltimateEffect(
    focusPoint: { x: number; y: number },
    duration: number = 2000,
    onComplete?: () => void
  ): void {
    const camera = this.scene.cameras.main;
    const originalZoom = camera.zoom;
    const originalX = camera.scrollX;
    const originalY = camera.scrollY;

    // Zoom in
    this.scene.tweens.add({
      targets: camera,
      zoom: originalZoom * 1.5,
      scrollX: focusPoint.x,
      scrollY: focusPoint.y,
      duration: duration * 0.3,
      ease: 'Power2'
    });

    // Create lens flare effect
    const flare = this.scene.add.graphics();
    flare.setDepth(1000);
    flare.setScrollFactor(0);

    const drawFlare = () => {
      flare.clear();
      const time = this.scene.time.now / 1000;
      const pulse = (Math.sin(time * 8) + 1) / 2;

      const centerX = this.scene.cameras.main.width / 2;
      const centerY = this.scene.cameras.main.height / 2;

      // Draw radial flare
      const gradient = this.scene.add.graphics();
      gradient.fillGradientStyle(
        this.factionColors.quaternion.emissive,
        this.factionColors.quaternion.emissive,
        this.factionColors.corp.emissive,
        this.factionColors.corp.emissive,
        0.3 * pulse
      );
      gradient.fillCircle(centerX, centerY, 50 * pulse);
      gradient.destroy();
    };

    const flareTimer = this.scene.time.addEvent({
      delay: 16,
      callback: drawFlare,
      loop: true,
      repeat: Math.floor(duration / 16)
    });

    // Zoom out and restore
    this.scene.time.delayedCall(duration * 0.7, () => {
      this.scene.tweens.add({
        targets: camera,
        zoom: originalZoom,
        scrollX: originalX,
        scrollY: originalY,
        duration: duration * 0.3,
        ease: 'Power2',
        onComplete: () => {
          flareTimer.remove();
          flare.destroy();
          if (onComplete) onComplete();
        }
      });
    });
  }

  /**
   * Create holographic UI panel effect
   */
  createHolographicPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = this.factionColors.quaternion.primary
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(100);
    graphics.setScrollFactor(0);

    const drawPanel = () => {
      graphics.clear();
      const time = this.scene.time.now / 1000;
      
      // Scanline effect
      const scanlineY = (time * 100) % height;
      const scanlineAlpha = 0.3;

      // Base panel with transparency
      graphics.fillStyle(color, 0.2);
      graphics.fillRect(x, y, width, height);

      // Border glow
      graphics.lineStyle(2, color, 0.6);
      graphics.strokeRect(x, y, width, height);

      // Scanline
      graphics.lineStyle(1, color, scanlineAlpha);
      graphics.lineBetween(x, y + scanlineY, x + width, y + scanlineY);

      // Corner accents
      const cornerSize = 10;
      graphics.lineStyle(2, color, 0.8);
      
      // Top-left
      graphics.lineBetween(x, y, x + cornerSize, y);
      graphics.lineBetween(x, y, x, y + cornerSize);
      
      // Top-right
      graphics.lineBetween(x + width - cornerSize, y, x + width, y);
      graphics.lineBetween(x + width, y, x + width, y + cornerSize);
      
      // Bottom-left
      graphics.lineBetween(x, y + height - cornerSize, x, y + height);
      graphics.lineBetween(x, y + height, x + cornerSize, y + height);
      
      // Bottom-right
      graphics.lineBetween(x + width - cornerSize, y + height, x + width, y + height);
      graphics.lineBetween(x + width, y + height - cornerSize, x + width, y + height);
    };

    const updateTimer = this.scene.time.addEvent({
      delay: 16,
      callback: drawPanel,
      loop: true
    });

    (graphics as any)._updateTimer = updateTimer;
    drawPanel();

    return graphics;
  }

  /**
   * Create UI glow pulse effect
   */
  createUIGlowPulse(
    target: Phaser.GameObjects.Image | Phaser.GameObjects.Container,
    color: number = this.factionColors.quaternion.emissive,
    speed: number = 3.0
  ): Phaser.Tweens.Tween {
    const originalAlpha = target.alpha;
    const amplitude = 0.2;

    return this.scene.tweens.add({
      targets: target,
      alpha: originalAlpha + amplitude,
      duration: 1000 / speed,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Get current faction color based on blend
   */
  getFactionColor(blend: number = this.worldState.factionBlend): number {
    return Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(this.factionColors.quaternion.primary),
      Phaser.Display.Color.IntegerToColor(this.factionColors.corp.primary),
      100,
      Math.floor(blend * 100)
    ).color;
  }

  /**
   * Cleanup all graphics systems
   */
  cleanup(): void {
    if (this.ambientLight) {
      this.ambientLight.destroy();
      this.ambientLight = null;
    }

    if (this.lightTween) {
      this.lightTween.stop();
      this.lightTween = null;
    }

    if (this.worldPulseEmitter) {
      this.worldPulseEmitter.stop();
      this.worldPulseEmitter = null;
    }

    if (this.pulseGraphics) {
      if ((this.pulseGraphics as any)._updateTimer) {
        (this.pulseGraphics as any)._updateTimer.remove();
      }
      this.pulseGraphics.destroy();
      this.pulseGraphics = null;
    }
  }

  /**
   * Get current world state
   */
  getWorldState(): WorldStabilityState {
    return { ...this.worldState };
  }
}

