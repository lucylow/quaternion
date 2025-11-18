/**
 * Input Manager for RTS Controls
 * Handles mouse and keyboard input for unit selection, movement, and building placement
 */

import { UnitManager, UnitInstance } from './UnitManager';
import { MapManager } from './MapManager';
import { ResourceManager } from './ResourceManager';

export interface InputState {
  isSelecting: boolean;
  selectionStart: { x: number; y: number } | null;
  buildingMode: boolean;
  selectedBuildingType: string | null;
  controlGroups: Map<number, string[]>; // Group number -> unit IDs
}

export class InputManager {
  private unitManager: UnitManager;
  private mapManager: MapManager;
  private resourceManager: ResourceManager;
  private playerId: number;

  private state: InputState = {
    isSelecting: false,
    selectionStart: null,
    buildingMode: false,
    selectedBuildingType: null,
    controlGroups: new Map()
  };

  constructor(
    unitManager: UnitManager,
    mapManager: MapManager,
    resourceManager: ResourceManager,
    playerId: number = 1
  ) {
    this.unitManager = unitManager;
    this.mapManager = mapManager;
    this.resourceManager = resourceManager;
    this.playerId = playerId;

    // Initialize control groups
    for (let i = 1; i <= 5; i++) {
      this.state.controlGroups.set(i, []);
    }
  }

  /**
   * Setup input handlers for Phaser Scene
   */
  public setupInputHandlers(scene: Phaser.Scene): void {
    // Left click for unit selection and building placement
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 0) { // Left click
        this.handleLeftClick(scene, pointer);
      } else if (pointer.button === 2) { // Right click
        this.handleRightClick(scene, pointer);
      }
    });

    // Drag for multi-select
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && this.state.isSelecting && this.state.selectionStart) {
        this.updateSelectionBox(scene, pointer);
      }
    });

    // Release to complete selection
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 0 && this.state.isSelecting) {
        this.completeSelection(scene, pointer);
      }
    });

    // Keyboard input
    if (scene.input.keyboard) {
      scene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        this.handleKeyDown(event);
      });
    }

    // Prevent context menu on right click
    scene.input.mouse?.disableContextMenu();
  }

  /**
   * Handle left click
   */
  private handleLeftClick(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): void {
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // If in building mode, try to place building
    if (this.state.buildingMode && this.state.selectedBuildingType) {
      this.placeBuilding(scene, worldX, worldY);
      return;
    }

    // Check if clicking on a unit
    const clickedUnit = this.unitManager.getUnitAtPosition(worldX, worldY, this.playerId);
    
    if (clickedUnit) {
      // Select unit (with shift for multi-select)
      const multiSelect = scene.input.keyboard?.isDown('Shift') || false;
      this.unitManager.selectUnit(clickedUnit.id, multiSelect);
    } else {
      // Start drag selection
      this.state.isSelecting = true;
      this.state.selectionStart = { x: worldX, y: worldY };
    }
  }

  /**
   * Handle right click (move command)
   */
  private handleRightClick(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): void {
    if (this.state.buildingMode) {
      // Cancel building mode
      this.state.buildingMode = false;
      this.state.selectedBuildingType = null;
      return;
    }

    // Move selected units
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    this.unitManager.moveSelectedUnits(worldX, worldY, this.playerId);
  }

  /**
   * Update selection box during drag
   */
  private updateSelectionBox(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): void {
    if (!this.state.selectionStart) return;

    // This would typically draw a selection rectangle
    // The actual rendering should be handled by the scene's graphics
    // This method just tracks the selection area
  }

  /**
   * Complete selection box
   */
  private completeSelection(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): void {
    if (!this.state.isSelecting || !this.state.selectionStart) return;

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const multiSelect = scene.input.keyboard?.isDown('Shift') || false;

    // Select units in area
    this.unitManager.selectUnitsInArea(
      this.state.selectionStart.x,
      this.state.selectionStart.y,
      worldX,
      worldY,
      this.playerId,
      multiSelect
    );

    // Reset selection state
    this.state.isSelecting = false;
    this.state.selectionStart = null;
  }

  /**
   * Handle keyboard input
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.unitManager.deselectAllUnits();
        this.state.buildingMode = false;
        this.state.selectedBuildingType = null;
        break;

      case 'b':
      case 'B':
        this.toggleBuildingMenu();
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        this.selectControlGroup(parseInt(event.key));
        break;

      // Building hotkeys (Q, W, E, R)
      case 'q':
      case 'Q':
        this.selectBuildingType('MiningFacility');
        break;
      case 'w':
      case 'W':
        this.selectBuildingType('PowerPlant');
        break;
      case 'e':
      case 'E':
        this.selectBuildingType('Farm');
        break;
      case 'r':
      case 'R':
        this.selectBuildingType('ResearchLab');
        break;
    }
  }

  /**
   * Select control group (1-5)
   */
  private selectControlGroup(groupNumber: number): void {
    const group = this.state.controlGroups.get(groupNumber);
    if (!group) return;

    // Deselect all
    this.unitManager.deselectAllUnits();

    // Select units in group
    group.forEach(unitId => {
      this.unitManager.selectUnit(unitId, true); // Multi-select to add all
    });
  }

  /**
   * Assign selected units to control group
   */
  public assignToControlGroup(groupNumber: number): void {
    const selected = this.unitManager.getSelectedUnits();
    const unitIds = selected.map(u => u.id);
    this.state.controlGroups.set(groupNumber, unitIds);
  }

  /**
   * Toggle building menu
   */
  private toggleBuildingMenu(): void {
    this.state.buildingMode = !this.state.buildingMode;
    if (!this.state.buildingMode) {
      this.state.selectedBuildingType = null;
    }
  }

  /**
   * Select building type
   */
  public selectBuildingType(buildingType: string): void {
    this.state.buildingMode = true;
    this.state.selectedBuildingType = buildingType;
  }

  /**
   * Place building at position
   */
  private placeBuilding(scene: Phaser.Scene, x: number, y: number): boolean {
    if (!this.state.selectedBuildingType) return false;

    // Check if area is buildable (would need MapManager method)
    // For now, just check if we have resources
    const cost = this.getBuildingCost(this.state.selectedBuildingType);
    if (!this.resourceManager.canAfford(cost)) {
      console.warn('Cannot afford building');
      return false;
    }

    // Spend resources
    this.resourceManager.spendResources(cost);

    // Place building (would need MapManager.placeBuilding method)
    // For now, just log
    console.log(`Placing ${this.state.selectedBuildingType} at (${x}, ${y})`);

    // Exit building mode
    this.state.buildingMode = false;
    this.state.selectedBuildingType = null;

    return true;
  }

  /**
   * Get building cost
   */
  private getBuildingCost(buildingType: string): any {
    // This would come from a buildings config
    const costs: Record<string, any> = {
      'MiningFacility': { ore: 100 },
      'PowerPlant': { ore: 150, energy: 50 },
      'Farm': { ore: 80, biomass: 20 },
      'ResearchLab': { ore: 200, data: 50 }
    };

    return costs[buildingType] || { ore: 100 };
  }

  /**
   * Get current input state
   */
  public getState(): InputState {
    return { ...this.state };
  }

  /**
   * Check if in building mode
   */
  public isBuildingMode(): boolean {
    return this.state.buildingMode;
  }

  /**
   * Get selected building type
   */
  public getSelectedBuildingType(): string | null {
    return this.state.selectedBuildingType;
  }
}

