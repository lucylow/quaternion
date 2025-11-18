// src/lib/ai/utilityAgent.ts
/**
 * A tiny, testable utility agent.
 * Input: compact state snapshot { units: [...], enemies: [...], resources, map }
 * Output: array of candidate actions with scores.
 */

export type StateSnapshot = {
  resources: { minerals: number; gas: number };
  units: Array<{ id: string; type: string; hp: number; x: number; y: number; busy: boolean }>;
  enemies: Array<{ id: string; threat: number; x: number; y: number }>;
  time: number;
  enemyStrength: number; // aggregate measure
  playerStrength: number;
  mapControl: number; // -1..1
};

export type Candidate = { action: string; score: number; meta?: any; reason?: string };

export function computeUtilities(state: StateSnapshot): Candidate[] {
  const candidates: Candidate[] = [];

  // 1) build worker if low workers and resources
  const workerCount = state.units.filter(u => u.type === 'worker').length;
  if (workerCount < 12 && state.resources.minerals >= 50) {
    candidates.push({ action: 'train_worker', score: 60, reason: 'insufficient workers' });
  } else {
    candidates.push({ action: 'train_worker', score: 10, reason: 'worker not priority' });
  }

  // 2) expand base if map control and resources
  if (state.mapControl > 0.2 && state.resources.minerals >= 400) {
    candidates.push({ action: 'build_expansion', score: 50, reason: 'map control + minerals' });
  }

  // 3) produce military if enemy stronger
  if (state.enemyStrength > state.playerStrength * 0.8 && state.resources.minerals >= 100) {
    candidates.push({ action: 'produce_military', score: 80, reason: 'react to enemy' });
  } else {
    candidates.push({ action: 'produce_military', score: 30, reason: 'build army' });
  }

  // 4) harass if enemy vulnerabilities exist
  if (state.enemies.length > 0 && state.playerStrength > state.enemyStrength * 0.6) {
    candidates.push({ action: 'harass', score: 55, reason: 'player advantage' });
  }

  // 5) economy micro if worker idle
  const idleWorkers = state.units.filter(u => u.type === 'worker' && u.busy === false).length;
  if (idleWorkers > 2) candidates.push({ action: 'assign_workers', score: 45, reason: 'idle workers' });

  // sort descending
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

export function pickBestAction(cands: Candidate[]): Candidate {
  return cands.length ? cands[0] : { action: 'noop', score: 0 };
}

