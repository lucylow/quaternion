/**
 * Emotional Pacing Director
 * Manages emotional story beats, pacing, and atmospheric transitions
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import type { WorldModel, PlayerProfile } from './AINarrativeDirector';

export interface EmotionalBeat {
  id: string;
  type: EmotionalType;
  intensity: number; // 0-1
  duration: number; // seconds
  triggerConditions: string[];
  characterReactions: string[];
  description: string;
  executed: boolean;
}

export type EmotionalType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'triumph' | 'melancholic';

export interface BeatExecution {
  beat: EmotionalBeat;
  timestamp: number;
  characterReactions: Array<{ characterId: string; reaction: string }>;
}

export class EmotionalPacingDirector {
  private emotionalBeats: EmotionalBeat[] = [];
  private currentPacing: number = 0.5; // 0-1
  private currentDominantEmotion: EmotionalType = 'joy';
  private lastMajorBeatTime: number = 0;
  private executedBeats: BeatExecution[] = [];
  
  private memory: any; // Reference to memory system for tracking

  constructor(
    private llm: LLMIntegration,
    private onBeatExecute?: (beat: EmotionalBeat) => void
  ) {}

  /**
   * Update emotional pacing based on world and player state
   */
  async updateEmotionalPacing(
    world: WorldModel,
    player: PlayerProfile
  ): Promise<void> {
    // Calculate ideal pacing based on recent events
    const idealPacing = this.calculateIdealPacing(world, player);

    // Smooth transition
    this.currentPacing = this.lerp(this.currentPacing, idealPacing, 0.1);

    // Check for beat triggers
    await this.checkEmotionalBeatTriggers(world, player);

    // Update dominant emotion
    this.updateDominantEmotion(world, player);
  }

  /**
   * Calculate ideal pacing based on world state
   */
  private calculateIdealPacing(world: WorldModel, player: PlayerProfile): number {
    let pacing = 0.5;

    // Recent intense events increase pacing
    if (world.recentEvents.length > 0) {
      const avgIntensity = world.recentEvents
        .slice(-5)
        .reduce((sum, e) => sum + e.intensity, 0) / world.recentEvents.length;
      pacing += avgIntensity * 0.2;
    }

    // Player's emotional state affects pacing
    pacing += player.currentEmotion.getPacingModifier();

    // Time since last major beat
    const timeSinceLastBeat = Date.now() - this.lastMajorBeatTime;
    pacing += Math.min(1, timeSinceLastBeat / 300000) * 0.2; // 5 minute cooldown

    // World tension affects pacing
    pacing += (world.globalTension / 100 - 0.5) * 0.3;

    return Math.max(0, Math.min(1, pacing));
  }

  /**
   * Check and trigger emotional beats
   */
  private async checkEmotionalBeatTriggers(
    world: WorldModel,
    player: PlayerProfile
  ): Promise<void> {
    const beatsToExecute: EmotionalBeat[] = [];

    for (const beat of this.emotionalBeats) {
      if (!beat.executed && this.shouldTriggerBeat(beat, world, player)) {
        beatsToExecute.push(beat);
        beat.executed = true;
      }
    }

    // Execute beats (only one at a time for smoothness)
    if (beatsToExecute.length > 0) {
      const beat = beatsToExecute[0];
      await this.executeEmotionalBeat(beat, world, player);
      this.emotionalBeats = this.emotionalBeats.filter(b => b.id !== beat.id);
    }

    // Generate new beats if needed
    if (this.emotionalBeats.length < 3) {
      await this.generateNewEmotionalBeats(world, player);
    }
  }

  /**
   * Check if a beat should trigger
   */
  private shouldTriggerBeat(
    beat: EmotionalBeat,
    world: WorldModel,
    player: PlayerProfile
  ): boolean {
    // Evaluate trigger conditions
    return beat.triggerConditions.every(condition => 
      this.evaluateCondition(condition, world, player)
    );
  }

  /**
   * Evaluate a condition string
   */
  private evaluateCondition(
    condition: string,
    world: WorldModel,
    player: PlayerProfile
  ): boolean {
    // Simple condition evaluation
    // Could be extended with a proper condition parser
    if (condition.includes('tension >')) {
      const threshold = parseFloat(condition.split('>')[1]);
      return world.globalTension / 100 > threshold;
    }
    if (condition.includes('recent_events >')) {
      const threshold = parseInt(condition.split('>')[1]);
      return world.recentEvents.length > threshold;
    }
    if (condition.includes('player_emotion ==')) {
      const emotion = condition.split('==')[1].trim();
      return player.currentEmotion.type === emotion;
    }
    // Default to true if condition not recognized
    return true;
  }

  /**
   * Execute an emotional beat
   */
  private async executeEmotionalBeat(
    beat: EmotionalBeat,
    world: WorldModel,
    player: PlayerProfile
  ): Promise<void> {
    const execution: BeatExecution = {
      beat,
      timestamp: Date.now(),
      characterReactions: []
    };

    // Generate character reactions
    for (const characterId of beat.characterReactions) {
      const reaction = await this.generateCharacterReaction(
        characterId,
        beat,
        world,
        player
      );
      execution.characterReactions.push({
        characterId,
        reaction
      });
    }

    this.executedBeats.push(execution);
    this.lastMajorBeatTime = Date.now();

    // Notify listeners
    if (this.onBeatExecute) {
      this.onBeatExecute(beat);
    }

    // Update audio/visual systems would be called here
    // AudioManager.Instance.PlayEmotionalStinger(beat);
    // VisualManager.Instance.PlayEffect(beat);
    // UIManager.Instance.ShowEmotionalPrompt(beat.type, beat.intensity);
  }

  /**
   * Generate character reaction to emotional beat
   */
  private async generateCharacterReaction(
    characterId: string,
    beat: EmotionalBeat,
    world: WorldModel,
    player: PlayerProfile
  ): Promise<string> {
    const prompt = `Character ${characterId} reacts to this emotional beat:

Type: ${beat.type}
Intensity: ${beat.intensity}
Description: ${beat.description}

Generate a brief reaction (1-2 sentences) that matches the emotional tone.`;

    try {
      const reaction = await this.llm.generateText(prompt);
      return reaction.trim();
    } catch (error) {
      return this.getFallbackReaction(beat.type);
    }
  }

  /**
   * Generate new emotional beats
   */
  private async generateNewEmotionalBeats(
    world: WorldModel,
    player: PlayerProfile
  ): Promise<void> {
    const prompt = `Generate emotional story beats for current game state:

WORLD STATE:
- Tension: ${world.globalTension}/100
- Recent Events: ${world.recentEvents.slice(-3).map(e => e.description).join(', ')}
- Active Storylines: ${world.activeStorylines.length}

PLAYER STATE:
- Emotional State: ${player.currentEmotion.type}
- Recent Choices: ${player.recentChoices.slice(-3).join(', ')}
- Archetype: ${player.dominantArchetype}

Generate 2-3 emotional beats that:
- Match current pacing: ${this.currentPacing.toFixed(2)}/1.0
- Reinforce or contrast current emotion
- Use available characters and locations
- Advance character development
- Last 30-90 seconds each

Respond in JSON array:
[
  {
    "type": "joy/sadness/anger/fear/surprise/triumph/melancholic",
    "intensity": 0.7,
    "duration": 60,
    "triggerConditions": ["condition1", "condition2"],
    "characterReactions": ["character1", "character2"],
    "description": "What happens during this beat"
  }
]`;

    try {
      const response = await this.llm.generateText(prompt);
      const beats = this.parseBeatsFromJSON(response);
      
      for (const beat of beats) {
        beat.id = `beat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        beat.executed = false;
        this.emotionalBeats.push(beat);
      }
    } catch (error) {
      console.error('Failed to generate emotional beats:', error);
      // Add fallback beats
      this.addFallbackBeats(world);
    }
  }

  /**
   * Update dominant emotion
   */
  private updateDominantEmotion(world: WorldModel, player: PlayerProfile): void {
    // Calculate dominant emotion from world and player state
    if (world.globalTension > 70) {
      this.currentDominantEmotion = 'fear';
    } else if (world.globalTension < 30) {
      this.currentDominantEmotion = 'joy';
    } else if (player.currentEmotion.type === 'sadness') {
      this.currentDominantEmotion = 'melancholic';
    } else {
      this.currentDominantEmotion = 'joy';
    }
  }

  /**
   * Get current pacing and emotion state
   */
  getCurrentState() {
    return {
      pacing: this.currentPacing,
      dominantEmotion: this.currentDominantEmotion,
      activeBeats: this.emotionalBeats.filter(b => !b.executed),
      recentBeats: this.executedBeats.slice(-5)
    };
  }

  /**
   * Add a beat manually (for testing or specific events)
   */
  addBeat(beat: Omit<EmotionalBeat, 'id' | 'executed'>): void {
    const fullBeat: EmotionalBeat = {
      ...beat,
      id: `beat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executed: false
    };
    this.emotionalBeats.push(fullBeat);
  }

  private parseBeatsFromJSON(text: string): Omit<EmotionalBeat, 'id' | 'executed'>[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse beats JSON:', error);
    }
    return [];
  }

  private getFallbackReaction(type: EmotionalType): string {
    const reactions: Record<EmotionalType, string> = {
      joy: 'This is wonderful!',
      sadness: 'How tragic...',
      anger: 'This is unacceptable!',
      fear: 'I\'m worried about this.',
      surprise: 'I didn\'t expect that!',
      triumph: 'We\'ve won!',
      melancholic: 'So much has changed...'
    };
    return reactions[type] || 'Interesting.';
  }

  private addFallbackBeats(world: WorldModel): void {
    if (world.globalTension > 60) {
      this.addBeat({
        type: 'fear',
        intensity: 0.7,
        duration: 45,
        triggerConditions: ['tension > 0.6'],
        characterReactions: [],
        description: 'The situation grows more tense.'
      });
    }
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
}

