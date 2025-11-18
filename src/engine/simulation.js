// src/engine/simulation.js
// Engine adapter that wraps game state to provide authoritative tick interface
// This bridges the new multiplayer server with existing game state

const crypto = require('crypto');

// This will be set by the server when initializing
let gameStateInstance = null;
let eventLog = [];

/**
 * Initialize the engine with a game state instance
 */
function initializeEngine(gameState) {
  gameStateInstance = gameState;
  eventLog = [];
}

/**
 * Apply commands from clients
 */
function applyCommands(commands, opts = {}) {
  if (!gameStateInstance) {
    console.warn('[ENGINE] No game state instance initialized');
    return;
  }

  // commands: array of command objects from clients
  // deterministic order assumed
  for (const cmd of commands) {
    try {
      // Map command to game state action
      // The command format: { actorId, commandType, payload, tRequest, nonce }
      const actorId = cmd.actorId || cmd.playerId;
      const commandType = cmd.commandType || cmd.type;
      const payload = cmd.payload || cmd;

      // Apply command based on type
      if (gameStateInstance.executeCommand) {
        gameStateInstance.executeCommand({
          playerId: actorId,
          commandType,
          ...payload
        });
      } else if (gameStateInstance.applyAction) {
        gameStateInstance.applyAction({
          type: commandType,
          payload
        });
      }

      // Push compact event to eventLog
      eventLog.push({
        t: opts.tick || gameStateInstance.tick || 0,
        actor: actorId,
        type: commandType,
        payload: payload
      });
    } catch (err) {
      console.warn('[ENGINE] command apply failed', err);
    }
  }
}

/**
 * Step simulation for one tick
 */
function tick(tickNumber, rng) {
  if (!gameStateInstance) {
    console.warn('[ENGINE] No game state instance initialized');
    return;
  }

  // Update game state with fixed timestep
  // Use rng() for any randomness; ensure all randomness is through rng
  const deltaTime = 1.0 / 60; // Fixed 60 FPS timestep

  // If game state has a tick method that accepts RNG, use it
  if (typeof gameStateInstance.tick === 'function') {
    gameStateInstance.tick(tickNumber, rng);
  } else if (typeof gameStateInstance.update === 'function') {
    // Otherwise use update with deltaTime
    // Note: We need to inject RNG into the game state if it uses randomness
    // For now, we'll update normally - the game state should use deterministic RNG internally
    gameStateInstance.update(deltaTime);
  }

  // Update tick counter if game state has one
  if (gameStateInstance.tick !== undefined) {
    gameStateInstance.tick = tickNumber;
  }
}

/**
 * Collect deltas since last call
 */
function collectDeltas(tickNumber) {
  // Produce minimal deltas since last broadcast, then clear event log
  const snapshot = eventLog.slice();
  eventLog.length = 0;

  // Optionally include small state diffs
  const deltas = snapshot.map(event => ({
    tick: event.t,
    actor: event.actor,
    type: event.type,
    payload: event.payload
  }));

  return deltas;
}

/**
 * Get state hash for desync detection
 */
function getStateHash() {
  if (!gameStateInstance) return null;

  try {
    // Create a canonical representation of the state
    const canonical = canonicalize(gameStateInstance);
    return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 10);
  } catch (e) {
    console.warn('[ENGINE] Failed to compute state hash', e);
    return null;
  }
}

/**
 * Get snapshot of current state
 */
function getSnapshot() {
  if (!gameStateInstance) {
    return { stateHash: null, minimalState: {} };
  }

  return {
    stateHash: getStateHash(),
    minimalState: getMinimalState()
  };
}

/**
 * Get minimal state representation
 */
function getMinimalState() {
  if (!gameStateInstance) return {};

  // Extract key state information
  const state = {
    tick: gameStateInstance.tick || 0,
    players: []
  };

  // Get player data if available
  if (gameStateInstance.players) {
    if (gameStateInstance.players instanceof Map) {
      for (const [id, player] of gameStateInstance.players.entries()) {
        state.players.push({
          id,
          resources: player.resources || {},
          population: player.population || {}
        });
      }
    } else if (Array.isArray(gameStateInstance.players)) {
      state.players = gameStateInstance.players.map(p => ({
        id: p.id,
        resources: p.resources || {},
        population: p.population || {}
      }));
    }
  }

  return state;
}

/**
 * Canonicalize state for hashing (stable JSON with sorted keys)
 */
function canonicalize(obj) {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }

  // Sort keys for deterministic ordering
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(key => {
    // Skip functions and circular references
    if (typeof obj[key] === 'function') {
      return `"${key}":null`;
    }
    try {
      return `"${key}":${canonicalize(obj[key])}`;
    } catch (e) {
      return `"${key}":null`;
    }
  });

  return '{' + pairs.join(',') + '}';
}

module.exports = {
  initializeEngine,
  applyCommands,
  tick,
  collectDeltas,
  getStateHash,
  getSnapshot
};

