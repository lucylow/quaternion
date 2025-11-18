/**
 * Interactivity Manager
 * 
 * Enhances game interactivity with visual feedback, animations, and responsive interactions
 */

import Phaser from 'phaser';
import { safeSetInteractive, debugInteractive } from '../utils/inputSafe';

export interface InteractionConfig {
  enableHoverEffects?: boolean;
  enableClickAnimations?: boolean;
  enableSelectionPulse?: boolean;
  enableHapticFeedback?: boolean;
  animationSpeed?: number;
}

export class InteractivityManager {
  private scene: Phaser.Scene;
  private config: InteractionConfig;
  private hoveredObjects: Set<Phaser.GameObjects.GameObject> = new Set();
  private selectedObjects: Set<Phaser.GameObjects.GameObject> = new Set();
  private clickAnimations: Phaser.GameObjects.Graphics[] = [];
  private selectionRings: Map<Phaser.GameObjects.GameObject, Phaser.GameObjects.Ellipse> = new Map();
  private hoverTweens: Map<Phaser.GameObjects.GameObject, Phaser.Tweens.Tween> = new Map();
  private pulseTweens: Map<Phaser.GameObjects.GameObject, Phaser.Tweens.Tween> = new Map();

  constructor(scene: Phaser.Scene, config: InteractionConfig = {}) {
    this.scene = scene;
    this.config = {
      enableHoverEffects: true,
      enableClickAnimations: true,
      enableSelectionPulse: true,
      enableHapticFeedback: true,
      animationSpeed: 1.0,
      ...config
    };
  }

  /**
   * Make a game object interactive with enhanced feedback
   */
  makeInteractive(
    obj: Phaser.GameObjects.GameObject,
    options: {
      onHover?: () => void;
      onHoverOut?: () => void;
      onClick?: () => void;
      onSelect?: () => void;
      hoverScale?: number;
      selectionColor?: number;
      clickColor?: number;
    } = {}
  ): void {
    if (!obj || !('setInteractive' in obj)) return;

    const {
      onHover,
      onHoverOut,
      onClick,
      onSelect,
      hoverScale = 1.1,
      selectionColor = 0x00ffea,
      clickColor = 0xffffff
    } = options;

    // Make object interactive using safe wrapper
    safeSetInteractive(obj, { useHandCursor: true });
    
    // Debug in development mode
    if (process.env.NODE_ENV === 'development') {
      debugInteractive(obj, 'InteractivityManager.makeInteractive');
    }

    // Hover effects
    if (this.config.enableHoverEffects) {
      (obj as any).on('pointerover', () => {
        this.handleHoverIn(obj, hoverScale);
        if (onHover) onHover();
      });

      (obj as any).on('pointerout', () => {
        this.handleHoverOut(obj);
        if (onHoverOut) onHoverOut();
      });
    }

    // Click animations
    if (this.config.enableClickAnimations) {
      (obj as any).on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.createClickAnimation(pointer.worldX, pointer.worldY, clickColor);
        if (onClick) onClick();
      });
    }

    // Selection
    if (onSelect) {
      (obj as any).on('pointerup', () => {
        this.selectObject(obj, selectionColor);
        onSelect();
      });
    }
  }

  /**
   * Handle hover in
   */
  private handleHoverIn(obj: Phaser.GameObjects.GameObject, scale: number): void {
    if (this.hoveredObjects.has(obj)) return;
    this.hoveredObjects.add(obj);

    // Stop any existing hover tween
    const existingTween = this.hoverTweens.get(obj);
    if (existingTween) {
      existingTween.stop();
    }

    // Create hover scale animation
    if ('scale' in obj && typeof (obj as any).scale === 'object') {
      const tween = this.scene.tweens.add({
        targets: obj,
        scaleX: scale,
        scaleY: scale,
        duration: 150 / this.config.animationSpeed!,
        ease: 'Back.easeOut'
      });
      this.hoverTweens.set(obj, tween);
    }

    // Add glow effect
    if ('setTint' in obj) {
      (obj as any).setTint(0x88ffff);
    }
  }

  /**
   * Handle hover out
   */
  private handleHoverOut(obj: Phaser.GameObjects.GameObject): void {
    if (!this.hoveredObjects.has(obj)) return;
    this.hoveredObjects.delete(obj);

    // Stop hover tween
    const existingTween = this.hoverTweens.get(obj);
    if (existingTween) {
      existingTween.stop();
    }

    // Reset scale
    if ('scale' in obj && typeof (obj as any).scale === 'object') {
      this.scene.tweens.add({
        targets: obj,
        scaleX: 1,
        scaleY: 1,
        duration: 150 / this.config.animationSpeed!,
        ease: 'Back.easeIn'
      });
    }

    // Remove glow
    if ('setTint' in obj && !this.selectedObjects.has(obj)) {
      (obj as any).clearTint();
    }

    this.hoverTweens.delete(obj);
  }

  /**
   * Create click animation (ripple effect)
   */
  private createClickAnimation(x: number, y: number, color: number): void {
    const graphics = this.scene.add.graphics();
    this.clickAnimations.push(graphics);

    const radius = 0;
    const maxRadius = 30;
    const alpha = 0.8;

    graphics.lineStyle(3, color, alpha);
    graphics.strokeCircle(x, y, radius);

    this.scene.tweens.add({
      targets: { radius, alpha },
      radius: maxRadius,
      alpha: 0,
      duration: 400 / this.config.animationSpeed!,
      ease: 'Power2',
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        const currentRadius = (tween.targets[0] as any).radius;
        const currentAlpha = (tween.targets[0] as any).alpha;
        graphics.clear();
        graphics.lineStyle(3, color, currentAlpha);
        graphics.strokeCircle(x, y, currentRadius);
      },
      onComplete: () => {
        graphics.destroy();
        const index = this.clickAnimations.indexOf(graphics);
        if (index > -1) {
          this.clickAnimations.splice(index, 1);
        }
      }
    });
  }

  /**
   * Select an object with visual feedback
   */
  selectObject(obj: Phaser.GameObjects.GameObject, color: number = 0x00ffea): void {
    if (this.selectedObjects.has(obj)) return;
    this.selectedObjects.add(obj);

    // Create selection ring
    if ('x' in obj && 'y' in obj) {
      const x = (obj as any).x;
      const y = (obj as any).y;
      const radius = ('width' in obj ? (obj as any).width : 20) / 2 + 5;

      const ring = this.scene.add.ellipse(x, y, radius * 2, radius * 2, 0x000000, 0);
      ring.setStrokeStyle(3, color, 0.8);
      ring.setDepth((obj as any).depth || 0 + 1);
      this.selectionRings.set(obj, ring);

      // Pulse animation
      if (this.config.enableSelectionPulse) {
        const pulseTween = this.scene.tweens.add({
          targets: ring,
          scaleX: 1.2,
          scaleY: 1.2,
          alpha: 0.5,
          duration: 800 / this.config.animationSpeed!,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        this.pulseTweens.set(obj, pulseTween);
      }

      // Add tint
      if ('setTint' in obj) {
        (obj as any).setTint(color);
      }
    }
  }

  /**
   * Deselect an object
   */
  deselectObject(obj: Phaser.GameObjects.GameObject): void {
    if (!this.selectedObjects.has(obj)) return;
    this.selectedObjects.delete(obj);

    // Remove selection ring
    const ring = this.selectionRings.get(obj);
    if (ring) {
      ring.destroy();
      this.selectionRings.delete(obj);
    }

    // Stop pulse tween
    const pulseTween = this.pulseTweens.get(obj);
    if (pulseTween) {
      pulseTween.stop();
      this.pulseTweens.delete(obj);
    }

    // Remove tint if not hovered
    if ('clearTint' in obj && !this.hoveredObjects.has(obj)) {
      (obj as any).clearTint();
    }
  }

  /**
   * Clear all selections
   */
  clearSelections(): void {
    const objects = Array.from(this.selectedObjects);
    objects.forEach(obj => this.deselectObject(obj));
  }

  /**
   * Update selection ring positions (call in update loop)
   */
  updateSelectionRings(): void {
    this.selectionRings.forEach((ring, obj) => {
      if ('x' in obj && 'y' in obj && obj.active) {
        ring.setPosition((obj as any).x, (obj as any).y);
      } else {
        // Object destroyed, clean up
        ring.destroy();
        this.selectionRings.delete(obj);
        this.selectedObjects.delete(obj);
        this.pulseTweens.delete(obj);
      }
    });
  }

  /**
   * Trigger haptic feedback (mobile)
   */
  triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (!this.config.enableHapticFeedback) return;

    if ('vibrate' in navigator) {
      const patterns: Record<string, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 30
      };
      navigator.vibrate(patterns[type]);
    }
  }

  /**
   * Create a button with enhanced interactivity
   */
  createInteractiveButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
    options: {
      color?: number;
      hoverColor?: number;
      textColor?: number;
      fontSize?: number;
    } = {}
  ): Phaser.GameObjects.Container {
    const {
      color = 0x0099ff,
      hoverColor = 0x00ccff,
      textColor = 0xffffff,
      fontSize = 16
    } = options;

    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.rectangle(0, 0, width, height, color, 0.8);
    const label = this.scene.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      color: `#${textColor.toString(16).padStart(6, '0')}`,
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    safeSetInteractive(container, { useHandCursor: true });

    // Hover effects
    container.on('pointerover', () => {
      bg.setFillStyle(hoverColor, 0.9);
      this.scene.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Back.easeOut'
      });
      this.triggerHaptic('light');
    });

    container.on('pointerout', () => {
      bg.setFillStyle(color, 0.8);
      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeIn'
      });
    });

    container.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        ease: 'Power2'
      });
      this.triggerHaptic('medium');
      onClick();
    });

    return container;
  }

  /**
   * Clean up
   */
  destroy(): void {
    // Clean up all animations
    this.hoverTweens.forEach(tween => tween.stop());
    this.pulseTweens.forEach(tween => tween.stop());
    this.clickAnimations.forEach(gfx => gfx.destroy());
    this.selectionRings.forEach(ring => ring.destroy());

    this.hoverTweens.clear();
    this.pulseTweens.clear();
    this.clickAnimations = [];
    this.selectionRings.clear();
    this.hoveredObjects.clear();
    this.selectedObjects.clear();
  }
}

