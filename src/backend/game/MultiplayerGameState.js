/**
 * MultiplayerGameState - Adapter for existing GameState to work with multiplayer
 * Wraps the existing GameState.js to provide multiplayer-compatible interface
 */
import { GameState } from '../../game/GameState.js';

class MultiplayerGameState {
  constructor(config) {
    this.mapWidth = config.mapWidth || 64;
    this.mapHeight = config.mapHeight || 64;
    this.seed = config.seed || Math.floor(Math.random() * 1000000);
    this.maxPlayers = config.maxPlayers || 2;
    this.currentTick = 0;

    // Initialize wrapped game state
    this.gameState = new GameState({
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      seed: this.seed,
      aiDifficulty: config.difficulty || 'medium'
    });

    // Player slot mapping
    this.playerSlots = new Map(); // playerId -> slotIndex
    this.players = [];
    
    // Initialize player slots
    for (let i = 0; i < this.maxPlayers; i++) {
      this.players.push({
        slot: i,
        playerId: null,
        eliminated: false,
        unitsKilled: 0,
        unitsLost: 0,
        buildingsConstructed: 0
      });
    }

    this.stateDeltas = [];
  }

  initializePlayer(slot) {
    if (slot >= this.maxPlayers) return;
    
    // Player is already initialized in GameState
    // We just need to track it
    this.players[slot].initialized = true;
  }

  getPlayer(slot) {
    if (slot >= this.players.length) return null;
    
    const playerData = this.gameState.players[slot + 1]; // GameState uses 1-based indexing
    if (!playerData) return null;

    // Map old resource system (minerals/gas) to quaternion system (ore/energy/biomass/data)
    // For backward compatibility, map minerals -> ore, gas -> energy
    // Initialize biomass and data to 0 if not present
    return {
      slot,
      resources: {
        ore: playerData.ore || playerData.minerals || 0,
        energy: playerData.energy || playerData.gas || 0,
        biomass: playerData.biomass || 0,
        data: playerData.data || 0
      },
      supply: {
        current: playerData.supply || 0,
        max: playerData.maxSupply || 10
      },
      units: this.getPlayerUnits(slot),
      buildings: this.getPlayerBuildings(slot),
      eliminated: this.players[slot].eliminated
    };
  }

  getPlayerUnits(slot) {
    return this.gameState.units
      .filter(unit => unit.playerId === slot + 1)
      .map(unit => ({
        id: unit.id,
        type: unit.type,
        position: { x: unit.x, y: unit.y },
        health: unit.health,
        maxHealth: unit.maxHealth,
        isMoving: unit.state === 'moving',
        inCombat: unit.state === 'attacking',
        targetPosition: unit.targetPosition,
        targetUnit: unit.targetUnit
      }));
  }

  getPlayerBuildings(slot) {
    return this.gameState.buildings
      .filter(building => building.playerId === slot + 1)
      .map(building => ({
        id: building.id,
        type: building.type,
        position: { x: building.x, y: building.y },
        health: building.health,
        maxHealth: building.maxHealth,
        producing: building.producing || false
      }));
  }

  getEnemyPlayers(slot) {
    const enemies = [];
    for (let i = 0; i < this.maxPlayers; i++) {
      if (i !== slot && !this.players[i].eliminated) {
        const player = this.getPlayer(i);
        if (player) enemies.push(player);
      }
    }
    return enemies;
  }

  getStartPosition(slot) {
    const startPositions = [
      { x: 10, y: 10 },
      { x: this.mapWidth - 10, y: this.mapHeight - 10 },
      { x: 10, y: this.mapHeight - 10 },
      { x: this.mapWidth - 10, y: 10 }
    ];
    return startPositions[slot] || { x: 32, y: 32 };
  }

  executeCommand(command) {
    const { playerId, commandType, ...params } = command;
    const slot = this.playerSlots.get(playerId);
    
    if (slot === undefined || this.players[slot].eliminated) return;

    // Convert command to GameState format
    switch (commandType) {
      case 'move':
        this.executeMove(slot, params);
        break;
      case 'attack':
        this.executeAttack(slot, params);
        break;
      case 'gather':
        this.executeGather(slot, params);
        break;
      case 'build_unit':
        this.executeBuildUnit(slot, params);
        break;
      case 'build_building':
        this.executeBuildBuilding(slot, params);
        break;
    }
  }

  executeMove(slot, { unitIds, position }) {
    unitIds.forEach(unitId => {
      const unit = this.gameState.units.find(u => u.id === unitId && u.playerId === slot + 1);
      if (unit) {
        unit.targetX = position.x;
        unit.targetY = position.y;
        unit.state = 'moving';
      }
    });
  }

  executeAttack(slot, { unitIds, targetId }) {
    unitIds.forEach(unitId => {
      const unit = this.gameState.units.find(u => u.id === unitId && u.playerId === slot + 1);
      if (unit) {
        const targetUnit = this.gameState.units.find(u => u.id === targetId);
        if (targetUnit) {
          unit.targetUnit = targetUnit;
          unit.state = 'attacking';
        }
      }
    });
  }

  executeGather(slot, { unitIds, resourceId }) {
    unitIds.forEach(unitId => {
      const unit = this.gameState.units.find(u => u.id === unitId && u.playerId === slot + 1);
      if (unit && unit.type === 'worker') {
        unit.targetResource = resourceId;
        unit.state = 'gathering';
      }
    });
  }

  executeBuildUnit(slot, { buildingId, unitType }) {
    const player = this.gameState.players[slot + 1];
    const building = this.gameState.buildings.find(b => b.id === buildingId && b.playerId === slot + 1);
    
    if (building && player) {
      const cost = this.getUnitCost(unitType);
      // Support both old (minerals/gas) and new (ore/energy/biomass/data) resource systems
      const hasResources = 
        (player.ore !== undefined ? player.ore >= (cost.ore || 0) : player.minerals >= (cost.minerals || 0)) &&
        (player.energy !== undefined ? player.energy >= (cost.energy || 0) : player.gas >= (cost.gas || 0)) &&
        (player.biomass !== undefined ? player.biomass >= (cost.biomass || 0) : true) &&
        (player.data !== undefined ? player.data >= (cost.data || 0) : true);
      
      if (hasResources) {
        // Deduct resources - support both systems
        if (player.ore !== undefined) {
          player.ore -= cost.ore || 0;
          player.energy -= cost.energy || 0;
          player.biomass -= cost.biomass || 0;
          player.data -= cost.data || 0;
        } else {
          player.minerals -= cost.minerals || 0;
          player.gas -= cost.gas || 0;
        }
        building.producing = unitType;
        building.productionProgress = 0;
      }
    }
  }

  executeBuildBuilding(slot, { buildingType, position }) {
    const player = this.gameState.players[slot + 1];
    const cost = this.getBuildingCost(buildingType);
    
    // Support both old (minerals/gas) and new (ore/energy/biomass/data) resource systems
    const hasResources = 
      (player.ore !== undefined ? player.ore >= (cost.ore || 0) : player.minerals >= (cost.minerals || 0)) &&
      (player.energy !== undefined ? player.energy >= (cost.energy || 0) : player.gas >= (cost.gas || 0)) &&
      (player.biomass !== undefined ? player.biomass >= (cost.biomass || 0) : true) &&
      (player.data !== undefined ? player.data >= (cost.data || 0) : true);
    
    if (player && hasResources) {
      // Deduct resources - support both systems
      if (player.ore !== undefined) {
        player.ore -= cost.ore || 0;
        player.energy -= cost.energy || 0;
        player.biomass -= cost.biomass || 0;
        player.data -= cost.data || 0;
      } else {
        player.minerals -= cost.minerals || 0;
        player.gas -= cost.gas || 0;
      }

      // Use GameState's createBuilding method
      this.gameState.createBuilding(
        buildingType,
        slot + 1,
        position.x,
        position.y
      );
    }
  }

  update() {
    // Update wrapped game state
    if (this.gameState.update) {
      this.gameState.update();
    }
    this.currentTick++;
  }

  getStateDeltas() {
    const deltas = [];

    for (let slot = 0; slot < this.maxPlayers; slot++) {
      const player = this.getPlayer(slot);
      if (!player) continue;

      player.units.forEach(unit => {
        deltas.push({
          type: 'unit_update',
          unitId: unit.id,
          position: unit.position,
          health: unit.health,
          state: unit.isMoving ? 'moving' : unit.inCombat ? 'combat' : 'idle'
        });
      });

      player.buildings.forEach(building => {
        deltas.push({
          type: 'building_update',
          buildingId: building.id,
          health: building.health,
          producing: building.producing
        });
      });

      deltas.push({
        type: 'player_update',
        playerSlot: slot,
        resources: player.resources,
        supply: player.supply
      });
    }

    return deltas;
  }

  getCurrentSnapshot() {
    const snapshot = {
      tick: this.currentTick,
      players: []
    };

    for (let slot = 0; slot < this.maxPlayers; slot++) {
      const player = this.getPlayer(slot);
      if (player) {
        snapshot.players.push({
          slot,
          units: player.units.map(u => ({ ...u })),
          buildings: player.buildings.map(b => ({ ...b })),
          resources: { ...player.resources },
          supply: { ...player.supply }
        });
      }
    }

    return snapshot;
  }

  getPublicState() {
    return {
      tick: this.currentTick,
      map: {
        width: this.mapWidth,
        height: this.mapHeight,
        seed: this.seed
      },
      players: this.players.map((p, slot) => {
        const player = this.getPlayer(slot);
        return {
          slot,
          units: player ? player.units.length : 0,
          buildings: player ? player.buildings.length : 0,
          resources: player ? player.resources : { ore: 0, energy: 0, biomass: 0, data: 0 }
        };
      })
    };
  }

  eliminatePlayer(slot) {
    if (slot < this.players.length) {
      this.players[slot].eliminated = true;
    }
  }

  getUnitCost(unitType) {
    // Use quaternion resource system (ore/energy/biomass/data)
    const costs = {
      worker: { ore: 50, energy: 0, biomass: 0, data: 0 },
      soldier: { ore: 100, energy: 0, biomass: 0, data: 0 },
      tank: { ore: 150, energy: 100, biomass: 0, data: 0 },
      air_unit: { ore: 125, energy: 75, biomass: 0, data: 0 }
    };
    return costs[unitType] || { ore: 0, energy: 0, biomass: 0, data: 0 };
  }

  getBuildingCost(buildingType) {
    // Use quaternion resource system (ore/energy/biomass/data)
    const costs = {
      barracks: { ore: 150, energy: 0, biomass: 0, data: 0 },
      factory: { ore: 200, energy: 100, biomass: 0, data: 0 },
      airfield: { ore: 150, energy: 100, biomass: 0, data: 0 },
      refinery: { ore: 100, energy: 0, biomass: 0, data: 0 }
    };
    return costs[buildingType] || { ore: 0, energy: 0, biomass: 0, data: 0 };
  }
}

export { MultiplayerGameState };

