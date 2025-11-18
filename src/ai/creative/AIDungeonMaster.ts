/**
 * AI Dungeon Master
 * Orchestrates game narrative, creates dramatic arcs, and generates hero moments
 */

export interface DramaticArc {
  id: string;
  type: 'comeback' | 'crisis' | 'heroic' | 'betrayal' | 'discovery';
  setup: string;
  trigger: ArcTrigger;
  resolution: string;
  active: boolean;
}

export interface ArcTrigger {
  condition: string;
  threshold: number;
  checkFunction: (gameState: any) => boolean;
}

export interface DynamicTile {
  id: string;
  type: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  activationTime: number;
  benefit: string;
  activated: boolean;
  activatedAt?: number;
}

export interface HeroicMoment {
  id: string;
  type: 'last_stand' | 'comeback' | 'sacrifice' | 'discovery';
  description: string;
  setup: string;
  reward: string;
  active: boolean;
}

export class AIDungeonMaster {
  private arcs: Map<string, DramaticArc> = new Map();
  private dynamicTiles: Map<string, DynamicTile> = new Map();
  private heroicMoments: Map<string, HeroicMoment> = new Map();
  private playerState: {
    isLosing: boolean;
    isDominating: boolean;
    hasLoneUnit: boolean;
    lastCheck: number;
  } = {
    isLosing: false,
    isDominating: false,
    hasLoneUnit: false,
    lastCheck: 0
  };

  constructor() {
    this.initializeArcs();
  }

  /**
   * Initialize dramatic arcs
   */
  private initializeArcs(): void {
    // Comeback opportunity arc
    this.arcs.set('comeback', {
      id: 'comeback',
      type: 'comeback',
      setup: 'A forgotten power awakens...',
      trigger: {
        condition: 'player_losing',
        threshold: 0.3,
        checkFunction: (state) => {
          if (!state.players || state.players.length === 0) return false;
          const player = state.players[0];
          const totalResources = player.resources.ore + player.resources.energy + 
                                player.resources.biomass + player.resources.data;
          return totalResources < 500; // Very low resources
        }
      },
      resolution: 'Ancient War Machine activated',
      active: false
    });

    // Crisis event arc
    this.arcs.set('crisis', {
      id: 'crisis',
      type: 'crisis',
      setup: 'A sudden crisis threatens your dominance...',
      trigger: {
        condition: 'player_dominating',
        threshold: 0.7,
        checkFunction: (state) => {
          if (!state.players || state.players.length === 0) return false;
          const player = state.players[0];
          const totalResources = player.resources.ore + player.resources.energy + 
                                player.resources.biomass + player.resources.data;
          return totalResources > 15000; // Very high resources
        }
      },
      resolution: 'Crisis event triggered to restore challenge',
      active: false
    });

    // Heroic last stand arc
    this.arcs.set('heroic', {
      id: 'heroic',
      type: 'heroic',
      setup: 'A lone unit stands against impossible odds...',
      trigger: {
        condition: 'lone_unit',
        threshold: 1,
        checkFunction: (state) => {
          // Check if player has a single unit in enemy territory
          return this.hasLoneUnitInEnemyTerritory(state);
        }
      },
      resolution: 'Heroic last stand completed',
      active: false
    });
  }

  /**
   * Orchestrate game narrative based on current state
   */
  orchestrateGameNarrative(gameState: any): {
    arcs: DramaticArc[];
    tiles: DynamicTile[];
    moments: HeroicMoment[];
  } {
    const now = Date.now();
    
    // Update player state
    this.updatePlayerState(gameState);
    
    const triggeredArcs: DramaticArc[] = [];
    const newTiles: DynamicTile[] = [];
    const newMoments: HeroicMoment[] = [];

    // Check each arc
    this.arcs.forEach((arc, id) => {
      if (!arc.active && arc.trigger.checkFunction(gameState)) {
        arc.active = true;
        triggeredArcs.push({ ...arc });

        // Execute arc-specific actions
        switch (arc.type) {
          case 'comeback': {
            const comebackTile = this.generateComebackOpportunity(gameState);
            if (comebackTile) {
              newTiles.push(comebackTile);
              this.dynamicTiles.set(comebackTile.id, comebackTile);
            }
            break;
          }

          case 'crisis': {
            const crisisEvent = this.generateCrisisEvent(gameState);
            if (crisisEvent) {
              newTiles.push(crisisEvent);
              this.dynamicTiles.set(crisisEvent.id, crisisEvent);
            }
            break;
          }

          case 'heroic': {
            const heroicMoment = this.setupHeroicLastStand(gameState);
            if (heroicMoment) {
              newMoments.push(heroicMoment);
              this.heroicMoments.set(heroicMoment.id, heroicMoment);
            }
            break;
          }
        }
      }
    });

    return {
      arcs: triggeredArcs,
      tiles: newTiles,
      moments: newMoments
    };
  }

  /**
   * Generate comeback opportunity
   */
  private generateComebackOpportunity(gameState: any): DynamicTile | null {
    if (!gameState.players || gameState.players.length === 0) return null;
    
    const player = gameState.players[0];
    const baseLocation = { x: 150, y: 350 }; // Default player base
    
    const tile: DynamicTile = {
      id: `dynamic_tile_${Date.now()}`,
      type: 'ancient_war_machine',
      name: 'Ancient War Machine',
      description: 'A forgotten power awakens near your base. Activate it to gain a temporary super unit.',
      position: {
        x: baseLocation.x + (Math.random() - 0.5) * 200,
        y: baseLocation.y + (Math.random() - 0.5) * 200
      },
      activationTime: 30000, // 30 seconds
      benefit: 'Grants temporary super unit with 3x damage and 2x health',
      activated: false
    };

    return tile;
  }

  /**
   * Generate crisis event
   */
  private generateCrisisEvent(gameState: any): DynamicTile | null {
    if (!gameState.players || gameState.players.length === 0) return null;
    
    const player = gameState.players[0];
    const baseLocation = { x: 150, y: 350 };
    
    // Create environmental crisis
    const tile: DynamicTile = {
      id: `crisis_tile_${Date.now()}`,
      type: 'environmental_crisis',
      name: 'Resource Collapse',
      description: 'Over-extraction has triggered a resource collapse. All resource generation reduced by 50% for 2 minutes.',
      position: baseLocation,
      activationTime: 0, // Immediate
      benefit: 'Challenge: Survive resource scarcity',
      activated: false
    };

    return tile;
  }

  /**
   * Setup heroic last stand
   */
  private setupHeroicLastStand(gameState: any): HeroicMoment | null {
    if (!this.hasLoneUnitInEnemyTerritory(gameState)) return null;

    const moment: HeroicMoment = {
      id: `heroic_${Date.now()}`,
      type: 'last_stand',
      description: 'Your lone unit stands against impossible odds in enemy territory',
      setup: 'The unit gains temporary invincibility and 5x damage for 30 seconds',
      reward: 'If unit survives, gain permanent +20% damage bonus for all units',
      active: true
    };

    return moment;
  }

  /**
   * Check if player has lone unit in enemy territory
   */
  private hasLoneUnitInEnemyTerritory(gameState: any): boolean {
    // Simplified check - would need actual unit positions
    if (gameState.playerUnits && gameState.playerUnits.length === 1) {
      const unit = gameState.playerUnits[0];
      // Check if unit is far from base (in "enemy territory")
      const baseDistance = Math.sqrt(
        Math.pow(unit.x - 150, 2) + Math.pow(unit.y - 350, 2)
      );
      return baseDistance > 400;
    }
    return false;
  }

  /**
   * Update player state
   */
  private updatePlayerState(gameState: any): void {
    if (!gameState.players || gameState.players.length === 0) return;
    
    const player = gameState.players[0];
    const totalResources = player.resources.ore + player.resources.energy + 
                          player.resources.biomass + player.resources.data;
    
    this.playerState.isLosing = totalResources < 500;
    this.playerState.isDominating = totalResources > 15000;
    this.playerState.hasLoneUnit = this.hasLoneUnitInEnemyTerritory(gameState);
    this.playerState.lastCheck = Date.now();
  }

  /**
   * Activate dynamic tile
   */
  activateDynamicTile(tileId: string): boolean {
    const tile = this.dynamicTiles.get(tileId);
    if (tile && !tile.activated) {
      tile.activated = true;
      tile.activatedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Get active dynamic tiles
   */
  getActiveDynamicTiles(): DynamicTile[] {
    return Array.from(this.dynamicTiles.values()).filter(t => !t.activated);
  }

  /**
   * Get active heroic moments
   */
  getActiveHeroicMoments(): HeroicMoment[] {
    return Array.from(this.heroicMoments.values()).filter(m => m.active);
  }

  /**
   * Complete heroic moment
   */
  completeHeroicMoment(momentId: string, success: boolean): void {
    const moment = this.heroicMoments.get(momentId);
    if (moment) {
      moment.active = false;
      // Apply reward if successful
      if (success) {
        // Reward would be applied to game state
        console.log(`Heroic moment completed: ${moment.reward}`);
      }
    }
  }
}

