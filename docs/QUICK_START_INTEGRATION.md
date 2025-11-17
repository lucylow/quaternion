# Quick Start: Replay System Integration

This guide will help you quickly test the integrated replay system.

## Prerequisites

1. **Install dependencies** (if not already installed):
```bash
npm install uuid
```

For S3 support (optional, production):
```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
```

2. **Create storage directory**:
```bash
mkdir -p data/replays
```

## Configuration

### Backend (.env or environment variables)

For **local development** (default):
```bash
STORAGE_LOCAL_PATH=./data/replays
PORT=3000
```

For **production with S3**:
```bash
S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
STORAGE_LOCAL_PATH=./data/replays  # fallback
```

### Frontend (.env or .env.local)

```bash
# For development (if frontend runs on different port)
VITE_API_BASE_URL=http://localhost:3000

# For production (same origin)
# VITE_API_BASE_URL=  (leave empty)
```

## Testing

### 1. Start the Backend

```bash
npm start
```

You should see:
```
quaternion-game server listening on http://localhost:3000
Serving from: dist (or public)
```

### 2. Start the Frontend (Development)

In a separate terminal:
```bash
npm run dev
```

### 3. Test the Integration

1. Navigate to the game: `http://localhost:5173/quaternion` (or your dev port)
2. You should see a **Judge HUD** overlay in the top-right corner
3. Click "Open HUD" to expand it
4. Click "Generate Replay (fast)" 
5. Wait for generation (should take a few seconds)
6. You should see:
   - Replay summary
   - AI highlights
   - Download and Share buttons

### 4. Verify Backend Storage

Check that files were created:
```bash
ls -la data/replays/
cat data/replays/index.json
```

You should see:
- `replays/` directory with `.json.gz` files
- `index.json` with replay metadata

## API Testing (Optional)

Test the backend directly:

```bash
# Generate a replay
curl -X POST http://localhost:3000/api/replay/generate \
  -H "Content-Type: application/json" \
  -d '{
    "seed": 12345,
    "mapConfig": {"type": "jagged_island", "width": 64, "height": 64},
    "commanderId": "aggressor",
    "mode": "fast"
  }'

# Get replay metadata (use replayId from above)
curl http://localhost:3000/api/replay/{replayId}
```

## Troubleshooting

### "Cannot find module 'uuid'"
```bash
npm install uuid
```

### "Cannot find module './src/routes/replayRoutes'"
- Ensure `src/routes/replayRoutes.js` exists
- Check that `server.js` has the correct path

### API returns 404
- Ensure replay routes are added **before** the SPA fallback in `server.js`
- Check that `app.use('/api/replay', replayRoutes)` is present

### CORS errors
- If frontend runs on different port, add CORS middleware:
```bash
npm install cors
```
Then in `server.js`:
```javascript
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:5173' }));
```

### Files not saving
- Check `data/replays` directory exists and is writable
- Verify `STORAGE_LOCAL_PATH` environment variable

## Next Steps

1. **Customize the replay fixture**: Edit `tests/fixtures/sample-replay.json` to match your game structure
2. **Connect to real game data**: Update `exporter.js` to generate replays from actual game state
3. **Add S3 storage**: Configure AWS credentials for production deployment
4. **Enhance JudgeHUD**: Customize the UI to match your game's design

## File Structure

```
quaternion/
├── src/
│   ├── routes/
│   │   └── replayRoutes.js          # Express API routes
│   ├── replay/
│   │   └── exporter.js              # Replay generation & storage
│   ├── hooks/
│   │   └── useReplay.js             # Frontend replay hook
│   ├── components/
│   │   └── JudgeHUDOverlay.jsx      # Judge HUD UI component
│   └── pages/
│       └── QuaternionGame.tsx       # Game component (updated)
├── tests/
│   └── fixtures/
│       └── sample-replay.json       # Sample replay template
├── data/
│   └── replays/                     # Local storage (created on first run)
│       ├── replays/                 # Gzipped replay files
│       └── index.json               # Metadata index
├── server.js                        # Express server (updated)
└── INTEGRATION_PLAN.md              # Detailed integration guide
```

## Support

See `INTEGRATION_PLAN.md` for detailed troubleshooting and advanced configuration.
