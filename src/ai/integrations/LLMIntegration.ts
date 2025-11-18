/**
 * LLM Integration for AI-powered content generation
 * Supports Google AI Pro (Gemini), Saga AI, and other LLM providers
 */

// Import CommanderPersonality from EnhancedCommanderPersonality to avoid duplicate definitions
import type { CommanderPersonality } from '../EnhancedCommanderPersonality';

export interface LLMConfig {
  provider: 'google' | 'saga' | 'openai';
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface MapTheme {
  description: string;
  strategicPersonality: string;
  tacticalBottlenecks: string[];
  resourceClusters: string[];
  terrainFeatures: string[];
}

export interface EventNarrative {
  text: string;
  type: 'terrain' | 'combat' | 'resource' | 'narrative';
  impact: 'low' | 'medium' | 'high';
}

// Re-export CommanderPersonality for convenience
export type { CommanderPersonality };

export class LLMIntegration {
  private config: LLMConfig;
  private cache: Map<string, any> = new Map();

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 500,
      ...config
    };
  }

  /**
   * Generate strategic theme for a map
   */
  async generateMapTheme(
    mapType: string,
    seed: number,
    width: number,
    height: number
  ): Promise<MapTheme> {
    const cacheKey = `map_theme_${mapType}_${seed}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const prompt = `Generate a 200-character strategic theme for a ${mapType} battlefield in a sci-fi RTS game.
Map dimensions: ${width}x${height}. Seed: ${seed}

Requirements:
- Include 2 tactical bottlenecks
- Describe resource cluster locations
- Mention terrain features that affect strategy
- Keep it concise and strategic

Format as JSON:
{
  "description": "brief strategic description",
  "strategicPersonality": "aggressive/defensive/economic/puzzle",
  "tacticalBottlenecks": ["bottleneck 1", "bottleneck 2"],
  "resourceClusters": ["cluster description 1", "cluster description 2"],
  "terrainFeatures": ["feature 1", "feature 2"]
}`;

    try {
      const response = await this.callLLM(prompt);
      const theme = this.parseJSONResponse<MapTheme>(response);
      this.cache.set(cacheKey, theme);
      return theme;
    } catch (error) {
      console.warn('LLM map theme generation failed, using fallback', error);
      return this.getFallbackMapTheme(mapType);
    }
  }

  /**
   * Generate environmental event narrative
   */
  async generateEventNarrative(
    mapTheme: string,
    gameTime: number,
    playerState: {
      resources: Record<string, number>;
      units: number;
      buildings: number;
    }
  ): Promise<EventNarrative> {
    const prompt = `Given a battlefield themed as "${mapTheme}",
at game time ${gameTime}s,
with player having ${JSON.stringify(playerState.resources)} resources,
${playerState.units} units, and ${playerState.buildings} buildings.

Generate 1 terrain event (50 words max) that:
- Creates new tactical opportunities
- Is logically consistent with the theme
- Can be narrated in English
- Has a clear gameplay impact

Format as JSON:
{
  "text": "event description",
  "type": "terrain|combat|resource|narrative",
  "impact": "low|medium|high"
}`;

    try {
      const response = await this.callLLM(prompt);
      return this.parseJSONResponse<EventNarrative>(response);
    } catch (error) {
      console.warn('LLM event generation failed, using fallback', error);
      return this.getFallbackEvent();
    }
  }

  /**
   * Generate commander personality
   */
  async generateCommanderPersonality(
    archetype: string,
    seed: number
  ): Promise<CommanderPersonality> {
    const cacheKey = `commander_${archetype}_${seed}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const prompt = `Generate a commander personality for archetype: "${archetype}"

Create a unique commander with:
- Name (sci-fi themed)
- Personality traits (0-1 scale): strategicFocus, patience, riskTolerance, aggression
- Gameplay expression: preferredStrategy, unitComposition, techPriority
- Difficulty ratings: defensive (low/medium/high), rush (low/medium/high)

Format as JSON matching CommanderPersonality interface.`;

    try {
      const response = await this.callLLM(prompt);
      const personality = this.parseJSONResponse<CommanderPersonality>(response);
      this.cache.set(cacheKey, personality);
      return personality;
    } catch (error) {
      console.warn('LLM commander generation failed, using fallback', error);
      return this.getFallbackCommander(archetype);
    }
  }

  /**
   * Generate battle intro narration
   */
  async generateBattleIntro(
    mapTheme: string,
    commander1: string,
    commander2: string
  ): Promise<string> {
    const prompt = `Two commanders "${commander1}" and "${commander2}" clash on "${mapTheme}".
Generate an epic 1-sentence intro voiceover script (max 20 words).
Make it dramatic and immersive.`;

    try {
      const response = await this.callLLM(prompt);
      return this.cleanText(response);
    } catch (error) {
      console.warn('LLM battle intro failed, using fallback', error);
      return `Two commanders meet on ${mapTheme}—only one will rise.`;
    }
  }

  /**
   * Generate commander dialogue during battle
   */
  async generateCommanderDialogue(
    commanderName: string,
    personality: CommanderPersonality,
    gameState: {
      resourceAdvantage: number;
      militaryAdvantage: number;
      recentAction: string;
    }
  ): Promise<string> {
    const prompt = `Commander "${commanderName}" with personality ${JSON.stringify(personality.traits)}
Current state: ${JSON.stringify(gameState)}

Generate a brief commander comment (max 15 words) that:
- Matches their personality
- Responds to current game state
- Feels natural and strategic`;

    try {
      const response = await this.callLLM(prompt);
      return this.cleanText(response);
    } catch (error) {
      console.warn('LLM dialogue generation failed, using fallback', error);
      return this.getFallbackDialogue(commanderName, gameState);
    }
  }

  /**
   * Public method to call LLM (for use by other systems)
   */
  async generateText(prompt: string): Promise<string> {
    try {
      return await this.callLLM(prompt);
    } catch (error) {
      console.warn('LLM generation failed', error);
      throw error;
    }
  }

  /**
   * Call LLM API (provider-specific)
   */
  private async callLLM(prompt: string): Promise<string> {
    switch (this.config.provider) {
      case 'google':
        return this.callGoogleAI(prompt);
      case 'saga':
        return this.callSagaAI(prompt);
      case 'openai':
        return this.callOpenAI(prompt);
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }

  private async callGoogleAI(prompt: string): Promise<string> {
    // Google AI Pro / Gemini integration
    const apiKey = this.config.apiKey || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    const model = this.config.model || 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async callSagaAI(prompt: string): Promise<string> {
    // Saga AI integration
    const apiKey = this.config.apiKey || process.env.SAGA_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Saga AI API key not configured');
    }

    const response = await fetch('https://api.sagaai.io/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      })
    });

    if (!response.ok) {
      throw new Error(`Saga AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || data.content || '';
  }

  private async callOpenAI(prompt: string): Promise<string> {
    // OpenAI integration (fallback)
    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private parseJSONResponse<T>(text: string): T {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch (e) {
        console.warn('Failed to parse JSON from LLM response', e);
      }
    }
    throw new Error('No valid JSON found in response');
  }

  private cleanText(text: string): string {
    return text.trim().replace(/^["']|["']$/g, '').trim();
  }

  // Fallback methods
  private getFallbackMapTheme(mapType: string): MapTheme {
    return {
      description: `${mapType} battlefield with strategic high ground and resource clusters`,
      strategicPersonality: 'balanced',
      tacticalBottlenecks: ['Central passage', 'Narrow ridge'],
      resourceClusters: ['Northern deposits', 'Southern veins'],
      terrainFeatures: ['Elevated positions', 'Defensible chokepoints']
    };
  }

  private getFallbackEvent(): EventNarrative {
    return {
      text: 'The terrain shifts, creating new tactical opportunities.',
      type: 'terrain',
      impact: 'medium'
    };
  }

  private getFallbackCommander(archetype: string): CommanderPersonality {
    // Return a minimal CommanderPersonality that matches the EnhancedCommanderPersonality interface
    return {
      id: `fallback_${archetype}_${Date.now()}`,
      name: `Commander ${archetype}`,
      archetype: (archetype as any) || 'balanced', // Type assertion needed for compatibility with CommanderArchetype
      traits: {
        aggression: 0.5,
        adaptability: 0.5,
        riskTolerance: 0.5,
        strategicFocus: 'balanced',
        patience: 0.7,
        explorationDrive: 0.5,
        innovationDrive: 0.5,
        microFocus: 0.5
      },
      memory: {
        playerStrategies: new Map(),
        successfulCounterStrategies: new Map(),
        battleOutcomes: [],
        learnedPatterns: new Map()
      },
      evolutionHistory: []
    };
  }

  private getFallbackDialogue(commanderName: string, gameState: any): string {
    if (gameState.militaryAdvantage > 0.3) {
      return 'Our forces are strong. Press the advantage.';
    } else if (gameState.resourceAdvantage < -0.2) {
      return 'We need more resources. Expand carefully.';
    }
    return 'Interesting move. Let\'s see how it plays out.';
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

