/**
 * Procedural Puzzle Generator
 * Creates self-designing challenges that adapt to player skill level
 */

export interface TerrainPuzzle {
  id: string;
  name: string;
  objective: string;
  terrainLayout: TerrainLayout;
  enemyBehavior: string;
  successCondition: string;
  learningGoal: string;
  difficulty: number;
  estimatedTime: number;
  rewards: PuzzleReward[];
}

export interface TerrainLayout {
  type: 'converging' | 'chokepoint' | 'maze' | 'open' | 'layered';
  tiles: PuzzleTile[];
  strategicPoints: StrategicPoint[];
}

export interface PuzzleTile {
  x: number;
  y: number;
  biome: string;
  resource?: string;
  special?: string;
}

export interface StrategicPoint {
  id: string;
  type: 'resource' | 'chokepoint' | 'high_ground' | 'objective';
  position: { x: number; y: number };
  importance: number;
}

export interface PuzzleReward {
  type: 'resource' | 'tech' | 'unit' | 'ability';
  amount?: number;
  item?: string;
}

export interface PlayerSkillProfile {
  weaknesses: string[];
  strengths: string[];
  preferredStrategy: 'turtle' | 'rush' | 'economic' | 'tech' | 'balanced';
  averageGameTime: number;
  winRate: number;
}

export class ProceduralPuzzleGenerator {
  private playerProfile: PlayerSkillProfile | null = null;
  private generatedPuzzles: Map<string, TerrainPuzzle> = new Map();

  /**
   * Generate dynamic puzzle based on player skill
   */
  generateDynamicPuzzle(
    gameState: any,
    skill: PlayerSkillProfile
  ): TerrainPuzzle {
    this.playerProfile = skill;
    
    // Analyze player weakness and create training puzzle
    if (skill.weaknesses.includes('flank_defense')) {
      return this.createFlankingDefensePuzzle(gameState);
    } else if (skill.weaknesses.includes('resource_timing')) {
      return this.createResourceRacePuzzle(gameState);
    } else if (skill.weaknesses.includes('multi_task')) {
      return this.createMultiObjectivePuzzle(gameState);
    } else {
      return this.createBalancedPuzzle(gameState);
    }
  }

  /**
   * Create flanking defense puzzle
   */
  private createFlankingDefensePuzzle(gameState: any): TerrainPuzzle {
    const difficulty = this.calculateAdaptiveDifficulty();
    
    return {
      id: `puzzle_${Date.now()}`,
      name: 'The Pincer Maneuver',
      objective: 'Defend central resource node from multi-direction attack',
      terrainLayout: {
        type: 'converging',
        tiles: this.generateConvergingChokepoints(),
        strategicPoints: [
          {
            id: 'center',
            type: 'objective',
            position: { x: 600, y: 350 },
            importance: 1.0
          },
          {
            id: 'north_choke',
            type: 'chokepoint',
            position: { x: 600, y: 200 },
            importance: 0.8
          },
          {
            id: 'south_choke',
            type: 'chokepoint',
            position: { x: 600, y: 500 },
            importance: 0.8
          },
          {
            id: 'east_choke',
            type: 'chokepoint',
            position: { x: 800, y: 350 },
            importance: 0.7
          },
          {
            id: 'west_choke',
            type: 'chokepoint',
            position: { x: 400, y: 350 },
            importance: 0.7
          }
        ]
      },
      enemyBehavior: 'flanking',
      successCondition: `Hold central node for ${5 + difficulty * 2} minutes`,
      learningGoal: 'Identify and secure flanking routes',
      difficulty,
      estimatedTime: (5 + difficulty * 2) * 60 * 1000,
      rewards: [
        { type: 'resource', amount: 500 },
        { type: 'tech', item: 'defensive_tactics' }
      ]
    };
  }

  /**
   * Create resource race puzzle
   */
  private createResourceRacePuzzle(gameState: any): TerrainPuzzle {
    const difficulty = this.calculateAdaptiveDifficulty();
    
    return {
      id: `puzzle_${Date.now()}`,
      name: 'The Resource Rush',
      objective: 'Out-compete AI in resource gathering while defending your base',
      terrainLayout: {
        type: 'open',
        tiles: this.generateResourceRichTerrain(),
        strategicPoints: [
          {
            id: 'resource_1',
            type: 'resource',
            position: { x: 300, y: 200 },
            importance: 0.9
          },
          {
            id: 'resource_2',
            type: 'resource',
            position: { x: 900, y: 200 },
            importance: 0.9
          },
          {
            id: 'resource_3',
            type: 'resource',
            position: { x: 300, y: 500 },
            importance: 0.9
          },
          {
            id: 'resource_4',
            type: 'resource',
            position: { x: 900, y: 500 },
            importance: 0.9
          }
        ]
      },
      enemyBehavior: 'resource_competition',
      successCondition: `Gather ${1000 + difficulty * 500} resources before AI`,
      learningGoal: 'Efficient resource timing and prioritization',
      difficulty,
      estimatedTime: 8 * 60 * 1000,
      rewards: [
        { type: 'resource', amount: 1000 },
        { type: 'ability', item: 'rapid_extraction' }
      ]
    };
  }

  /**
   * Create multi-objective puzzle
   */
  private createMultiObjectivePuzzle(gameState: any): TerrainPuzzle {
    const difficulty = this.calculateAdaptiveDifficulty();
    
    return {
      id: `puzzle_${Date.now()}`,
      name: 'The Triple Threat',
      objective: 'Simultaneously defend base, gather resources, and research technology',
      terrainLayout: {
        type: 'layered',
        tiles: this.generateLayeredTerrain(),
        strategicPoints: [
          {
            id: 'base',
            type: 'objective',
            position: { x: 150, y: 350 },
            importance: 1.0
          },
          {
            id: 'research_site',
            type: 'objective',
            position: { x: 600, y: 350 },
            importance: 0.8
          },
          {
            id: 'resource_field',
            type: 'resource',
            position: { x: 1050, y: 350 },
            importance: 0.7
          }
        ]
      },
      enemyBehavior: 'pressure',
      successCondition: `Complete all objectives within ${10 + difficulty * 3} minutes`,
      learningGoal: 'Multi-tasking and priority management',
      difficulty,
      estimatedTime: (10 + difficulty * 3) * 60 * 1000,
      rewards: [
        { type: 'tech', item: 'efficiency_protocol' },
        { type: 'unit', item: 'advanced_worker' }
      ]
    };
  }

  /**
   * Create balanced puzzle
   */
  private createBalancedPuzzle(gameState: any): TerrainPuzzle {
    const difficulty = this.calculateAdaptiveDifficulty();
    
    return {
      id: `puzzle_${Date.now()}`,
      name: 'The Balanced Challenge',
      objective: 'Achieve equilibrium across all four resource axes',
      terrainLayout: {
        type: 'maze',
        tiles: this.generateMazeTerrain(),
        strategicPoints: [
          {
            id: 'matter_node',
            type: 'resource',
            position: { x: 300, y: 200 },
            importance: 0.8
          },
          {
            id: 'energy_node',
            type: 'resource',
            position: { x: 900, y: 200 },
            importance: 0.8
          },
          {
            id: 'life_node',
            type: 'resource',
            position: { x: 300, y: 500 },
            importance: 0.8
          },
          {
            id: 'knowledge_node',
            type: 'resource',
            position: { x: 900, y: 500 },
            importance: 0.8
          }
        ]
      },
      enemyBehavior: 'balanced',
      successCondition: `Maintain resource balance (variance < 20%) for ${3 + difficulty} minutes`,
      learningGoal: 'Resource balance and quaternion management',
      difficulty,
      estimatedTime: (3 + difficulty) * 60 * 1000,
      rewards: [
        { type: 'tech', item: 'balance_core' },
        { type: 'ability', item: 'quaternion_sync' }
      ]
    };
  }

  /**
   * Calculate adaptive difficulty
   */
  private calculateAdaptiveDifficulty(): number {
    if (!this.playerProfile) return 0.5;
    
    // Base difficulty on win rate and game time
    let difficulty = 0.3;
    
    if (this.playerProfile.winRate > 0.7) {
      difficulty += 0.3;
    } else if (this.playerProfile.winRate < 0.3) {
      difficulty -= 0.2;
    }
    
    // Adjust for game time (faster = harder)
    if (this.playerProfile.averageGameTime < 15 * 60 * 1000) {
      difficulty += 0.2;
    }
    
    return Math.max(0.1, Math.min(1.0, difficulty));
  }

  /**
   * Generate converging chokepoints terrain
   */
  private generateConvergingChokepoints(): PuzzleTile[] {
    const tiles: PuzzleTile[] = [];
    
    // Create converging paths to center
    const paths = [
      { start: { x: 0, y: 350 }, end: { x: 600, y: 350 } }, // West
      { start: { x: 1200, y: 350 }, end: { x: 600, y: 350 } }, // East
      { start: { x: 600, y: 0 }, end: { x: 600, y: 350 } }, // North
      { start: { x: 600, y: 700 }, end: { x: 600, y: 350 } } // South
    ];
    
    paths.forEach(path => {
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = path.start.x + (path.end.x - path.start.x) * t;
        const y = path.start.y + (path.end.y - path.start.y) * t;
        
        tiles.push({
          x: Math.round(x),
          y: Math.round(y),
          biome: 'path',
          special: i === steps ? 'objective' : undefined
        });
      }
    });
    
    return tiles;
  }

  /**
   * Generate resource-rich terrain
   */
  private generateResourceRichTerrain(): PuzzleTile[] {
    const tiles: PuzzleTile[] = [];
    const resourceTypes = ['ore', 'energy', 'biomass', 'data'];
    
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const distance = 300;
      const x = 600 + Math.cos(angle) * distance;
      const y = 350 + Math.sin(angle) * distance;
      
      tiles.push({
        x: Math.round(x),
        y: Math.round(y),
        biome: 'resource_rich',
        resource: resourceTypes[i],
        special: 'high_yield'
      });
    }
    
    return tiles;
  }

  /**
   * Generate layered terrain
   */
  private generateLayeredTerrain(): PuzzleTile[] {
    const tiles: PuzzleTile[] = [];
    
    // Base layer
    for (let x = 0; x < 1200; x += 100) {
      for (let y = 0; y < 700; y += 100) {
        tiles.push({
          x,
          y,
          biome: 'plains'
        });
      }
    }
    
    // Add special layers
    tiles.push(
      { x: 150, y: 350, biome: 'base', special: 'player_base' },
      { x: 600, y: 350, biome: 'research', special: 'research_site' },
      { x: 1050, y: 350, biome: 'resource', special: 'resource_field' }
    );
    
    return tiles;
  }

  /**
   * Generate maze terrain
   */
  private generateMazeTerrain(): PuzzleTile[] {
    const tiles: PuzzleTile[] = [];
    
    // Create maze-like structure with resource nodes at corners
    const mazeSize = 10;
    const cellSize = 60;
    
    for (let row = 0; row < mazeSize; row++) {
      for (let col = 0; col < mazeSize; col++) {
        const x = 300 + col * cellSize;
        const y = 100 + row * cellSize;
        
        // Create walls with occasional openings
        const isWall = (row + col) % 3 === 0;
        
        tiles.push({
          x,
          y,
          biome: isWall ? 'wall' : 'path'
        });
      }
    }
    
    return tiles;
  }

  /**
   * Update player skill profile
   */
  updatePlayerProfile(profile: Partial<PlayerSkillProfile>): void {
    if (this.playerProfile) {
      this.playerProfile = { ...this.playerProfile, ...profile };
    } else {
      this.playerProfile = {
        weaknesses: [],
        strengths: [],
        preferredStrategy: 'balanced',
        averageGameTime: 20 * 60 * 1000,
        winRate: 0.5,
        ...profile
      };
    }
  }

  /**
   * Get player profile
   */
  getPlayerProfile(): PlayerSkillProfile | null {
    return this.playerProfile;
  }
}

