/**
 * Example usage of the Advanced World Generation System
 * This file demonstrates how to use the world generation features
 */

import { AdvancedWorldSystem } from './AdvancedWorldSystem';
import { WorldGenerator } from './WorldGenerator';
import { ChunkManager } from './ChunkManager';
import { PerlinNoise } from './PerlinNoise';

/**
 * Example 1: Generate a simple finite world
 */
export function exampleFiniteWorld() {
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
  
  console.log('Finite World Generated:');
  console.log(`- Size: ${world.width}x${world.height}`);
  console.log(`- Settlements: ${world.settlements.length}`);
  console.log(`- Rivers: ${world.rivers.length}`);
  console.log(`- Lakes: ${world.lakes.length}`);
  console.log(`- Resources: ${world.resources.length}`);
  
  return world;
}

/**
 * Example 2: Generate an infinite world with chunks
 */
export function exampleInfiniteWorld() {
  const result = AdvancedWorldSystem.generate({
    mode: 'infinite',
    width: 0,
    height: 0,
    seed: 12345,
    infiniteConfig: {
      chunkSize: 32,
      tileSize: 1,
      viewDistance: 3,
      noiseScale: 0.1,
      octaves: 4
    }
  });

  const chunkManager = result.chunkManager!;
  
  // Simulate player movement
  const playerX = 100;
  const playerY = 100;
  
  // Load chunks around player
  const chunks = chunkManager.loadChunksAround(playerX, playerY);
  console.log(`Loaded ${chunks.length} chunks around player`);
  
  // Get tile at player position
  const tile = chunkManager.getTileAt(playerX, playerY);
  if (tile) {
    console.log(`Player at: ${playerX}, ${playerY}`);
    console.log(`- Biome: ${tile.biome}`);
    console.log(`- Height: ${tile.height.toFixed(2)}`);
    console.log(`- Temperature: ${tile.temperature.toFixed(2)}`);
    console.log(`- Moisture: ${tile.moisture.toFixed(2)}`);
  }
  
  return chunkManager;
}

/**
 * Example 3: Use Perlin noise directly
 */
export function examplePerlinNoise() {
  const noise = new PerlinNoise(12345);
  
  // Simple 2D noise
  const value = noise.noise2D(10, 20);
  console.log(`Simple noise at (10, 20): ${value.toFixed(3)}`);
  
  // Fractal Brownian Motion
  const fbm = noise.fbm2D(10, 20, 4, 0.5, 2.0, 1.0);
  console.log(`FBM at (10, 20): ${fbm.toFixed(3)}`);
  
  // Ridge noise for mountains
  const ridge = noise.ridge2D(10, 20, 4, 0.5, 2.0, 1.0);
  console.log(`Ridge noise at (10, 20): ${ridge.toFixed(3)}`);
  
  // Domain warping
  const warped = noise.domainWarp2D(10, 20, 50, 4);
  console.log(`Domain warped from (10, 20) to (${warped.x.toFixed(2)}, ${warped.y.toFixed(2)})`);
  
  return noise;
}

/**
 * Example 4: Visualize world data
 */
export function exampleVisualization(world: any) {
  // Get biome colors
  const biomes = new Set<string>();
  for (let x = 0; x < world.width; x++) {
    for (let y = 0; y < world.height; y++) {
      biomes.add(world.biomeMap[x][y]);
    }
  }
  
  console.log('Biomes in world:');
  for (const biome of biomes) {
    const color = AdvancedWorldSystem.getBiomeColor(biome);
    console.log(`- ${biome}: ${color}`);
  }
  
  // Analyze height distribution
  let waterTiles = 0;
  let landTiles = 0;
  for (let x = 0; x < world.width; x++) {
    for (let y = 0; y < world.height; y++) {
      if (world.waterMap[x][y]) {
        waterTiles++;
      } else {
        landTiles++;
      }
    }
  }
  
  console.log(`\nTerrain distribution:`);
  console.log(`- Water tiles: ${waterTiles} (${((waterTiles / (world.width * world.height)) * 100).toFixed(1)}%)`);
  console.log(`- Land tiles: ${landTiles} (${((landTiles / (world.width * world.height)) * 100).toFixed(1)}%)`);
}

/**
 * Example 5: Find resources near position
 */
export function exampleFindResources(world: any, x: number, y: number, radius: number) {
  const nearbyResources = world.resources.filter((resource: any) => {
    const distance = Math.sqrt((resource.x - x) ** 2 + (resource.y - y) ** 2);
    return distance <= radius;
  });
  
  console.log(`Resources within ${radius} tiles of (${x}, ${y}):`);
  for (const resource of nearbyResources) {
    console.log(`- ${resource.type} at (${resource.x}, ${resource.y}): ${resource.amount} units`);
  }
  
  return nearbyResources;
}

/**
 * Example 6: Find nearest settlement
 */
export function exampleFindNearestSettlement(world: any, x: number, y: number) {
  let nearest: any = null;
  let minDistance = Infinity;
  
  for (const settlement of world.settlements) {
    const distance = Math.sqrt((settlement.x - x) ** 2 + (settlement.y - y) ** 2);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = settlement;
    }
  }
  
  if (nearest) {
    console.log(`Nearest settlement: ${nearest.name}`);
    console.log(`- Type: ${nearest.type}`);
    console.log(`- Size: ${nearest.size}`);
    console.log(`- Population: ${nearest.population}`);
    console.log(`- Distance: ${minDistance.toFixed(1)} tiles`);
  }
  
  return nearest;
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('=== Example 1: Finite World ===');
  const world = exampleFiniteWorld();
  
  console.log('\n=== Example 2: Infinite World ===');
  exampleInfiniteWorld();
  
  console.log('\n=== Example 3: Perlin Noise ===');
  examplePerlinNoise();
  
  console.log('\n=== Example 4: Visualization ===');
  exampleVisualization(world);
  
  console.log('\n=== Example 5: Find Resources ===');
  exampleFindResources(world, 100, 100, 50);
  
  console.log('\n=== Example 6: Find Settlement ===');
  exampleFindNearestSettlement(world, 100, 100);
}


