/**
 * Decision logger for AI replay integration
 * Converts AI decisions into replay-compatible format
 */

/**
 * Format AI decision for replay logging
 * @param {object} decision - AI decision object
 * @param {number} tick - Game tick
 * @param {string} commanderId - Commander ID
 * @returns {object} Formatted action entry
 */
export function formatDecisionForReplay(decision, tick, commanderId) {
  return {
    t: tick,
    actor: commanderId,
    type: decision.type || 'unknown',
    payload: decision.payload || {},
    reason: truncateReason(decision.reasoning || decision.reason || 'No reason provided')
  };
}

/**
 * Extract AI highlights from decision log
 * @param {Array} decisions - Array of decisions
 * @param {number} maxHighlights - Maximum highlights to return
 * @returns {Array} Top AI highlights
 */
export function extractAIHighlights(decisions, maxHighlights = 3) {
  // Score decisions by importance
  const scored = decisions.map(d => ({
    ...d,
    score: calculateDecisionImportance(d)
  }));

  // Sort by score and take top N
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxHighlights);

  return top.map(d => ({
    t: d.t,
    actor: d.actor,
    action: d.type,
    reason: truncateReason(d.reason)
  }));
}

/**
 * Calculate importance score for a decision
 * @param {object} decision - Decision object
 * @returns {number} Importance score
 */
function calculateDecisionImportance(decision) {
  let score = 0;

  // Tactical actions score higher
  const tacticalActions = ['attack', 'defend', 'retreat', 'flank', 'sacrifice'];
  if (tacticalActions.some(action => decision.type.includes(action))) {
    score += 3;
  }

  // Strategic actions
  const strategicActions = ['build', 'expand', 'research'];
  if (strategicActions.some(action => decision.type.includes(action))) {
    score += 2;
  }

  // Longer reasoning suggests more complex decision
  if (decision.reason && decision.reason.length > 50) {
    score += 1;
  }

  // High utility scores
  if (decision.utilityScore && decision.utilityScore > 0.7) {
    score += 2;
  }

  return score;
}

/**
 * Truncate reasoning to 140 characters
 * @param {string} reason - Reasoning text
 * @returns {string} Truncated text
 */
function truncateReason(reason) {
  if (!reason) return 'No reason provided';
  if (reason.length <= 140) return reason;
  return reason.substring(0, 137) + '...';
}

/**
 * Generate judge summary from game state and decisions
 * @param {object} gameState - Final game state
 * @param {Array} decisions - All decisions made
 * @param {string} commanderId - Commander ID
 * @returns {string} One-paragraph summary
 */
export function generateJudgeSummary(gameState, decisions, commanderId) {
  const seed = gameState.map?.seed || 'unknown';
  const outcome = gameState.winner ? 'victory' : gameState.status === 'completed' ? 'draw' : 'defeat';
  
  // Extract key strategic phases
  const highlights = extractAIHighlights(decisions, 3);
  const keyActions = highlights.map(h => h.action).join(', ');

  return `Seed ${seed} generated a ${gameState.map?.type || 'standard'} map. ` +
    `The AI '${commanderId}' employed ${keyActions} tactics. ` +
    `The match concluded in ${outcome} after ${gameState.tick} ticks.`;
}

/**
 * Log decision to in-memory buffer for replay
 */
class ReplayDecisionBuffer {
  constructor() {
    this.buffer = [];
    this.maxSize = 1000; // Keep last 1000 decisions
  }

  add(decision) {
    this.buffer.push(decision);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift(); // Remove oldest
    }
  }

  getAll() {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }

  getHighlights(count = 3) {
    return extractAIHighlights(this.buffer, count);
  }
}

export const replayBuffer = new ReplayDecisionBuffer();
