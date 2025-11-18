# Complete API Client Integration

All backend features are now fully linked to the frontend through centralized, type-safe API clients.

## New API Clients Created

### 1. Replay API (`replayApi.ts`)
- ✅ `generateReplay()` - Generate new replay
- ✅ `getReplay()` - Get replay metadata
- ✅ `downloadReplay()` - Download replay file
- ✅ `getReplayDownloadUrl()` - Get download URL

**Endpoints covered:**
- `POST /api/replay/generate`
- `GET /api/replay/:replayId`
- `GET /api/replay/:replayId/download`

### 2. Rooms API (`roomsApi.ts`)
- ✅ `listRooms()` - List available rooms
- ✅ `createRoom()` - Create new room
- ✅ `getRoom()` - Get room details
- ✅ `joinRoom()` - Join existing room
- ✅ `leaveRoom()` - Leave room
- ✅ `startRoom()` - Start room (host only)

**Endpoints covered:**
- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/:roomId`
- `POST /api/rooms/:roomId/join`
- `POST /api/rooms/:roomId/leave`
- `POST /api/rooms/:roomId/start`

### 3. Multiplayer API (`multiplayerApi.ts`)
- ✅ `createGame()` - Create multiplayer game
- ✅ `joinGame()` - Join multiplayer game
- ✅ `listGames()` - List available games
- ✅ `getGameState()` - Get game state
- ✅ `getGameReplay()` - Get game replay
- ✅ `matchmake()` - Matchmake for game

**Endpoints covered:**
- `POST /api/multiplayer/create`
- `POST /api/multiplayer/join`
- `GET /api/multiplayer/games`
- `GET /api/multiplayer/game/:gameId/state`
- `GET /api/multiplayer/game/:gameId/replay`
- `POST /api/multiplayer/matchmake`

### 4. Monetization API (`monetizationApi.ts`)
- ✅ `initCustomer()` - Initialize customer account
- ✅ `getCosmetics()` - Get cosmetics catalog
- ✅ `purchaseCosmetic()` - Purchase cosmetic
- ✅ `confirmCosmeticPurchase()` - Confirm purchase
- ✅ `getBattlePasses()` - Get battle pass options
- ✅ `purchaseBattlePass()` - Purchase battle pass
- ✅ `activateBattlePass()` - Activate battle pass
- ✅ `getBattlePassProgress()` - Get progress
- ✅ `purchaseSeasonalPass()` - Purchase seasonal pass
- ✅ `activateSeasonalPass()` - Activate seasonal pass
- ✅ `getCoachingOptions()` - Get coaching options
- ✅ `bookCoaching()` - Book coaching session
- ✅ `confirmCoachingBooking()` - Confirm booking
- ✅ `getTournaments()` - Get tournaments
- ✅ `enterTournament()` - Enter tournament
- ✅ `confirmTournamentEntry()` - Confirm entry
- ✅ `getSubscriptionStatus()` - Get subscription status
- ✅ `cancelSubscription()` - Cancel subscription

**Endpoints covered:**
- `POST /api/monetization/init-customer`
- `GET /api/monetization/shop/cosmetics`
- `POST /api/monetization/shop/purchase-cosmetic`
- `POST /api/monetization/shop/confirm-cosmetic-purchase`
- `GET /api/monetization/battle-pass`
- `POST /api/monetization/battle-pass/purchase`
- `POST /api/monetization/battle-pass/activate`
- `GET /api/monetization/battle-pass/progress`
- `POST /api/monetization/seasonal-pass/purchase`
- `POST /api/monetization/seasonal-pass/activate`
- `GET /api/monetization/coaching`
- `POST /api/monetization/coaching/book`
- `POST /api/monetization/coaching/confirm-booking`
- `GET /api/monetization/tournaments`
- `POST /api/monetization/tournaments/enter`
- `POST /api/monetization/tournaments/confirm-entry`
- `GET /api/monetization/subscription/status/:playerId`
- `POST /api/monetization/subscription/cancel`

### 5. TTS API (`ttsApi.ts`)
- ✅ `generateSpeech()` - Generate speech from text

**Endpoints covered:**
- `POST /api/ai/tts`

## Usage Examples

### Replay API
```typescript
import { replayApi } from '@/lib/api';

// Generate replay
const replay = await replayApi.generateReplay({
  seed: 12345,
  mapConfig: { type: 'jagged_island', width: 64, height: 64 },
  commanderId: 'cautious_geologist',
  mode: 'fast'
});

// Get replay
const metadata = await replayApi.getReplay(replay.replayId);

// Download replay
const blob = await replayApi.downloadReplay(replay.replayId);
```

### Rooms API
```typescript
import { roomsApi } from '@/lib/api';

// List rooms
const rooms = await roomsApi.listRooms();

// Create room
const room = await roomsApi.createRoom({
  name: 'My Room',
  mapType: 'crystalline_plains',
  mapWidth: 40,
  mapHeight: 30
});

// Join room
const joinResult = await roomsApi.joinRoom(room.roomId, {
  commanderId: 'AUREN',
  quaternionAxis: 'i'
});
```

### Multiplayer API
```typescript
import { multiplayerApi } from '@/lib/api';

// Create game
const game = await multiplayerApi.createGame({
  playerId: 'player123',
  gameType: 'pvp',
  mapSize: 64,
  difficulty: 'medium'
});

// Matchmake
const match = await multiplayerApi.matchmake({
  playerId: 'player123',
  gameType: 'pvp',
  difficulty: 'medium'
});
```

### Monetization API
```typescript
import { monetizationApi } from '@/lib/api';

// Get cosmetics
const { cosmetics } = await monetizationApi.getCosmetics();

// Purchase cosmetic
const purchase = await monetizationApi.purchaseCosmetic({
  playerId: 'player123',
  cosmeticId: 'cosmic_unit_skin'
});

// Get battle passes
const { battlePasses } = await monetizationApi.getBattlePasses();
```

### TTS API
```typescript
import { ttsApi } from '@/lib/api';

// Generate speech
const speech = await ttsApi.generateSpeech({
  text: 'Hello, commander!',
  voice: 'default',
  speed: 1.0,
  pitch: 1.0
});
```

## Type Safety

All API clients are fully typed with TypeScript interfaces for:
- Request parameters
- Response data
- Error handling

Types are exported from `@/lib/api` for use throughout the application.

## Centralized Configuration

All API clients use the centralized `API_CONFIG` from `config.ts`:
- Base URL configuration
- Timeout settings
- Retry logic
- Error handling
- Request/response interceptors

## Benefits

1. **Type Safety** - Catch errors at compile time
2. **Consistency** - All API calls use the same error handling and retry logic
3. **Maintainability** - Centralized API logic, easier to update
4. **Developer Experience** - Better autocomplete and clearer API
5. **Error Handling** - Automatic retries and consistent error format
6. **Extensibility** - Easy to add interceptors for auth, logging, etc.

## Migration Guide

Existing components using direct `fetch()` calls can be migrated to use these API clients:

**Before:**
```typescript
const response = await fetch('/api/rooms');
const data = await response.json();
```

**After:**
```typescript
import { roomsApi } from '@/lib/api';
const rooms = await roomsApi.listRooms();
```

## Files Created

- `src/lib/api/replayApi.ts` - Replay API client
- `src/lib/api/roomsApi.ts` - Rooms API client
- `src/lib/api/multiplayerApi.ts` - Multiplayer API client
- `src/lib/api/monetizationApi.ts` - Monetization API client
- `src/lib/api/ttsApi.ts` - TTS API client
- `src/lib/api/types.ts` - Updated with all new types
- `src/lib/api/index.ts` - Updated to export all clients

## Next Steps

Components can now be updated to use these API clients instead of direct `fetch()` calls for better type safety and error handling.

