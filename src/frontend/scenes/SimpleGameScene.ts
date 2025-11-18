/**
 * Simple Game Scene for Phaser
 * Optimized RTS game rendering with sprite-based graphics and viewport culling
 */

import Phaser from 'phaser';
import { GameLoop } from '../../game/GameLoop';
import { SimpleQuaternionGameState } from '../../game/SimpleQuaternionGameState';

interface UnitSprite {
  container: Phaser.GameObjects.Container;
  circle: Phaser.GameObjects.Arc;
  healthBar: Phaser.GameObjects.Graphics;
  selectionRing?: Phaser.GameObjects.Arc;
  unitId: string;
}

interface BuildingSprite {
  container: Phaser.GameObjects.Container;
  rect: Phaser.GameObjects.Rectangle;
  healthBar: Phaser.GameObjects.Graphics;
  buildingId: string;
}

interface ResourceSprite {
  circle: Phaser.GameObjects.Arc;
  resourceId: string;
}

export class SimpleGameScene extends Phaser.Scene {
  private gameState: SimpleQuaternionGameState | null = null;
  private gameLoop: GameLoop | null = null;
  private selectedUnits: string[] = [];
  
  // Sprite pools for efficient rendering
  private unitSprites: Map<string, UnitSprite> = new Map();
  private buildingSprites: Map<string, BuildingSprite> = new Map();
  private resourceSprites: Map<string, ResourceSprite> = new Map();
  private mapTiles: Phaser.GameObjects.Rectangle[][] = [];
  
  // UI elements
  private hudText: Phaser.GameObjects.Text | null = null;
  private buildMenu: Phaser.GameObjects.Text | null = null;
  private selectionBox: Phaser.GameObjects.Graphics | null = null;
  
  // Input state
  private isSelecting: boolean = false;
  private selectionStart: { x: number; y: number } | null = null;
  private cameraPanSpeed: number = 400;
  
  // Rendering layers
  private mapLayer: Phaser.GameObjects.Layer | null = null;
  private resourceLayer: Phaser.GameObjects.Layer | null = null;
  private buildingLayer: Phaser.GameObjects.Layer | null = null;
  private unitLayer: Phaser.GameObjects.Layer | null = null;
  private uiLayer: Phaser.GameObjects.Layer | null = null;

  constructor() {
    super({ key: 'SimpleGameScene' });
  }

  create(): void {
    // Initialize game state
    this.gameState = new SimpleQuaternionGameState({
      mapWidth: 64,
      mapHeight: 64,
      seed: Math.floor(Math.random() * 1000000)
    });

    // Initialize game loop
    this.gameLoop = new GameLoop({
      fixedTimestep: 1 / 60,
      maxFrameSkip: 5,
      maxDeltaTime: 0.1,
      targetFPS: 60,
      enablePerformanceMonitoring: true,
      enableAdaptiveQuality: false,
      enableFrameRateLimiting: false,
      pauseOnFocusLoss: false,
      autoResume: true
    }, {
      fixedUpdate: (delta) => {
        if (this.gameState) {
          this.gameState.fixedUpdate(delta);
        }
      },
      variableUpdate: () => {},
      render: () => {
        // Rendering is handled by Phaser's update loop
      }
    });

    this.gameLoop.initialize().then(() => {
      this.gameLoop?.start();
    });

    // Setup camera with smooth follow
    const mapWidth = 64 * 32;
    const mapHeight = 64 * 32;
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
    this.cameras.main.setZoom(1);
    this.cameras.main.setDeadzone(0, 0);

    // Create rendering layers for proper depth sorting
    this.mapLayer = this.add.layer();
    this.resourceLayer = this.add.layer();
    this.buildingLayer = this.add.layer();
    this.unitLayer = this.add.layer();
    this.uiLayer = this.add.layer();

    // Setup input
    this.setupInput();

    // Create UI
    this.createUI();

    // Initialize map tiles (static, only render once)
    this.initializeMap();

    console.log('✅ Game initialized and running');
  }

  private setupInput(): void {
    // Left mouse button - selection
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleLeftClick(pointer);
      } else if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer);
      }
    });

    // Selection box drag
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isSelecting && this.selectionStart) {
        this.updateSelectionBox(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isSelecting && this.selectionStart) {
        this.finishSelection(pointer);
      }
    });

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'b':
          this.openBuildMenu();
          break;
        case 'a':
          this.setAttackMode();
          break;
        case ' ':
          event.preventDefault();
          this.selectAllUnits();
          break;
        case 'escape':
          this.selectedUnits = [];
          this.updateSelectionVisuals();
          break;
      }
    });

    // Camera pan with mouse at edges (optional)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) {
        const edgeThreshold = 50;
        const speed = this.cameraPanSpeed;
        const delta = this.game.loop.delta / 1000;

        if (pointer.x < edgeThreshold) {
          this.cameras.main.scrollX -= speed * delta;
        } else if (pointer.x > this.cameras.main.width - edgeThreshold) {
          this.cameras.main.scrollX += speed * delta;
        }

        if (pointer.y < edgeThreshold) {
          this.cameras.main.scrollY -= speed * delta;
        } else if (pointer.y > this.cameras.main.height - edgeThreshold) {
          this.cameras.main.scrollY += speed * delta;
        }
      }
    });
  }

  private handleLeftClick(pointer: Phaser.Input.Pointer): void {
    if (!this.gameState) return;

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Start selection box
    this.isSelecting = true;
    this.selectionStart = { x: worldX, y: worldY };
    
    if (!this.selectionBox) {
      this.selectionBox = this.add.graphics();
      this.selectionBox.setScrollFactor(0);
      this.selectionBox.setDepth(2000);
    }
  }

  private updateSelectionBox(pointer: Phaser.Input.Pointer): void {
    if (!this.selectionBox || !this.selectionStart) return;

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    this.selectionBox.clear();
    this.selectionBox.lineStyle(2, 0x00FF00, 0.8);
    this.selectionBox.strokeRect(
      this.selectionStart.x,
      this.selectionStart.y,
      worldX - this.selectionStart.x,
      worldY - this.selectionStart.y
    );
    this.selectionBox.fillStyle(0x00FF00, 0.1);
    this.selectionBox.fillRect(
      this.selectionStart.x,
      this.selectionStart.y,
      worldX - this.selectionStart.x,
      worldY - this.selectionStart.y
    );
  }

  private finishSelection(pointer: Phaser.Input.Pointer): void {
    if (!this.gameState || !this.selectionStart) return;

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Calculate selection box bounds
    const minX = Math.min(this.selectionStart.x, worldX);
    const maxX = Math.max(this.selectionStart.x, worldX);
    const minY = Math.min(this.selectionStart.y, worldY);
    const maxY = Math.max(this.selectionStart.y, worldY);

    // Check if it's a click (small box) or drag
    const isClick = Math.abs(maxX - minX) < 5 && Math.abs(maxY - minY) < 5;

    if (isClick) {
      // Single unit selection
      const units = this.gameState.getPublicState().units;
      let clickedUnit = null;
      let minDist = Infinity;

      for (const unit of units) {
        if (unit.playerId !== 0) continue;
        const dist = Phaser.Math.Distance.Between(worldX, worldY, unit.position.x, unit.position.y);
        if (dist < 16 && dist < minDist) {
          minDist = dist;
          clickedUnit = unit;
        }
      }

      if (clickedUnit) {
        this.selectedUnits = [clickedUnit.id];
      } else {
        this.selectedUnits = [];
      }
    } else {
      // Multi-select box
      const units = this.gameState.getPublicState().units;
      this.selectedUnits = [];

      for (const unit of units) {
        if (unit.playerId !== 0) continue;
        if (
          unit.position.x >= minX &&
          unit.position.x <= maxX &&
          unit.position.y >= minY &&
          unit.position.y <= maxY
        ) {
          this.selectedUnits.push(unit.id);
        }
      }
    }

    // Clear selection box
    if (this.selectionBox) {
      this.selectionBox.clear();
    }

    this.isSelecting = false;
    this.selectionStart = null;
    this.updateSelectionVisuals();
  }

  private handleRightClick(pointer: Phaser.Input.Pointer): void {
    if (!this.gameState || this.selectedUnits.length === 0) return;

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Move units
    this.gameState.executeCommand({
      playerId: 0,
      commandType: 'move',
      unitIds: this.selectedUnits,
      target: { x: worldX, y: worldY }
    });
  }

  private initializeMap(): void {
    if (!this.gameState || !this.mapLayer) return;

    const state = this.gameState.getPublicState();
    const mapData = state.map;
    const tileSize = 32;

    const colors: Record<string, number> = {
      'grass': 0x2D5016,
      'mountain': 0x8B7355,
      'water': 0x4A7BA7
    };

    // Create map tiles once (static)
    for (let y = 0; y < mapData.height; y++) {
      this.mapTiles[y] = [];
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.tiles[y][x];
        const px = x * tileSize;
        const py = y * tileSize;

        const rect = this.add.rectangle(
          px + tileSize / 2,
          py + tileSize / 2,
          tileSize,
          tileSize,
          colors[tile.type] || 0x2D5016,
          0.7
        );
        rect.setStrokeStyle(1, 0x444444, 0.3);
        rect.setDepth(0);
        this.mapLayer.add(rect);
        this.mapTiles[y][x] = rect;
      }
    }
  }

  private updateGameObjects(): void {
    if (!this.gameState) return;

    const state = this.gameState.getPublicState();
    const camera = this.cameras.main;
    const viewport = {
      x: camera.scrollX - 100,
      y: camera.scrollY - 100,
      width: camera.width + 200,
      height: camera.height + 200
    };

    // Update units with viewport culling
    this.updateUnits(state.units, viewport);
    
    // Update buildings with viewport culling
    this.updateBuildings(state.buildings, viewport);
    
    // Update resources with viewport culling
    this.updateResources(state.map.resources, viewport);
  }

  private updateUnits(units: any[], viewport: { x: number; y: number; width: number; height: number }): void {
    if (!this.unitLayer) return;

    const unitColors: Record<string, number> = {
      'worker': 0xFFD700,
      'soldier': 0xFF0000,
      'tank': 0x00FF00,
      'air_unit': 0x0099FF
    };

    const activeUnitIds = new Set<string>();

    // Update or create unit sprites
    for (const unit of units) {
      // Viewport culling
      if (
        unit.position.x < viewport.x ||
        unit.position.x > viewport.x + viewport.width ||
        unit.position.y < viewport.y ||
        unit.position.y > viewport.y + viewport.height
      ) {
        // Hide unit if outside viewport
        const sprite = this.unitSprites.get(unit.id);
        if (sprite) {
          sprite.container.setVisible(false);
        }
        continue;
      }

      activeUnitIds.add(unit.id);
      let sprite = this.unitSprites.get(unit.id);

      if (!sprite) {
        // Create new unit sprite
        const container = this.add.container(unit.position.x, unit.position.y);
        const circle = this.add.circle(0, 0, 10, unitColors[unit.type] || 0xFFFFFF, 0.8);
        const healthBar = this.add.graphics();
        
        container.add([circle, healthBar]);
        container.setDepth(100);
        this.unitLayer.add(container);

        sprite = {
          container,
          circle,
          healthBar,
          unitId: unit.id
        };
        this.unitSprites.set(unit.id, sprite);
      }

      // Update position
      sprite.container.setPosition(unit.position.x, unit.position.y);
      sprite.container.setVisible(true);

      // Update health bar
      sprite.healthBar.clear();
      const healthPercent = unit.health / unit.maxHealth;
      sprite.healthBar.fillStyle(0xFF0000, 0.5);
      sprite.healthBar.fillRect(-10, -20, 20, 3);
      sprite.healthBar.fillStyle(0x00FF00, 0.8);
      sprite.healthBar.fillRect(-10, -20, healthPercent * 20, 3);

      // Update selection ring
      const isSelected = this.selectedUnits.includes(unit.id);
      if (isSelected) {
        if (!sprite.selectionRing) {
          sprite.selectionRing = this.add.circle(0, 0, 15, 0x00FF00, 0);
          sprite.selectionRing.setStrokeStyle(2, 0x00FF00, 1);
          sprite.container.add(sprite.selectionRing);
        }
        sprite.selectionRing.setVisible(true);
      } else if (sprite.selectionRing) {
        sprite.selectionRing.setVisible(false);
      }
    }

    // Remove units that no longer exist
    for (const [unitId, sprite] of this.unitSprites.entries()) {
      if (!activeUnitIds.has(unitId)) {
        sprite.container.destroy();
        this.unitSprites.delete(unitId);
      }
    }
  }

  private updateBuildings(buildings: any[], viewport: { x: number; y: number; width: number; height: number }): void {
    if (!this.buildingLayer) return;

    const activeBuildingIds = new Set<string>();

    for (const building of buildings) {
      // Viewport culling
      if (
        building.position.x < viewport.x ||
        building.position.x > viewport.x + viewport.width ||
        building.position.y < viewport.y ||
        building.position.y > viewport.y + viewport.height
      ) {
        const sprite = this.buildingSprites.get(building.id);
        if (sprite) {
          sprite.container.setVisible(false);
        }
        continue;
      }

      activeBuildingIds.add(building.id);
      let sprite = this.buildingSprites.get(building.id);

      if (!sprite) {
        const container = this.add.container(building.position.x, building.position.y);
        const rect = this.add.rectangle(0, 0, 32, 32, 0x8B4513, 0.8);
        const healthBar = this.add.graphics();
        
        container.add([rect, healthBar]);
        container.setDepth(50);
        this.buildingLayer.add(container);

        sprite = {
          container,
          rect,
          healthBar,
          buildingId: building.id
        };
        this.buildingSprites.set(building.id, sprite);
      }

      sprite.container.setPosition(building.position.x, building.position.y);
      sprite.container.setVisible(true);

      // Update health bar
      sprite.healthBar.clear();
      const healthPercent = building.health / building.maxHealth;
      sprite.healthBar.fillStyle(0xFFFF00, 0.5);
      sprite.healthBar.fillRect(-14, -20, 28, 3);
      sprite.healthBar.fillStyle(0x00FF00, 0.8);
      sprite.healthBar.fillRect(-14, -20, healthPercent * 28, 3);
    }

    // Remove buildings that no longer exist
    for (const [buildingId, sprite] of this.buildingSprites.entries()) {
      if (!activeBuildingIds.has(buildingId)) {
        sprite.container.destroy();
        this.buildingSprites.delete(buildingId);
      }
    }
  }

  private updateResources(resources: any[], viewport: { x: number; y: number; width: number; height: number }): void {
    if (!this.resourceLayer) return;

    const resourceColors: Record<string, number> = {
      'matter': 0x8B4513,
      'energy': 0xFFFF00,
      'life': 0x00FF00,
      'knowledge': 0x0099FF
    };

    const activeResourceIds = new Set<string>();

    for (const resource of resources) {
      // Viewport culling
      if (
        resource.x < viewport.x ||
        resource.x > viewport.x + viewport.width ||
        resource.y < viewport.y ||
        resource.y > viewport.y + viewport.height
      ) {
        const sprite = this.resourceSprites.get(resource.id || `${resource.x}-${resource.y}`);
        if (sprite) {
          sprite.circle.setVisible(false);
        }
        continue;
      }

      const resourceId = resource.id || `${resource.x}-${resource.y}`;
      activeResourceIds.add(resourceId);
      let sprite = this.resourceSprites.get(resourceId);

      if (!sprite) {
        const circle = this.add.circle(
          resource.x,
          resource.y,
          8,
          resourceColors[resource.type] || 0xFFFFFF,
          0.6
        );
        circle.setDepth(30);
        this.resourceLayer.add(circle);

        sprite = {
          circle,
          resourceId
        };
        this.resourceSprites.set(resourceId, sprite);
      }

      sprite.circle.setPosition(resource.x, resource.y);
      sprite.circle.setVisible(true);
    }

    // Remove resources that no longer exist
    for (const [resourceId, sprite] of this.resourceSprites.entries()) {
      if (!activeResourceIds.has(resourceId)) {
        sprite.circle.destroy();
        this.resourceSprites.delete(resourceId);
      }
    }
  }

  private updateSelectionVisuals(): void {
    // Selection visuals are updated in updateUnits
    // This method can be used for additional selection effects
  }

  private createUI(): void {
    if (!this.uiLayer) return;

    // HUD panel with background
    const hudBg = this.add.rectangle(150, 100, 300, 200, 0x000000, 0.7);
    hudBg.setScrollFactor(0);
    hudBg.setStrokeStyle(2, 0x00FF00, 0.5);
    hudBg.setDepth(1000);
    this.uiLayer.add(hudBg);

    this.hudText = this.add.text(10, 10, '', {
      fontSize: '14px',
      color: '#FFFFFF',
      fontFamily: 'monospace',
      fixedWidth: 300,
      fixedHeight: 200
    });
    this.hudText.setScrollFactor(0);
    this.hudText.setDepth(1001);
    this.uiLayer.add(this.hudText);

    // Build menu
    const menuBg = this.add.rectangle(150, 295, 300, 150, 0x000000, 0.7);
    menuBg.setScrollFactor(0);
    menuBg.setStrokeStyle(2, 0xFFFF00, 0.5);
    menuBg.setDepth(1000);
    this.uiLayer.add(menuBg);

    this.buildMenu = this.add.text(10, 220, '', {
      fontSize: '12px',
      color: '#FFFF00',
      fontFamily: 'monospace',
      fixedWidth: 300,
      fixedHeight: 150
    });
    this.buildMenu.setScrollFactor(0);
    this.buildMenu.setDepth(1001);
    this.uiLayer.add(this.buildMenu);
  }

  private updateHUD(): void {
    if (!this.hudText || !this.gameState) return;

    const state = this.gameState.getPublicState();
    const player = state.players[0];
    
    let hudText = `Quaternion RTS\n`;
    hudText += `Tick: ${state.tick}\n`;
    hudText += `Matter: ${Math.floor(player.resources.matter)}\n`;
    hudText += `Energy: ${Math.floor(player.resources.energy)}\n`;
    hudText += `Life: ${Math.floor(player.resources.life)}\n`;
    hudText += `Knowledge: ${Math.floor(player.resources.knowledge)}\n`;
    hudText += `Supply: ${player.supply.current}/${player.supply.max}\n`;
    hudText += `Units: ${player.unitCount}\n`;
    hudText += `Buildings: ${player.buildingCount}\n`;
    hudText += `Selected: ${this.selectedUnits.length}\n`;
    hudText += `FPS: ${Math.round(this.game.loop.actualFps)}`;

    this.hudText.setText(hudText);
  }

  private openBuildMenu(): void {
    if (!this.buildMenu) return;
    const buildings = ['barracks', 'factory', 'airfield', 'refinery'];
    let menuText = 'BUILD MENU (Press number):\n';
    buildings.forEach((building, i) => {
      menuText += `${i + 1}. ${building}\n`;
    });
    this.buildMenu.setText(menuText);
  }

  private setAttackMode(): void {
    if (this.selectedUnits.length === 0) return;
    console.log('Attack mode enabled. Right-click target');
  }

  private selectAllUnits(): void {
    if (!this.gameState) return;
    const units = this.gameState.getPlayerUnits(0);
    this.selectedUnits = units.map(u => u.id);
    this.updateSelectionVisuals();
  }

  update(time: number, delta: number): void {
    // Update game objects with optimized rendering
    this.updateGameObjects();

    // Update HUD
    this.updateHUD();

    // Smooth camera movement with delta time
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors) {
      const speed = this.cameraPanSpeed;
      const deltaSeconds = delta / 1000; // Convert to seconds

      if (cursors.left.isDown) {
        this.cameras.main.scrollX -= speed * deltaSeconds;
      }
      if (cursors.right.isDown) {
        this.cameras.main.scrollX += speed * deltaSeconds;
      }
      if (cursors.up.isDown) {
        this.cameras.main.scrollY -= speed * deltaSeconds;
      }
      if (cursors.down.isDown) {
        this.cameras.main.scrollY += speed * deltaSeconds;
      }
    }

    // Zoom with mouse wheel
    const wheelDelta = this.input.mouseWheel?.getDeltaY() || 0;
    if (wheelDelta !== 0) {
      const currentZoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(currentZoom + wheelDelta * 0.001, 0.5, 2.0);
      this.cameras.main.setZoom(newZoom);
    }
  }
}

