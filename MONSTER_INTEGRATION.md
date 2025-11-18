# Monster System Integration Guide

## Overview

The monster system has been successfully integrated into the Quaternion game. This system provides procedurally generated monsters with deterministic behavior, AI-driven decision-making, and seamless replay integration.

## Files Created

### Core System Files

1. **`src/engine/math/Vector2.ts`** - 2D vector math utility for positions and calculations
2. **`src/engine/entities/Monster.ts`** - Core monster entity with procedural generation
3. **`src/engine/spawning/MonsterSpawner.ts`** - Spawn management and lifecycle
4. **`src/engine/ai/MonsterAI.ts`** - Behavior tree and decision-making
5. **`src/rendering/MonsterRenderer.ts`** - Phaser-compatible procedural rendering

### Integration

- **`src/game/QuaternionGameState.ts`** - Monster system integrated into main game state

## Features

### ✅ Deterministic Generation
- Same seed produces identical monsters every time
- Stats, colors, and behavior are procedurally generated but reproducible

### ✅ AI Decision-Making
- Target acquisition (finds nearest hostile within 300px)
- Behavior tree: flee when health low, attack when in range, chase when target found
- Human-readable reason strings for replay system

### ✅ Replay Integration
- All monster actions logged with reasoning
- Actions appear in replay JSON and Judge HUD
- Monster highlights extracted for demonstration

### ✅ Visual Variety
- Four monster types: spider, goblin, undead, dragon
- Procedurally generated sprites with color variation
- Health bars and animation state visualization

## Usage

### Basic Integration

The monster system is automatically initialized when `QuaternionGameState` is created. No additional setup required.

### Configuration

Monster spawn configuration can be adjusted in `QuaternionGameState.initializeMonsterSystem()`:

```typescript
const spawnConfig: SpawnConfig = {
  minDistance: 100,        // Minimum distance from center
  maxDistance: 800,        // Maximum distance
  maxConcurrentMonsters: 50, // Max monsters at once
  spawnChance: 0.3,        // 30% chance per spawn tick
  respawnDelay: 1000       // 1 second between spawns
};
```

### Rendering Integration

To render monsters in your Phaser scene:

```typescript
import { MonsterRenderer } from '../rendering/MonsterRenderer';

// In your scene setup
const monsterRenderer = new MonsterRenderer(this);

// In your update/render loop
gameState.monsters.forEach(monster => {
  monsterRenderer.render(monster);
});

// Cleanup when monster dies
monsterRenderer.removeMonster(monsterId);
```

### Replay System

Monster actions are automatically logged via `logAction('monster_action', {...})`. The replay serializer recognizes `monster_action` as a pivotal action type.

### Accessing Monsters

```typescript
// Get all active monsters
const activeMonsters = gameState.monsters.filter(m => m.isAlive());

// Get monster spawner
const spawner = gameState.monsterSpawner;

// Get active monsters from spawner
const monsters = spawner?.getActiveMonsters() || [];
```

## Monster Types

### Spider
- **Stats**: Low HP (20), fast speed (200), melee attack
- **Behavior**: Pack behavior, moderate aggressiveness
- **Visual**: 8 legs, brown/tan colors

### Goblin
- **Stats**: Balanced (30 HP), medium speed (150), mixed attack
- **Behavior**: Pack behavior, high aggressiveness
- **Visual**: Green humanoid, yellow eyes

### Undead
- **Stats**: Tanky (50 HP), slow (100), melee attack
- **Behavior**: Swarm behavior, high aggressiveness, low flee threshold
- **Visual**: Gray/dark colors, skull marks

### Dragon
- **Stats**: Boss-tier (200 HP), high damage (40), ranged attack
- **Behavior**: Solo behavior, very high aggressiveness
- **Visual**: Large body, wings, red/dark colors

## AI Decision Flow

1. **Target Acquisition**: Find nearest hostile entity within 300px range
2. **Health Check**: If health < flee threshold, flee
3. **Range Check**: If target in attack range and cooldown ready, attack
4. **Chase**: If target out of range, chase
5. **Wander**: If no target and aggressive, wander
6. **Idle**: Default state

## Replay Integration

Monster actions are logged with the following structure:

```typescript
{
  tick: number,
  time: number,
  type: 'monster_action',
  data: {
    monsterId: string,
    monsterType: 'spider' | 'goblin' | 'undead' | 'dragon',
    actionType: 'attack' | 'chase' | 'flee' | 'wander' | 'idle',
    targetId: string | null,
    reason: string, // Human-readable explanation
    healthPercent: number,
    position: { x: number, y: number }
  }
}
```

These actions appear in:
- `gameState.actionLog` - Full action log
- Replay JSON export - For replay viewing
- Judge HUD - AI highlights section

## Performance Considerations

- **Sprite Caching**: Sprites are cached by seed to avoid regeneration
- **Object Pooling**: Can be added for monster instances (not yet implemented)
- **Spatial Partitioning**: AI only checks nearby entities (300px range)
- **Max Concurrent**: Configurable limit prevents performance issues

## Debugging

### Enable Debug Logging

Add console logs in `updateMonsterSystem()`:

```typescript
console.log(`Monsters: ${activeMonsters.length}`, 
  activeMonsters.map(m => ({
    type: m.monsterType,
    hp: `${m.stats.health}/${m.stats.maxHealth}`,
    state: m.animationState,
    pos: `(${Math.round(m.position.x)}, ${Math.round(m.position.y)})`
  }))
);
```

### Visual Debug

Add debug overlay in `MonsterRenderer.render()`:

```typescript
// Draw target line
if (ai.target) {
  graphics.lineStyle(2, 0xFF00FF);
  graphics.lineBetween(
    monster.position.x, monster.position.y,
    ai.target.position.x, ai.target.position.y
  );
}

// Draw detection range
graphics.lineStyle(1, 0xFF0000, 0.3);
graphics.strokeCircle(monster.position.x, monster.position.y, 300);
```

## Testing

### Unit Tests

```typescript
import { Monster } from './engine/entities/Monster';
import { Vector2 } from './engine/math/Vector2';

test('Monster spawns with deterministic stats', () => {
  const pos = new Vector2(0, 0);
  const m1 = new Monster(pos, 'spider', 'enemies', 12345);
  const m2 = new Monster(pos, 'spider', 'enemies', 12345);
  
  expect(m1.stats.health).toBe(m2.stats.health);
  expect(m1.colorScheme).toEqual(m2.colorScheme);
});

test('Monster takes damage correctly', () => {
  const monster = new Monster(new Vector2(0, 0), 'spider', 'enemies', 1);
  const initialHealth = monster.stats.health;
  
  monster.takeDamage(5);
  expect(monster.stats.health).toBeLessThan(initialHealth);
});
```

## Extension Ideas

### Advanced Features
- Monster abilities (fireball, poison, summon)
- Faction alliances (monsters fight each other)
- Evolution (monsters grow stronger over time)
- Pathfinding (A* instead of simple movement)
- Swarm intelligence (coordinated tactics)

### Customization
- Adjust base stats per difficulty
- Modify spawn weights (currently 40% spider, 30% goblin, 20% undead, 10% dragon)
- Add new monster types
- Custom color schemes

## Troubleshooting

### Monsters not spawning
- Check spawn points are set: `monsterSpawner.setSpawnPoints([...])`
- Verify `maxConcurrentMonsters` limit not reached
- Check `spawnChance` is > 0

### Monsters not attacking
- Verify entities have `faction` property set (not 'enemies')
- Check `acquisitionRange` in MonsterAI (default 300px)
- Ensure entities are alive (`isAlive()` returns true)

### Performance issues
- Reduce `maxConcurrentMonsters`
- Lower `spawnChance`
- Increase `respawnDelay`
- Implement object pooling

## Next Steps

1. ✅ Core system implemented
2. ✅ Integrated into game state
3. ✅ Replay logging connected
4. ⏳ Add rendering integration to game scene
5. ⏳ Test with actual gameplay
6. ⏳ Tune balance and difficulty

## Summary

The monster system is fully integrated and ready to use. Monsters will automatically spawn, make AI decisions, and log actions for replay. Simply add the renderer to your Phaser scene to visualize them.

For questions or issues, refer to the code comments in each file or check the integration points in `QuaternionGameState.ts`.

