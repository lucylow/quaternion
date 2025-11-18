/**
 * Simple Building Manager
 * Handles building creation, management, and lifecycle
 */

export interface Building {
  id: string;
  type: string;
  playerId: number;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  producing: string | null;
  productionProgress: number;
}

export class BuildingManager {
  private buildings: Map<string, Building>;

  constructor() {
    this.buildings = new Map();
  }

  addBuilding(building: Building): void {
    this.buildings.set(building.id, building);
  }

  getBuilding(id: string): Building | undefined {
    return this.buildings.get(id);
  }

  removeBuilding(id: string): void {
    this.buildings.delete(id);
  }

  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  getPlayerBuildings(playerId: number): Building[] {
    return Array.from(this.buildings.values()).filter(b => b.playerId === playerId);
  }
}

