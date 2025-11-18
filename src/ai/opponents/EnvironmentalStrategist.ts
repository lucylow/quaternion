/**
 * Environmental Strategist - AI that uses terrain creatively
 * Exploits chokepoints, high ground, ambush locations, and environmental traps
 */

import { SeededRandom } from '../../lib/SeededRandom';

export interface TerrainExploitation {
  chokepoints: Array<{ x: number; y: number; value: number }>;
  highGround: Array<{ x: number; y: number; elevation: number }>;
  ambushLocations: Array<{ x: number; y: number; successProbability: number }>;
  resourceRichAreas: Array<{ x: number; y: number; value: number }>;
}

export interface EnvironmentalTrap {
  location: { x: number; y: number };
  type: 'area_denial' | 'ambush' | 'resource_denial' | 'movement_slow';
  triggerCondition: string;
  effect: string;
  active: boolean;
}

export class EnvironmentalStrategist {
  private mapAnalyzer: any; // Would integrate with actual map analysis
  private terrainExploitation: TerrainExploitation;
  private environmentalTraps: EnvironmentalTrap[];
  private rng: SeededRandom;

  constructor(seed: number, mapAnalyzer?: any) {
    this.rng = new SeededRandom(seed);
    this.mapAnalyzer = mapAnalyzer;
    this.terrainExploitation = {
      chokepoints: [],
      highGround: [],
      ambushLocations: [],
      resourceRichAreas: []
    };
    this.environmentalTraps = [];
  }

  /**
   * Analyze map for advantages
   */
  public analyzeMapForAdvantages(mapData: any): void {
    // Find chokepoints
    this.terrainExploitation.chokepoints = this.findChokepoints(mapData);
    
    // Find high ground
    this.terrainExploitation.highGround = this.findElevationAdvantages(mapData);
    
    // Find ambush locations
    this.terrainExploitation.ambushLocations = this.findAmbushSites(mapData);
    
    // Find resource-rich areas
    this.terrainExploitation.resourceRichAreas = this.findResourceRichAreas(mapData);

    // Set up environmental traps
    this.setupEnvironmentalTraps();
  }

  /**
   * Execute terrain-based strategy
   */
  public executeTerrainBasedStrategy(playerPosition: { x: number; y: number }): {
    strategy: string;
    target: { x: number; y: number };
    reasoning: string;
  } | null {
    // Try to lure player into ambush
    if (this.terrainExploitation.ambushLocations.length > 0) {
      const bestAmbush = this.findBestAmbushForPlayer(playerPosition);
      if (bestAmbush) {
        return {
          strategy: 'lure_to_ambush',
          target: bestAmbush.location,
          reasoning: `Luring player to prepared ambush site with ${(bestAmbush.successProbability * 100).toFixed(0)}% success probability.`
        };
      }
    }

    // Force engagement at chokepoint
    if (this.terrainExploitation.chokepoints.length > 0) {
      const bestChokepoint = this.findOptimalChokepoint(playerPosition);
      if (bestChokepoint) {
        return {
          strategy: 'force_chokepoint_engagement',
          target: bestChokepoint.location,
          reasoning: `Forcing engagement at strategic chokepoint with value ${bestChokepoint.value.toFixed(2)}.`
        };
      }
    }

    // Use high ground advantage
    if (this.terrainExploitation.highGround.length > 0) {
      const bestHighGround = this.findBestHighGround(playerPosition);
      if (bestHighGround) {
        return {
          strategy: 'high_ground_advantage',
          target: bestHighGround.location,
          reasoning: `Positioning on high ground with elevation ${bestHighGround.elevation.toFixed(1)} for tactical advantage.`
        };
      }
    }

    return null;
  }

  /**
   * Setup environmental traps
   */
  private setupEnvironmentalTraps(): void {
    // Set up area denial at chokepoints
    this.terrainExploitation.chokepoints.forEach(chokepoint => {
      const trap: EnvironmentalTrap = {
        location: { x: chokepoint.x, y: chokepoint.y },
        type: 'area_denial',
        triggerCondition: 'enemy_movement',
        effect: 'movement_slow_damage_over_time',
        active: true
      };
      this.environmentalTraps.push(trap);
    });

    // Prepare ambushes at ambush locations
    this.terrainExploitation.ambushLocations.forEach(ambushSite => {
      const trap: EnvironmentalTrap = {
        location: { x: ambushSite.x, y: ambushSite.y },
        type: 'ambush',
        triggerCondition: 'enemy_engagement',
        effect: 'surprise_attack_bonus',
        active: true
      };
      this.environmentalTraps.push(trap);
    });
  }

  /**
   * Find chokepoints
   */
  private findChokepoints(mapData: any): Array<{ x: number; y: number; value: number }> {
    // Simplified - would use actual map analysis
    return [
      { x: 200, y: 200, value: 0.8 },
      { x: 600, y: 400, value: 0.7 },
      { x: 800, y: 800, value: 0.9 }
    ];
  }

  /**
   * Find elevation advantages
   */
  private findElevationAdvantages(mapData: any): Array<{ x: number; y: number; elevation: number }> {
    // Simplified - would use actual map analysis
    return [
      { x: 300, y: 300, elevation: 10 },
      { x: 700, y: 500, elevation: 15 },
      { x: 900, y: 100, elevation: 12 }
    ];
  }

  /**
   * Find ambush sites
   */
  private findAmbushSites(mapData: any): Array<{ x: number; y: number; successProbability: number }> {
    // Simplified - would use actual map analysis
    return [
      { x: 250, y: 250, successProbability: 0.8 },
      { x: 550, y: 450, successProbability: 0.7 },
      { x: 850, y: 850, successProbability: 0.9 }
    ];
  }

  /**
   * Find resource-rich areas
   */
  private findResourceRichAreas(mapData: any): Array<{ x: number; y: number; value: number }> {
    // Simplified - would use actual map analysis
    return [
      { x: 150, y: 150, value: 0.9 },
      { x: 650, y: 350, value: 0.8 },
      { x: 950, y: 950, value: 0.85 }
    ];
  }

  /**
   * Find best ambush for player position
   */
  private findBestAmbushForPlayer(playerPosition: { x: number; y: number }): {
    location: { x: number; y: number };
    successProbability: number;
  } | null {
    if (this.terrainExploitation.ambushLocations.length === 0) {
      return null;
    }

    // Find closest ambush with high success probability
    let bestAmbush = this.terrainExploitation.ambushLocations[0];
    let bestScore = bestAmbush.successProbability;

    for (const ambush of this.terrainExploitation.ambushLocations) {
      const distance = this.calculateDistance(playerPosition, { x: ambush.x, y: ambush.y });
      const score = ambush.successProbability * (1 / (1 + distance / 100)); // Closer = better

      if (score > bestScore) {
        bestScore = score;
        bestAmbush = ambush;
      }
    }

    return {
      location: { x: bestAmbush.x, y: bestAmbush.y },
      successProbability: bestAmbush.successProbability
    };
  }

  /**
   * Find optimal chokepoint
   */
  private findOptimalChokepoint(playerPosition: { x: number; y: number }): {
    location: { x: number; y: number };
    value: number;
  } | null {
    if (this.terrainExploitation.chokepoints.length === 0) {
      return null;
    }

    // Find chokepoint with highest value near player
    let bestChokepoint = this.terrainExploitation.chokepoints[0];
    let bestScore = bestChokepoint.value;

    for (const chokepoint of this.terrainExploitation.chokepoints) {
      const distance = this.calculateDistance(playerPosition, { x: chokepoint.x, y: chokepoint.y });
      const score = chokepoint.value * (1 / (1 + distance / 200)); // Closer = better

      if (score > bestScore) {
        bestScore = score;
        bestChokepoint = chokepoint;
      }
    }

    return {
      location: { x: bestChokepoint.x, y: bestChokepoint.y },
      value: bestChokepoint.value
    };
  }

  /**
   * Find best high ground
   */
  private findBestHighGround(playerPosition: { x: number; y: number }): {
    location: { x: number; y: number };
    elevation: number;
  } | null {
    if (this.terrainExploitation.highGround.length === 0) {
      return null;
    }

    // Find highest elevation near player
    let bestHighGround = this.terrainExploitation.highGround[0];
    let bestScore = bestHighGround.elevation;

    for (const highGround of this.terrainExploitation.highGround) {
      const distance = this.calculateDistance(playerPosition, { x: highGround.x, y: highGround.y });
      const score = highGround.elevation * (1 / (1 + distance / 150)); // Closer = better

      if (score > bestScore) {
        bestScore = score;
        bestHighGround = highGround;
      }
    }

    return {
      location: { x: bestHighGround.x, y: bestHighGround.y },
      elevation: bestHighGround.elevation
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get terrain exploitation data
   */
  public getTerrainExploitation(): TerrainExploitation {
    return { ...this.terrainExploitation };
  }

  /**
   * Get environmental traps
   */
  public getEnvironmentalTraps(): EnvironmentalTrap[] {
    return [...this.environmentalTraps];
  }
}

