import { UnitType } from '../../units/Unit.js';
import { BuildingType } from '../../buildings/Building.js';
import { SituationEvaluator } from '../situationEvaluator.js';

/**
 * Enhanced Monte Carlo Tree Search planner
 * Provides fast, local decision-making with improved evaluation
 */
export default class MCTS {
  constructor({ rollouts = 100, explorationConstant = 1.41 } = {}) {
    this.rollouts = rollouts;
    this.explorationConstant = explorationConstant; // UCB1 constant
    this.nodeMap = new Map(); // Cache for tree nodes
  }

  /**
   * Get best action for current game state using improved MCTS
   */
  bestMove(gameState, playerId) {
    const legal = this.getLegalActions(gameState, playerId);
    if (legal.length === 0) return null;

    // Use situation evaluator for better context
    const situation = SituationEvaluator.evaluate(gameState, playerId);

    // For small action spaces, use direct evaluation
    if (legal.length <= 5) {
      return this.bestMoveDirect(gameState, playerId, legal, situation);
    }

    // For larger action spaces, use UCB1 selection
    return this.bestMoveUCB(gameState, playerId, legal, situation);
  }

  /**
   * Direct evaluation for small action spaces
   */
  bestMoveDirect(gameState, playerId, actions, situation) {
    let best = null;
    let bestScore = -Infinity;

    for (let action of actions) {
      const score = this.evaluateActionEnhanced(gameState, playerId, action, situation);
      if (score > bestScore) {
        bestScore = score;
        best = action;
      }
    }

    return best;
  }

  /**
   * UCB1-based selection for larger action spaces
   */
  bestMoveUCB(gameState, playerId, actions, situation) {
    const nodeKey = this.getStateKey(gameState, playerId);
    let node = this.nodeMap.get(nodeKey);

    if (!node) {
      node = {
        visits: 0,
        actions: actions.map(a => ({
          action: a,
          visits: 0,
          value: 0
        }))
      };
      this.nodeMap.set(nodeKey, node);
    }

    // Perform rollouts
    for (let i = 0; i < this.rollouts; i++) {
      this.selectAndRollout(node, gameState, playerId, situation);
    }

    // Select best action based on visits and value
    const bestAction = node.actions.reduce((best, curr) => {
      const currScore = curr.visits > 0 ? curr.value / curr.visits : 0;
      const bestScore = best.visits > 0 ? best.value / best.visits : -Infinity;
      return currScore > bestScore ? curr : best;
    });

    return bestAction.action;
  }

  /**
   * Select action using UCB1 and perform rollout
   */
  selectAndRollout(node, gameState, playerId, situation) {
    node.visits++;

    // Select action using UCB1
    let selected = null;
    let bestUCB = -Infinity;

    for (let actionNode of node.actions) {
      let ucb;
      if (actionNode.visits === 0) {
        ucb = Infinity; // Unvisited actions get priority
      } else {
        const exploitation = actionNode.value / actionNode.visits;
        const exploration = this.explorationConstant * 
          Math.sqrt(Math.log(node.visits) / actionNode.visits);
        ucb = exploitation + exploration;
      }

      if (ucb > bestUCB) {
        bestUCB = ucb;
        selected = actionNode;
      }
    }

    if (!selected) return;

    // Evaluate action
    const score = this.evaluateActionEnhanced(gameState, playerId, selected.action, situation);
    
    // Update statistics
    selected.visits++;
    selected.value += score;
  }

  /**
   * Get state key for caching
   */
  getStateKey(gameState, playerId) {
    const player = gameState.players[playerId];
    return `${playerId}_${player.minerals}_${player.gas}_${gameState.tick % 100}`;
  }

  /**
   * Simulate action score with shallow rollout
   */
  async simulateActionScore(gameState, playerId, action) {
    // Quick heuristic evaluation
    const baseScore = this.evaluateAction(gameState, playerId, action);
    
    // Simple forward simulation penalty/bonus
    const futureBonus = this.estimateFutureValue(gameState, playerId, action);
    
    return baseScore + futureBonus * 0.3;
  }

  /**
   * Get all legal actions for player
   */
  getLegalActions(gameState, playerId) {
    const actions = [];
    const player = gameState.players[playerId];
    const myUnits = gameState.units.filter(u => u.playerId === playerId);
    const myBuildings = gameState.buildings.filter(b => b.playerId === playerId && b.isComplete);

    // Worker production
    if (player.minerals >= 50 && myBuildings.some(b => b.type === BuildingType.BASE)) {
      actions.push({ type: 'build_unit', unitType: UnitType.WORKER, cost: 50 });
    }

    // Military production
    if (player.minerals >= 100 && myBuildings.some(b => b.type === BuildingType.BARRACKS)) {
      actions.push({ type: 'build_unit', unitType: UnitType.SOLDIER, cost: 100 });
    }

    if (player.minerals >= 150 && player.gas >= 100 && myBuildings.some(b => b.type === BuildingType.FACTORY)) {
      actions.push({ type: 'build_unit', unitType: UnitType.TANK, cost: 250 });
    }

    // Building construction
    if (player.minerals >= 100) {
      actions.push({ type: 'build_building', buildingType: BuildingType.BARRACKS, cost: 100 });
    }

    if (player.minerals >= 150 && player.gas >= 50) {
      actions.push({ type: 'build_building', buildingType: BuildingType.FACTORY, cost: 200 });
    }

    // Army actions
    const armySize = myUnits.filter(u => u.type !== UnitType.WORKER).length;
    if (armySize > 0) {
      actions.push({ type: 'army_action', action: 'attack', armySize });
      actions.push({ type: 'army_action', action: 'defend', armySize });
    }

    return actions;
  }

  /**
   * Enhanced heuristic score for an action with situation context
   */
  evaluateActionEnhanced(gameState, playerId, action, situation) {
    const baseScore = this.evaluateAction(gameState, playerId, action);
    
    // Adjust based on situation
    let situationBonus = 0;

    if (action.type === 'build_unit') {
      if (action.unitType === UnitType.WORKER) {
        // Higher priority if economy is weak
        if (situation.economy.saturation < 0.7) {
          situationBonus += 0.3;
        }
        // Lower priority if under attack
        if (situation.threat.level > 0.5) {
          situationBonus -= 0.2;
        }
      } else {
        // Higher priority if military is weak or under threat
        if (situation.military.advantage < 0 || situation.threat.level > 0.3) {
          situationBonus += 0.4;
        }
      }
    } else if (action.type === 'build_building') {
      // Higher priority if economy allows expansion
      if (situation.economy.canExpand && action.buildingType === BuildingType.BASE) {
        situationBonus += 0.5;
      }
    } else if (action.type === 'army_action') {
      if (action.action === 'attack') {
        // Higher priority if we have advantage
        if (situation.military.advantage > 0.2) {
          situationBonus += 0.3;
        }
      } else if (action.action === 'defend') {
        // Higher priority if under threat
        if (situation.threat.level > 0.4) {
          situationBonus += 0.4;
        }
      }
    }

    return Math.min(1, baseScore + situationBonus);
  }

  /**
   * Base heuristic score for an action
   */
  evaluateAction(gameState, playerId, action) {
    const player = gameState.players[playerId];
    const myUnits = gameState.units.filter(u => u.playerId === playerId);
    const workerCount = myUnits.filter(u => u.type === UnitType.WORKER).length;
    const armySize = myUnits.filter(u => u.type !== UnitType.WORKER).length;

    let score = 0;

    if (action.type === 'build_unit') {
      if (action.unitType === UnitType.WORKER) {
        // Value workers early game, diminishing returns
        score = workerCount < 8 ? 0.8 : (workerCount < 12 ? 0.5 : 0.2);
        // Discount if low resources
        if (player.minerals < 200) score *= 0.7;
      } else if (action.unitType === UnitType.SOLDIER) {
        score = 0.6 + (armySize < 5 ? 0.2 : 0);
      } else if (action.unitType === UnitType.TANK) {
        score = 0.7 + (armySize < 3 ? 0.1 : 0.2);
      }
    } else if (action.type === 'build_building') {
      const myBuildings = gameState.buildings.filter(b => b.playerId === playerId);
      if (action.buildingType === BuildingType.BARRACKS) {
        score = myBuildings.some(b => b.type === BuildingType.BARRACKS) ? 0.3 : 0.7;
      } else if (action.buildingType === BuildingType.FACTORY) {
        score = myBuildings.some(b => b.type === BuildingType.FACTORY) ? 0.2 : 0.8;
      }
    } else if (action.type === 'army_action') {
      const enemyUnits = gameState.units.filter(u => u.playerId !== playerId);
      const armyRatio = armySize / Math.max(1, enemyUnits.length);
      
      if (action.action === 'attack') {
        score = armyRatio > 1.2 ? 0.9 : (armyRatio > 0.8 ? 0.6 : 0.3);
      } else if (action.action === 'defend') {
        score = armyRatio < 0.8 ? 0.7 : 0.4;
      }
    }

    return score;
  }

  /**
   * Estimate future value of an action
   */
  estimateFutureValue(gameState, playerId, action) {
    const player = gameState.players[playerId];
    
    // Simple income projection
    const myUnits = gameState.units.filter(u => u.playerId === playerId);
    const workerCount = myUnits.filter(u => u.type === UnitType.WORKER).length;
    const incomeRate = workerCount * 2; // rough estimate

    if (action.type === 'build_unit' && action.unitType === UnitType.WORKER) {
      // Workers generate future income
      return incomeRate * 5;
    }

    if (action.type === 'build_unit' && action.unitType !== UnitType.WORKER) {
      // Military units provide future security value
      return player.minerals > 400 ? 0.5 : 0.2;
    }

    if (action.type === 'build_building') {
      // Buildings unlock production
      return 0.6;
    }

    return 0;
  }

  /**
   * Validate action meets thresholds
   */
  validateAction(gameState, playerId, action, threshold = 0.5) {
    const score = this.evaluateAction(gameState, playerId, action);
    return score >= threshold;
  }
}
