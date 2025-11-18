/**
 * AI-Enhanced Procedural Generation System
 * Integrates LLM for semantic map descriptions and Luma AI for terrain generation
 */

import { LLMIntegration, MapTheme } from '../integrations/LLMIntegration';
import { EnhancedProceduralGenerator, GeneratedMap } from '../../map/EnhancedProceduralGenerator';

export interface ProceduralMapConfig {
  seed: number;
  width: number;
  height: number;
  mapType: string;
  useAI: boolean;
  llmConfig?: {
    provider: 'google' | 'saga' | 'openai';
    apiKey?: string;
  };
}

export interface ProceduralMapResult {
  map: GeneratedMap;
  theme: MapTheme;
  metadata: {
    strategicPersonality: string;
    tacticalBottlenecks: string[];
    resourceClusters: string[];
    generatedAt: number;
    aiGenerated: boolean;
  };
}

export class ProceduralGenerationSystem {
  private llm: LLMIntegration | null = null;
  private cache: Map<string, ProceduralMapResult> = new Map();

  constructor(llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.7,
        maxTokens: 500
      });
    }
  }

  /**
   * Generate a complete procedural map with AI enhancement
   */
  async generateMap(config: ProceduralMapConfig): Promise<ProceduralMapResult> {
    const cacheKey = `map_${config.seed}_${config.width}_${config.height}_${config.mapType}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Generate base map using existing generator
    const generator = new EnhancedProceduralGenerator({
      seed: config.seed,
      width: config.width,
      height: config.height,
      personality: 'aggressive',
      biome: this.mapTypeToBiome(config.mapType)
    });

    const map = generator.generate();

    // Generate AI theme if enabled
    let theme: MapTheme;
    if (config.useAI && this.llm) {
      try {
        theme = await this.llm.generateMapTheme(
          config.mapType,
          config.seed,
          config.width,
          config.height
        );
      } catch (error) {
        console.warn('AI theme generation failed, using fallback', error);
        theme = this.getFallbackTheme(config.mapType);
      }
    } else {
      theme = this.getFallbackTheme(config.mapType);
    }

    // Enhance map with AI-generated strategic features
    if (config.useAI && theme) {
      this.applyAIThemeToMap(map, theme);
    }

    const result: ProceduralMapResult = {
      map,
      theme,
      metadata: {
        strategicPersonality: theme.strategicPersonality,
        tacticalBottlenecks: theme.tacticalBottlenecks,
        resourceClusters: theme.resourceClusters,
        generatedAt: Date.now(),
        aiGenerated: config.useAI && this.llm !== null
      }
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Apply AI-generated theme to map structure
   */
  private applyAIThemeToMap(map: GeneratedMap, theme: MapTheme): void {
    // Adjust strategic points based on AI description
    if (theme.tacticalBottlenecks.length > 0) {
      // Ensure chokepoints exist where AI suggests
      // This is a simplified implementation - in production, you'd
      // use the theme to guide terrain generation
      map.strategicPoints = map.strategicPoints || [];
    }

    // Adjust resource distribution based on AI clusters
    if (theme.resourceClusters.length > 0) {
      // Cluster resources according to AI description
      this.clusterResources(map, theme.resourceClusters);
    }

    // Apply terrain features from AI description
    if (theme.terrainFeatures.length > 0) {
      this.applyTerrainFeatures(map, theme.terrainFeatures);
    }
  }

  /**
   * Cluster resources based on AI description
   */
  private clusterResources(map: GeneratedMap, clusters: string[]): void {
    // Simplified: redistribute resources to match cluster descriptions
    // In production, this would use more sophisticated placement algorithms
    const nodes = map.nodes || [];
    if (nodes.length === 0) return;

    // Group nodes into clusters
    const clusterCount = Math.min(clusters.length, 3);
    const nodesPerCluster = Math.floor(nodes.length / clusterCount);

    for (let i = 0; i < clusterCount; i++) {
      const startIdx = i * nodesPerCluster;
      const endIdx = i === clusterCount - 1 ? nodes.length : (i + 1) * nodesPerCluster;
      
      // Adjust positions to form clusters
      const clusterCenter = {
        x: map.width * (0.2 + i * 0.3),
        y: map.height * (0.3 + Math.random() * 0.4)
      };

      for (let j = startIdx; j < endIdx; j++) {
        const node = nodes[j];
        // Move node closer to cluster center
        node.x = clusterCenter.x + (node.x - clusterCenter.x) * 0.5;
        node.y = clusterCenter.y + (node.y - clusterCenter.y) * 0.5;
      }
    }
  }

  /**
   * Apply terrain features from AI description
   */
  private applyTerrainFeatures(map: GeneratedMap, features: string[]): void {
    // Add terrain features based on AI description
    // This would integrate with Luma AI for actual 3D terrain generation
    // For now, we mark features for later processing
    map.terrainFeatures = map.terrainFeatures || [];
    
    features.forEach(feature => {
      // Parse feature and add to terrain
      if (feature.toLowerCase().includes('elevation') || feature.toLowerCase().includes('high ground')) {
        // Add elevation points
        map.terrainFeatures.push({
          x: map.width * 0.5,
          y: map.height * 0.5,
          type: 'mountain',
          elevation: 80,
          passability: 0.5,
          strategicValue: 85
        });
      }
    });
  }

  /**
   * Map type to biome
   */
  private mapTypeToBiome(mapType: string): 'volcanic' | 'crystalline' | 'organic' | 'mechanical' | 'quantum' | 'void' {
    const typeMap: Record<string, 'volcanic' | 'crystalline' | 'organic' | 'mechanical' | 'quantum' | 'void'> = {
      'crystalline_plains': 'crystalline',
      'jagged_island': 'volcanic',
      'quantum_nexus': 'quantum',
      'void_expanse': 'void',
      'organic_growth': 'organic',
      'mechanical_fortress': 'mechanical'
    };
    return typeMap[mapType] || 'crystalline';
  }

  /**
   * Get fallback theme when AI is unavailable
   */
  private getFallbackTheme(mapType: string): MapTheme {
    return {
      description: `${mapType} battlefield with strategic terrain features`,
      strategicPersonality: 'balanced',
      tacticalBottlenecks: ['Central passage', 'Narrow ridge'],
      resourceClusters: ['Northern deposits', 'Southern veins'],
      terrainFeatures: ['Elevated positions', 'Defensible chokepoints']
    };
  }

  /**
   * Validate generated map for playability
   */
  validateMap(map: GeneratedMap): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for valid start positions
    if (!map.playerStart || !map.aiStart) {
      issues.push('Missing start positions');
    }

    // Check for resource nodes
    if (!map.nodes || map.nodes.length < 4) {
      issues.push('Insufficient resource nodes');
    }

    // Check for path connectivity
    if (map.nodes && map.nodes.length > 0) {
      const isolated = this.findIsolatedNodes(map);
      if (isolated.length > 0) {
        issues.push(`Found ${isolated.length} isolated resource nodes`);
      }
    }

    // Check for balanced resource distribution
    if (map.nodes && map.nodes.length > 0) {
      const balance = this.checkResourceBalance(map);
      if (!balance) {
        issues.push('Unbalanced resource distribution');
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Find isolated nodes (unreachable)
   */
  private findIsolatedNodes(map: GeneratedMap): any[] {
    // Simplified: check if nodes are too far from start positions
    const isolated: any[] = [];
    const maxDistance = Math.sqrt(map.width ** 2 + map.height ** 2) * 0.8;

    map.nodes?.forEach(node => {
      const distToPlayer = Math.sqrt(
        (node.x - map.playerStart!.x) ** 2 + (node.y - map.playerStart!.y) ** 2
      );
      const distToAI = Math.sqrt(
        (node.x - map.aiStart!.x) ** 2 + (node.y - map.aiStart!.y) ** 2
      );

      if (distToPlayer > maxDistance && distToAI > maxDistance) {
        isolated.push(node);
      }
    });

    return isolated;
  }

  /**
   * Check resource balance
   */
  private checkResourceBalance(map: GeneratedMap): boolean {
    if (!map.nodes || map.nodes.length === 0) return false;

    // Split map into quadrants and check resource distribution
    const quadrants = [
      { x: [0, map.width / 2], y: [0, map.height / 2] },
      { x: [map.width / 2, map.width], y: [0, map.height / 2] },
      { x: [0, map.width / 2], y: [map.height / 2, map.height] },
      { x: [map.width / 2, map.width], y: [map.height / 2, map.height] }
    ];

    const counts = quadrants.map(quad => {
      return map.nodes!.filter(node =>
        node.x >= quad.x[0] && node.x < quad.x[1] &&
        node.y >= quad.y[0] && node.y < quad.y[1]
      ).length;
    });

    // Check if any quadrant has significantly fewer resources
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    return max - min <= 2; // Allow small variance
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}


