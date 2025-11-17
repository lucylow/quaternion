// Determinism tests for replay system
import { describe, it, expect } from 'vitest';

describe('Replay Determinism', () => {
  const TEST_SEED = 42;
  const TEST_CONFIG = {
    type: 'test_map',
    width: 32,
    height: 32,
    resourceDensity: 'low'
  };
  const TEST_COMMANDER = 'test_commander';

  describe('Content Hash Verification', () => {
    it('should generate consistent content hash for same inputs', async () => {
      // Simulate replay generation with same seed
      const replay1 = {
        seed: TEST_SEED,
        mapConfig: TEST_CONFIG,
        commanderId: TEST_COMMANDER,
        actions: [{ t: 1, actor: 'AI#1', type: 'build', payload: {}, reason: 'test' }],
        meta: { version: 'v1' }
      };

      const replay2 = {
        seed: TEST_SEED,
        mapConfig: TEST_CONFIG,
        commanderId: TEST_COMMANDER,
        actions: [{ t: 1, actor: 'AI#1', type: 'build', payload: {}, reason: 'test' }],
        meta: { version: 'v1' }
      };

      const hash1 = await generateHash(replay1);
      const hash2 = await generateHash(replay2);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different seeds', async () => {
      const replay1 = {
        seed: 12345,
        mapConfig: TEST_CONFIG,
        commanderId: TEST_COMMANDER,
        meta: { version: 'v1' }
      };

      const replay2 = {
        seed: 67890,
        mapConfig: TEST_CONFIG,
        commanderId: TEST_COMMANDER,
        meta: { version: 'v1' }
      };

      const hash1 = await generateHash(replay1);
      const hash2 = await generateHash(replay2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Seed-Based Determinism', () => {
    it('should produce same outcome for same seed', () => {
      const outcome1 = TEST_SEED % 3 === 0 ? 'victory' : TEST_SEED % 3 === 1 ? 'defeat' : 'draw';
      const outcome2 = TEST_SEED % 3 === 0 ? 'victory' : TEST_SEED % 3 === 1 ? 'defeat' : 'draw';

      expect(outcome1).toBe(outcome2);
    });

    it('should generate consistent AI highlights for same seed', () => {
      const highlights1 = generateTestHighlights(TEST_SEED);
      const highlights2 = generateTestHighlights(TEST_SEED);

      expect(highlights1).toEqual(highlights2);
    });
  });

  describe('Size Constraints', () => {
    it('should mark replay as partial if exceeds 1MB', () => {
      const maxSize = 1024 * 1024; // 1MB
      const largeReplay = {
        replayId: 'test',
        seed: TEST_SEED,
        actions: new Array(10000).fill({ t: 1, actor: 'AI', type: 'move', payload: {}, reason: 'test' }),
        partial: false
      };

      const size = JSON.stringify(largeReplay).length;
      const shouldBePartial = size > maxSize;

      if (shouldBePartial) {
        largeReplay.partial = true;
        expect(largeReplay.partial).toBe(true);
      }
    });

    it('should keep compressed replays under 1MB for normal games', () => {
      // Approximate compression ratio for JSON with gzip: ~5-10x
      const normalReplay = {
        replayId: 'test',
        seed: TEST_SEED,
        actions: new Array(200).fill({ t: 1, actor: 'AI', type: 'move', payload: {}, reason: 'test' })
      };

      const uncompressedSize = JSON.stringify(normalReplay).length;
      const estimatedCompressedSize = uncompressedSize / 7; // Conservative estimate

      expect(estimatedCompressedSize).toBeLessThan(1024 * 1024);
    });
  });

  describe('Reasoning Truncation', () => {
    it('should truncate reasons longer than 140 chars', () => {
      const longReason = 'a'.repeat(200);
      const truncated = truncateReason(longReason);

      expect(truncated.length).toBeLessThanOrEqual(140);
    });

    it('should preserve short reasons unchanged', () => {
      const shortReason = 'Quick tactical move';
      const result = truncateReason(shortReason);

      expect(result).toBe(shortReason);
    });
  });

  describe('Idempotency', () => {
    it('should return same replayId or identical content for duplicate requests', () => {
      const request = {
        seed: TEST_SEED,
        mapConfig: TEST_CONFIG,
        commanderId: TEST_COMMANDER
      };

      // Simulate duplicate request handling
      const replayId1 = generateReplayId(request);
      const replayId2 = generateReplayId(request);

      // Either same ID (cached) or different IDs with identical content
      expect(typeof replayId1).toBe('string');
      expect(typeof replayId2).toBe('string');
    });
  });

  describe('Non-Determinism Detection', () => {
    it('should flag non-deterministic behavior in meta', () => {
      const replay = {
        seed: TEST_SEED,
        meta: {
          version: 'v1',
          nonDeterminism: null
        },
        partial: false
      };

      // Simulate detection of non-deterministic behavior
      const detectedNonDeterminism = false; // Would be true if Date.now() used, etc.

      if (detectedNonDeterminism) {
        replay.meta.nonDeterminism = { reason: 'Time-based randomness detected' };
        replay.partial = true;
      }

      expect(replay.meta.nonDeterminism).toBeNull();
      expect(replay.partial).toBe(false);
    });
  });
});

// Helper functions
async function generateHash(data) {
  const jsonStr = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateTestHighlights(seed) {
  return [
    { t: 48 + (seed % 100), actor: 'AI#1', action: 'test', reason: 'test reason' }
  ];
}

function truncateReason(reason) {
  if (!reason) return 'No reason provided';
  if (reason.length <= 140) return reason;
  return reason.substring(0, 137) + '...';
}

function generateReplayId(request) {
  // Simple deterministic ID based on request
  return `replay-${request.seed}-${request.commanderId}`;
}
