# Replay System - Judge-Ready Backend

## Overview

Deterministic replay generation system for Quaternion AI that produces compact, reproducible game replays for judging and analysis.

## Endpoints

### Generate Replay
```bash
curl -X POST https://aiuoepsagqbuwmjjastv.supabase.co/functions/v1/replay-handler/generate \
  -H "Content-Type: application/json" \
  -d '{
    "seed": 12345,
    "mapConfig": {
      "type": "jagged_island",
      "width": 64,
      "height": 64,
      "resourceDensity": "medium"
    },
    "commanderId": "cautious_geologist"
  }'
```

Response:
```json
{
  "replayId": "uuid",
  "url": "https://storage.../replay.json.gz",
  "summary": "One-paragraph judge summary",
  "aiHighlights": [
    {"t": 48, "actor": "AI#1", "action": "secure_high_ground", "reason": "..."}
  ],
  "partial": false
}
```

### Get Replay Metadata
```bash
curl https://aiuoepsagqbuwmjjastv.supabase.co/functions/v1/replay-handler/{replayId}
```

### Download Replay
```bash
curl -o replay.json.gz \
  https://aiuoepsagqbuwmjjastv.supabase.co/functions/v1/replay-handler/{replayId}/download
```

### Health Check
```bash
curl https://aiuoepsagqbuwmjjastv.supabase.co/functions/v1/replay-handler/health
```

### Metrics
```bash
curl https://aiuoepsagqbuwmjjastv.supabase.co/functions/v1/replay-handler/metrics
```

## Replay Schema

```typescript
{
  replayId: string;          // UUID
  seed: number;              // Deterministic seed
  mapConfig: object;         // Map configuration
  commanderId: string;       // AI commander ID
  startTime: string;         // ISO8601
  endTime: string;           // ISO8601
  durationSec: number;       // Game duration
  finalOutcome: 'victory' | 'defeat' | 'draw' | 'partial';
  summary: string;           // 1-paragraph judge summary
  aiHighlights: [{           // Top 3-6 AI decisions
    t: number;               // Tick
    actor: string;           // Commander ID
    action: string;          // Action type
    reason: string;          // ≤140 chars
  }];
  actions: [{                // Up to 200 actions
    t: number;
    actor: string;
    type: string;
    payload: object;         // Minimal
    reason: string;          // ≤140 chars
  }];
  meta: {
    version: string;
    engineCommit: string;    // Git SHA
    contentHash: string;     // SHA-256 of JSON
    generatedBy: string;
    nonDeterminism: null | object;
  };
  partial: boolean;          // True if truncated
}
```

## Determinism

- **Same Seed = Same Replay**: Running the same seed, mapConfig, and commanderId produces identical content hashes
- **Content Hash**: SHA-256 hash of the JSON (pre-compression) stored in `meta.contentHash`
- **No Time-Based Randomness**: All RNG seeded deterministically
- **Engine Commit**: Git SHA included for version tracking

## Constraints

- **Size Limit**: 1MB gzipped maximum
- **Reasoning Truncation**: 140 characters per reason field
- **Action Limit**: Last 200 actions (or aggregated summaries)
- **Runtime**: 60 seconds max (partial replay returned if exceeded)
- **Storage**: 7-day signed URLs via Supabase Storage

## Testing

```bash
# Run replay tests
npm test tests/replay.test.js

# Check determinism
npm run test:determinism
```

## Storage

Replays are stored in Supabase Storage bucket `replays`:
- Gzip compressed JSON
- 7-day signed URLs
- Path format: `{replayId}.json.gz`
- RLS policies allow public read access

## Judge Summary Format

One-paragraph summary includes:
1. Map seed and type
2. AI personality/strategy
3. Pivotal decisions with timestamps
4. Final outcome

Example:
> "Seed 12345 produced a jagged island map with narrow chokepoints. The AI 'cautious_geologist' prioritized securing high ground and chokepoint control rather than rapid expansion. A decisive flank maneuver at t=742 turned a stalemate into victory."

## AI Highlights

Top 3-6 most important AI decisions:
- Scored by tactical importance
- Strategic impact
- Utility score
- Reasoning complexity

## Error Handling

- **400**: Missing required fields
- **404**: Replay not found
- **422**: Validation failed
- **500**: Server error (includes errorId for tracking)

## Performance

- Average generation time: <5 seconds
- Compressed size: ~50-300KB for typical games
- Memory usage: <512MB
- Concurrent requests: Handled via edge function scaling

## Integration

```typescript
import { generateReplay, getReplay, downloadReplay } from '@/lib/replayClient';

// Generate
const metadata = await generateReplay({
  seed: 12345,
  mapConfig: { type: 'jagged_island', width: 64, height: 64 },
  commanderId: 'cautious_geologist'
});

// Fetch
const replay = await getReplay(metadata.replayId);

// Download
await downloadReplay(metadata.replayId);
```

## Future Improvements

- [ ] Batch replay generation
- [ ] Replay comparison/diff
- [ ] Advanced compression (zstd)
- [ ] Replay validation endpoint
- [ ] Replay search/indexing
- [ ] Real-time replay streaming
