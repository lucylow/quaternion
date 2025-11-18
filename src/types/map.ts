/**
 * Map-related TypeScript type definitions
 */

export interface MapConfig {
  id: string;
  name: string;
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
  imagePath: string;
  description: string;
  gridSize: {
    width: number;
    height: number;
  };
  spawnPoints: SpawnPoint[];
  recommendedResources: ResourceLocation[];
}

export interface SpawnPoint {
  x: number;
  y: number;
  player: number;
}

export interface ResourceLocation {
  x: number;
  y: number;
  type: 'minerals' | 'gas';
}

export interface MapRenderConfig {
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface Coordinates {
  x: number;
  y: number;
}


