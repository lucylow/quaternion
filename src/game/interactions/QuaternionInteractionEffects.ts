/**
 * Quaternion Interaction Effects System
 * Provides thematically consistent visual and audio feedback for all game interactions
 * Emphasizes the mathematical/quantum theme through quaternion rotations, axis-specific effects, and mathematical visualizations
 */

import Phaser from 'phaser';
import { AXIS_DESIGNS, getAxisDesign, hexToPhaserColor, QuaternionAxis } from '@/design/QuaternionDesignSystem';

export interface InteractionEffectConfig {
  position: { x: number; y: number };
  axis?: QuaternionAxis;
  intensity?: number;
  duration?: number;
  color?: number;
}

export class QuaternionInteractionEffects {
  private scene: Phaser.Scene;
  private particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private activeEffects: Set<Phaser.GameObjects.GameObject> = new Set();
  private quaternionRotationGraphics: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create particle texture if it doesn't exist
    if (!scene.textures.exists('quaternion_particle')) {
      const particleGraphics = scene.add.graphics();
      particleGraphics.fillStyle(0xffffff, 1);
      particleGraphics.fillCircle(0, 0, 3);
      particleGraphics.generateTexture('quaternion_particle', 6, 6);
      particleGraphics.destroy();
    }

    // Create particle manager
    this.particleManager = scene.add.particles(0, 0, 'quaternion_particle', {
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 20, max: 50 },
      lifespan: 1000,
      frequency: -1 // Don't auto-emit
    });
    this.particleManager.setDepth(200);
  }

  /**
   * Create quaternion rotation visualization for unit selection
   * Shows a rotating 4D quaternion representation
   */
  createQuaternionRotationEffect(
    x: number,
    y: number,
    axis: QuaternionAxis = 'matter',
    duration: number = 2000
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setDepth(150);
    
    const design = AXIS_DESIGNS[axis];
    const primaryColor = hexToPhaserColor(design.primary);
    const glowColor = hexToPhaserColor(design.glow);
    
    // Create quaternion rotation visualization (4 circles representing w, x, y, z components)
    const graphics = this.scene.add.graphics();
    
    // Outer ring (w component - scalar)
    graphics.lineStyle(2, primaryColor, 0.8);
    graphics.strokeCircle(0, 0, 30);
    
    // Three inner rings (x, y, z components - vector)
    const componentColors = [
      hexToPhaserColor(design.secondary),
      hexToPhaserColor(design.tertiary),
      glowColor
    ];
    
    componentColors.forEach((color, idx) => {
      const angle = (idx * 120) * (Math.PI / 180);
      const radius = 15;
      const cx = Math.cos(angle) * radius;
      const cy = Math.sin(angle) * radius;
      
      graphics.lineStyle(1.5, color, 0.7);
      graphics.strokeCircle(cx, cy, 8);
      
      // Add connecting lines to show quaternion structure
      graphics.lineStyle(1, color, 0.4);
      graphics.lineBetween(0, 0, cx, cy);
    });
    
    container.add(graphics);
    
    // Rotate the entire quaternion visualization
    this.scene.tweens.add({
      targets: container,
      angle: 360,
      duration: duration,
      ease: 'Linear',
      repeat: -1
    });
    
    // Pulsing glow effect
    this.scene.tweens.add({
      targets: graphics,
      alpha: { from: 0.6, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.activeEffects.add(container);
    
    // Auto-remove after duration
    this.scene.time.delayedCall(duration, () => {
      container.destroy();
      this.activeEffects.delete(container);
    });
    
    return container;
  }

  /**
   * Create quantum trail effect for unit movement
   * Shows a fading trail with quaternion-inspired particle effects
   */
  createQuantumTrail(
    unit: Phaser.GameObjects.GameObject,
    axis: QuaternionAxis = 'matter',
    trailLength: number = 20
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const design = AXIS_DESIGNS[axis];
    const particleColor = hexToPhaserColor(design.particle);
    
    const emitter = this.particleManager.createEmitter({
      follow: unit,
      followOffset: { x: 0, y: 0 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      lifespan: 500,
      tint: particleColor,
      frequency: 50,
      quantity: 2,
      blendMode: 'ADD'
    });
    
    this.activeEffects.add(emitter);
    return emitter;
  }

  /**
   * Create axis-specific resource gathering effect
   * Shows mathematical transformation visualization when gathering resources
   */
  createResourceGatherEffect(
    config: InteractionEffectConfig
  ): Phaser.GameObjects.Container {
    const { position, axis = 'matter', intensity = 1.0 } = config;
    const container = this.scene.add.container(position.x, position.y);
    container.setDepth(180);
    
    const design = AXIS_DESIGNS[axis];
    const primaryColor = hexToPhaserColor(design.primary);
    const glowColor = hexToPhaserColor(design.glow);
    
    // Create mathematical transformation visualization
    const graphics = this.scene.add.graphics();
    
    // Base circle representing the resource node
    graphics.lineStyle(2, primaryColor, 0.9);
    graphics.strokeCircle(0, 0, 20);
    
    // Spiral pattern showing resource extraction (quaternion rotation)
    for (let i = 0; i < 3; i++) {
      const angle = (i * 120) * (Math.PI / 180);
      const startRadius = 20;
      const endRadius = 35;
      
      graphics.lineStyle(1.5, glowColor, 0.7);
      graphics.beginPath();
      graphics.arc(0, 0, startRadius, angle, angle + Math.PI * 0.5);
      graphics.strokePath();
      
      // Arrow showing direction
      const arrowAngle = angle + Math.PI * 0.25;
      const arrowX = Math.cos(arrowAngle) * 27;
      const arrowY = Math.sin(arrowAngle) * 27;
      graphics.fillStyle(glowColor, 0.9);
      graphics.fillCircle(arrowX, arrowY, 3);
    }
    
    container.add(graphics);
    
    // Rotate and scale animation
    this.scene.tweens.add({
      targets: container,
      angle: 360,
      scaleX: { from: 1, to: 1.5 },
      scaleY: { from: 1, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 1000 * intensity,
      ease: 'Power2.easeOut',
      onComplete: () => {
        container.destroy();
        this.activeEffects.delete(container);
      }
    });
    
    // Create axis-specific particles
    this.createAxisParticles(position.x, position.y, axis, intensity);
    
    this.activeEffects.add(container);
    return container;
  }

  /**
   * Create axis-specific particle burst
   */
  createAxisParticles(
    x: number,
    y: number,
    axis: QuaternionAxis,
    intensity: number = 1.0
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const design = AXIS_DESIGNS[axis];
    const particleColor = hexToPhaserColor(design.particle);
    const config = design.particleConfig;
    
    const emitter = this.particleManager.createEmitter({
      x,
      y,
      scale: { 
        start: config.scale.start * intensity, 
        end: config.scale.end 
      },
      alpha: { start: 1, end: 0 },
      speed: { 
        min: config.speed.min * intensity, 
        max: config.speed.max * intensity 
      },
      angle: { min: 0, max: 360 },
      lifespan: config.lifespan * intensity,
      tint: particleColor,
      frequency: -1, // One-time burst
      quantity: Math.floor(config.quantity * intensity),
      blendMode: 'ADD'
    });
    
    // Emit once
    emitter.explode(config.quantity * intensity, x, y);
    
    // Auto-remove
    this.scene.time.delayedCall(config.lifespan, () => {
      emitter.destroy();
      this.activeEffects.delete(emitter);
    });
    
    this.activeEffects.add(emitter);
    return emitter;
  }

  /**
   * Create selection highlight with quaternion rotation
   */
  createSelectionHighlight(
    target: Phaser.GameObjects.GameObject,
    axis: QuaternionAxis = 'matter'
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    container.setDepth(140);
    
    const design = AXIS_DESIGNS[axis];
    const glowColor = hexToPhaserColor(design.glow);
    
    // Create rotating selection ring
    const ring = this.scene.add.graphics();
    ring.lineStyle(3, glowColor, 0.9);
    ring.strokeCircle(0, 0, 25);
    
    // Add quaternion component indicators
    const components = [
      { angle: 0, label: 'w' },
      { angle: 90, label: 'x' },
      { angle: 180, label: 'y' },
      { angle: 270, label: 'z' }
    ];
    
    components.forEach((comp, idx) => {
      const angle = (comp.angle * Math.PI) / 180;
      const x = Math.cos(angle) * 25;
      const y = Math.sin(angle) * 25;
      
      ring.fillStyle(glowColor, 0.8);
      ring.fillCircle(x, y, 3);
    });
    
    container.add(ring);
    
    // Make container follow the target
    if (target instanceof Phaser.GameObjects.Container) {
      container.setPosition(target.x, target.y);
    } else if ('x' in target && 'y' in target) {
      container.setPosition((target as any).x, (target as any).y);
    }
    
    // Rotate continuously
    this.scene.tweens.add({
      targets: container,
      angle: 360,
      duration: 2000,
      ease: 'Linear',
      repeat: -1
    });
    
    // Pulsing effect
    this.scene.tweens.add({
      targets: ring,
      alpha: { from: 0.6, to: 1 },
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 0.9, to: 1.1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.activeEffects.add(container);
    return container;
  }

  /**
   * Create command execution effect (move, attack, etc.)
   */
  createCommandEffect(
    position: { x: number; y: number },
    commandType: 'move' | 'attack' | 'patrol' | 'special',
    axis: QuaternionAxis = 'matter'
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(position.x, position.y);
    container.setDepth(160);
    
    const design = AXIS_DESIGNS[axis];
    const primaryColor = hexToPhaserColor(design.primary);
    const glowColor = hexToPhaserColor(design.glow);
    
    const graphics = this.scene.add.graphics();
    
    // Command-specific visualization
    switch (commandType) {
      case 'move':
        // Arrow with quaternion rotation
        graphics.lineStyle(3, primaryColor, 0.9);
        graphics.lineBetween(-15, 0, 15, 0);
        graphics.lineBetween(10, -5, 15, 0);
        graphics.lineBetween(10, 5, 15, 0);
        break;
        
      case 'attack':
        // Crosshair with energy effect
        graphics.lineStyle(2, glowColor, 0.9);
        graphics.lineBetween(-10, 0, 10, 0);
        graphics.lineBetween(0, -10, 0, 10);
        graphics.strokeCircle(0, 0, 12);
        break;
        
      case 'patrol':
        // Circular path indicator
        graphics.lineStyle(2, primaryColor, 0.8);
        graphics.strokeCircle(0, 0, 15);
        graphics.fillStyle(glowColor, 0.6);
        graphics.fillCircle(0, 0, 5);
        break;
        
      case 'special':
        // Star pattern with quaternion components
        for (let i = 0; i < 4; i++) {
          const angle = (i * 90) * (Math.PI / 180);
          const x = Math.cos(angle) * 12;
          const y = Math.sin(angle) * 12;
          graphics.fillStyle(glowColor, 0.8);
          graphics.fillCircle(x, y, 4);
        }
        break;
    }
    
    container.add(graphics);
    
    // Animate out
    this.scene.tweens.add({
      targets: container,
      scaleX: { from: 1, to: 2 },
      scaleY: { from: 1, to: 2 },
      alpha: { from: 1, to: 0 },
      duration: 600,
      ease: 'Power2.easeOut',
      onComplete: () => {
        container.destroy();
        this.activeEffects.delete(container);
      }
    });
    
    this.activeEffects.add(container);
    return container;
  }

  /**
   * Create building construction effect with quaternion transformation
   */
  createBuildingConstructionEffect(
    position: { x: number; y: number },
    axis: QuaternionAxis = 'matter',
    progress: number = 0
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(position.x, position.y);
    container.setDepth(170);
    
    const design = AXIS_DESIGNS[axis];
    const primaryColor = hexToPhaserColor(design.primary);
    const glowColor = hexToPhaserColor(design.glow);
    
    const graphics = this.scene.add.graphics();
    
    // Construction grid with quaternion rotation
    const gridSize = 40;
    const gridLines = 4;
    
    graphics.lineStyle(1, primaryColor, 0.6);
    for (let i = 0; i <= gridLines; i++) {
      const pos = (i / gridLines) * gridSize - gridSize / 2;
      graphics.lineBetween(pos, -gridSize / 2, pos, gridSize / 2);
      graphics.lineBetween(-gridSize / 2, pos, gridSize / 2, pos);
    }
    
    // Progress indicator (quaternion rotation angle)
    const progressAngle = progress * 360;
    graphics.lineStyle(3, glowColor, 0.9);
    graphics.beginPath();
    graphics.arc(0, 0, gridSize / 2 + 5, 0, (progressAngle * Math.PI) / 180);
    graphics.strokePath();
    
    container.add(graphics);
    
    // Rotate grid
    this.scene.tweens.add({
      targets: container,
      angle: 360,
      duration: 3000,
      ease: 'Linear',
      repeat: -1
    });
    
    this.activeEffects.add(container);
    return container;
  }

  /**
   * Clean up all effects
   */
  cleanup(): void {
    this.activeEffects.forEach(effect => {
      if (effect && !effect.destroyed) {
        effect.destroy();
      }
    });
    this.activeEffects.clear();
  }
}

