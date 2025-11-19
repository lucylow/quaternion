// PATCHED BY CURSOR - phaser hitArea fix - 2024-11-18
// src/frontend/ui/ResponsiveMobileUI.ts

import Phaser from 'phaser';
import { safeSetInteractive } from '../../utils/inputSafe';
import { InteractionAudio } from '../../audio/InteractionAudio';

interface TouchControl {
  bg?: Phaser.GameObjects.Arc;
  dot?: Phaser.GameObjects.Arc;
  button?: Phaser.GameObjects.Arc;
  text?: Phaser.GameObjects.Text;
}

export class ResponsiveMobileUI {
  private scene: Phaser.Scene;
  private isMobile: boolean;
  private scale: number;
  private uiElements: Map<string, Phaser.GameObjects.GameObject>;
  private touchControls: Map<string, TouchControl>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = this.detectMobileDevice();
    this.scale = this.getScaleFactor();
    this.uiElements = new Map();
    this.touchControls = new Map();
  }

  /**
   * Detect if device is mobile
   */
  private detectMobileDevice(): boolean {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase()
    );
  }

  /**
   * Get scale factor based on screen size
   */
  getScaleFactor(): number {
    const width = window.innerWidth;

    if (width < 480) return 0.6; // Small phone
    if (width < 768) return 0.8; // Large phone
    if (width < 1024) return 0.9; // Tablet
    return 1.0; // Desktop
  }

  /**
   * Initialize responsive UI
   */
  setupResponsiveUI(): void {
    if (this.isMobile) {
      this.setupMobileTouchControls();
      this.setupMobileHUD();
    } else {
      this.setupDesktopUI();
    }
  }

  /**
   * Setup mobile touch controls
   */
  private setupMobileTouchControls(): void {
    const scale = this.scale;
    const width = this.scene.game.canvas.width;
    const height = this.scene.game.canvas.height;

    // D-Pad / Movement joystick
    const joystickX = width * 0.15;
    const joystickY = height * 0.85;
    const joystickRadius = 50 * scale;

    const joystickBg = this.scene.add.circle(
      joystickX,
      joystickY,
      joystickRadius,
      0x333333,
      0.5
    );
    joystickBg.setScrollFactor(0);
    joystickBg.setDepth(1000);

    const joystickDot = this.scene.add.circle(
      joystickX,
      joystickY,
      joystickRadius * 0.5,
      0x00ff00,
      0.8
    );
    joystickDot.setScrollFactor(0);
    joystickDot.setDepth(1001);

    // Make joystick interactive
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const distance = Phaser.Math.Distance.Between(
          joystickX,
          joystickY,
          pointer.x,
          pointer.y
        );

        if (distance < joystickRadius * 2) {
          const angle = Phaser.Math.Angle.Between(
            joystickX,
            joystickY,
            pointer.x,
            pointer.y
          );

          joystickDot.x =
            joystickX + Math.cos(angle) * (joystickRadius * 0.5);
          joystickDot.y =
            joystickY + Math.sin(angle) * (joystickRadius * 0.5);

          this.scene.events.emit('joystick_move', { angle, distance });
        }
      }
    });

    this.touchControls.set('joystick', {
      bg: joystickBg,
      dot: joystickDot,
    });

    // Action buttons
    this.createActionButtons(width, height, scale);
  }

  /**
   * Create mobile action buttons
   */
  private createActionButtons(
    width: number,
    height: number,
    scale: number
  ): void {
    const buttonRadius = 40 * scale;
    const spacing = 20 * scale;
    const startX = width * 0.85;
    const startY = height * 0.75;

    const buttons = [
      {
        name: 'attack',
        icon: '⚔️',
        offset: { x: 0, y: -buttonRadius - spacing },
      },
      {
        name: 'ability',
        icon: '✨',
        offset: { x: buttonRadius + spacing, y: -buttonRadius * 0.5 },
      },
      {
        name: 'defend',
        icon: '🛡️',
        offset: { x: buttonRadius + spacing, y: buttonRadius * 0.5 },
      },
      {
        name: 'build',
        icon: '🏗️',
        offset: { x: 0, y: buttonRadius + spacing },
      },
    ];

    buttons.forEach((btn) => {
      const button = this.scene.add.circle(
        startX + btn.offset.x,
        startY + btn.offset.y,
        buttonRadius,
        0x0099ff,
        0.7
      );

      button.setScrollFactor(0);
      button.setDepth(1000);
      safeSetInteractive(button, { useHandCursor: true });

      const text = this.scene.add.text(
        startX + btn.offset.x,
        startY + btn.offset.y,
        btn.icon,
        { fontSize: `${32 * scale}px`, fill: '#FFF' }
      );

      text.setOrigin(0.5);
      text.setScrollFactor(0);
      text.setDepth(1001);

      button.on('pointerover', () => {
        // Hover effect
        this.scene.tweens.add({
          targets: button,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
          ease: 'Back.easeOut'
        });
      });

      button.on('pointerout', () => {
        // Reset scale
        this.scene.tweens.add({
          targets: button,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
          ease: 'Back.easeIn'
        });
      });

      button.on('pointerdown', () => {
        // Press animation
        this.scene.tweens.add({
          targets: button,
          scaleX: 0.9,
          scaleY: 0.9,
          duration: 50,
          yoyo: true,
          ease: 'Power2'
        });
        
        button.setFillStyle(0xff6600, 0.9);
        
        // Play sound effect
        try {
          const audio = InteractionAudio.instance();
          if (audio && audio.isEnabled()) {
            if (btn.name === 'attack') {
              audio.play('attack', { volume: 0.6 });
            } else if (btn.name === 'build') {
              audio.play('build', { volume: 0.7 });
            } else {
              audio.play('click', { volume: 0.5 });
            }
          }
        } catch (error) {
          // Continue without audio
        }
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(20);
        }
        
        this.scene.events.emit(`button_${btn.name}_pressed`);
      });

      button.on('pointerup', () => {
        button.setFillStyle(0x0099ff, 0.7);
      });

      this.touchControls.set(`btn_${btn.name}`, { button, text });
    });
  }

  /**
   * Setup mobile HUD
   */
  private setupMobileHUD(): void {
    const width = this.scene.game.canvas.width;
    const height = this.scene.game.canvas.height;
    const scale = this.scale;

    // Top bar - Resources
    const topBar = this.scene.add.rectangle(
      width / 2,
      30 * scale,
      width,
      60 * scale,
      0x1a1a1a,
      0.8
    );
    topBar.setScrollFactor(0);
    topBar.setDepth(900);

    // Resources display
    const resources = [
      { name: 'Minerals', icon: '⛏️', value: 500 },
      { name: 'Gas', icon: '⚡', value: 250 },
    ];

    let xOffset = 20 * scale;
    resources.forEach((res) => {
      const text = this.scene.add.text(
        xOffset,
        20 * scale,
        `${res.icon} ${res.value}`,
        { fontSize: `${16 * scale}px`, fill: '#FFF' }
      );

      text.setScrollFactor(0);
      text.setDepth(910);

      xOffset += 150 * scale;
    });

    // Bottom bar - Unit selection
    const bottomBar = this.scene.add.rectangle(
      width / 2,
      height - 30 * scale,
      width,
      60 * scale,
      0x1a1a1a,
      0.8
    );

    bottomBar.setScrollFactor(0);
    bottomBar.setDepth(900);

    const unitsText = this.scene.add.text(
      20 * scale,
      height - 40 * scale,
      '🪖 Units: 12/15',
      { fontSize: `${14 * scale}px`, fill: '#FFF' }
    );

    unitsText.setScrollFactor(0);
    unitsText.setDepth(910);

    this.uiElements.set('topBar', topBar);
    this.uiElements.set('bottomBar', bottomBar);
  }

  /**
   * Setup desktop UI
   */
  private setupDesktopUI(): void {
    // Standard desktop layout with keyboard shortcuts display
    const width = this.scene.game.canvas.width;
    const height = this.scene.game.canvas.height;

    const helpPanel = this.scene.add.rectangle(
      width - 150,
      height - 150,
      300,
      300,
      0x1a1a1a,
      0.7
    );

    helpPanel.setScrollFactor(0);
    helpPanel.setDepth(900);

    const shortcuts = [
      'Q: Build',
      'W: Attack',
      'E: Defend',
      'R: Ability',
      'SPACE: Select All',
      'ESC: Deselect',
    ];

    let yOffset = 0;
    shortcuts.forEach((shortcut) => {
      const text = this.scene.add.text(
        width - 145,
        height - 140 + yOffset,
        shortcut,
        { fontSize: '12px', fill: '#FFF' }
      );

      text.setScrollFactor(0);
      text.setDepth(910);

      yOffset += 20;
    });
  }

  /**
   * Update UI on window resize
   */
  onWindowResize(): void {
    const newScale = this.getScaleFactor();

    if (newScale !== this.scale) {
      this.scale = newScale;
      // Don't restart scene, just update scale
      // this.scene.scene.restart();
    }
  }

  /**
   * Get touch position adjusted for world
   */
  getTouchWorldPosition(pointer: Phaser.Input.Pointer): {
    x: number;
    y: number;
  } {
    return {
      x: this.scene.cameras.main.scrollX + pointer.x,
      y: this.scene.cameras.main.scrollY + pointer.y,
    };
  }

  /**
   * Show mobile-optimized tooltip
   */
  showMobileTooltip(
    text: string,
    x: number,
    y: number,
    duration = 2000
  ): void {
    const tooltip = this.scene.add.text(x, y - 50, text, {
      fontSize: `${14 * this.scale}px`,
      fill: '#FFF',
      backgroundColor: '#000',
    });

    tooltip.setDepth(1100);
    tooltip.setPadding(10, 5, 10, 5);

    this.scene.tweens.add({
      targets: tooltip,
      alpha: 0,
      duration,
      onComplete: () => tooltip.destroy(),
    });
  }

  /**
   * Create mobile-friendly minimap
   */
  createMobileMinimap(mapWidth: number, mapHeight: number): Phaser.GameObjects.Rectangle {
    const width = this.scene.game.canvas.width;
    const minimapSize = 100 * this.scale;

    const minimap = this.scene.add.rectangle(
      width - minimapSize - 10,
      10 + minimapSize,
      minimapSize,
      minimapSize,
      0x000000,
      0.5
    );

    minimap.setScrollFactor(0);
    minimap.setDepth(950);
    minimap.setStrokeStyle(2, 0xffffff);

    return minimap;
  }
}

