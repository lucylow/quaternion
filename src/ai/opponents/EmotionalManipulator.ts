/**
 * Emotional Manipulator - Psychological warfare through taunts and mind games
 * Triggers emotional responses to influence player decision-making
 */

import { SeededRandom } from '../../lib/SeededRandom';

export type PlayerEmotion = 
  | 'frustration'
  | 'overconfidence'
  | 'panic'
  | 'complacency'
  | 'anger'
  | 'desperation';

export interface Taunt {
  text: string;
  emotion: PlayerEmotion;
  timestamp: number;
  context: string;
}

export class EmotionalManipulator {
  private voiceSystem: any; // Would integrate with actual voice system
  private playerEmotionalState: PlayerEmotion = 'frustration';
  private tauntCooldown: number = 0;
  private rng: SeededRandom;
  private tauntHistory: Taunt[];
  private psychologicalTriggers: Map<PlayerEmotion, string[]>;

  constructor(seed: number, voiceSystem?: any) {
    this.rng = new SeededRandom(seed);
    this.voiceSystem = voiceSystem;
    this.tauntHistory = [];
    this.psychologicalTriggers = new Map([
      ['frustration', ['rushing', 'cheese_strategies', 'repeated_failures']],
      ['overconfidence', ['early_lead', 'tech_advantage', 'military_superiority']],
      ['panic', ['surprise_attack', 'resource_crisis', 'base_under_attack']],
      ['complacency', ['long_game', 'economic_advantage', 'defensive_position']],
      ['anger', ['unit_loss', 'base_damage', 'resource_denial']],
      ['desperation', ['late_game', 'resource_starvation', 'military_inferiority']]
    ]);
  }

  /**
   * Trigger emotional response
   */
  public triggerEmotionalResponse(
    desiredEmotion: PlayerEmotion,
    gameContext: any
  ): Taunt | null {
    // Check cooldown
    if (Date.now() < this.tauntCooldown) {
      return null;
    }

    // Check if emotion is appropriate for context
    if (!this.isEmotionAppropriate(desiredEmotion, gameContext)) {
      return null;
    }

    // Generate taunt
    const taunt = this.generatePsychologicalTaunt(desiredEmotion, gameContext);

    if (taunt) {
      // Play taunt through voice system
      if (this.voiceSystem) {
        this.voiceSystem.playTaunt(taunt.text);
      }

      // Update cooldown based on personality (would vary)
      this.tauntCooldown = Date.now() + this.rng.nextInt(30000, 120000); // 30s to 2min

      // Record taunt
      this.tauntHistory.push(taunt);
    }

    return taunt;
  }

  /**
   * Update player emotional state based on gameplay
   */
  public updateEmotionalState(gameContext: any): void {
    // Infer emotional state from player actions
    if (gameContext.playerActions?.length > 0) {
      const recentActions = gameContext.playerActions.slice(-5);
      
      // Check for frustration indicators
      if (recentActions.filter((a: any) => a.type === 'rush').length > 3) {
        this.playerEmotionalState = 'frustration';
      }
      // Check for overconfidence
      else if (gameContext.playerAdvantage > 0.3 && gameContext.gameTime < 300) {
        this.playerEmotionalState = 'overconfidence';
      }
      // Check for panic
      else if (gameContext.threatLevel > 0.8) {
        this.playerEmotionalState = 'panic';
      }
      // Check for complacency
      else if (gameContext.gameTime > 600 && gameContext.playerAdvantage > 0.2) {
        this.playerEmotionalState = 'complacency';
      }
    }
  }

  /**
   * Check if emotion is appropriate for context
   */
  private isEmotionAppropriate(emotion: PlayerEmotion, gameContext: any): boolean {
    const triggers = this.psychologicalTriggers.get(emotion) || [];

    // Check if context matches triggers
    for (const trigger of triggers) {
      if (gameContext[trigger] || gameContext.playerStrategy === trigger) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate psychological taunt
   */
  private generatePsychologicalTaunt(
    emotion: PlayerEmotion,
    context: any
  ): Taunt | null {
    const tauntTemplates: Record<PlayerEmotion, string[]> = {
      frustration: [
        'Your strategies are so predictable. Are you even trying?',
        'I\'ve seen better tactics from training simulations.',
        'Is that really your best move? How... disappointing.',
        'You keep making the same mistakes. Learn from them.',
        'Perhaps you should try a different approach. This one isn\'t working.'
      ],
      overconfidence: [
        'That early lead won\'t save you. My real strength is just awakening.',
        'You\'re celebrating too soon. The real battle hasn\'t begun.',
        'Interesting opening. Let\'s see how it holds up against my main force.',
        'Confidence is a weakness. I\'ll show you why.',
        'Early victories mean nothing. The war is long.'
      ],
      panic: [
        'Your defenses are crumbling. Can you feel the inevitable?',
        'Every second you delay just brings you closer to defeat.',
        'That resource node was your lifeline. What will you do without it?',
        'The noose tightens. Your options dwindle.',
        'Running out of time... and options.'
      ],
      complacency: [
        'Comfortable? Good. That\'s when mistakes happen.',
        'You\'ve grown too comfortable. Time to wake up.',
        'Your complacency will be your downfall.',
        'While you rest, I prepare. While you celebrate, I plan.',
        'The game isn\'t over until it\'s over.'
      ],
      anger: [
        'Anger clouds judgment. Make better decisions.',
        'I can see you\'re frustrated. Good.',
        'Your rage makes you predictable.',
        'Emotion is weakness. Logic is strength.',
        'Stay calm. It\'s just a game... or is it?'
      ],
      desperation: [
        'Desperate moves are predictable moves.',
        'I can see you\'re running out of options.',
        'When cornered, even the best make mistakes.',
        'Desperation leads to poor decisions.',
        'The end approaches. Make your peace.'
      ]
    };

    const templates = tauntTemplates[emotion] || ['The battle continues.'];
    const text = this.rng.choice(templates);

    return {
      text,
      emotion,
      timestamp: Date.now(),
      context: JSON.stringify(context)
    };
  }

  /**
   * Get taunt history
   */
  public getTauntHistory(): Taunt[] {
    return [...this.tauntHistory];
  }

  /**
   * Get current player emotional state
   */
  public getPlayerEmotionalState(): PlayerEmotion {
    return this.playerEmotionalState;
  }
}

