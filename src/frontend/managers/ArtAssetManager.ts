/**
 * Art Asset Manager
 * Manages AI-generated art assets and integrates with AssetManager
 */

import Phaser from 'phaser';
import { artGenerationService, type TextureGenerationRequest, type ArtGenerationResponse } from '@/lib/api/artGeneration';
import { AssetManager } from './AssetManager';

export interface GeneratedAsset {
  id: string;
  url: string;
  type: 'texture' | 'concept' | 'sprite' | 'background';
  gameEntity?: string;
  entityId?: string;
  metadata: {
    prompt: string;
    model: string;
    generatedAt: number;
    theme?: string;
  };
}

export interface ArtAssetCache {
  [key: string]: GeneratedAsset;
}

/**
 * Manages AI-generated art assets
 * Integrates with existing AssetManager for seamless asset loading
 */
export class ArtAssetManager {
  private scene: Phaser.Scene;
  private assetManager: AssetManager;
  private generatedAssets: Map<string, GeneratedAsset> = new Map();
  private loadingPromises: Map<string, Promise<GeneratedAsset>> = new Map();

  constructor(scene: Phaser.Scene, assetManager: AssetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
  }

  /**
   * Generate and load texture for game entity
   */
  async generateAndLoadTexture(
    request: TextureGenerationRequest
  ): Promise<Phaser.Textures.Texture> {
    const cacheKey = this.getCacheKey(request);
    
    // Check if already generated
    if (this.generatedAssets.has(cacheKey)) {
      const asset = this.generatedAssets.get(cacheKey)!;
      return this.loadTextureFromUrl(asset.url, cacheKey);
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      const asset = await this.loadingPromises.get(cacheKey)!;
      return this.loadTextureFromUrl(asset.url, cacheKey);
    }

    // Generate new asset
    const loadingPromise = this.generateAsset(request);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const asset = await loadingPromise;
      this.generatedAssets.set(cacheKey, asset);
      this.loadingPromises.delete(cacheKey);
      return this.loadTextureFromUrl(asset.url, cacheKey);
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Generate asset and return metadata
   */
  async generateAsset(request: TextureGenerationRequest): Promise<GeneratedAsset> {
    const response = await artGenerationService.generateArt(request);
    
    return {
      id: response.imageId,
      url: response.imageUrl,
      type: request.type || 'texture',
      gameEntity: request.gameEntity,
      entityId: request.entityId,
      metadata: {
        prompt: response.prompt,
        model: response.model,
        generatedAt: Date.now(),
        theme: request.theme,
      },
    };
  }

  /**
   * Load texture from URL into Phaser
   */
  private loadTextureFromUrl(url: string, key: string): Promise<Phaser.Textures.Texture> {
    return new Promise((resolve, reject) => {
      // Check if texture already exists
      if (this.scene.textures.exists(key)) {
        resolve(this.scene.textures.get(key));
        return;
      }

      // Load image
      const image = new Image();
      image.crossOrigin = 'anonymous';
      
      image.onload = () => {
        // Create texture from image
        this.scene.textures.addCanvas(key, image);
        resolve(this.scene.textures.get(key));
      };

      image.onerror = () => {
        reject(new Error(`Failed to load image from ${url}`));
      };

      image.src = url;
    });
  }

  /**
   * Generate commander concept art
   */
  async generateCommanderArt(
    archetype: string,
    theme?: 'matter' | 'energy' | 'life' | 'knowledge'
  ): Promise<GeneratedAsset> {
    return this.generateAsset({
      prompt: `AI commander archetype: ${archetype}, strategic game character`,
      type: 'concept',
      gameEntity: 'commander',
      theme: theme || 'knowledge',
      aspectRatio: '16:9',
      quality: 'ultra',
    });
  }

  /**
   * Generate monster texture
   */
  async generateMonsterTexture(
    monsterName: string,
    theme?: 'matter' | 'energy' | 'life' | 'knowledge'
  ): Promise<GeneratedAsset> {
    return this.generateAsset({
      prompt: `${monsterName} monster, game creature`,
      type: 'texture',
      gameEntity: 'monster',
      theme: theme || 'life',
      aspectRatio: '1:1',
      quality: 'high',
    });
  }

  /**
   * Generate country background
   */
  async generateCountryBackground(
    countryName: string,
    terrain: string
  ): Promise<GeneratedAsset> {
    return this.generateAsset({
      prompt: `${countryName} terrain, ${terrain}, game background`,
      type: 'background',
      gameEntity: 'country',
      aspectRatio: '16:9',
      quality: 'high',
    });
  }

  /**
   * Batch generate assets for game entities
   */
  async generateBatchAssets(
    requests: TextureGenerationRequest[]
  ): Promise<GeneratedAsset[]> {
    const batchResponse = await artGenerationService.generateBatch(requests);
    
    const assets: GeneratedAsset[] = batchResponse.results.map((result, index) => ({
      id: result.imageId,
      url: result.imageUrl,
      type: requests[index].type || 'texture',
      gameEntity: requests[index].gameEntity,
      entityId: requests[index].entityId,
      metadata: {
        prompt: result.prompt,
        model: result.model,
        generatedAt: Date.now(),
        theme: requests[index].theme,
      },
    }));

    // Cache all generated assets
    assets.forEach((asset, index) => {
      const cacheKey = this.getCacheKey(requests[index]);
      this.generatedAssets.set(cacheKey, asset);
    });

    return assets;
  }

  /**
   * Get generated asset by cache key
   */
  getGeneratedAsset(cacheKey: string): GeneratedAsset | undefined {
    return this.generatedAssets.get(cacheKey);
  }

  /**
   * Get all generated assets
   */
  getAllGeneratedAssets(): GeneratedAsset[] {
    return Array.from(this.generatedAssets.values());
  }

  /**
   * Clear generated assets cache
   */
  clearCache(): void {
    this.generatedAssets.clear();
    this.loadingPromises.clear();
    artGenerationService.clearCache();
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(request: TextureGenerationRequest): string {
    return `${request.type || 'texture'}_${request.gameEntity || 'unknown'}_${request.entityId || 'default'}_${request.theme || 'none'}_${request.prompt.substring(0, 50)}`;
  }

  /**
   * Preload generated assets for game entities
   */
  async preloadAssetsForEntities(entities: Array<{
    type: 'commander' | 'monster' | 'country';
    id: string;
    name: string;
    theme?: 'matter' | 'energy' | 'life' | 'knowledge';
  }>): Promise<void> {
    const requests: TextureGenerationRequest[] = entities.map(entity => {
      const baseRequest: TextureGenerationRequest = {
        prompt: `${entity.name} ${entity.type}`,
        type: entity.type === 'commander' ? 'concept' : entity.type === 'country' ? 'background' : 'texture',
        gameEntity: entity.type,
        entityId: entity.id,
        theme: entity.theme,
        quality: 'high',
      };

      return baseRequest;
    });

    await this.generateBatchAssets(requests);
  }
}

