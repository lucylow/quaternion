import { SeededRandom } from '../lib/SeededRandom';

/**
 * Procedural map generator using quaternion-based approach
 */

export interface MapNode {
  x: number;
  y: number;
  type: 'matter' | 'energy' | 'life' | 'knowledge' | 'empty' | 'central';
  richness: number; // 0-100
}

export interface MapConfig {
  width: number;
  height: number;
  seed: number;
  type: 'crystalline_plains' | 'jagged_island' | 'quantum_nexus' | 'void_expanse';
}

export interface GeneratedMap {
  width: number;
  height: number;
  nodes: MapNode[];
  playerStart: { x: number; y: number };
  aiStart: { x: number; y: number };
  centralNode: MapNode | null;
  seed: number;
}

export class ProceduralMapGenerator {
  private rng: SeededRandom;
  private config: MapConfig;

  constructor(config: MapConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);
  }

  /**
   * Generate complete map
   */
  public generate(): GeneratedMap {
    const nodes: MapNode[] = [];
    
    // Generate resource nodes based on map type
    switch (this.config.type) {
      case 'crystalline_plains':
        this.generateCrystallinePlains(nodes);
        break;
      case 'jagged_island':
        this.generateJaggedIsland(nodes);
        break;
      case 'quantum_nexus':
        this.generateQuantumNexus(nodes);
        break;
      case 'void_expanse':
        this.generateVoidExpanse(nodes);
        break;
    }

    // Determine start positions
    const playerStart = { x: this.config.width * 0.2, y: this.config.height * 0.5 };
    const aiStart = { x: this.config.width * 0.8, y: this.config.height * 0.5 };

    // Find or create central node
    const centralNode = nodes.find(n => n.type === 'central') || null;

    return {
      width: this.config.width,
      height: this.config.height,
      nodes,
      playerStart,
      aiStart,
      centralNode,
      seed: this.config.seed
    };
  }

  /**
   * Generate Crystalline Plains map (balanced, open terrain)
   */
  private generateCrystallinePlains(nodes: MapNode[]): void {
    const resourceTypes: ('matter' | 'energy' | 'life' | 'knowledge')[] = 
      ['matter', 'energy', 'life', 'knowledge'];
    
    // Create evenly distributed resource nodes
    const nodesPerType = 6;
    
    for (let i = 0; i < nodesPerType; i++) {
      for (const resourceType of resourceTypes) {
        const x = this.rng.nextFloat(this.config.width * 0.2, this.config.width * 0.8);
        const y = this.rng.nextFloat(this.config.height * 0.2, this.config.height * 0.8);
        const richness = this.rng.nextInt(50, 100);
        
        nodes.push({ x, y, type: resourceType, richness });
      }
    }

    // Add central node
    nodes.push({
      x: this.config.width * 0.5,
      y: this.config.height * 0.5,
      type: 'central',
      richness: 100
    });
  }

  /**
   * Generate Jagged Island map (limited expansion, clustered resources)
   */
  private generateJaggedIsland(nodes: MapNode[]): void {
    const centerX = this.config.width * 0.5;
    const centerY = this.config.height * 0.5;
    const maxRadius = Math.min(this.config.width, this.config.height) * 0.35;

    // Create resource clusters in island formation
    const clusterCount = 8;
    for (let i = 0; i < clusterCount; i++) {
      const angle = (i / clusterCount) * Math.PI * 2;
      const radius = this.rng.nextFloat(maxRadius * 0.5, maxRadius);
      const clusterX = centerX + Math.cos(angle) * radius;
      const clusterY = centerY + Math.sin(angle) * radius;

      // Add 3-5 nodes per cluster
      const nodesInCluster = this.rng.nextInt(3, 5);
      for (let j = 0; j < nodesInCluster; j++) {
        const offsetX = this.rng.nextFloat(-50, 50);
        const offsetY = this.rng.nextFloat(-50, 50);
        const type = this.rng.choice(['matter', 'energy', 'life', 'knowledge'] as const);
        const richness = this.rng.nextInt(40, 90);

        nodes.push({
          x: clusterX + offsetX,
          y: clusterY + offsetY,
          type,
          richness
        });
      }
    }

    // Central node at island center
    nodes.push({
      x: centerX,
      y: centerY,
      type: 'central',
      richness: 100
    });
  }

  /**
   * Generate Quantum Nexus map (central hub with high risk)
   */
  private generateQuantumNexus(nodes: MapNode[]): void {
    const centerX = this.config.width * 0.5;
    const centerY = this.config.height * 0.5;

    // Central super-node with all resources
    nodes.push({
      x: centerX,
      y: centerY,
      type: 'central',
      richness: 100
    });

    // Ring of high-value nodes around center
    const ringNodes = 12;
    const ringRadius = Math.min(this.config.width, this.config.height) * 0.25;
    
    for (let i = 0; i < ringNodes; i++) {
      const angle = (i / ringNodes) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * ringRadius;
      const y = centerY + Math.sin(angle) * ringRadius;
      const type = this.rng.choice(['matter', 'energy', 'life', 'knowledge'] as const);
      const richness = this.rng.nextInt(70, 100);

      nodes.push({ x, y, type, richness });
    }

    // Outer ring of lower-value nodes
    const outerNodes = 16;
    const outerRadius = Math.min(this.config.width, this.config.height) * 0.4;
    
    for (let i = 0; i < outerNodes; i++) {
      const angle = (i / outerNodes) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * outerRadius;
      const y = centerY + Math.sin(angle) * outerRadius;
      const type = this.rng.choice(['matter', 'energy', 'life', 'knowledge'] as const);
      const richness = this.rng.nextInt(30, 60);

      nodes.push({ x, y, type, richness });
    }
  }

  /**
   * Generate Void Expanse map (sparse resources, high difficulty)
   */
  private generateVoidExpanse(nodes: MapNode[]): void {
    // Very few, scattered resource nodes
    const totalNodes = 20;
    
    for (let i = 0; i < totalNodes; i++) {
      const x = this.rng.nextFloat(this.config.width * 0.1, this.config.width * 0.9);
      const y = this.rng.nextFloat(this.config.height * 0.1, this.config.height * 0.9);
      const type = this.rng.choice(['matter', 'energy', 'life', 'knowledge'] as const);
      const richness = this.rng.nextInt(20, 50);

      nodes.push({ x, y, type, richness });
    }

    // Single central node with moderate resources
    nodes.push({
      x: this.config.width * 0.5,
      y: this.config.height * 0.5,
      type: 'central',
      richness: 60
    });
  }

  /**
   * Perlin-like noise function using quaternion approach
   */
  private quaternionNoise(x: number, y: number): number {
    // Simplified quaternion-based noise
    const q1 = Math.sin(x * 0.1) * Math.cos(y * 0.1);
    const q2 = Math.cos(x * 0.1) * Math.sin(y * 0.1);
    const q3 = Math.sin(x * 0.05) * Math.sin(y * 0.05);
    const q4 = Math.cos(x * 0.05) * Math.cos(y * 0.05);
    
    // Quaternion magnitude
    return Math.sqrt(q1 * q1 + q2 * q2 + q3 * q3 + q4 * q4);
  }

  /**
   * Get map hash for verification
   */
  public getMapHash(map: GeneratedMap): string {
    const data = JSON.stringify({
      seed: map.seed,
      nodeCount: map.nodes.length,
      nodes: map.nodes.map(n => ({ x: Math.floor(n.x), y: Math.floor(n.y), type: n.type }))
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}
