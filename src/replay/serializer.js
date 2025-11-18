/**
 * Game State Serializer for Replay System
 * Converts GameState to compact, deterministic replay format
 */

import { truncateText, sanitizeForJson } from './validation.js';

/**
 * Serialize game state to compact replay format
 */
export class ReplaySerializer {
  constructor() {
    this.actions = [];
    this.stateDeltas = [];
    this.maxActions = 200;
    this.pivotalOnly = false;
  }

  /**
   * Enable fast mode - only capture pivotal events
   */
  setFastMode(enabled = true) {
    this.pivotalOnly = enabled;
  }

  /**
   * Record an action
   */
  recordAction(tick, actor, type, payload, reason = '') {
    const action = {
      t: tick,
      actor: actor || 'env',
      type: type || 'unknown',
      payload: this.compactPayload(payload),
      reason: truncateText(reason, 140)
    };

    // In fast mode, only record pivotal actions
    if (this.pivotalOnly && !this.isPivotalAction(type)) {
      return;
    }

    this.actions.push(action);

    // Keep only last maxActions
    if (this.actions.length > this.maxActions) {
      this.actions.shift();
    }
  }

  /**
   * Record a state delta
   */
  recordStateDelta(tick, description, delta) {
    this.stateDeltas.push({
      t: tick,
      description: truncateText(description, 500),
      delta: sanitizeForJson(delta)
    });
  }

  /**
   * Check if action is pivotal (strategic importance)
   */
  isPivotalAction(type) {
    const pivotalTypes = [
      'attack', 'defend', 'capture', 'build', 'research',
      'retreat', 'flank', 'sacrifice', 'expand', 'monster_action'
    ];
    return pivotalTypes.some(t => type.toLowerCase().includes(t));
  }

  /**
   * Compact payload - keep only essential fields
   */
  compactPayload(payload) {
    if (!payload || typeof payload !== 'object') return {};

    const essential = {};
    
    // Keep position data
    if (payload.position) essential.position = payload.position;
    if (payload.from) essential.from = payload.from;
    if (payload.to) essential.to = payload.to;
    
    // Keep entity references
    if (payload.unitId) essential.unitId = payload.unitId;
    if (payload.unitType) essential.unitType = payload.unitType;
    if (payload.buildingId) essential.buildingId = payload.buildingId;
    if (payload.structure) essential.structure = payload.structure;
    
    // Keep values
    if (payload.value !== undefined) essential.value = payload.value;
    if (payload.amount !== undefined) essential.amount = payload.amount;
    
    return essential;
  }

  /**
   * Get all recorded actions
   */
  getActions() {
    return this.actions;
  }

  /**
   * Get all state deltas
   */
  getStateDeltas() {
    return this.stateDeltas;
  }

  /**
   * Clear all recorded data
   */
  clear() {
    this.actions = [];
    this.stateDeltas = [];
  }

  /**
   * Export to replay format
   */
  export() {
    return {
      actions: this.getActions(),
      stateDeltas: this.getStateDeltas()
    };
  }
}

/**
 * Extract AI highlights from recorded actions
 */
export function extractAIHighlights(actions, maxHighlights = 3) {
  // Score actions by importance
  const scoredActions = actions
    .filter(a => a.actor.startsWith('AI') || a.actor.includes('commander'))
    .map(action => ({
      ...action,
      score: calculateActionImportance(action)
    }));

  // Sort by score and timestamp (prefer later game actions if tied)
  scoredActions.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.t - a.t;
  });

  // Take top N unique action types
  const highlights = [];
  const seenTypes = new Set();

  for (const action of scoredActions) {
    if (highlights.length >= maxHighlights) break;
    
    const typeKey = `${action.type}`;
    if (!seenTypes.has(typeKey)) {
      highlights.push({
        t: action.t,
        actor: action.actor,
        action: action.type,
        reason: action.reason
      });
      seenTypes.add(typeKey);
    }
  }

  return highlights;
}

/**
 * Calculate action importance score
 */
function calculateActionImportance(action) {
  let score = 0;

  // Tactical actions score higher
  const tacticalActions = ['attack', 'defend', 'retreat', 'flank', 'sacrifice'];
  if (tacticalActions.some(t => action.type.toLowerCase().includes(t))) {
    score += 5;
  }

  // Strategic actions
  const strategicActions = ['build', 'expand', 'research', 'capture'];
  if (strategicActions.some(t => action.type.toLowerCase().includes(t))) {
    score += 3;
  }

  // Complex reasoning
  if (action.reason && action.reason.length > 50) {
    score += 2;
  }

  // Payload complexity
  if (action.payload && Object.keys(action.payload).length > 2) {
    score += 1;
  }

  return score;
}

/**
 * Generate judge-friendly summary
 */
export function generateJudgeSummary(gameState, actions, commanderId) {
  const seed = gameState.map?.seed || gameState.seed || 'unknown';
  const mapType = gameState.map?.type || 'standard';
  
  // Determine outcome
  let outcome = 'draw';
  if (gameState.winner !== undefined) {
    outcome = gameState.winner === 0 ? 'victory' : 'defeat';
  } else if (gameState.status === 'completed') {
    outcome = 'draw';
  }

  // Extract key strategic moments
  const highlights = extractAIHighlights(actions, 3);
  const keyMoments = highlights
    .map(h => `${h.action} at t=${h.t}`)
    .join(', ');

  // Build summary
  let summary = `Seed ${seed} generated a ${mapType} map. `;
  summary += `Commander '${commanderId}' `;
  
  if (highlights.length > 0) {
    summary += `employed ${keyMoments} tactics. `;
  } else {
    summary += `executed a standard strategy. `;
  }
  
  summary += `The match concluded in ${outcome} after ${gameState.tick || 0} ticks.`;

  return truncateText(summary, 1000);
}
