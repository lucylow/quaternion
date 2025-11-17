# Replay Integration Guide

## Overview

This frontend is fully prepared to integrate with the quaternion replay backend. The implementation includes:
- Judge HUD overlay component
- Replay generation, preview, and download flow
- Local mock server for development
- Caching and analytics instrumentation
- Tests and fixtures

## Quick Start

### Enable Mock Mode (Local Development)

Set the environment variable to use the mock replay API:

```bash
# .env.local
VITE_USE_REPLAY_MOCK=true
```

Then run the dev server:

```bash
npm run dev
```

The mock server will intercept all `/api/replay/*` calls and return realistic responses with simulated latency.

### Integration at Game End

When a game ends, call the replay generation hook:

```typescript
import { useReplayGenerator } from '@/hooks/useReplayGenerator';

function GameComponent() {
  const { generateReplay } = useReplayGenerator();
  
  async function onGameEnd(finalState: GameState) {
    await generateReplay({
      seed: finalState.seed,
      commanderId: finalState.commanderId,
      mapConfig: {
        type: finalState.mapType,
        width: finalState.mapWidth,
        height: finalState.mapHeight,
      },
      mode: 'fast', // or 'full'
    });
  }
  
  return (
    <div>
      {/* Game UI */}
      <JudgeHUD 
        seed={gameState.seed}
        commanderId={gameState.commanderId}
        mapConfig={gameState.mapConfig}
        outcome={gameState.outcome}
      />
    </div>
  );
}
```

## API Contract

The frontend expects the backend to expose these endpoints:

### POST /api/replay/generate

**Request:**
```json
{
  "seed": 12345,
  "mapConfig": {
    "type": "Crystalline Plains",
    "width": 40,
    "height": 30
  },
  "commanderId": "AUREN",
  "mode": "fast"
}
```

**Response (200 OK):**
```json
{
  "replayId": "uuid-string",
  "url": "https://storage.example.com/replays/uuid.json.gz",
  "summary": "One-paragraph game summary...",
  "aiHighlights": [
    {
      "t": 45,
      "actor": "AUREN",
      "action": "Quantum Core Construction",
      "reason": "Strategic placement enabled 20% efficiency boost..."
    }
  ],
  "meta": {
    "engineCommit": "abc123def456",
    "partial": false,
    "contentHash": "sha256:..."
  },
  "actions": [
    {"timestamp": 5, "type": "WORKER_SPAWN", "data": {...}}
  ]
}
```

### GET /api/replay/:replayId

Returns the same metadata structure as above.

### GET /api/replay/:replayId/download

Streams the gzipped replay artifact with `Content-Encoding: gzip`.

## Mock Server Behavior

The mock server (`src/mocks/replayMockServer.ts`):
- Simulates realistic latency (200-1200ms)
- Returns partial replays for seeds divisible by 8 or randomly (1 in 8 chance)
- Stores generated replays in memory for GET requests
- Dispatches analytics events to `window.dataLayer`

### Fixtures

Two sample replays are included:
- `public/fixtures/sample-replay.json` - Full deterministic replay
- `public/fixtures/partial-replay.json` - Partial replay with non-determinism warning

## Testing

Run the test suite:

```bash
npm test
```

Tests verify:
1. Judge HUD renders summary and 3 AI highlights after generation
2. Partial replay warning badge appears when `meta.partial === true`
3. Share Link copies URL to clipboard

## Analytics Events

The integration dispatches the following events to `window.dataLayer` (opt-in):

- `replay:generate:start` - When generation begins
- `replay:generate:success` - When replay is successfully generated
- `replay:generate:fail` - When generation fails
- `replay:generate:timeout` - When 30s timeout is reached
- `replay:download` - When download is initiated

## Caching

The hook caches the last 5 generated replays in `localStorage` with key `quaternion_replays_cache`. Cached entries are reused for identical seed/commander/map combinations.

## Production Deployment

To connect to the real backend:

1. Remove or set `VITE_USE_REPLAY_MOCK=false`
2. Ensure backend endpoints are accessible at `/api/replay/*`
3. Configure CORS if backend is on a different domain
4. If using signed URLs for download, ensure they're valid for at least 1 hour

## Error Handling

The UI handles these scenarios:
- **Network timeout (30s)**: Shows timeout message and suggests fast mode
- **Backend error**: Displays error with backend `errorId` if provided
- **CORS issues**: Shows clear message about opening link in new tab
- **Fallback**: Loads sample replay fixture if generation fails completely

## Accessibility

The Judge HUD includes:
- Keyboard focus support for all buttons
- ARIA labels for screen readers
- Tooltips for truncated text
- Visual loading/success/error states
- Collapsible panel to reduce clutter

## File Structure

```
src/
├── components/game/
│   └── JudgeHUD.tsx          # Main HUD component
├── hooks/
│   └── useReplayGenerator.ts # Replay API hook
├── mocks/
│   └── replayMockServer.ts   # Mock server
└── tests/
    └── judgeHUD.test.tsx     # Component tests

public/fixtures/
├── sample-replay.json        # Full replay fixture
└── partial-replay.json       # Partial replay fixture
```

## Next Steps

1. Wire backend endpoints to actual quaternion replay generation service
2. Configure production storage for replay artifacts (S3, Cloud Storage, etc.)
3. Set up monitoring for replay generation timeouts and failures
4. Optionally add analytics tracking with your preferred service

---

For questions or issues, check the test suite or run with mock mode enabled to see expected behavior.
