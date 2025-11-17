import { QuaternionRNG } from '../utils/quaternion.js';

export const TerrainType = {
  PLAINS: 'plains',
  MOUNTAIN: 'mountain',
  WATER: 'water',
  MINERAL: 'mineral',
  GAS: 'gas'
};

/**
 * Procedural map generator using quaternion-based algorithms
 */
export class MapGenerator {
  constructor(width = 64, height = 64, seed = Date.now()) {
    this.width = width;
    this.height = height;
    this.seed = seed;
    this.rng = new QuaternionRNG(seed);
  }

  /**
   * Generate a complete game map
   */
  generate() {
    const map = {
      width: this.width,
      height: this.height,
      seed: this.seed,
      tiles: [],
      resources: [],
      startPositions: []
    };

    // Initialize terrain
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        map.tiles.push(this.generateTile(x, y));
      }
    }

    // Add resources
    this.placeResources(map);

    // Determine start positions (2 players)
    map.startPositions = [
      { x: 5, y: 5, playerId: 1 },
      { x: this.width - 6, y: this.height - 6, playerId: 2 }
    ];

    return map;
  }

  /**
   * Generate terrain for a single tile using Perlin-like noise
   */
  generateTile(x, y) {
    const noise = this.noise(x / 10, y / 10);
    const moisture = this.noise(x / 15 + 100, y / 15 + 100);

    let type = TerrainType.PLAINS;
    let passable = true;
    let buildable = true;

    if (noise > 0.7) {
      type = TerrainType.MOUNTAIN;
      passable = false;
      buildable = false;
    } else if (moisture < 0.3 && noise < 0.3) {
      type = TerrainType.WATER;
      passable = false;
      buildable = false;
    }

    return {
      x,
      y,
      type,
      passable,
      buildable,
      explored: [false, false, false], // fog of war per player (index 0 unused, 1-2 for players)
      visible: [false, false, false]
    };
  }

  /**
   * Simple noise function using quaternion RNG
   */
  noise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    // Get corner values
    const a = this.hash(ix, iy);
    const b = this.hash(ix + 1, iy);
    const c = this.hash(ix, iy + 1);
    const d = this.hash(ix + 1, iy + 1);

    // Smooth interpolation
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);

    return this.lerp(
      this.lerp(a, b, u),
      this.lerp(c, d, u),
      v
    );
  }

  hash(x, y) {
    const n = x * 374761393 + y * 668265263 + this.seed;
    return (Math.sin(n) * 43758.5453) % 1;
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Place resource nodes on the map
   */
  placeResources(map) {
    const resourceCount = Math.floor((this.width * this.height) / 100);

    for (let i = 0; i < resourceCount; i++) {
      const x = this.rng.nextInt(0, this.width - 1);
      const y = this.rng.nextInt(0, this.height - 1);
      const tile = map.tiles[y * this.width + x];

      if (tile.passable && tile.buildable) {
        const resourceType = this.rng.next() > 0.6 ? TerrainType.GAS : TerrainType.MINERAL;
        const amount = this.rng.nextInt(500, 1500);

        map.resources.push({
          id: `resource_${i}`,
          x,
          y,
          type: resourceType,
          amount,
          maxAmount: amount
        });

        // Update tile
        tile.type = resourceType;
        tile.buildable = false;
      }
    }
  }

  /**
   * Get tile at position
   */
  static getTile(map, x, y) {
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return null;
    }
    return map.tiles[y * map.width + x];
  }

  /**
   * Check if position is passable
   */
  static isPassable(map, x, y) {
    const tile = this.getTile(map, x, y);
    return tile && tile.passable;
  }
}
