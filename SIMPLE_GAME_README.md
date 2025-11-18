# Simple Quaternion RTS - Playable Implementation

This is a simplified, fully playable RTS game implementation for Quaternion. It provides a complete game loop, unit management, building system, and resource management.

## Features

✅ **Working Game Loop** - 60 FPS deterministic updates  
✅ **Playable Game** - Click to select units, right-click to move  
✅ **Resource System** - Matter, Energy, Life, Knowledge generation  
✅ **Unit Management** - Workers, soldiers with AI behaviors  
✅ **Building System** - Construct and produce units  
✅ **Map Generation** - Procedural terrain with Perlin noise  
✅ **HUD Display** - Real-time resource and unit info  
✅ **Camera Controls** - Arrow keys to pan the map  

## File Structure

### Core Game Systems
- `src/game/systems/BuildingManager.ts` - Building management
- `src/game/systems/SimpleResourceManager.ts` - Resource generation
- `src/game/systems/SimpleUnitManager.ts` - Unit management
- `src/game/SimpleQuaternionGameState.ts` - Main game state

### Map Generation
- `src/game/map/SimpleMapGenerator.ts` - Perlin noise terrain generation
- `src/game/map/SimpleMapManager.ts` - Map data management

### Frontend
- `src/frontend/scenes/SimpleGameScene.ts` - Phaser game scene
- `src/frontend/simpleGameConfig.ts` - Phaser configuration
- `src/pages/SimpleGame.tsx` - React page component

## How to Use

### Option 1: Add Route (Recommended)

Add this route to your `src/routes/index.tsx`:

```tsx
import SimpleGame from './pages/SimpleGame';

// In your routes:
<Route path="/simple-game" element={<SimpleGame />} />
```

Then navigate to `/simple-game` in your browser.

### Option 2: Direct Import

You can also import and use the SimpleGameScene directly in any Phaser setup:

```tsx
import { SimpleGameScene } from './frontend/scenes/SimpleGameScene';
import { simpleGameConfig } from './frontend/simpleGameConfig';

// Use in Phaser config:
const config = {
  ...simpleGameConfig,
  scene: [SimpleGameScene]
};
```

## Controls

- **Left Click**: Select unit
- **Right Click**: Move selected units
- **Arrow Keys**: Pan camera
- **B**: Open build menu
- **A**: Attack mode
- **Space**: Select all units

## Game Mechanics

### Resources
- **Matter**: Basic resource for units and buildings
- **Energy**: Required for advanced units and buildings
- **Life**: Biological resource
- **Knowledge**: Research and technology resource

### Units
- **Worker**: Basic unit, gathers resources
- **Soldier**: Combat unit
- **Tank**: Heavy combat unit
- **Air Unit**: Flying unit

### Buildings
- **Base**: Starting building, produces workers
- **Barracks**: Produces soldiers
- **Factory**: Produces tanks
- **Airfield**: Produces air units
- **Refinery**: Generates resources

## Development

The game uses:
- **Phaser 3** for rendering
- **TypeScript** for type safety
- **React** for UI integration

All game logic runs at 60 FPS with a fixed timestep for deterministic behavior.

## Next Steps

To extend this implementation:
1. Add more unit types and abilities
2. Implement pathfinding for units
3. Add multiplayer support
4. Enhance AI behaviors
5. Add more building types
6. Implement technology tree
7. Add victory conditions

## Troubleshooting

If the game doesn't load:
1. Ensure Phaser is installed: `npm install phaser`
2. Check browser console for errors
3. Verify the game container element exists
4. Make sure the route is properly configured

## Notes

This is a simplified implementation designed to be fully playable. The existing `QuaternionGameState.ts` and other systems are more complex and feature-rich, but this simple version provides a working foundation that can be extended.

