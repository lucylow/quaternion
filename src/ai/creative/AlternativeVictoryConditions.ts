/**
 * Alternative Victory Conditions System
 * Enables creative win conditions beyond military conquest
 */

export type VictoryConditionType = 
  | 'ecological' 
  | 'cultural' 
  | 'technological' 
  | 'diplomatic' 
  | 'symbiotic'
  | 'military';

export interface VictoryCondition {
  id: string;
  type: VictoryConditionType;
  name: string;
  description: string;
  checkFunction: (gameState: any) => boolean;
  progress: number; // 0-1
  requirements: string[];
  active: boolean;
}

export interface EcologicalVictoryData {
  terraformedTiles: number;
  totalTiles: number;
  requiredPercentage: number;
  hostileBiomes: string[];
  friendlyBiomes: string[];
}

export interface CulturalVictoryData {
  convertedCities: number;
  tradeRoutes: number;
  culturalInfluence: number;
  requiredInfluence: number;
}

export interface TechnologicalVictoryData {
  wonderBuilt: boolean;
  wonderLocation: { x: number; y: number };
  requiredTerrain: string;
  techTier: number;
  requiredTier: number;
}

export interface DiplomaticVictoryData {
  alliances: number;
  controlledChokepoints: number;
  totalChokepoints: number;
  requiredControl: number;
}

export class AlternativeVictoryConditions {
  private conditions: Map<string, VictoryCondition> = new Map();
  private activeConditions: Set<string> = new Set();

  constructor() {
    this.initializeConditions();
  }

  /**
   * Initialize all victory conditions
   */
  private initializeConditions(): void {
    // Ecological Victory
    this.conditions.set('ecological', {
      id: 'ecological',
      type: 'ecological',
      name: 'Ecological Mastery',
      description: 'Terraform 70% of hostile biomes into habitable ones',
      checkFunction: (state) => this.checkEcologicalVictory(state),
      progress: 0,
      requirements: [
        'Control terraforming technology',
        'Transform hostile biomes',
        'Achieve 70% terraformation'
      ],
      active: false
    });

    // Cultural Victory
    this.conditions.set('cultural', {
      id: 'cultural',
      type: 'cultural',
      name: 'Cultural Dominance',
      description: 'Convert enemy cities through trade routes and cultural influence',
      checkFunction: (state) => this.checkCulturalVictory(state),
      progress: 0,
      requirements: [
        'Establish trade routes',
        'Build cultural centers',
        'Achieve 80% cultural influence'
      ],
      active: false
    });

    // Technological Victory
    this.conditions.set('technological', {
      id: 'technological',
      type: 'technological',
      name: 'Technological Ascendancy',
      description: 'Build wonder in specific terrain type',
      checkFunction: (state) => this.checkTechnologicalVictory(state),
      progress: 0,
      requirements: [
        'Research wonder technology',
        'Control required terrain',
        'Complete wonder construction'
      ],
      active: false
    });

    // Diplomatic Victory
    this.conditions.set('diplomatic', {
      id: 'diplomatic',
      type: 'diplomatic',
      name: 'Diplomatic Control',
      description: 'Form alliance controlling all strategic chokepoints',
      checkFunction: (state) => this.checkDiplomaticVictory(state),
      progress: 0,
      requirements: [
        'Form alliances with major factions',
        'Control strategic chokepoints',
        'Achieve 100% chokepoint control'
      ],
      active: false
    });

    // Symbiotic Victory
    this.conditions.set('symbiotic', {
      id: 'symbiotic',
      type: 'symbiotic',
      name: 'Perfect Symbiosis',
      description: 'Achieve perfect resource balance with all AI factions',
      checkFunction: (state) => this.checkSymbioticVictory(state),
      progress: 0,
      requirements: [
        'Maintain resource balance',
        'Form symbiotic relationships',
        'Achieve equilibrium with all factions'
      ],
      active: false
    });
  }

  /**
   * Enable creative win conditions based on game state
   */
  enableCreativeWinConditions(gameState: any): VictoryCondition[] {
    const enabled: VictoryCondition[] = [];

    this.conditions.forEach((condition, id) => {
      if (condition.checkFunction(gameState)) {
        condition.active = true;
        condition.progress = this.calculateProgress(condition, gameState);
        this.activeConditions.add(id);
        enabled.push({ ...condition });
      } else {
        condition.active = false;
        condition.progress = this.calculateProgress(condition, gameState);
      }
    });

    return enabled;
  }

  /**
   * Check ecological victory
   */
  private checkEcologicalVictory(gameState: any): boolean {
    const data = this.getEcologicalData(gameState);
    const terraformedPercentage = (data.terraformedTiles / data.totalTiles) * 100;
    return terraformedPercentage >= data.requiredPercentage;
  }

  /**
   * Get ecological victory data
   */
  private getEcologicalData(gameState: any): EcologicalVictoryData {
    // Simplified - would need actual tile data
    return {
      terraformedTiles: 0, // Would calculate from game state
      totalTiles: gameState.mapWidth * gameState.mapHeight || 1200,
      requiredPercentage: 70,
      hostileBiomes: ['lava', 'desert', 'wasteland'],
      friendlyBiomes: ['forest', 'plains', 'oasis']
    };
  }

  /**
   * Check cultural victory
   */
  private checkCulturalVictory(gameState: any): boolean {
    const data = this.getCulturalData(gameState);
    return data.culturalInfluence >= data.requiredInfluence;
  }

  /**
   * Get cultural victory data
   */
  private getCulturalData(gameState: any): CulturalVictoryData {
    return {
      convertedCities: 0, // Would calculate from game state
      tradeRoutes: 0,
      culturalInfluence: 0,
      requiredInfluence: 80
    };
  }

  /**
   * Check technological victory
   */
  private checkTechnologicalVictory(gameState: any): boolean {
    const data = this.getTechnologicalData(gameState);
    return data.wonderBuilt && 
           data.techTier >= data.requiredTier &&
           this.checkWonderTerrain(data.wonderLocation, data.requiredTerrain, gameState);
  }

  /**
   * Get technological victory data
   */
  private getTechnologicalData(gameState: any): TechnologicalVictoryData {
    return {
      wonderBuilt: false, // Would check if wonder exists
      wonderLocation: { x: 0, y: 0 },
      requiredTerrain: 'mountain',
      techTier: gameState.players?.[0]?.researchedTechs?.size || 0,
      requiredTier: 10
    };
  }

  /**
   * Check wonder terrain requirement
   */
  private checkWonderTerrain(
    location: { x: number; y: number },
    requiredTerrain: string,
    gameState: any
  ): boolean {
    // Simplified - would check actual tile biome
    return true;
  }

  /**
   * Check diplomatic victory
   */
  private checkDiplomaticVictory(gameState: any): boolean {
    const data = this.getDiplomaticData(gameState);
    const controlPercentage = (data.controlledChokepoints / data.totalChokepoints) * 100;
    return controlPercentage >= data.requiredControl && data.alliances >= 2;
  }

  /**
   * Get diplomatic victory data
   */
  private getDiplomaticData(gameState: any): DiplomaticVictoryData {
    return {
      alliances: 0, // Would count from diplomacy system
      controlledChokepoints: 0,
      totalChokepoints: 5, // Would calculate from map
      requiredControl: 100
    };
  }

  /**
   * Check symbiotic victory
   */
  private checkSymbioticVictory(gameState: any): boolean {
    if (!gameState.players || gameState.players.length === 0) return false;
    
    const player = gameState.players[0];
    const resources = player.resources;
    
    // Check if all resources are balanced
    const mean = (resources.ore + resources.energy + resources.biomass + resources.data) / 4;
    const variance = (
      Math.pow(resources.ore - mean, 2) +
      Math.pow(resources.energy - mean, 2) +
      Math.pow(resources.biomass - mean, 2) +
      Math.pow(resources.data - mean, 2)
    ) / 4;
    
    const stdDev = Math.sqrt(variance);
    const coefficient = stdDev / mean;
    
    // Low coefficient of variation = balanced
    return coefficient < 0.1 && gameState.instability < 30;
  }

  /**
   * Calculate progress for a condition
   */
  private calculateProgress(condition: VictoryCondition, gameState: any): number {
    switch (condition.type) {
      case 'ecological': {
        const ecoData = this.getEcologicalData(gameState);
        return Math.min(1, (ecoData.terraformedTiles / (ecoData.totalTiles * 0.7)));
      }
      
      case 'cultural': {
        const cultData = this.getCulturalData(gameState);
        return Math.min(1, cultData.culturalInfluence / cultData.requiredInfluence);
      }
      
      case 'technological': {
        const techData = this.getTechnologicalData(gameState);
        return Math.min(1, techData.techTier / techData.requiredTier);
      }
      
      case 'diplomatic': {
        const dipData = this.getDiplomaticData(gameState);
        const controlProgress = dipData.controlledChokepoints / dipData.totalChokepoints;
        const allianceProgress = Math.min(1, dipData.alliances / 2);
        return (controlProgress + allianceProgress) / 2;
      }
      
      case 'symbiotic': {
        if (!gameState.players || gameState.players.length === 0) return 0;
        const player = gameState.players[0];
        const resources = player.resources;
        const mean = (resources.ore + resources.energy + resources.biomass + resources.data) / 4;
        const variance = (
          Math.pow(resources.ore - mean, 2) +
          Math.pow(resources.energy - mean, 2) +
          Math.pow(resources.biomass - mean, 2) +
          Math.pow(resources.data - mean, 2)
        ) / 4;
        const stdDev = Math.sqrt(variance);
        const coefficient = stdDev / mean;
        // Inverse: lower coefficient = higher progress
        return Math.max(0, 1 - (coefficient / 0.5));
      }
      
      default:
        return 0;
    }
  }

  /**
   * Get all active conditions
   */
  getActiveConditions(): VictoryCondition[] {
    return Array.from(this.conditions.values()).filter(c => c.active);
  }

  /**
   * Get condition by type
   */
  getCondition(type: VictoryConditionType): VictoryCondition | undefined {
    return Array.from(this.conditions.values()).find(c => c.type === type);
  }

  /**
   * Check if any alternative victory is achieved
   */
  checkVictories(gameState: any): VictoryCondition | null {
    const active = this.enableCreativeWinConditions(gameState);
    return active.find(c => c.progress >= 1) || null;
  }
}

