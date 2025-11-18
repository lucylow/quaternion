/**
 * Campaign Storytelling Integration
 * Connects GeminiCampaignStorytelling with CampaignSystem
 * Provides seamless narrative generation during campaign gameplay
 */

import { GeminiCampaignStorytelling, type StorytellingContext, type GeneratedNarrative } from './GeminiCampaignStorytelling';
import type { CampaignSystem, CampaignState, CampaignConfig, CampaignCharacter, NarrativeEvent } from './CampaignSystem';

export class CampaignStorytellingIntegration {
  private storytelling: GeminiCampaignStorytelling;
  private campaignSystem: CampaignSystem;

  constructor(campaignSystem: CampaignSystem, apiKey?: string) {
    this.campaignSystem = campaignSystem;
    this.storytelling = new GeminiCampaignStorytelling(apiKey);
  }

  /**
   * Generate narrative event for current campaign beat
   */
  async generateEventForCurrentBeat(): Promise<NarrativeEvent | null> {
    const state = this.campaignSystem.getCurrentState();
    const campaign = this.campaignSystem.getCurrentCampaign();
    
    if (!state || !campaign) return null;

    const context = this.buildStorytellingContext(state, campaign);
    const generated = await this.storytelling.generateNarrativeEvent(context);

    // Convert GeneratedNarrative to NarrativeEvent
    const event: NarrativeEvent = {
      event: generated.event,
      trigger: `beat_${state.actIndex}_${state.beatIndex}`,
      flavor: generated.flavor,
      effect: this.extractEffects(generated.consequences),
      narrativeTag: generated.narrativeTag
    };

    return event;
  }

  /**
   * Generate dialogue for characters at a specific moment
   */
  async generateCharacterDialogue(
    characterId: string,
    situation: string
  ): Promise<string[]> {
    const state = this.campaignSystem.getCurrentState();
    const campaign = this.campaignSystem.getCurrentCampaign();
    
    if (!state || !campaign) return [];

    const character = campaign.characters.find(c => c.id === characterId);
    if (!character) return [];

    const context = this.buildStorytellingContext(state, campaign);
    const dialogues = await this.storytelling.generateCharacterDialogue(
      character,
      context,
      situation
    );

    return dialogues.map(d => d.line);
  }

  /**
   * Generate chapter summary for completed act
   */
  async generateChapterSummary(actIndex: number): Promise<string> {
    const state = this.campaignSystem.getCurrentState();
    const campaign = this.campaignSystem.getCurrentCampaign();
    
    if (!state || !campaign || actIndex >= campaign.acts.length) {
      return '';
    }

    const context = this.buildStorytellingContext(state, campaign);
    const events = this.campaignSystem.getNarrativeEvents();
    const chapter = await this.storytelling.generateChapter(context, events);

    return `**${chapter.title}**\n\n${chapter.summary}\n\n${chapter.emotionalArc}`;
  }

  /**
   * Generate epilogue when campaign completes
   */
  async generateCampaignEpilogue(): Promise<string> {
    const state = this.campaignSystem.getCurrentState();
    const campaign = this.campaignSystem.getCurrentCampaign();
    
    if (!state || !campaign) return '';

    const events = this.campaignSystem.getNarrativeEvents();
    const epilogue = await this.storytelling.generateEpilogue(campaign, state, events);

    // Format epilogue as readable text
    let text = `# ${epilogue.title}\n\n${epilogue.opening}\n\n`;
    
    for (const paragraph of epilogue.body) {
      text += `${paragraph}\n\n`;
    }

    text += `## Character Fates\n\n`;
    for (const fate of epilogue.characterFates) {
      text += `**${fate.name}**: ${fate.fate}\n\n`;
    }

    text += `## World State\n\n${epilogue.worldState}\n\n`;
    text += `## Your Legacy\n\n${epilogue.playerLegacy}\n\n`;
    text += epilogue.closing;

    return text;
  }

  /**
   * Generate world lore for campaign start
   */
  async generateCampaignLore(): Promise<{
    setting: string;
    history: string;
    factions: string[];
    mysteries: string[];
    themes: string[];
  }> {
    const campaign = this.campaignSystem.getCurrentCampaign();
    const state = this.campaignSystem.getCurrentState();
    
    if (!campaign) {
      return {
        setting: '',
        history: '',
        factions: [],
        mysteries: [],
        themes: []
      };
    }

    const seed = state?.seed || campaign.seed || Math.floor(Math.random() * 1000000);
    return await this.storytelling.generateWorldLore(campaign, seed);
  }

  /**
   * Generate environmental narrative for location/action
   */
  async generateEnvironmentalNarrative(
    location: string,
    action: string
  ): Promise<string> {
    const state = this.campaignSystem.getCurrentState();
    const campaign = this.campaignSystem.getCurrentCampaign();
    
    if (!state || !campaign) return '';

    const context = this.buildStorytellingContext(state, campaign);
    return await this.storytelling.generateEnvironmentalNarrative(context, location, action);
  }

  /**
   * Build storytelling context from campaign state
   */
  private buildStorytellingContext(
    state: CampaignState,
    campaign: CampaignConfig
  ): StorytellingContext {
    const currentAct = campaign.acts[state.actIndex];
    const previousEvents = this.campaignSystem.getNarrativeEvents();

    // Calculate emotional tone based on state
    const emotionalTone = this.calculateEmotionalTone(state);

    // Calculate world state
    const worldState = {
      tension: this.calculateTension(state),
      instability: this.calculateInstability(state),
      discoveredSecrets: [] // Could be enhanced with actual secret tracking
    };

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      actIndex: state.actIndex,
      actName: currentAct?.name || 'Unknown',
      beatIndex: state.beatIndex,
      time: state.time,
      seed: state.seed,
      playerChoices: state.choices,
      narrativeTags: state.narrativeTags,
      resources: state.resources,
      bioSeedHealth: state.bioSeedHealth,
      playerReputation: state.playerReputation,
      characters: campaign.characters,
      previousEvents: previousEvents,
      emotionalTone,
      worldState
    };
  }

  /**
   * Calculate emotional tone from campaign state
   */
  private calculateEmotionalTone(state: CampaignState): StorytellingContext['emotionalTone'] {
    const tags = Array.from(state.narrativeTags);
    
    if (tags.includes('greed') || tags.includes('guilt')) {
      return 'melancholic';
    } else if (tags.includes('hope') || tags.includes('redemption')) {
      return 'hopeful';
    } else if (state.bioSeedHealth !== undefined && state.bioSeedHealth < 30) {
      return 'desperate';
    } else if (state.playerReputation !== undefined && state.playerReputation > 0.7) {
      return 'triumphant';
    } else if (state.time > 600) {
      return 'tense';
    }
    
    return 'mysterious';
  }

  /**
   * Calculate world tension from state
   */
  private calculateTension(state: CampaignState): number {
    let tension = 0.5; // Base tension

    // Increase tension based on low bio-seed health
    if (state.bioSeedHealth !== undefined) {
      tension += (100 - state.bioSeedHealth) / 200;
    }

    // Increase tension based on negative choices
    const tags = Array.from(state.narrativeTags);
    if (tags.includes('greed') || tags.includes('guilt')) {
      tension += 0.2;
    }

    // Increase tension over time
    tension += Math.min(0.3, state.time / 2000);

    return Math.min(1.0, Math.max(0.0, tension));
  }

  /**
   * Calculate world instability from state
   */
  private calculateInstability(state: CampaignState): number {
    let instability = 0.3; // Base instability

    // Resource imbalance increases instability
    const resources = Object.values(state.resources);
    const total = resources.reduce((a, b) => a + b, 0);
    if (total > 0) {
      const variance = resources.reduce((acc, val) => {
        const avg = total / resources.length;
        return acc + Math.pow(val - avg, 2);
      }, 0) / resources.length;
      instability += Math.min(0.4, variance / (total * total));
    }

    // Low bio-seed health increases instability
    if (state.bioSeedHealth !== undefined) {
      instability += (100 - state.bioSeedHealth) / 300;
    }

    return Math.min(1.0, Math.max(0.0, instability));
  }

  /**
   * Extract effects from narrative consequences
   */
  private extractEffects(consequences: GeneratedNarrative['consequences']): Record<string, any> {
    const effects: Record<string, any> = {};

    for (const consequence of consequences) {
      if (consequence.immediate) {
        Object.assign(effects, consequence.effect);
      }
    }

    return effects;
  }

  /**
   * Clear storytelling cache
   */
  clearCache(): void {
    this.storytelling.clearCache();
  }
}

