/**
 * Simple Unit Manager
 * Handles unit creation, management, and lifecycle
 */

export interface Unit {
  id: string;
  type: string;
  playerId: number;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  speed: number;
  state: 'idle' | 'moving' | 'attacking';
  targetPosition: { x: number; y: number } | null;
  targetUnit: string | null;
  attack?: number;
}

export class SimpleUnitManager {
  private units: Map<string, Unit>;

  constructor() {
    this.units = new Map();
  }

  addUnit(unit: Unit): void {
    this.units.set(unit.id, unit);
  }

  getUnit(id: string): Unit | undefined {
    return this.units.get(id);
  }

  removeUnit(id: string): void {
    this.units.delete(id);
  }

  getAllUnits(): Unit[] {
    return Array.from(this.units.values());
  }

  getPlayerUnits(playerId: number): Unit[] {
    return Array.from(this.units.values()).filter(u => u.playerId === playerId);
  }
}

