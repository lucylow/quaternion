/**
 * Adaptive Commander AI with Learning
 * Evolving personalities based on match outcomes
 * LLM-driven advisor agents with distinct personalities
 */

import { LLMIntegration } from '../integrations/LLMIntegration';

export enum QuaternionAxis {
  Matter = 0,
  Energy = 1,
  Life = 2,
  Knowledge = 3
}

export interface CommanderPersonality {
  name: string;
  axisWeights: number[]; // [Matter, Energy, Life, Knowledge] - 0-1 each
  learningRate: number;
  matchHistory: MatchOutcome[];
  personalityTraits: string[];
}

export interface MatchOutcome {
  victory: boolean;
  timestamp: number;
  axisPerformance: number[]; // Performance on each axis
  opponentStrategy: string;
}

export interface TacticalComment {
  text: string;
  axis: QuaternionAxis;
  confidence: number;
}

export class AdaptiveCommanderAI {
  private llm: LLMIntegration | null = null;
  private personality: CommanderPersonality;
  private advisorPersonalities: Map<string, AdvisorPersonality> = new Map();

  constructor(
    name: string,
    initialWeights?: number[],
    llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }
  ) {
    this.personality = {
      name,
      axisWeights: initialWeights || [0.5, 0.5, 0.5, 0.5],
      learningRate: 0.05,
      matchHistory: [],
      personalityTraits: []
    };

    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.8,
        maxTokens: 200
      });
    }

    this.initializeAdvisors();
  }

  /**
   * Initialize advisor personalities
   */
  private initializeAdvisors(): void {
    this.advisorPersonalities.set('economist', {
      name: 'The Economist',
      axis: QuaternionAxis.Matter,
      tone: 'analytical',
      moralStance: 'pragmatic',
      voiceProfile: 'economist'
    });

    this.advisorPersonalities.set('biologist', {
      name: 'The Biologist',
      axis: QuaternionAxis.Life,
      tone: 'empathetic',
      moralStance: 'preservationist',
      voiceProfile: 'biologist'
    });

    this.advisorPersonalities.set('ascendant', {
      name: 'The Ascendant',
      axis: QuaternionAxis.Knowledge,
      tone: 'mystical',
      moralStance: 'transcendent',
      voiceProfile: 'ascendant'
    });

    this.advisorPersonalities.set('engineer', {
      name: 'The Engineer',
      axis: QuaternionAxis.Energy,
      tone: 'precise',
      moralStance: 'efficient',
      voiceProfile: 'engineer'
    });
  }

  /**
   * Adjust personality after match
   */
  adjustAfterMatch(victory: boolean, axisPerformance: number[]): void {
    const outcome: MatchOutcome = {
      victory,
      timestamp: Date.now(),
      axisPerformance,
      opponentStrategy: 'unknown'
    };

    this.personality.matchHistory.push(outcome);

    // Adjust weights based on performance
    for (let i = 0; i < 4; i++) {
      const performance = axisPerformance[i] || 0;
      const adjustment = victory 
        ? this.personality.learningRate * performance
        : -this.personality.learningRate * (1 - performance);
      
      this.personality.axisWeights[i] = Math.max(0, Math.min(1, 
        this.personality.axisWeights[i] + adjustment
      ));
    }

    console.log(`🧠 Commander ${this.personality.name} personality updated → ${this.personality.axisWeights.map(w => w.toFixed(2)).join(', ')}`);
  }

  /**
   * Get tactical comment from AI
   */
  async getTacticalComment(context: {
    currentState: string;
    playerActions: string[];
    axisBalance: number[];
  }): Promise<TacticalComment> {
    const dominantAxis = this.getDominantAxis();
    
    if (this.llm) {
      try {
        const advisor = this.getAdvisorForAxis(dominantAxis);
        const prompt = this.buildTacticalPrompt(advisor, context);
        
        const response = await this.llm.generateText(prompt);
        
        return {
          text: response.trim(),
          axis: dominantAxis,
          confidence: this.calculateConfidence()
        };
      } catch (error) {
        console.warn('Tactical comment generation failed', error);
      }
    }

    // Fallback
    return {
      text: `AI prioritizes ${QuaternionAxis[dominantAxis]} — strategic bias recalibrated.`,
      axis: dominantAxis,
      confidence: 0.7
    };
  }

  /**
   * Get dominant axis
   */
  private getDominantAxis(): QuaternionAxis {
    const weights = this.personality.axisWeights;
    let maxIndex = 0;
    let maxValue = weights[0];

    for (let i = 1; i < weights.length; i++) {
      if (weights[i] > maxValue) {
        maxValue = weights[i];
        maxIndex = i;
      }
    }

    return maxIndex as QuaternionAxis;
  }

  /**
   * Get advisor for axis
   */
  private getAdvisorForAxis(axis: QuaternionAxis): AdvisorPersonality {
    const advisors = Array.from(this.advisorPersonalities.values());
    return advisors.find(a => a.axis === axis) || advisors[0];
  }

  /**
   * Build tactical prompt
   */
  private buildTacticalPrompt(
    advisor: AdvisorPersonality,
    context: { currentState: string; playerActions: string[]; axisBalance: number[] }
  ): string {
    return `You are ${advisor.name}, an AI advisor in a sci-fi RTS game called Quaternion.

Personality:
- Tone: ${advisor.tone}
- Moral Stance: ${advisor.moralStance}
- Primary Focus: ${QuaternionAxis[advisor.axis]}

Current Game State: ${context.currentState}
Player Actions: ${context.playerActions.join(', ')}
Axis Balance: Matter=${context.axisBalance[0].toFixed(2)}, Energy=${context.axisBalance[1].toFixed(2)}, Life=${context.axisBalance[2].toFixed(2)}, Knowledge=${context.axisBalance[3].toFixed(2)}

Generate a brief tactical comment (max 30 words) that:
- Reflects your personality and moral stance
- Comments on the current axis balance
- Provides strategic insight
- Matches your tone

Output only the comment text, no quotes or formatting.`;
  }

  /**
   * Calculate confidence based on match history
   */
  private calculateConfidence(): number {
    if (this.personality.matchHistory.length === 0) return 0.5;
    
    const recentMatches = this.personality.matchHistory.slice(-5);
    const winRate = recentMatches.filter(m => m.victory).length / recentMatches.length;
    
    return Math.min(0.9, 0.5 + winRate * 0.4);
  }

  /**
   * Get personality summary
   */
  getPersonalitySummary(): string {
    const weights = this.personality.axisWeights;
    const dominant = this.getDominantAxis();
    const winRate = this.personality.matchHistory.length > 0
      ? this.personality.matchHistory.filter(m => m.victory).length / this.personality.matchHistory.length
      : 0;

    return `${this.personality.name}: Dominant axis: ${QuaternionAxis[dominant]} (${weights[dominant].toFixed(2)}), Win rate: ${(winRate * 100).toFixed(1)}%, Matches: ${this.personality.matchHistory.length}`;
  }

  /**
   * Get current axis weights
   */
  getAxisWeights(): number[] {
    return [...this.personality.axisWeights];
  }

  /**
   * Export personality for persistence
   */
  exportPersonality(): CommanderPersonality {
    return { ...this.personality };
  }

  /**
   * Import personality from persistence
   */
  importPersonality(personality: CommanderPersonality): void {
    this.personality = { ...personality };
  }
}

interface AdvisorPersonality {
  name: string;
  axis: QuaternionAxis;
  tone: string;
  moralStance: string;
  voiceProfile: string;
}


