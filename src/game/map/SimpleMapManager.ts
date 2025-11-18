/**
 * Simple Map Manager
 * Handles map data and resource nodes
 */

import { Tile, ResourceNode } from './SimpleMapGenerator';

export class SimpleMapManager {
  private width: number;
  private height: number;
  private terrain: Tile[][];
  private resourceNodes: ResourceNode[];

  constructor(width: number, height: number, terrain: Tile[][], resourceNodes: ResourceNode[] = []) {
    this.width = width;
    this.height = height;
    this.terrain = terrain;
    this.resourceNodes = resourceNodes;
  }

  getTile(x: number, y: number): Tile | null {
    const tileX = Math.floor(x / 32);
    const tileY = Math.floor(y / 32);

    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return null;
    }

    return this.terrain[tileY] && this.terrain[tileY][tileX] || null;
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.walkable !== false : false;
  }

  getResourceNodes(): ResourceNode[] {
    return this.resourceNodes;
  }

  getPublicData(): {
    width: number;
    height: number;
    tiles: Tile[][];
    resources: ResourceNode[];
  } {
    return {
      width: this.width,
      height: this.height,
      tiles: this.terrain,
      resources: this.resourceNodes
    };
  }
}

