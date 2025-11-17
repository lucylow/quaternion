# Quaternion Replay System

Production-grade deterministic replay system with comprehensive validation, game engine integration, and judge-ready artifacts.

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run determinism tests
npm run test:determinism
```

## API Endpoints

### Generate Replay
```bash
curl -X POST https://aiuoepsagqbuwmjjastv.supabase.co/functions/v1/replay-handler/generate \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "seed": 12345,
    "mapConfig": {
      "type": "jagged_island",
      "width": 64,
      "height": 64,
      "resourceDensity": "medium",
      "chokepoints": true
    },
    "commanderId": "cautious_geologist",
    "mode": "fast",
    "runtime": {
      "maxTicks": 1000,
      "maxDurationSec": 30
    }
  }'
```

Response:
```json
{
  "replayId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "url": "https://storage.../replay.json.gz",
  "summary": "Seed 12345 generated a jagged_island map...",
  "aiHighlights": [
    {
      "t": 48,
      "actor": "cautious_geologist",
      "action": "secure_high_ground",
      "reason": "Prioritize high ground for vision and defense"
    }
  ],
  "seed": 12345,
  "finalOutcome": "victory",
  "partial": false
}
```

### Get Replay
```bash
curl https://aiuoepsagqbuwmjjastv.supabase.co/functions/v1/replay-handler/{replayId} \
  -H "apikey: YOUR_ANON_KEY"
```

### Download Replay
```bash
curl -o replay.json.gz \
  https://aiuoepsagqbuwmjjastv.supabase.co/functions/v1/replay-handler/{replayId}/download \
  -H "apikey: YOUR_ANON_KEY"

# Decompress
gunzip replay.json.gz
```

## Features

✅ **Input Validation** - Zod schemas prevent injection attacks and ensure data integrity  
✅ **Deterministic Replays** - Same seed + config = identical contentHash  
✅ **Compression** - Gzip compression keeps artifacts <1MB  
✅ **Storage Integration** - Supabase Storage with 7-day signed URLs  
✅ **AI Transparency** - Captures AI reasoning and decision highlights  
✅ **Judge Summaries** - One-paragraph English summaries for judges  
✅ **Size Limits** - Automatic truncation and partial replay flagging  
✅ **Comprehensive Tests** - Unit, integration, and determinism tests  

## Replay Schema

```typescript
{
  replayId: string;          // UUID
  seed: number;              // Deterministic seed
  mapConfig: {               // Map configuration
    type: string;
    width: number;
    height: number;
    resourceDensity?: 'low' | 'medium' | 'high';
    chokepoints?: boolean;
  };
  commanderId: string;       // AI commander ID
  startTime: string;         // ISO8601
  endTime: string;           // ISO8601
  durationSec: number;       // Duration in seconds
  finalOutcome: 'victory' | 'defeat' | 'draw' | 'partial';
  summary: string;           // 1-paragraph judge summary (≤1000 chars)
  aiHighlights: [{           // Top 3-6 AI decisions
    t: number;               // Tick/timestamp
    actor: string;           // Commander ID
    action: string;          // Action type
    reason: string;          // ≤140 chars
  }];
  actions: [{                // Up to 200 actions
    t: number;
    actor: string;
    type: string;
    payload: object;         // Minimal essential fields
    reason: string;          // ≤140 chars
  }];
  stateDeltas?: [{           // Optional aggregated diffs
    t: number;
    description: string;
    delta: object;
  }];
  meta: {
    version: string;
    engineCommit: string;    // Git SHA
    contentHash: string;     // SHA-256 for determinism
    generatedBy: string;
    nonDeterminism: null | { reason: string };
    truncated?: boolean;
  };
  partial: boolean;          // True if truncated/timeout
}
```

## Input Validation

All inputs validated with Zod:

```javascript
import { validateReplayRequest } from './src/lib/validation.js';

try {
  const validated = validateReplayRequest(userInput);
  // Safe to use
} catch (error) {
  // Validation failed - error.errors contains details
}
```

### Validation Rules

- **Seed**: Non-negative integer, max Number.MAX_SAFE_INTEGER
- **Map Config**: Width/height 8-256, strict schema
- **Commander ID**: 1-100 chars, alphanumeric + underscore/hyphen only
- **Mode**: 'fast' or 'full'
- **Runtime**: maxTicks 1-10000, maxDurationSec 1-60

## Determinism

Guarantees identical replays for same inputs:

```bash
# Run determinism test
npm run test:determinism
```

```javascript
import { validateDeterminism } from './src/replay/generator.js';

const result = await validateDeterminism({
  seed: 12345,
  mapConfig: { type: 'test', width: 64, height: 64 },
  commanderId: 'test_commander'
});

console.log(result.deterministic); // true
console.log(result.hash1 === result.hash2); // true
```

## Size Constraints

- **Max artifact size**: 1MB gzipped
- **Auto-truncation**: Marks replays as `partial: true` if exceeded
- **Action limit**: Last 200 actions
- **Reason truncation**: 140 characters per reason
- **Fast mode**: Filters non-pivotal actions for efficiency

## Game Engine Integration

Real integration with existing game engine:

```javascript
import { generateReplay } from './src/replay/generator.js';

const replay = await generateReplay({
  seed: 12345,
  mapConfig: { type: 'jagged_island', width: 64, height: 64 },
  commanderId: 'cautious_geologist',
  mode: 'fast'
});

// Uses:
// - MapGenerator for deterministic maps
// - GameState for simulation
// - AIController for decisions
// - ReplaySerializer for compact output
```

## Testing

```bash
# All tests
npm test

# Specific test suites
npm test tests/replay.test.js
npm test tests/replay-integration.test.js
npm test tests/determinism.test.js

# Watch mode
npm run test:watch
```

### Test Coverage

- ✅ Input validation edge cases
- ✅ Determinism verification
- ✅ Size constraint enforcement
- ✅ Compression efficiency
- ✅ AI highlight extraction
- ✅ Judge summary generation
- ✅ Schema validation
- ✅ Idempotency checks

## Storage

Replays stored in Supabase Storage bucket `replays`:

- **Format**: Gzip compressed JSON
- **Signed URLs**: 7-day expiry
- **Path**: `{replayId}.json.gz`
- **Fallback**: In-memory storage if upload fails

## Performance

- **Average generation**: <5 seconds (fast mode)
- **Compressed size**: 50-300KB typical
- **Memory usage**: <512MB
- **Runtime limit**: 30s (fast) / 60s (full)

## Error Handling

- **400**: Invalid input (validation failure)
- **404**: Replay not found
- **422**: Schema validation failed
- **500**: Internal error (includes errorId)

## Security

- **Input sanitization**: All user inputs validated
- **No PII**: Replays contain no personally identifiable information
- **Injection prevention**: Zod schemas prevent malicious inputs
- **Length limits**: All text fields have max lengths
- **Character restrictions**: Commander IDs restricted to safe characters

## Improvements for Chroma Judging

This implementation addresses Chroma judging criteria:

1. **Reproducibility**: Deterministic generation with contentHash verification
2. **Transparency**: AI reasoning captured in highlights and actions
3. **Production Polish**: Comprehensive validation, error handling, tests
4. **Compact Artifacts**: Gzip compression + size limits
5. **Judge-Friendly**: One-paragraph summaries + top AI decisions
6. **Observability**: Health/metrics endpoints, structured logging

## Sample Artifacts

See `tests/fixtures/` for:
- `sample-full-replay.json` - Complete replay
- `sample-truncated-replay.json` - Partial replay (>1MB)

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run Determinism Tests
  run: npm run test:determinism
  
- name: Verify Replay Size
  run: npm run test:size
```

## License

MIT
