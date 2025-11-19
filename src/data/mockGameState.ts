// mockGameState.ts
// Mock game state data for testing and development

export interface MockTile {
  id: string;
  name: string;
  x: number;
  y: number;
  terrain: string;
}

export interface MockUnit {
  id: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  owner: number;
}

export const MOCK_TILES: MockTile[] = Array.from({ length: 9 }).map((_, i) => ({
  id: `tile_${i}`,
  name: `Tile ${i}`,
  x: (i % 3) * 64,
  y: Math.floor(i / 3) * 64,
  terrain: ['plains', 'forest', 'desert'][i % 3],
}));

export const MOCK_UNITS: MockUnit[] = [
  { id: 'unit_1', type: 'worker', x: 32, y: 32, hp: 50, owner: 1 },
  { id: 'unit_2', type: 'soldier', x: 160, y: 32, hp: 100, owner: 1 },
  { id: 'unit_3', type: 'scout', x: 96, y: 96, hp: 30, owner: 1 },
];

// Extended mock data for larger maps
export function generateMockTiles(width: number, height: number, tileSize: number = 64): MockTile[] {
  const tiles: MockTile[] = [];
  const terrains = ['plains', 'forest', 'desert', 'mountain', 'water'];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      tiles.push({
        id: `tile_${x}_${y}`,
        name: `Tile ${x},${y}`,
        x: x * tileSize,
        y: y * tileSize,
        terrain: terrains[index % terrains.length],
      });
    }
  }
  
  return tiles;
}

export function generateMockUnits(count: number, mapWidth: number, mapHeight: number): MockUnit[] {
  const units: MockUnit[] = [];
  const types = ['worker', 'soldier', 'scout', 'builder'];
  
  for (let i = 0; i < count; i++) {
    units.push({
      id: `unit_${i + 1}`,
      type: types[i % types.length],
      x: Math.random() * mapWidth,
      y: Math.random() * mapHeight,
      hp: 50 + Math.floor(Math.random() * 50),
      owner: 1,
    });
  }
  
  return units;
}

