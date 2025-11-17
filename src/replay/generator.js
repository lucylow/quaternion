/**
 * Replay Generator - Deterministic game replay generation
 * Integrates with existing GameState, AIController, MapGenerator
 */

import GameState from '../game/GameState.js';
import AIController from '../ai/AIController.js';
import MapGenerator from '../map/MapGenerator.js';
import { ReplaySerializer, generateJudgeSummary, extractAIHighlights } from './serializer.js';
import { truncateText } from '../lib/validation.js';
import crypto from 'crypto';

/**
 * Run deterministic game simulation
 */
export async function generateReplay(options) {
  const {
    seed,
    mapConfig,
    commanderId,
    mode = 'fast',
    runtime = {}
  } = options;

  const startTime = new Date();
  const maxTicks = runtime.maxTicks || (mode === 'fast' ? 1000 : 5000);
  const maxDurationMs = (runtime.maxDurationSec || 30) * 1000;

  // Initialize serializer
  const serializer = new ReplaySerializer();
  serializer.setFastMode(mode === 'fast');

  // Generate map using deterministic seed
  console.log(`Generating map with seed=${seed}`);
  const mapGenerator = new MapGenerator(mapConfig.width, mapConfig.height);
  const map = mapGenerator.generate(seed);

  // Initialize game state
  const gameState = new GameState({
    map,
    seed,
    tick: 0,
    players: [
      { id: 0, resources: 100, units: [], buildings: [] },
      { id: 1, resources: 100, units: [], buildings: [] }
    ]
  });

  // Initialize AI controller with deterministic seed
  const aiController = new AIController({
    commanderId,
    seed,
    personality: getCommanderPersonality(commanderId)
  });

  // Track decision metadata
  const decisionLog = [];

  // Simulation loop
  let tick = 0;
  let outcome = 'draw';
  const timeoutTime = Date.now() + maxDurationMs;

  try {
    while (tick < maxTicks && Date.now() < timeoutTime) {
      // Check for game end conditions
      if (gameState.isGameOver && gameState.isGameOver()) {
        outcome = gameState.winner === 0 ? 'victory' : 'defeat';
        break;
      }

      // AI decision making
      if (tick % 10 === 0) { // AI decides every 10 ticks
        try {
          const decision = await aiController.decide(gameState);
          
          if (decision) {
            // Record decision
            serializer.recordAction(
              tick,
              commanderId,
              decision.type || 'move',
              decision.payload || {},
              decision.reasoning || decision.reason || ''
            );

            decisionLog.push({
              tick,
              decision,
              reasoning: truncateText(decision.reasoning || '', 140)
            });

            // Apply decision to game state
            if (gameState.applyAction) {
              gameState.applyAction(decision);
            }
          }
        } catch (aiError) {
          console.warn(`AI error at tick ${tick}:`, aiError.message);
        }
      }

      // Update game state
      if (gameState.update) {
        gameState.update();
      }

      tick++;

      // Record state delta every 100 ticks in fast mode
      if (mode === 'fast' && tick % 100 === 0) {
        serializer.recordStateDelta(tick, 'Periodic state snapshot', {
          resources: gameState.players[0]?.resources || 0,
          unitCount: gameState.players[0]?.units?.length || 0
        });
      }
    }
  } catch (error) {
    console.error('Simulation error:', error);
    outcome = 'partial';
  }

  const endTime = new Date();
  const durationSec = Math.floor((endTime - startTime) / 1000);

  // Mark as partial if timeout
  const partial = Date.now() >= timeoutTime || tick >= maxTicks;

  // Extract highlights
  const actions = serializer.getActions();
  const aiHighlights = extractAIHighlights(actions, 3);

  // Generate summary
  const summary = generateJudgeSummary(
    { ...gameState, tick, seed, map: { seed, type: mapConfig.type } },
    actions,
    commanderId
  );

  // Get git commit (if available)
  const engineCommit = process.env.GIT_COMMIT || 'development';

  // Build replay data
  const replayData = {
    replayId: crypto.randomUUID(),
    seed,
    mapConfig,
    commanderId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationSec,
    finalOutcome: partial ? 'partial' : outcome,
    summary,
    aiHighlights,
    actions,
    stateDeltas: serializer.getStateDeltas(),
    meta: {
      version: 'v1',
      engineCommit,
      generatedBy: 'quaternion-replay-exporter-v1.0',
      contentHash: '', // Will be set after JSON generation
      nonDeterminism: null
    },
    partial
  };

  // Calculate content hash for determinism verification
  const canonicalJson = JSON.stringify(replayData, Object.keys(replayData).sort(), 2);
  const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');
  replayData.meta.contentHash = hash;

  return replayData;
}

/**
 * Get commander personality traits
 */
function getCommanderPersonality(commanderId) {
  const personalities = {
    'cautious_geologist': { aggressiveness: 0.3, risk_tolerance: 0.2, patience: 0.8 },
    'aggressive_commander': { aggressiveness: 0.9, risk_tolerance: 0.8, patience: 0.2 },
    'balanced_strategist': { aggressiveness: 0.5, risk_tolerance: 0.5, patience: 0.5 },
    'defensive_architect': { aggressiveness: 0.2, risk_tolerance: 0.3, patience: 0.9 }
  };

  return personalities[commanderId] || personalities['balanced_strategist'];
}

/**
 * Validate replay determinism
 */
export async function validateDeterminism(request) {
  const replay1 = await generateReplay(request);
  const replay2 = await generateReplay(request);

  return {
    deterministic: replay1.meta.contentHash === replay2.meta.contentHash,
    hash1: replay1.meta.contentHash,
    hash2: replay2.meta.contentHash
  };
}
