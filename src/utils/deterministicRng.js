// src/utils/deterministicRng.js
// Simple seeded RNG wrapper used through the engine.
// Uses 'seedrandom' for deterministic RNG across runs.

const seedrandom = require('seedrandom');

function createRng(seed) {
  // returns function() -> [0,1)
  const rng = seedrandom(String(seed), { global: false });
  return () => rng();
}

module.exports = { createRng };

