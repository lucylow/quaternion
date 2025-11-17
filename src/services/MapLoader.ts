/**
 * Map Loader Service
 * Loads map images and metadata
 */

import mapsData from '../assets/maps/maps.json';
import { MapConfig } from '../types/map';

export class MapLoader {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private maps: MapConfig[];

  constructor() {
    this.maps = mapsData.maps;
  }

  /**
   * Get all available maps
   */
  getAvailableMaps(): MapConfig[] {
    return this.maps;
  }

  /**
   * Get map by ID
   */
  getMapById(mapId: string): MapConfig | undefined {
    return this.maps.find(map => map.id === mapId);
  }

  /**
   * Preload map image
   */
  async preloadImage(imagePath: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(imagePath)) {
      return this.imageCache.get(imagePath)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(imagePath, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
      img.src = imagePath;
    });
  }

  /**
   * Load map with image
   */
  async loadMap(mapId: string): Promise<{ config: MapConfig; image: HTMLImageElement }> {
    const config = this.getMapById(mapId);
    if (!config) {
      throw new Error(`Map not found: ${mapId}`);
    }

    const image = await this.preloadImage(config.imagePath);
    return { config, image };
  }

  /**
   * Preload multiple maps
   */
  async preloadMaps(mapIds: string[]): Promise<void> {
    const promises = mapIds.map(id => {
      const config = this.getMapById(id);
      return config ? this.preloadImage(config.imagePath) : Promise.resolve();
    });
    await Promise.all(promises);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.imageCache.clear();
  }

  /**
   * Get map image dimensions (assumes 1024x1024, can be overridden)
   */
  getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
    return this.preloadImage(imagePath).then(img => ({
      width: img.width || 1024,
      height: img.height || 1024
    }));
  }
}

// Singleton instance
export const mapLoader = new MapLoader();

