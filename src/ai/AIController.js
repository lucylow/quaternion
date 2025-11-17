import { UnitType } from '../units/Unit.js';
import { BuildingType } from '../buildings/Building.js';
import { logDecision } from './decision-logger.js';
import { generateStrategy, safeParseJSON } from './modelClient.js';
import { buildStrategyPrompt } from './promptTemplates.js';
import { LRUCache, hashPrompt } from './cache.js';
import MCTS from './planner/MCTS.js';
import { logAIDecision, recordMetric } from './telemetry.js';
import { SituationEvaluator } from './situationEvaluator.js';
import { ScoutingSystem } from './scoutingSystem.js';
import { FormationSystem } from './formationSystem.js';
import { StrategicPlanner } from './strategicPlanner.js';
import commanderConfigData from '../config/commanders.json';

export const AIDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// Load commander config from imported JSON
let COMMANDER_CONFIG = null;
const strategyCache = new LRUCache(200);

// Load commander config (safely)
function loadCommanderConfig() {
  try {
    if (!COMMANDER_CONFIG) {
      COMMANDER_CONFIG = commanderConfigData.commanders.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});
    }
  } catch (err) {
    console.warn('Could not load commanders config', err.message);
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
  constructor(playerId, difficulty = AIDifficulty.MEDIUM, commanderId = 'tactician', gameId = 'local') {
    this.playerId = playerId;
    this.difficulty = difficulty;
    this.commanderId = commanderId;
    this.gameId = gameId;
    this.lastDecisionTick = 0;
    this.decisionInterval = this.getDecisionInterval();
    this.strategy = this.initializeStrategy();
    this.buildOrder = this.getBuildOrder();
    this.buildOrderIndex = 0;
    this.recentHistory = [];
    
    loadCommanderConfig();
    this.personality = COMMANDER_CONFIG[commanderId] || null;
    
    // Initialize MCTS planner with improved rollouts
    const rollouts = difficulty === AIDifficulty.HARD ? 500 : (difficulty === AIDifficulty.MEDIUM ? 200 : 100);
    this.mctsPlanner = new MCTS({ rollouts });
    
    // Initialize new AI systems
    this.scouting = new ScoutingSystem(playerId);
    this.formations = new FormationSystem();
    this.strategicPlanner = new StrategicPlanner(playerId);
    this.situation = null; // Will be updated each tick
    this.lastSituationUpdate = 0;
    this.lastPlanUpdate = 0;
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
   * Analyze current game state with enhanced evaluation
   */
  analyzeGameState(gameState) {
    const myUnits = gameState.units.filter(u => u.playerId === this.playerId);
    const myBuildings = gameState.buildings.filter(b => b.playerId === this.playerId);

    this.strategy.workerCount = myUnits.filter(u => u.type === UnitType.WORKER).length;
    this.strategy.armySize = myUnits.filter(u => u.type !== UnitType.WORKER).length;
    this.strategy.baseCount = myBuildings.filter(b => b.type === BuildingType.BASE).length;

    // Update situation evaluation (every 10 ticks for performance)
    if (gameState.tick - this.lastSituationUpdate >= 10) {
      this.situation = SituationEvaluator.evaluate(gameState, this.playerId);
      this.lastSituationUpdate = gameState.tick;
      
      // Update strategy based on situation
      this.updateStrategyFromSituation();
    }

    // Update strategic plan (every 50 ticks)
    if (gameState.tick - this.lastPlanUpdate >= 50) {
      if (this.situation) {
        this.strategicPlanner.updatePlan(this.situation, gameState);
        if (!this.strategicPlanner.currentPlan || this.strategicPlanner.isPlanComplete()) {
          this.strategicPlanner.createPlan(this.situation, gameState);
        }
      }
      this.lastPlanUpdate = gameState.tick;
    }

    // Update scouting system
    this.scouting.update(gameState);

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
   * Update strategy based on situation evaluation
   */
  updateStrategyFromSituation() {
    if (!this.situation) return;

    // Adjust focus based on threats
    if (this.situation.threat.level > 0.5) {
      this.strategy.militaryFocus = Math.min(0.9, this.strategy.militaryFocus + 0.2);
      this.strategy.economyFocus = Math.max(0.1, this.strategy.economyFocus - 0.2);
    }

    // Adjust based on military advantage
    if (this.situation.military.advantage < -0.2) {
      this.strategy.militaryFocus = Math.min(0.8, this.strategy.militaryFocus + 0.15);
    }

    // Adjust based on economy
    if (this.situation.economy.saturation < 0.6) {
      this.strategy.economyFocus = Math.min(0.8, this.strategy.economyFocus + 0.2);
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
   * Get AI model strategy recommendation (cached, with telemetry)
   */
  async getAIStrategy(gameState) {
    const startTime = Date.now();
    const prompt = buildStrategyPrompt(gameState, this.playerId);
    const cacheKey = hashPrompt(prompt, this.playerId);

    // Check cache
    if (strategyCache.has(cacheKey)) {
      const cached = strategyCache.get(cacheKey);
      const latency = Date.now() - startTime;
      
      // Log cache hit
      await logAIDecision({
        gameId: this.gameId,
        tick: gameState.tick,
        playerId: this.playerId,
        commanderId: this.commanderId,
        promptHash: cacheKey,
        prompt: prompt.substring(0, 500),
        modelResponse: JSON.stringify(cached),
        actionTaken: cached,
        decisionLatencyMs: latency,
        tokensUsed: 0,
        cacheHit: true,
        fallbackUsed: false
      });
      
      return { ...cached, cached: true };
    }

    try {
      const response = await generateStrategy({ prompt, temperature: 0.6, maxTokens: 256 });
      const parsed = safeParseJSON(response.text);
      const latency = Date.now() - startTime;
      
      if (parsed && parsed.action) {
        strategyCache.set(cacheKey, parsed);
        
        // Log successful AI decision
        await logAIDecision({
          gameId: this.gameId,
          tick: gameState.tick,
          playerId: this.playerId,
          commanderId: this.commanderId,
          promptHash: cacheKey,
          prompt: prompt.substring(0, 500),
          modelResponse: response.text.substring(0, 1000),
          actionTaken: parsed,
          decisionLatencyMs: latency,
          tokensUsed: response.usage?.total_tokens || 0,
          cacheHit: false,
          fallbackUsed: false
        });
        
        await recordMetric({
          gameId: this.gameId,
          metricType: 'ai_decision_latency',
          metricValue: latency,
          metadata: { tick: gameState.tick, cached: false }
        });
        
        return parsed;
      }
    } catch (err) {
      const latency = Date.now() - startTime;
      console.warn('AI strategy failed, using fallback:', err.message);
      
      // Log fallback usage
      await recordMetric({
        gameId: this.gameId,
        metricType: 'ai_fallback_count',
        metricValue: 1,
        metadata: { tick: gameState.tick, error: err.message }
      });
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
   * Generate candidate actions based on current game state with situation awareness
   */
  generateCandidateActions(gameState) {
    const candidates = [];
    const player = gameState.players[this.playerId];
    const situation = this.situation;

    // Economy actions - enhanced with situation awareness
    const optimalWorkers = (situation?.economy.baseCount || 1) * 12;
    if (this.strategy.workerCount < optimalWorkers) {
      let score = 0.6;
      if (situation?.economy.saturation < 0.7) score += 0.2;
      if (situation?.threat.level > 0.5) score -= 0.2;
      
      candidates.push({ 
        id: 'build_worker', 
        type: 'econ', 
        action: 'build_unit',
        unitType: UnitType.WORKER,
        baseScore: Math.max(0.1, score)
      });
    }

    // Expansion actions
    if (situation?.economy.canExpand && player.minerals >= 400) {
      candidates.push({
        id: 'expand_base',
        type: 'expand',
        action: 'build_building',
        buildingType: BuildingType.BASE,
        baseScore: 0.8
      });
    }

    // Military actions - enhanced with threat awareness
    if (player.minerals >= 150 && player.gas >= 100) {
      let score = 0.7;
      if (situation?.military.advantage < 0) score += 0.2;
      if (situation?.threat.level > 0.3) score += 0.15;
      
      candidates.push({ 
        id: 'build_tank', 
        type: 'attack', 
        action: 'build_unit',
        unitType: UnitType.TANK,
        baseScore: Math.min(1, score)
      });
    }
    
    if (player.minerals >= 100) {
      let score = 0.5;
      if (situation?.military.advantage < 0) score += 0.2;
      
      candidates.push({ 
        id: 'build_soldier', 
        type: 'attack', 
        action: 'build_unit',
        unitType: UnitType.SOLDIER,
        baseScore: Math.min(1, score)
      });
    }

    // Production building actions
    const myBuildings = gameState.buildings.filter(b => b.playerId === this.playerId);
    if (!myBuildings.some(b => b.type === BuildingType.BARRACKS) && player.minerals >= 100) {
      candidates.push({
        id: 'build_barracks',
        type: 'build',
        action: 'build_building',
        buildingType: BuildingType.BARRACKS,
        baseScore: 0.7
      });
    }

    if (!myBuildings.some(b => b.type === BuildingType.FACTORY) && 
        player.minerals >= 150 && player.gas >= 50) {
      candidates.push({
        id: 'build_factory',
        type: 'build',
        action: 'build_building',
        buildingType: BuildingType.FACTORY,
        baseScore: 0.6
      });
    }

    // Scouting actions
    const scoutTargets = this.scouting.getScoutTargets(gameState, 1);
    if (scoutTargets.length > 0 && this.strategy.workerCount >= 6) {
      const idleWorkers = gameState.units.filter(u => 
        u.playerId === this.playerId && 
        u.type === UnitType.WORKER && 
        (u.state === 'idle' || !u.gatherTarget)
      );
      
      if (idleWorkers.length > 0) {
        candidates.push({
          id: 'scout',
          type: 'scout',
          action: 'scout',
          target: scoutTargets[0],
          baseScore: 0.4
        });
      }
    }

    // Army management actions
    const myUnits = gameState.units.filter(u => 
      u.playerId === this.playerId && u.type !== UnitType.WORKER
    );
    
    if (myUnits.length >= 3) {
      let score = 0.8;
      if (situation?.military.advantage > 0.2) score += 0.1;
      if (situation?.threat.level > 0.5) score -= 0.2;
      
      candidates.push({ 
        id: 'attack_enemy', 
        type: 'attack', 
        action: 'army_attack',
        baseScore: Math.max(0.3, score)
      });
    } else {
      let score = 0.6;
      if (situation?.threat.level > 0.4) score += 0.2;
      
      candidates.push({ 
        id: 'defend_base', 
        type: 'defend', 
        action: 'army_defend',
        baseScore: Math.min(1, score)
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
      case 'build_building':
        this.tryBuildBuilding(gameState, action.buildingType);
        break;
      case 'scout':
        if (action.target) {
          const idleWorkers = gameState.units.filter(u => 
            u.playerId === this.playerId && 
            u.type === UnitType.WORKER && 
            (u.state === 'idle' || !u.gatherTarget)
          );
          if (idleWorkers.length > 0) {
            idleWorkers[0].moveToPosition(action.target.x, action.target.y);
          }
        }
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

    if (myUnits.length === 0) return;

    const enemyUnits = gameState.units.filter(u => u.playerId !== this.playerId);
    const enemyBuildings = gameState.buildings.filter(b => b.playerId !== this.playerId);

    const attackThreshold = this.difficulty === AIDifficulty.HARD ? 3 : 5;
    
    // Use formations for larger armies
    if (myUnits.length >= 6) {
      this.manageArmyWithFormations(gameState, myUnits, enemyUnits, enemyBuildings);
    } else if (myUnits.length >= attackThreshold) {
      // Use improved micro for smaller groups
      this.manageArmyMicro(gameState, myUnits, enemyUnits, enemyBuildings);
    } else {
      // Defend base with small army
      this.defendBase(gameState, myUnits);
    }
  }

  /**
   * Manage army using formations
   */
  manageArmyWithFormations(gameState, myUnits, enemyUnits, enemyBuildings) {
    // Check if we need a new formation
    const existingFormation = this.formations.formations.values().next().value;
    
    if (!existingFormation || existingFormation.units.length !== myUnits.length) {
      // Create new formation
      const situation = this.situation || { threat: { level: 0 } };
      const formationType = situation.threat.level > 0.4 ? 'box' : 'wedge';
      const target = enemyUnits.length > 0 ? enemyUnits[0] : null;
      
      this.formations.createFormation(myUnits, formationType, target);
    }

    // Update formation and get positions
    const formation = Array.from(this.formations.formations.values())[0];
    if (formation) {
      const positions = this.formations.updateFormation(formation.id);
      
      // Assign positions to units
      positions.forEach(({ unitId, x, y }) => {
        const unit = myUnits.find(u => u.id === unitId);
        if (unit && (unit.state === 'idle' || unit.state === 'moving')) {
          unit.moveToPosition(x, y);
        }
      });

      // Attack if enemies are nearby
      if (enemyUnits.length > 0) {
        myUnits.forEach(unit => {
          const nearestEnemy = this.findNearestEnemy(unit, enemyUnits, enemyBuildings);
          if (nearestEnemy && unit.distanceTo(nearestEnemy.x, nearestEnemy.y) < unit.range + 5) {
            if (nearestEnemy.type) {
              unit.attackUnit(nearestEnemy);
            }
          }
        });
      }
    }
  }

  /**
   * Improved micro-management for smaller groups
   */
  manageArmyMicro(gameState, myUnits, enemyUnits, enemyBuildings) {
    myUnits.forEach(unit => {
      if (unit.state === 'idle' || unit.state === 'moving') {
        const nearestEnemy = this.findNearestEnemy(unit, enemyUnits, enemyBuildings);
        if (nearestEnemy) {
          const distance = unit.distanceTo(nearestEnemy.x, nearestEnemy.y);
          
          // Kite if we have range advantage
          if (unit.range > 1 && distance < unit.range + 3 && distance > unit.range) {
            // Already in range, attack
            if (nearestEnemy.type) {
              unit.attackUnit(nearestEnemy);
            }
          } else if (distance <= unit.range + 2) {
            // Close enough to attack
            if (nearestEnemy.type) {
              unit.attackUnit(nearestEnemy);
            } else {
              unit.moveToPosition(nearestEnemy.x, nearestEnemy.y);
            }
          } else {
            // Move towards enemy
            unit.moveToPosition(nearestEnemy.x, nearestEnemy.y);
          }
        } else {
          // No enemies visible, scout or return to base
          const scoutTargets = this.scouting.getScoutTargets(gameState, 1);
          if (scoutTargets.length > 0) {
            const target = scoutTargets[0];
            unit.moveToPosition(target.x, target.y);
          }
        }
      }
    });
  }

  /**
   * Defend base with small army
   */
  defendBase(gameState, myUnits) {
    const base = gameState.buildings.find(b => 
      b.playerId === this.playerId && b.type === BuildingType.BASE
    );
    
    if (base) {
      myUnits.forEach((unit, index) => {
        if (unit.state === 'idle') {
          // Position units around base in defensive formation
          const angle = (index / myUnits.length) * Math.PI * 2;
          const distance = 12;
          unit.moveToPosition(
            base.x + Math.cos(angle) * distance,
            base.y + Math.sin(angle) * distance
          );
        }
      });
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
