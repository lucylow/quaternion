# Frontend-Backend Integration Plan
## Quaternion Game: blank-canvas-state ↔ quaternion

This document outlines the complete integration plan for connecting the frontend (blank-canvas-state) with the backend (quaternion).

---

## 📋 Overview

### Repositories
- **Frontend**: `https://github.com/lucylow/blank-canvas-state` (Landing page & game UI)
- **Backend**: `https://github.com/lucylow/quaternion` (Game logic, AI, replay system)

### Integration Points
1. **Replay API** - Generate, fetch, and download game replays
2. **Game State API** - Real-time game state synchronization
3. **AI Strategy API** - Commander AI decision-making
4. **Asset Serving** - Static assets and game resources

---

## 🎯 Phase 1: Replay System Integration

### 1.1 Mock Replay API Setup (Development)

**Status**: ✅ Ready to implement

**Files to Add/Update**:
- `src/utils/replayApi.ts` - Mock replay API client
- `src/lib/replayClient.ts` - Updated to support mock mode
- `public/fixtures/full-replay.json` - Complete replay fixture
- `public/fixtures/partial-replay.json` - Partial replay fixture
- `.env.development` - Environment variables

**Implementation Steps**:

1. **Add Mock Replay API** (`src/utils/replayApi.ts`)
   - Converts provided JavaScript mock to TypeScript
   - Handles fixture loading from `public/fixtures/`
   - Persists to localStorage for retrieval
   - Simulates network latency

2. **Update Replay Client** (`src/lib/replayClient.ts`)
   - Add mock mode detection via `VITE_USE_REPLAY_MOCK`
   - Route to mock API when enabled
   - Fall back to Supabase edge functions in production

3. **Prepare Fixtures**
   - Rename `sample-replay.json` → `full-replay.json`
   - Ensure `partial-replay.json` matches expected format
   - Add required fields: `actions`, `stateDeltas`, `meta`

4. **Environment Configuration**
   ```bash
   # .env.development
   VITE_USE_REPLAY_MOCK=true
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

### 1.2 Production Replay API (Supabase Edge Functions)

**Status**: ✅ Already implemented

**Current Implementation**:
- `supabase/functions/replay-handler/index.ts` - Edge function handler
- Handles: `POST /generate`, `GET /:id`, `GET /:id/download`
- Stores replays in Supabase Storage
- Returns signed URLs for download

**Integration**:
- Mock API automatically routes to Supabase when `VITE_USE_REPLAY_MOCK=false`
- No changes needed to production code

---

## 🎮 Phase 2: Game State Integration

### 2.1 Game State API Endpoints

**Backend Endpoints** (to be implemented):
```
POST /api/game/create
POST /api/game/:id/start
GET  /api/game/:id/state
POST /api/game/:id/command
POST /api/game/:id/end
```

**Frontend Integration**:
- Create `src/lib/gameApi.ts` - Game state API client
- Add mock mode for development
- Use Supabase edge functions or Express server for production

### 2.2 Real-time State Sync

**Options**:
1. **Polling** (Simple, works everywhere)
   - Poll `/api/game/:id/state` every 200ms
   - Implement in `useGameApi` hook

2. **WebSockets** (Better performance)
   - Use Supabase Realtime subscriptions
   - Push state updates to frontend

3. **Server-Sent Events** (SSE)
   - One-way stream from server
   - Good for read-only state updates

**Recommendation**: Start with polling, upgrade to WebSockets if needed.

---

## 🤖 Phase 3: AI Strategy Integration

### 3.1 Commander AI API

**Current Implementation**:
- `supabase/functions/ai-strategy/index.ts` - LLM-powered AI
- Uses Google Gemini 2.5 Flash
- Rate-limited to 1 decision/second

**Frontend Integration**:
- Already integrated via `src/ai/commanderClient.js`
- Calls Supabase edge function
- Falls back to deterministic heuristics on error

**No changes needed** - Already working!

### 3.2 AI Telemetry & Logging

**Enhancement**:
- Add AI decision logging to replay system
- Track LLM vs heuristic usage
- Monitor AI performance metrics

---

## 📦 Phase 4: Asset & Resource Serving

### 4.1 Static Assets

**Current Setup**:
- Frontend serves assets from `public/`
- Backend can serve from `dist/` or `public/`

**Integration Options**:

1. **Frontend-Only** (Recommended for Lovable)
   - All assets in frontend `public/`
   - No backend asset serving needed

2. **CDN** (Production)
   - Upload assets to Supabase Storage
   - Serve via CDN URLs
   - Better performance, caching

3. **Backend Express Server**
   - Serve from `server.js`
   - Good for local development

**Recommendation**: Use frontend-only for now, migrate to CDN for production.

### 4.2 Game Resources

**Resources to Serve**:
- Commander data (`config/commanders.json`)
- Tech tree data (`src/data/quaternionData.ts`)
- Unit types (`src/data/quaternionData.ts`)
- Map configurations

**Current Status**: ✅ All in frontend, no backend needed

---

## 🔧 Phase 5: Development Workflow

### 5.1 Local Development Setup

**Frontend (blank-canvas-state)**:
```bash
cd blank-canvas-state
npm install
npm run dev
# Runs on http://localhost:8080
```

**Backend (quaternion)**:
```bash
cd quaternion
npm install
npm run dev
# Runs on http://localhost:8080 (or configured port)
```

**Mock Mode**:
- Set `VITE_USE_REPLAY_MOCK=true` in `.env.development`
- Replay API uses fixtures from `public/fixtures/`
- No backend needed for replay testing

### 5.2 Testing Integration

**Mock Testing**:
1. Start frontend with `VITE_USE_REPLAY_MOCK=true`
2. Play game, generate replay
3. Verify replay metadata appears in Judge HUD
4. Test download functionality

**Production Testing**:
1. Deploy Supabase edge functions
2. Set `VITE_USE_REPLAY_MOCK=false`
3. Test replay generation with real backend
4. Verify replay storage and retrieval

### 5.3 Deployment Strategy

**Option A: Separate Deployments** (Recommended)
- Frontend: Deploy to Lovable/Vercel/Netlify
- Backend: Deploy Supabase edge functions
- Connect via environment variables

**Option B: Monorepo Deployment**
- Combine both repos into monorepo
- Single deployment pipeline
- More complex but unified

**Recommendation**: Start with Option A, migrate to B if needed.

---

## 📝 Implementation Checklist

### Immediate (Phase 1)
- [x] Create `src/utils/replayApi.ts` (mock API)
- [ ] Update `src/lib/replayClient.ts` (mock mode support)
- [ ] Rename `sample-replay.json` → `full-replay.json`
- [ ] Update fixture format to match expected schema
- [ ] Create `.env.development` with `VITE_USE_REPLAY_MOCK=true`
- [ ] Test mock replay generation
- [ ] Test replay download

### Short-term (Phase 2)
- [ ] Create `src/lib/gameApi.ts` (game state API)
- [ ] Implement game state polling
- [ ] Add game state mock for development
- [ ] Integrate with `QuaternionGame` component
- [ ] Test real-time state sync

### Medium-term (Phase 3)
- [ ] Enhance AI telemetry
- [ ] Add AI decision logging to replays
- [ ] Monitor AI performance
- [ ] Optimize AI rate limiting

### Long-term (Phase 4-5)
- [ ] Migrate assets to CDN
- [ ] Implement WebSocket state sync
- [ ] Add game state persistence
- [ ] Optimize deployment pipeline

---

## 🔍 Testing Strategy

### Unit Tests
- Mock API functions
- Replay client routing
- Fixture loading

### Integration Tests
- Mock → Real API transition
- Replay generation flow
- Download functionality

### E2E Tests
- Complete game session → replay generation
- Replay playback
- Judge HUD population

---

## 🚨 Common Issues & Solutions

### Issue: Mock API not working
**Solution**: 
- Check `VITE_USE_REPLAY_MOCK=true` in `.env.development`
- Verify fixtures exist in `public/fixtures/`
- Check browser console for errors

### Issue: Replay download fails
**Solution**:
- Mock mode: Check fixture URL is accessible
- Production: Verify Supabase storage permissions
- Check CORS settings

### Issue: Game state not syncing
**Solution**:
- Verify API endpoints are correct
- Check network requests in DevTools
- Ensure polling interval is appropriate

---

## 📚 Additional Resources

### Documentation
- `REPLAY_INTEGRATION.md` - Replay system details
- `REPLAY_README.md` - Replay format specification
- `FRONTEND_BACKEND_INTEGRATION.md` - Previous integration notes

### Code References
- `src/hooks/useReplay.ts` - Replay hook
- `src/hooks/useReplayGenerator.ts` - Replay generator
- `src/lib/replayClient.ts` - Replay API client
- `supabase/functions/replay-handler/index.ts` - Backend handler

---

## ✅ Next Steps

1. **Implement mock replay API** (this session)
2. **Test mock mode** locally
3. **Deploy to Lovable** with mock enabled
4. **Test production mode** with Supabase
5. **Iterate based on feedback**

---

**Last Updated**: 2025-01-15
**Status**: Ready for implementation
