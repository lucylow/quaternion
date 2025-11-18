/**
 * Procedural Flora Placement System
 * Generates procedural flora using Poisson disk sampling
 */

import Phaser from 'phaser';
import type { Scene } from 'phaser';
import { QuaternionArtPalette } from './ArtPalette';

export interface FloraConfig {
  type: 'matter' | 'energy' | 'life' | 'knowledge';
  density: number; // 0-1
  minDistance: number; // pixels
  scaleRange: [number, number]; // [min, max]
  rotationRange?: [number, number]; // [min, max] in degrees
}

export interface FloraInstance {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  type: string;
  sprite?: Phaser.GameObjects.Sprite;
}

export class ProceduralFloraPlacer {
  private scene: Scene;
  private placedFlora: FloraInstance[] = [];
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(3);
  }

  /**
   * Place flora using Poisson disk sampling
   */
  placeFlora(
    x: number,
    y: number,
    width: number,
    height: number,
    config: FloraConfig,
    seed: number = 12345
  ): FloraInstance[] {
    const rng = new Phaser.Math.RandomDataGenerator([seed.toString()]);
    const palette = QuaternionArtPalette.getPalette(config.type);
    const color = QuaternionArtPalette.toPhaserColor(palette.base);

    const instances: FloraInstance[] = [];
    const activeList: FloraInstance[] = [];
    const grid: Map<string, FloraInstance[]> = new Map();
    const cellSize = config.minDistance / Math.sqrt(2);
    const gridCols = Math.ceil(width / cellSize);
    const gridRows = Math.ceil(height / cellSize);

    // Helper to get grid cell key
    const getGridKey = (fx: number, fy: number): string => {
      const col = Math.floor((fx - x) / cellSize);
      const row = Math.floor((fy - y) / cellSize);
      return `${col},${row}`;
    };

    // Helper to check if position is valid
    const isValid = (fx: number, fy: number): boolean => {
      // Check bounds
      if (fx < x || fx >= x + width || fy < y || fy >= y + height) {
        return false;
      }

      // Check nearby cells
      const key = getGridKey(fx, fy);
      const neighbors = [
        grid.get(`${key.split(',')[0] - 1},${key.split(',')[1] - 1}`),
        grid.get(`${key.split(',')[0]},${key.split(',')[1] - 1}`),
        grid.get(`${key.split(',')[0] + 1},${key.split(',')[1] - 1}`),
        grid.get(`${key.split(',')[0] - 1},${key.split(',')[1]}`),
        grid.get(key),
        grid.get(`${key.split(',')[0] + 1},${key.split(',')[1]}`),
        grid.get(`${key.split(',')[0] - 1},${key.split(',')[1] + 1}`),
        grid.get(`${key.split(',')[0]},${key.split(',')[1] + 1}`),
        grid.get(`${key.split(',')[0] + 1},${key.split(',')[1] + 1}`)
      ].filter(Boolean).flat();

      for (const neighbor of neighbors) {
        const dx = fx - neighbor.x;
        const dy = fy - neighbor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.minDistance) {
          return false;
        }
      }

      return true;
    };

    // Generate initial point
    if (rng.frac() < config.density) {
      const initial: FloraInstance = {
        x: x + rng.frac() * width,
        y: y + rng.frac() * height,
        scale: rng.realInRange(...config.scaleRange),
        rotation: config.rotationRange
          ? rng.realInRange(...config.rotationRange)
          : rng.frac() * 360,
        type: config.type
      };

      instances.push(initial);
      activeList.push(initial);

      const key = getGridKey(initial.x, initial.y);
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(initial);
    }

    // Poisson disk sampling
    const k = 30; // Number of attempts per active point
    while (activeList.length > 0 && instances.length < 1000) {
      const index = Math.floor(rng.frac() * activeList.length);
      const point = activeList[index];
      let found = false;

      for (let i = 0; i < k; i++) {
        const angle = rng.frac() * Math.PI * 2;
        const distance = rng.realInRange(
          config.minDistance,
          config.minDistance * 2
        );
        const newX = point.x + Math.cos(angle) * distance;
        const newY = point.y + Math.sin(angle) * distance;

        if (isValid(newX, newY)) {
          const newInstance: FloraInstance = {
            x: newX,
            y: newY,
            scale: rng.realInRange(...config.scaleRange),
            rotation: config.rotationRange
              ? rng.realInRange(...config.rotationRange)
              : rng.frac() * 360,
            type: config.type
          };

          instances.push(newInstance);
          activeList.push(newInstance);

          const key = getGridKey(newX, newY);
          if (!grid.has(key)) {
            grid.set(key, []);
          }
          grid.get(key)!.push(newInstance);

          found = true;
          break;
        }
      }

      if (!found) {
        activeList.splice(index, 1);
      }

      // Density check
      if (rng.frac() > config.density) {
        break;
      }
    }

    // Draw flora (simple shapes for now, can be replaced with sprites)
    this.drawFlora(instances, palette);

    this.placedFlora.push(...instances);
    return instances;
  }

  /**
   * Draw flora as simple shapes (can be replaced with sprites)
   */
  private drawFlora(
    instances: FloraInstance[],
    palette: ReturnType<typeof QuaternionArtPalette.getPalette>
  ): void {
    this.graphics.clear();

    const baseColor = QuaternionArtPalette.toPhaserColor(palette.base);
    const accentColor = QuaternionArtPalette.toPhaserColor(palette.accent);

    for (const flora of instances) {
      const size = 8 * flora.scale;

      // Draw base shape
      this.graphics.fillStyle(baseColor, 0.8);
      this.graphics.fillCircle(flora.x, flora.y, size);

      // Draw accent
      this.graphics.fillStyle(accentColor, 0.6);
      this.graphics.fillCircle(flora.x, flora.y, size * 0.6);

      // Draw glow
      this.graphics.fillStyle(accentColor, 0.3);
      this.graphics.fillCircle(flora.x, flora.y, size * 1.5);
    }
  }

  /**
   * Place flora based on biome type
   */
  placeByBiome(
    x: number,
    y: number,
    width: number,
    height: number,
    biome: 'desert' | 'forest' | 'plains' | 'tech',
    seed: number = 12345
  ): FloraInstance[] {
    let config: FloraConfig;

    switch (biome) {
      case 'desert':
        config = {
          type: 'energy',
          density: 0.02,
          minDistance: 40,
          scaleRange: [0.5, 1.2],
          rotationRange: [0, 360]
        };
        break;
      case 'forest':
        config = {
          type: 'life',
          density: 0.15,
          minDistance: 25,
          scaleRange: [0.8, 1.5],
          rotationRange: [0, 360]
        };
        break;
      case 'plains':
        config = {
          type: 'life',
          density: 0.08,
          minDistance: 30,
          scaleRange: [0.6, 1.3],
          rotationRange: [0, 360]
        };
        break;
      case 'tech':
        config = {
          type: 'knowledge',
          density: 0.05,
          minDistance: 35,
          scaleRange: [0.7, 1.4],
          rotationRange: [0, 360]
        };
        break;
    }

    return this.placeFlora(x, y, width, height, config, seed);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.graphics.destroy();
    this.placedFlora = [];
  }
}

