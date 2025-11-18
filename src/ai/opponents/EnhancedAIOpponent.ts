/**
 * Enhanced AI Opponent - Main integration class
 * Combines all AI opponent systems into a unified, intelligent adversary
 */

import { AIPersonalityMatrix, PersonalityTraits } from './AIPersonalityMatrix';
import { AICommanderArchetypes, CommanderProfile, CommanderArchetype } from './AICommanderArchetypes';
import { AIStrategyLearner } from './AIStrategyLearner';
import { DeceptionAI, DeceptionTactic } from './DeceptionAI';
import { EmotionalManipulator, PlayerEmotion } from './EmotionalManipulator';
import { AsymmetricAI, AlienSpecies } from './AsymmetricAI';
import { EvolvingAI, EvolutionStage } from './EvolvingAI';
import { AITeamCoordinator } from './AITeamCoordinator';
import { EnvironmentalStrategist } from './EnvironmentalStrategist';
import { PersistentAI } from './PersistentAI';
import { ChaoticAI } from './ChaoticAI';
import { QuirkyAI, Quirk } from './QuirkyAI';
import { SeededRandom } from '../../lib/SeededRandom';

export interface EnhancedAIOpponentConfig {
  seed: number;
  archetype?: CommanderArchetype;
  alienSpecies?: AlienSpecies;
  chaosLevel?: number;
  quirks?: Quirk[];
  enableDeception?: boolean;
  enableEmotionalWarfare?: boolean;
  enableEvolution?: boolean;
  enablePersistence?: boolean;
  playerId?: string;
  skillTracker?: any;
  voiceSystem?: any;
  mapAnalyzer?: any;
}

export interface AIDecision {
  action: string;
  priority: number;
  reasoning: string;
  confidence: number;
  deception?: {
    tactic: DeceptionTactic;
    plan: any;
  };
  emotionalTrigger?: {
    emotion: PlayerEmotion;
    taunt: string;
  };
  quirkApplied?: Quirk;
}

export class EnhancedAIOpponent {
  private rng: SeededRandom;
  private personalityMatrix: AIPersonalityMatrix;
  private commanderProfile: CommanderProfile;
  private strategyLearner: AIStrategyLearner;
  private deceptionAI: DeceptionAI | null;
  private emotionalManipulator: EmotionalManipulator | null;
  private asymmetricAI: AsymmetricAI | null;
  private evolvingAI: EvolvingAI | null;
  private teamCoordinator: AITeamCoordinator | null;
  private environmentalStrategist: EnvironmentalStrategist;
  private persistentAI: PersistentAI | null;
  private chaoticAI: ChaoticAI;
  private quirkyAI: QuirkyAI;
  private config: EnhancedAIOpponentConfig;

  constructor(config: EnhancedAIOpponentConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);

    // Initialize core systems
    this.personalityMatrix = new AIPersonalityMatrix(config.seed);
    this.commanderProfile = AICommanderArchetypes.createCommander(
      config.archetype || AICommanderArchetypes.getRandomArchetype(config.seed),
      config.seed
    );
    this.strategyLearner = new AIStrategyLearner(config.seed);

    // Initialize optional systems
    this.deceptionAI = config.enableDeception !== false 
      ? new DeceptionAI(config.seed) 
      : null;
    this.emotionalManipulator = config.enableEmotionalWarfare !== false
      ? new EmotionalManipulator(config.seed, config.voiceSystem)
      : null;
    this.asymmetricAI = config.alienSpecies
      ? new AsymmetricAI(config.seed, config.alienSpecies)
      : null;
    this.evolvingAI = config.enableEvolution !== false
      ? new EvolvingAI(config.seed, config.skillTracker)
      : null;
    this.persistentAI = config.enablePersistence !== false
      ? new PersistentAI(config.seed)
      : null;
    this.chaoticAI = new ChaoticAI(config.seed, config.chaosLevel || 0.3);
    this.quirkyAI = new QuirkyAI(config.seed, config.quirks);
    this.environmentalStrategist = new EnvironmentalStrategist(config.seed, config.mapAnalyzer);

    // Load persistent data if player ID provided
    if (config.playerId && this.persistentAI) {
      this.persistentAI.loadPlayerHistory(config.playerId);
    }
  }

  /**
   * Make strategic decision
   */
  public makeDecision(gameState: any): AIDecision {
    // Update emotional state
    if (this.emotionalManipulator) {
      this.emotionalManipulator.updateEmotionalState(gameState);
    }

    // Get base decision from personality
    const baseDecision = this.getBaseDecision(gameState);

    // Apply quirks
    const quirkResult = this.quirkyAI.applyQuirksToDecision(baseDecision.action, gameState);
    let finalDecision = quirkResult.decision;
    let reasoning = quirkResult.reasoning;
    const quirkApplied = quirkResult.quirkApplied;

    // Apply chaos if enabled
    if (this.chaoticAI.getChaosLevel() > 0.2) {
      const chaoticResult = this.chaoticAI.makeDecision(gameState);
      if (this.rng.nextFloat() < this.chaoticAI.getChaosLevel()) {
        finalDecision = chaoticResult.decision;
        reasoning = chaoticResult.reasoning;
      }
    }

    // Apply asymmetric thinking if enabled
    if (this.asymmetricAI) {
      const asymmetricResult = this.asymmetricAI.makeStrategicDecision(gameState);
      if (this.rng.nextFloat() < 0.3) { // 30% chance to use alien thinking
        finalDecision = asymmetricResult.action;
        reasoning = asymmetricResult.reasoning;
      }
    }

    // Check for deception opportunity
    let deception: { tactic: DeceptionTactic; plan: any } | undefined;
    if (this.deceptionAI && this.rng.nextFloat() < 0.2) { // 20% chance
      const tactics: DeceptionTactic[] = [
        'feigned_weakness',
        'false_retreat',
        'bait_and_switch'
      ];
      const tactic = this.rng.choice(tactics);
      const plan = this.deceptionAI.executeDeception(tactic, gameState);
      if (plan) {
        deception = { tactic, plan };
      }
    }

    // Check for emotional manipulation
    let emotionalTrigger: { emotion: PlayerEmotion; taunt: string } | undefined;
    if (this.emotionalManipulator && this.rng.nextFloat() < 0.15) { // 15% chance
      const emotions: PlayerEmotion[] = ['frustration', 'overconfidence', 'panic'];
      const emotion = this.rng.choice(emotions);
      const taunt = this.emotionalManipulator.triggerEmotionalResponse(emotion, gameState);
      if (taunt) {
        emotionalTrigger = { emotion, taunt: taunt.text };
      }
    }

    // Calculate priority and confidence
    const priority = this.calculatePriority(finalDecision, gameState);
    const confidence = this.calculateConfidence(finalDecision, gameState);

    return {
      action: finalDecision,
      priority,
      reasoning,
      confidence,
      deception,
      emotionalTrigger,
      quirkApplied
    };
  }

  /**
   * Get base decision from personality
   */
  private getBaseDecision(gameState: any): {
    action: string;
    reasoning: string;
  } {
    const traits = this.personalityMatrix.getTraits();
    const commanderTraits = this.commanderProfile.traits;

    // Predict player move
    const predictedPlayerMove = this.strategyLearner.predictPlayerMove(gameState);
    
    // Get counter strategy if available
    let counterStrategy: string | null = null;
    if (predictedPlayerMove) {
      counterStrategy = this.strategyLearner.developCounterStrategy(
        predictedPlayerMove,
        commanderTraits
      )?.strategy || null;
    }

    // Make decision based on personality and situation
    let action = 'balanced';
    let reasoning = 'Standard strategic decision.';

    if (traits.aggression > 0.7 && gameState.militaryAdvantage > 0.2) {
      action = 'attack';
      reasoning = 'Aggressive personality demands offensive action.';
    } else if (traits.caution > 0.7 && gameState.threatLevel > 0.5) {
      action = 'defend';
      reasoning = 'Cautious approach. Fortifying defenses.';
    } else if (traits.innovation > 0.7 && gameState.techAdvantage < 0.2) {
      action = 'tech_research';
      reasoning = 'Innovative mind seeks technological advantage.';
    } else if (counterStrategy) {
      action = counterStrategy;
      reasoning = `Countering predicted player strategy: ${predictedPlayerMove}`;
    }

    return { action, reasoning };
  }

  /**
   * Calculate priority
   */
  private calculatePriority(action: string, gameState: any): number {
    let priority = 0.5;

    // Adjust based on threat level
    if (gameState.threatLevel > 0.7) {
      priority = 0.9;
    } else if (gameState.threatLevel < 0.3) {
      priority = 0.3;
    }

    // Adjust based on action type
    if (action === 'attack' && gameState.militaryAdvantage > 0.3) {
      priority = Math.max(priority, 0.8);
    } else if (action === 'defend' && gameState.threatLevel > 0.6) {
      priority = Math.max(priority, 0.9);
    }

    return this.clamp(0, 1, priority);
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(action: string, gameState: any): number {
    let confidence = 0.5;

    // Increase confidence if we have similar past experiences
    const similarExperiences = this.strategyLearner.getPlayerProfile();
    if (similarExperiences.preferredOpenings.length > 0) {
      confidence += 0.2;
    }

    // Adjust based on personality
    const traits = this.personalityMatrix.getTraits();
    confidence += traits.adaptability * 0.2;

    return this.clamp(0, 1, confidence);
  }

  /**
   * Learn from outcome
   */
  public learnFromOutcome(
    won: boolean,
    playerStrategy: string,
    aiStrategy: string,
    gameDuration: number
  ): void {
    // Update personality
    this.personalityMatrix.adaptToPlayer(playerStrategy, won);

    // Update strategy learner
    this.strategyLearner.evaluateStrategySuccess(aiStrategy, won ? 1 : 0);

    // Update deception AI
    if (this.deceptionAI) {
      // Would record deception outcomes
    }

    // Update chaotic AI
    this.chaoticAI.updateChaosLevel(won);

    // Update persistent AI
    if (this.persistentAI && this.config.playerId) {
      this.persistentAI.updateCrossSessionLearning(
        this.config.playerId,
        won ? 'win' : 'loss',
        aiStrategy,
        gameDuration,
        [] // Would extract key decisions
      );
    }

    // Update evolving AI
    if (this.evolvingAI && this.config.skillTracker) {
      const playerSkill = this.config.skillTracker.getSkillScore();
      this.evolvingAI.updateEvolution(playerSkill);
    }
  }

  /**
   * Get commander profile
   */
  public getCommanderProfile(): CommanderProfile {
    return { ...this.commanderProfile };
  }

  /**
   * Get personality traits
   */
  public getPersonalityTraits(): PersonalityTraits {
    return this.personalityMatrix.getTraits();
  }

  /**
   * Get evolution stage
   */
  public getEvolutionStage(): EvolutionStage | null {
    return this.evolvingAI?.getCurrentStage() || null;
  }

  /**
   * Clamp value
   */
  private clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

