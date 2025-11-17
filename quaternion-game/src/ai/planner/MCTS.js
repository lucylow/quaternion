import { UnitType } from '../../units/Unit.js';
import { BuildingType } from '../../buildings/Building.js';

/**
 * Monte Carlo Tree Search planner for deterministic fallback
 * Provides fast, local decision-making without LLM calls
 */
export default class MCTS {
  constructor({ rollouts = 100 } = {}) {
    this.rollouts = rollouts;
  }

  /**
   * Get best action for current game state
   */
  bestMove(gameState, playerId) {
    const legal = this.getLegalActions(gameState, playerId);
    if (legal.length === 0) return null;

    let best = null;
    let bestScore = -Infinity;

    for (let action of legal) {
      const score = this.evaluateAction(gameState, playerId, action);
      if (score > bestScore) {
        bestScore = score;
        best = action;
      }
    }

    return best;
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
   * Heuristic score for an action
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
