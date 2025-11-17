/**
 * Tactical Unit Management System
 * Manages unit roles, formations, and tactical behaviors
 */

import { GameState } from './AITileEvaluator';
import { TerrainAIAgent } from './TerrainAIPersonality';

export enum UnitRole {
  RECON = 'recon',
  SENTRY = 'sentry',
  FLANKER = 'flanker',
  DEFENDER = 'defender',
  ATTACKER = 'attacker',
  BODYGUARD = 'bodyguard',
  AMBUSHER = 'ambusher',
  REPAIR = 'repair',
  CONSTRUCT = 'construct',
  SUPPORT = 'support',
  GENERAL = 'general'
}

export enum UnitBehavior {
  HOLD_POSITION = 'hold_position',
  PATROL = 'patrol',
  PURSUE = 'pursue',
  RETREAT = 'retreat',
  SCOUT = 'scout',
  DEFEND = 'defend',
  ATTACK = 'attack'
}

export interface AIUnit {
  id: string;
  type: string;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  assignedRole?: UnitRole;
  currentBehavior?: UnitBehavior;
  isConcealed?: boolean;
  targetPosition?: { x: number; y: number };
  targetUnit?: string;
}

export interface UnitTacticalAction {
  unitId: string;
  action: 'move' | 'attack' | 'hold' | 'retreat' | 'ability';
  target?: { x: number; y: number } | string;
  reasoning: string;
  priority: number;
}

export class AIUnitController {
  /**
   * Assign optimal roles to units
   */
  assignUnitRoles(
    units: AIUnit[],
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): void {
    for (const unit of units) {
      const role = this.determineOptimalRole(unit, state, agent, playerId);
      unit.assignedRole = role;
    }
  }

  /**
   * Determine optimal role for a unit
   */
  private determineOptimalRole(
    unit: AIUnit,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): UnitRole {
    const unitType = unit.type.toLowerCase();

    // Role assignment based on unit capabilities and terrain
    if (unitType.includes('scout') || unitType.includes('recon')) {
      if (this.hasUnexploredHighGround(state, playerId)) {
        return UnitRole.RECON;
      }
      if (this.hasDynamicTilesToMonitor(state)) {
        return UnitRole.SENTRY;
      }
      return UnitRole.FLANKER;
    }

    if (unitType.includes('assault') || unitType.includes('soldier')) {
      const currentTile = this.getTileAtPosition(unit.position, state);
      if (currentTile && this.isInDefensiblePosition(currentTile, state, playerId)) {
        return UnitRole.DEFENDER;
      }
      if (this.hasVulnerableEnemyTargets(state, playerId)) {
        return UnitRole.ATTACKER;
      }
      return UnitRole.BODYGUARD;
    }

    if (unitType.includes('engineer') || unitType.includes('worker')) {
      if (this.hasDamagedStructures(state, playerId)) {
        return UnitRole.REPAIR;
      }
      if (this.canBuildDefensivePosition(state, playerId)) {
        return UnitRole.CONSTRUCT;
      }
      return UnitRole.SUPPORT;
    }

    if (unitType.includes('sniper') || unitType.includes('ranged')) {
      return UnitRole.AMBUSHER;
    }

    return UnitRole.GENERAL;
  }

  /**
   * Execute unit tactics based on assigned roles
   */
  executeUnitTactics(
    unit: AIUnit,
    state: GameState,
    agent: TerrainAIAgent,
    playerId: string
  ): UnitTacticalAction | null {
    if (!unit.assignedRole) {
      unit.assignedRole = this.determineOptimalRole(unit, state, agent, playerId);
    }

    switch (unit.assignedRole) {
      case UnitRole.RECON:
        return this.executeReconBehavior(unit, state, playerId);
      case UnitRole.SENTRY:
        return this.executeSentryBehavior(unit, state, playerId);
      case UnitRole.FLANKER:
        return this.executeFlankerBehavior(unit, state, playerId);
      case UnitRole.DEFENDER:
        return this.executeDefenderBehavior(unit, state, playerId);
      case UnitRole.AMBUSHER:
        return this.executeAmbushBehavior(unit, state, playerId);
      case UnitRole.ATTACKER:
        return this.executeAttackerBehavior(unit, state, playerId);
      default:
        return this.executeGeneralBehavior(unit, state, playerId);
    }
  }

  /**
   * Execute recon behavior
   */
  private executeReconBehavior(
    unit: AIUnit,
    state: GameState,
    playerId: string
  ): UnitTacticalAction | null {
    const unexploredHighValue = this.getUnexploredHighValueTiles(state, playerId);

    if (unexploredHighValue.length > 0) {
      const explorationTarget = this.getHighestPriorityReconTarget(unexploredHighValue, state);
      return {
        unitId: unit.id,
        action: 'move',
        target: explorationTarget,
        reasoning: 'Exploring high-value unknown territory',
        priority: 0.8
      };
    } else {
      // Fall back to sentry behavior
      return this.executeSentryBehavior(unit, state, playerId);
    }
  }

  /**
   * Execute sentry behavior
   */
  private executeSentryBehavior(
    unit: AIUnit,
    state: GameState,
    playerId: string
  ): UnitTacticalAction | null {
    const observationPoints = this.findObservationPoints(state, playerId);
    
    if (observationPoints.length > 0) {
      const nearestPoint = this.findNearestPoint(unit.position, observationPoints);
      return {
        unitId: unit.id,
        action: 'move',
        target: nearestPoint,
        reasoning: 'Patrolling key observation point',
        priority: 0.6
      };
    }

    return {
      unitId: unit.id,
      action: 'hold',
      reasoning: 'Holding position as sentry',
      priority: 0.4
    };
  }

  /**
   * Execute flanker behavior
   */
  private executeFlankerBehavior(
    unit: AIUnit,
    state: GameState,
    playerId: string
  ): UnitTacticalAction | null {
    const enemyPosition = this.getPrimaryEnemyPosition(state, playerId);
    if (!enemyPosition) {
      return null;
    }

    const flankingPosition = this.findFlankingPosition(unit.position, enemyPosition, state);
    if (flankingPosition) {
      return {
        unitId: unit.id,
        action: 'move',
        target: flankingPosition,
        reasoning: 'Moving to flanking position',
        priority: 0.7
      };
    }

    return null;
  }

  /**
   * Execute defender behavior
   */
  private executeDefenderBehavior(
    unit: AIUnit,
    state: GameState,
    playerId: string
  ): UnitTacticalAction | null {
    const currentTile = this.getTileAtPosition(unit.position, state);
    if (!currentTile) {
      return null;
    }

    // Check for nearby threats
    const nearbyEnemies = this.findNearbyEnemies(unit.position, state, playerId, 5);
    if (nearbyEnemies.length > 0) {
      const nearestEnemy = nearbyEnemies[0];
      return {
        unitId: unit.id,
        action: 'attack',
        target: nearestEnemy.id,
        reasoning: 'Defending position against enemy',
        priority: 0.9
      };
    }

    return {
      unitId: unit.id,
      action: 'hold',
      reasoning: 'Holding defensive position',
      priority: 0.5
    };
  }

  /**
   * Execute ambush behavior
   */
  private executeAmbushBehavior(
    unit: AIUnit,
    state: GameState,
    playerId: string
  ): UnitTacticalAction | null {
    const ambushPositions = this.findAmbushLocations(unit, state, playerId);

    if (ambushPositions.length > 0) {
      const bestAmbush = this.selectBestAmbushPosition(ambushPositions, state, playerId);
      return {
        unitId: unit.id,
        action: 'move',
        target: bestAmbush,
        reasoning: 'Moving to ambush position',
        priority: 0.8
      };
    } else {
      // Fall back to flanking behavior
      return this.executeFlankerBehavior(unit, state, playerId);
    }
  }

  /**
   * Execute attacker behavior
   */
  private executeAttackerBehavior(
    unit: AIUnit,
    state: GameState,
    playerId: string
  ): UnitTacticalAction | null {
    const vulnerableTargets = this.findVulnerableEnemyTargets(state, playerId);
    
    if (vulnerableTargets.length > 0) {
      const target = vulnerableTargets[0];
      return {
        unitId: unit.id,
        action: 'attack',
        target: target.id,
        reasoning: 'Attacking vulnerable enemy target',
        priority: 0.9
      };
    }

    return null;
  }

  /**
   * Execute general behavior
   */
  private executeGeneralBehavior(
    unit: AIUnit,
    state: GameState,
    playerId: string
  ): UnitTacticalAction | null {
    return {
      unitId: unit.id,
      action: 'hold',
      reasoning: 'General purpose unit holding position',
      priority: 0.3
    };
  }

  // Helper methods

  private getTileAtPosition(position: { x: number; y: number }, state: GameState) {
    return state.map.getTile(position.x, position.y);
  }

  private hasUnexploredHighGround(state: GameState, playerId: string): boolean {
    // Simplified check
    return true;
  }

  private hasDynamicTilesToMonitor(state: GameState): boolean {
    // Simplified check
    return false;
  }

  private isInDefensiblePosition(tile: any, state: GameState, playerId: string): boolean {
    return (tile.defenseBonus || 0) > 0.3 || (tile.isChokepoint || false);
  }

  private hasVulnerableEnemyTargets(state: GameState, playerId: string): boolean {
    const enemyUnits = state.units.filter(u => u.playerId !== playerId);
    return enemyUnits.some(e => (e.health / e.maxHealth) < 0.5);
  }

  private hasDamagedStructures(state: GameState, playerId: string): boolean {
    // Simplified check
    return false;
  }

  private canBuildDefensivePosition(state: GameState, playerId: string): boolean {
    // Simplified check
    return false;
  }

  private getUnexploredHighValueTiles(state: GameState, playerId: string): Array<{ x: number; y: number }> {
    // Simplified - return empty for now
    return [];
  }

  private getHighestPriorityReconTarget(
    tiles: Array<{ x: number; y: number }>,
    state: GameState
  ): { x: number; y: number } {
    return tiles[0] || { x: 0, y: 0 };
  }

  private findObservationPoints(state: GameState, playerId: string): Array<{ x: number; y: number }> {
    // Simplified - return empty for now
    return [];
  }

  private findNearestPoint(
    position: { x: number; y: number },
    points: Array<{ x: number; y: number }>
  ): { x: number; y: number } {
    if (points.length === 0) return position;
    
    return points.reduce((nearest, current) => {
      const dist1 = this.distance(position, nearest);
      const dist2 = this.distance(position, current);
      return dist2 < dist1 ? current : nearest;
    });
  }

  private getPrimaryEnemyPosition(state: GameState, playerId: string): { x: number; y: number } | null {
    const enemyUnits = state.units.filter(u => u.playerId !== playerId);
    if (enemyUnits.length === 0) return null;
    return enemyUnits[0].position;
  }

  private findFlankingPosition(
    unitPos: { x: number; y: number },
    enemyPos: { x: number; y: number },
    state: GameState
  ): { x: number; y: number } | null {
    // Calculate perpendicular position
    const dx = enemyPos.x - unitPos.x;
    const dy = enemyPos.y - unitPos.y;
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const distance = 5;

    return {
      x: enemyPos.x + Math.cos(angle) * distance,
      y: enemyPos.y + Math.sin(angle) * distance
    };
  }

  private findNearbyEnemies(
    position: { x: number; y: number },
    state: GameState,
    playerId: string,
    range: number
  ): AIUnit[] {
    return state.units.filter(u => {
      if (u.playerId === playerId) return false;
      const dist = this.distance(position, u.position);
      return dist <= range;
    });
  }

  private findAmbushLocations(
    unit: AIUnit,
    state: GameState,
    playerId: string
  ): Array<{ x: number; y: number }> {
    // Simplified - return empty for now
    return [];
  }

  private selectBestAmbushPosition(
    positions: Array<{ x: number; y: number }>,
    state: GameState,
    playerId: string
  ): { x: number; y: number } {
    return positions[0] || { x: 0, y: 0 };
  }

  private findVulnerableEnemyTargets(state: GameState, playerId: string): AIUnit[] {
    return state.units.filter(u => {
      if (u.playerId === playerId) return false;
      return (u.health / u.maxHealth) < 0.6;
    });
  }

  private distance(
    pos1: { x: number; y: number },
    pos2: { x: number; y: number }
  ): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

