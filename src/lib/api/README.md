# API Client Module

A centralized, type-safe API client for frontend-backend communication with robust error handling, retry logic, and interceptors.

## Features

- ✅ **Type-Safe**: Full TypeScript support with typed requests and responses
- ✅ **Error Handling**: Comprehensive error handling with retry logic
- ✅ **Request Interceptors**: Customizable request/response interceptors
- ✅ **Automatic Retries**: Configurable retry logic with exponential backoff
- ✅ **Timeout Support**: Request timeout handling
- ✅ **Logging**: Optional request/response logging
- ✅ **React Hooks**: Convenient React hooks for game API interactions

## Usage

### Basic API Client

```typescript
import { apiClient } from '@/lib/api';

// GET request
const response = await apiClient.get<MyResponseType>('/endpoint');
console.log(response.data);

// POST request
const response = await apiClient.post<MyResponseType>('/endpoint', {
  field1: 'value1',
  field2: 'value2'
});
```

### Game API Client

```typescript
import { gameApi } from '@/lib/api';

// Create a game
const game = await gameApi.createGame({
  mapWidth: 64,
  mapHeight: 64,
  aiDifficulty: 'medium'
});

// Start the game
await gameApi.startGame(game.gameId);

// Get game state
const state = await gameApi.getGameState(game.gameId);

// Send commands
await gameApi.moveUnits(game.gameId, {
  unitIds: ['unit1', 'unit2'],
  x: 100,
  y: 200
});
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
    isRunning,
    createGame,
    startGame,
    stopGame,
    moveUnits,
  } = useGameApi(true, 200); // auto-poll every 200ms

  const handleCreateGame = async () => {
    await createGame({
      mapWidth: 64,
      mapHeight: 64,
      aiDifficulty: 'medium'
    });
  };

  const handleStartGame = async () => {
    await startGame();
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {gameState && <div>Game State: {JSON.stringify(gameState)}</div>}
      <button onClick={handleCreateGame}>Create Game</button>
      <button onClick={handleStartGame} disabled={!gameId || isRunning}>
        Start Game
      </button>
    </div>
  );
}
```

## Configuration

Configure API settings via environment variables or by editing `config.ts`:

```env
VITE_GAME_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_USE_MOCK_API=false
VITE_ENABLE_API_LOGGING=true
```

## Request Interceptors

Add custom request interceptors:

```typescript
import { apiClient } from '@/lib/api';

// Add authentication header
apiClient.addRequestInterceptor((config) => {
  const token = localStorage.getItem('authToken');
  return {
    ...config,
    headers: {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    },
  };
});

// Add timestamp
apiClient.addRequestInterceptor((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Request-Time': Date.now().toString(),
    },
  };
});
```

## Response Interceptors

Add custom response interceptors:

```typescript
import { apiClient } from '@/lib/api';

// Handle 401 errors globally
apiClient.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  }
  return response;
});

// Add response time logging
apiClient.addResponseInterceptor(async (response) => {
  const requestTime = response.headers.get('X-Request-Time');
  if (requestTime) {
    const duration = Date.now() - parseInt(requestTime);
    console.log(`Request took ${duration}ms`);
  }
  return response;
});
```

## Error Handling

The API client provides structured error handling:

```typescript
import { apiClient, ApiError } from '@/lib/api';

try {
  const response = await gameApi.createGame();
} catch (error: ApiError) {
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  console.error('HTTP status:', error.status);
  console.error('Error details:', error.details);
}
```

## API Methods

### Game API

- `createGame(request)` - Create a new game
- `startGame(gameId)` - Start a game
- `stopGame(gameId)` - Stop a game
- `getGameState(gameId, playerId?)` - Get current game state
- `getMap(gameId)` - Get map data
- `moveUnits(gameId, command)` - Move units
- `attackTarget(gameId, command)` - Attack target
- `gatherResources(gameId, command)` - Gather resources
- `buildUnit(gameId, command)` - Build unit
- `buildBuilding(gameId, command)` - Build building
- `sendCommand(gameId, command)` - Send generic command
- `deleteGame(gameId)` - Delete game
- `listGames()` - List all games
- `healthCheck()` - Health check

## Best Practices

1. **Use TypeScript**: Always type your requests and responses
2. **Handle Errors**: Wrap API calls in try-catch blocks
3. **Use Hooks**: Use `useGameApi` hook for React components
4. **Configure Timeouts**: Set appropriate timeouts for long-running requests
5. **Enable Logging**: Use request logging in development
6. **Cache Map Data**: Map data doesn't change, cache it locally

