# Frontend-Backend Integration Improvements

This document outlines the improvements made to the frontend-backend integration of the Quaternion game.

## Overview

The integration has been significantly improved with a centralized, type-safe API client that provides robust error handling, retry logic, and better developer experience.

## What Was Improved

### 1. Centralized API Client (`src/lib/api/client.ts`)
- **Type-safe HTTP client** with full TypeScript support
- **Automatic retry logic** with exponential backoff for failed requests
- **Request/Response interceptors** for auth, logging, and error handling
- **Timeout handling** to prevent hanging requests
- **Error standardization** with consistent error format
- **Request logging** (configurable) for debugging

### 2. Game API Client (`src/lib/api/gameApi.ts`)
- **Type-safe game API methods** for all game operations
- **Consistent error handling** across all endpoints
- **Full coverage** of all game backend endpoints:
  - Game management (create, start, stop, delete)
  - State polling (get game state, get map)
  - Commands (move, attack, gather, build)
  - Game listing and health checks

### 3. Type Definitions (`src/lib/api/types.ts`)
- **Complete TypeScript types** for all API requests and responses
- **Type safety** throughout the application
- **Better IDE autocomplete** and error detection

### 4. Configuration (`src/lib/api/config.ts`)
- **Environment-based configuration** for API URLs
- **Centralized settings** for timeouts, retries, polling intervals
- **Feature flags** for mock mode, logging, etc.

### 5. React Hook (`src/hooks/useGameApi.ts`)
- **Convenient React hook** for game API interactions
- **Automatic state management** for game state, loading, errors
- **Automatic polling** with configurable intervals
- **Clean API** for React components

### 6. Example Component (`src/components/GameAPIExample.tsx`)
- **Working example** demonstrating the new API client usage
- **Best practices** for error handling and user feedback
- **Reference implementation** for other components

## Key Features

### Error Handling
- Automatic retry on network errors and 5xx responses
- Exponential backoff to prevent overwhelming the server
- Consistent error format with messages, codes, and details
- Error recovery and user-friendly error messages

### Type Safety
- Full TypeScript support for all API calls
- Compile-time type checking
- Better IDE autocomplete and refactoring support

### Performance
- Configurable request timeouts
- Automatic retries with backoff
- Efficient polling with automatic cleanup
- Request/response caching opportunities

### Developer Experience
- Clean, intuitive API
- Comprehensive documentation
- Request/response logging for debugging
- Interceptor support for custom logic

## Usage Examples

### Basic API Client

```typescript
import { apiClient } from '@/lib/api';

// GET request
const response = await apiClient.get<MyResponse>('/endpoint');

// POST request
const response = await apiClient.post<MyResponse>('/endpoint', { data: 'value' });
```

### Game API Client

```typescript
import { gameApi } from '@/lib/api';

// Create and start a game
const game = await gameApi.createGame({
  mapWidth: 64,
  mapHeight: 64,
  aiDifficulty: 'medium'
});

await gameApi.startGame(game.gameId);
const state = await gameApi.getGameState(game.gameId);
```

### React Hook

```typescript
import { useGameApi } from '@/hooks/useGameApi';

function GameComponent() {
  const {
    gameId,
    gameState,
    loading,
    error,
    createGame,
    startGame,
    moveUnits,
  } = useGameApi(true, 200); // Auto-poll every 200ms

  // Use in component...
}
```

## Configuration

Set environment variables in `.env.local`:

```env
VITE_GAME_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_USE_MOCK_API=false
VITE_ENABLE_API_LOGGING=true
```

## Migration Guide

### Before (Direct fetch)

```typescript
// Old way - direct fetch
const response = await fetch(`${API_URL}/game/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mapWidth: 64, mapHeight: 64 })
});
const data = await response.json();
```

### After (New API Client)

```typescript
// New way - type-safe API client
import { gameApi } from '@/lib/api';

const game = await gameApi.createGame({
  mapWidth: 64,
  mapHeight: 64
});
```

## Benefits

1. **Type Safety**: Catch errors at compile time, not runtime
2. **Error Handling**: Automatic retries and consistent error handling
3. **Maintainability**: Centralized API logic, easier to update
4. **Developer Experience**: Better autocomplete, clearer API
5. **Performance**: Configurable timeouts, efficient polling
6. **Testability**: Easy to mock and test API calls
7. **Extensibility**: Interceptors for custom logic (auth, logging, etc.)

## Files Added

- `src/lib/api/config.ts` - API configuration
- `src/lib/api/types.ts` - TypeScript type definitions
- `src/lib/api/client.ts` - Core HTTP client
- `src/lib/api/gameApi.ts` - Game-specific API methods
- `src/lib/api/index.ts` - Module exports
- `src/lib/api/README.md` - Detailed documentation
- `src/hooks/useGameApi.ts` - React hook for game API
- `src/components/GameAPIExample.tsx` - Example component

## Next Steps

1. **Migrate existing components** to use the new API client
2. **Add authentication interceptors** when needed
3. **Configure error reporting** (e.g., Sentry integration)
4. **Add request caching** for map data and other static resources
5. **Implement request batching** for multiple commands
6. **Add unit tests** for API client methods

## API Endpoints Covered

All backend endpoints from `src/index.js` are now fully supported:

- ✅ `POST /api/game/create` - Create game
- ✅ `POST /api/game/:id/start` - Start game
- ✅ `POST /api/game/:id/stop` - Stop game
- ✅ `GET /api/game/:id/state` - Get game state
- ✅ `GET /api/game/:id/map` - Get map data
- ✅ `POST /api/game/:id/move` - Move units
- ✅ `POST /api/game/:id/attack` - Attack target
- ✅ `POST /api/game/:id/gather` - Gather resources
- ✅ `POST /api/game/:id/build-unit` - Build unit
- ✅ `POST /api/game/:id/build-building` - Build building
- ✅ `POST /api/game/:id/command` - Generic command
- ✅ `DELETE /api/game/:id` - Delete game
- ✅ `GET /api/games` - List games
- ✅ `GET /health` - Health check

## Testing

The API client can be easily tested by:

1. Using the example component (`GameAPIExample.tsx`)
2. Mocking the API client in tests
3. Using environment variables to point to test endpoints
4. Enabling request logging for debugging

## Support

For questions or issues with the API integration:
1. Check the `src/lib/api/README.md` for detailed documentation
2. Review the example component for usage patterns
3. Check TypeScript types for available methods and parameters

