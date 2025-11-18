/**
 * MultiplayerAIController - Deterministic AI with Difficulty Scaling
 * Adapter for existing AIController to work with multiplayer game state
 */
import { AIController, AIDifficulty } from '../../ai/AIController.js';

class MultiplayerAIController {
  constructor(config) {
    this.playerId = config.playerId;
    this.difficulty = config.difficulty || 'medium';
    this.slot = config.slot;
    this.gameSession = config.gameSession;

    // Difficulty settings
    this.difficultySettings = {
      easy: {
        decisionInterval: 180, // ticks (3 seconds at 60 Hz)
        aggressionFactor: 0.3,
        reactionTime: 120,
        buildOrderQuality: 0.5,
        microSkill: 0.2
      },
      medium: {
        decisionInterval: 90, // 1.5 seconds
        aggressionFactor: 0.6,
        reactionTime: 60,
        buildOrderQuality: 0.75,
        microSkill: 0.5
      },
      hard: {
        decisionInterval: 30, // 0.5 seconds
        aggressionFactor: 0.9,
        reactionTime: 15,
        buildOrderQuality: 1.0,
        microSkill: 0.9
      }
    };

    this.settings = this.difficultySettings[this.difficulty] || this.difficultySettings.medium;
    this.lastDecisionTick = 0;
    this.state = new AIState(this.slot);

    // Initialize wrapped AIController
    const difficultyMap = {
      easy: AIDifficulty.EASY,
      medium: AIDifficulty.MEDIUM,
      hard: AIDifficulty.HARD
    };
    
    this.aiController = new AIController(
      this.slot + 1, // AIController uses 1-based player IDs
      difficultyMap[this.difficulty] || AIDifficulty.MEDIUM
    );
  }

  getTick(gameState) {
    const currentTick = gameState.currentTick;
    const actions = [];

    // Make decisions at appropriate intervals
    if (currentTick - this.lastDecisionTick >= this.settings.decisionInterval) {
      this.lastDecisionTick = currentTick;

      // Strategic decision making
      const strategicActions = this.updateStrategy(gameState);
      actions.push(...strategicActions);
    }

    // Continuous micro management
    const tacticActions = this.executeTactics(gameState);
    actions.push(...tacticActions);

    // Build order execution
    const buildActions = this.executeBuildOrder(gameState);
    actions.push(...buildActions);

    return actions;
  }

  updateStrategy(gameState) {
    const actions = [];
    const playerState = gameState.getPlayer(this.slot);

    if (!playerState) return actions;

    // Analyze game state
    const threat = this.analyzeThreat(gameState);
    const economy = this.analyzeEconomy(playerState);
    const militaryPower = this.calculateMilitaryPower(gameState);

    // Update strategic intent
    this.state.updateStrategicIntent(threat, economy, militaryPower, this.settings);

    // Execute strategy
    switch (this.state.currentStrategy) {
      case 'expansion':
        actions.push(...this.executeExpansionStrategy(gameState));
        break;
      case 'defense':
        actions.push(...this.executeDefenseStrategy(gameState));
        break;
      case 'aggression':
        actions.push(...this.executeAggressionStrategy(gameState));
        break;
      case 'tech':
        actions.push(...this.executeTechStrategy(gameState));
        break;
    }

    return actions;
  }

  analyzeThreat(gameState) {
    let totalThreat = 0;
    const enemies = gameState.getEnemyPlayers(this.slot);

    enemies.forEach(enemy => {
      const enemyMilitaryPower = this.calculateMilitaryPower(gameState, enemy.slot);
      const distance = this.calculateAverageDistance(gameState, enemy.slot);
      
      totalThreat += (enemyMilitaryPower / Math.max(distance, 1)) * 0.5;
    });

    return Math.min(totalThreat, 1.0);
  }

  analyzeEconomy(playerState) {
    const workers = playerState.units.filter(u => u.type === 'worker');
    // Use quaternion resource system (ore/energy/biomass/data)
    const ore = playerState.resources.ore || 0;
    const energy = playerState.resources.energy || 0;
    const biomass = playerState.resources.biomass || 0;
    const data = playerState.resources.data || 0;
    
    const orePerWorker = ore / Math.max(workers.length, 1);
    const energyPerWorker = energy / Math.max(workers.length, 1);
    const totalResources = ore + energy + biomass + data;
    const resourcesPerWorker = totalResources / Math.max(workers.length, 1);
    const supplyCap = playerState.supply.current / playerState.supply.max;

    return {
      resourcesPerWorker,
      orePerWorker,
      energyPerWorker,
      supplyCap,
      economyHealth: resourcesPerWorker / 200 // Normalize to similar scale
    };
  }

  calculateMilitaryPower(gameState, slot = this.slot) {
    const player = gameState.getPlayer(slot);
    if (!player) return 0;

    let power = 0;

    player.units.forEach(unit => {
      const unitPower = {
        worker: 5,
        soldier: 15,
        tank: 35,
        air_unit: 25
      };
      power += unitPower[unit.type] || 0;
    });

    player.buildings.forEach(building => {
      const buildingPower = {
        barracks: 5,
        factory: 10,
        airfield: 10
      };
      power += buildingPower[building.type] || 0;
    });

    return power;
  }

  calculateAverageDistance(gameState, enemySlot) {
    const myUnits = gameState.getPlayer(this.slot)?.units || [];
    const enemyUnits = gameState.getPlayer(enemySlot)?.units || [];

    if (myUnits.length === 0 || enemyUnits.length === 0) return 999;

    let totalDistance = 0;
    let count = 0;

    myUnits.forEach(myUnit => {
      enemyUnits.forEach(enemyUnit => {
        const dx = myUnit.position.x - enemyUnit.position.x;
        const dy = myUnit.position.y - enemyUnit.position.y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
        count++;
      });
    });

    return count > 0 ? totalDistance / count : 999;
  }

  executeExpansionStrategy(gameState) {
    const actions = [];
    const playerState = gameState.getPlayer(this.slot);

    if (!playerState) return actions;

    // Build more workers - use quaternion resources (ore/energy/biomass/data)
    const ore = playerState.resources.ore || 0;
    if (ore > 60 && playerState.supply.current < playerState.supply.max - 1) {
      const base = playerState.buildings.find(b => b.type === 'base' && !b.producing);
      if (base) {
        actions.push({
          commandType: 'build_unit',
          buildingId: base.id,
          unitType: 'worker'
        });
      }
    }

    // Expand with new base
    if (ore > 300 && playerState.buildings.filter(b => b.type === 'base').length < 3) {
      const expansionLocation = this.findExpansionLocation(gameState);
      if (expansionLocation) {
        actions.push({
          commandType: 'build_building',
          buildingType: 'base',
          position: expansionLocation
        });
      }
    }

    return actions;
  }

  executeDefenseStrategy(gameState) {
    const actions = [];
    const playerState = gameState.getPlayer(this.slot);

    if (!playerState) return actions;

    const defensiveUnits = playerState.units.filter(u => ['soldier', 'tank', 'air_unit'].includes(u.type));

    // Group units for defense
    const mainBase = playerState.buildings.find(b => b.type === 'base');
    if (mainBase && defensiveUnits.length > 0) {
      const defendPosition = {
        x: mainBase.position.x,
        y: mainBase.position.y
      };

      actions.push({
        commandType: 'move',
        unitIds: defensiveUnits.map(u => u.id),
        position: defendPosition
      });
    }

    // Build defensive structures
    const ore = playerState.resources.ore || 0;
    if (ore > 100) {
      const defensiveUnits = playerState.units.filter(u => u.type === 'soldier').length;
      if (defensiveUnits < 5) {
        const barracks = playerState.buildings.find(b => b.type === 'barracks' && !b.producing);
        if (barracks) {
          actions.push({
            commandType: 'build_unit',
            buildingId: barracks.id,
            unitType: 'soldier'
          });
        }
      }
    }

    return actions;
  }

  executeAggressionStrategy(gameState) {
    const actions = [];
    const playerState = gameState.getPlayer(this.slot);

    if (!playerState) return actions;

    const militaryUnits = playerState.units.filter(u => ['soldier', 'tank', 'air_unit'].includes(u.type));

    // Find closest enemy
    const closestEnemy = this.findClosestEnemy(gameState);
    if (closestEnemy && militaryUnits.length > 0) {
      actions.push({
        commandType: 'attack',
        unitIds: militaryUnits.map(u => u.id),
        targetId: closestEnemy.id
      });
    }

    // Build more military units
    const ore = playerState.resources.ore || 0;
    if (ore > 80) {
      const barracks = playerState.buildings.find(b => b.type === 'barracks' && !b.producing);
      if (barracks) {
        actions.push({
          commandType: 'build_unit',
          buildingId: barracks.id,
          unitType: 'soldier'
        });
      }
    }

    return actions;
  }

  executeTechStrategy(gameState) {
    const actions = [];
    const playerState = gameState.getPlayer(this.slot);

    if (!playerState) return actions;

    // Build production facilities - use quaternion resources
    const ore = playerState.resources.ore || 0;
    const energy = playerState.resources.energy || 0;
    if (ore > 200 && energy > 100) {
      const hasFactory = playerState.buildings.find(b => b.type === 'factory');
      if (!hasFactory && playerState.supply.current < playerState.supply.max - 5) {
        const factoryLocation = this.findBuildLocation(gameState, 'factory');
        if (factoryLocation) {
          actions.push({
            commandType: 'build_building',
            buildingType: 'factory',
            position: factoryLocation
          });
        }
      }
    }

    return actions;
  }

  executeTactics(gameState) {
    const actions = [];
    const playerState = gameState.getPlayer(this.slot);

    if (!playerState) return actions;

    // Micro management for combat
    const combatUnits = playerState.units.filter(u => u.inCombat);
    combatUnits.forEach(unit => {
      if (unit.health < unit.maxHealth * 0.3) {
        // Retreat damaged units
        const mainBase = playerState.buildings.find(b => b.type === 'base');
        if (mainBase) {
          actions.push({
            commandType: 'move',
            unitIds: [unit.id],
            position: mainBase.position
          });
        }
      }
    });

    return actions;
  }

  executeBuildOrder(gameState) {
    const actions = [];
    const playerState = gameState.getPlayer(this.slot);

    if (!playerState) return actions;

    // Build order varies by difficulty
    const buildOrder = this.generateBuildOrder(playerState);
    buildOrder.forEach(item => {
      if (item.condition(playerState)) {
        actions.push(item.action);
      }
    });

    return actions;
  }

  generateBuildOrder(playerState) {
    const quality = this.settings.buildOrderQuality;
    
    return [
      {
        condition: (ps) => (ps.resources.ore || 0) > 50 && ps.supply.current < ps.supply.max - 1,
        action: {
          commandType: 'build_unit',
          buildingId: ps.buildings.find(b => b.type === 'base')?.id,
          unitType: 'worker'
        }
      },
      {
        condition: (ps) => (ps.resources.ore || 0) > 100 && !ps.buildings.find(b => b.type === 'barracks') && quality > 0.6,
        action: {
          commandType: 'build_building',
          buildingType: 'barracks',
          position: this.findBuildLocation(gameState, 'barracks')
        }
      },
      {
        condition: (ps) => (ps.resources.ore || 0) > 150 && ps.units.filter(u => u.type === 'soldier').length < 3 && quality > 0.5,
        action: {
          commandType: 'build_unit',
          buildingId: ps.buildings.find(b => b.type === 'barracks')?.id,
          unitType: 'soldier'
        }
      }
    ];
  }

  findClosestEnemy(gameState) {
    const playerState = gameState.getPlayer(this.slot);
    if (!playerState) return null;

    let closestEnemy = null;
    let closestDistance = Infinity;

    const enemies = gameState.getEnemyPlayers(this.slot);
    enemies.forEach(enemy => {
      enemy.units.forEach(unit => {
        playerState.units.forEach(myUnit => {
          const dx = unit.position.x - myUnit.position.x;
          const dy = unit.position.y - myUnit.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = unit;
          }
        });
      });
    });

    return closestEnemy;
  }

  findExpansionLocation(gameState) {
    const mapWidth = gameState.mapWidth;
    const mapHeight = gameState.mapHeight;
    const playerState = gameState.getPlayer(this.slot);

    if (!playerState) return null;

    // Find locations far from enemies
    let bestLocation = null;
    let bestScore = -Infinity;

    for (let x = 0; x < mapWidth; x += 8) {
      for (let y = 0; y < mapHeight; y += 8) {
        // Score based on distance from enemies
        let minEnemyDistance = Infinity;

        const enemies = gameState.getEnemyPlayers(this.slot);
        enemies.forEach(enemy => {
          enemy.buildings.forEach(building => {
            const dist = Math.sqrt(Math.pow(x - building.position.x, 2) + Math.pow(y - building.position.y, 2));
            minEnemyDistance = Math.min(minEnemyDistance, dist);
          });
        });

        const score = minEnemyDistance;
        if (score > bestScore) {
          bestScore = score;
          bestLocation = { x, y };
        }
      }
    }

    return bestLocation;
  }

  findBuildLocation(gameState, buildingType) {
    const playerState = gameState.getPlayer(this.slot);
    if (!playerState) return null;

    const mainBase = playerState.buildings.find(b => b.type === 'base');
    if (!mainBase) return null;

    // Find location near main base
    const searchRadius = 10;
    const centerX = mainBase.position.x;
    const centerY = mainBase.position.y;

    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        const x = centerX + dx;
        const y = centerY + dy;

        if (x < 0 || x >= gameState.mapWidth || y < 0 || y >= gameState.mapHeight) continue;

        return { x, y };
      }
    }

    return null;
  }
}

class AIState {
  constructor(slot) {
    this.slot = slot;
    this.currentStrategy = 'expansion';
    this.threatLevel = 0;
    this.economyHealth = 1.0;
    this.militaryPower = 0;
  }

  updateStrategicIntent(threat, economy, militaryPower, settings) {
    this.threatLevel = threat;
    this.economyHealth = economy.economyHealth;
    this.militaryPower = militaryPower;

    // Determine strategy based on game state
    if (threat > 0.7 * settings.aggressionFactor) {
      this.currentStrategy = 'defense';
    } else if (militaryPower > 100 && threat < 0.3) {
      this.currentStrategy = 'aggression';
    } else if (economy.economyHealth > 0.8) {
      this.currentStrategy = 'tech';
    } else {
      this.currentStrategy = 'expansion';
    }
  }
}

export { MultiplayerAIController, AIState };

