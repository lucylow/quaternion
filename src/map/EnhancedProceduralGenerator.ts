import { SeededRandom } from '../lib/SeededRandom';

/**
 * Enhanced Procedural Map Generator with AI-powered strategic features
 * Implements: Terrain Personality, Strategic Chokepoints, Elevation, Resource Veins, Quantum Fractures
 */

export type TerrainPersonality = 'aggressive' | 'defensive' | 'economic' | 'puzzle';
export type BiomeType = 'volcanic' | 'crystalline' | 'organic' | 'mechanical' | 'quantum' | 'void';

export interface StrategicPoint {
  x: number;
  y: number;
  type: 'chokepoint' | 'elevation' | 'quantum_fracture' | 'resource_vein';
  strength: number; // 0-100
  radius: number;
  metadata?: any;
}

export interface TerrainFeature {
  x: number;
  y: number;
  type: 'mountain' | 'valley' | 'plateau' | 'canyon' | 'fracture';
  elevation: number; // -100 to 100
  passability: number; // 0-1, affects unit movement speed
  strategicValue: number; // 0-100
}

export interface MapNode {
  x: number;
  y: number;
  type: 'matter' | 'energy' | 'life' | 'knowledge' | 'empty' | 'central';
  richness: number; // 0-100
  elevation?: number;
  strategicValue?: number;
}

export interface EnhancedMapConfig {
  width: number;
  height: number;
  seed: number;
  personality?: TerrainPersonality;
  biome?: BiomeType;
  strategicChokepoints?: number; // 2-5
  resourceDensity?: number; // 0.3-0.8
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GeneratedMap {
  width: number;
  height: number;
  nodes: MapNode[];
  strategicPoints: StrategicPoint[];
  terrainFeatures: TerrainFeature[];
  playerStart: { x: number; y: number };
  aiStart: { x: number; y: number };
  centralNode: MapNode | null;
  seed: number;
  personality: TerrainPersonality;
  biome: BiomeType;
  strategicDNA: {
    openness: number; // 0-1, affects rush strategies
    defensiveness: number; // 0-1, natural choke points
    economicValue: number; // 0-1, resource richness
    complexity: number; // 0-1, puzzle-like elements
  };
}

export class EnhancedProceduralGenerator {
  private rng: SeededRandom;
  private config: EnhancedMapConfig;

  constructor(config: EnhancedMapConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);
  }

  /**
   * Generate complete enhanced map with strategic features
   */
  public generate(): GeneratedMap {
    // Determine personality if not specified
    const personality = this.config.personality || this.determinePersonality();
    const biome = this.config.biome || this.determineBiome();
    
    const nodes: MapNode[] = [];
    const strategicPoints: StrategicPoint[] = [];
    const terrainFeatures: TerrainFeature[] = [];

    // Generate base terrain
    this.generateBaseTerrain(nodes, terrainFeatures, personality, biome);

    // Generate strategic features
    const chokepointCount = this.config.strategicChokepoints || 
      this.rng.nextInt(2, 5);
    this.generateStrategicChokepoints(strategicPoints, chokepointCount);
    this.generateQuantumFractures(strategicPoints);
    this.generateResourceVeins(nodes, strategicPoints);
    this.generateElevationMap(terrainFeatures);

    // Determine strategic start positions based on personality
    const { playerStart, aiStart } = this.determineStrategicStartPositions(personality);

    // Find or create central node
    const centralNode = nodes.find(n => n.type === 'central') || 
      this.createCentralNode(nodes);

    // Calculate strategic DNA
    const strategicDNA = this.calculateStrategicDNA(nodes, strategicPoints, terrainFeatures);

    return {
      width: this.config.width,
      height: this.config.height,
      nodes,
      strategicPoints,
      terrainFeatures,
      playerStart,
      aiStart,
      centralNode,
      seed: this.config.seed,
      personality,
      biome,
      strategicDNA
    };
  }

  /**
   * Determine terrain personality based on seed
   */
  private determinePersonality(): TerrainPersonality {
    const personalities: TerrainPersonality[] = 
      ['aggressive', 'defensive', 'economic', 'puzzle'];
    return this.rng.choice(personalities);
  }

  /**
   * Determine biome type based on seed
   */
  private determineBiome(): BiomeType {
    const biomes: BiomeType[] = 
      ['volcanic', 'crystalline', 'organic', 'mechanical', 'quantum', 'void'];
    return this.rng.choice(biomes);
  }

  /**
   * Generate base terrain based on personality and biome
   */
  private generateBaseTerrain(
    nodes: MapNode[],
    features: TerrainFeature[],
    personality: TerrainPersonality,
    biome: BiomeType
  ): void {
    const resourceDensity = this.config.resourceDensity || 
      this.rng.nextFloat(0.3, 0.8);

    switch (personality) {
      case 'aggressive':
        this.generateAggressiveMap(nodes, features, resourceDensity);
        break;
      case 'defensive':
        this.generateDefensiveMap(nodes, features, resourceDensity);
        break;
      case 'economic':
        this.generateEconomicMap(nodes, features, resourceDensity);
        break;
      case 'puzzle':
        this.generatePuzzleMap(nodes, features, resourceDensity);
        break;
    }
  }

  /**
   * Aggressive map: Open spaces, fewer obstacles, favors rush strategies
   */
  private generateAggressiveMap(
    nodes: MapNode[],
    features: TerrainFeature[],
    density: number
  ): void {
    const nodeCount = Math.floor(30 * density);
    const resourceTypes: ('matter' | 'energy' | 'life' | 'knowledge')[] = 
      ['matter', 'energy', 'life', 'knowledge'];

    // Evenly distributed resources, minimal terrain obstacles
    for (let i = 0; i < nodeCount; i++) {
      const x = this.rng.nextFloat(this.config.width * 0.15, this.config.width * 0.85);
      const y = this.rng.nextFloat(this.config.height * 0.15, this.config.height * 0.85);
      const type = this.rng.choice(resourceTypes);
      const richness = this.rng.nextInt(60, 100);

      nodes.push({ 
        x, 
        y, 
        type, 
        richness,
        elevation: this.rng.nextFloat(-10, 10), // Minimal elevation variation
        strategicValue: this.rng.nextInt(30, 50)
      });
    }

    // Few terrain obstacles
    const obstacleCount = Math.floor(5 * (1 - density));
    for (let i = 0; i < obstacleCount; i++) {
      features.push({
        x: this.rng.nextFloat(this.config.width * 0.2, this.config.width * 0.8),
        y: this.rng.nextFloat(this.config.height * 0.2, this.config.height * 0.8),
        type: 'plateau',
        elevation: this.rng.nextFloat(20, 40),
        passability: 0.9, // High passability
        strategicValue: this.rng.nextInt(40, 60)
      });
    }

    // Central node
    nodes.push({
      x: this.config.width * 0.5,
      y: this.config.height * 0.5,
      type: 'central',
      richness: 100,
      elevation: 0,
      strategicValue: 100
    });
  }

  /**
   * Defensive map: Natural choke points, fortified positions
   */
  private generateDefensiveMap(
    nodes: MapNode[],
    features: TerrainFeature[],
    density: number
  ): void {
    const nodeCount = Math.floor(25 * density);
    const resourceTypes: ('matter' | 'energy' | 'life' | 'knowledge')[] = 
      ['matter', 'energy', 'life', 'knowledge'];

    // Create natural corridors with resources at key points
    const corridorCount = this.rng.nextInt(3, 5);
    for (let c = 0; c < corridorCount; c++) {
      const startX = this.rng.nextFloat(this.config.width * 0.1, this.config.width * 0.3);
      const startY = this.rng.nextFloat(this.config.height * 0.1, this.config.height * 0.3);
      const endX = this.rng.nextFloat(this.config.width * 0.7, this.config.width * 0.9);
      const endY = this.rng.nextFloat(this.config.height * 0.7, this.config.height * 0.9);

      // Place resources along corridor
      const nodesInCorridor = Math.floor(nodeCount / corridorCount);
      for (let i = 0; i < nodesInCorridor; i++) {
        const t = i / nodesInCorridor;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        const type = this.rng.choice(resourceTypes);
        const richness = this.rng.nextInt(50, 90);

        nodes.push({
          x,
          y,
          type,
          richness,
          elevation: this.rng.nextFloat(10, 30), // Elevated positions
          strategicValue: this.rng.nextInt(60, 80)
        });
      }

      // Create defensive terrain features
      features.push({
        x: (startX + endX) / 2,
        y: (startY + endY) / 2,
        type: 'plateau',
        elevation: this.rng.nextFloat(30, 60),
        passability: 0.6, // Lower passability creates choke points
        strategicValue: this.rng.nextInt(70, 90)
      });
    }

    // Central fortified position
    nodes.push({
      x: this.config.width * 0.5,
      y: this.config.height * 0.5,
      type: 'central',
      richness: 100,
      elevation: 50,
      strategicValue: 100
    });
  }

  /**
   * Economic map: Rich resources but vulnerable expansion points
   */
  private generateEconomicMap(
    nodes: MapNode[],
    features: TerrainFeature[],
    density: number
  ): void {
    const nodeCount = Math.floor(40 * density); // More nodes
    const resourceTypes: ('matter' | 'energy' | 'life' | 'knowledge')[] = 
      ['matter', 'energy', 'life', 'knowledge'];

    // Create resource clusters (rich but exposed)
    const clusterCount = this.rng.nextInt(4, 6);
    for (let c = 0; c < clusterCount; c++) {
      const clusterX = this.rng.nextFloat(this.config.width * 0.2, this.config.width * 0.8);
      const clusterY = this.rng.nextFloat(this.config.height * 0.2, this.config.height * 0.8);
      const clusterRadius = this.rng.nextFloat(80, 150);
      const nodesInCluster = Math.floor(nodeCount / clusterCount);

      for (let i = 0; i < nodesInCluster; i++) {
        const angle = this.rng.nextFloat(0, Math.PI * 2);
        const radius = this.rng.nextFloat(0, clusterRadius);
        const x = clusterX + Math.cos(angle) * radius;
        const y = clusterY + Math.sin(angle) * radius;
        const type = this.rng.choice(resourceTypes);
        const richness = this.rng.nextInt(70, 100); // High richness

        nodes.push({
          x,
          y,
          type,
          richness,
          elevation: this.rng.nextFloat(-20, 20),
          strategicValue: this.rng.nextInt(50, 70)
        });
      }
    }

    // Central node with high value
    nodes.push({
      x: this.config.width * 0.5,
      y: this.config.height * 0.5,
      type: 'central',
      richness: 100,
      elevation: 0,
      strategicValue: 100
    });
  }

  /**
   * Puzzle map: Requires specific unit combinations to progress
   */
  private generatePuzzleMap(
    nodes: MapNode[],
    features: TerrainFeature[],
    density: number
  ): void {
    const nodeCount = Math.floor(20 * density);
    const resourceTypes: ('matter' | 'energy' | 'life' | 'knowledge')[] = 
      ['matter', 'energy', 'life', 'knowledge'];

    // Create puzzle-like structure with barriers
    const sections = this.rng.nextInt(3, 5);
    for (let s = 0; s < sections; s++) {
      const sectionX = (s / sections) * this.config.width;
      const sectionWidth = this.config.width / sections;

      // Place resources in each section
      const nodesPerSection = Math.floor(nodeCount / sections);
      for (let i = 0; i < nodesPerSection; i++) {
        const x = sectionX + this.rng.nextFloat(sectionWidth * 0.1, sectionWidth * 0.9);
        const y = this.rng.nextFloat(this.config.height * 0.1, this.config.height * 0.9);
        const type = this.rng.choice(resourceTypes);
        const richness = this.rng.nextInt(40, 80);

        nodes.push({
          x,
          y,
          type,
          richness,
          elevation: this.rng.nextFloat(-30, 30),
          strategicValue: this.rng.nextInt(40, 60)
        });
      }

      // Create barriers between sections
      if (s < sections - 1) {
        features.push({
          x: sectionX + sectionWidth,
          y: this.config.height * 0.5,
          type: 'canyon',
          elevation: -50,
          passability: 0.3, // Low passability creates puzzle element
          strategicValue: this.rng.nextInt(60, 80)
        });
      }
    }

    // Central node
    nodes.push({
      x: this.config.width * 0.5,
      y: this.config.height * 0.5,
      type: 'central',
      richness: 100,
      elevation: 0,
      strategicValue: 100
    });
  }

  /**
   * Generate strategic chokepoints that affect unit movement
   */
  private generateStrategicChokepoints(
    points: StrategicPoint[],
    count: number
  ): void {
    for (let i = 0; i < count; i++) {
      const x = this.rng.nextFloat(this.config.width * 0.2, this.config.width * 0.8);
      const y = this.rng.nextFloat(this.config.height * 0.2, this.config.height * 0.8);
      const strength = this.rng.nextInt(50, 100);
      const radius = this.rng.nextFloat(30, 80);

      points.push({
        x,
        y,
        type: 'chokepoint',
        strength,
        radius,
        metadata: {
          movementPenalty: strength / 100, // 0.5-1.0
          tacticalBonus: strength / 2 // 25-50
        }
      });
    }
  }

  /**
   * Generate quantum fractures - areas that affect unit movement unpredictably
   */
  private generateQuantumFractures(points: StrategicPoint[]): void {
    const fractureCount = this.rng.nextInt(2, 4);
    
    for (let i = 0; i < fractureCount; i++) {
      const x = this.rng.nextFloat(this.config.width * 0.15, this.config.width * 0.85);
      const y = this.rng.nextFloat(this.config.height * 0.15, this.config.height * 0.85);
      const strength = this.rng.nextInt(30, 70);
      const radius = this.rng.nextFloat(40, 100);

      points.push({
        x,
        y,
        type: 'quantum_fracture',
        strength,
        radius,
        metadata: {
          teleportChance: strength / 200, // 0.15-0.35
          damageOverTime: strength / 10, // 3-7 per second
          unpredictability: strength / 50 // 0.6-1.4
        }
      });
    }
  }

  /**
   * Generate resource veins - procedural mineral deposits
   */
  private generateResourceVeins(
    nodes: MapNode[],
    points: StrategicPoint[]
  ): void {
    const veinCount = this.rng.nextInt(3, 6);
    
    for (let i = 0; i < veinCount; i++) {
      const startX = this.rng.nextFloat(this.config.width * 0.1, this.config.width * 0.9);
      const startY = this.rng.nextFloat(this.config.height * 0.1, this.config.height * 0.9);
      const length = this.rng.nextFloat(100, 300);
      const angle = this.rng.nextFloat(0, Math.PI * 2);
      
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;

      // Create nodes along the vein
      const nodesInVein = this.rng.nextInt(4, 8);
      const resourceType = this.rng.choice(['matter', 'energy', 'life', 'knowledge'] as const);

      for (let j = 0; j < nodesInVein; j++) {
        const t = j / nodesInVein;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        const richness = this.rng.nextInt(60, 100);

        nodes.push({
          x,
          y,
          type: resourceType,
          richness,
          elevation: this.rng.nextFloat(-10, 10),
          strategicValue: this.rng.nextInt(60, 80)
        });
      }

      // Mark the vein as a strategic point
      points.push({
        x: (startX + endX) / 2,
        y: (startY + endY) / 2,
        type: 'resource_vein',
        strength: 80,
        radius: length / 2,
        metadata: {
          resourceType,
          nodeCount: nodesInVein,
          totalRichness: nodesInVein * 80
        }
      });
    }
  }

  /**
   * Generate elevation map for tactical advantages
   */
  private generateElevationMap(features: TerrainFeature[]): void {
    const featureCount = this.rng.nextInt(8, 15);
    
    for (let i = 0; i < featureCount; i++) {
      const x = this.rng.nextFloat(this.config.width * 0.1, this.config.width * 0.9);
      const y = this.rng.nextFloat(this.config.height * 0.1, this.config.height * 0.9);
      const elevation = this.rng.nextFloat(-60, 60);
      const featureType = elevation > 20 ? 'plateau' : 
                         elevation < -20 ? 'valley' : 'mountain';
      
      features.push({
        x,
        y,
        type: featureType,
        elevation,
        passability: elevation > 0 ? 0.7 : 0.8, // Higher elevation = harder to traverse
        strategicValue: Math.abs(elevation) // Higher elevation = more strategic
      });
    }
  }

  /**
   * Determine strategic start positions based on personality
   */
  private determineStrategicStartPositions(
    personality: TerrainPersonality
  ): { playerStart: { x: number; y: number }; aiStart: { x: number; y: number } } {
    switch (personality) {
      case 'aggressive':
        // Close start positions for early conflict
        return {
          playerStart: { 
            x: this.config.width * 0.3, 
            y: this.config.height * 0.5 
          },
          aiStart: { 
            x: this.config.width * 0.7, 
            y: this.config.height * 0.5 
          }
        };
      
      case 'defensive':
        // Far positions with natural defenses
        return {
          playerStart: { 
            x: this.config.width * 0.15, 
            y: this.config.height * 0.5 
          },
          aiStart: { 
            x: this.config.width * 0.85, 
            y: this.config.height * 0.5 
          }
        };
      
      case 'economic':
        // Start near resource clusters
        return {
          playerStart: { 
            x: this.config.width * 0.25, 
            y: this.config.height * 0.4 
          },
          aiStart: { 
            x: this.config.width * 0.75, 
            y: this.config.height * 0.6 
          }
        };
      
      case 'puzzle':
        // Start at opposite ends
        return {
          playerStart: { 
            x: this.config.width * 0.1, 
            y: this.config.height * 0.5 
          },
          aiStart: { 
            x: this.config.width * 0.9, 
            y: this.config.height * 0.5 
          }
        };
      
      default:
        return {
          playerStart: { 
            x: this.config.width * 0.2, 
            y: this.config.height * 0.5 
          },
          aiStart: { 
            x: this.config.width * 0.8, 
            y: this.config.height * 0.5 
          }
        };
    }
  }

  /**
   * Create central node if none exists
   */
  private createCentralNode(nodes: MapNode[]): MapNode {
    const centralNode: MapNode = {
      x: this.config.width * 0.5,
      y: this.config.height * 0.5,
      type: 'central',
      richness: 100,
      elevation: 0,
      strategicValue: 100
    };
    nodes.push(centralNode);
    return centralNode;
  }

  /**
   * Calculate strategic DNA - map personality metrics
   */
  private calculateStrategicDNA(
    nodes: MapNode[],
    strategicPoints: StrategicPoint[],
    terrainFeatures: TerrainFeature[]
  ): GeneratedMap['strategicDNA'] {
    // Calculate openness (average distance between nodes)
    const nodeDistances: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        nodeDistances.push(Math.sqrt(dx * dx + dy * dy));
      }
    }
    const avgDistance = nodeDistances.reduce((a, b) => a + b, 0) / nodeDistances.length;
    const openness = Math.min(1, avgDistance / (this.config.width * 0.5));

    // Calculate defensiveness (chokepoint density)
    const chokepoints = strategicPoints.filter(p => p.type === 'chokepoint');
    const defensiveness = Math.min(1, chokepoints.length / 5);

    // Calculate economic value (average resource richness)
    const avgRichness = nodes.reduce((sum, n) => sum + n.richness, 0) / nodes.length;
    const economicValue = avgRichness / 100;

    // Calculate complexity (terrain feature density + puzzle elements)
    const complexity = Math.min(1, (terrainFeatures.length + strategicPoints.length) / 20);

    return {
      openness,
      defensiveness,
      economicValue,
      complexity
    };
  }

  /**
   * Get map hash for verification
   */
  public getMapHash(map: GeneratedMap): string {
    const data = JSON.stringify({
      seed: map.seed,
      personality: map.personality,
      biome: map.biome,
      nodeCount: map.nodes.length,
      strategicPointCount: map.strategicPoints.length,
      strategicDNA: map.strategicDNA
    });
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

