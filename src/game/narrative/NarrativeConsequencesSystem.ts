/**
 * Narrative Consequences System
 * Ties gameplay choices (resource, tech, terrain) to narrative outcomes
 * Makes mechanical choices generate narrative consequences players can feel
 */

import { CoreNarrativeCharactersManager, VoiceLineTrigger } from './CoreNarrativeCharacters';
import { DynamicNarrativeEventGenerator, EventTrigger, GameStateSnapshot } from './DynamicNarrativeEvents';

export interface NarrativeConsequence {
  id: string;
  choiceType: 'resource' | 'tech' | 'terrain' | 'moral';
  choice: string;
  consequences: ConsequenceManifestation[];
  playerAlignment: number; // -1 (greedy) to 1 (humane)
  timestamp: number;
}

export interface ConsequenceManifestation {
  type: 'visual' | 'audio' | 'narrative' | 'character_reaction' | 'mechanical';
  description: string;
  impact: number; // 0-1, how strongly players feel this
  duration?: number; // seconds
  data?: any; // Type-specific data
}

export interface ChoiceContext {
  type: 'resource' | 'tech' | 'terrain' | 'moral';
  action: string;
  value: any;
  gameState: GameStateSnapshot;
  alternatives?: string[]; // What player could have chosen instead
}

/**
 * Narrative Consequences Manager
 * Tracks player choices and manifests narrative consequences
 */
export class NarrativeConsequencesManager {
  private characterManager: CoreNarrativeCharactersManager;
  private eventGenerator: DynamicNarrativeEventGenerator;
  private consequenceHistory: NarrativeConsequence[] = [];
  private playerAlignment: number = 0; // -1 to 1

  constructor(
    characterManager: CoreNarrativeCharactersManager,
    eventGenerator: DynamicNarrativeEventGenerator
  ) {
    this.characterManager = characterManager;
    this.eventGenerator = eventGenerator;
  }

  /**
   * Process a player choice and generate consequences
   */
  async processChoice(context: ChoiceContext): Promise<NarrativeConsequence> {
    const consequence: NarrativeConsequence = {
      id: `consequence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      choiceType: context.type,
      choice: context.action,
      consequences: [],
      playerAlignment: this.playerAlignment,
      timestamp: Date.now()
    };

    // Determine player alignment change
    const alignmentChange = this.calculateAlignmentChange(context);
    this.playerAlignment = Math.max(-1, Math.min(1, this.playerAlignment + alignmentChange));
    consequence.playerAlignment = this.playerAlignment;

    // Generate consequences based on choice type
    switch (context.type) {
      case 'resource':
        consequence.consequences = await this.processResourceChoice(context);
        break;
      case 'tech':
        consequence.consequences = await this.processTechChoice(context);
        break;
      case 'terrain':
        consequence.consequences = await this.processTerrainChoice(context);
        break;
      case 'moral':
        consequence.consequences = await this.processMoralChoice(context);
        break;
    }

    // Generate dynamic narrative event
    const trigger: EventTrigger = {
      action: context.action,
      playerChoice: this.getPlayerChoiceType(this.playerAlignment),
      ...this.buildTriggerFromContext(context)
    };

    const narrativeEvent = await this.eventGenerator.generateEvent(
      trigger,
      context.gameState,
      `Player chose: ${context.action}`
    );

    if (narrativeEvent) {
      consequence.consequences.push({
        type: 'narrative',
        description: narrativeEvent.flavor,
        impact: 0.8,
        data: narrativeEvent
      });
    }

    // Trigger character reactions
    const characterReactions = await this.triggerCharacterReactions(context, this.playerAlignment);
    consequence.consequences.push(...characterReactions);

    this.consequenceHistory.push(consequence);
    
    // Keep only last 50 consequences
    if (this.consequenceHistory.length > 50) {
      this.consequenceHistory = this.consequenceHistory.slice(-50);
    }

    return consequence;
  }

  /**
   * Process resource gathering choices
   */
  private async processResourceChoice(context: ChoiceContext): Promise<ConsequenceManifestation[]> {
    const consequences: ConsequenceManifestation[] = [];
    const action = context.action.toLowerCase();
    const gameState = context.gameState;

    // Biomass harvesting consequences
    if (action.includes('biomass') || action.includes('harvest')) {
      const biomassBefore = context.value?.before || gameState.resources.biomass;
      const biomassAfter = context.value?.after || gameState.resources.biomass - (context.value?.amount || 0);

      if (biomassAfter < 20) {
        // Heavy exploitation - visual and narrative consequences
        consequences.push({
          type: 'visual',
          description: 'Terrain degrades: flora wilts, ground darkens, ambient life withdraws',
          impact: 0.9,
          duration: 300, // 5 minutes
          data: { visualEffect: 'biomass_depletion', intensity: 0.8 }
        });

        consequences.push({
          type: 'narrative',
          description: 'The ground grows cold. What was once vibrant now lies barren.',
          impact: 0.85
        });

        consequences.push({
          type: 'mechanical',
          description: 'Resource regeneration reduced in affected area',
          impact: 0.7,
          duration: 300,
          data: { mechanicalEffect: 'reduced_resource_regen', multiplier: 0.5 }
        });
      } else if (biomassAfter < 50) {
        // Moderate impact
        consequences.push({
          type: 'visual',
          description: 'Subtle terrain changes: some flora wilts, ground shows stress',
          impact: 0.6,
          duration: 180,
          data: { visualEffect: 'biomass_stress', intensity: 0.5 }
        });

        consequences.push({
          type: 'narrative',
          description: 'The Bio-Seed stirs beneath your harvest. A low sound echoes through the soil.',
          impact: 0.7
        });
      }

      // Bio-Seed state change
      if (gameState.bioSeedState === 'dormant' && biomassAfter < 30) {
        consequences.push({
          type: 'narrative',
          description: 'The Bio-Seed begins to stir. Something ancient is awakening.',
          impact: 0.95
        });
      }
    }

    // Ore/Energy harvesting (less emotional impact but still consequences)
    if (action.includes('ore') || action.includes('energy')) {
      consequences.push({
        type: 'narrative',
        description: 'The extraction echoes through the quantum field. Resources secured, but at what cost?',
        impact: 0.4
      });
    }

    return consequences;
  }

  /**
   * Process technology research choices
   */
  private async processTechChoice(context: ChoiceContext): Promise<ConsequenceManifestation[]> {
    const consequences: ConsequenceManifestation[] = [];
    const techId = context.action;
    const gameState = context.gameState;

    // BioConserve tech - positive narrative consequences
    if (techId.includes('bio_conserve') || techId.includes('symbiosis')) {
      consequences.push({
        type: 'visual',
        description: 'Bio-Seed responds positively: veins of light spread, flora flourishes',
        impact: 0.8,
        duration: 600,
        data: { visualEffect: 'symbiotic_connection', intensity: 0.7 }
      });

      consequences.push({
        type: 'narrative',
        description: 'You chose understanding over exploitation. The Bio-Seed pulses with gratitude.',
        impact: 0.9
      });

      consequences.push({
        type: 'mechanical',
        description: 'Symbiotic bonus: resource regeneration increased',
        impact: 0.75,
        duration: 600,
        data: { mechanicalEffect: 'symbiotic_bonus', multiplier: 1.3 }
      });
    }

    // Overclock/Exploitation tech - negative narrative consequences
    if (techId.includes('overclock') || techId.includes('exploit')) {
      consequences.push({
        type: 'visual',
        description: 'Efficiency gained, but the terrain shows strain. Cold efficiency has a price.',
        impact: 0.7,
        duration: 300,
        data: { visualEffect: 'industrial_strain', intensity: 0.6 }
      });

      consequences.push({
        type: 'narrative',
        description: 'Maximum efficiency achieved. The Bio-Seed recoils from the cold logic of your systems.',
        impact: 0.8
      });

      consequences.push({
        type: 'mechanical',
        description: 'Short-term production boost, long-term ecological cost',
        impact: 0.6,
        duration: 300,
        data: { mechanicalEffect: 'overclock_boost', multiplier: 1.5, ecologicalDebt: 0.2 }
      });
    }

    return consequences;
  }

  /**
   * Process terrain capture/control choices
   */
  private async processTerrainChoice(context: ChoiceContext): Promise<ConsequenceManifestation[]> {
    const consequences: ConsequenceManifestation[] = [];
    const action = context.action.toLowerCase();

    // Capturing strategic terrain (e.g., lava vent to survive storm)
    if (action.includes('capture') || action.includes('control')) {
      consequences.push({
        type: 'narrative',
        description: 'Tactical advantage secured. But the cost echoes in the abandoned settlements.',
        impact: 0.75
      });

      // If this forces abandoning something (e.g., village)
      if (context.value?.abandoned) {
        consequences.push({
          type: 'narrative',
          description: 'You chose survival. The casualty report will arrive soon. The weight of that choice settles in.',
          impact: 0.95
        });

        consequences.push({
          type: 'character_reaction',
          description: 'Lian: "Survival isn\'t pretty. The reports reflect that."',
          impact: 0.9
        });
      }
    }

    return consequences;
  }

  /**
   * Process moral/alignment choices
   */
  private async processMoralChoice(context: ChoiceContext): Promise<ConsequenceManifestation[]> {
    const consequences: ConsequenceManifestation[] = [];
    const choice = context.action.toLowerCase();

    if (choice.includes('humane') || choice.includes('symbiotic')) {
      consequences.push({
        type: 'narrative',
        description: 'You chose the harder path. Few do. The world remembers.',
        impact: 0.9
      });

      consequences.push({
        type: 'character_reaction',
        description: 'Mara: "You chose understanding. The Bio-Seed is grateful."',
        impact: 0.85
      });
    } else if (choice.includes('greedy') || choice.includes('exploit')) {
      consequences.push({
        type: 'narrative',
        description: 'Efficiency over empathy. The choice echoes. The cost will compound.',
        impact: 0.85
      });

      consequences.push({
        type: 'character_reaction',
        description: 'Mara: "I see. You\'ve made your choice. I hope it was worth it."',
        impact: 0.9
      });
    }

    return consequences;
  }

  /**
   * Trigger character reactions to choices
   */
  private async triggerCharacterReactions(
    context: ChoiceContext,
    playerAlignment: number
  ): Promise<ConsequenceManifestation[]> {
    const reactions: ConsequenceManifestation[] = [];
    const choiceType = this.getPlayerChoiceType(playerAlignment);

    // Determine which character should react
    let characterId: 'LIAN_YAO' | 'DR_MARA_KEST' | 'PATCH' | null = null;
    let reactionContext = '';

    if (context.type === 'resource' && context.action.includes('biomass')) {
      characterId = 'DR_MARA_KEST';
      reactionContext = 'Before harvesting Bio-Seed';
    } else if (context.type === 'moral' || playerAlignment > 0.3 || playerAlignment < -0.3) {
      if (playerAlignment > 0.3) {
        characterId = 'DR_MARA_KEST';
        reactionContext = 'After humane choice';
      } else if (playerAlignment < -0.3) {
        characterId = 'DR_MARA_KEST';
        reactionContext = 'After greedy choice';
      } else {
        characterId = 'LIAN_YAO';
        reactionContext = 'After pragmatic choice';
      }
    } else if (context.type === 'tech' || context.type === 'terrain') {
      characterId = 'LIAN_YAO';
      reactionContext = 'Tactical decision';
    }

    if (characterId) {
      const trigger: VoiceLineTrigger = {
        action: context.action,
        playerChoice: choiceType
      };

      const voiceLine = this.characterManager.getVoiceLine(characterId, reactionContext, trigger);

      if (voiceLine) {
        reactions.push({
          type: 'character_reaction',
          description: voiceLine.text,
          impact: 0.8,
          data: {
            characterId,
            voiceLine,
            ssml: voiceLine.ssml
          }
        });

        // Record player action in character memory
        this.characterManager.recordPlayerAction(
          context.action,
          reactionContext,
          choiceType
        );
      }
    }

    // Patch always has a quip for tactical situations
    if (context.type === 'tech' || context.type === 'terrain') {
      const patchLine = this.characterManager.getVoiceLine('PATCH', 'Tactical hint', {
        action: context.action
      });

      if (patchLine) {
        reactions.push({
          type: 'character_reaction',
          description: patchLine.text,
          impact: 0.5,
          data: {
            characterId: 'PATCH',
            voiceLine: patchLine,
            ssml: patchLine.ssml
          }
        });
      }
    }

    return reactions;
  }

  /**
   * Calculate alignment change from choice
   */
  private calculateAlignmentChange(context: ChoiceContext): number {
    let change = 0;

    // Resource choices
    if (context.type === 'resource') {
      const action = context.action.toLowerCase();
      if (action.includes('biomass') || action.includes('harvest')) {
        const amount = context.value?.amount || 0;
        change = -(amount / 100) * 0.3; // Negative for harvesting
      }
    }

    // Tech choices
    if (context.type === 'tech') {
      const techId = context.action.toLowerCase();
      if (techId.includes('bio_conserve') || techId.includes('symbiosis')) {
        change = 0.2; // Positive for conservation
      } else if (techId.includes('overclock') || techId.includes('exploit')) {
        change = -0.15; // Negative for exploitation
      }
    }

    // Terrain choices
    if (context.type === 'terrain') {
      if (context.value?.abandoned) {
        change = -0.1; // Negative for abandoning settlements
      }
    }

    // Moral choices
    if (context.type === 'moral') {
      const choice = context.action.toLowerCase();
      if (choice.includes('humane') || choice.includes('symbiotic')) {
        change = 0.3;
      } else if (choice.includes('greedy') || choice.includes('exploit')) {
        change = -0.2;
      }
    }

    return change;
  }

  /**
   * Get player choice type from alignment
   */
  private getPlayerChoiceType(alignment: number): 'humane' | 'greedy' | 'pragmatic' {
    if (alignment > 0.3) return 'humane';
    if (alignment < -0.3) return 'greedy';
    return 'pragmatic';
  }

  /**
   * Build trigger from context for event generator
   */
  private buildTriggerFromContext(context: ChoiceContext): Partial<EventTrigger> {
    const trigger: Partial<EventTrigger> = {};

    if (context.type === 'resource' && context.value?.delta) {
      trigger.resourceChange = {
        type: context.action.includes('biomass') ? 'biomass' :
              context.action.includes('ore') ? 'ore' :
              context.action.includes('energy') ? 'energy' : 'data',
        threshold: context.value.delta < -30 ? 'depleted' :
                   context.value.delta < -10 ? 'low' : 'abundant',
        delta: context.value.delta
      };
    }

    if (context.type === 'tech') {
      trigger.techResearched = context.action;
    }

    if (context.type === 'terrain') {
      trigger.terrainEvent = context.action;
    }

    return trigger;
  }

  /**
   * Get current player alignment
   */
  getPlayerAlignment(): number {
    return this.playerAlignment;
  }

  /**
   * Get consequence history
   */
  getConsequenceHistory(count: number = 10): NarrativeConsequence[] {
    return this.consequenceHistory.slice(-count);
  }

  /**
   * Get overall narrative summary
   */
  getNarrativeSummary(): {
    alignment: number;
    choiceType: 'humane' | 'greedy' | 'pragmatic';
    dominantConsequences: string[];
    characterRelationships: Record<string, number>;
  } {
    const recent = this.consequenceHistory.slice(-10);
    const dominantConsequences = recent
      .flatMap(c => c.consequences)
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3)
      .map(c => c.description);

    return {
      alignment: this.playerAlignment,
      choiceType: this.getPlayerChoiceType(this.playerAlignment),
      dominantConsequences,
      characterRelationships: {
        lian: this.characterManager.lian.relationshipWithPlayer,
        mara: this.characterManager.mara.relationshipWithPlayer,
        patch: this.characterManager.patch.relationshipWithPlayer
      }
    };
  }
}

