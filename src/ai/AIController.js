import { UnitType } from '../units/Unit.js';
import { BuildingType } from '../buildings/Building.js';

export const AIDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

/**
 * AI Controller for computer opponents
 */
export class AIController {
  constructor(playerId, difficulty = AIDifficulty.MEDIUM) {
    this.playerId = playerId;
    this.difficulty = difficulty;
    this.lastDecisionTick = 0;
    this.decisionInterval = this.getDecisionInterval();
    this.strategy = this.initializeStrategy();
    this.buildOrder = this.getBuildOrder();
    this.buildOrderIndex = 0;
  }

  getDecisionInterval() {
    const intervals = {
      [AIDifficulty.EASY]: 180,    // 3 seconds
      [AIDifficulty.MEDIUM]: 90,   // 1.5 seconds
      [AIDifficulty.HARD]: 30      // 0.5 seconds
    };
    return intervals[this.difficulty];
  }

  initializeStrategy() {
    return {
      economyFocus: 0.5,
      militaryFocus: 0.3,
      expansionFocus: 0.2,
      aggression: this.difficulty === AIDifficulty.HARD ? 0.8 : 0.5,
      workerCount: 0,
      armySize: 0,
      baseCount: 1
    };
  }

  getBuildOrder() {
    // Standard build order
    return [
      { action: 'build_unit', unitType: UnitType.WORKER },
      { action: 'build_unit', unitType: UnitType.WORKER },
      { action: 'build_unit', unitType: UnitType.WORKER },
      { action: 'build_building', buildingType: BuildingType.BARRACKS },
      { action: 'build_unit', unitType: UnitType.WORKER },
      { action: 'build_unit', unitType: UnitType.SOLDIER },
      { action: 'build_unit', unitType: UnitType.SOLDIER },
      { action: 'build_building', buildingType: BuildingType.FACTORY },
      { action: 'build_unit', unitType: UnitType.TANK }
    ];
  }

  /**
   * Main AI update loop
   */
  update(gameState) {
    if (gameState.tick - this.lastDecisionTick < this.decisionInterval) {
      return;
    }

    this.lastDecisionTick = gameState.tick;
    this.analyzeGameState(gameState);
    this.makeDecisions(gameState);
  }

  /**
   * Analyze current game state
   */
  analyzeGameState(gameState) {
    const myUnits = gameState.units.filter(u => u.playerId === this.playerId);
    const myBuildings = gameState.buildings.filter(b => b.playerId === this.playerId);

    this.strategy.workerCount = myUnits.filter(u => u.type === UnitType.WORKER).length;
    this.strategy.armySize = myUnits.filter(u => u.type !== UnitType.WORKER).length;
    this.strategy.baseCount = myBuildings.filter(b => b.type === BuildingType.BASE).length;

    // Adjust strategy based on game state
    const player = gameState.players[this.playerId];
    if (player.minerals > 500) {
      this.strategy.militaryFocus = 0.6;
      this.strategy.economyFocus = 0.3;
    }

    if (this.strategy.workerCount < 5) {
      this.strategy.economyFocus = 0.7;
    }
  }

  /**
   * Make strategic decisions
   */
  makeDecisions(gameState) {
    const player = gameState.players[this.playerId];
    
    // Follow build order early game
    if (this.buildOrderIndex < this.buildOrder.length) {
      const order = this.buildOrder[this.buildOrderIndex];
      if (this.executeBuildOrder(gameState, order)) {
        this.buildOrderIndex++;
      }
      return;
    }

    // Mid/late game decisions
    this.manageEconomy(gameState);
    this.manageMilitary(gameState);
    this.manageArmy(gameState);
  }

  /**
   * Execute build order step
   */
  executeBuildOrder(gameState, order) {
    const player = gameState.players[this.playerId];

    if (order.action === 'build_unit') {
      return this.tryBuildUnit(gameState, order.unitType);
    } else if (order.action === 'build_building') {
      return this.tryBuildBuilding(gameState, order.buildingType);
    }

    return false;
  }

  /**
   * Try to build a unit
   */
  tryBuildUnit(gameState, unitType) {
    const player = gameState.players[this.playerId];
    const myBuildings = gameState.buildings.filter(b => 
      b.playerId === this.playerId && b.isComplete
    );

    // Find appropriate building
    let building = null;
    if (unitType === UnitType.WORKER) {
      building = myBuildings.find(b => b.type === BuildingType.BASE);
    } else if (unitType === UnitType.SOLDIER) {
      building = myBuildings.find(b => b.type === BuildingType.BARRACKS);
    } else if (unitType === UnitType.TANK) {
      building = myBuildings.find(b => b.type === BuildingType.FACTORY);
    } else if (unitType === UnitType.AIR_UNIT) {
      building = myBuildings.find(b => b.type === BuildingType.AIRFIELD);
    }

    if (!building) return false;

    // Check resources
    const unit = gameState.createUnit(unitType, this.playerId, 0, 0, true); // dry run
    if (player.minerals >= unit.cost.minerals && player.gas >= unit.cost.gas) {
      player.minerals -= unit.cost.minerals;
      player.gas -= unit.cost.gas;
      building.produceUnit(unitType, unit);
      return true;
    }

    return false;
  }

  /**
   * Try to build a building
   */
  tryBuildBuilding(gameState, buildingType) {
    const player = gameState.players[this.playerId];
    const building = gameState.createBuilding(buildingType, this.playerId, 0, 0, true); // dry run

    if (player.minerals >= building.cost.minerals && player.gas >= building.cost.gas) {
      // Find build location near base
      const base = gameState.buildings.find(b => b.playerId === this.playerId && b.type === BuildingType.BASE);
      if (base) {
        const buildX = base.x + Math.floor(Math.random() * 10) - 5;
        const buildY = base.y + Math.floor(Math.random() * 10) - 5;
        
        player.minerals -= building.cost.minerals;
        player.gas -= building.cost.gas;
        gameState.createBuilding(buildingType, this.playerId, buildX, buildY);
        return true;
      }
    }

    return false;
  }

  /**
   * Manage economy (workers and resources)
   */
  manageEconomy(gameState) {
    const player = gameState.players[this.playerId];
    const myUnits = gameState.units.filter(u => u.playerId === this.playerId);
    const workers = myUnits.filter(u => u.type === UnitType.WORKER);

    // Build more workers if needed
    if (workers.length < 12 && player.minerals >= 50) {
      this.tryBuildUnit(gameState, UnitType.WORKER);
    }

    // Assign idle workers to gather
    const idleWorkers = workers.filter(u => u.state === 'idle' && !u.gatherTarget);
    idleWorkers.forEach(worker => {
      const nearestResource = this.findNearestResource(gameState, worker);
      if (nearestResource) {
        worker.gatherResource(nearestResource);
      }
    });
  }

  /**
   * Manage military production
   */
  manageMilitary(gameState) {
    const player = gameState.players[this.playerId];

    // Build army units based on available resources
    if (player.minerals >= 150 && player.gas >= 100) {
      this.tryBuildUnit(gameState, UnitType.TANK);
    } else if (player.minerals >= 100) {
      this.tryBuildUnit(gameState, UnitType.SOLDIER);
    }
  }

  /**
   * Manage army movement and attacks
   */
  manageArmy(gameState) {
    const myUnits = gameState.units.filter(u => 
      u.playerId === this.playerId && u.type !== UnitType.WORKER
    );

    const enemyUnits = gameState.units.filter(u => u.playerId !== this.playerId);
    const enemyBuildings = gameState.buildings.filter(b => b.playerId !== this.playerId);

    // Attack if we have enough units
    const attackThreshold = this.difficulty === AIDifficulty.HARD ? 3 : 5;
    
    if (myUnits.length >= attackThreshold) {
      myUnits.forEach(unit => {
        if (unit.state === 'idle' || unit.state === 'moving') {
          // Find nearest enemy
          const nearestEnemy = this.findNearestEnemy(unit, enemyUnits, enemyBuildings);
          if (nearestEnemy) {
            if (nearestEnemy.type) {
              unit.attackUnit(nearestEnemy);
            } else {
              unit.moveToPosition(nearestEnemy.x, nearestEnemy.y);
            }
          }
        }
      });
    } else {
      // Defensive positioning
      const base = gameState.buildings.find(b => b.playerId === this.playerId && b.type === BuildingType.BASE);
      if (base) {
        myUnits.forEach(unit => {
          if (unit.state === 'idle') {
            const angle = Math.random() * Math.PI * 2;
            const distance = 10;
            unit.moveToPosition(
              base.x + Math.cos(angle) * distance,
              base.y + Math.sin(angle) * distance
            );
          }
        });
      }
    }
  }

  /**
   * Find nearest resource for worker
   */
  findNearestResource(gameState, worker) {
    const resources = gameState.map.resources.filter(r => r.amount > 0);
    if (resources.length === 0) return null;

    return resources.reduce((nearest, resource) => {
      const dist = worker.distanceTo(resource.x, resource.y);
      const nearestDist = worker.distanceTo(nearest.x, nearest.y);
      return dist < nearestDist ? resource : nearest;
    });
  }

  /**
   * Find nearest enemy
   */
  findNearestEnemy(unit, enemyUnits, enemyBuildings) {
    const enemies = [...enemyUnits, ...enemyBuildings];
    if (enemies.length === 0) return null;

    return enemies.reduce((nearest, enemy) => {
      const dist = unit.distanceTo(enemy.x, enemy.y);
      const nearestDist = nearest ? unit.distanceTo(nearest.x, nearest.y) : Infinity;
      return dist < nearestDist ? enemy : nearest;
    }, null);
  }
}
