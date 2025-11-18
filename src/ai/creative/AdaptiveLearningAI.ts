/**
 * Adaptive Learning AI System
 * AI learns player style and adapts, can become apprentice or use player tactics
 */

export interface PlayerStyleProfile {
  playerId: string;
  preferredStrategy: 'turtle' | 'rush' | 'economic' | 'tech' | 'balanced';
  signatureMoves: string[];
  weakness: string[];
  strengths: string[];
  averageGameTime: number;
  winRate: number;
  playHistory: PlayHistoryEntry[];
}

export interface PlayHistoryEntry {
  sessionId: string;
  strategy: string;
  outcome: 'win' | 'loss';
  duration: number;
  keyDecisions: string[];
}

export interface AIApprentice {
  factionId: string;
  masterId: string;
  learningFocus: string;
  progress: number;
  learnedMoves: string[];
}

export class AdaptiveLearningAI {
  private playerProfiles: Map<string, PlayerStyleProfile> = new Map();
  private apprentices: Map<string, AIApprentice> = new Map();
  private aiFactions: Map<string, any> = new Map();

  /**
   * Learn and mirror player style
   */
  learnAndMirrorPlayer(gameState: any, playerId: string): {
    adaptedStrategy: string;
    signatureMove?: string;
  } {
    const profile = this.getOrCreateProfile(playerId);
    this.updateProfile(profile, gameState);

    // Adapt AI strategy based on player profile
    let adaptedStrategy = 'balanced';
    let signatureMove: string | undefined;

    switch (profile.preferredStrategy) {
      case 'turtle':
        adaptedStrategy = 'siege_breaker';
        break;
      case 'rush':
        adaptedStrategy = 'counter_ambush';
        break;
      case 'economic':
        adaptedStrategy = 'resource_war';
        break;
      case 'tech':
        adaptedStrategy = 'tech_race';
        break;
      default:
        adaptedStrategy = 'balanced';
    }

    // Occasionally use player's signature moves
    if (Math.random() < 0.3 && profile.signatureMoves.length > 0) {
      signatureMove = profile.signatureMoves[
        Math.floor(Math.random() * profile.signatureMoves.length)
      ];
    }

    return { adaptedStrategy, signatureMove };
  }

  /**
   * Create AI apprentices
   */
  createAIApprentices(gameState: any, playerId: string): AIApprentice[] {
    const newApprentices: AIApprentice[] = [];
    const profile = this.playerProfiles.get(playerId);
    
    if (!profile) return newApprentices;

    // Check if player demonstrates skill in specific area
    const skillAreas = this.identifyPlayerSkills(profile);
    
    skillAreas.forEach(skill => {
      const weakFaction = this.findWeakAIFaction(gameState);
      if (weakFaction && !this.apprentices.has(weakFaction.id)) {
        const apprentice: AIApprentice = {
          factionId: weakFaction.id,
          masterId: playerId,
          learningFocus: skill,
          progress: 0,
          learnedMoves: []
        };
        
        this.apprentices.set(weakFaction.id, apprentice);
        newApprentices.push({ ...apprentice });
      }
    });

    return newApprentices;
  }

  /**
   * Update apprentice learning
   */
  updateApprenticeLearning(gameState: any): void {
    this.apprentices.forEach((apprentice, factionId) => {
      const faction = this.aiFactions.get(factionId);
      const master = this.playerProfiles.get(apprentice.masterId);
      
      if (faction && master) {
        // Increase learning progress
        apprentice.progress = Math.min(1, apprentice.progress + 0.01);
        
        // Learn moves when progress reaches milestones
        if (apprentice.progress >= 0.3 && apprentice.learnedMoves.length === 0) {
          const move = this.extractMoveFromProfile(master, apprentice.learningFocus);
          if (move) {
            apprentice.learnedMoves.push(move);
          }
        }
      }
    });
  }

  /**
   * Get or create player profile
   */
  getOrCreateProfile(playerId: string): PlayerStyleProfile {
    if (!this.playerProfiles.has(playerId)) {
      this.playerProfiles.set(playerId, {
        playerId,
        preferredStrategy: 'balanced',
        signatureMoves: [],
        weakness: [],
        strengths: [],
        averageGameTime: 20 * 60 * 1000,
        winRate: 0.5,
        playHistory: []
      });
    }
    return this.playerProfiles.get(playerId)!;
  }

  /**
   * Update player profile
   */
  private updateProfile(profile: PlayerStyleProfile, gameState: any): void {
    // Analyze current game state to determine strategy
    if (gameState.players && gameState.players.length > 0) {
      const player = gameState.players[0];
      
      // Determine strategy based on resource allocation
      const resources = player.resources;
      const maxResource = Math.max(resources.ore, resources.energy, resources.biomass, resources.data);
      
      if (resources.ore === maxResource) {
        profile.preferredStrategy = 'turtle';
      } else if (resources.energy === maxResource) {
        profile.preferredStrategy = 'rush';
      } else if (resources.biomass === maxResource) {
        profile.preferredStrategy = 'economic';
      } else if (resources.data === maxResource) {
        profile.preferredStrategy = 'tech';
      }

      // Identify signature moves
      if (gameState.recentActions) {
        gameState.recentActions.forEach((action: string) => {
          if (!profile.signatureMoves.includes(action)) {
            profile.signatureMoves.push(action);
          }
        });
      }
    }
  }

  /**
   * Identify player skills
   */
  private identifyPlayerSkills(profile: PlayerStyleProfile): string[] {
    const skills: string[] = [];
    
    // Analyze signature moves to identify skills
    if (profile.signatureMoves.some(m => m.includes('flank'))) {
      skills.push('flanking_tactics');
    }
    if (profile.signatureMoves.some(m => m.includes('defense'))) {
      skills.push('defensive_positioning');
    }
    if (profile.signatureMoves.some(m => m.includes('resource'))) {
      skills.push('resource_management');
    }

    // Add based on preferred strategy
    if (profile.preferredStrategy === 'turtle') {
      skills.push('defensive_tactics');
    } else if (profile.preferredStrategy === 'rush') {
      skills.push('aggressive_tactics');
    }

    return skills;
  }

  /**
   * Find weak AI faction
   */
  private findWeakAIFaction(gameState: any): any {
    // Find faction with lowest resources
    let weakest: any = null;
    let minResources = Infinity;

    this.aiFactions.forEach((faction, id) => {
      const total = Object.values(faction.resources || {}).reduce((a: number, b: number) => a + b, 0);
      if (total < minResources) {
        minResources = total;
        weakest = faction;
      }
    });

    return weakest;
  }

  /**
   * Extract move from profile
   */
  private extractMoveFromProfile(profile: PlayerStyleProfile, focus: string): string | null {
    const relevantMoves = profile.signatureMoves.filter(m => 
      m.toLowerCase().includes(focus.toLowerCase().split('_')[0])
    );
    
    return relevantMoves.length > 0 ? relevantMoves[0] : null;
  }

  /**
   * Add AI faction
   */
  addAIFaction(faction: any): void {
    this.aiFactions.set(faction.id, faction);
  }

  /**
   * Get player profile
   */
  getPlayerProfile(playerId: string): PlayerStyleProfile | undefined {
    return this.playerProfiles.get(playerId);
  }

  /**
   * Get apprentices
   */
  getApprentices(): AIApprentice[] {
    return Array.from(this.apprentices.values());
  }
}

