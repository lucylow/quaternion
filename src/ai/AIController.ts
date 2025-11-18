import { SeededRandom } from '../lib/SeededRandom';

/**
 * AI Controller with adaptive strategies
 */

export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type AIState = 'expansion' | 'tech' | 'aggression' | 'defense';

// Export AIDifficulty as both type and const object for compatibility with JS files
export const AIDifficulty = {
  EASY: 'easy' as const,
  MEDIUM: 'medium' as const,
  HARD: 'hard' as const
};

export interface AIDecision {
  type: 'build' | 'research' | 'attack' | 'expand' | 'defend';
  target?: any;
  priority: number;
  reason: string;
}

export class AIController {
  private difficulty: AIDifficulty;
  private state: AIState = 'expansion';
  private rng: SeededRandom;
  private ticksSinceStateChange: number = 0;
  private stateChangeCooldown: number = 180; // 3 seconds at 60 tps
  
  // AI personality traits
  private aggression: number;
  private efficiency: number;
  private adaptability: number;

  constructor(difficulty: AIDifficulty, seed: number) {
    this.difficulty = difficulty;
    this.rng = new SeededRandom(seed);
    
    // Set personality based on difficulty
    switch (difficulty) {
      case 'easy':
        this.aggression = 0.3;
        this.efficiency = 0.5;
        this.adaptability = 0.4;
        this.stateChangeCooldown = 300; // Slower reactions
        break;
      case 'medium':
        this.aggression = 0.5;
        this.efficiency = 0.7;
        this.adaptability = 0.6;
        this.stateChangeCooldown = 180;
        break;
      case 'hard':
        this.aggression = 0.7;
        this.efficiency = 0.9;
        this.adaptability = 0.8;
        this.stateChangeCooldown = 120; // Faster reactions
        break;
    }
  }

  /**
   * Update AI state and make decisions
   */
  public update(gameState: any): AIDecision[] {
    this.ticksSinceStateChange++;
    
    // Evaluate current situation
    const situation = this.evaluateSituation(gameState);
    
    // Consider state change
    if (this.ticksSinceStateChange >= this.stateChangeCooldown) {
      this.considerStateChange(situation);
    }
    
    // Make decisions based on current state
    return this.makeDecisions(gameState, situation);
  }

  /**
   * Evaluate current game situation
   */
  private evaluateSituation(gameState: any): any {
    const aiPlayer = gameState.players.get(2);
    const humanPlayer = gameState.players.get(1);
    
    if (!aiPlayer || !humanPlayer) {
      return {
        resourceAdvantage: 0,
        militaryAdvantage: 0,
        techAdvantage: 0,
        territoryControl: 0.5
      };
    }

    // Calculate resource advantage
    const aiResources = Object.values(aiPlayer.resources).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0);
    const humanResources = Object.values(humanPlayer.resources).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0);
    const resourceAdvantage = (aiResources - humanResources) / Math.max(aiResources, humanResources, 1);

    // Calculate military advantage (simplified)
    const militaryAdvantage = this.rng.nextFloat(-0.3, 0.3);

    // Calculate tech advantage
    const techAdvantage = (aiPlayer.researchedTechs.size - humanPlayer.researchedTechs.size) / 
                          Math.max(aiPlayer.researchedTechs.size, humanPlayer.researchedTechs.size, 1);

    // Territory control (simplified)
    const territoryControl = 0.5 + this.rng.nextFloat(-0.2, 0.2);

    return {
      resourceAdvantage,
      militaryAdvantage,
      techAdvantage,
      territoryControl,
      aiResources,
      humanResources
    };
  }

  /**
   * Consider changing AI state based on situation
   */
  private considerStateChange(situation: any): void {
    const { resourceAdvantage, militaryAdvantage, techAdvantage, territoryControl } = situation;

    // State transition logic
    switch (this.state) {
      case 'expansion':
        if (resourceAdvantage > 0.3 && militaryAdvantage > 0.2) {
          this.setState('aggression');
        } else if (techAdvantage < -0.3) {
          this.setState('tech');
        }
        break;

      case 'tech':
        if (techAdvantage > 0.2) {
          this.setState('expansion');
        } else if (militaryAdvantage < -0.4) {
          this.setState('defense');
        }
        break;

      case 'aggression':
        if (militaryAdvantage < -0.2 || resourceAdvantage < -0.3) {
          this.setState('defense');
        } else if (territoryControl > 0.7) {
          this.setState('expansion');
        }
        break;

      case 'defense':
        if (resourceAdvantage > 0 && militaryAdvantage > 0) {
          this.setState('expansion');
        }
        break;
    }
  }

  /**
   * Set new AI state
   */
  private setState(newState: AIState): void {
    this.state = newState;
    this.ticksSinceStateChange = 0;
  }

  /**
   * Make decisions based on current state
   */
  private makeDecisions(gameState: any, situation: any): AIDecision[] {
    const decisions: AIDecision[] = [];

    switch (this.state) {
      case 'expansion':
        decisions.push(...this.makeExpansionDecisions(gameState, situation));
        break;
      case 'tech':
        decisions.push(...this.makeTechDecisions(gameState, situation));
        break;
      case 'aggression':
        decisions.push(...this.makeAggressionDecisions(gameState, situation));
        break;
      case 'defense':
        decisions.push(...this.makeDefenseDecisions(gameState, situation));
        break;
    }

    // Add random mistakes for lower difficulties
    if (this.difficulty === 'easy' && this.rng.next() < 0.3) {
      // 30% chance to make suboptimal decision
      return this.shuffleDecisions(decisions);
    }

    return decisions;
  }

  /**
   * Expansion state decisions
   */
  private makeExpansionDecisions(gameState: any, situation: any): AIDecision[] {
    const decisions: AIDecision[] = [];

    // Build resource extractors
    decisions.push({
      type: 'build',
      target: 'matter_extractor',
      priority: 0.8,
      reason: 'Expand matter production'
    });

    decisions.push({
      type: 'build',
      target: 'refinery',
      priority: 0.7,
      reason: 'Increase energy generation'
    });

    // Claim new resource nodes
    decisions.push({
      type: 'expand',
      priority: 0.9,
      reason: 'Secure additional resource nodes'
    });

    return decisions;
  }

  /**
   * Tech state decisions
   */
  private makeTechDecisions(gameState: any, situation: any): AIDecision[] {
    const decisions: AIDecision[] = [];

    // Build research centers
    decisions.push({
      type: 'build',
      target: 'research_center',
      priority: 0.9,
      reason: 'Boost knowledge generation'
    });

    // Research technologies
    decisions.push({
      type: 'research',
      target: 'neural_network',
      priority: 0.8,
      reason: 'Accelerate research speed'
    });

    return decisions;
  }

  /**
   * Aggression state decisions
   */
  private makeAggressionDecisions(gameState: any, situation: any): AIDecision[] {
    const decisions: AIDecision[] = [];

    // Build military units
    decisions.push({
      type: 'build',
      target: 'barracks',
      priority: 0.9,
      reason: 'Prepare for assault'
    });

    // Attack player
    decisions.push({
      type: 'attack',
      priority: 0.8 * this.aggression,
      reason: 'Strike enemy positions'
    });

    return decisions;
  }

  /**
   * Defense state decisions
   */
  private makeDefenseDecisions(gameState: any, situation: any): AIDecision[] {
    const decisions: AIDecision[] = [];

    // Build defensive structures
    decisions.push({
      type: 'build',
      target: 'command_center',
      priority: 0.8,
      reason: 'Fortify base defenses'
    });

    // Defend key positions
    decisions.push({
      type: 'defend',
      priority: 0.9,
      reason: 'Protect critical infrastructure'
    });

    return decisions;
  }

  /**
   * Shuffle decisions (for easy difficulty mistakes)
   */
  private shuffleDecisions(decisions: AIDecision[]): AIDecision[] {
    return this.rng.shuffle(decisions);
  }

  /**
   * Get current AI state
   */
  public getState(): AIState {
    return this.state;
  }

  /**
   * Get AI personality traits
   */
  public getPersonality() {
    return {
      aggression: this.aggression,
      efficiency: this.efficiency,
      adaptability: this.adaptability,
      difficulty: this.difficulty
    };
  }
}
