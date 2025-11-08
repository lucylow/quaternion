// src/ai/decision-logger.js
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(process.cwd(), 'logs');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Append a JSONL decision entry for a given game.
 * Each line is a JSON object.
 *
 * @param {string|number} gameId
 * @param {object} entry - { commanderId, tick, actionScores, chosen, metadata }
 */
function logDecision(gameId, entry) {
  try {
    ensureLogDir();
    const fname = path.join(LOG_DIR, `game_${gameId}_decisions.jsonl`);
    const out = Object.assign({}, entry, { loggedAt: new Date().toISOString() });
    fs.appendFileSync(fname, JSON.stringify(out) + '\n');
  } catch (err) {
    // Don't crash the server for logging failures
    console.error('decision-logger error:', err);
  }
}

module.exports = {
  logDecision,
  LOG_DIR
};
