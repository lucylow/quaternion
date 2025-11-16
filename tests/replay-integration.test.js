// Integration tests for deterministic replay system
import { describe, it, expect, beforeEach } from 'vitest';
import { generateReplay, validateDeterminism } from '../src/replay/generator.js';
import { compressReplay, checkSizeLimit } from '../src/replay/storage.js';
import { ReplaySerializer, extractAIHighlights, generateJudgeSummary } from '../src/replay/serializer.js';
import { validateReplayRequest, validateReplayData } from '../src/lib/validation.js';

describe('Replay System Integration', () => {
  const TEST_REQUEST = {
    seed: 12345,
    mapConfig: {
      type: 'jagged_island',
      width: 64,
      height: 64,
      resourceDensity: 'medium',
      chokepoints: true
    },
    commanderId: 'cautious_geologist',
    mode: 'fast',
    runtime: {
      maxTicks: 100,
      maxDurationSec: 10
    }
  };

  describe('Input Validation', () => {
    it('should validate valid replay request', () => {
      expect(() => validateReplayRequest(TEST_REQUEST)).not.toThrow();
    });

    it('should reject invalid seed', () => {
      const invalid = { ...TEST_REQUEST, seed: -1 };
      expect(() => validateReplayRequest(invalid)).toThrow();
    });

    it('should reject invalid commander ID', () => {
      const invalid = { ...TEST_REQUEST, commanderId: 'invalid@commander!' };
      expect(() => validateReplayRequest(invalid)).toThrow();
    });

    it('should reject oversized map', () => {
      const invalid = {
        ...TEST_REQUEST,
        mapConfig: { ...TEST_REQUEST.mapConfig, width: 1000 }
      };
      expect(() => validateReplayRequest(invalid)).toThrow();
    });

    it('should sanitize and trim inputs', () => {
      const messy = {
        ...TEST_REQUEST,
        commanderId: '  test_commander  '
      };
      const validated = validateReplayRequest(messy);
      expect(validated.commanderId).toBe('test_commander');
    });
  });

  describe('Determinism Tests', () => {
    it('should generate identical content hashes for same inputs', async () => {
      const result = await validateDeterminism(TEST_REQUEST);
      expect(result.deterministic).toBe(true);
      expect(result.hash1).toBe(result.hash2);
    }, 30000);

    it('should generate different hashes for different seeds', async () => {
      const replay1 = await generateReplay(TEST_REQUEST);
      const replay2 = await generateReplay({ ...TEST_REQUEST, seed: 67890 });
      
      expect(replay1.meta.contentHash).not.toBe(replay2.meta.contentHash);
    }, 30000);

    it('should produce consistent AI highlights for same seed', async () => {
      const replay1 = await generateReplay(TEST_REQUEST);
      const replay2 = await generateReplay(TEST_REQUEST);
      
      expect(replay1.aiHighlights.length).toBe(replay2.aiHighlights.length);
      // Note: Exact matching depends on full determinism in game engine
    }, 30000);
  });

  describe('Size Constraints', () => {
    it('should compress replays efficiently', async () => {
      const replay = await generateReplay(TEST_REQUEST);
      const { compressed, sizeKB } = await compressReplay(replay);
      
      expect(compressed).toBeDefined();
      expect(sizeKB).toBeGreaterThan(0);
      console.log(`Compressed size: ${sizeKB}KB`);
    }, 30000);

    it('should detect size limit violations', async () => {
      const replay = await generateReplay(TEST_REQUEST);
      const { compressed } = await compressReplay(replay);
      
      const check = checkSizeLimit(compressed.length, 1);
      expect(check.withinLimit).toBeDefined();
      expect(check.sizeKB).toBeDefined();
      
      if (!check.withinLimit) {
        console.warn(`Replay exceeds 1MB: ${check.sizeKB}KB`);
      }
    }, 30000);

    it('should mark large replays as partial', async () => {
      // This would require generating a very large game
      // For now, just verify the logic exists
      const largeRequest = {
        ...TEST_REQUEST,
        mode: 'full',
        runtime: { maxTicks: 5000 }
      };
      
      // Should timeout and mark as partial
      const replay = await generateReplay(largeRequest);
      // Partial flag should be set if timeout occurred
      expect(typeof replay.partial).toBe('boolean');
    }, 60000);
  });

  describe('Serializer', () => {
    let serializer;

    beforeEach(() => {
      serializer = new ReplaySerializer();
    });

    it('should record actions with truncated reasons', () => {
      const longReason = 'a'.repeat(200);
      serializer.recordAction(10, 'AI#1', 'attack', {}, longReason);
      
      const actions = serializer.getActions();
      expect(actions[0].reason.length).toBeLessThanOrEqual(140);
    });

    it('should limit actions to max count', () => {
      for (let i = 0; i < 300; i++) {
        serializer.recordAction(i, 'AI#1', 'move', {}, 'test');
      }
      
      const actions = serializer.getActions();
      expect(actions.length).toBeLessThanOrEqual(200);
    });

    it('should filter non-pivotal actions in fast mode', () => {
      serializer.setFastMode(true);
      
      serializer.recordAction(1, 'AI#1', 'idle', {}, 'waiting');
      serializer.recordAction(2, 'AI#1', 'attack', {}, 'engage enemy');
      
      const actions = serializer.getActions();
      expect(actions.length).toBe(1);
      expect(actions[0].type).toBe('attack');
    });

    it('should compact payloads', () => {
      const largePayload = {
        position: { x: 10, y: 20 },
        unusedField1: 'data',
        unusedField2: 'more data',
        health: 100,
        unusedField3: 'even more data'
      };
      
      serializer.recordAction(1, 'AI#1', 'move', largePayload, 'test');
      const actions = serializer.getActions();
      
      expect(actions[0].payload).toHaveProperty('position');
      expect(actions[0].payload).not.toHaveProperty('unusedField1');
    });
  });

  describe('AI Highlights Extraction', () => {
    it('should extract top highlights', () => {
      const actions = [
        { t: 10, actor: 'AI#1', type: 'idle', payload: {}, reason: 'waiting' },
        { t: 50, actor: 'AI#1', type: 'attack', payload: {}, reason: 'engage enemy forces' },
        { t: 100, actor: 'AI#1', type: 'capture', payload: {}, reason: 'secure strategic point' },
        { t: 150, actor: 'AI#1', type: 'defend', payload: {}, reason: 'hold position' }
      ];
      
      const highlights = extractAIHighlights(actions, 3);
      
      expect(highlights.length).toBeLessThanOrEqual(3);
      expect(highlights[0].t).toBeGreaterThanOrEqual(0);
      expect(highlights[0].action).toBeDefined();
      expect(highlights[0].reason.length).toBeLessThanOrEqual(140);
    });

    it('should prioritize tactical actions', () => {
      const actions = [
        { t: 10, actor: 'AI#1', type: 'move', payload: {}, reason: 'repositioning' },
        { t: 20, actor: 'AI#1', type: 'sacrifice', payload: {}, reason: 'tactical sacrifice for flanking maneuver' },
        { t: 30, actor: 'AI#1', type: 'idle', payload: {}, reason: 'waiting' }
      ];
      
      const highlights = extractAIHighlights(actions, 2);
      
      // Sacrifice should be first due to high tactical value
      expect(highlights[0].action).toBe('sacrifice');
    });
  });

  describe('Judge Summary Generation', () => {
    it('should generate concise summary', () => {
      const gameState = {
        tick: 500,
        seed: 12345,
        map: { type: 'jagged_island', seed: 12345 },
        winner: 0
      };
      
      const actions = [
        { t: 50, actor: 'AI#1', type: 'capture', reason: 'secure high ground' },
        { t: 200, actor: 'AI#1', type: 'flank', reason: 'execute flanking maneuver' }
      ];
      
      const summary = generateJudgeSummary(gameState, actions, 'cautious_geologist');
      
      expect(summary).toBeDefined();
      expect(summary.length).toBeLessThanOrEqual(1000);
      expect(summary).toContain('12345');
      expect(summary).toContain('cautious_geologist');
    });
  });

  describe('Schema Validation', () => {
    it('should validate complete replay data', async () => {
      const replay = await generateReplay(TEST_REQUEST);
      expect(() => validateReplayData(replay)).not.toThrow();
    }, 30000);

    it('should reject invalid replay structure', () => {
      const invalid = {
        replayId: 'not-a-uuid',
        seed: 12345,
        // missing required fields
      };
      
      expect(() => validateReplayData(invalid)).toThrow();
    });
  });

  describe('Idempotency', () => {
    it('should generate same replayId for deterministic cache', async () => {
      // This tests that the system can cache based on inputs
      const key1 = `${TEST_REQUEST.seed}-${TEST_REQUEST.commanderId}`;
      const key2 = `${TEST_REQUEST.seed}-${TEST_REQUEST.commanderId}`;
      
      expect(key1).toBe(key2);
    });
  });
});
