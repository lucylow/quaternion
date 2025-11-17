import { describe, it, expect, beforeEach } from 'vitest';
import MCTS from '../src/ai/planner/MCTS.js';
import { LRUCache, hashPrompt } from '../src/ai/cache.js';
import { safeParseJSON } from '../src/ai/modelClient.js';
import { buildStrategyPrompt } from '../src/ai/promptTemplates.js';

describe('MCTS Planner', () => {
  let planner;
  let gameState;

  beforeEach(() => {
    planner = new MCTS({ rollouts: 100 });
    gameState = {
      tick: 10,
      players: {
        0: { minerals: 500, gas: 100 },
        1: { minerals: 300, gas: 50 }
      },
      units: [
        { playerId: 0, type: 'worker', x: 10, y: 10 },
        { playerId: 0, type: 'worker', x: 11, y: 11 },
        { playerId: 0, type: 'soldier', x: 15, y: 15 },
        { playerId: 1, type: 'worker', x: 50, y: 50 }
      ],
      buildings: [
        { playerId: 0, type: 'base', isComplete: true, x: 10, y: 10 },
        { playerId: 0, type: 'barracks', isComplete: true, x: 12, y: 12 },
        { playerId: 1, type: 'base', isComplete: true, x: 50, y: 50 }
      ]
    };
  });

  it('should generate legal actions', () => {
    const actions = planner.getLegalActions(gameState, 0);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some(a => a.type === 'build_unit')).toBe(true);
  });

  it('should evaluate actions with scores', () => {
    const actions = planner.getLegalActions(gameState, 0);
    const workerAction = actions.find(a => a.unitType === 'worker');
    
    if (workerAction) {
      const score = planner.evaluateAction(gameState, 0, workerAction);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('should return best move', () => {
    const best = planner.bestMove(gameState, 0);
    expect(best).toBeDefined();
    expect(best.type).toBeDefined();
  });

  it('should validate actions against threshold', () => {
    const actions = planner.getLegalActions(gameState, 0);
    const firstAction = actions[0];
    const isValid = planner.validateAction(gameState, 0, firstAction, 0.3);
    expect(typeof isValid).toBe('boolean');
  });
});

describe('LRU Cache', () => {
  it('should store and retrieve values', () => {
    const cache = new LRUCache(3);
    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });
    
    expect(cache.get('key1')).toEqual({ value: 1 });
    expect(cache.get('key2')).toEqual({ value: 2 });
  });

  it('should evict oldest when full', () => {
    const cache = new LRUCache(2);
    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });
    cache.set('key3', { value: 3 });
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toEqual({ value: 2 });
    expect(cache.get('key3')).toEqual({ value: 3 });
  });

  it('should move accessed items to end', () => {
    const cache = new LRUCache(2);
    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });
    cache.get('key1'); // Access key1
    cache.set('key3', { value: 3 });
    
    expect(cache.get('key1')).toEqual({ value: 1 });
    expect(cache.get('key2')).toBeNull();
  });
});

describe('Prompt Templates', () => {
  it('should build strategy prompt with game state', () => {
    const gameState = {
      tick: 50,
      players: {
        0: { minerals: 200, gas: 50 }
      },
      units: [
        { playerId: 0, type: 'worker', x: 10, y: 10 },
        { playerId: 1, type: 'soldier', x: 20, y: 20 }
      ],
      buildings: [
        { playerId: 0, type: 'base', x: 10, y: 10 }
      ]
    };

    const prompt = buildStrategyPrompt(gameState, 0);
    expect(prompt).toContain('Tick 50');
    expect(prompt).toContain('200 minerals');
    expect(prompt).toContain('1 workers');
  });
});

describe('Model Client', () => {
  it('should parse valid JSON', () => {
    const json = '{"action": "attack", "target": "enemy_base"}';
    const parsed = safeParseJSON(json);
    expect(parsed).toEqual({ action: 'attack', target: 'enemy_base' });
  });

  it('should parse JSON in markdown code blocks', () => {
    const markdown = '```json\n{"action": "defend", "priority": "high"}\n```';
    const parsed = safeParseJSON(markdown);
    expect(parsed).toEqual({ action: 'defend', priority: 'high' });
  });

  it('should return null for invalid JSON', () => {
    const invalid = 'not json at all';
    const parsed = safeParseJSON(invalid);
    expect(parsed).toBeNull();
  });
});

describe('Hash Function', () => {
  it('should generate consistent hashes', () => {
    const hash1 = hashPrompt('test prompt', 0);
    const hash2 = hashPrompt('test prompt', 0);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different inputs', () => {
    const hash1 = hashPrompt('prompt1', 0);
    const hash2 = hashPrompt('prompt2', 0);
    expect(hash1).not.toBe(hash2);
  });
});
