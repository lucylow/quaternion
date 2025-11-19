/**
 * Map Loader Service
 * Loads map images and metadata
 */

import mapsData from '../assets/maps/maps.json';
import { MapConfig } from '../types/map';
import { assetUrl } from '../utils/assetUrl';

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
   * Encode image path to handle special characters
   * Uses shared utility function for consistency
   */
  private encodeImagePath(path: string): string {
    return encodePath(path);
  }

  /**
   * Preload map image with retry logic
   */
  async preloadImage(imagePath: string, retries: number = 3): Promise<HTMLImageElement> {
    if (this.imageCache.has(imagePath)) {
      return this.imageCache.get(imagePath)!;
    }

    // Try both encoded and original paths, with and without CORS
    const encodedPath = this.encodeImagePath(imagePath);
    const pathsToTry = [
      { path: encodedPath, cors: false },
      { path: imagePath, cors: false },
      { path: encodedPath, cors: true },  // Try with CORS as fallback
      { path: imagePath, cors: true }
    ];

    for (let attempt = 0; attempt < retries; attempt++) {
      for (const { path, cors } of pathsToTry) {
        try {
          const img = await this.loadImageWithPath(path, cors);
          this.imageCache.set(imagePath, img);
          return img;
        } catch (error) {
          const corsLabel = cors ? 'with CORS' : 'without CORS';
          console.warn(`[MapLoader] Attempt ${attempt + 1}/${retries} failed for path: ${path} (${corsLabel})`, error);
          if (attempt === retries - 1 && path === pathsToTry[pathsToTry.length - 1].path && cors === pathsToTry[pathsToTry.length - 1].cors) {
            // Last attempt with last path - throw error
            throw new Error(`Failed to load image after ${retries} attempts: ${imagePath}`);
          }
        }
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
      }
    }

    throw new Error(`Failed to load image: ${imagePath}`);
  }

  /**
   * Load image with a specific path
   */
  private loadImageWithPath(path: string, useCors: boolean = false): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Only set crossOrigin if loading from external source (e.g., GitHub)
      // For local assets, this can cause CORS issues if server doesn't send CORS headers
      if (useCors || path.startsWith('http://') || path.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      
      const timeout = setTimeout(() => {
        reject(new Error(`Image load timeout: ${path}`));
      }, 10000); // 10 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${path}`));
      };
      
      img.src = path;
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


