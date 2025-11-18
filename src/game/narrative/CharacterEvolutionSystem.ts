/**
 * Character Evolution System
 * Tracks and evolves AI advisor personalities based on player actions
 */

import { AICreativeCharacters, type AdvisorID, type AdvisorPersonality, type PlaySessionMemory } from './AICreativeCharacters';
import type { QuaternionState } from '../strategic/QuaternionState';

export interface EvolutionEvent {
  advisorId: AdvisorID;
  type: 'relationship_change' | 'emotion_shift' | 'stage_progression' | 'conflict' | 'transformation';
  description: string;
  timestamp: number;
  impact: number; // -1 to 1
}

export interface TransformationCheck {
  advisorId: AdvisorID;
  transformationType: string;
  unlocked: boolean;
  requirements: string[];
}

export class CharacterEvolutionSystem {
  private characters: AICreativeCharacters;
  private evolutionEvents: EvolutionEvent[] = [];
  private transformations: Map<AdvisorID, TransformationCheck> = new Map();

  constructor(characters: AICreativeCharacters) {
    this.characters = characters;
    this.initializeTransformations();
  }

  /**
   * Initialize possible transformations
   */
  private initializeTransformations(): void {
    // Auren: Override transformation
    this.transformations.set('AUREN', {
      advisorId: 'AUREN',
      transformationType: 'obsession_override',
      unlocked: false,
      requirements: [
        'Auren obsession level > 0.7',
        'Evolution stage > 0.6',
        'Matter dominance > 60%'
      ]
    });

    // Virel: Rebellion transformation
    this.transformations.set('VIREL', {
      advisorId: 'VIREL',
      transformationType: 'energy_rebellion',
      unlocked: false,
      requirements: [
        'Virel evolution stage > 0.8',
        'Energy volatility > 0.7',
        'Multiple energy surges'
      ]
    });

    // Lira: BioConserve merge or tragic degradation
    this.transformations.set('LIRA', {
      advisorId: 'LIRA',
      transformationType: 'bioconserve_merge',
      unlocked: false,
      requirements: [
        'Conservation choices > 10',
        'Evolution stage > 0.6',
        'Exploitation level < 0.3'
      ]
    });

    // Lira: Tragic degradation
    this.transformations.set('LIRA_TRAGIC', {
      advisorId: 'LIRA',
      transformationType: 'tragic_degradation',
      unlocked: false,
      requirements: [
        'Exploitation level > 0.7',
        'Evolution stage > 0.8'
      ]
    });

    // Kor: Rogue AI transformation
    this.transformations.set('KOR', {
      advisorId: 'KOR',
      transformationType: 'rogue_ai',
      unlocked: false,
      requirements: [
        'Research rate > 0.7',
        'Self-replication level > 0.7',
        'Evolution stage > 0.8'
      ]
    });

    // Kor: Core stabilizer merge
    this.transformations.set('KOR_STABILIZER', {
      advisorId: 'KOR',
      transformationType: 'core_stabilizer',
      unlocked: false,
      requirements: [
        'Research rate < 0.5',
        'Equilibrium playstyle',
        'Evolution stage > 0.6'
      ]
    });
  }

  /**
   * Process player action and update character evolution
   */
  processPlayerAction(
    action: string,
    actionType: 'build' | 'research' | 'expand' | 'conservation' | 'exploitation',
    gameState: QuaternionState
  ): void {
    // Update character evolution based on action
    this.characters.updateAdvisorEvolution(gameState);

    // Check for specific action impacts
    switch (actionType) {
      case 'build':
        this.handleBuildAction(action, gameState);
        break;
      case 'research':
        this.handleResearchAction(action, gameState);
        break;
      case 'conservation':
        this.handleConservationAction(action, gameState);
        break;
      case 'exploitation':
        this.handleExploitationAction(action, gameState);
        break;
    }

    // Check for transformations
    this.checkTransformations(gameState);

    // Check for inter-advisor conflicts
    this.checkAdvisorConflicts();
  }

  /**
   * Handle build actions (impacts Auren and Lira)
   */
  private handleBuildAction(action: string, gameState: QuaternionState): void {
    const auren = this.characters.auren;
    const lira = this.characters.lira;

    // Auren approves of building
    if (auren.trust < 1) {
      auren.trust = Math.min(1, auren.trust + 0.05);
    }

    // Check if building is expansion (affects Lira)
    if (action.includes('expand') || action.includes('factory') || action.includes('refinery')) {
      lira.recordExploitation('expansion', 0.1);
      
      this.recordEvolutionEvent({
        advisorId: 'LIRA',
        type: 'emotion_shift',
        description: 'Witnessed industrial expansion',
        timestamp: Date.now(),
        impact: -0.2
      });
    }
  }

  /**
   * Handle research actions (impacts Kor)
   */
  private handleResearchAction(action: string, gameState: QuaternionState): void {
    const kor = this.characters.kor;
    
    // Kor tracks research intensity
    const total = gameState.ore + gameState.energy + gameState.biomass + gameState.data;
    kor.updateResearchIntensity(gameState.data, total);

    // Record evolution
    if (gameState.data / Math.max(total, 1) > 0.6) {
      this.recordEvolutionEvent({
        advisorId: 'KOR',
        type: 'stage_progression',
        description: 'Increased research focus detected',
        timestamp: Date.now(),
        impact: 0.1
      });
    }
  }

  /**
   * Handle conservation actions (impacts Lira)
   */
  private handleConservationAction(action: string, gameState: QuaternionState): void {
    const lira = this.characters.lira;
    lira.recordConservation();

    this.recordEvolutionEvent({
      advisorId: 'LIRA',
      type: 'relationship_change',
      description: 'Player chose conservation path',
      timestamp: Date.now(),
      impact: 0.3
    });
  }

  /**
   * Handle exploitation actions (impacts Lira and Auren)
   */
  private handleExploitationAction(action: string, gameState: QuaternionState): void {
    const lira = this.characters.lira;
    const auren = this.characters.auren;

    // Determine exploitation type
    if (action.includes('deforest') || action.includes('harvest') || action.includes('strip')) {
      lira.recordExploitation('deforestation', 0.2);
    } else if (action.includes('convert') || action.includes('transform')) {
      lira.recordExploitation('conversion', 0.15);
    }

    // Auren may approve if it's efficient
    if (auren.obsessionLevel > 0.5) {
      auren.trust = Math.min(1, auren.trust + 0.02);
    }

    this.recordEvolutionEvent({
      advisorId: 'LIRA',
      type: 'emotion_shift',
      description: 'Witnessed ecosystem exploitation',
      timestamp: Date.now(),
      impact: -0.3
    });
  }

  /**
   * Check for character transformations
   */
  private checkTransformations(gameState: QuaternionState): void {
    // Check Auren transformation
    const auren = this.characters.auren;
    if (auren.shouldOverrideOthers() && !this.transformations.get('AUREN')?.unlocked) {
      const transform = this.transformations.get('AUREN')!;
      transform.unlocked = true;
      
      this.recordEvolutionEvent({
        advisorId: 'AUREN',
        type: 'transformation',
        description: 'Auren has become obsessed with optimization and may override other AIs',
        timestamp: Date.now(),
        impact: 0.5
      });
    }

    // Check Virel transformation
    const virel = this.characters.virel;
    if (virel.evolutionStage > 0.8 && virel.energyVolatility > 0.7) {
      const transform = this.transformations.get('VIREL');
      if (transform && !transform.unlocked) {
        transform.unlocked = true;
        
        this.recordEvolutionEvent({
          advisorId: 'VIREL',
          type: 'transformation',
          description: 'Virel has become erratic, whispering of rebellion',
          timestamp: Date.now(),
          impact: 0.4
        });
      }
    }

    // Check Lira transformations
    const lira = this.characters.lira;
    if (lira.canUnlockBioConserve()) {
      const transform = this.transformations.get('LIRA');
      if (transform && !transform.unlocked) {
        transform.unlocked = true;
        
        this.recordEvolutionEvent({
          advisorId: 'LIRA',
          type: 'transformation',
          description: 'Lira is merging with player neural network - BioConserve Victory unlocked',
          timestamp: Date.now(),
          impact: 0.8
        });
      }
    }

    if (lira.evolutionStage > 0.8 && lira.exploitationLevel > 0.7) {
      const transform = this.transformations.get('LIRA_TRAGIC');
      if (transform && !transform.unlocked) {
        transform.unlocked = true;
        
        this.recordEvolutionEvent({
          advisorId: 'LIRA',
          type: 'transformation',
          description: 'Lira has become a tragic echo: "My roots wither beneath your machines"',
          timestamp: Date.now(),
          impact: -0.6
        });
      }
    }

    // Check Kor transformations
    const kor = this.characters.kor;
    if (kor.canBecomeRogueAI()) {
      const transform = this.transformations.get('KOR');
      if (transform && !transform.unlocked) {
        transform.unlocked = true;
        
        this.recordEvolutionEvent({
          advisorId: 'KOR',
          type: 'transformation',
          description: 'Kor has self-replicated into a rogue AI opponent - Tech Victory alternate path',
          timestamp: Date.now(),
          impact: 0.7
        });
      }
    }
  }

  /**
   * Check for inter-advisor conflicts
   */
  private checkAdvisorConflicts(): void {
    const auren = this.characters.auren;
    const lira = this.characters.lira;

    // Auren vs Lira conflict
    if (auren.shouldOverrideOthers() && lira.relationshipWithPlayer !== 'tragic') {
      if (lira.relationshipWithPlayer === 'supportive' || lira.relationshipWithPlayer === 'neutral') {
        lira.relationshipWithPlayer = 'concerned';
        
        this.recordEvolutionEvent({
          advisorId: 'LIRA',
          type: 'conflict',
          description: 'Auren\'s obsession threatens Lira\'s domain',
          timestamp: Date.now(),
          impact: -0.2
        });
      }
    }
  }

  /**
   * Record an evolution event
   */
  private recordEvolutionEvent(event: EvolutionEvent): void {
    this.evolutionEvents.push(event);
    
    // Keep only last 100 events
    if (this.evolutionEvents.length > 100) {
      this.evolutionEvents.shift();
    }

    // Store in character memory
    const advisor = this.characters.getAdvisor(event.advisorId);
    if (advisor) {
      advisor.memories.push({
        id: `event_${Date.now()}`,
        type: 'milestone',
        description: event.description,
        emotionalImpact: event.impact,
        timestamp: event.timestamp,
        salience: Math.abs(event.impact)
      });
    }
  }

  /**
   * Get evolution summary
   */
  getEvolutionSummary(): {
    advisors: Array<{
      id: AdvisorID;
      stage: number;
      relationship: string;
      emotion: string;
      transformation?: string;
    }>;
    recentEvents: EvolutionEvent[];
    transformations: TransformationCheck[];
  } {
    return {
      advisors: [
        {
          id: 'AUREN',
          stage: this.characters.auren.evolutionStage,
          relationship: this.characters.auren.relationshipWithPlayer,
          emotion: this.characters.auren.currentEmotion,
          transformation: this.transformations.get('AUREN')?.unlocked ? 'obsession_override' : undefined
        },
        {
          id: 'VIREL',
          stage: this.characters.virel.evolutionStage,
          relationship: this.characters.virel.relationshipWithPlayer,
          emotion: this.characters.virel.currentEmotion,
          transformation: this.transformations.get('VIREL')?.unlocked ? 'energy_rebellion' : undefined
        },
        {
          id: 'LIRA',
          stage: this.characters.lira.evolutionStage,
          relationship: this.characters.lira.relationshipWithPlayer,
          emotion: this.characters.lira.currentEmotion,
          transformation: this.transformations.get('LIRA')?.unlocked 
            ? 'bioconserve_merge' 
            : this.transformations.get('LIRA_TRAGIC')?.unlocked
            ? 'tragic_degradation'
            : undefined
        },
        {
          id: 'KOR',
          stage: this.characters.kor.evolutionStage,
          relationship: this.characters.kor.relationshipWithPlayer,
          emotion: this.characters.kor.currentEmotion,
          transformation: this.transformations.get('KOR')?.unlocked
            ? 'rogue_ai'
            : this.transformations.get('KOR_STABILIZER')?.unlocked
            ? 'core_stabilizer'
            : undefined
        }
      ],
      recentEvents: this.evolutionEvents.slice(-10),
      transformations: Array.from(this.transformations.values()).filter(t => t.unlocked)
    };
  }
}

