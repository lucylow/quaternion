/**
 * Simple Map Generator with Perlin Noise
 * Generates procedural terrain using Perlin noise
 */

export interface Tile {
  x: number;
  y: number;
  type: 'grass' | 'mountain' | 'water';
  walkable: boolean;
  resource: null | string;
}

export interface GeneratedMap {
  width: number;
  height: number;
  tiles: Tile[][];
  getResourceNodes: () => ResourceNode[];
  getPublicData: () => {
    width: number;
    height: number;
    tiles: Tile[][];
    resources: ResourceNode[];
  };
}

export interface ResourceNode {
  id: string;
  type: string;
  x: number;
  y: number;
  amount: number;
  maxAmount: number;
}

export class SimpleMapGenerator {
  private seed: number;
  private p: number[];

  constructor(seed: number = 0) {
    this.seed = seed;
    this.p = this.buildPermutation(seed);
  }

  private buildPermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    let n: number, q: number;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      n = seed % (i + 1);
      q = p[i];
      p[i] = p[n];
      p[n] = q;
    }

    return p.concat(p);
  }

  private perlin(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[xi] + yi];
    const ba = this.p[this.p[xi + 1] + yi];
    const ab = this.p[this.p[xi] + yi + 1];
    const bb = this.p[this.p[xi + 1] + yi + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return this.lerp(v, x1, x2);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 8 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  generate(width: number, height: number): GeneratedMap {
    const terrain: Tile[][] = [];

    for (let y = 0; y < height; y++) {
      terrain[y] = [];
      for (let x = 0; x < width; x++) {
        const value = this.perlin(x * 0.1, y * 0.1);
        terrain[y][x] = {
          x,
          y,
          type: value > 0.5 ? 'grass' : value > 0.2 ? 'mountain' : 'water',
          walkable: value > 0.2,
          resource: null
        };
      }
    }

    // Generate resource nodes
    const resourceNodes: ResourceNode[] = this.generateResources(width, height);

    return {
      width,
      height,
      tiles: terrain,
      getResourceNodes: () => resourceNodes,
      getPublicData: () => ({
        width,
        height,
        tiles: terrain,
        resources: resourceNodes
      })
    };
  }

  private generateResources(width: number, height: number): ResourceNode[] {
    const resourceTypes = ['matter', 'energy', 'life', 'knowledge'];
    const nodesPerType = 8;
    const resourceNodes: ResourceNode[] = [];

    resourceTypes.forEach(type => {
      for (let i = 0; i < nodesPerType; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);

        // Avoid spawn locations
        if ((x > 5 && x < 10 && y > 5 && y < 10) ||
            (x > width - 10 && x < width - 5 && y > height - 10 && y < height - 5)) {
          continue;
        }

        resourceNodes.push({
          id: `resource_${type}_${i}`,
          type,
          x: x * 32,
          y: y * 32,
          amount: 1000,
          maxAmount: 1000
        });
      }
    });

    return resourceNodes;
  }
}

