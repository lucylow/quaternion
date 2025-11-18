# 🎮 Game Integration Guide

## Overview

This project contains **two distinct games** that share common infrastructure:

1. **Neural Frontier** (`/game`) - Streamlined RTS
2. **Quaternion Strategy** (`/quaternion`) - Full 4-axis strategy game

## Game Differences

### Neural Frontier (`/game`)

**Purpose**: Quick, accessible RTS experience

**Features**:
- Simple React state management
- Basic resource system (ore, energy, biomass, data)
- AI commander suggestions
- Quick 15-20 minute matches
- Perfect for beginners
- Single-player only

**Game State**: Uses React `useState` hooks
**Data Source**: `@/data/gameData`
**Route**: `/game`

### Quaternion Strategy (`/quaternion`)

**Purpose**: Full-featured strategy game with complex systems

**Features**:
- Full `QuaternionGameState` management system
- 4-axis resource system (Matter, Energy, Life, Knowledge)
- Resource puzzles & black market
- AI advisor system
- Multiple victory conditions
- Multiplayer support
- Campaign mode
- Puzzle mode
- Theater mode (replays)

**Game State**: Uses `QuaternionGameState` class
**Data Source**: `@/data/quaternionData`
**Route**: `/quaternion`

## Integration Architecture

### Shared Systems

Both games share:
- **Phaser 3 Engine**: Rendering and physics
- **UI Components**: Build menus, tech trees, HUD elements
- **AI Systems**: Commander personalities and suggestions
- **Design System**: Common styling and themes

### Separate Systems

Each game has its own:
- **Game State Management**: React state vs QuaternionGameState
- **Data Files**: `gameData.ts` vs `quaternionData.ts`
- **Game Logic**: Simplified vs complex systems
- **Features**: Basic vs advanced

## How to Use

### From Lobby (`/lobby`)

1. **Select Game Type**: Choose between Neural Frontier or Quaternion Strategy
2. **Configure**: 
   - Neural Frontier: Just click "Launch"
   - Quaternion: Configure commander, difficulty, map, etc.
3. **Start**: Click the launch button

### Direct Navigation

```typescript
// Navigate to Neural Frontier
navigate('/game');

// Navigate to Quaternion Strategy
navigate('/quaternion', {
  state: {
    config: {
      mode: 'single',
      commanderId: 'AUREN',
      difficulty: 'medium',
      mapType: 'crystalline_plains',
      mapWidth: 40,
      mapHeight: 30,
      seed: 12345
    }
  }
});
```

## Code Structure

```
src/
├── pages/
│   ├── Game.tsx              # Neural Frontier (simple)
│   └── QuaternionGame.tsx    # Quaternion Strategy (full)
├── game/
│   ├── GameState.js          # Simple game state (for Neural Frontier)
│   └── QuaternionGameState.ts # Full game state (for Quaternion)
├── data/
│   ├── gameData.ts           # Data for Neural Frontier
│   └── quaternionData.ts     # Data for Quaternion Strategy
└── components/
    └── game/
        ├── GameLauncher.tsx  # Game selection component
        └── [shared components]
```

## When to Use Which Game

### Use Neural Frontier (`/game`) when:
- You want a quick demo
- Testing basic mechanics
- Teaching RTS basics
- Need simple, fast gameplay
- Single-player only is fine

### Use Quaternion Strategy (`/quaternion`) when:
- You want the full experience
- Need multiplayer support
- Want resource puzzles
- Need campaign progression
- Want advanced features

## Adding New Features

### For Neural Frontier:
- Add to `src/pages/Game.tsx`
- Use React state management
- Update `src/data/gameData.ts`

### For Quaternion Strategy:
- Add to `src/pages/QuaternionGame.tsx`
- Extend `QuaternionGameState` if needed
- Update `src/data/quaternionData.ts`
- Consider adding to managers (ResourceManager, UnitManager, etc.)

## Migration Path

If you want to migrate features between games:

1. **From Neural Frontier → Quaternion**:
   - Extract logic from `Game.tsx`
   - Integrate into `QuaternionGameState`
   - Add to appropriate manager classes
   - Update data files

2. **From Quaternion → Neural Frontier**:
   - Simplify complex systems
   - Convert to React state
   - Remove multiplayer/advanced features
   - Update `gameData.ts`

## Best Practices

1. **Keep games separate**: Don't mix game logic between the two
2. **Share components**: Use common UI components
3. **Document differences**: Make it clear which game uses what
4. **Test both**: Ensure both games work independently
5. **Clear naming**: Use prefixes or namespaces to avoid conflicts

## Troubleshooting

### Issue: Game doesn't load
- Check which route you're using (`/game` vs `/quaternion`)
- Verify game type selection in lobby
- Check browser console for errors

### Issue: Features not working
- Ensure you're using the correct game
- Check if feature is available in that game mode
- Verify data files are imported correctly

### Issue: State conflicts
- Each game has separate state management
- No shared state between games
- Refresh page to reset state

## Future Enhancements

Potential improvements:
1. **Unified Game State**: Create abstraction layer
2. **Shared Save System**: Allow switching between games
3. **Cross-Game Features**: Share achievements/progress
4. **Unified Lobby**: Better game selection UI
5. **Game Mode Presets**: Quick launch configurations

