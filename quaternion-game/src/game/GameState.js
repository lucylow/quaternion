import { MapGenerator } from '../map/MapGenerator.js';
import { Unit, UnitType } from '../units/Unit.js';
import { Building, BuildingType } from '../buildings/Building.js';
import { AIController, AIDifficulty } from '../ai/AIController.js';

/**
 * Main game state manager
 */
export class GameState {
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.tick = 0;
    this.tickRate = 60; // 60 ticks per second
    this.isRunning = false;
    
    // Generate map
    const mapGen = new MapGenerator(
      config.mapWidth || 64,
      config.mapHeight || 64,
      config.seed || Date.now()
    );
    this.map = mapGen.generate();
    
    // Initialize players
    this.players = {
      1: {
        id: 1,
        name: 'Player 1',
        isAI: false,
        minerals: 200,
        gas: 0,
        supply: 0,
        maxSupply: 10
      },
      2: {
        id: 2,
        name: 'AI Opponent',
        isAI: true,
        minerals: 200,
        gas: 0,
        supply: 0,
        maxSupply: 10
      }
    };
    
    // Game entities
    this.units = [];
    this.buildings = [];
    this.projectiles = [];
    
    // AI controllers
    this.aiControllers = [];
    if (this.players[2].isAI) {
      this.aiControllers.push(new AIController(2, config.aiDifficulty || AIDifficulty.MEDIUM));
    }
    
    // Initialize starting units and buildings
    this.initializeStartingUnits();
    
    // Event queue
    this.eventQueue = [];
    
    // Game loop
    this.lastTickTime = Date.now();
    this.tickInterval = null;
  }

  generateId() {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Initialize starting units and buildings for each player
   */
  initializeStartingUnits() {
    this.map.startPositions.forEach(start => {
      const playerId = start.playerId;
      
      // Create base
      this.createBuilding(BuildingType.BASE, playerId, start.x, start.y);
      
      // Create starting workers
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const distance = 3;
        this.createUnit(
          UnitType.WORKER,
          playerId,
          start.x + Math.cos(angle) * distance,
          start.y + Math.sin(angle) * distance
        );
      }
    });
  }

  /**
   * Create a new unit
   */
  createUnit(unitType, playerId, x, y, dryRun = false) {
    const id = `unit_${this.units.length}_${Date.now()}`;
    const unit = new Unit(id, unitType, playerId, x, y);
    
    if (!dryRun) {
      this.units.push(unit);
      this.players[playerId].supply += 1;
    }
    
    return unit;
  }

  /**
   * Create a new building
   */
  createBuilding(buildingType, playerId, x, y, dryRun = false) {
    const id = `building_${this.buildings.length}_${Date.now()}`;
    const building = new Building(id, buildingType, playerId, x, y);
    
    if (!dryRun) {
      this.buildings.push(building);
      
      // Increase max supply for bases
      if (buildingType === BuildingType.BASE) {
        this.players[playerId].maxSupply += 10;
      }
    }
    
    return building;
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTickTime = Date.now();
    
    // Run at 60 ticks per second
    this.tickInterval = setInterval(() => {
      this.update();
    }, 1000 / this.tickRate);
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Main game update loop
   */
  update() {
    this.tick++;
    
    // Process event queue
    this.processEvents();
    
    // Update AI
    this.aiControllers.forEach(ai => ai.update(this));
    
    // Update all units
    this.units.forEach(unit => unit.update(this));
    
    // Update all buildings
    this.buildings.forEach(building => building.update(this));
    
    // Remove dead units
    this.units = this.units.filter(unit => unit.hp > 0);
    
    // Remove destroyed buildings
    this.buildings = this.buildings.filter(building => building.hp > 0);
    
    // Check win conditions
    this.checkWinConditions();
  }

  /**
   * Process queued events/commands
   */
  processEvents() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      this.handleEvent(event);
    }
  }

  /**
   * Handle a game event/command
   */
  handleEvent(event) {
    switch (event.type) {
      case 'move':
        this.handleMoveCommand(event);
        break;
      case 'attack':
        this.handleAttackCommand(event);
        break;
      case 'gather':
        this.handleGatherCommand(event);
        break;
      case 'build_unit':
        this.handleBuildUnitCommand(event);
        break;
      case 'build_building':
        this.handleBuildBuildingCommand(event);
        break;
    }
  }

  /**
   * Handle move command
   */
  handleMoveCommand(event) {
    const units = this.units.filter(u => event.unitIds.includes(u.id));
    units.forEach(unit => {
      unit.moveToPosition(event.x, event.y);
    });
  }

  /**
   * Handle attack command
   */
  handleAttackCommand(event) {
    const units = this.units.filter(u => event.unitIds.includes(u.id));
    const target = this.units.find(u => u.id === event.targetId) ||
                   this.buildings.find(b => b.id === event.targetId);
    
    if (target) {
      units.forEach(unit => {
        unit.attackUnit(target);
      });
    }
  }

  /**
   * Handle gather command
   */
  handleGatherCommand(event) {
    const units = this.units.filter(u => event.unitIds.includes(u.id));
    const resource = this.map.resources.find(r => r.id === event.resourceId);
    
    if (resource) {
      units.forEach(unit => {
        if (unit.type === UnitType.WORKER) {
          unit.gatherResource(resource);
        }
      });
    }
  }

  /**
   * Handle build unit command
   */
  handleBuildUnitCommand(event) {
    const building = this.buildings.find(b => b.id === event.buildingId);
    if (!building || !building.isComplete) return;
    
    const player = this.players[building.playerId];
    const unit = this.createUnit(event.unitType, building.playerId, 0, 0, true);
    
    if (player.minerals >= unit.cost.minerals && player.gas >= unit.cost.gas) {
      player.minerals -= unit.cost.minerals;
      player.gas -= unit.cost.gas;
      building.produceUnit(event.unitType, unit);
    }
  }

  /**
   * Handle build building command
   */
  handleBuildBuildingCommand(event) {
    const player = this.players[event.playerId];
    const building = this.createBuilding(event.buildingType, event.playerId, 0, 0, true);
    
    if (player.minerals >= building.cost.minerals && player.gas >= building.cost.gas) {
      player.minerals -= building.cost.minerals;
      player.gas -= building.cost.gas;
      this.createBuilding(event.buildingType, event.playerId, event.x, event.y);
    }
  }

  /**
   * Check win conditions
   */
  checkWinConditions() {
    for (let playerId in this.players) {
      const playerUnits = this.units.filter(u => u.playerId == playerId);
      const playerBuildings = this.buildings.filter(b => b.playerId == playerId);
      
      if (playerUnits.length === 0 && playerBuildings.length === 0) {
        this.endGame(playerId);
      }
    }
  }

  /**
   * End the game
   */
  endGame(loserPlayerId) {
    this.stop();
    this.winner = Object.keys(this.players).find(id => id != loserPlayerId);
    console.log(`Game Over! Player ${this.winner} wins!`);
  }

  /**
   * Queue a command/event
   */
  queueEvent(event) {
    this.eventQueue.push(event);
  }

  /**
   * Get current game state for client
   */
  getState(playerId = null) {
    return {
      id: this.id,
      tick: this.tick,
      isRunning: this.isRunning,
      winner: this.winner,
      players: this.players,
      units: this.units.map(u => u.serialize()),
      buildings: this.buildings.map(b => b.serialize()),
      map: {
        width: this.map.width,
        height: this.map.height,
        resources: this.map.resources
      }
    };
  }

  /**
   * Serialize full game state
   */
  serialize() {
    return {
      id: this.id,
      tick: this.tick,
      isRunning: this.isRunning,
      map: this.map,
      players: this.players,
      units: this.units.map(u => u.serialize()),
      buildings: this.buildings.map(b => b.serialize())
    };
  }
}
