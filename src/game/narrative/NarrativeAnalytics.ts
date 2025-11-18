/**
 * Narrative Analytics & Learning
 * Tracks player choices, engagement, and provides insights for narrative improvement
 */

import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import type { PlayerProfile, EmotionalState } from './AINarrativeDirector';

export interface PlayerChoiceData {
  choiceId: string;
  context: string;
  optionSelected: string;
  optionsAvailable: string[];
  decisionTime: number; // milliseconds
  playerArchetype: string;
  playerEmotion: EmotionalState;
  outcomes: Record<string, number>; // outcome_type -> value
  timestamp: number;
}

export interface StoryEngagementMetrics {
  storyId: string;
  timeSpentOnStory: number; // seconds
  choicesMade: number;
  emotionalBeatsTriggered: number;
  playerSatisfactionScore: number; // 0-1 (estimated)
  completedBranches: string[];
  emotionalResponses: Record<string, number>; // emotion_type -> count
}

export interface NarrativeInsight {
  type: 'preference' | 'engagement' | 'pacing' | 'character' | 'choice_pattern';
  title: string;
  description: string;
  recommendations: string[];
  confidence: number; // 0-1
}

export class NarrativeAnalytics {
  private choiceHistory: PlayerChoiceData[] = [];
  private storyMetrics: Map<string, StoryEngagementMetrics> = new Map();
  private archetypePreferenceModels: Map<string, string[]> = new Map();

  constructor(private llm: LLMIntegration) {}

  /**
   * Record a player choice
   */
  recordPlayerChoice(choice: PlayerChoiceData): void {
    this.choiceHistory.push(choice);

    // Keep only last 1000 choices
    if (this.choiceHistory.length > 1000) {
      this.choiceHistory.shift();
    }

    // Analyze choice patterns
    this.analyzeChoicePatterns(choice);

    // Update narrative models
    this.updateNarrativeModels(choice);
  }

  /**
   * Analyze choice patterns for player archetype
   */
  private analyzeChoicePatterns(choice: PlayerChoiceData): void {
    // Look for player preference patterns
    const similarChoices = this.choiceHistory
      .filter(c => c.playerArchetype === choice.playerArchetype)
      .filter(c => c.context === choice.context);

    if (similarChoices.length >= 3) {
      // Detect patterns in this archetype's choices
      const optionCounts = new Map<string, number>();
      for (const c of similarChoices) {
        optionCounts.set(c.optionSelected, (optionCounts.get(c.optionSelected) || 0) + 1);
      }

      const preferredOptions = Array.from(optionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([option]) => option)
        .slice(0, 3); // Top 3 preferences

      // Update archetype model
      this.updateArchetypePreferenceModel(choice.playerArchetype, preferredOptions);
    }
  }

  /**
   * Update archetype preference model
   */
  private updateArchetypePreferenceModel(archetype: string, preferences: string[]): void {
    this.archetypePreferenceModels.set(archetype, preferences);
  }

  /**
   * Update narrative models based on choice data
   */
  private updateNarrativeModels(choice: PlayerChoiceData): void {
    // Could update various models here:
    // - Narrative pacing models
    // - Character interaction models
    // - Choice consequence models
  }

  /**
   * Update story engagement metrics
   */
  updateStoryEngagement(storyId: string, metrics: Partial<StoryEngagementMetrics>): void {
    const existing = this.storyMetrics.get(storyId) || {
      storyId,
      timeSpentOnStory: 0,
      choicesMade: 0,
      emotionalBeatsTriggered: 0,
      playerSatisfactionScore: 0.5,
      completedBranches: [],
      emotionalResponses: {}
    };

    this.storyMetrics.set(storyId, {
      ...existing,
      ...metrics
    });
  }

  /**
   * Generate narrative insights using LLM
   */
  async generateNarrativeInsights(): Promise<NarrativeInsight[]> {
    const recentChoices = this.choiceHistory.slice(-20);
    const metrics = Array.from(this.storyMetrics.values());

    const prompt = `Analyze player narrative engagement data and provide insights:

CHOICE HISTORY (last 20 choices):
${recentChoices.map(c => `- ${c.context}: ${c.optionSelected} (${c.playerArchetype})`).join('\n')}

ENGAGEMENT METRICS:
${JSON.stringify(metrics, null, 2)}

Provide insights about:
1. Player's preferred narrative styles
2. Emotional response patterns
3. Choice-making behavior
4. Engagement drop-off points
5. Suggestions for narrative improvements

Respond with JSON array of insights:
[
  {
    "type": "preference/engagement/pacing/character/choice_pattern",
    "title": "Insight Title",
    "description": "Detailed description",
    "recommendations": ["recommendation1", "recommendation2"],
    "confidence": 0.8
  }
]`;

    try {
      const response = await this.llm.generateText(prompt);
      const insights = this.parseInsightsFromJSON(response);
      return insights;
    } catch (error) {
      console.error('Failed to generate narrative insights:', error);
      return this.getFallbackInsights();
    }
  }

  /**
   * Predict player choice
   */
  async predictPlayerChoice(
    choiceContext: string,
    options: string[],
    player: PlayerProfile
  ): Promise<{
    mostLikely: string;
    secondMostLikely: string;
    wildcard: string;
    confidence: number;
  }> {
    const prompt = `Predict which option player will choose:

PLAYER PROFILE:
- Archetype: ${player.dominantArchetype}
- Recent Choices: ${player.recentChoices.slice(-5).join(', ')}
- Moral Alignment: ${player.moralAlignment}
- Current Emotion: ${player.currentEmotion.type}

CHOICE CONTEXT: ${choiceContext}
OPTIONS: ${options.join(', ')}

Based on similar historical choices, predict:
- Most likely option (70%+ confidence)
- Second most likely option
- Unexpected but possible wildcard option

For each prediction, provide confidence score and reasoning.

Respond in JSON:
{
  "mostLikely": {
    "option": "option_text",
    "confidence": 0.75,
    "reasoning": "reasoning"
  },
  "secondMostLikely": {
    "option": "option_text",
    "confidence": 0.6,
    "reasoning": "reasoning"
  },
  "wildcard": {
    "option": "option_text",
    "confidence": 0.2,
    "reasoning": "reasoning"
  }
}`;

    try {
      const response = await this.llm.generateText(prompt);
      const prediction = this.parsePredictionFromJSON(response);

      return {
        mostLikely: prediction.mostLikely.option,
        secondMostLikely: prediction.secondMostLikely.option,
        wildcard: prediction.wildcard.option,
        confidence: prediction.mostLikely.confidence
      };
    } catch (error) {
      console.error('Choice prediction failed:', error);
      // Fallback: return first option
      return {
        mostLikely: options[0] || 'unknown',
        secondMostLikely: options[1] || options[0] || 'unknown',
        wildcard: options[options.length - 1] || options[0] || 'unknown',
        confidence: 0.5
      };
    }
  }

  /**
   * Get player archetype preferences
   */
  getArchetypePreferences(archetype: string): string[] {
    return this.archetypePreferenceModels.get(archetype) || [];
  }

  /**
   * Get choice statistics
   */
  getChoiceStatistics(): {
    totalChoices: number;
    averageDecisionTime: number;
    archetypeDistribution: Record<string, number>;
    emotionDistribution: Record<string, number>;
  } {
    if (this.choiceHistory.length === 0) {
      return {
        totalChoices: 0,
        averageDecisionTime: 0,
        archetypeDistribution: {},
        emotionDistribution: {}
      };
    }

    const avgDecisionTime = this.choiceHistory.reduce((sum, c) => sum + c.decisionTime, 0) / this.choiceHistory.length;

    const archetypeCounts = new Map<string, number>();
    const emotionCounts = new Map<string, number>();

    for (const choice of this.choiceHistory) {
      archetypeCounts.set(choice.playerArchetype, (archetypeCounts.get(choice.playerArchetype) || 0) + 1);
      emotionCounts.set(choice.playerEmotion.type, (emotionCounts.get(choice.playerEmotion.type) || 0) + 1);
    }

    return {
      totalChoices: this.choiceHistory.length,
      averageDecisionTime: avgDecisionTime,
      archetypeDistribution: Object.fromEntries(archetypeCounts),
      emotionDistribution: Object.fromEntries(emotionCounts)
    };
  }

  private parseInsightsFromJSON(text: string): NarrativeInsight[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as NarrativeInsight[];
      }
    } catch (error) {
      console.error('Failed to parse insights JSON:', error);
    }
    return [];
  }

  private parsePredictionFromJSON(text: string): {
    mostLikely: { option: string; confidence: number; reasoning: string };
    secondMostLikely: { option: string; confidence: number; reasoning: string };
    wildcard: { option: string; confidence: number; reasoning: string };
  } {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse prediction JSON:', error);
    }
    throw new Error('No valid prediction JSON found');
  }

  private getFallbackInsights(): NarrativeInsight[] {
    return [{
      type: 'engagement',
      title: 'Insufficient Data',
      description: 'Need more player choice data to generate insights.',
      recommendations: ['Continue tracking player choices', 'Monitor engagement metrics'],
      confidence: 0.5
    }];
  }

  /**
   * Clear all analytics data (useful for testing)
   */
  clear(): void {
    this.choiceHistory = [];
    this.storyMetrics.clear();
    this.archetypePreferenceModels.clear();
  }
}


