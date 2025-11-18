/**
 * Procedural Personas for Automated Playtesting
 * 
 * Implements different player archetypes that simulate distinct play styles
 * for comprehensive game balance testing. Based on research from:
 * - Holmgård et al., "Automated Playtesting with Procedural Personas through MCTS with Evolved Heuristics"
 * 
 * Each persona uses evolved heuristics to replace standard UCB1 criterion in MCTS,
 * creating synthetic playtesters that reveal how different player populations experience game content.
 */

export enum PersonaType {
  EFFICIENCY_EXPERT = 'efficiency_expert',
  EXPLORER = 'explorer',
  CAUTIOUS_NAVIGATOR = 'cautious_navigator',
  SOCIAL_NAVIGATOR = 'social_navigator',
  ADVENTUROUS_PLAYER = 'adventurous_player',
  AGGRESSIVE_RUSHER = 'aggressive_rusher',
  DEFENSIVE_TURTLER = 'defensive_turtler',
  TECH_FOCUSED = 'tech_focused'
}

export interface PersonaTraits {
  // Core personality traits (0-1 scale)
  aggressiveness: number;        // How likely to attack vs defend
  explorationDrive: number;       // Preference for exploring vs optimizing known areas
  riskTolerance: number;          // Willingness to take risks
  patience: number;               // Preference for long-term vs short-term gains
  innovationDrive: number;        // Preference for novel strategies vs proven ones
  efficiencyFocus: number;       // Focus on optimal resource usage
  socialPreference: number;       // Preference for populated routes/cooperative play
  techFocus: number;              // Preference for technology research
  
  // Strategy weights
  economyWeight: number;          // Weight for economic actions
  militaryWeight: number;         // Weight for military actions
  expansionWeight: number;        // Weight for expansion actions
  researchWeight: number;         // Weight for research actions
}

export interface PersonaEvaluation {
  action: any;
  score: number;
  reasoning: string;
}

/**
 * Procedural Persona - Base class for different play styles
 */
export class ProceduralPersona {
  public type: PersonaType;
  public traits: PersonaTraits;
  public name: string;
  public description: string;

  constructor(type: PersonaType, traits: PersonaTraits) {
    this.type = type;
    this.traits = traits;
    this.name = this.getName();
    this.description = this.getDescription();
  }

  /**
   * Evaluate an action from this persona's perspective
   * This replaces the standard UCB1 evaluation in MCTS
   */
  evaluateAction(gameState: any, playerId: number, action: any, situation?: any): number {
    const baseScore = this.getBaseActionScore(gameState, playerId, action, situation);
    const personaModifier = this.applyPersonaModifiers(action, situation);
    return baseScore * personaModifier;
  }

  /**
   * Get base score for an action (shared logic)
   */
  protected getBaseActionScore(gameState: any, playerId: number, action: any, situation?: any): number {
    const player = gameState.players?.get?.(playerId) || gameState.players?.[playerId];
    if (!player) return 0;

    let score = 0.5; // Base score

    // Economy actions
    if (action.type === 'build_unit' && action.unitType === 'WORKER') {
      const workerCount = this.getWorkerCount(gameState, playerId);
      score = workerCount < 8 ? 0.8 : (workerCount < 12 ? 0.5 : 0.2);
      score *= this.traits.economyWeight;
    }

    // Military actions
    if (action.type === 'build_unit' && action.unitType !== 'WORKER') {
      const armySize = this.getArmySize(gameState, playerId);
      score = 0.6 + (armySize < 5 ? 0.2 : 0);
      score *= this.traits.militaryWeight;
      
      // Adjust based on aggressiveness
      if (this.traits.aggressiveness > 0.6) {
        score *= 1.3;
      }
    }

    // Expansion actions
    if (action.type === 'build_building' && action.buildingType === 'BASE') {
      score = 0.7;
      score *= this.traits.expansionWeight;
      
      // Adjust based on exploration drive
      if (this.traits.explorationDrive > 0.6) {
        score *= 1.2;
      }
    }

    // Research/tech actions
    if (action.type === 'research' || action.type === 'tech') {
      score = 0.6;
      score *= this.traits.researchWeight;
      score *= this.traits.techFocus;
    }

    // Army actions
    if (action.type === 'army_action') {
      if (action.action === 'attack') {
        score = this.traits.aggressiveness * 0.9;
        score *= this.traits.militaryWeight;
      } else if (action.action === 'defend') {
        score = (1 - this.traits.aggressiveness) * 0.7;
        score *= this.traits.militaryWeight;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Apply persona-specific modifiers to action scores
   */
  protected applyPersonaModifiers(action: any, situation?: any): number {
    let modifier = 1.0;

    // Risk tolerance affects risky actions
    if (action.riskLevel && action.riskLevel > 0.5) {
      modifier *= (0.5 + this.traits.riskTolerance);
    }

    // Patience affects long-term vs short-term actions
    if (action.timeHorizon === 'long') {
      modifier *= (0.7 + this.traits.patience * 0.3);
    } else if (action.timeHorizon === 'short') {
      modifier *= (0.7 + (1 - this.traits.patience) * 0.3);
    }

    // Innovation drive affects novel actions
    if (action.novelty && action.novelty > 0.5) {
      modifier *= (0.6 + this.traits.innovationDrive * 0.4);
    }

    // Efficiency focus affects resource-optimal actions
    if (action.efficiency && action.efficiency > 0.7) {
      modifier *= (0.7 + this.traits.efficiencyFocus * 0.3);
    }

    // Threat response based on risk tolerance
    if (situation?.threat?.level) {
      const threatLevel = situation.threat.level;
      if (threatLevel > 0.5 && this.traits.riskTolerance < 0.3) {
        // Low risk tolerance + high threat = defensive modifier
        modifier *= 1.2;
      } else if (threatLevel < 0.3 && this.traits.aggressiveness > 0.7) {
        // High aggression + low threat = offensive modifier
        modifier *= 1.2;
      }
    }

    return modifier;
  }

  /**
   * Get UCB1 exploration constant for this persona
   * Different personas explore differently
   */
  getExplorationConstant(): number {
    // Explorers and adventurous players explore more
    if (this.traits.explorationDrive > 0.7 || this.traits.innovationDrive > 0.7) {
      return 2.0; // Higher exploration
    }
    
    // Efficiency experts explore less (exploit known good moves)
    if (this.traits.efficiencyFocus > 0.7) {
      return 0.8; // Lower exploration
    }
    
    return 1.41; // Default UCB1 constant
  }

  /**
   * Get number of MCTS rollouts for this persona
   */
  getRolloutCount(): number {
    // Efficiency experts do more rollouts (more thorough)
    if (this.traits.efficiencyFocus > 0.7) {
      return 500;
    }
    
    // Adventurous players do fewer rollouts (more random)
    if (this.traits.innovationDrive > 0.7) {
      return 100;
    }
    
    return 200; // Default
  }

  protected getWorkerCount(gameState: any, playerId: number): number {
    const units = gameState.units || [];
    return units.filter((u: any) => 
      u.playerId === playerId && u.type === 'WORKER'
    ).length;
  }

  protected getArmySize(gameState: any, playerId: number): number {
    const units = gameState.units || [];
    return units.filter((u: any) => 
      u.playerId === playerId && u.type !== 'WORKER'
    ).length;
  }

  protected getName(): string {
    const names: Record<PersonaType, string> = {
      [PersonaType.EFFICIENCY_EXPERT]: 'Efficiency Expert',
      [PersonaType.EXPLORER]: 'Explorer',
      [PersonaType.CAUTIOUS_NAVIGATOR]: 'Cautious Navigator',
      [PersonaType.SOCIAL_NAVIGATOR]: 'Social Navigator',
      [PersonaType.ADVENTUROUS_PLAYER]: 'Adventurous Player',
      [PersonaType.AGGRESSIVE_RUSHER]: 'Aggressive Rusher',
      [PersonaType.DEFENSIVE_TURTLER]: 'Defensive Turtler',
      [PersonaType.TECH_FOCUSED]: 'Tech Focused'
    };
    return names[this.type] || 'Unknown Persona';
  }

  protected getDescription(): string {
    const descriptions: Record<PersonaType, string> = {
      [PersonaType.EFFICIENCY_EXPERT]: 'Pursues shortest paths and maximum score accumulation. Optimizes resource usage.',
      [PersonaType.EXPLORER]: 'Seeks novel strategies and detours. Prefers exploring unknown areas.',
      [PersonaType.CAUTIOUS_NAVIGATOR]: 'Prioritizes risk avoidance. Defensive play style.',
      [PersonaType.SOCIAL_NAVIGATOR]: 'Prefers populated routes and cooperative play patterns.',
      [PersonaType.ADVENTUROUS_PLAYER]: 'Embraces novel and challenging situations. High risk tolerance.',
      [PersonaType.AGGRESSIVE_RUSHER]: 'Focuses on early military aggression. Low patience.',
      [PersonaType.DEFENSIVE_TURTLER]: 'Builds strong defenses before attacking. High patience.',
      [PersonaType.TECH_FOCUSED]: 'Prioritizes technology research and upgrades.'
    };
    return descriptions[this.type] || 'Unknown persona description';
  }
}

/**
 * Factory for creating predefined personas
 */
export class PersonaFactory {
  static create(type: PersonaType): ProceduralPersona {
    switch (type) {
      case PersonaType.EFFICIENCY_EXPERT:
        return new ProceduralPersona(type, {
          aggressiveness: 0.4,
          explorationDrive: 0.2,
          riskTolerance: 0.3,
          patience: 0.8,
          innovationDrive: 0.2,
          efficiencyFocus: 0.9,
          socialPreference: 0.3,
          techFocus: 0.5,
          economyWeight: 0.6,
          militaryWeight: 0.3,
          expansionWeight: 0.4,
          researchWeight: 0.3
        });

      case PersonaType.EXPLORER:
        return new ProceduralPersona(type, {
          aggressiveness: 0.5,
          explorationDrive: 0.9,
          riskTolerance: 0.7,
          patience: 0.4,
          innovationDrive: 0.8,
          efficiencyFocus: 0.3,
          socialPreference: 0.5,
          techFocus: 0.4,
          economyWeight: 0.3,
          militaryWeight: 0.4,
          expansionWeight: 0.8,
          researchWeight: 0.3
        });

      case PersonaType.CAUTIOUS_NAVIGATOR:
        return new ProceduralPersona(type, {
          aggressiveness: 0.2,
          explorationDrive: 0.3,
          riskTolerance: 0.1,
          patience: 0.9,
          innovationDrive: 0.2,
          efficiencyFocus: 0.6,
          socialPreference: 0.4,
          techFocus: 0.5,
          economyWeight: 0.5,
          militaryWeight: 0.2,
          expansionWeight: 0.3,
          researchWeight: 0.4
        });

      case PersonaType.SOCIAL_NAVIGATOR:
        return new ProceduralPersona(type, {
          aggressiveness: 0.4,
          explorationDrive: 0.5,
          riskTolerance: 0.5,
          patience: 0.6,
          innovationDrive: 0.4,
          efficiencyFocus: 0.4,
          socialPreference: 0.9,
          techFocus: 0.4,
          economyWeight: 0.4,
          militaryWeight: 0.4,
          expansionWeight: 0.6,
          researchWeight: 0.3
        });

      case PersonaType.ADVENTUROUS_PLAYER:
        return new ProceduralPersona(type, {
          aggressiveness: 0.7,
          explorationDrive: 0.8,
          riskTolerance: 0.9,
          patience: 0.3,
          innovationDrive: 0.9,
          efficiencyFocus: 0.2,
          socialPreference: 0.5,
          techFocus: 0.4,
          economyWeight: 0.3,
          militaryWeight: 0.6,
          expansionWeight: 0.7,
          researchWeight: 0.3
        });

      case PersonaType.AGGRESSIVE_RUSHER:
        return new ProceduralPersona(type, {
          aggressiveness: 0.95,
          explorationDrive: 0.3,
          riskTolerance: 0.8,
          patience: 0.1,
          innovationDrive: 0.3,
          efficiencyFocus: 0.4,
          socialPreference: 0.2,
          techFocus: 0.2,
          economyWeight: 0.2,
          militaryWeight: 0.9,
          expansionWeight: 0.3,
          researchWeight: 0.1
        });

      case PersonaType.DEFENSIVE_TURTLER:
        return new ProceduralPersona(type, {
          aggressiveness: 0.1,
          explorationDrive: 0.2,
          riskTolerance: 0.1,
          patience: 0.95,
          innovationDrive: 0.2,
          efficiencyFocus: 0.7,
          socialPreference: 0.3,
          techFocus: 0.6,
          economyWeight: 0.6,
          militaryWeight: 0.1,
          expansionWeight: 0.2,
          researchWeight: 0.7
        });

      case PersonaType.TECH_FOCUSED:
        return new ProceduralPersona(type, {
          aggressiveness: 0.4,
          explorationDrive: 0.4,
          riskTolerance: 0.5,
          patience: 0.8,
          innovationDrive: 0.6,
          efficiencyFocus: 0.6,
          socialPreference: 0.3,
          techFocus: 0.95,
          economyWeight: 0.4,
          militaryWeight: 0.3,
          expansionWeight: 0.4,
          researchWeight: 0.9
        });

      default:
        return PersonaFactory.create(PersonaType.EFFICIENCY_EXPERT);
    }
  }

  /**
   * Create all personas for comprehensive testing
   */
  static createAll(): ProceduralPersona[] {
    return Object.values(PersonaType).map(type => PersonaFactory.create(type));
  }

  /**
   * Create a random persona (for variety)
   */
  static createRandom(seed?: number): ProceduralPersona {
    const types = Object.values(PersonaType);
    const random = seed ? this.seededRandom(seed) : Math.random();
    const index = Math.floor(random * types.length);
    return PersonaFactory.create(types[index]);
  }

  private static seededRandom(seed: number): number {
    // Simple seeded random
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}

