/**
 * Art Generation API Services
 * Integration with ImagineArt and Dreamina for generating game textures and concept images
 */

import { apiClient } from './client';
import type { ResponseWrapper } from './types';

// Types for art generation
export interface ArtGenerationRequest {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  quality?: 'standard' | 'high' | 'ultra';
  seed?: number;
  negativePrompt?: string;
  numImages?: number;
}

export interface ArtGenerationResponse {
  imageUrl: string;
  imageId: string;
  prompt: string;
  model: string;
  metadata?: {
    seed?: number;
    style?: string;
    generationTime?: number;
  };
}

export interface TextureGenerationRequest extends ArtGenerationRequest {
  type: 'texture' | 'concept' | 'sprite' | 'background';
  gameEntity?: string; // e.g., 'monster', 'commander', 'country', 'unit'
  entityId?: string;
  theme?: 'matter' | 'energy' | 'life' | 'knowledge';
}

export interface BatchArtGenerationRequest {
  requests: TextureGenerationRequest[];
  priority?: 'low' | 'normal' | 'high';
}

export interface BatchArtGenerationResponse {
  results: ArtGenerationResponse[];
  failed: Array<{ request: TextureGenerationRequest; error: string }>;
  totalTime: number;
}

/**
 * ImagineArt API Service
 * For generating hyper-realistic textures and concept art
 */
export class ImagineArtService {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_IMAGINEART_API_URL || '/api/art/imagineart';
    this.apiKey = import.meta.env.VITE_IMAGINEART_API_KEY;
  }

  /**
   * Generate image using ImagineArt 1.0 (hyper-realistic)
   */
  async generateImage(request: ArtGenerationRequest): Promise<ArtGenerationResponse> {
    const response = await apiClient.post<ArtGenerationResponse>(
      this.baseUrl,
      {
        ...request,
        model: 'imagineart-1.0',
      },
      {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      }
    );

    if (!response.ok) {
      throw new Error(`ImagineArt generation failed: ${response.data}`);
    }

    return response.data;
  }

  /**
   * Generate texture for game entity
   */
  async generateTexture(request: TextureGenerationRequest): Promise<ArtGenerationResponse> {
    const enhancedPrompt = this.buildTexturePrompt(request);
    
    return this.generateImage({
      ...request,
      prompt: enhancedPrompt,
      quality: request.quality || 'high',
      aspectRatio: request.aspectRatio || '1:1',
    });
  }

  /**
   * Build enhanced prompt for texture generation
   */
  private buildTexturePrompt(request: TextureGenerationRequest): string {
    const { prompt, type, gameEntity, theme } = request;
    
    let enhancedPrompt = prompt;
    
    // Add game-specific context
    if (gameEntity) {
      enhancedPrompt = `${gameEntity} texture, ${enhancedPrompt}`;
    }
    
    // Add theme-based styling
    if (theme) {
      const themeStyles = {
        matter: 'steel blue, mechanical, angular geometry, industrial',
        energy: 'fiery red-orange, dynamic, flowing, energetic',
        life: 'earthy green, organic, bioluminescent, natural',
        knowledge: 'neon blue-purple, circuitry, fractal, technological',
      };
      enhancedPrompt = `${enhancedPrompt}, ${themeStyles[theme]}`;
    }
    
    // Add type-specific modifiers
    const typeModifiers = {
      texture: 'seamless texture, tileable, high detail, game asset',
      concept: 'concept art, detailed, atmospheric, game concept',
      sprite: 'game sprite, clean edges, transparent background, pixel perfect',
      background: 'game background, parallax ready, atmospheric depth',
    };
    
    if (type && typeModifiers[type]) {
      enhancedPrompt = `${enhancedPrompt}, ${typeModifiers[type]}`;
    }
    
    return enhancedPrompt;
  }
}

/**
 * Dreamina API Service
 * For generating high-resolution images with exceptional detail
 */
export class DreaminaService {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_DREAMINA_API_URL || '/api/art/dreamina';
    this.apiKey = import.meta.env.VITE_DREAMINA_API_KEY;
  }

  /**
   * Generate image using Dreamina 3.1 (high-resolution, detailed)
   */
  async generateImage(request: ArtGenerationRequest): Promise<ArtGenerationResponse> {
    const response = await apiClient.post<ArtGenerationResponse>(
      this.baseUrl,
      {
        ...request,
        model: 'dreamina-3.1',
      },
      {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      }
    );

    if (!response.ok) {
      throw new Error(`Dreamina generation failed: ${response.data}`);
    }

    return response.data;
  }

  /**
   * Generate concept image for game entity
   */
  async generateConcept(request: TextureGenerationRequest): Promise<ArtGenerationResponse> {
    const enhancedPrompt = this.buildConceptPrompt(request);
    
    return this.generateImage({
      ...request,
      prompt: enhancedPrompt,
      quality: request.quality || 'ultra',
      aspectRatio: request.aspectRatio || '16:9',
    });
  }

  /**
   * Generate multiple styles from single prompt
   */
  async generateMultipleStyles(
    request: ArtGenerationRequest,
    styles: string[]
  ): Promise<ArtGenerationResponse[]> {
    const promises = styles.map(style =>
      this.generateImage({
        ...request,
        style,
      })
    );

    return Promise.all(promises);
  }

  /**
   * Build enhanced prompt for concept generation
   */
  private buildConceptPrompt(request: TextureGenerationRequest): string {
    const { prompt, type, gameEntity, theme } = request;
    
    let enhancedPrompt = prompt;
    
    // Add game-specific context
    if (gameEntity) {
      enhancedPrompt = `${gameEntity} concept art, ${enhancedPrompt}`;
    }
    
    // Add theme-based styling
    if (theme) {
      const themeStyles = {
        matter: 'steel blue palette, mechanical aesthetic, angular design',
        energy: 'fiery red-orange palette, dynamic movement, energetic atmosphere',
        life: 'earthy green palette, organic forms, natural beauty',
        knowledge: 'neon blue-purple palette, technological, futuristic',
      };
      enhancedPrompt = `${enhancedPrompt}, ${themeStyles[theme]}`;
    }
    
    // Add concept art modifiers
    enhancedPrompt = `${enhancedPrompt}, detailed concept art, high quality, game art style, professional illustration`;
    
    return enhancedPrompt;
  }
}

/**
 * Unified Art Generation Service
 * Manages both ImagineArt and Dreamina services
 */
export class ArtGenerationService {
  private imagineArt: ImagineArtService;
  private dreamina: DreaminaService;
  private cache: Map<string, ArtGenerationResponse> = new Map();

  constructor() {
    this.imagineArt = new ImagineArtService();
    this.dreamina = new DreaminaService();
  }

  /**
   * Generate texture using ImagineArt (best for textures)
   */
  async generateTexture(request: TextureGenerationRequest): Promise<ArtGenerationResponse> {
    const cacheKey = this.getCacheKey(request);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = await this.imagineArt.generateTexture(request);
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Generate concept image using Dreamina (best for concepts)
   */
  async generateConcept(request: TextureGenerationRequest): Promise<ArtGenerationResponse> {
    const cacheKey = this.getCacheKey(request);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = await this.dreamina.generateConcept(request);
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Generate art based on type (auto-selects best service)
   */
  async generateArt(request: TextureGenerationRequest): Promise<ArtGenerationResponse> {
    // Use ImagineArt for textures, Dreamina for concepts
    if (request.type === 'texture' || request.type === 'sprite') {
      return this.generateTexture(request);
    } else {
      return this.generateConcept(request);
    }
  }

  /**
   * Batch generate multiple art assets
   */
  async generateBatch(
    requests: TextureGenerationRequest[],
    options?: { parallel?: boolean; maxConcurrent?: number }
  ): Promise<BatchArtGenerationResponse> {
    const startTime = Date.now();
    const results: ArtGenerationResponse[] = [];
    const failed: Array<{ request: TextureGenerationRequest; error: string }> = [];
    
    const maxConcurrent = options?.maxConcurrent || 3;
    const parallel = options?.parallel !== false;

    if (parallel) {
      // Process in batches to avoid overwhelming the API
      for (let i = 0; i < requests.length; i += maxConcurrent) {
        const batch = requests.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (request) => {
          try {
            const result = await this.generateArt(request);
            results.push(result);
          } catch (error) {
            failed.push({
              request,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        });

        await Promise.all(batchPromises);
      }
    } else {
      // Sequential processing
      for (const request of requests) {
        try {
          const result = await this.generateArt(request);
          results.push(result);
        } catch (error) {
          failed.push({
            request,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return {
      results,
      failed,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * Generate commander concept art
   */
  async generateCommanderArt(
    archetype: string,
    theme?: 'matter' | 'energy' | 'life' | 'knowledge'
  ): Promise<ArtGenerationResponse> {
    return this.generateConcept({
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
  ): Promise<ArtGenerationResponse> {
    return this.generateTexture({
      prompt: `${monsterName} monster, game creature`,
      type: 'texture',
      gameEntity: 'monster',
      theme: theme || 'life',
      aspectRatio: '1:1',
      quality: 'high',
    });
  }

  /**
   * Generate country/terrain background
   */
  async generateCountryBackground(
    countryName: string,
    terrain: string
  ): Promise<ArtGenerationResponse> {
    return this.generateConcept({
      prompt: `${countryName} terrain, ${terrain}, game background`,
      type: 'background',
      gameEntity: 'country',
      aspectRatio: '16:9',
      quality: 'high',
    });
  }

  /**
   * Clear generation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(request: TextureGenerationRequest): string {
    return JSON.stringify({
      prompt: request.prompt,
      type: request.type,
      gameEntity: request.gameEntity,
      theme: request.theme,
      aspectRatio: request.aspectRatio,
    });
  }
}

// Export singleton instance
export const artGenerationService = new ArtGenerationService();

// Export individual services
export { ImagineArtService, DreaminaService };

