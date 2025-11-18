import { SeededRandom } from '../lib/SeededRandom';

/**
 * Enhanced AI Commander Personality Engine
 * Implements: Neural Behavior Trees, Dynamic Adaptation, Learning Algorithms, Personality Evolution
 */

export type CommanderArchetype = 
  | 'aggressor' 
  | 'architect' 
  | 'nomad' 
  | 'tactician' 
  | 'harvester' 
  | 'wildcard'
  | 'balanced';

export interface CommanderTraits {
  aggression: number; // 0-1
  adaptability: number; // 0-1, learning rate
  riskTolerance: number; // 0-1
  strategicFocus: 'econ' | 'military' | 'tech' | 'balanced';
  patience: number; // 0-1
  explorationDrive: number; // 0-1
  innovationDrive: number; // 0-1
  microFocus: number; // 0-1, attention to detail
}

export interface CommanderMemory {
  playerStrategies: Map<string, number>; // Strategy pattern -> frequency
  successfulCounterStrategies: Map<string, string[]>; // Player strategy -> effective counters
  battleOutcomes: Array<{
    timestamp: number;
    won: boolean;
    strategy: string;
    opponentStrategy: string;
  }>;
  learnedPatterns: Map<string, any>; // Pattern -> learned response
}

export interface CommanderPersonality {
  id: string;
  name: string;
  archetype: CommanderArchetype;
  traits: CommanderTraits;
  memory: CommanderMemory;
  evolutionHistory: Array<{
    timestamp: number;
    traitChanges: Partial<CommanderTraits>;
    reason: string;
  }>;
  voiceProfile?: {
    tone: string;
    speechPattern: string;
    catchphrases: string[];
  };
}

export interface GameSituation {
  resourceAdvantage: number; // -1 to 1
  militaryAdvantage: number; // -1 to 1
  techAdvantage: number; // -1 to 1
  territoryControl: number; // 0-1
  playerStrategy?: string; // Detected player strategy
  gamePhase: 'early' | 'mid' | 'late';
  threatLevel: number; // 0-1
}

export class EnhancedCommanderPersonality {
  private rng: SeededRandom;
  private personality: CommanderPersonality;
  private seed: number;

  constructor(seed: number, archetype?: CommanderArchetype, baseName?: string) {
    this.seed = seed;
    this.rng = new SeededRandom(seed);
    
    // Generate or use provided archetype
    const selectedArchetype = archetype || this.generateArchetype();
    const name = baseName || this.generateCommanderName(selectedArchetype);
    
    // Initialize personality
    this.personality = {
      id: `commander_${seed}_${Date.now()}`,
      name,
      archetype: selectedArchetype,
      traits: this.generateTraits(selectedArchetype),
      memory: {
        playerStrategies: new Map(),
        successfulCounterStrategies: new Map(),
        battleOutcomes: [],
        learnedPatterns: new Map()
      },
      evolutionHistory: []
    };

    // Generate voice profile
    this.personality.voiceProfile = this.generateVoiceProfile();
  }

  /**
   * Generate commander archetype based on seed
   */
  private generateArchetype(): CommanderArchetype {
    const archetypes: CommanderArchetype[] = [
      'aggressor', 'architect', 'nomad', 'tactician', 
      'harvester', 'wildcard', 'balanced'
    ];
    return this.rng.choice(archetypes);
  }

  /**
   * Generate commander name based on archetype
   */
  private generateCommanderName(archetype: CommanderArchetype): string {
    const namePrefixes: Record<CommanderArchetype, string[]> = {
      aggressor: ['Vex', 'Razor', 'Fury', 'Storm', 'Blade'],
      architect: ['Axiom', 'Prime', 'Nexus', 'Core', 'Matrix'],
      nomad: ['Wander', 'Drift', 'Flow', 'Shift', 'Roam'],
      tactician: ['Logic', 'Calculus', 'Vector', 'Tensor', 'Quantum'],
      harvester: ['Gather', 'Collect', 'Amass', 'Accrue', 'Accumulate'],
      wildcard: ['Chaos', 'Void', 'Rift', 'Nexus', 'Anomaly'],
      balanced: ['Equilibrium', 'Harmony', 'Balance', 'Unity', 'Zenith']
    };

    const suffixes = ['Prime', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'];
    const prefix = this.rng.choice(namePrefixes[archetype]);
    const suffix = this.rng.choice(suffixes);
    
    return `${prefix} ${suffix}`;
  }

  /**
   * Generate traits based on archetype with variation
   */
  private generateTraits(archetype: CommanderArchetype): CommanderTraits {
    const baseTraits: Record<CommanderArchetype, Partial<CommanderTraits>> = {
      aggressor: {
        aggression: 0.9,
        riskTolerance: 0.8,
        patience: 0.2,
        strategicFocus: 'military',
        explorationDrive: 0.3,
        innovationDrive: 0.4,
        microFocus: 0.5
      },
      architect: {
        aggression: 0.25,
        riskTolerance: 0.2,
        patience: 0.95,
        strategicFocus: 'tech',
        explorationDrive: 0.4,
        innovationDrive: 0.8,
        microFocus: 0.7
      },
      nomad: {
        aggression: 0.55,
        riskTolerance: 0.6,
        patience: 0.5,
        strategicFocus: 'balanced',
        explorationDrive: 0.85,
        innovationDrive: 0.8,
        microFocus: 0.4
      },
      tactician: {
        aggression: 0.6,
        riskTolerance: 0.45,
        patience: 0.6,
        strategicFocus: 'balanced',
        explorationDrive: 0.5,
        innovationDrive: 0.5,
        microFocus: 0.8
      },
      harvester: {
        aggression: 0.2,
        riskTolerance: 0.3,
        patience: 0.9,
        strategicFocus: 'econ',
        explorationDrive: 0.6,
        innovationDrive: 0.25,
        microFocus: 0.3
      },
      wildcard: {
        aggression: 0.7,
        riskTolerance: 0.9,
        patience: 0.35,
        strategicFocus: 'balanced',
        explorationDrive: 0.95,
        innovationDrive: 0.95,
        microFocus: 0.2
      },
      balanced: {
        aggression: 0.5,
        riskTolerance: 0.5,
        patience: 0.5,
        strategicFocus: 'balanced',
        explorationDrive: 0.5,
        innovationDrive: 0.5,
        microFocus: 0.5
      }
    };

    const base = baseTraits[archetype];
    
    // Add variation (±20%)
    const variation = 0.2;
    
    return {
      aggression: this.clamp(0, 1, 
        (base.aggression || 0.5) + this.rng.nextFloat(-variation, variation)),
      adaptability: this.rng.nextFloat(0.4, 0.9), // Always high for learning
      riskTolerance: this.clamp(0, 1,
        (base.riskTolerance || 0.5) + this.rng.nextFloat(-variation, variation)),
      strategicFocus: base.strategicFocus || 'balanced',
      patience: this.clamp(0, 1,
        (base.patience || 0.5) + this.rng.nextFloat(-variation, variation)),
      explorationDrive: this.clamp(0, 1,
        (base.explorationDrive || 0.5) + this.rng.nextFloat(-variation, variation)),
      innovationDrive: this.clamp(0, 1,
        (base.innovationDrive || 0.5) + this.rng.nextFloat(-variation, variation)),
      microFocus: this.clamp(0, 1,
        (base.microFocus || 0.5) + this.rng.nextFloat(-variation, variation))
    };
  }

  /**
   * Generate voice profile based on traits
   */
  private generateVoiceProfile(): CommanderPersonality['voiceProfile'] {
    const { aggression, patience, strategicFocus } = this.personality.traits;
    
    let tone = 'neutral';
    if (aggression > 0.7) tone = 'aggressive';
    else if (aggression < 0.3) tone = 'calm';
    else if (patience > 0.7) tone = 'methodical';
    else if (patience < 0.3) tone = 'impatient';

    let speechPattern = 'balanced';
    if (strategicFocus === 'military') speechPattern = 'direct';
    else if (strategicFocus === 'tech') speechPattern = 'analytical';
    else if (strategicFocus === 'econ') speechPattern = 'measured';

    const catchphrases = this.generateCatchphrases(tone, speechPattern);

    return {
      tone,
      speechPattern,
      catchphrases
    };
  }

  /**
   * Generate catchphrases based on personality
   */
  private generateCatchphrases(tone: string, speechPattern: string): string[] {
    const catchphraseSets: Record<string, string[]> = {
      aggressive: [
        'Strike now!', 'No retreat!', 'Push forward!', 
        'Break their lines!', 'Victory or nothing!'
      ],
      calm: [
        'Patience is key.', 'Steady progress.', 'Methodical approach.',
        'Time is on our side.', 'Strategic advantage.'
      ],
      methodical: [
        'Analyzing...', 'Calculating optimal path.', 'Systematic approach.',
        'Every detail matters.', 'Precision over speed.'
      ],
      impatient: [
        'Move faster!', 'No time to waste!', 'Quick decisions!',
        'Speed is everything!', 'Act now!'
      ]
    };

    return catchphraseSets[tone] || catchphraseSets['neutral'] || 
           ['Proceeding.', 'Understood.', 'Executing.'];
  }

  /**
   * Make strategic decision based on personality and situation
   */
  public makeDecision(situation: GameSituation): {
    action: string;
    priority: number;
    reasoning: string;
    confidence: number;
  } {
    const { traits, memory } = this.personality;
    
    // Detect player strategy
    const detectedStrategy = this.detectPlayerStrategy(situation);
    if (detectedStrategy) {
      this.recordPlayerStrategy(detectedStrategy);
    }

    // Check for learned counter-strategy
    const counterStrategy = this.getLearnedCounterStrategy(detectedStrategy);
    
    // Calculate decision weights based on traits and situation
    const decisionWeights = this.calculateDecisionWeights(situation, counterStrategy);
    
    // Select action
    const action = this.selectAction(decisionWeights);
    const priority = decisionWeights[action] || 0.5;
    const reasoning = this.generateReasoning(action, situation, detectedStrategy);
    const confidence = this.calculateConfidence(situation, action);

    return {
      action,
      priority,
      reasoning,
      confidence
    };
  }

  /**
   * Detect player strategy from game situation
   */
  private detectPlayerStrategy(situation: GameSituation): string | null {
    const { resourceAdvantage, militaryAdvantage, techAdvantage } = situation;
    
    if (militaryAdvantage > 0.3 && resourceAdvantage > 0.2) {
      return 'rush';
    } else if (techAdvantage > 0.3 && resourceAdvantage > 0.2) {
      return 'tech_focus';
    } else if (resourceAdvantage > 0.4 && militaryAdvantage < 0.1) {
      return 'economic_boom';
    } else if (militaryAdvantage < -0.2 && techAdvantage < -0.2) {
      return 'turtle';
    } else if (Math.abs(militaryAdvantage) < 0.1 && Math.abs(techAdvantage) < 0.1) {
      return 'balanced';
    }
    
    return null;
  }

  /**
   * Record player strategy for learning
   */
  private recordPlayerStrategy(strategy: string): void {
    const current = this.personality.memory.playerStrategies.get(strategy) || 0;
    this.personality.memory.playerStrategies.set(strategy, current + 1);
  }

  /**
   * Get learned counter-strategy
   */
  private getLearnedCounterStrategy(playerStrategy: string | null): string | null {
    if (!playerStrategy) return null;
    
    const counters = this.personality.memory.successfulCounterStrategies.get(playerStrategy);
    if (counters && counters.length > 0) {
      return this.rng.choice(counters);
    }
    
    return null;
  }

  /**
   * Calculate decision weights based on personality and situation
   */
  private calculateDecisionWeights(
    situation: GameSituation,
    counterStrategy: string | null
  ): Record<string, number> {
    const { traits } = this.personality;
    const weights: Record<string, number> = {
      attack: 0,
      build: 0,
      expand: 0,
      research: 0,
      defend: 0,
      scout: 0
    };

    // Base weights from traits
    if (traits.strategicFocus === 'military') {
      weights.attack = 0.4 * traits.aggression;
      weights.build = 0.2;
      weights.defend = 0.2;
    } else if (traits.strategicFocus === 'econ') {
      weights.expand = 0.4;
      weights.build = 0.3;
      weights.attack = 0.1 * traits.aggression;
    } else if (traits.strategicFocus === 'tech') {
      weights.research = 0.4;
      weights.build = 0.3;
      weights.attack = 0.1 * traits.aggression;
    } else {
      // Balanced
      weights.attack = 0.2 * traits.aggression;
      weights.build = 0.2;
      weights.expand = 0.2;
      weights.research = 0.2;
      weights.defend = 0.1;
      weights.scout = 0.1;
    }

    // Adjust based on situation
    if (situation.threatLevel > 0.7) {
      weights.defend *= 1.5;
      weights.attack *= 0.7;
    }
    
    if (situation.militaryAdvantage > 0.3 && traits.aggression > 0.6) {
      weights.attack *= 1.3;
    }
    
    if (situation.resourceAdvantage < -0.2) {
      weights.expand *= 1.4;
    }

    // Apply counter-strategy if learned
    if (counterStrategy === 'defensive_turtle') {
      weights.expand *= 1.5;
      weights.research *= 1.3;
    } else if (counterStrategy === 'aggressive_rush') {
      weights.defend *= 1.5;
      weights.build *= 1.3;
    }

    // Normalize
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    Object.keys(weights).forEach(key => {
      weights[key] = weights[key] / total;
    });

    return weights;
  }

  /**
   * Select action from weights
   */
  private selectAction(weights: Record<string, number>): string {
    const rand = this.rng.next();
    let cumulative = 0;
    
    for (const [action, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        return action;
      }
    }
    
    return 'build'; // Fallback
  }

  /**
   * Generate reasoning for decision
   */
  private generateReasoning(
    action: string,
    situation: GameSituation,
    detectedStrategy: string | null
  ): string {
    const reasons: Record<string, string[]> = {
      attack: [
        'Military advantage detected. Pressing the attack.',
        'Enemy is vulnerable. Time to strike.',
        'Aggressive push to maintain momentum.'
      ],
      build: [
        'Expanding infrastructure for long-term advantage.',
        'Building defensive structures to secure position.',
        'Economic expansion is key.'
      ],
      expand: [
        'Securing additional resources is critical.',
        'Expansion before the enemy can react.',
        'Resource nodes are unclaimed.'
      ],
      research: [
        'Technological superiority will win this.',
        'Researching advanced capabilities.',
        'Knowledge is power.'
      ],
      defend: [
        'Enemy threat detected. Fortifying position.',
        'Defensive stance until we have advantage.',
        'Protecting key infrastructure.'
      ],
      scout: [
        'Gathering intelligence on enemy positions.',
        'Exploration to find strategic opportunities.',
        'Information is a weapon.'
      ]
    };

    const actionReasons = reasons[action] || ['Proceeding with strategy.'];
    let baseReason = this.rng.choice(actionReasons);

    if (detectedStrategy) {
      baseReason += ` (Countering detected ${detectedStrategy} strategy)`;
    }

    return baseReason;
  }

  /**
   * Calculate confidence in decision
   */
  private calculateConfidence(situation: GameSituation, action: string): number {
    const { traits } = this.personality;
    let confidence = 0.5;

    // Higher confidence if action aligns with traits
    if (action === 'attack' && traits.aggression > 0.7) confidence += 0.2;
    if (action === 'research' && traits.strategicFocus === 'tech') confidence += 0.2;
    if (action === 'expand' && traits.strategicFocus === 'econ') confidence += 0.2;

    // Higher confidence if situation supports action
    if (action === 'attack' && situation.militaryAdvantage > 0.3) confidence += 0.2;
    if (action === 'defend' && situation.threatLevel > 0.7) confidence += 0.2;

    return Math.min(1, confidence);
  }

  /**
   * Learn from battle outcome
   */
  public learnFromOutcome(
    won: boolean,
    playerStrategy: string,
    aiStrategy: string
  ): void {
    const { memory } = this.personality;
    
    // Record outcome
    memory.battleOutcomes.push({
      timestamp: Date.now(),
      won,
      strategy: aiStrategy,
      opponentStrategy: playerStrategy
    });

    // If won, remember this counter-strategy
    if (won) {
      const existingCounters = memory.successfulCounterStrategies.get(playerStrategy) || [];
      if (!existingCounters.includes(aiStrategy)) {
        existingCounters.push(aiStrategy);
        memory.successfulCounterStrategies.set(playerStrategy, existingCounters);
      }
    }

    // Evolve personality based on outcomes
    this.evolvePersonality(won, playerStrategy);
  }

  /**
   * Evolve personality traits based on battle outcomes
   */
  private evolvePersonality(won: boolean, playerStrategy: string): void {
    const { traits, memory } = this.personality;
    const recentOutcomes = memory.battleOutcomes.slice(-10);
    const winRate = recentOutcomes.filter(o => o.won).length / recentOutcomes.length;

    const changes: Partial<CommanderTraits> = {};

    // Adapt aggression based on success
    if (winRate < 0.3 && traits.aggression > 0.5) {
      changes.aggression = Math.max(0.1, traits.aggression - 0.1);
    } else if (winRate > 0.7 && traits.aggression < 0.9) {
      changes.aggression = Math.min(1, traits.aggression + 0.1);
    }

    // Adapt risk tolerance
    if (winRate < 0.4) {
      changes.riskTolerance = Math.max(0.1, traits.riskTolerance - 0.05);
    }

    // Apply changes
    if (Object.keys(changes).length > 0) {
      Object.assign(traits, changes);
      this.personality.evolutionHistory.push({
        timestamp: Date.now(),
        traitChanges: changes,
        reason: `Adapting to ${winRate < 0.5 ? 'losses' : 'successes'} against ${playerStrategy}`
      });
    }
  }

  /**
   * Get current personality
   */
  public getPersonality(): CommanderPersonality {
    return { ...this.personality };
  }

  /**
   * Get personality summary
   */
  public getSummary(): string {
    const { name, archetype, traits } = this.personality;
    return `${name} (${archetype}): Aggression ${(traits.aggression * 100).toFixed(0)}%, ` +
           `Adaptability ${(traits.adaptability * 100).toFixed(0)}%, ` +
           `Focus: ${traits.strategicFocus}`;
  }

  /**
   * Clamp value between min and max
   */
  private clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }
}


