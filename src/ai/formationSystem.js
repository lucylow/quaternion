/**
 * Formation System for Army Coordination
 * Manages unit positioning, formations, and tactical movements
 */

export class FormationSystem {
  constructor() {
    this.formations = new Map(); // formationId -> Formation
    this.unitFormations = new Map(); // unitId -> formationId
  }

  /**
   * Create a new formation
   */
  createFormation(units, type = 'line', target = null) {
    if (units.length === 0) return null;

    const formation = {
      id: `formation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      units: [...units],
      target,
      center: this.calculateCenter(units),
      spacing: this.getSpacing(type),
      created: Date.now()
    };

    this.formations.set(formation.id, formation);
    units.forEach(unit => {
      this.unitFormations.set(unit.id, formation.id);
    });

    return formation;
  }

  /**
   * Calculate formation center
   */
  calculateCenter(units) {
    if (units.length === 0) return { x: 0, y: 0 };

    const sum = units.reduce((acc, unit) => ({
      x: acc.x + (unit.x || 0),
      y: acc.y + (unit.y || 0)
    }), { x: 0, y: 0 });

    return {
      x: sum.x / units.length,
      y: sum.y / units.length
    };
  }

  /**
   * Get spacing for formation type
   */
  getSpacing(type) {
    const spacings = {
      'line': 8,
      'wedge': 6,
      'box': 10,
      'circle': 12,
      'column': 5
    };
    return spacings[type] || 8;
  }

  /**
   * Get target positions for units in formation
   */
  getFormationPositions(formation, facing = null) {
    const { type, units, center, spacing, target } = formation;
    const positions = [];

    if (!facing && target) {
      const dx = target.x - center.x;
      const dy = target.y - center.y;
      facing = Math.atan2(dy, dx);
    } else if (!facing) {
      facing = 0;
    }

    switch (type) {
      case 'line':
        return this.getLineFormation(units, center, spacing, facing);
      case 'wedge':
        return this.getWedgeFormation(units, center, spacing, facing);
      case 'box':
        return this.getBoxFormation(units, center, spacing, facing);
      case 'circle':
        return this.getCircleFormation(units, center, spacing);
      case 'column':
        return this.getColumnFormation(units, center, spacing, facing);
      default:
        return this.getLineFormation(units, center, spacing, facing);
    }
  }

  /**
   * Line formation
   */
  getLineFormation(units, center, spacing, facing) {
    const positions = [];
    const perpAngle = facing + Math.PI / 2;
    const offset = (units.length - 1) * spacing / 2;

    units.forEach((unit, index) => {
      const localX = (index * spacing) - offset;
      const x = center.x + localX * Math.cos(perpAngle);
      const y = center.y + localX * Math.sin(perpAngle);
      positions.push({ unitId: unit.id, x, y });
    });

    return positions;
  }

  /**
   * Wedge formation (V-shape)
   */
  getWedgeFormation(units, center, spacing, facing) {
    const positions = [];
    const rows = Math.ceil(Math.sqrt(units.length));
    let unitIndex = 0;

    for (let row = 0; row < rows && unitIndex < units.length; row++) {
      const unitsInRow = Math.min(units.length - unitIndex, row + 1);
      const rowOffset = (unitsInRow - 1) * spacing / 2;

      for (let col = 0; col < unitsInRow && unitIndex < units.length; col++) {
        const localX = (col * spacing) - rowOffset;
        const localY = -row * spacing * 0.8;

        const x = center.x + localX * Math.cos(facing) - localY * Math.sin(facing);
        const y = center.y + localX * Math.sin(facing) + localY * Math.cos(facing);

        positions.push({ unitId: units[unitIndex].id, x, y });
        unitIndex++;
      }
    }

    return positions;
  }

  /**
   * Box formation
   */
  getBoxFormation(units, center, spacing, facing) {
    const positions = [];
    const size = Math.ceil(Math.sqrt(units.length));
    const offset = (size - 1) * spacing / 2;

    units.forEach((unit, index) => {
      const row = Math.floor(index / size);
      const col = index % size;
      const localX = (col * spacing) - offset;
      const localY = (row * spacing) - offset;

      const x = center.x + localX * Math.cos(facing) - localY * Math.sin(facing);
      const y = center.y + localX * Math.sin(facing) + localY * Math.cos(facing);

      positions.push({ unitId: unit.id, x, y });
    });

    return positions;
  }

  /**
   * Circle formation
   */
  getCircleFormation(units, center, spacing) {
    const positions = [];
    const radius = (units.length * spacing) / (2 * Math.PI);

    units.forEach((unit, index) => {
      const angle = (index / units.length) * Math.PI * 2;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      positions.push({ unitId: unit.id, x, y });
    });

    return positions;
  }

  /**
   * Column formation
   */
  getColumnFormation(units, center, spacing, facing) {
    const positions = [];
    const offset = (units.length - 1) * spacing / 2;

    units.forEach((unit, index) => {
      const localY = (index * spacing) - offset;
      const x = center.x - localY * Math.sin(facing);
      const y = center.y + localY * Math.cos(facing);
      positions.push({ unitId: unit.id, x, y });
    });

    return positions;
  }

  /**
   * Update formation positions
   */
  updateFormation(formationId, newTarget = null) {
    const formation = this.formations.get(formationId);
    if (!formation) return null;

    if (newTarget) {
      formation.target = newTarget;
    }

    formation.center = this.calculateCenter(formation.units);
    return this.getFormationPositions(formation);
  }

  /**
   * Add unit to formation
   */
  addUnitToFormation(formationId, unit) {
    const formation = this.formations.get(formationId);
    if (!formation) return false;

    formation.units.push(unit);
    this.unitFormations.set(unit.id, formationId);
    return true;
  }

  /**
   * Remove unit from formation
   */
  removeUnitFromFormation(unitId) {
    const formationId = this.unitFormations.get(unitId);
    if (!formationId) return false;

    const formation = this.formations.get(formationId);
    if (formation) {
      formation.units = formation.units.filter(u => u.id !== unitId);
      if (formation.units.length === 0) {
        this.formations.delete(formationId);
      }
    }

    this.unitFormations.delete(unitId);
    return true;
  }

  /**
   * Get formation for unit
   */
  getFormationForUnit(unitId) {
    const formationId = this.unitFormations.get(unitId);
    return formationId ? this.formations.get(formationId) : null;
  }

  /**
   * Choose best formation type for situation
   */
  chooseFormationType(units, situation) {
    const unitCount = units.length;
    const hasTanks = units.some(u => u.type === 'tank');
    const hasAir = units.some(u => u.type === 'air_unit');

    // Small groups: line or column
    if (unitCount <= 3) {
      return 'line';
    }

    // Mixed units: box for defense, wedge for attack
    if (hasTanks && hasAir) {
      return situation === 'attack' ? 'wedge' : 'box';
    }

    // Large groups: circle for defense, wedge for attack
    if (unitCount > 8) {
      return situation === 'attack' ? 'wedge' : 'circle';
    }

    // Default: line formation
    return 'line';
  }

  /**
   * Disband formation
   */
  disbandFormation(formationId) {
    const formation = this.formations.get(formationId);
    if (!formation) return false;

    formation.units.forEach(unit => {
      this.unitFormations.delete(unit.id);
    });

    this.formations.delete(formationId);
    return true;
  }
}

