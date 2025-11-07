# Chroma Strategy Game - Backend

A StarCraft-style real-time strategy game with AI opponents and procedural map generation using quaternion-based algorithms.

## Features

### Core Game Systems
- **Real-time game loop** running at 60 ticks per second
- **Procedural map generation** using quaternion-based noise algorithms
- **AI opponents** with three difficulty levels (Easy, Medium, Hard)
- **Resource management** with minerals and gas
- **Unit system** with workers, soldiers, tanks, and air units
- **Building system** with bases, barracks, factories, and airfields
- **Command queue** for smooth gameplay
- **RESTful API** for easy integration

### AI Features
- **Strategic decision making** with build orders
- **Economy management** (worker production, resource gathering)
- **Military production** based on available resources
- **Army control** with attack and defend behaviors
- **Difficulty scaling** affecting reaction time and aggression

### Procedural Generation
- **Quaternion-based RNG** for deterministic map generation
- **Perlin-like noise** for terrain variation
- **Resource placement** with configurable density
- **Symmetric start positions** for fair gameplay

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

## API Endpoints

### Game Management

#### Create New Game
```http
POST /api/game/create
Content-Type: application/json

{
  "mapWidth": 64,
  "mapHeight": 64,
  "seed": 12345,
  "aiDifficulty": "medium"
}
```

#### Start Game
```http
POST /api/game/:id/start
```

#### Stop Game
```http
POST /api/game/:id/stop
```

#### Get Game State
```http
GET /api/game/:id/state?playerId=1
```

#### Get Map Data
```http
GET /api/game/:id/map
```

### Commands

#### Move Units
```http
POST /api/game/:id/move
Content-Type: application/json

{
  "unitIds": ["unit_1", "unit_2"],
  "x": 25,
  "y": 30
}
```

#### Attack Target
```http
POST /api/game/:id/attack
Content-Type: application/json

{
  "unitIds": ["unit_1"],
  "targetId": "unit_enemy_1"
}
```

#### Gather Resources
```http
POST /api/game/:id/gather
Content-Type: application/json

{
  "unitIds": ["unit_worker_1"],
  "resourceId": "resource_0"
}
```

#### Build Unit
```http
POST /api/game/:id/build-unit
Content-Type: application/json

{
  "buildingId": "building_1",
  "unitType": "soldier"
}
```

#### Build Building
```http
POST /api/game/:id/build-building
Content-Type: application/json

{
  "playerId": 1,
  "buildingType": "barracks",
  "x": 15,
  "y": 15
}
```

## Game Mechanics

### Units

| Unit Type | HP  | Attack | Defense | Speed | Range | Cost (M/G) | Build Time |
|-----------|-----|--------|---------|-------|-------|------------|------------|
| Worker    | 50  | 5      | 0       | 2.5   | 1     | 50/0       | 20 ticks   |
| Soldier   | 100 | 15     | 5       | 3.0   | 1     | 100/0      | 30 ticks   |
| Tank      | 200 | 35     | 15      | 1.5   | 5     | 150/100    | 50 ticks   |
| Air Unit  | 120 | 25     | 5       | 4.0   | 4     | 125/75     | 40 ticks   |

### Buildings

| Building Type | HP  | Cost (M/G) | Build Time | Produces  |
|---------------|-----|------------|------------|-----------|
| Base          | 500 | 400/0      | 100 ticks  | Worker    |
| Barracks      | 300 | 150/0      | 60 ticks   | Soldier   |
| Factory       | 350 | 200/100    | 70 ticks   | Tank      |
| Airfield      | 300 | 150/100    | 80 ticks   | Air Unit  |
| Refinery      | 200 | 100/0      | 40 ticks   | -         |

### AI Difficulty

- **Easy**: 3-second decision interval, defensive play
- **Medium**: 1.5-second decision interval, balanced strategy
- **Hard**: 0.5-second decision interval, aggressive expansion

## Architecture

```
src/
├── game/
│   └── GameState.js        # Main game state and loop
├── ai/
│   └── AIController.js     # AI decision making
├── map/
│   └── MapGenerator.js     # Procedural map generation
├── units/
│   └── Unit.js            # Unit logic and behavior
├── buildings/
│   └── Building.js        # Building logic and production
├── utils/
│   └── quaternion.js      # Quaternion math for procedural generation
└── index.js               # Express API server
```

## Deployment on Lovable

This backend is designed to work seamlessly with Lovable's frontend deployment:

1. Deploy this backend to any Node.js hosting service (Heroku, Railway, Render, etc.)
2. Set the `PORT` environment variable
3. Update your frontend to point to the deployed API URL
4. The API uses CORS to allow cross-origin requests

### Environment Variables

```bash
PORT=3000  # Server port (default: 3000)
```

## Example Usage

```javascript
// Create a new game
const response = await fetch('http://localhost:3000/api/game/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mapWidth: 64,
    mapHeight: 64,
    aiDifficulty: 'hard'
  })
});

const { gameId, state } = await response.json();

// Start the game
await fetch(`http://localhost:3000/api/game/${gameId}/start`, {
  method: 'POST'
});

// Poll for game state updates
setInterval(async () => {
  const stateResponse = await fetch(`http://localhost:3000/api/game/${gameId}/state`);
  const { state } = await stateResponse.json();
  console.log('Game tick:', state.tick);
  console.log('Units:', state.units.length);
}, 100);

// Send move command
await fetch(`http://localhost:3000/api/game/${gameId}/move`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    unitIds: ['unit_0'],
    x: 30,
    y: 30
  })
});
```

## Development

### Project Structure
- Clean separation of concerns (game logic, AI, map generation)
- Modular ES6 imports
- RESTful API design
- In-memory game state (can be extended to use database)

### Future Enhancements
- Pathfinding with A* algorithm
- Fog of war implementation
- Multiplayer support with WebSockets
- Replay system
- Save/load game state
- More unit types and abilities
- Tech tree system
- Campaign mode

## License

MIT License - feel free to use this for your Chroma Awards submission!

## Credits

Built for the Chroma Awards AI Games competition. Features AI-powered procedural generation and intelligent opponents.
