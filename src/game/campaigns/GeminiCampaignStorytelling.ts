/**
 * Gemini Campaign Storytelling System
 * Comprehensive narrative generation for campaign mode using Google Gemini AI
 * Project: quaternion (831495637358)
 * 
 * Features:
 * - Dynamic narrative event generation
 * - Character dialogue and interactions
 * - Branching storylines based on player choices
 * - Emotional tone and pacing management
 * - World-building and lore generation
 * - Epilogue and ending generation
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import type { CampaignState, CampaignConfig, CampaignCharacter, NarrativeEvent } from './CampaignSystem';

export interface StorytellingContext {
  campaignId: string;
  campaignName: string;
  actIndex: number;
  actName: string;
  beatIndex: number;
  time: number;
  seed: number;
  playerChoices: Map<string, string>;
  narrativeTags: Set<string>;
  resources: Record<string, number>;
  bioSeedHealth?: number;
  playerReputation?: number;
  characters: CampaignCharacter[];
  previousEvents: NarrativeEvent[];
  emotionalTone: 'hopeful' | 'tense' | 'triumphant' | 'melancholic' | 'desperate' | 'mysterious';
  worldState: {
    tension: number;
    instability: number;
    discoveredSecrets: string[];
  };
}

export interface GeneratedNarrative {
  event: string;
  description: string;
  flavor: string;
  dialogue?: CharacterDialogue[];
  environmentalDetails: string;
  emotionalImpact: string;
  consequences: NarrativeConsequence[];
  narrativeTag?: string;
}

export interface CharacterDialogue {
  characterId: string;
  characterName: string;
  line: string;
  emotion: 'pleading' | 'urgent' | 'calm' | 'angry' | 'hopeful' | 'desperate' | 'mysterious';
  timing: 'before' | 'during' | 'after';
}

export interface NarrativeConsequence {
  type: 'resource' | 'reputation' | 'health' | 'narrative' | 'world';
  description: string;
  effect: Record<string, any>;
  immediate: boolean;
  longTerm?: string;
}

export interface CampaignChapter {
  chapterNumber: number;
  title: string;
  summary: string;
  keyEvents: string[];
  characterMoments: string[];
  emotionalArc: string;
  playerImpact: string;
}

export interface CampaignEpilogue {
  title: string;
  opening: string;
  body: string[];
  characterFates: Array<{
    characterId: string;
    name: string;
    fate: string;
  }>;
  worldState: string;
  playerLegacy: string;
  closing: string;
  tone: 'hopeful' | 'tragic' | 'ambiguous' | 'triumphant';
}

export class GeminiCampaignStorytelling {
  private llm: LLMIntegration;
  private cache: Map<string, any> = new Map();
  private projectNumber: string = '831495637358';
  private projectName: string = 'quaternion';

  constructor(apiKey?: string) {
    this.llm = new LLMIntegration({
      provider: 'google',
      apiKey: apiKey || 
              import.meta.env.VITE_Gemini_AI_API_key || 
              import.meta.env.VITE_GOOGLE_AI_API_KEY,
      model: 'gemini-2.0-flash-exp',
      temperature: 0.8, // Higher creativity for storytelling
      maxTokens: 1000,
      projectNumber: this.projectNumber,
      projectName: this.projectName
    });
  }

  /**
   * Generate a comprehensive narrative event for a campaign beat
   */
  async generateNarrativeEvent(context: StorytellingContext): Promise<GeneratedNarrative> {
    const cacheKey = `narrative_${context.campaignId}_${context.actIndex}_${context.beatIndex}_${context.seed}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildNarrativeEventPrompt(context);
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseNarrativeResponse(response);
      
      const narrative: GeneratedNarrative = {
        event: parsed.event || `Event ${context.beatIndex + 1}`,
        description: parsed.description || '',
        flavor: parsed.flavor || '',
        dialogue: parsed.dialogue || [],
        environmentalDetails: parsed.environmentalDetails || '',
        emotionalImpact: parsed.emotionalImpact || '',
        consequences: parsed.consequences || [],
        narrativeTag: parsed.narrativeTag
      };

      this.cache.set(cacheKey, narrative);
      return narrative;
    } catch (error) {
      console.warn('Gemini narrative generation failed, using fallback', error);
      return this.getFallbackNarrative(context);
    }
  }

  /**
   * Generate character dialogue for a specific moment
   */
  async generateCharacterDialogue(
    character: CampaignCharacter,
    context: StorytellingContext,
    situation: string
  ): Promise<CharacterDialogue[]> {
    const cacheKey = `dialogue_${character.id}_${situation}_${context.seed}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildDialoguePrompt(character, context, situation);
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseDialogueResponse(response);
      
      this.cache.set(cacheKey, parsed);
      return parsed;
    } catch (error) {
      console.warn('Gemini dialogue generation failed, using fallback', error);
      return this.getFallbackDialogue(character, situation);
    }
  }

  /**
   * Generate a complete campaign chapter summary
   */
  async generateChapter(
    context: StorytellingContext,
    events: NarrativeEvent[]
  ): Promise<CampaignChapter> {
    const cacheKey = `chapter_${context.campaignId}_${context.actIndex}_${context.seed}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildChapterPrompt(context, events);
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseChapterResponse(response);
      
      this.cache.set(cacheKey, parsed);
      return parsed;
    } catch (error) {
      console.warn('Gemini chapter generation failed, using fallback', error);
      return this.getFallbackChapter(context);
    }
  }

  /**
   * Generate campaign epilogue based on all player choices
   */
  async generateEpilogue(
    campaign: CampaignConfig,
    finalState: CampaignState,
    allEvents: NarrativeEvent[]
  ): Promise<CampaignEpilogue> {
    const cacheKey = `epilogue_${campaign.id}_${finalState.seed}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildEpiloguePrompt(campaign, finalState, allEvents);
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseEpilogueResponse(response);
      
      this.cache.set(cacheKey, parsed);
      return parsed;
    } catch (error) {
      console.warn('Gemini epilogue generation failed, using fallback', error);
      return this.getFallbackEpilogue(campaign, finalState);
    }
  }

  /**
   * Generate world-building lore for campaign setting
   */
  async generateWorldLore(
    campaign: CampaignConfig,
    seed: number
  ): Promise<{
    setting: string;
    history: string;
    factions: string[];
    mysteries: string[];
    themes: string[];
  }> {
    const cacheKey = `lore_${campaign.id}_${seed}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildLorePrompt(campaign, seed);
      const response = await this.llm.generateText(prompt);
      const parsed = this.parseLoreResponse(response);
      
      this.cache.set(cacheKey, parsed);
      return parsed;
    } catch (error) {
      console.warn('Gemini lore generation failed, using fallback', error);
      return this.getFallbackLore(campaign);
    }
  }

  /**
   * Generate environmental storytelling details
   */
  async generateEnvironmentalNarrative(
    context: StorytellingContext,
    location: string,
    action: string
  ): Promise<string> {
    const cacheKey = `env_${location}_${action}_${context.seed}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildEnvironmentalPrompt(context, location, action);
      const response = await this.llm.generateText(prompt);
      const cleaned = this.cleanText(response);
      
      this.cache.set(cacheKey, cleaned);
      return cleaned;
    } catch (error) {
      console.warn('Gemini environmental narrative failed, using fallback', error);
      return this.getFallbackEnvironmental(location, action);
    }
  }

  // ==================== PROMPT BUILDERS ====================

  private buildNarrativeEventPrompt(context: StorytellingContext): string {
    const choicesArray = Array.from(context.playerChoices.entries()).map(([id, option]) => 
      `- ${id}: ${option}`
    ).join('\n');
    
    const tagsArray = Array.from(context.narrativeTags).join(', ') || 'none';
    const resourcesStr = Object.entries(context.resources)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return `You are a master storyteller creating narrative events for a sci-fi RTS campaign game called "Quaternion".

CAMPAIGN CONTEXT:
- Campaign: ${context.campaignName}
- Act: ${context.actName} (Act ${context.actIndex + 1})
- Beat: ${context.beatIndex + 1}
- Game Time: ${context.time} seconds
- Seed: ${context.seed}

PLAYER STATE:
- Resources: ${resourcesStr}
- Bio-Seed Health: ${context.bioSeedHealth || 'N/A'}
- Player Reputation: ${context.playerReputation || 'N/A'}
- Narrative Tags: ${tagsArray}
- Emotional Tone: ${context.emotionalTone}
- World Tension: ${context.worldState.tension}
- World Instability: ${context.worldState.instability}

CHARACTERS PRESENT:
${context.characters.map(c => `- ${c.name} (${c.role}): ${c.personality}`).join('\n')}

PREVIOUS EVENTS:
${context.previousEvents.slice(-3).map(e => `- ${e.event}: ${e.flavor}`).join('\n') || 'None yet'}

TASK:
Generate a compelling narrative event that:
1. Advances the story naturally from previous events
2. Reflects the current emotional tone (${context.emotionalTone})
3. Incorporates player choices and their consequences
4. Includes character dialogue (2-4 lines from different characters)
5. Describes environmental details that enhance immersion
6. Creates meaningful consequences for player actions
7. Maintains consistency with the campaign's themes

OUTPUT FORMAT (JSON):
{
  "event": "Event title (3-5 words)",
  "description": "Brief event description (1-2 sentences)",
  "flavor": "Poetic, immersive flavor text (20-30 words, evocative and atmospheric)",
  "dialogue": [
    {
      "characterId": "character_id",
      "characterName": "Character Name",
      "line": "Dialogue line (10-20 words, natural and character-appropriate)",
      "emotion": "pleading|urgent|calm|angry|hopeful|desperate|mysterious",
      "timing": "before|during|after"
    }
  ],
  "environmentalDetails": "Rich environmental description (15-25 words, sensory details)",
  "emotionalImpact": "How this event affects the emotional arc (1 sentence)",
  "consequences": [
    {
      "type": "resource|reputation|health|narrative|world",
      "description": "What happens as a result (1 sentence)",
      "effect": { "key": "value" },
      "immediate": true,
      "longTerm": "Optional long-term consequence description"
    }
  ],
  "narrativeTag": "Optional tag: greed|hope|guilt|redemption|desperation|triumph"
}

Generate the narrative event now:`;
  }

  private buildDialoguePrompt(
    character: CampaignCharacter,
    context: StorytellingContext,
    situation: string
  ): string {
    return `You are writing dialogue for a character in a sci-fi RTS campaign.

CHARACTER:
- Name: ${character.name}
- Role: ${character.role}
- Personality: ${character.personality}

SITUATION:
${situation}

CAMPAIGN CONTEXT:
- Campaign: ${context.campaignName}
- Act: ${context.actName}
- Emotional Tone: ${context.emotionalTone}
- Player Choices: ${Array.from(context.playerChoices.values()).join(', ') || 'None yet'}

TASK:
Generate 2-3 lines of dialogue for ${character.name} that:
1. Reflects their personality (${character.personality})
2. Responds to the situation naturally
3. Shows appropriate emotion for the context
4. Is concise (10-20 words per line)
5. Feels authentic to their character

OUTPUT FORMAT (JSON):
[
  {
    "characterId": "${character.id}",
    "characterName": "${character.name}",
    "line": "Dialogue line",
    "emotion": "pleading|urgent|calm|angry|hopeful|desperate|mysterious",
    "timing": "before|during|after"
  }
]

Generate the dialogue:`;
  }

  private buildChapterPrompt(context: StorytellingContext, events: NarrativeEvent[]): string {
    return `You are summarizing a campaign chapter for a sci-fi RTS game.

CAMPAIGN CONTEXT:
- Campaign: ${context.campaignName}
- Act: ${context.actName} (Act ${context.actIndex + 1})
- Seed: ${context.seed}

KEY EVENTS:
${events.map((e, i) => `${i + 1}. ${e.event}: ${e.flavor}`).join('\n')}

PLAYER IMPACT:
- Choices Made: ${Array.from(context.playerChoices.entries()).map(([id, opt]) => `${id}=${opt}`).join(', ')}
- Narrative Tags: ${Array.from(context.narrativeTags).join(', ')}
- Resources: ${Object.entries(context.resources).map(([k, v]) => `${k}:${v}`).join(', ')}
- Reputation: ${context.playerReputation || 'N/A'}

TASK:
Create a chapter summary that:
1. Captures the emotional arc of this act
2. Highlights key character moments
3. Shows how player choices shaped the narrative
4. Sets up anticipation for what comes next

OUTPUT FORMAT (JSON):
{
  "chapterNumber": ${context.actIndex + 1},
  "title": "Chapter title (3-6 words)",
  "summary": "Chapter summary (2-3 sentences)",
  "keyEvents": ["Event 1", "Event 2", "Event 3"],
  "characterMoments": ["Moment 1", "Moment 2"],
  "emotionalArc": "Description of emotional journey (1-2 sentences)",
  "playerImpact": "How player choices affected the story (1-2 sentences)"
}

Generate the chapter summary:`;
  }

  private buildEpiloguePrompt(
    campaign: CampaignConfig,
    finalState: CampaignState,
    allEvents: NarrativeEvent[]
  ): string {
    const choicesSummary = Array.from(finalState.choices.entries())
      .map(([id, option]) => `${id}: ${option}`)
      .join('\n');
    
    const tagsArray = Array.from(finalState.narrativeTags);
    const finalEvents = allEvents.slice(-5).map(e => `${e.event}: ${e.flavor}`).join('\n');

    return `You are writing the epilogue for a completed sci-fi RTS campaign.

CAMPAIGN: ${campaign.name}
${campaign.description}

FINAL STATE:
- Bio-Seed Health: ${finalState.bioSeedHealth || 'N/A'}
- Player Reputation: ${finalState.playerReputation || 'N/A'}
- Resources: ${Object.entries(finalState.resources).map(([k, v]) => `${k}:${v}`).join(', ')}
- Narrative Tags: ${tagsArray.join(', ') || 'none'}

KEY CHOICES:
${choicesSummary || 'No major choices recorded'}

FINAL EVENTS:
${finalEvents}

CHARACTERS:
${campaign.characters.map(c => `- ${c.name} (${c.role}): ${c.personality}`).join('\n')}

TASK:
Write a compelling epilogue that:
1. Reflects on the player's journey and choices
2. Shows the fate of each character based on player actions
3. Describes the world state after the campaign
4. Creates a sense of closure while leaving room for interpretation
5. Matches the emotional tone of the ending (hopeful, tragic, ambiguous, or triumphant)

OUTPUT FORMAT (JSON):
{
  "title": "Epilogue title (3-5 words)",
  "opening": "Opening paragraph (2-3 sentences, atmospheric)",
  "body": [
    "Body paragraph 1 (2-3 sentences)",
    "Body paragraph 2 (2-3 sentences)",
    "Body paragraph 3 (2-3 sentences)"
  ],
  "characterFates": [
    {
      "characterId": "character_id",
      "name": "Character Name",
      "fate": "What happened to them (2-3 sentences)"
    }
  ],
  "worldState": "Description of the world after the campaign (2-3 sentences)",
  "playerLegacy": "What the player's choices mean for the future (2-3 sentences)",
  "closing": "Final closing lines (1-2 sentences, memorable)",
  "tone": "hopeful|tragic|ambiguous|triumphant"
}

Generate the epilogue:`;
  }

  private buildLorePrompt(campaign: CampaignConfig, seed: number): string {
    return `You are creating world-building lore for a sci-fi RTS campaign.

CAMPAIGN: ${campaign.name}
${campaign.description}

SEED: ${seed}

TASK:
Generate rich world-building lore including:
1. A detailed setting description
2. Key historical events
3. Major factions and their relationships
4. Unexplained mysteries
5. Central themes

OUTPUT FORMAT (JSON):
{
  "setting": "Detailed setting description (3-4 sentences)",
  "history": "Key historical events (4-5 sentences)",
  "factions": ["Faction 1", "Faction 2", "Faction 3"],
  "mysteries": ["Mystery 1", "Mystery 2", "Mystery 3"],
  "themes": ["Theme 1", "Theme 2", "Theme 3"]
}

Generate the world lore:`;
  }

  private buildEnvironmentalPrompt(
    context: StorytellingContext,
    location: string,
    action: string
  ): string {
    return `You are writing environmental storytelling for a sci-fi RTS game.

LOCATION: ${location}
ACTION: ${action}

CONTEXT:
- Campaign: ${context.campaignName}
- Emotional Tone: ${context.emotionalTone}
- World Tension: ${context.worldState.tension}
- Time: ${context.time} seconds

TASK:
Write a vivid, atmospheric description (20-30 words) that:
1. Uses sensory details (sight, sound, texture, temperature)
2. Reflects the emotional tone
3. Enhances immersion
4. Feels natural and not overwritten

Generate the environmental description:`;
  }

  // ==================== RESPONSE PARSERS ====================

  private parseNarrativeResponse(text: string): GeneratedNarrative {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as GeneratedNarrative;
      } catch (e) {
        console.warn('Failed to parse narrative JSON', e);
      }
    }
    throw new Error('No valid JSON found in narrative response');
  }

  private parseDialogueResponse(text: string): CharacterDialogue[] {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as CharacterDialogue[];
      } catch (e) {
        console.warn('Failed to parse dialogue JSON', e);
      }
    }
    throw new Error('No valid JSON found in dialogue response');
  }

  private parseChapterResponse(text: string): CampaignChapter {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as CampaignChapter;
      } catch (e) {
        console.warn('Failed to parse chapter JSON', e);
      }
    }
    throw new Error('No valid JSON found in chapter response');
  }

  private parseEpilogueResponse(text: string): CampaignEpilogue {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as CampaignEpilogue;
      } catch (e) {
        console.warn('Failed to parse epilogue JSON', e);
      }
    }
    throw new Error('No valid JSON found in epilogue response');
  }

  private parseLoreResponse(text: string): {
    setting: string;
    history: string;
    factions: string[];
    mysteries: string[];
    themes: string[];
  } {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Failed to parse lore JSON', e);
      }
    }
    throw new Error('No valid JSON found in lore response');
  }

  private cleanText(text: string): string {
    return text.trim().replace(/^["']|["']$/g, '').trim();
  }

  // ==================== FALLBACKS ====================

  private getFallbackNarrative(context: StorytellingContext): GeneratedNarrative {
    return {
      event: `Event ${context.beatIndex + 1}`,
      description: 'A significant moment unfolds in the campaign.',
      flavor: 'The air shifts. Something fundamental has changed.',
      dialogue: [],
      environmentalDetails: 'The environment responds to your presence.',
      emotionalImpact: 'The emotional weight of the moment settles.',
      consequences: [],
      narrativeTag: 'neutral'
    };
  }

  private getFallbackDialogue(character: CampaignCharacter, situation: string): CharacterDialogue[] {
    return [{
      characterId: character.id,
      characterName: character.name,
      line: 'This situation requires careful consideration.',
      emotion: 'calm',
      timing: 'during'
    }];
  }

  private getFallbackChapter(context: StorytellingContext): CampaignChapter {
    return {
      chapterNumber: context.actIndex + 1,
      title: `Chapter ${context.actIndex + 1}: ${context.actName}`,
      summary: `The story continues in ${context.actName}.`,
      keyEvents: ['Event 1', 'Event 2'],
      characterMoments: ['Character moment'],
      emotionalArc: 'The emotional journey continues.',
      playerImpact: 'Player choices shape the narrative.'
    };
  }

  private getFallbackEpilogue(campaign: CampaignConfig, finalState: CampaignState): CampaignEpilogue {
    return {
      title: 'Epilogue',
      opening: 'The campaign concludes.',
      body: ['The story reaches its end.', 'Choices have been made.', 'The future unfolds.'],
      characterFates: campaign.characters.map(c => ({
        characterId: c.id,
        name: c.name,
        fate: `${c.name} faces an uncertain future.`
      })),
      worldState: 'The world has changed.',
      playerLegacy: 'Your choices echo through time.',
      closing: 'The end is only the beginning.',
      tone: 'ambiguous'
    };
  }

  private getFallbackLore(campaign: CampaignConfig): {
    setting: string;
    history: string;
    factions: string[];
    mysteries: string[];
    themes: string[];
  } {
    return {
      setting: `The world of ${campaign.name} is a place of conflict and discovery.`,
      history: 'Many events have shaped this world.',
      factions: ['Faction 1', 'Faction 2'],
      mysteries: ['Mystery 1', 'Mystery 2'],
      themes: ['Theme 1', 'Theme 2']
    };
  }

  private getFallbackEnvironmental(location: string, action: string): string {
    return `At ${location}, ${action} unfolds in the ambient atmosphere.`;
  }

  /**
   * Clear cache (useful for testing or reset)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

