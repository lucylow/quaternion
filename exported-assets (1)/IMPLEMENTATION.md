# AI Game Frontend Implementation Guide

## Overview

This guide covers the complete frontend implementation for the Chroma Strategy Game AI features. The code includes UI components, API integration, React hooks, and a full game dashboard that works seamlessly with the quaternion backend.

## Architecture

### Component Structure

```
frontend/
├── components/
│   ├── AIGameUI.tsx           # Main AI management panel
│   └── GameComponents.tsx     # Game canvas and stats components
├── hooks/
│   └── useAIGame.ts          # Custom hooks for game state management
├── services/
│   └── aiGameService.ts      # API service layer
├── pages/
│   └── GameDashboard.tsx     # Full dashboard page
└── lib/
    └── utils.ts              # Utility functions (cn, etc.)
```

## Installation & Setup

### Prerequisites

- React 18+
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react

### Installation

```bash
# Install dependencies
npm install axios lucide-react

# Install shadcn/ui components if not already installed
npx shadcn-ui@latest add card button slider badge progress alert tabs select
```

### Environment Configuration

Create `.env.local`:

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_GAME_POLL_INTERVAL=100
```

## File Integration

### 1. Service Layer (`aiGameService.ts`)

The `AIGameService` class manages all communication with the backend:

```typescript
import { AIGameService } from '@/services/aiGameService';

const gameService = new AIGameService(process.env.REACT_APP_API_URL);

// Create and start a game
const { gameId, state } = await gameService.createGame(64, 64, 'medium');
await gameService.startGame();

// Poll for updates
await gameService.pollGameState((state) => {
  console.log('Game updated:', state);
}, 100);
```

**Key Methods:**
- `createGame()` - Initialize new game session
- `startGame()` / `stopGame()` - Control game state
- `getGameState()` - Fetch current game state
- `moveUnits()` - Send unit movement commands
- `attackUnit()` - Send attack commands
- `buildUnit()` / `buildBuilding()` - Construction commands
- `pollGameState()` - Continuous state polling
- `getAIAnalytics()` - Retrieve AI metrics

### 2. Custom Hooks (`useAIGame.ts`)

Two primary hooks for state management:

#### `useAIGame(config)`

Manages the complete game lifecycle:

```typescript
const {
  gameState,           // Current game state
  aiAnalytics,         // AI metrics and analytics
  isLoading,           // Loading state
  error,               // Error information
  isGameActive,        // Game status
  
  // Game controls
  initializeGame,      // Create and setup game
  startGame,           // Start game loop
  stopGame,            // End game session
  
  // Commands
  moveUnits,           // Move units to position
  attackUnit,          // Attack target
  gatherResources,     // Gather resources
  buildUnit,           // Build unit from building
  buildBuilding,       // Construct new building
  
  // Utilities
  getGameId,           // Get current game ID
  setGameId,           // Set game ID for existing games
} = useAIGame({
  baseURL: 'http://localhost:3000',
  pollInterval: 100,   // Update frequency in ms
  autoStart: false,    // Auto-start on mount
});
```

#### `useAIStrategy(initialConfig)`

Manages AI configuration:

```typescript
const {
  config,                  // Current AI config
  updateDifficulty,       // Change difficulty level
  updateAggressiveness,   // Set aggressiveness (0-100)
  updateDefensiveness,    // Set defensiveness (0-100)
  updateExpansionRate,    // Set expansion rate (0-100)
  reset,                  // Reset to defaults
} = useAIStrategy();
```

### 3. UI Components

#### `AIGameUIPanel`

Main AI management interface with three sections:

**Configuration Panel:**
- Difficulty selection (Easy/Medium/Hard)
- Aggressiveness slider (0-100%)
- Defensiveness slider (0-100%)
- Expansion rate slider (0-100%)
- Quick action buttons

**Status Overview:**
- Current AI status (idle, thinking, executing, attacking, defending)
- Threat level with visual indicator
- Current strategy description
- Resource allocation breakdown

**Performance Metrics:**
- Win rate percentage
- Average resources per minute
- Units produced count
- Buildings constructed count

**Advanced Analysis:**
- Strategic decisions tab with confidence levels
- Behavior patterns analysis
- Learning curve progress

```typescript
import { AIGameUIPanel } from '@/components/AIGameUI';

export default function App() {
  return <AIGameUIPanel />;
}
```

#### Game Canvas Component

Interactive canvas for map visualization:

```typescript
<GameMapCanvas
  gameState={gameState}
  selectedUnitId={selectedUnitId}
  onUnitSelect={(unitId) => setSelectedUnitId(unitId)}
  onPositionClick={(x, y) => moveUnits([selectedUnitId], x, y)}
  scale={8}
/>
```

**Features:**
- Grid-based terrain visualization
- Unit rendering with color coding
- Building indicators with health bars
- Resource deposit markers
- Interactive unit selection
- Mouse-over hover effects

#### Resource Display

Shows player and AI resources side-by-side:

```typescript
<ResourceDisplay
  player1Resources={{ minerals: 500, gas: 200 }}
  player2Resources={{ minerals: 450, gas: 180 }}
/>
```

#### Unit Panel

Displays selected unit details:

```typescript
<UnitPanel unit={selectedUnit} isLoading={false} />
```

Shows:
- Unit type and ID
- Position coordinates
- Current status
- Health bar with color coding

#### Building Info

Shows selected building details:

```typescript
<BuildingInfo building={selectedBuilding} />
```

Shows:
- Building type and ID
- Position and owner
- Health bar
- Construction progress

### 4. Full Dashboard Integration

The `GameDashboard` page brings everything together:

```typescript
import GameDashboard from '@/pages/GameDashboard';

export default function App() {
  return <GameDashboard />;
}
```

## Usage Examples

### Basic Game Flow

```typescript
import { useAIGame } from '@/hooks/useAIGame';

export function MyGameComponent() {
  const {
    gameState,
    isGameActive,
    initializeGame,
    startGame,
    stopGame,
  } = useAIGame();

  const handleStart = async () => {
    // Create game with medium difficulty
    await initializeGame(64, 64, 'medium');
    // Game automatically starts polling
  };

  const handleStop = async () => {
    await stopGame();
  };

  return (
    <>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop} disabled={!isGameActive}>Stop</button>
      {gameState && <p>Tick: {gameState.tick}</p>}
    </>
  );
}
```

### Unit Commands

```typescript
const { moveUnits, attackUnit, gatherResources, gameState } = useAIGame();

// Move selected units
async function moveSelectedUnits(unitIds: string[], x: number, y: number) {
  await moveUnits(unitIds, x, y);
}

// Attack enemy unit
async function attackEnemy(myUnitIds: string[], targetId: string) {
  await attackUnit(myUnitIds, targetId);
}

// Gather from resource
async function gatherFromMinerals(workerIds: string[], resourceId: string) {
  await gatherResources(workerIds, resourceId);
}
```

### AI Configuration

```typescript
import { useAIStrategy } from '@/hooks/useAIGame';

export function AIConfig() {
  const {
    config,
    updateDifficulty,
    updateAggressiveness,
  } = useAIStrategy();

  return (
    <>
      <select onChange={(e) => updateDifficulty(e.target.value as any)}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <input
        type="range"
        min="0"
        max="100"
        value={config.aggressiveness}
        onChange={(e) => updateAggressiveness(Number(e.target.value))}
      />

      <p>Current: {config.aggressiveness}% aggressive</p>
    </>
  );
}
```

## State Management Flow

### Game Initialization
```
User clicks Start
  ↓
useAIGame.initializeGame()
  ↓
AIGameService.createGame()
  ↓
Backend creates game, returns gameId
  ↓
pollGameState() starts
  ↓
Component state updates with game data
```

### Game Updates
```
Every pollInterval ms (100ms default)
  ↓
AIGameService.getGameState()
  ↓
Backend returns current game state
  ↓
handleStateUpdate() callback
  ↓
setGameState() updates React state
  ↓
Components re-render with new data
```

### Command Execution
```
User sends command (move, attack, build)
  ↓
useAIGame function called
  ↓
AIGameService sends to backend API
  ↓
Backend executes command in game loop
  ↓
Next poll update reflects changes
  ↓
UI updates automatically
```

## Styling & Customization

### Tailwind Configuration

The components use shadcn/ui's default theme. Customize in `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Add custom game colors
        'game-unit': '#3498db',
        'game-ai': '#e74c3c',
        'game-player': '#2ecc71',
      },
    },
  },
}
```

### Component Customization

Modify component styling by adjusting Tailwind classes:

```typescript
// In AIGameUI.tsx
<Card className="custom-styling">
  {/* Customize card appearance */}
</Card>
```

## Performance Optimization

### Memoization

```typescript
import { memo } from 'react';

const GameMapCanvas = memo(({ gameState, ...props }) => {
  // Component only re-renders if props change
  return <canvas {...props} />;
});
```

### Reducing Re-renders

```typescript
// Use useCallback to prevent function recreation
const handleUnitSelect = useCallback((unitId: string) => {
  setSelectedUnitId(unitId);
}, []);
```

### Efficient Polling

Adjust `pollInterval` based on needs:
```typescript
// Faster updates = higher CPU usage
useAIGame({ pollInterval: 50 })  // Very responsive

// Slower updates = lower CPU usage
useAIGame({ pollInterval: 500 }) // Less responsive
```

## Error Handling

The service includes built-in error handling:

```typescript
const { gameState, error, isLoading } = useAIGame();

if (error) {
  return <Alert variant="destructive">{error.message}</Alert>;
}

if (isLoading) {
  return <Spinner />;
}

return <GameContent state={gameState} />;
```

## Troubleshooting

### Connection Issues
- Verify `REACT_APP_API_URL` environment variable
- Check backend server is running
- Look for CORS errors in browser console

### State Not Updating
- Verify polling is active with `isGameActive` flag
- Check network tab for successful API calls
- Ensure game state is not null before rendering

### Performance Issues
- Reduce `pollInterval` usage frequency
- Memoize expensive components
- Implement virtual scrolling for large lists

## Next Steps

1. **Integrate with existing UI** - Copy components into your project structure
2. **Configure API endpoint** - Set correct backend URL
3. **Customize styling** - Adjust Tailwind classes to match design
4. **Add features** - Extend with custom game logic
5. **Test thoroughly** - Verify all commands work end-to-end

## API Integration Checklist

- [ ] Backend server running on configured port
- [ ] CORS properly configured for frontend domain
- [ ] All endpoints implemented on backend
- [ ] Game state contract matches interfaces
- [ ] Error responses properly formatted
- [ ] Polling working without memory leaks
- [ ] All unit/building commands tested
- [ ] Performance acceptable at 60+ ticks/second

## Support & Resources

- **Backend Repo**: https://github.com/lucylow/quaternion
- **Design System**: Lovable.dev blank-canvas-state
- **Components**: shadcn/ui documentation
- **Styling**: Tailwind CSS documentation