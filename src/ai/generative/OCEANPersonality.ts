/**
 * OCEAN Personality Model
 * Big Five Personality Framework
 * Based on research: OCEAN model integration with LLMs
 * 
 * Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
 * Each trait is a value from 0-1
 */

export interface OCEANPersonality {
  openness: number; // 0-1: Receptiveness to new experiences and ideas
  conscientiousness: number; // 0-1: Organization, discipline, responsibility
  extraversion: number; // 0-1: Sociability and assertiveness
  agreeableness: number; // 0-1: Cooperativeness and empathy
  neuroticism: number; // 0-1: Emotional stability (inverted: higher = more anxious)
}

export interface PersonalityProfile {
  ocean: OCEANPersonality;
  traits: string[]; // Descriptive traits (e.g., "curious", "organized", "outgoing")
  background: string; // Character background
  speechStyle: string; // How they speak
  values: string[]; // What they value
}

/**
 * OCEAN Personality System
 * Manages personality traits and their influence on behavior
 */
export class OCEANPersonalitySystem {
  /**
   * Generate random OCEAN personality
   */
  static generateRandom(): OCEANPersonality {
    return {
      openness: Math.random(),
      conscientiousness: Math.random(),
      extraversion: Math.random(),
      agreeableness: Math.random(),
      neuroticism: Math.random()
    };
  }

  /**
   * Generate personality from archetype
   */
  static fromArchetype(archetype: string): OCEANPersonality {
    const archetypes: Record<string, OCEANPersonality> = {
      // Trader archetypes
      'greedy_trader': {
        openness: 0.3,
        conscientiousness: 0.8,
        extraversion: 0.7,
        agreeableness: 0.2,
        neuroticism: 0.6
      },
      'honest_trader': {
        openness: 0.5,
        conscientiousness: 0.9,
        extraversion: 0.6,
        agreeableness: 0.8,
        neuroticism: 0.3
      },
      'cautious_trader': {
        openness: 0.2,
        conscientiousness: 0.7,
        extraversion: 0.3,
        agreeableness: 0.6,
        neuroticism: 0.7
      },
      'charismatic_trader': {
        openness: 0.7,
        conscientiousness: 0.5,
        extraversion: 0.9,
        agreeableness: 0.7,
        neuroticism: 0.4
      },
      // Commander archetypes
      'aggressive_commander': {
        openness: 0.4,
        conscientiousness: 0.8,
        extraversion: 0.7,
        agreeableness: 0.3,
        neuroticism: 0.5
      },
      'defensive_commander': {
        openness: 0.5,
        conscientiousness: 0.9,
        extraversion: 0.4,
        agreeableness: 0.6,
        neuroticism: 0.6
      },
      'strategic_commander': {
        openness: 0.8,
        conscientiousness: 0.9,
        extraversion: 0.5,
        agreeableness: 0.6,
        neuroticism: 0.3
      },
      // Default
      'default': {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5
      }
    };

    return archetypes[archetype] || archetypes['default'];
  }

  /**
   * Get descriptive traits from OCEAN scores
   */
  static getTraits(ocean: OCEANPersonality): string[] {
    const traits: string[] = [];

    if (ocean.openness > 0.7) traits.push('curious', 'creative', 'open-minded');
    if (ocean.openness < 0.3) traits.push('traditional', 'practical', 'conventional');

    if (ocean.conscientiousness > 0.7) traits.push('organized', 'disciplined', 'reliable');
    if (ocean.conscientiousness < 0.3) traits.push('spontaneous', 'flexible', 'carefree');

    if (ocean.extraversion > 0.7) traits.push('outgoing', 'sociable', 'assertive');
    if (ocean.extraversion < 0.3) traits.push('introverted', 'reserved', 'quiet');

    if (ocean.agreeableness > 0.7) traits.push('cooperative', 'empathetic', 'trusting');
    if (ocean.agreeableness < 0.3) traits.push('competitive', 'skeptical', 'independent');

    if (ocean.neuroticism > 0.7) traits.push('anxious', 'emotional', 'sensitive');
    if (ocean.neuroticism < 0.3) traits.push('calm', 'stable', 'resilient');

    return traits.length > 0 ? traits : ['balanced'];
  }

  /**
   * Get speech style from OCEAN scores
   */
  static getSpeechStyle(ocean: OCEANPersonality): string {
    const styles: string[] = [];

    if (ocean.extraversion > 0.7) styles.push('enthusiastic', 'expressive');
    if (ocean.extraversion < 0.3) styles.push('reserved', 'measured');

    if (ocean.agreeableness > 0.7) styles.push('friendly', 'warm');
    if (ocean.agreeableness < 0.3) styles.push('direct', 'blunt');

    if (ocean.conscientiousness > 0.7) styles.push('precise', 'formal');
    if (ocean.conscientiousness < 0.3) styles.push('casual', 'relaxed');

    if (ocean.neuroticism > 0.7) styles.push('hesitant', 'uncertain');
    if (ocean.neuroticism < 0.3) styles.push('confident', 'assured');

    return styles.length > 0 ? styles.join(', ') : 'neutral';
  }

  /**
   * Modify behavior based on personality
   */
  static influenceBehavior<T extends Record<string, any>>(
    behavior: T,
    ocean: OCEANPersonality
  ): T {
    const modified = { ...behavior } as any;

    // Example: influence risk tolerance
    if ('riskTolerance' in modified) {
      const baseRisk = modified.riskTolerance as number || 0.5;
      // High openness and low neuroticism = higher risk tolerance
      const riskMod = (ocean.openness * 0.3) - (ocean.neuroticism * 0.3);
      modified.riskTolerance = Math.max(0, Math.min(1, baseRisk + riskMod));
    }

    // Example: influence social behavior
    if ('socialActivity' in modified) {
      modified.socialActivity = ocean.extraversion;
    }

    // Example: influence cooperation
    if ('cooperation' in modified) {
      modified.cooperation = ocean.agreeableness;
    }

    return modified as T;
  }

  /**
   * Validate OCEAN personality
   */
  static validate(ocean: OCEANPersonality): boolean {
    return (
      ocean.openness >= 0 && ocean.openness <= 1 &&
      ocean.conscientiousness >= 0 && ocean.conscientiousness <= 1 &&
      ocean.extraversion >= 0 && ocean.extraversion <= 1 &&
      ocean.agreeableness >= 0 && ocean.agreeableness <= 1 &&
      ocean.neuroticism >= 0 && ocean.neuroticism <= 1
    );
  }
}


