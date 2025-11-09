import { UnitType } from '../units/Unit.js';
import { BuildingType } from '../buildings/Building.js';
import fs from 'fs';
import path from 'path';
import { logDecision } from './decision-logger.js';
import { generateStrategy, safeParseJSON } from './modelClient.js';
import { buildStrategyPrompt } from './promptTemplates.js';
import { LRUCache, hashPrompt } from './cache.js';

export const AIDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const CONFIG_PATH = path.resolve(process.cwd(), 'config', 'commanders.json');
let COMMANDER_CONFIG = null;
const strategyCache = new LRUCache(200);

// Load commander config (safely)
function loadCommanderConfig() {
  try {
    if (!COMMANDER_CONFIG) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      COMMANDER_CONFIG = JSON.parse(raw).commanders.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});
    }
  } catch (err) {
    console.warn('Could not load commanders config at', CONFIG_PATH, err.message);
    COMMANDER_CONFIG = COMMANDER_CONFIG || {};
  }
}

/**
 * Softmax sampling with numerical stability.
 */
function softmaxSample(actions, temp = 1.0) {
  if (!actions || actions.length === 0) return null;
  temp = Math.max(0.05, Math.min(2.0, temp));
  const scores = actions.map(a => a.score);
  const max = Math.max(...scores);
  const exps = scores.map(s => Math.exp((s - max) / temp));
  const sum = exps.reduce((a, b) => a + b, 0);
  const r = Math.random() * sum;
  let c = 0;
  for (let i = 0; i < exps.length; i++) {
    c += exps[i];
    if (r <= c) return actions[i];
  }
  return actions[actions.length - 1];
}

/**
 * Apply personality modulation to a base utility.
 */
function modulate(baseScore, personality, decisionType) {
  if (!personality || !personality.traits) return baseScore;
  const t = personality.traits;
  switch (decisionType) {
    case 'attack':
      return baseScore * (1 + (t.aggressiveness - 0.5) * 0.6);
    case 'defend':
      return baseScore * (1 + (0.5 - t.aggressiveness) * 0.5) * (1 + (t.patience - 0.5) * 0.4);
    case 'scout':
      return baseScore * (1 + (t.explorationDrive - 0.5) * 0.9);
    case 'expand':
    case 'econ':
      return baseScore * (1 + (t.patience - 0.5) * 0.6);
    default:
      return baseScore * (1 + (t.innovationDrive - 0.5) * 0.4);
  }
}

/**
 * Novelty multiplier based on recent action history
 */
function noveltyMultiplier(actionType, recentHistory = [], window = 6) {
  if (!recentHistory || recentHistory.length === 0) return 1.0;
  const slice = recentHistory.slice(-window);
  const count = slice.filter(t => t === actionType).length;
  return 1 / (1 + count);
}

/**
 * AI Controller for computer opponents with personality system
 */
export class AIController {
  constructor(playerId, difficulty = AIDifficulty.MEDIUM, commanderId = 'tactician') {
    this.playerId = playerId;
    this.difficulty = difficulty;
    this.commanderId = commanderId;
    this.lastDecisionTick = 0;
    this.decisionInterval = this.getDecisionInterval();
    this.strategy = this.initializeStrategy();
    this.buildOrder = this.getBuildOrder();
    this.buildOrderIndex = 0;
    this.recentHistory = [];
    
    loadCommanderConfig();
    this.personality = COMMANDER_CONFIG[commanderId] || null;
  }

  getDecisionInterval() {
    const intervals = {
      [AIDifficulty.EASY]: 180,
      [AIDifficulty.MEDIUM]: 90,
      [AIDifficulty.HARD]: 30
    };
    return intervals[this.difficulty];
  }

  initializeStrategy() {
    const baseAggression = this.difficulty === AIDifficulty.HARD ? 0.8 : 0.5;
    const personalityAggression = this.personality?.traits?.aggressiveness || 0.5;
    
    return {
      economyFocus: 0.5,
      militaryFocus: 0.3,
      expansionFocus: 0.2,
      aggression: (baseAggression + personalityAggression) / 2,
      workerCount: 0,
      armySize: 0,
      baseCount: 1
    };
  }

  getBuildOrder() {
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
   * Main AI update loop (async for model integration)
   */
  async update(gameState) {
    if (gameState.tick - this.lastDecisionTick < this.decisionInterval) {
      return;
    }

    this.lastDecisionTick = gameState.tick;
    this.analyzeGameState(gameState);
    await this.makeDecisions(gameState);
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
   * Make strategic decisions with personality-based action selection and optional AI model
   */
  async makeDecisions(gameState) {
    const player = gameState.players[this.playerId];
    
    // Follow build order early game
    if (this.buildOrderIndex < this.buildOrder.length) {
      const order = this.buildOrder[this.buildOrderIndex];
      if (this.executeBuildOrder(gameState, order)) {
        this.buildOrderIndex++;
      }
      return;
    }

    // Use AI model for strategic decisions at key moments (every 10 ticks on hard)
    if (this.difficulty === 'hard' && gameState.tick % 10 === 0) {
      const aiDecision = await this.getAIStrategy(gameState);
      if (aiDecision) {
        this.executeAIStrategy(gameState, aiDecision);
        return;
      }
    }

    // Generate candidate actions
    const candidates = this.generateCandidateActions(gameState);
    
    if (candidates.length > 0) {
      const chosen = this.evaluateAndChooseAction(gameState, candidates);
      if (chosen) {
        this.executeAction(gameState, chosen);
      }
    } else {
      // Fallback to original behavior
      this.manageEconomy(gameState);
      this.manageMilitary(gameState);
      this.manageArmy(gameState);
    }
  }

  /**
   * Get AI model strategy recommendation (cached)
   */
  async getAIStrategy(gameState) {
    const prompt = buildStrategyPrompt(gameState, this.playerId);
    const cacheKey = hashPrompt(prompt, this.playerId);

    // Check cache
    if (strategyCache.has(cacheKey)) {
      const cached = strategyCache.get(cacheKey);
      return { ...cached, cached: true };
    }

    try {
      const response = await generateStrategy({ prompt, temperature: 0.6, maxTokens: 256 });
      const parsed = safeParseJSON(response.text);
      
      if (parsed && parsed.action) {
        strategyCache.set(cacheKey, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('AI strategy failed, using fallback:', err.message);
    }

    return null;
  }

  /**
   * Execute AI model strategy
   */
  executeAIStrategy(gameState, strategy) {
    const { action, priority } = strategy;
    
    switch (action) {
      case 'build':
        if (priority === 'high') {
          this.tryBuildUnit(gameState, UnitType.WORKER);
        }
        break;
      case 'attack':
        this.manageArmy(gameState);
        break;
      case 'defend':
        const base = gameState.buildings.find(b => b.playerId === this.playerId && b.type === BuildingType.BASE);
        if (base) {
          const myUnits = gameState.units.filter(u => u.playerId === this.playerId && u.type !== UnitType.WORKER);
          myUnits.forEach(unit => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15;
            unit.moveToPosition(base.x + Math.cos(angle) * distance, base.y + Math.sin(angle) * distance);
          });
        }
        break;
      case 'expand':
        this.tryBuildUnit(gameState, UnitType.WORKER);
        this.tryBuildUnit(gameState, UnitType.WORKER);
        break;
      default:
        this.manageEconomy(gameState);
    }
  }

  /**
   * Generate candidate actions based on current game state
   */
  generateCandidateActions(gameState) {
    const candidates = [];
    const player = gameState.players[this.playerId];

    // Economy actions
    if (this.strategy.workerCount < 12) {
      candidates.push({ 
        id: 'build_worker', 
        type: 'econ', 
        action: 'build_unit',
        unitType: UnitType.WORKER,
        baseScore: 0.6 
      });
    }

    // Military actions
    if (player.minerals >= 150 && player.gas >= 100) {
      candidates.push({ 
        id: 'build_tank', 
        type: 'attack', 
        action: 'build_unit',
        unitType: UnitType.TANK,
        baseScore: 0.7 
      });
    }
    
    if (player.minerals >= 100) {
      candidates.push({ 
        id: 'build_soldier', 
        type: 'attack', 
        action: 'build_unit',
        unitType: UnitType.SOLDIER,
        baseScore: 0.5 
      });
    }

    // Army management actions
    const myUnits = gameState.units.filter(u => 
      u.playerId === this.playerId && u.type !== UnitType.WORKER
    );
    
    if (myUnits.length >= 3) {
      candidates.push({ 
        id: 'attack_enemy', 
        type: 'attack', 
        action: 'army_attack',
        baseScore: 0.8 
      });
    } else {
      candidates.push({ 
        id: 'defend_base', 
        type: 'defend', 
        action: 'army_defend',
        baseScore: 0.6 
      });
    }

    return candidates;
  }

  /**
   * Evaluate and choose action using personality-driven utilities
   */
  evaluateAndChooseAction(gameState, candidates) {
    if (!candidates || candidates.length === 0) return null;

    const scored = candidates.map((c) => {
      const base = c.baseScore || 0.5;
      const type = c.type || 'generic';
      const mod = modulate(base, this.personality, type);
      const novelty = noveltyMultiplier(type, this.recentHistory, 8);
      const final = mod * (1 + (1 - novelty) * 0.15) * novelty;
      
      return {
        ...c,
        finalScore: final,
        debug: { base, mod, novelty }
      };
    });

    const topN = scored.sort((a, b) => b.finalScore - a.finalScore).slice(0, 6);
    
    const innovationDrive = this.personality?.traits?.innovationDrive || 0.5;
    const temp = 1 - innovationDrive * 0.85 + 0.15;
    const clampedTemp = Math.max(0.05, Math.min(1.5, temp));

    const samplePool = topN.map(a => ({ action: a, score: a.finalScore }));
    const chosenWrapper = softmaxSample(samplePool, clampedTemp);
    const chosen = chosenWrapper ? chosenWrapper.action : topN[0];

    this.recentHistory.push(chosen.type || chosen.id);
    if (this.recentHistory.length > 128) this.recentHistory.shift();

    // Log decision
    try {
      const actionScores = {};
      scored.forEach(s => {
        actionScores[s.id] = {
          base: s.debug.base,
          modulated: s.debug.mod,
          novelty: s.debug.novelty,
          final: s.finalScore
        };
      });

      logDecision(gameState.id || 'game', {
        commanderId: this.commanderId,
        tick: gameState.tick,
        chosen: { id: chosen.id, type: chosen.type },
        actionScores
      });
    } catch (err) {
      console.error('AIController log error', err);
    }

    return chosen;
  }

  /**
   * Execute chosen action
   */
  executeAction(gameState, action) {
    switch (action.action) {
      case 'build_unit':
        this.tryBuildUnit(gameState, action.unitType);
        break;
      case 'army_attack':
        this.manageArmy(gameState);
        break;
      case 'army_defend':
        this.manageArmy(gameState);
        break;
    }
  }

  executeBuildOrder(gameState, order) {
    const player = gameState.players[this.playerId];

    if (order.action === 'build_unit') {
      return this.tryBuildUnit(gameState, order.unitType);
    } else if (order.action === 'build_building') {
      return this.tryBuildBuilding(gameState, order.buildingType);
    }

    return false;
  }

  tryBuildUnit(gameState, unitType) {
    const player = gameState.players[this.playerId];
    const myBuildings = gameState.buildings.filter(b => 
      b.playerId === this.playerId && b.isComplete
    );

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

    const unit = gameState.createUnit(unitType, this.playerId, 0, 0, true);
    if (player.minerals >= unit.cost.minerals && player.gas >= unit.cost.gas) {
      player.minerals -= unit.cost.minerals;
      player.gas -= unit.cost.gas;
      building.produceUnit(unitType, unit);
      return true;
    }

    return false;
  }

  tryBuildBuilding(gameState, buildingType) {
    const player = gameState.players[this.playerId];
    const building = gameState.createBuilding(buildingType, this.playerId, 0, 0, true);

    if (player.minerals >= building.cost.minerals && player.gas >= building.cost.gas) {
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

  manageEconomy(gameState) {
    const player = gameState.players[this.playerId];
    const myUnits = gameState.units.filter(u => u.playerId === this.playerId);
    const workers = myUnits.filter(u => u.type === UnitType.WORKER);

    if (workers.length < 12 && player.minerals >= 50) {
      this.tryBuildUnit(gameState, UnitType.WORKER);
    }

    const idleWorkers = workers.filter(u => u.state === 'idle' && !u.gatherTarget);
    idleWorkers.forEach(worker => {
      const nearestResource = this.findNearestResource(gameState, worker);
      if (nearestResource) {
        worker.gatherResource(nearestResource);
      }
    });
  }

  manageMilitary(gameState) {
    const player = gameState.players[this.playerId];

    if (player.minerals >= 150 && player.gas >= 100) {
      this.tryBuildUnit(gameState, UnitType.TANK);
    } else if (player.minerals >= 100) {
      this.tryBuildUnit(gameState, UnitType.SOLDIER);
    }
  }

  manageArmy(gameState) {
    const myUnits = gameState.units.filter(u => 
      u.playerId === this.playerId && u.type !== UnitType.WORKER
    );

    const enemyUnits = gameState.units.filter(u => u.playerId !== this.playerId);
    const enemyBuildings = gameState.buildings.filter(b => b.playerId !== this.playerId);

    const attackThreshold = this.difficulty === AIDifficulty.HARD ? 3 : 5;
    
    if (myUnits.length >= attackThreshold) {
      myUnits.forEach(unit => {
        if (unit.state === 'idle' || unit.state === 'moving') {
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

  findNearestResource(gameState, worker) {
    const resources = gameState.map.resources.filter(r => r.amount > 0);
    if (resources.length === 0) return null;

    return resources.reduce((nearest, resource) => {
      const dist = worker.distanceTo(resource.x, resource.y);
      const nearestDist = worker.distanceTo(nearest.x, nearest.y);
      return dist < nearestDist ? resource : nearest;
    });
  }

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

export { loadCommanderConfig, softmaxSample, modulate, noveltyMultiplier };
