/**
 * AI-Driven World Generator
 * Procedural terrain synthesis with AI prompt-based biome blending
 * Based on Dreamina, ImagineArt, and Luma AI integration concepts
 */

import { LLMIntegration } from '../integrations/LLMIntegration';

export interface BiomeProfile {
  biomeName: string;
  baseColor: string;
  resourceRichness: number; // 0-1
  hazardLevel: number; // 0-1
  oreDensity: number; // 0-1
  biomassDensity: number; // 0-1
  dataDensity: number; // 0-1
  energyDensity: number; // 0-1
}

export interface WorldPrompt {
  descriptor: string; // e.g., "arid wasteland", "overgrown ruin", "fractured ice plain"
  seed: number;
  width: number;
  height: number;
}

export interface GeneratedWorld {
  width: number;
  height: number;
  seed: number;
  prompt: string;
  biomes: BiomeProfile[];
  terrainMap: number[][]; // 2D array of biome indices
  resourceMap: {
    ore: number[][];
    energy: number[][];
    biomass: number[][];
    data: number[][];
  };
  colorPalette: string[];
  metadata: {
    generatedAt: number;
    aiGenerated: boolean;
    strategicPersonality: string;
  };
}

export class AIWorldGenerator {
  private llm: LLMIntegration | null = null;
  private biomeCache: Map<string, BiomeProfile> = new Map();

  constructor(llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.8,
        maxTokens: 500
      });
    }
  }

  /**
   * Generate world from AI prompt
   */
  async generateWorld(prompt: WorldPrompt): Promise<GeneratedWorld> {
    console.log(`🌍 AIWorldGenerator: Creating world for prompt '${prompt.descriptor}'`);

    // Generate or retrieve biome profiles
    const biomes = await this.generateBiomesFromPrompt(prompt.descriptor);

    // Generate terrain map using noise
    const terrainMap = this.generateTerrainMap(prompt, biomes);

    // Generate resource maps based on biome properties
    const resourceMap = this.generateResourceMaps(terrainMap, biomes, prompt);

    // Extract color palette from biomes
    const colorPalette = biomes.map(b => b.baseColor);

    // Generate strategic personality
    const strategicPersonality = await this.generateStrategicPersonality(prompt.descriptor);

    return {
      width: prompt.width,
      height: prompt.height,
      seed: prompt.seed,
      prompt: prompt.descriptor,
      biomes,
      terrainMap,
      resourceMap,
      colorPalette,
      metadata: {
        generatedAt: Date.now(),
        aiGenerated: this.llm !== null,
        strategicPersonality
      }
    };
  }

  /**
   * Generate biome profiles from AI prompt
   */
  private async generateBiomesFromPrompt(descriptor: string): Promise<BiomeProfile[]> {
    const cacheKey = `biome_${descriptor}`;
    if (this.biomeCache.has(cacheKey)) {
      return [this.biomeCache.get(cacheKey)!];
    }

    if (this.llm) {
      try {
        const prompt = `Analyze this terrain descriptor for a sci-fi RTS game: "${descriptor}"

Generate biome properties as JSON:
{
  "biomeName": "descriptive name",
  "baseColor": "#hex color",
  "resourceRichness": 0.0-1.0,
  "hazardLevel": 0.0-1.0,
  "oreDensity": 0.0-1.0,
  "biomassDensity": 0.0-1.0,
  "dataDensity": 0.0-1.0,
  "energyDensity": 0.0-1.0
}

Consider:
- Rocky/volcanic terrain = high ore, low biomass
- Overgrown/ruins = high biomass, medium data
- Ice/arid = low resources, high hazards
- Tech ruins = high data, medium energy`;

        const response = await this.llm.generateText(prompt);
        const biome = this.parseBiomeJSON(response);
        
        if (biome) {
          this.biomeCache.set(cacheKey, biome);
          return [biome];
        }
      } catch (error) {
        console.warn('AI biome generation failed, using fallback', error);
      }
    }

    // Fallback biome
    return [this.getFallbackBiome(descriptor)];
  }

  /**
   * Parse biome JSON from LLM response
   */
  private parseBiomeJSON(response: string): BiomeProfile | null {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          biomeName: parsed.biomeName || 'Unknown',
          baseColor: parsed.baseColor || '#808080',
          resourceRichness: Math.max(0, Math.min(1, parsed.resourceRichness || 0.5)),
          hazardLevel: Math.max(0, Math.min(1, parsed.hazardLevel || 0.3)),
          oreDensity: Math.max(0, Math.min(1, parsed.oreDensity || 0.5)),
          biomassDensity: Math.max(0, Math.min(1, parsed.biomassDensity || 0.5)),
          dataDensity: Math.max(0, Math.min(1, parsed.dataDensity || 0.5)),
          energyDensity: Math.max(0, Math.min(1, parsed.energyDensity || 0.5))
        };
      }
    } catch (error) {
      console.warn('Failed to parse biome JSON', error);
    }
    return null;
  }

  /**
   * Get fallback biome based on descriptor keywords
   */
  private getFallbackBiome(descriptor: string): BiomeProfile {
    const desc = descriptor.toLowerCase();
    
    if (desc.includes('arid') || desc.includes('desert') || desc.includes('wasteland')) {
      return {
        biomeName: 'Arid Wasteland',
        baseColor: '#d4a574',
        resourceRichness: 0.3,
        hazardLevel: 0.7,
        oreDensity: 0.4,
        biomassDensity: 0.1,
        dataDensity: 0.2,
        energyDensity: 0.6
      };
    } else if (desc.includes('ice') || desc.includes('frozen') || desc.includes('tundra')) {
      return {
        biomeName: 'Frozen Expanse',
        baseColor: '#b8d4e3',
        resourceRichness: 0.4,
        hazardLevel: 0.6,
        oreDensity: 0.3,
        biomassDensity: 0.2,
        dataDensity: 0.5,
        energyDensity: 0.3
      };
    } else if (desc.includes('overgrown') || desc.includes('ruin') || desc.includes('jungle')) {
      return {
        biomeName: 'Overgrown Ruins',
        baseColor: '#4a7c59',
        resourceRichness: 0.7,
        hazardLevel: 0.4,
        oreDensity: 0.3,
        biomassDensity: 0.8,
        dataDensity: 0.6,
        energyDensity: 0.4
      };
    } else if (desc.includes('volcanic') || desc.includes('lava') || desc.includes('fire')) {
      return {
        biomeName: 'Volcanic Terrain',
        baseColor: '#8b3a3a',
        resourceRichness: 0.6,
        hazardLevel: 0.9,
        oreDensity: 0.8,
        biomassDensity: 0.1,
        dataDensity: 0.3,
        energyDensity: 0.7
      };
    }

    // Default
    return {
      biomeName: 'Unknown Terrain',
      baseColor: '#808080',
      resourceRichness: 0.5,
      hazardLevel: 0.5,
      oreDensity: 0.5,
      biomassDensity: 0.5,
      dataDensity: 0.5,
      energyDensity: 0.5
    };
  }

  /**
   * Generate terrain map using Perlin noise
   */
  private generateTerrainMap(
    prompt: WorldPrompt,
    biomes: BiomeProfile[]
  ): number[][] {
    const map: number[][] = [];
    const biome = biomes[0]; // Use primary biome

    // Simple Perlin-like noise
    for (let y = 0; y < prompt.height; y++) {
      map[y] = [];
      for (let x = 0; x < prompt.width; x++) {
        // Use seed-based noise
        const noise = this.noise(x * 0.1, y * 0.1, prompt.seed);
        // Map noise to biome index (0 for primary biome)
        map[y][x] = 0;
      }
    }

    return map;
  }

  /**
   * Generate resource maps based on biome properties
   */
  private generateResourceMaps(
    terrainMap: number[][],
    biomes: BiomeProfile[],
    prompt: WorldPrompt
  ): GeneratedWorld['resourceMap'] {
    const biome = biomes[0];
    const maps = {
      ore: [] as number[][],
      energy: [] as number[][],
      biomass: [] as number[][],
      data: [] as number[][]
    };

    for (let y = 0; y < prompt.height; y++) {
      maps.ore[y] = [];
      maps.energy[y] = [];
      maps.biomass[y] = [];
      maps.data[y] = [];

      for (let x = 0; x < prompt.width; x++) {
        // Base density from biome
        const noise = this.noise(x * 0.05, y * 0.05, prompt.seed + 1);
        
        maps.ore[y][x] = biome.oreDensity * (0.5 + noise * 0.5);
        maps.energy[y][x] = biome.energyDensity * (0.5 + noise * 0.5);
        maps.biomass[y][x] = biome.biomassDensity * (0.5 + noise * 0.5);
        maps.data[y][x] = biome.dataDensity * (0.5 + noise * 0.5);
      }
    }

    return maps;
  }

  /**
   * Generate strategic personality from prompt
   */
  private async generateStrategicPersonality(descriptor: string): Promise<string> {
    if (this.llm) {
      try {
        const prompt = `Based on this terrain: "${descriptor}", what strategic personality does it suggest?
Options: aggressive, defensive, economic, puzzle, balanced
Respond with just one word.`;

        const response = await this.llm.generateText(prompt);
        const personality = response.trim().toLowerCase();
        if (['aggressive', 'defensive', 'economic', 'puzzle', 'balanced'].includes(personality)) {
          return personality;
        }
      } catch (error) {
        console.warn('Strategic personality generation failed', error);
      }
    }

    // Fallback
    return 'balanced';
  }

  /**
   * Simple noise function (Perlin-like)
   */
  private noise(x: number, y: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // -1 to 1
  }
}


