/**
 * Simple Quaternion Game State
 * Core game state management for a playable RTS
 */

import { SimpleMapGenerator } from './map/SimpleMapGenerator';
import { SimpleMapManager } from './map/SimpleMapManager';
import { SimpleResourceManager, Player } from './systems/SimpleResourceManager';
import { SimpleUnitManager, Unit } from './systems/SimpleUnitManager';
import { BuildingManager, Building } from './systems/BuildingManager';

export interface GameConfig {
  mapWidth?: number;
  mapHeight?: number;
  seed?: number;
  maxPlayers?: number;
}

export interface PublicState {
  tick: number;
  gameTime: number;
  gameEnded: boolean;
  winner: number | null;
  players: Array<{
    id: number;
    name: string;
    resources: { matter: number; energy: number; life: number; knowledge: number };
    supply: { current: number; max: number };
    unitCount: number;
    buildingCount: number;
    eliminated: boolean;
  }>;
  units: Unit[];
  buildings: Building[];
  map: {
    width: number;
    height: number;
    tiles: any[][];
    resources: any[];
  };
}

export class SimpleQuaternionGameState {
  private config: Required<GameConfig>;
  private tick: number = 0;
  private gameTime: number = 0;
  private gameEnded: boolean = false;
  private winner: number | null = null;

  // Game systems
  private mapGenerator: SimpleMapGenerator;
  private map: SimpleMapManager;
  private resourceManager: SimpleResourceManager;
  private unitManager: SimpleUnitManager;
  private buildingManager: BuildingManager;

  // Players
  private players: Player[] = [];
  private currentPlayerIndex: number = 0;

  // Game events
  private events: any[] = [];

  constructor(config: GameConfig = {}) {
    this.config = {
      mapWidth: 64,
      mapHeight: 64,
      seed: Math.floor(Math.random() * 1000000),
      maxPlayers: 2,
      ...config
    };

    // Initialize game systems
    this.mapGenerator = new SimpleMapGenerator(this.config.seed);
    const generatedMap = this.mapGenerator.generate(this.config.mapWidth, this.config.mapHeight);
    this.map = new SimpleMapManager(
      this.config.mapWidth,
      this.config.mapHeight,
      generatedMap.tiles,
      generatedMap.getResourceNodes()
    );

    this.resourceManager = new SimpleResourceManager();
    this.unitManager = new SimpleUnitManager();
    this.buildingManager = new BuildingManager();

    // Initialize players
    this.initializePlayers();
  }

  private initializePlayers(): void {
    for (let i = 0; i < this.config.maxPlayers; i++) {
      const startPos = this.getStartPosition(i);
      this.players.push({
        id: i,
        name: `Player ${i + 1}`,
        position: startPos,
        resources: {
          matter: 500,
          energy: 300,
          life: 200,
          knowledge: 100
        },
        supply: { current: 5, max: 15 },
        units: [],
        buildings: [],
        technologies: [],
        eliminated: false,
        score: 0
      });

      // Create initial base
      this.createStartingBase(i, startPos);
    }
  }

  private getStartPosition(playerIndex: number): { x: number; y: number } {
    const positions = [
      { x: 10, y: 10 },
      { x: this.config.mapWidth - 10, y: this.config.mapHeight - 10 },
      { x: 10, y: this.config.mapHeight - 10 },
      { x: this.config.mapWidth - 10, y: 10 }
    ];
    return positions[playerIndex % positions.length];
  }

  private createStartingBase(playerIndex: number, position: { x: number; y: number }): void {
    const base: Building = {
      id: `base_${playerIndex}`,
      type: 'base',
      playerId: playerIndex,
      position: { x: position.x * 32, y: position.y * 32 },
      health: 500,
      maxHealth: 500,
      producing: null,
      productionProgress: 0
    };

    this.buildingManager.addBuilding(base);
    this.players[playerIndex].buildings.push(base.id);

    // Create initial workers
    for (let i = 0; i < 4; i++) {
      const worker: Unit = {
        id: `unit_${playerIndex}_${i}`,
        type: 'worker',
        playerId: playerIndex,
        position: {
          x: position.x * 32 + Math.random() * 64 - 32,
          y: position.y * 32 + Math.random() * 64 - 32
        },
        health: 50,
        maxHealth: 50,
        speed: 2.5,
        state: 'idle',
        targetPosition: null,
        targetUnit: null
      };

      this.unitManager.addUnit(worker);
      this.players[playerIndex].units.push(worker.id);
    }

    this.players[playerIndex].supply.current = 4;
  }

  fixedUpdate(deltaTime: number): void {
    this.tick++;
    this.gameTime += deltaTime;

    // Update units
    for (const unit of this.unitManager.getAllUnits()) {
      if (unit.state === 'idle') {
        // Unit AI
        this.updateUnitBehavior(unit);
      } else if (unit.state === 'moving') {
        this.updateUnitMovement(unit, deltaTime);
      } else if (unit.state === 'attacking') {
        this.updateUnitAttack(unit, deltaTime);
      }
    }

    // Update buildings
    for (const building of this.buildingManager.getAllBuildings()) {
      this.updateBuilding(building, deltaTime);
    }

    // Update resources
    this.resourceManager.update(this.players);

    // Check win conditions
    this.checkVictoryConditions();
  }

  private updateUnitBehavior(unit: Unit): void {
    // Simple AI: gather resources if worker
    if (unit.type === 'worker') {
      const nearestResource = this.findNearestResource(unit);
      if (nearestResource) {
        unit.state = 'moving';
        unit.targetPosition = { x: nearestResource.x, y: nearestResource.y };
      }
    }
  }

  private updateUnitMovement(unit: Unit, deltaTime: number): void {
    if (!unit.targetPosition) {
      unit.state = 'idle';
      return;
    }

    const dx = unit.targetPosition.x - unit.position.x;
    const dy = unit.targetPosition.y - unit.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      unit.position = { ...unit.targetPosition };
      unit.state = 'idle';
      unit.targetPosition = null;
    } else {
      const moveDistance = unit.speed * deltaTime * 60; // Convert to pixels per second
      const angle = Math.atan2(dy, dx);
      unit.position.x += Math.cos(angle) * moveDistance;
      unit.position.y += Math.sin(angle) * moveDistance;
    }
  }

  private updateUnitAttack(unit: Unit, deltaTime: number): void {
    if (!unit.targetUnit) {
      unit.state = 'idle';
      return;
    }

    const target = this.unitManager.getUnit(unit.targetUnit);
    if (!target || target.health <= 0) {
      unit.state = 'idle';
      unit.targetUnit = null;
      return;
    }

    const dx = target.position.x - unit.position.x;
    const dy = target.position.y - unit.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Attack range is 100 pixels
    if (distance < 100) {
      const attackDamage = (unit.attack || 10) * deltaTime * 60;
      target.health -= attackDamage;
      if (target.health <= 0) {
        this.unitManager.removeUnit(target.id);
        unit.state = 'idle';
        unit.targetUnit = null;
      }
    } else {
      // Move towards target
      unit.state = 'moving';
      unit.targetPosition = { ...target.position };
    }
  }

  private updateBuilding(building: Building, deltaTime: number): void {
    if (building.producing && building.productionProgress < 100) {
      building.productionProgress += 50 * deltaTime; // 2 seconds to produce

      if (building.productionProgress >= 100) {
        this.completeProduction(building);
      }
    }
  }

  private completeProduction(building: Building): void {
    const player = this.players[building.playerId];

    if (building.producing === 'worker') {
      const newUnit: Unit = {
        id: `unit_${building.playerId}_${Date.now()}`,
        type: 'worker',
        playerId: building.playerId,
        position: { ...building.position },
        health: 50,
        maxHealth: 50,
        speed: 2.5,
        state: 'idle',
        targetPosition: null,
        targetUnit: null
      };

      this.unitManager.addUnit(newUnit);
      player.units.push(newUnit.id);
      player.supply.current++;
    }

    building.producing = null;
    building.productionProgress = 0;
  }

  private findNearestResource(unit: Unit): { x: number; y: number } | null {
    const resources = this.map.getResourceNodes();
    let nearest: { x: number; y: number } | null = null;
    let minDistance = Infinity;

    resources.forEach(resource => {
      const dx = resource.x - unit.position.x;
      const dy = resource.y - unit.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { x: resource.x, y: resource.y };
      }
    });

    return nearest;
  }

  executeCommand(command: {
    playerId: number;
    commandType: string;
    unitIds?: string[];
    target?: any;
    buildingType?: string;
  }): boolean {
    const { playerId, commandType, unitIds = [], target, buildingType } = command;
    const player = this.players[playerId];

    if (!player || player.eliminated) return false;

    switch (commandType) {
      case 'move':
        return this.moveUnits(playerId, unitIds, target);
      case 'attack':
        return this.attackWithUnits(playerId, unitIds, target);
      case 'build_unit':
        return this.buildUnit(playerId, target.buildingId, buildingType);
      case 'build_building':
        return this.buildBuilding(playerId, buildingType, target);
      default:
        return false;
    }
  }

  private moveUnits(playerId: number, unitIds: string[], targetPos: { x: number; y: number }): boolean {
    unitIds.forEach(unitId => {
      const unit = this.unitManager.getUnit(unitId);
      if (unit && unit.playerId === playerId) {
        unit.state = 'moving';
        unit.targetPosition = targetPos;
      }
    });
    return true;
  }

  private attackWithUnits(playerId: number, unitIds: string[], targetUnitId: string): boolean {
    const targetUnit = this.unitManager.getUnit(targetUnitId);
    if (!targetUnit) return false;

    unitIds.forEach(unitId => {
      const unit = this.unitManager.getUnit(unitId);
      if (unit && unit.playerId === playerId) {
        unit.state = 'attacking';
        unit.targetUnit = targetUnitId;
      }
    });
    return true;
  }

  private buildUnit(playerId: number, buildingId: string, unitType: string | undefined): boolean {
    if (!unitType) return false;
    const building = this.buildingManager.getBuilding(buildingId);
    if (!building || building.playerId !== playerId) return false;

    const player = this.players[playerId];
    const cost = this.getUnitCost(unitType);

    if (player.resources.matter < cost.matter) return false;
    if (player.supply.current >= player.supply.max) return false;

    player.resources.matter -= cost.matter;
    building.producing = unitType;
    building.productionProgress = 0;

    return true;
  }

  private buildBuilding(playerId: number, buildingType: string | undefined, position: { x: number; y: number }): boolean {
    if (!buildingType) return false;
    const player = this.players[playerId];
    const cost = this.getBuildingCost(buildingType);

    if (player.resources.matter < cost.matter) return false;
    if (player.resources.energy < cost.energy) return false;

    player.resources.matter -= cost.matter;
    player.resources.energy -= cost.energy;

    const building: Building = {
      id: `building_${playerId}_${Date.now()}`,
      type: buildingType,
      playerId,
      position,
      health: this.getBuildingMaxHealth(buildingType),
      maxHealth: this.getBuildingMaxHealth(buildingType),
      producing: null,
      productionProgress: 0
    };

    this.buildingManager.addBuilding(building);
    player.buildings.push(building.id);

    return true;
  }

  private getUnitCost(unitType: string): { matter: number; energy: number; life: number; knowledge: number } {
    const costs: Record<string, { matter: number; energy: number; life: number; knowledge: number }> = {
      'worker': { matter: 50, energy: 0, life: 0, knowledge: 0 },
      'soldier': { matter: 100, energy: 0, life: 0, knowledge: 0 },
      'tank': { matter: 150, energy: 100, life: 0, knowledge: 0 },
      'air_unit': { matter: 125, energy: 75, life: 0, knowledge: 0 }
    };
    return costs[unitType] || costs['worker'];
  }

  private getBuildingCost(buildingType: string): { matter: number; energy: number; life: number; knowledge: number } {
    const costs: Record<string, { matter: number; energy: number; life: number; knowledge: number }> = {
      'barracks': { matter: 150, energy: 0, life: 0, knowledge: 0 },
      'factory': { matter: 200, energy: 100, life: 0, knowledge: 0 },
      'airfield': { matter: 150, energy: 100, life: 0, knowledge: 0 },
      'refinery': { matter: 100, energy: 0, life: 0, knowledge: 0 }
    };
    return costs[buildingType] || costs['barracks'];
  }

  private getBuildingMaxHealth(buildingType: string): number {
    const health: Record<string, number> = {
      'base': 500,
      'barracks': 300,
      'factory': 350,
      'airfield': 300,
      'refinery': 200
    };
    return health[buildingType] || 200;
  }

  private checkVictoryConditions(): void {
    // Check if only one player remains
    const activePlayers = this.players.filter(p => !p.eliminated).length;

    if (activePlayers === 1) {
      this.gameEnded = true;
      const winner = this.players.find(p => !p.eliminated);
      this.winner = winner ? winner.id : null;
    }

    // Check resource victory (2000 resources collected)
    this.players.forEach(player => {
      const totalResources = player.resources.matter + player.resources.energy +
                            player.resources.life + player.resources.knowledge;
      if (totalResources >= 2000) {
        this.gameEnded = true;
        this.winner = player.id;
      }
    });
  }

  getPublicState(): PublicState {
    return {
      tick: this.tick,
      gameTime: this.gameTime,
      gameEnded: this.gameEnded,
      winner: this.winner,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        resources: p.resources,
        supply: p.supply,
        unitCount: p.units.length,
        buildingCount: p.buildings.length,
        eliminated: p.eliminated
      })),
      units: this.unitManager.getAllUnits(),
      buildings: this.buildingManager.getAllBuildings(),
      map: this.map.getPublicData()
    };
  }

  getUnitManager(): SimpleUnitManager {
    return this.unitManager;
  }

  getPlayerUnits(playerId: number): Unit[] {
    return this.unitManager.getPlayerUnits(playerId);
  }
}

