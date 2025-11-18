/**
 * Narrative Integration Module
 * Integrates all narrative systems with gameplay
 * Single entry point for narrative functionality
 */

import { CoreNarrativeCharactersManager } from './CoreNarrativeCharacters';
import { DynamicNarrativeEventGenerator, GameStateSnapshot } from './DynamicNarrativeEvents';
import { NarrativeConsequencesManager, ChoiceContext } from './NarrativeConsequencesSystem';
import { DemoNarrativeDirector } from './DemoNarrativeStructure';

export interface NarrativeIntegrationConfig {
  llmConfig?: any;
  enableDemoNarrative?: boolean; // Enable 3-act demo structure
  enableDynamicEvents?: boolean; // Enable LLM-generated events
  enableVoiceLines?: boolean; // Enable character voice lines
}

/**
 * Main Narrative Integration Manager
 * Coordinates all narrative systems and provides unified API
 */
export class NarrativeIntegration {
  public characters: CoreNarrativeCharactersManager;
  public eventGenerator: DynamicNarrativeEventGenerator;
  public consequencesManager: NarrativeConsequencesManager;
  public demoDirector?: DemoNarrativeDirector;

  private config: NarrativeIntegrationConfig;
  private isInitialized = false;

  constructor(config: NarrativeIntegrationConfig = {}) {
    this.config = {
      enableDemoNarrative: true,
      enableDynamicEvents: true,
      enableVoiceLines: true,
      ...config
    };

    // Initialize core systems
    this.characters = new CoreNarrativeCharactersManager();
    this.eventGenerator = new DynamicNarrativeEventGenerator(config.llmConfig);
    this.consequencesManager = new NarrativeConsequencesManager(
      this.characters,
      this.eventGenerator
    );

    // Initialize demo director if enabled
    if (this.config.enableDemoNarrative) {
      this.demoDirector = new DemoNarrativeDirector(
        this.characters,
        this.eventGenerator,
        this.consequencesManager
      );
    }
  }

  /**
   * Initialize narrative system with game state
   */
  async initialize(gameState: GameStateSnapshot): Promise<void> {
    if (this.isInitialized) return;

    // Initialize demo narrative if enabled
    if (this.demoDirector) {
      // Demo director initializes itself
    }

    this.isInitialized = true;
  }

  /**
   * Process player choice and generate narrative consequences
   */
  async processPlayerChoice(
    context: ChoiceContext,
    gameState: GameStateSnapshot
  ): Promise<void> {
    // Process through consequences manager
    const consequence = await this.consequencesManager.processChoice(context);

    // Update demo narrative if enabled
    if (this.demoDirector) {
      await this.demoDirector.processPlayerChoice(context);
    }

    // Return consequence for UI/gameplay integration
    return consequence as any;
  }

  /**
   * Update narrative systems with game state
   */
  async update(gameState: GameStateSnapshot): Promise<void> {
    // Update demo director
    if (this.demoDirector) {
      await this.demoDirector.update(gameState);
    }

    // Generate dynamic events if enabled
    if (this.config.enableDynamicEvents) {
      // Auto-generate events based on state changes
      // (Can be triggered by game state manager)
    }
  }

  /**
   * Get voice line for character
   */
  getVoiceLine(
    characterId: 'LIAN_YAO' | 'DR_MARA_KEST' | 'PATCH',
    context: string,
    trigger?: any
  ) {
    if (!this.config.enableVoiceLines) return null;
    return this.characters.getVoiceLine(characterId, context, trigger);
  }

  /**
   * Get current narrative summary
   */
  getNarrativeSummary() {
    return {
      playerAlignment: this.consequencesManager.getPlayerAlignment(),
      consequences: this.consequencesManager.getNarrativeSummary(),
      demoState: this.demoDirector?.getNarrativeState(),
      characterRelationships: {
        lian: this.characters.lian.relationshipWithPlayer,
        mara: this.characters.mara.relationshipWithPlayer,
        patch: this.characters.patch.relationshipWithPlayer
      }
    };
  }

  /**
   * Get recent narrative events
   */
  getRecentEvents(count: number = 10) {
    return this.eventGenerator.getRecentEvents(count);
  }

  /**
   * Get all voice lines (for export/debugging)
   */
  getAllVoiceLines() {
    return this.characters.getAllVoiceLines();
  }

  /**
   * Trigger a narrative event manually
   */
  async triggerNarrativeEvent(
    trigger: any,
    gameState: GameStateSnapshot,
    context?: string
  ) {
    if (!this.config.enableDynamicEvents) return null;
    return await this.eventGenerator.generateEvent(trigger, gameState, context);
  }

  /**
   * Get current act (if demo narrative enabled)
   */
  getCurrentAct() {
    return this.demoDirector?.getCurrentAct() || null;
  }

  /**
   * Get all character voice lines for ElevenLabs export
   */
  exportVoiceLinesForElevenLabs() {
    const voiceLines = this.getAllVoiceLines();
    return {
      lian: voiceLines.filter(vl => vl.characterId === 'LIAN_YAO'),
      mara: voiceLines.filter(vl => vl.characterId === 'DR_MARA_KEST'),
      patch: voiceLines.filter(vl => vl.characterId === 'PATCH'),
      totalCount: voiceLines.length
    };
  }

  /**
   * Get LLM prompts for narrative event generation
   */
  getLLMPrompts() {
    return {
      eventGeneration: `You are a narrative event generator for a sci-fi RTS game called Quaternion. 
Players must balance resource gathering with protecting an emergent lifeform (Bio-Seed).

Generate a brief, evocative narrative event (1-2 sentences) that:
1. Creates emotional impact (make players feel something)
2. Reflects the consequence of player choices
3. Uses vivid, sensory language
4. Ties directly to the trigger and game state

Respond ONLY with valid JSON in this format:
{
  "event": "Short event name",
  "flavor": "1-2 sentence narrative text",
  "effect": {
    "type": "buff|debuff|resource|narrative|character_relationship",
    "description": "What happens mechanically",
    "mechanicalImpact": "e.g., 'increased_aggression_in_wildlife_30s'",
    "duration": 30
  },
  "emotionalTone": "hopeful|melancholic|tense|triumphant|somber"
}`,

      moralDilemma: `Generate a moral dilemma for Quaternion where players must choose between:
- Immediate tactical advantage (resource gathering, exploitation)
- Long-term ecological/symbiotic benefit (conservation, understanding)

Make it specific to resource/tech/terrain choices and emotionally impactful.`,

      characterReaction: `Generate a character reaction for [CHARACTER_NAME] in response to a player choice.
Character personality: [CHARACTER_PERSONALITY]
Player choice: [PLAYER_CHOICE]
Context: [CONTEXT]

Create 1 sentence that reflects the character's emotional state and relationship with the player.`
    };
  }
}

/**
 * Singleton instance for global access
 */
let narrativeIntegrationInstance: NarrativeIntegration | null = null;

/**
 * Get or create narrative integration instance
 */
export function getNarrativeIntegration(config?: NarrativeIntegrationConfig): NarrativeIntegration {
  if (!narrativeIntegrationInstance) {
    narrativeIntegrationInstance = new NarrativeIntegration(config);
  }
  return narrativeIntegrationInstance;
}

/**
 * Reset narrative integration (for testing/new game)
 */
export function resetNarrativeIntegration(): void {
  narrativeIntegrationInstance = null;
}
