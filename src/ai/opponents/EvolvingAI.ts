/**
 * Evolving AI - Progressive AI evolution that grows with player skill
 * AI adapts and unlocks new abilities as player improves
 */

import { SeededRandom } from '../../lib/SeededRandom';

export type EvolutionStage = 
  | 'newborn'
  | 'apprentice'
  | 'adept'
  | 'master'
  | 'legend';

export interface EvolutionStageConfig {
  skillThreshold: number;
  abilities: string[];
  description: string;
}

export class EvolvingAI {
  private skillTracker: any; // Would integrate with player skill tracking
  private evolutionStages: Map<EvolutionStage, EvolutionStageConfig>;
  private currentStage: EvolutionStage;
  private unlockedAbilities: Set<string>;
  private rng: SeededRandom;
  private evolutionHistory: Array<{
    timestamp: number;
    fromStage: EvolutionStage;
    toStage: EvolutionStage;
    playerSkill: number;
  }>;

  constructor(seed: number, skillTracker?: any) {
    this.rng = new SeededRandom(seed);
    this.skillTracker = skillTracker;
    this.currentStage = 'newborn';
    this.unlockedAbilities = new Set();
    this.evolutionHistory = [];

    // Define evolution stages
    this.evolutionStages = new Map([
      ['newborn', {
        skillThreshold: 0,
        abilities: ['basic_attacks', 'simple_build'],
        description: 'Learning the basics. Simple strategies only.'
      }],
      ['apprentice', {
        skillThreshold: 1000,
        abilities: ['simple_strategies', 'basic_economy', 'unit_coordination'],
        description: 'Grasping fundamentals. Can execute basic strategies.'
      }],
      ['adept', {
        skillThreshold: 2500,
        abilities: ['advanced_tactics', 'flanking', 'economy_management', 'tech_timing'],
        description: 'Competent strategist. Uses advanced tactics.'
      }],
      ['master', {
        skillThreshold: 5000,
        abilities: ['mind_games', 'deception', 'emotional_warfare', 'adaptive_strategies'],
        description: 'Master tactician. Employs psychological warfare.'
      }],
      ['legend', {
        skillThreshold: 10000,
        abilities: ['unpredictable_genius', 'meta_strategies', 'cross_session_learning', 'perfect_adaptation'],
        description: 'Legendary opponent. Nearly perfect adaptation and learning.'
      }]
    ]);

    // Initialize with newborn abilities
    this.unlockStageAbilities('newborn');
  }

  /**
   * Update evolution based on player skill
   */
  public updateEvolution(playerSkillScore: number): boolean {
    let evolved = false;
    let newStage: EvolutionStage | null = null;

    // Check if we should evolve to next stage
    for (const [stage, config] of Array.from(this.evolutionStages.entries())) {
      if (playerSkillScore >= config.skillThreshold) {
        const stageIndex = Array.from(this.evolutionStages.keys()).indexOf(stage);
        const currentIndex = Array.from(this.evolutionStages.keys()).indexOf(this.currentStage);
        
        if (stageIndex > currentIndex) {
          newStage = stage;
          break;
        }
      }
    }

    if (newStage && newStage !== this.currentStage) {
      this.evolveToStage(newStage, playerSkillScore);
      evolved = true;
    }

    // Learn new strategies based on current stage
    this.learnAdvancedTechniques();

    return evolved;
  }

  /**
   * Evolve to new stage
   */
  private evolveToStage(stage: EvolutionStage, playerSkill: number): void {
    const oldStage = this.currentStage;
    this.currentStage = stage;
    
    // Unlock new abilities
    this.unlockStageAbilities(stage);

    // Record evolution
    this.evolutionHistory.push({
      timestamp: Date.now(),
      fromStage: oldStage,
      toStage: stage,
      playerSkill
    });
  }

  /**
   * Unlock abilities for stage
   */
  private unlockStageAbilities(stage: EvolutionStage): void {
    const config = this.evolutionStages.get(stage);
    if (config) {
      config.abilities.forEach(ability => {
        this.unlockedAbilities.add(ability);
      });
    }
  }

  /**
   * Learn advanced techniques based on unlocked abilities
   */
  private learnAdvancedTechniques(): void {
    if (this.unlockedAbilities.has('advanced_tactics')) {
      // Would integrate with tactical learning system
      // this.tacticalSystem.learnFlanking();
      // this.tacticalSystem.learnEconomyManagement();
    }

    if (this.unlockedAbilities.has('mind_games')) {
      // Would integrate with deception system
      // this.deceptionSystem.enableDeception();
      // this.deceptionSystem.enableEmotionalWarfare();
    }

    if (this.unlockedAbilities.has('unpredictable_genius')) {
      // Would integrate with chaotic AI
      // this.chaoticAI.enable();
    }
  }

  /**
   * Check if ability is unlocked
   */
  public hasAbility(ability: string): boolean {
    return this.unlockedAbilities.has(ability);
  }

  /**
   * Get current stage
   */
  public getCurrentStage(): EvolutionStage {
    return this.currentStage;
  }

  /**
   * Get stage description
   */
  public getStageDescription(): string {
    const config = this.evolutionStages.get(this.currentStage);
    return config?.description || 'Unknown stage';
  }

  /**
   * Get unlocked abilities
   */
  public getUnlockedAbilities(): string[] {
    return Array.from(this.unlockedAbilities);
  }

  /**
   * Get evolution history
   */
  public getEvolutionHistory(): typeof this.evolutionHistory {
    return [...this.evolutionHistory];
  }

  /**
   * Get next stage threshold
   */
  public getNextStageThreshold(): number | null {
    const stages = Array.from(this.evolutionStages.keys());
    const currentIndex = stages.indexOf(this.currentStage);
    
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      const config = this.evolutionStages.get(nextStage);
      return config?.skillThreshold || null;
    }

    return null;
  }
}

