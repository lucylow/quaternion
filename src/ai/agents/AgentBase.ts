/**
 * Base Agent System for Quaternion: Neural Frontier
 * Core interfaces and base classes for all AI agents
 */

import { QuaternionGameState } from '../../game/QuaternionGameState';
import { SeededRandom } from '../../lib/SeededRandom';

/**
 * Agent Personality Traits
 */
export interface AgentPersonality {
  personalityName: string;
  aggression: number; // 0-1
  adaptability: number; // 0-1
  riskTolerance: number; // 0-1
  economicFocus: number; // 0-1
  strategicPatience: number; // 0-1
  
  // LLM-Generated personality traits
  backstory?: string;
  preferredTactics?: string;
  weakness?: string;
}

/**
 * Game State Snapshot for AI decision making
 */
export interface GameStateSnapshot {
  gameTime: number;
  tick: number;
  resources: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
    total: number;
  };
  unitComposition: {
    offensiveUnits: number;
    defensiveUnits: number;
    workers: number;
    total: number;
  };
  techProgress: {
    researchedCount: number;
    availableOptions: number;
    currentResearch: string | null;
  };
  mapControl: {
    controlledArea: number;
    chokepointsHeld: number;
    expansionSites: number;
  };
  enemyVisibility: {
    units: Array<{ position: { x: number; y: number }; type: string; health: number }>;
    structures: Array<{ position: { x: number; y: number }; type: string }>;
    lastSeen: Map<string, number>;
  };
  threatAssessment: {
    immediate: number; // 0-1
    potential: number; // 0-1
    timeline: number; // estimated ticks until threat
  };
}

/**
 * Agent Recommendation
 */
export interface AgentRecommendation {
  agentType: AgentType;
  priority: number; // 0-1
  recommendedActions: AgentAction[];
  confidence: number; // 0-1
  reasoning: string;
  estimatedCost: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
}

/**
 * Agent Action
 */
export interface AgentAction {
  type: 'build' | 'research' | 'attack' | 'expand' | 'defend' | 'scout' | 'gather' | 'train';
  target?: any;
  position?: { x: number; y: number };
  unitType?: string;
  buildingType?: string;
  techId?: string;
  count?: number;
  priority: number;
  reasoning?: string;
  requiredResources?: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
}

/**
 * Agent Types
 */
export enum AgentType {
  ECONOMIC = 'economic',
  MILITARY = 'military',
  RESEARCH = 'research',
  SCOUTING = 'scouting',
  DIPLOMATIC = 'diplomatic'
}

/**
 * Base Agent Interface
 */
export interface IAgent {
  getAgentType(): AgentType;
  generateRecommendation(gameState: GameStateSnapshot): AgentRecommendation;
  learnFromOutcome(action: AgentAction, previousState: GameStateSnapshot, newState: GameStateSnapshot): void;
  getConfidence(gameState: GameStateSnapshot): number;
}

/**
 * Base Agent Class
 */
export abstract class BaseAgent implements IAgent {
  protected personality: AgentPersonality;
  protected rng: SeededRandom;
  protected memory: Array<{ state: GameStateSnapshot; action: AgentAction; outcome: number }> = [];
  protected maxMemorySize: number = 100;
  protected learningRate: number = 0.1;

  constructor(personality: AgentPersonality, seed: number) {
    this.personality = personality;
    this.rng = new SeededRandom(seed);
  }

  abstract getAgentType(): AgentType;
  abstract generateRecommendation(gameState: GameStateSnapshot): AgentRecommendation;
  
  learnFromOutcome(action: AgentAction, previousState: GameStateSnapshot, newState: GameStateSnapshot): void {
    // Calculate outcome score
    const outcome = this.calculateOutcomeScore(previousState, newState, action);
    
    // Store in memory
    this.memory.push({ state: previousState, action, outcome });
    
    // Maintain memory size
    if (this.memory.length > this.maxMemorySize) {
      this.memory.shift();
    }
    
    // Learn from experience
    this.updateStrategyWeights(action, outcome);
  }

  getConfidence(gameState: GameStateSnapshot): number {
    // Base confidence from personality
    let confidence = 0.5 + (this.personality.adaptability * 0.3);
    
    // Increase confidence if we have similar past experiences
    const similarExperiences = this.findSimilarExperiences(gameState);
    if (similarExperiences.length > 0) {
      const avgOutcome = similarExperiences.reduce((sum, e) => sum + e.outcome, 0) / similarExperiences.length;
      confidence += avgOutcome * 0.2;
    }
    
    return Math.min(1, Math.max(0, confidence));
  }

  protected abstract calculateOutcomeScore(
    previousState: GameStateSnapshot,
    newState: GameStateSnapshot,
    action: AgentAction
  ): number;

  protected abstract updateStrategyWeights(action: AgentAction, outcome: number): void;

  protected findSimilarExperiences(gameState: GameStateSnapshot): Array<{ state: GameStateSnapshot; action: AgentAction; outcome: number }> {
    // Simple similarity check based on resource levels and threat
    return this.memory.filter(m => {
      const resourceDiff = Math.abs(m.state.resources.total - gameState.resources.total) / Math.max(m.state.resources.total, gameState.resources.total, 1);
      const threatDiff = Math.abs(m.state.threatAssessment.immediate - gameState.threatAssessment.immediate);
      return resourceDiff < 0.2 && threatDiff < 0.2;
    });
  }

  protected clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}


