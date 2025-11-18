// src/frontend/scenes/UnifiedGameScene.ts

import Phaser from 'phaser';
import { AssetManager } from '../managers/AssetManager';
import { EnhancedMapRenderer } from '../renderers/EnhancedMapRenderer';
import { ResponsiveMobileUI } from '../ui/ResponsiveMobileUI';

export class UnifiedGameScene extends Phaser.Scene {
  private assetManager!: AssetManager;
  private mapRenderer!: EnhancedMapRenderer;
  private mobileUI!: ResponsiveMobileUI;

  constructor() {
    super({ key: 'UnifiedGameScene' });
  }

  preload(): void {
    // Show loading screen
    const loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Loading Assets...',
      { fontSize: '32px', fill: '#FFF' }
    );
    loadingText.setOrigin(0.5);

    // Initialize asset manager and queue all assets for loading
    this.assetManager = new AssetManager(this);
    this.assetManager.loadAllAssets();

    // Update loading text as files load
    this.load.on('progress', (progress: number) => {
      loadingText.setText(`Loading Assets... ${Math.round(progress * 100)}%`);
    });
  }

  async create(): Promise<void> {
    try {
      // Wait for all assets to finish loading
      await this.assetManager.waitForAssetsToLoad();

      // Select random country
      const countries = [
        'country-dubai',
        'country-china',
        'country-usa',
        'country-france',
      ];
      const selectedCountry =
        countries[Math.floor(Math.random() * countries.length)];

      // Initialize map renderer
      this.mapRenderer = new EnhancedMapRenderer(
        this,
        64 * 32,
        64 * 32,
        selectedCountry
      );
      await this.mapRenderer.initializeMap();

      // Initialize responsive UI
      this.mobileUI = new ResponsiveMobileUI(this);
      this.mobileUI.setupResponsiveUI();

      // Setup input
      this.setupInputHandlers();

      // Setup camera
      this.setupCamera();

      // Create some monsters for demo
      this.createDemoMonsters();

      console.log('✅ Game scene initialized successfully');
    } catch (error) {
      console.error('Failed to initialize game scene:', error);
    }
  }

  /**
   * Create demo monsters on map
   */
  private createDemoMonsters(): void {
    const monsterTypes = [
      'monster-celestial-1',
      'monster-celestial-2',
      'monster-elemental',
      'monster-horror',
      'monster-quaternion-poster-1',
      'monster-quaternion-poster-2',
    ];

    console.log('Creating demo monsters...');

    for (let i = 0; i < 5; i++) {
      const monsterType = monsterTypes[i % monsterTypes.length];
      const x = Math.random() * (64 * 32);
      const y = Math.random() * (64 * 32);

      try {
        const monster = this.assetManager.createMonster(
          this,
          monsterType,
          x,
          y,
          {
            scale: 0.3, // Scale down large images
            physics: true,
            depth: 100,
          }
        );

        console.log(`✅ Created monster: ${monsterType} at (${x}, ${y})`);

        // Add name label
        const label = this.add.text(
          x,
          y - 40,
          monsterType.toUpperCase().replace('MONSTER-', ''),
          { fontSize: '16px', fill: '#FFF', stroke: '#000', strokeThickness: 2 }
        );

        label.setOrigin(0.5);
        label.setDepth(101);
      } catch (error) {
        console.error(`❌ Failed to create monster ${monsterType}:`, error);
      }
    }
  }

  /**
   * Setup input handlers
   */
  private setupInputHandlers(): void {
    // Mouse/touch click
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPos = this.mobileUI.getTouchWorldPosition(pointer);
      const tile = this.mapRenderer.getTileAt(worldPos.x, worldPos.y);

      if (pointer.rightButtonDown()) {
        // Right click - move units
        this.events.emit('command:move', tile);
      } else {
        // Left click - select units
        this.events.emit('command:select', tile);
      }
    });

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'q':
          this.events.emit('ui:open_build_menu');
          break;
        case 'w':
          this.events.emit('ui:attack_mode');
          break;
        case 'e':
          this.events.emit('ui:defend_mode');
          break;
        case ' ':
          this.events.emit('command:select_all');
          break;
      }
    });

    // Mobile button events
    this.events.on('button_attack_pressed', () => {
      console.log('Attack button pressed');
    });

    this.events.on('button_build_pressed', () => {
      console.log('Build menu opened');
    });
  }

  /**
   * Setup camera
   */
  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, 64 * 32, 64 * 32);
    camera.centerOn(32 * 32, 32 * 32);

    // Smooth pan
    this.tweens.add({
      targets: camera,
      scrollX: 0,
      scrollY: 0,
      duration: 2000,
      ease: 'Power2',
    });
  }

  /**
   * Update game state
   */
  update(): void {
    // Update parallax
    this.mapRenderer.updateParallax(this.cameras.main);
  }

  /**
   * Handle window resize
   */
  onWindowResize(): void {
    this.mobileUI.onWindowResize();
  }
}


