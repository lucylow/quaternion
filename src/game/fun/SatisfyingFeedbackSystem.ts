/**
 * Satisfying Feedback System
 * Makes every action feel good with visual/audio feedback
 */

import Phaser from 'phaser';
import { QuaternionArtPalette } from '../art/ArtPalette';

export interface FeedbackEvent {
  type: 'build' | 'research' | 'resource_gain' | 'combo' | 'milestone' | 'victory';
  position?: { x: number; y: number };
  resourceType?: 'matter' | 'energy' | 'life' | 'knowledge';
  intensity: number; // 0-1
  text?: string;
}

export interface ComboState {
  count: number;
  multiplier: number;
  lastAction: string;
  lastActionTime: number;
  comboBonus: number;
}

export class SatisfyingFeedbackSystem {
  private scene: Phaser.Scene;
  private particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private comboState: ComboState = {
    count: 0,
    multiplier: 1.0,
    lastAction: '',
    lastActionTime: 0,
    comboBonus: 1.0
  };
  private feedbackQueue: FeedbackEvent[] = [];
  private screenShake: { intensity: number; duration: number } = { intensity: 0, duration: 0 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create particle manager
    this.particleManager = scene.add.particles(0, 0, 'particle', {
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 20, max: 100 },
      lifespan: 1000,
      frequency: -1 // Don't auto-emit
    });
    this.particleManager.setDepth(50);

    // Setup screen shake
    this.setupScreenShake();
  }

  /**
   * Trigger satisfying feedback for an action
   */
  triggerFeedback(event: FeedbackEvent): void {
    this.feedbackQueue.push(event);
    this.processFeedback(event);
  }

  /**
   * Process feedback event
   */
  private processFeedback(event: FeedbackEvent): void {
    const palette = event.resourceType 
      ? QuaternionArtPalette.getPalette(event.resourceType)
      : QuaternionArtPalette.NEUTRAL;

    switch (event.type) {
      case 'build':
        this.playBuildFeedback(event, palette);
        break;
      case 'research':
        this.playResearchFeedback(event, palette);
        break;
      case 'resource_gain':
        this.playResourceGainFeedback(event, palette);
        break;
      case 'combo':
        this.playComboFeedback(event);
        break;
      case 'milestone':
        this.playMilestoneFeedback(event, palette);
        break;
      case 'victory':
        this.playVictoryFeedback(event);
        break;
    }

    // Screen shake for significant events
    if (event.intensity > 0.6) {
      this.addScreenShake(event.intensity * 10, 200);
    }
  }

  /**
   * Play build feedback
   */
  private playBuildFeedback(event: FeedbackEvent, palette: any): void {
    if (!event.position) return;

    const color = QuaternionArtPalette.toPhaserColor(palette.emissive);
    
    // Construction particles
    const emitter = this.particleManager.createEmitter({
      x: event.position.x,
      y: event.position.y,
      scale: { start: 1 * event.intensity, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 30, max: 80 * event.intensity },
      angle: { min: 0, max: 360 },
      lifespan: 800,
      tint: [color, QuaternionArtPalette.toPhaserColor(palette.accent)],
      quantity: Math.floor(15 * event.intensity)
    });

    // Remove emitter after duration
    this.scene.time.delayedCall(800, () => {
      emitter.stop();
      emitter.remove();
    });

    // Sound effect (would integrate with audio system)
    // AudioManager.playSound('build_construction', event.intensity);

    // Floating text
    if (event.text) {
      this.createFloatingText(event.position.x, event.position.y, event.text, palette.accent);
    }

    // Brief flash effect
    this.createFlashEffect(event.position.x, event.position.y, color, event.intensity);
  }

  /**
   * Play research feedback
   */
  private playResearchFeedback(event: FeedbackEvent, palette: any): void {
    const color = QuaternionArtPalette.toPhaserColor(palette.emissive);

    // Knowledge particles - upward spiral
    const emitter = this.particleManager.createEmitter({
      scale: { start: 0.3 * event.intensity, end: 0 },
      alpha: { start: 0.8, end: 0 },
      speed: { min: 20, max: 60 * event.intensity },
      angle: { min: 270 - 15, max: 270 + 15 }, // Upward
      lifespan: 1500,
      tint: [color, QuaternionArtPalette.toPhaserColor(palette.light)],
      quantity: Math.floor(20 * event.intensity)
    });

    // Spiral motion
    const time = this.scene.time.now;
    this.scene.tweens.add({
      targets: emitter,
      duration: 1500,
      onUpdate: (tween: any) => {
        const angle = (time + tween.elapsed * 0.002) * 360;
        if (event.position) {
          emitter.setPosition(
            event.position.x + Math.cos(angle) * 20,
            event.position.y - (tween.elapsed / 10)
          );
        }
      }
    });

    this.scene.time.delayedCall(1500, () => {
      emitter.stop();
      emitter.remove();
    });

    // Floating text
    if (event.text && event.position) {
      this.createFloatingText(event.position.x, event.position.y, event.text, palette.emissive);
    }
  }

  /**
   * Play resource gain feedback
   */
  private playResourceGainFeedback(event: FeedbackEvent, palette: any): void {
    if (!event.position) return;

    const color = QuaternionArtPalette.toPhaserColor(palette.emissive);
    
    // Resource pickup particles
    const emitter = this.particleManager.createEmitter({
      x: event.position.x,
      y: event.position.y,
      scale: { start: 0.4 * event.intensity, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 40, max: 120 * event.intensity },
      angle: { min: 0, max: 360 },
      lifespan: 600,
      tint: color,
      quantity: Math.floor(10 * event.intensity)
    });

    // Number popup
    if (event.text) {
      this.createNumberPopup(event.position.x, event.position.y, event.text, color);
    }

    this.scene.time.delayedCall(600, () => {
      emitter.stop();
      emitter.remove();
    });
  }

  /**
   * Play combo feedback
   */
  private playComboFeedback(event: FeedbackEvent): void {
    const comboText = `COMBO x${this.comboState.count}!`;
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    // Big combo text
    const comboLabel = this.scene.add.text(centerX, centerY, comboText, {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 8,
      align: 'center'
    });
    comboLabel.setOrigin(0.5);
    comboLabel.setDepth(100);
    comboLabel.setScale(0.5);

    // Animate in
    this.scene.tweens.add({
      targets: comboLabel,
      scale: 1.2,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: comboLabel,
          alpha: 0,
          scale: 1.5,
          y: centerY - 50,
          duration: 500,
          onComplete: () => comboLabel.destroy()
        });
      }
    });

    // Screen flash
    this.createFlashEffect(centerX, centerY, 0xFFD700, 0.5);
    
    // Extra particles
    const emitter = this.particleManager.createEmitter({
      x: centerX,
      y: centerY,
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      lifespan: 1000,
      tint: [0xFFD700, 0xFF6B00],
      quantity: 50
    });

    this.scene.time.delayedCall(1000, () => {
      emitter.stop();
      emitter.remove();
    });

    // Screen shake
    this.addScreenShake(15, 300);
  }

  /**
   * Play milestone feedback
   */
  private playMilestoneFeedback(event: FeedbackEvent, palette: any): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    // Milestone announcement
    if (event.text) {
      const milestoneText = this.scene.add.text(centerX, centerY - 100, event.text, {
        fontSize: '48px',
        fontFamily: 'Arial',
        color: QuaternionArtPalette.toHex(palette.accent),
        stroke: '#000',
        strokeThickness: 6,
        align: 'center'
      });
      milestoneText.setOrigin(0.5);
      milestoneText.setDepth(100);

      // Animate
      this.scene.tweens.add({
        targets: milestoneText,
        scale: { from: 0, to: 1 },
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: milestoneText,
            alpha: 0,
            y: milestoneText.y - 50,
            duration: 1000,
            delay: 2000,
            onComplete: () => milestoneText.destroy()
          });
        }
      });
    }

    // Celebration particles
    const color = QuaternionArtPalette.toPhaserColor(palette.emissive);
    const emitter = this.particleManager.createEmitter({
      x: centerX,
      y: centerY,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 30, max: 150 },
      angle: { min: 0, max: 360 },
      lifespan: 2000,
      tint: [color, QuaternionArtPalette.toPhaserColor(palette.light)],
      quantity: 100
    });

    this.scene.time.delayedCall(2000, () => {
      emitter.stop();
      emitter.remove();
    });

    // Screen shake
    this.addScreenShake(20, 400);
  }

  /**
   * Play victory feedback
   */
  private playVictoryFeedback(event: FeedbackEvent): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    // Victory explosion
    const colors = [
      QuaternionArtPalette.toPhaserColor(QuaternionArtPalette.MATTER.emissive),
      QuaternionArtPalette.toPhaserColor(QuaternionArtPalette.ENERGY.emissive),
      QuaternionArtPalette.toPhaserColor(QuaternionArtPalette.LIFE.emissive),
      QuaternionArtPalette.toPhaserColor(QuaternionArtPalette.KNOWLEDGE.emissive)
    ];

    // Multiple bursts
    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const emitter = this.particleManager.createEmitter({
          x: centerX,
          y: centerY,
          scale: { start: 2, end: 0 },
          alpha: { start: 1, end: 0 },
          speed: { min: 100, max: 300 },
          angle: { min: 0, max: 360 },
          lifespan: 2000,
          tint: colors[i],
          quantity: 50
        });

        this.scene.time.delayedCall(2000, () => {
          emitter.stop();
          emitter.remove();
        });
      });
    }

    // Screen shake
    this.addScreenShake(30, 1000);
  }

  /**
   * Track combo
   */
  recordAction(action: string): void {
    const now = Date.now();
    const timeSinceLast = now - this.comboState.lastActionTime;
    
    // Reset combo if too much time passed (2 seconds)
    if (timeSinceLast > 2000 || this.comboState.lastAction !== action) {
      this.comboState.count = 1;
      this.comboState.multiplier = 1.0;
      this.comboState.comboBonus = 1.0;
    } else {
      // Continue combo
      this.comboState.count++;
      this.comboState.multiplier = Math.min(3.0, 1.0 + (this.comboState.count - 1) * 0.2);
      this.comboState.comboBonus = this.comboState.count > 5 ? 1.2 : 1.0;

      // Trigger combo feedback
      if (this.comboState.count > 3 && this.comboState.count % 3 === 0) {
        this.triggerFeedback({
          type: 'combo',
          intensity: Math.min(1, this.comboState.count / 10),
          text: `COMBO x${this.comboState.count}!`
        });
      }
    }

    this.comboState.lastAction = action;
    this.comboState.lastActionTime = now;
  }

  /**
   * Get current combo multiplier
   */
  getComboMultiplier(): number {
    return this.comboState.multiplier;
  }

  /**
   * Get combo bonus
   */
  getComboBonus(): number {
    return this.comboState.comboBonus;
  }

  /**
   * Create floating text
   */
  private createFloatingText(x: number, y: number, text: string, color: any): void {
    const textObj = this.scene.add.text(x, y, text, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: QuaternionArtPalette.toHex(color),
      stroke: '#000',
      strokeThickness: 4
    });
    textObj.setOrigin(0.5);
    textObj.setDepth(60);

    // Animate upward
    this.scene.tweens.add({
      targets: textObj,
      y: y - 50,
      alpha: 0,
      scale: 1.2,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => textObj.destroy()
    });
  }

  /**
   * Create number popup
   */
  private createNumberPopup(x: number, y: number, text: string, color: number): void {
    const numText = this.scene.add.text(x, y, `+${text}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: Phaser.Display.Color.IntegerToColor(color).getColorString(),
      stroke: '#000',
      strokeThickness: 6,
      fontWeight: 'bold'
    });
    numText.setOrigin(0.5);
    numText.setDepth(60);

    // Bounce animation
    this.scene.tweens.add({
      targets: numText,
      scale: { from: 0.5, to: 1.5, then: 1 },
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => numText.destroy()
    });
  }

  /**
   * Create flash effect
   */
  private createFlashEffect(x: number, y: number, color: number, intensity: number): void {
    const flash = this.scene.add.graphics();
    flash.fillStyle(color, 0.3 * intensity);
    flash.fillCircle(x, y, 100 * intensity);
    flash.setDepth(40);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  /**
   * Setup screen shake
   */
  private setupScreenShake(): void {
    const camera = this.scene.cameras.main;
    const originalX = camera.scrollX;
    const originalY = camera.scrollY;

    this.scene.events.on('update', () => {
      if (this.screenShake.duration > 0) {
        const offsetX = (Math.random() - 0.5) * this.screenShake.intensity;
        const offsetY = (Math.random() - 0.5) * this.screenShake.intensity;
        
        camera.setScroll(originalX + offsetX, originalY + offsetY);
        
        this.screenShake.duration -= this.scene.game.loop.delta;
        
        if (this.screenShake.duration <= 0) {
          camera.setScroll(originalX, originalY);
        }
      }
    });
  }

  /**
   * Add screen shake
   */
  addScreenShake(intensity: number, duration: number): void {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    this.screenShake.duration = Math.max(this.screenShake.duration, duration);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.particleManager.destroy();
    this.feedbackQueue = [];
  }
}

