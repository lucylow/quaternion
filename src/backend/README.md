# Multiplayer Backend Architecture for Quaternion

This directory contains the complete multiplayer backend implementation for Quaternion RTS game with AI integration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│         MultiplayerGameServer (WebSocket)              │
│  - Game session management                              │
│  - Player connections                                    │
│  - Matchmaking                                          │
└────────────────┬────────────────────────────────────────┘
                 │
      ┌──────────┼──────────┬──────────────┐
      │          │          │              │
┌─────▼─────┐ ┌─▼──────┐ ┌─▼──────┐ ┌────▼──────┐
│GameSession│ │Command │ │ Replay │ │Matchmaking│
│           │ │ Queue  │ │Recorder│ │  Queue    │
└─────┬─────┘ └────────┘ └────────┘ └──────────┘
      │
┌─────▼──────────────────────────────────────┐
│    MultiplayerGameState (Adapter)         │
│    - Wraps existing GameState.js          │
│    - Provides multiplayer-compatible API   │
└─────┬──────────────────────────────────────┘
      │
┌─────▼──────────────────────────────────────┐
│    MultiplayerAIController               │
│    - Deterministic AI with difficulty     │
│    - Strategy switching                   │
│    - Build orders                         │
└───────────────────────────────────────────┘
```

## Key Features

### 1. Deterministic Game State
- All game logic is deterministic and reproducible
- Commands are processed in a deterministic order
- AI decisions are seeded for consistency

### 2. Real-Time Synchronization
- 60 Hz tick-based game loop
- Delta-based state transmission for efficiency
- WebSocket for low-latency communication

### 3. AI Integration
- Three difficulty levels (Easy, Medium, Hard)
- Adaptive strategy switching (Expansion, Defense, Aggression, Tech)
- Economy and military power analysis
- Threat assessment and counter-strategies

### 4. Replay System
- Complete command recording
- State snapshots at regular intervals
- Full game replay capability

### 5. Matchmaking
- Queue-based player matching
- Difficulty-based matchmaking
- Support for PvP, PvE, and FFA game types

## File Structure

```
src/backend/
├── MultiplayerGameServer.js    # Main server with WebSocket handling
├── game/
│   └── MultiplayerGameState.js # Adapter for existing GameState
├── ai/
│   └── MultiplayerAIController.js # AI controller for multiplayer
├── utils/
│   ├── CommandQueue.js         # Deterministic command processing
│   ├── ReplayRecorder.js       # Replay recording system
│   └── MatchmakingQueue.js     # Player matching system
└── README.md                   # This file
```

## API Endpoints

### REST API

- `POST /api/multiplayer/create` - Create a new multiplayer game
- `POST /api/multiplayer/join` - Join an existing game
- `GET /api/multiplayer/games` - List available games
- `GET /api/multiplayer/game/:gameId/state` - Get game state (spectating)
- `GET /api/multiplayer/game/:gameId/replay` - Get replay data
- `POST /api/multiplayer/matchmake` - Enter matchmaking queue

### WebSocket Messages

**Client → Server:**
- `auth` - Authenticate player
- `join_game` - Join a game session
- `command` - Send game command
- `ping` - Keep-alive ping

**Server → Client:**
- `authenticated` - Authentication successful
- `game_state_init` - Initial game state
- `state_update` - Game state delta update
- `game_started` - Game has started
- `game_ended` - Game has ended
- `player_joined` - Another player joined
- `player_left` - A player left
- `pong` - Response to ping

## Usage

### Server Setup

The multiplayer server is automatically integrated into `server.js`. It will start when the main server starts if the `ws` package is installed.

```bash
npm install ws
npm start
```

### Client Usage

```typescript
import GameClient from './frontend/GameClient';

const client = new GameClient('http://localhost:3000');

// Connect
await client.connect('player123', 'token');

// Join game
client.joinGame('game-id');

// Send commands
client.moveUnits(['unit1', 'unit2'], { x: 100, y: 100 });
client.attackTarget(['unit1'], 'enemy-unit-id');

// Listen to events
client.on('gameStarted', (data) => {
  console.log('Game started!', data);
});

client.on('stateUpdated', (data) => {
  console.log('State update:', data);
});
```

## Game Types

- **PvP** (Player vs Player): 2 players, human vs human
- **PvE** (Player vs Environment): 1+ players vs AI opponents
- **FFA** (Free For All): Up to 4 players, all vs all

## AI Difficulty Levels

- **Easy**: Slower decisions, less aggressive, basic build orders
- **Medium**: Balanced decisions, moderate aggression, optimized build orders
- **Hard**: Fast decisions, high aggression, perfect build orders

## Deterministic Synchronization

All game state is deterministic:
- Commands are processed in order (tick → timestamp → playerId)
- AI uses seeded random number generation
- Map generation uses deterministic seeds
- All players see the same game state

## Performance

- 60 ticks per second game loop
- Delta-based state updates (only changes are sent)
- Efficient command queuing
- Scalable to multiple concurrent games

## Future Enhancements

- [ ] Player authentication system
- [ ] Spectator mode
- [ ] Tournament brackets
- [ ] Leaderboards
- [ ] Custom game settings
- [ ] Replay viewer UI
- [ ] Anti-cheat validation
- [ ] Regional servers


