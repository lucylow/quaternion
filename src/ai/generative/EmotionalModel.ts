/**
 * Emotional Modeling System
 * Russell's Circumplex Model (Valence-Arousal space)
 * Based on research: Emotion Behavior Tree (EmoBeT) framework
 * 
 * Tracks emotions, mood, and their influence on behavior
 */

import { OCEANPersonality } from './OCEANPersonality';

export interface Emotion {
  type: EmotionType;
  intensity: number; // 0-10
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 (calm to excited)
  timestamp: number;
  elicitor?: string; // What caused this emotion
  duration?: number; // Expected duration in ms
}

export type EmotionType =
  | 'joy' | 'happiness' | 'excitement' | 'pride' | 'relief' | 'contentment'
  | 'sadness' | 'grief' | 'disappointment' | 'loneliness' | 'shame'
  | 'fear' | 'anxiety' | 'worry' | 'terror' | 'dread'
  | 'anger' | 'rage' | 'frustration' | 'irritation' | 'resentment'
  | 'disgust' | 'contempt' | 'revulsion'
  | 'surprise' | 'shock' | 'amazement'
  | 'neutral';

export interface Mood {
  valence: number; // -1 to 1, average of recent emotions
  arousal: number; // 0-1, average of recent emotions
  intensity: number; // 0-1, how strong the mood is
  dominantEmotion: EmotionType;
  timestamp: number;
}

export interface EmotionElicitor {
  event: string;
  emotionType: EmotionType;
  baseIntensity: number; // 0-10
  conditions?: string[]; // Conditions that must be met
}

/**
 * Emotional Modeling System
 * Tracks emotions, mood, and their behavioral influence
 */
export class EmotionalModel {
  private emotions: Emotion[] = [];
  private currentMood: Mood;
  private personality: OCEANPersonality;
  private emotionElicitors: EmotionElicitor[] = [];
  private maxEmotions = 50;
  private moodWindow = 1000 * 60 * 60; // 1 hour for mood calculation

  constructor(personality: OCEANPersonality) {
    this.personality = personality;
    this.currentMood = this.createNeutralMood();
    this.initializeElicitors();
  }

  /**
   * Initialize emotion elicitors based on common events
   */
  private initializeElicitors(): void {
    this.emotionElicitors = [
      // Positive events
      { event: 'successful_trade', emotionType: 'joy', baseIntensity: 6 },
      { event: 'player_greeting', emotionType: 'happiness', baseIntensity: 4 },
      { event: 'favorable_deal', emotionType: 'contentment', baseIntensity: 5 },
      { event: 'compliment', emotionType: 'pride', baseIntensity: 5 },
      
      // Negative events
      { event: 'failed_trade', emotionType: 'disappointment', baseIntensity: 5 },
      { event: 'player_insult', emotionType: 'anger', baseIntensity: 6 },
      { event: 'combat_nearby', emotionType: 'fear', baseIntensity: 7 },
      { event: 'loss', emotionType: 'sadness', baseIntensity: 6 },
      { event: 'betrayal', emotionType: 'anger', baseIntensity: 8 },
      
      // Neutral/surprising events
      { event: 'unexpected_visitor', emotionType: 'surprise', baseIntensity: 5 },
      { event: 'quest_offer', emotionType: 'excitement', baseIntensity: 6 }
    ];
  }

  /**
   * Process an event and generate appropriate emotion
   */
  async processEvent(event: string, context?: any): Promise<Emotion | null> {
    // Find matching elicitor
    const elicitor = this.findElicitor(event, context);
    if (!elicitor) {
      return null; // No emotion for this event
    }

    // Calculate intensity based on personality
    const baseIntensity = elicitor.baseIntensity;
    const personalityMod = this.calculatePersonalityModifier(elicitor.emotionType);
    const intensity = Math.min(10, baseIntensity * personalityMod);

    // Get emotion properties
    const emotionProps = this.getEmotionProperties(elicitor.emotionType);

    const emotion: Emotion = {
      type: elicitor.emotionType,
      intensity,
      valence: emotionProps.valence,
      arousal: emotionProps.arousal,
      timestamp: Date.now(),
      elicitor: event,
      duration: this.calculateDuration(elicitor.emotionType, intensity)
    };

    this.emotions.push(emotion);

    // Limit emotion history
    if (this.emotions.length > this.maxEmotions) {
      this.emotions.shift();
    }

    // Update mood
    this.updateMood();

    return emotion;
  }

  /**
   * Find matching emotion elicitor for an event
   */
  private findElicitor(event: string, context?: any): EmotionElicitor | null {
    const eventLower = event.toLowerCase();
    
    for (const elicitor of this.emotionElicitors) {
      if (eventLower.includes(elicitor.event.toLowerCase()) ||
          eventLower.includes(elicitor.emotionType.toLowerCase())) {
        // Check conditions if any
        if (elicitor.conditions) {
          const allConditionsMet = elicitor.conditions.every(condition => {
            if (context) {
              return context[condition] !== undefined && context[condition] !== false;
            }
            return false;
          });
          if (!allConditionsMet) continue;
        }
        return elicitor;
      }
    }

    return null;
  }

  /**
   * Calculate personality modifier for emotion intensity
   */
  private calculatePersonalityModifier(emotionType: EmotionType): number {
    let modifier = 1.0;

    // Neuroticism increases negative emotion intensity
    if (this.isNegativeEmotion(emotionType)) {
      modifier += this.personality.neuroticism * 0.3;
    }

    // Extraversion increases positive emotion intensity
    if (this.isPositiveEmotion(emotionType)) {
      modifier += this.personality.extraversion * 0.2;
    }

    // Agreeableness moderates anger
    if (emotionType === 'anger' || emotionType === 'rage' || emotionType === 'frustration') {
      modifier -= this.personality.agreeableness * 0.2;
    }

    return Math.max(0.5, Math.min(1.5, modifier));
  }

  /**
   * Get emotion properties (valence, arousal)
   */
  private getEmotionProperties(emotionType: EmotionType): { valence: number; arousal: number } {
    const emotionMap: Record<EmotionType, { valence: number; arousal: number }> = {
      // Positive emotions
      joy: { valence: 0.8, arousal: 0.7 },
      happiness: { valence: 0.7, arousal: 0.6 },
      excitement: { valence: 0.8, arousal: 0.9 },
      pride: { valence: 0.7, arousal: 0.5 },
      relief: { valence: 0.6, arousal: 0.3 },
      contentment: { valence: 0.6, arousal: 0.2 },
      
      // Negative emotions
      sadness: { valence: -0.7, arousal: 0.2 },
      grief: { valence: -0.9, arousal: 0.3 },
      disappointment: { valence: -0.6, arousal: 0.3 },
      loneliness: { valence: -0.6, arousal: 0.1 },
      shame: { valence: -0.7, arousal: 0.4 },
      
      fear: { valence: -0.5, arousal: 0.8 },
      anxiety: { valence: -0.6, arousal: 0.7 },
      worry: { valence: -0.5, arousal: 0.6 },
      terror: { valence: -0.8, arousal: 0.9 },
      dread: { valence: -0.7, arousal: 0.7 },
      
      anger: { valence: -0.7, arousal: 0.8 },
      rage: { valence: -0.9, arousal: 0.9 },
      frustration: { valence: -0.6, arousal: 0.7 },
      irritation: { valence: -0.5, arousal: 0.6 },
      resentment: { valence: -0.7, arousal: 0.5 },
      
      disgust: { valence: -0.8, arousal: 0.6 },
      contempt: { valence: -0.7, arousal: 0.4 },
      revulsion: { valence: -0.9, arousal: 0.7 },
      
      // Neutral/surprising
      surprise: { valence: 0.0, arousal: 0.8 },
      shock: { valence: 0.0, arousal: 0.9 },
      amazement: { valence: 0.3, arousal: 0.7 },
      neutral: { valence: 0.0, arousal: 0.0 }
    };

    return emotionMap[emotionType] || emotionMap.neutral;
  }

  /**
   * Calculate emotion duration
   */
  private calculateDuration(emotionType: EmotionType, intensity: number): number {
    // Base duration in ms
    const baseDurations: Record<string, number> = {
      joy: 1000 * 60 * 5, // 5 minutes
      anger: 1000 * 60 * 10, // 10 minutes
      fear: 1000 * 60 * 3, // 3 minutes
      sadness: 1000 * 60 * 15, // 15 minutes
      surprise: 1000 * 30, // 30 seconds
      neutral: 0
    };

    const base = baseDurations[emotionType] || 1000 * 60 * 5;
    
    // Intensity affects duration (higher intensity = longer duration)
    const duration = base * (1 + (intensity / 10) * 0.5);
    
    // Neuroticism increases negative emotion duration
    if (this.isNegativeEmotion(emotionType)) {
      return duration * (1 + this.personality.neuroticism * 0.3);
    }

    return duration;
  }

  /**
   * Update current mood based on recent emotions
   */
  private updateMood(): void {
    const cutoff = Date.now() - this.moodWindow;
    const recentEmotions = this.emotions.filter(e => e.timestamp >= cutoff);

    if (recentEmotions.length === 0) {
      this.currentMood = this.createNeutralMood();
      return;
    }

    // Calculate average valence and arousal
    const avgValence = recentEmotions.reduce((sum, e) => sum + e.valence, 0) / recentEmotions.length;
    const avgArousal = recentEmotions.reduce((sum, e) => sum + e.arousal, 0) / recentEmotions.length;
    const avgIntensity = recentEmotions.reduce((sum, e) => sum + e.intensity, 0) / recentEmotions.length / 10;

    // Find dominant emotion
    const emotionCounts = new Map<EmotionType, number>();
    recentEmotions.forEach(e => {
      emotionCounts.set(e.type, (emotionCounts.get(e.type) || 0) + e.intensity);
    });

    let dominantEmotion: EmotionType = 'neutral';
    let maxCount = 0;
    emotionCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = type;
      }
    });

    this.currentMood = {
      valence: avgValence,
      arousal: avgArousal,
      intensity: avgIntensity,
      dominantEmotion,
      timestamp: Date.now()
    };
  }

  /**
   * Create neutral mood
   */
  private createNeutralMood(): Mood {
    return {
      valence: 0,
      arousal: 0.3,
      intensity: 0.2,
      dominantEmotion: 'neutral',
      timestamp: Date.now()
    };
  }

  /**
   * Check if emotion is positive
   */
  private isPositiveEmotion(emotionType: EmotionType): boolean {
    const positive = ['joy', 'happiness', 'excitement', 'pride', 'relief', 'contentment'];
    return positive.includes(emotionType);
  }

  /**
   * Check if emotion is negative
   */
  private isNegativeEmotion(emotionType: EmotionType): boolean {
    const negative = [
      'sadness', 'grief', 'disappointment', 'loneliness', 'shame',
      'fear', 'anxiety', 'worry', 'terror', 'dread',
      'anger', 'rage', 'frustration', 'irritation', 'resentment',
      'disgust', 'contempt', 'revulsion'
    ];
    return negative.includes(emotionType);
  }

  /**
   * Get current mood
   */
  getMood(): Mood {
    return { ...this.currentMood };
  }

  /**
   * Get recent emotions
   */
  getRecentEmotions(limit: number = 10): Emotion[] {
    return this.emotions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get emotion by type
   */
  getEmotionByType(type: EmotionType): Emotion | null {
    const emotion = this.emotions
      .filter(e => e.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    return emotion || null;
  }

  /**
   * Influence behavior based on mood
   */
  influenceBehavior<T extends Record<string, any>>(behavior: T): T {
    const modified = { ...behavior };

    // Mood affects decision-making
    if (this.currentMood.valence < -0.5) {
      // Negative mood: more cautious, less cooperative
      if ('riskTolerance' in modified) {
        modified.riskTolerance = (modified.riskTolerance as number || 0.5) * 0.7;
      }
      if ('cooperation' in modified) {
        modified.cooperation = (modified.cooperation as number || 0.5) * 0.8;
      }
    } else if (this.currentMood.valence > 0.5) {
      // Positive mood: more optimistic, more cooperative
      if ('riskTolerance' in modified) {
        modified.riskTolerance = Math.min(1, (modified.riskTolerance as number || 0.5) * 1.2);
      }
      if ('cooperation' in modified) {
        modified.cooperation = Math.min(1, (modified.cooperation as number || 0.5) * 1.2);
      }
    }

    // High arousal: more impulsive
    if (this.currentMood.arousal > 0.7) {
      if ('impulsivity' in modified) {
        modified.impulsivity = 0.8;
      }
    }

    return modified;
  }

  /**
   * Add custom emotion elicitor
   */
  addElicitor(elicitor: EmotionElicitor): void {
    this.emotionElicitors.push(elicitor);
  }

  /**
   * Clear emotion history
   */
  clear(): void {
    this.emotions = [];
    this.currentMood = this.createNeutralMood();
  }
}

