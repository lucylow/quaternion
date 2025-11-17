# 🌍 Advanced World Generation System

A comprehensive procedural world generation system for creating amazing, creative worlds with realistic terrain, biomes, water systems, and civilizations.

## Features

- **Perlin Noise Generation**: High-quality noise for natural terrain
- **Biome System**: Temperature and moisture-based biome assignment
- **Water Systems**: Rivers and lakes that flow naturally
- **Settlement Generation**: Procedurally generated civilizations with roads
- **Chunk Management**: Infinite terrain support with efficient chunk loading
- **Erosion Simulation**: Realistic terrain erosion
- **Resource Distribution**: Intelligent resource placement based on biomes

## Quick Start

### Basic Finite World Generation

```typescript
import { AdvancedWorldSystem } from './map/AdvancedWorldSystem';

// Generate a finite world
const result = AdvancedWorldSystem.generate({
  mode: 'finite',
  width: 200,
  height: 200,
  seed: 12345,
  finiteConfig: {
    noiseScale: 0.1,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0
  }
});

const world = result.finiteWorld!;

// Access world data
console.log(`World size: ${world.width}x${world.height}`);
console.log(`Settlements: ${world.settlements.length}`);
console.log(`Rivers: ${world.rivers.length}`);
console.log(`Lakes: ${world.lakes.length}`);
```

### Infinite World with Chunks

```typescript
import { AdvancedWorldSystem } from './map/AdvancedWorldSystem';

// Generate infinite world
const result = AdvancedWorldSystem.generate({
  mode: 'infinite',
  width: 0, // Not used for infinite
  height: 0, // Not used for infinite
  seed: 12345,
  infiniteConfig: {
    chunkSize: 32,
    tileSize: 1,
    viewDistance: 3, // Load 3 chunks in each direction
    noiseScale: 0.1,
    octaves: 4
  }
});

const chunkManager = result.chunkManager!;

// Load chunks around player position
const playerX = 100;
const playerY = 100;
const chunks = chunkManager.loadChunksAround(playerX, playerY);

// Get tile data at specific position
const tile = chunkManager.getTileAt(playerX, playerY);
if (tile) {
  console.log(`Biome: ${tile.biome}`);
  console.log(`Height: ${tile.height}`);
  console.log(`Temperature: ${tile.temperature}`);
  console.log(`Moisture: ${tile.moisture}`);
}

// Unload distant chunks
chunkManager.unloadDistantChunks(playerX, playerY);
```

### Using Perlin Noise Directly

```typescript
import { PerlinNoise } from './map/PerlinNoise';

// Create noise generator
const noise = new PerlinNoise(12345);

// Simple 2D noise
const value = noise.noise2D(10, 20); // Returns -1 to 1

// Fractal Brownian Motion (multiple octaves)
const fbm = noise.fbm2D(
  10, 20,
  4,    // octaves
  0.5,  // persistence
  2.0,  // lacunarity
  1.0   // scale
);

// Ridge noise for mountains
const ridge = noise.ridge2D(10, 20, 4, 0.5, 2.0, 1.0);

// Domain warping for natural patterns
const warped = noise.domainWarp2D(10, 20, 50, 4);
```

### World Data Structure

```typescript
interface WorldData {
  width: number;
  height: number;
  seed: number;
  heightMap: number[][];        // 0-1 height values
  moistureMap: number[][];       // 0-1 moisture values
  temperatureMap: number[][];    // 0-1 temperature values
  biomeMap: string[][];         // Biome names
  waterMap: boolean[][];        // Water tiles
  roadMap: boolean[][];         // Road tiles
  resources: ResourceDeposit[]; // Resource deposits
  settlements: Settlement[];    // Generated settlements
  rivers: River[];              // River paths
  lakes: Lake[];                // Lake areas
}
```

### Biomes

The system generates the following biomes based on height, temperature, and moisture:

- **Water**: Height < 0.2
- **Plains**: Low moisture, moderate temperature
- **Forest**: Moderate moisture, moderate temperature
- **Swamp**: High moisture, moderate temperature
- **Desert**: Low moisture, high temperature
- **Savanna**: Moderate moisture, high temperature
- **Jungle**: High moisture, high temperature
- **Mountain**: Height > 0.8
- **Snow**: High elevation or low temperature
- **Tundra**: Low temperature, low moisture

### Visualization

```typescript
import { AdvancedWorldSystem } from './map/AdvancedWorldSystem';

// Get biome color
const color = AdvancedWorldSystem.getBiomeColor('forest'); // '#228B22'

// Get height color
const heightColor = AdvancedWorldSystem.getHeightColor(0.5); // '#90EE90'
```

## Advanced Usage

### Custom World Generation

```typescript
import { WorldGenerator, WorldConfig } from './map/WorldGenerator';

const config: WorldConfig = {
  width: 500,
  height: 500,
  seed: 12345,
  noiseScale: 0.05,  // Smaller = smoother terrain
  octaves: 6,        // More = more detail
  persistence: 0.6,  // Higher = more variation
  lacunarity: 2.5    // Higher = faster frequency increase
};

const generator = new WorldGenerator(config);
const world = generator.generate();
```

### Chunk Management

```typescript
import { ChunkManager, ChunkManagerConfig } from './map/ChunkManager';

const config: ChunkManagerConfig = {
  chunkSize: 64,      // Larger chunks = less frequent loading
  tileSize: 1,
  viewDistance: 5,    // More chunks = larger view area
  seed: 12345,
  noiseScale: 0.1,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2.0
};

const manager = new ChunkManager(config);

// Get specific chunk
const chunk = manager.getChunk(0, 0);

// Access chunk data
const height = chunk.data.heightMap[0][0];
const biome = chunk.data.biomeMap[0][0];
```

## Integration with Existing Systems

### Convert to Enhanced Map Format

```typescript
import { AdvancedWorldSystem } from './map/AdvancedWorldSystem';

const result = AdvancedWorldSystem.generate({
  mode: 'finite',
  width: 200,
  height: 200,
  seed: 12345
});

const world = result.finiteWorld!;

// Convert to enhanced map format for compatibility
const enhancedMap = AdvancedWorldSystem.convertWorldToEnhancedMap(world);
```

### Using with Enhanced Procedural Generator

```typescript
import { AdvancedWorldSystem } from './map/AdvancedWorldSystem';

// Use enhanced generator (compatibility mode)
const result = AdvancedWorldSystem.generate({
  mode: 'finite',
  width: 200,
  height: 200,
  seed: 12345,
  useEnhanced: true,
  enhancedConfig: {
    personality: 'economic',
    biome: 'crystalline'
  }
});

const enhancedMap = result.enhancedMap!;
```

## Performance Considerations

1. **Finite Worlds**: Best for small to medium worlds (< 1000x1000)
2. **Infinite Worlds**: Use chunk management for large or infinite worlds
3. **Chunk Size**: Larger chunks = fewer chunks to manage but more memory per chunk
4. **View Distance**: Smaller view distance = better performance
5. **Noise Octaves**: More octaves = more detail but slower generation

## Examples

### Generate World for Game

```typescript
import { AdvancedWorldSystem } from './map/AdvancedWorldSystem';

function generateGameWorld() {
  const result = AdvancedWorldSystem.generate({
    mode: 'finite',
    width: 400,
    height: 400,
    seed: Date.now(),
    finiteConfig: {
      noiseScale: 0.08,
      octaves: 5,
      persistence: 0.55,
      lacunarity: 2.2
    }
  });

  const world = result.finiteWorld!;
  
  // Use world data for game
  return {
    terrain: world.heightMap,
    biomes: world.biomeMap,
    resources: world.resources,
    settlements: world.settlements,
    rivers: world.rivers,
    lakes: world.lakes
  };
}
```

### Render World with Phaser

```typescript
import { AdvancedWorldSystem } from './map/AdvancedWorldSystem';

function renderWorld(scene: Phaser.Scene, world: WorldData) {
  const tileSize = 16;
  
  for (let x = 0; x < world.width; x++) {
    for (let y = 0; y < world.height; y++) {
      const biome = world.biomeMap[x][y];
      const color = AdvancedWorldSystem.getBiomeColor(biome);
      
      // Create tile sprite
      const tile = scene.add.rectangle(
        x * tileSize,
        y * tileSize,
        tileSize,
        tileSize,
        parseInt(color.replace('#', ''), 16)
      );
    }
  }
}
```

## API Reference

### AdvancedWorldSystem

- `generate(config: AdvancedWorldConfig): WorldGenerationResult`
- `convertWorldToEnhancedMap(world: WorldData): EnhancedGeneratedMap`
- `getBiomeColor(biome: string): string`
- `getHeightColor(height: number): string`

### WorldGenerator

- `generate(): WorldData`

### ChunkManager

- `getChunk(chunkX: number, chunkY: number): Chunk`
- `loadChunksAround(worldX: number, worldY: number): Chunk[]`
- `unloadDistantChunks(worldX: number, worldY: number): void`
- `getTileAt(worldX: number, worldY: number): TileData | null`
- `worldToChunk(worldX: number, worldY: number): { chunkX: number; chunkY: number }`
- `chunkToWorld(chunkX: number, chunkY: number): { worldX: number; worldY: number }`

### PerlinNoise

- `noise2D(x: number, y: number): number`
- `noise3D(x: number, y: number, z: number): number`
- `fbm2D(x: number, y: number, octaves: number, persistence: number, lacunarity: number, scale: number): number`
- `ridge2D(x: number, y: number, octaves: number, persistence: number, lacunarity: number, scale: number): number`
- `domainWarp2D(x: number, y: number, strength: number, octaves: number): { x: number; y: number }`

## Tips

1. **Seeds**: Use the same seed to generate the same world
2. **Noise Scale**: Lower values = smoother, larger features
3. **Octaves**: More octaves = more detail but slower
4. **Persistence**: Controls how much each octave contributes
5. **Lacunarity**: Controls frequency increase between octaves
6. **Chunk Loading**: Load chunks before player reaches them
7. **Memory Management**: Unload distant chunks regularly

## License

Part of the Quaternion game project.

