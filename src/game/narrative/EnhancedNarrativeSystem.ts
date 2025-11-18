/**
 * Enhanced Narrative System
 * Integrates world-building, environmental storytelling, voice, and music
 * Designed for Chroma Awards: Complete narrative experience
 */

import { WorldBuilder, FactionLore } from './WorldBuilder';
import { EnvironmentalStorytelling, EnvironmentalDetail } from './EnvironmentalStorytelling';
import { AIVoiceController, VoiceTone } from '../../ai/creative/AIVoiceController';
import { AdaptiveMusicMixer } from '../../ai/creative/AdaptiveMusicMixer';
import { LoreEngine } from '../../ai/creative/LoreEngine';
import { LLMIntegration } from '../../ai/integrations/LLMIntegration';

export interface NarrativeEvent {
  id: string;
  type: 'world_intro' | 'faction_intro' | 'terrain_event' | 'choice' | 'victory' | 'defeat';
  title: string;
  narrative: string;
  voiceLine?: string;
  musicCue?: string;
  choices?: NarrativeChoice[];
  consequences?: NarrativeConsequence[];
  timestamp: number;
}

export interface NarrativeChoice {
  id: string;
  text: string;
  moralAlignment: 'positive' | 'neutral' | 'negative';
  consequence: string;
  factionReaction?: string;
}

export interface NarrativeConsequence {
  type: 'resource' | 'reputation' | 'unlock' | 'lore';
  value: any;
  description: string;
}

export interface FactionDialogue {
  factionId: string;
  context: string;
  dialogue: string;
  emotion: 'calm' | 'angry' | 'pleading' | 'triumphant' | 'desperate';
  voiceTone: VoiceTone;
}

export class EnhancedNarrativeSystem {
  private worldBuilder: WorldBuilder;
  private environmentalStorytelling: EnvironmentalStorytelling;
  private voiceController: AIVoiceController;
  private musicMixer: AdaptiveMusicMixer;
  private loreEngine: LoreEngine;
  private llm: LLMIntegration | null = null;
  private narrativeHistory: NarrativeEvent[] = [];
  private currentFaction?: FactionLore;

  constructor(config: {
    llm?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string };
    elevenLabs?: { apiKey?: string };
    music?: { provider: 'fuser' | 'custom'; apiKey?: string };
  }) {
    this.worldBuilder = new WorldBuilder(config.llm);
    this.environmentalStorytelling = new EnvironmentalStorytelling(
      this.worldBuilder,
      config.llm
    );
    this.voiceController = new AIVoiceController(config.elevenLabs);
    this.musicMixer = new AdaptiveMusicMixer(config.music || { provider: 'custom' });
    this.loreEngine = new LoreEngine(config.llm);

    if (config.llm) {
      this.llm = new LLMIntegration({
        provider: config.llm.provider,
        apiKey: config.llm.apiKey,
        temperature: 0.9,
        maxTokens: 400
      });
    }
  }

  /**
   * Initialize narrative for a new game
   */
  async initializeGameNarrative(
    mapType: string,
    seed: number,
    playerFaction?: string
  ): Promise<NarrativeEvent[]> {
    const events: NarrativeEvent[] = [];

    // Generate world backstory
    await this.worldBuilder.generateWorldBackstory(seed);

    // World introduction
    const worldIntro = await this.generateWorldIntroduction(mapType, seed);
    if (worldIntro) events.push(worldIntro);

    // Faction introduction
    if (playerFaction) {
      const factionIntro = await this.generateFactionIntroduction(playerFaction);
      if (factionIntro) events.push(factionIntro);
    }

    // Map-specific narrative
    const mapNarrative = await this.worldBuilder.generateMapNarrative(mapType, seed);
    if (mapNarrative) {
      events.push({
        id: `map_narrative_${seed}`,
        type: 'world_intro',
        title: 'The Battlefield',
        narrative: mapNarrative,
        timestamp: Date.now()
      });
    }

    // Environmental details
    const envDetails = await this.environmentalStorytelling.generateEnvironmentalDetails(
      mapType,
      seed,
      64,
      64
    );

    // Generate narrative events for environmental details
    for (const detail of envDetails.slice(0, 3)) {
      const event = await this.generateEnvironmentalEvent(detail);
      if (event) events.push(event);
    }

    this.narrativeHistory.push(...events);
    return events;
  }

  /**
   * Generate world introduction
   */
  private async generateWorldIntroduction(
    mapType: string,
    seed: number
  ): Promise<NarrativeEvent | null> {
    const backstory = this.worldBuilder.getWorldBackstory();

    if (this.llm) {
      try {
        const prompt = `Create an opening narrative (3-4 sentences) for a strategy game set 
                        in the world of Quaternion.

World Context:
- The Chroma Cataclysm reshaped the planet
- Factions battle for Chroma control
- Current Era: The Reclamation Age

Map Type: ${mapType}

Make it:
- Emotionally engaging
- Sets the tone for the conflict
- Connects to the world's history
- Creates anticipation

Output only the narrative text, no quotes or formatting.`;

        const narrative = await this.llm.generateText(prompt);
        
        return {
          id: `world_intro_${seed}`,
          type: 'world_intro',
          title: 'The Reclamation Age',
          narrative: narrative.trim(),
          timestamp: Date.now()
        };
      } catch (error) {
        console.warn('World intro generation failed', error);
      }
    }

    // Fallback
    return {
      id: `world_intro_${seed}`,
      type: 'world_intro',
      title: 'The Reclamation Age',
      narrative: `Forty-seven years after the Chroma Cataclysm, the planet still bleeds. 
                  Factions battle for control of the rare resource that both destroyed and 
                  transformed the world. On this ${mapType} battlefield, you will write 
                  the next chapter. Will you heal the world, or exploit it? The choice 
                  is yours.`,
      timestamp: Date.now()
    };
  }

  /**
   * Generate faction introduction
   */
  private async generateFactionIntroduction(
    factionId: string
  ): Promise<NarrativeEvent | null> {
    const faction = this.worldBuilder.getFactionLore(factionId);
    if (!faction) return null;

    this.currentFaction = faction;

    const narrative = `You command the ${faction.name}. ${faction.backstory}

${faction.signatureQuote}

Your mission: ${faction.motivation}. The path ahead is dangerous, but your cause is just. 
The world watches — will you succeed?`;

    // Set voice tone based on faction
    const voiceTone = this.getFactionVoiceTone(faction);
    this.voiceController.setTone(voiceTone);

    return {
      id: `faction_intro_${factionId}`,
      type: 'faction_intro',
      title: `${faction.name}`,
      narrative,
      voiceLine: faction.signatureQuote,
      timestamp: Date.now()
    };
  }

  /**
   * Generate environmental event
   */
  private async generateEnvironmentalEvent(
    detail: EnvironmentalDetail
  ): Promise<NarrativeEvent | null> {
    return {
      id: detail.id,
      type: 'terrain_event',
      title: detail.description,
      narrative: detail.lore,
      timestamp: Date.now(),
      choices: detail.interaction ? [{
        id: `interact_${detail.id}`,
        text: detail.interaction,
        moralAlignment: 'neutral',
        consequence: 'Gain insight into the world\'s history'
      }] : undefined
    };
  }

  /**
   * Generate faction dialogue based on context
   */
  async generateFactionDialogue(
    factionId: string,
    context: string,
    gameState?: any
  ): Promise<FactionDialogue | null> {
    const faction = this.worldBuilder.getFactionLore(factionId);
    if (!faction) return null;

    if (this.llm) {
      try {
        const prompt = `Generate dialogue for ${faction.name} in a strategy game.

Faction Philosophy: ${faction.philosophy}
Faction Motivation: ${faction.motivation}
Cultural Values: ${faction.culturalValues.join(', ')}
Signature Quote: ${faction.signatureQuote}

Context: ${context}
Game State: ${JSON.stringify(gameState || {})}

Generate dialogue (1-2 sentences) that:
- Reflects the faction's philosophy and values
- Responds to the context
- Matches their personality
- Is emotionally resonant

Output only the dialogue text, no quotes or formatting.`;

        const dialogue = await this.llm.generateText(prompt);
        const emotion = this.determineEmotion(context, gameState);
        const voiceTone = this.getEmotionVoiceTone(emotion);

        return {
          factionId,
          context,
          dialogue: dialogue.trim(),
          emotion,
          voiceTone
        };
      } catch (error) {
        console.warn('Faction dialogue generation failed', error);
      }
    }

    // Fallback
    return {
      factionId,
      context,
      dialogue: faction.signatureQuote,
      emotion: 'calm',
      voiceTone: VoiceTone.Neutral
    };
  }

  /**
   * Generate terrain event narrative
   */
  async generateTerrainEvent(
    terrainType: string,
    eventType: string,
    context?: any
  ): Promise<NarrativeEvent | null> {
    const narrative = await this.environmentalStorytelling.generateTerrainEventNarrative(
      terrainType,
      eventType,
      context
    );

    // Determine voice tone
    const story = this.environmentalStorytelling.getTerrainStory(terrainType);
    const voiceTone = this.getToneForEmotionalTone(story?.emotionalTone || 'mysterious');

    return {
      id: `terrain_event_${Date.now()}`,
      type: 'terrain_event',
      title: `${terrainType} Event`,
      narrative,
      voiceLine: narrative,
      timestamp: Date.now()
    };
  }

  /**
   * Generate choice-based narrative event
   */
  async generateChoiceEvent(
    situation: string,
    choices: string[]
  ): Promise<NarrativeEvent | null> {
    if (this.llm) {
      try {
        const prompt = `Create a narrative choice scenario for a strategy game.

Situation: ${situation}
Choices: ${choices.join(', ')}

Generate:
1. A brief narrative setup (2-3 sentences)
2. For each choice, determine:
   - Moral alignment (positive/neutral/negative)
   - Consequence description
   - Faction reaction (if applicable)

Format as JSON with: narrative, choices[{text, moralAlignment, consequence, factionReaction}]`;

        const response = await this.llm.generateText(prompt);
        // Parse JSON (simplified)
        const parsed = this.parseJSONResponse(response);
        
        if (parsed) {
          return {
            id: `choice_${Date.now()}`,
            type: 'choice',
            title: 'A Critical Decision',
            narrative: parsed.narrative || situation,
            choices: parsed.choices || choices.map((c, i) => ({
              id: `choice_${i}`,
              text: c,
              moralAlignment: 'neutral' as const,
              consequence: 'Your choice will shape the outcome'
            })),
            timestamp: Date.now()
          };
        }
      } catch (error) {
        console.warn('Choice event generation failed', error);
      }
    }

    // Fallback
    return {
      id: `choice_${Date.now()}`,
      type: 'choice',
      title: 'A Critical Decision',
      narrative: situation,
      choices: choices.map((c, i) => ({
        id: `choice_${i}`,
        text: c,
        moralAlignment: 'neutral' as const,
        consequence: 'Your choice will shape the outcome'
      })),
      timestamp: Date.now()
    };
  }

  /**
   * Generate victory/defeat narrative
   */
  async generateEndgameNarrative(
    victory: boolean,
    playerFaction?: string,
    gameState?: any
  ): Promise<NarrativeEvent | null> {
    const faction = playerFaction ? this.worldBuilder.getFactionLore(playerFaction) : null;

    if (this.llm) {
      try {
        const prompt = `Create an ${victory ? 'victory' : 'defeat'} narrative for a strategy game.

Faction: ${faction?.name || 'Unknown'}
Philosophy: ${faction?.philosophy || 'Unknown'}
Game State: ${JSON.stringify(gameState || {})}

Generate a narrative (3-4 sentences) that:
- Reflects the faction's philosophy
- Connects to the world's themes
- Is emotionally resonant
- ${victory ? 'Celebrates the victory while questioning its cost' : 'Acknowledges defeat while offering hope'}

Output only the narrative text, no quotes or formatting.`;

        const narrative = await this.llm.generateText(prompt);
        const voiceTone = victory ? VoiceTone.Triumphant : VoiceTone.Neutral;

        return {
          id: `endgame_${Date.now()}`,
          type: victory ? 'victory' : 'defeat',
          title: victory ? 'Victory' : 'Defeat',
          narrative: narrative.trim(),
          voiceLine: narrative.trim(),
          musicCue: victory ? 'victory' : 'defeat',
          timestamp: Date.now()
        };
      } catch (error) {
        console.warn('Endgame narrative generation failed', error);
      }
    }

    // Fallback
    const narrative = victory
      ? `Victory is yours. But at what cost? The ${faction?.name || 'faction'} has achieved 
         their goal, but the planet still bleeds. The Chroma flows, and the cycle continues. 
         Will this victory bring healing, or only more conflict?`
      : `Defeat. The battle is lost, but the war continues. The ${faction?.name || 'faction'} 
         philosophy endures. Perhaps next time, balance will be achieved. The planet waits, 
         and the Chroma flows on.`;

    return {
      id: `endgame_${Date.now()}`,
      type: victory ? 'victory' : 'defeat',
      title: victory ? 'Victory' : 'Defeat',
      narrative,
      voiceLine: narrative,
      musicCue: victory ? 'victory' : 'defeat',
      timestamp: Date.now()
    };
  }

  /**
   * Play narrative event with voice and music
   */
  async playNarrativeEvent(event: NarrativeEvent): Promise<void> {
    // Set music mood
    if (event.musicCue) {
      await this.musicMixer.updateState({
        equilibrium: event.type === 'victory' ? 0.8 : 0.3,
        chaos: event.type === 'defeat' ? 0.7 : 0.2,
        tension: 0.5,
        energyCrisis: false,
        biomassGrowth: false,
        imbalance: event.type === 'defeat'
      });
    }

    // Speak narrative
    if (event.voiceLine) {
      const tone = this.getToneForEventType(event.type);
      await this.voiceController.speak(event.voiceLine, 'narrator', tone);
    }
  }

  /**
   * Get faction voice tone
   */
  private getFactionVoiceTone(faction: FactionLore): VoiceTone {
    if (faction.id === 'quaternion') return VoiceTone.Calm;
    if (faction.id === 'corp') return VoiceTone.Arrogant;
    if (faction.id === 'remnants') return VoiceTone.Neutral;
    if (faction.id === 'ascendants') return VoiceTone.Excited;
    return VoiceTone.Neutral;
  }

  /**
   * Determine emotion from context
   */
  private determineEmotion(
    context: string,
    gameState?: any
  ): FactionDialogue['emotion'] {
    const ctx = context.toLowerCase();
    if (ctx.includes('losing') || ctx.includes('defeat') || ctx.includes('critical')) {
      return 'desperate';
    }
    if (ctx.includes('victory') || ctx.includes('win') || ctx.includes('success')) {
      return 'triumphant';
    }
    if (ctx.includes('attack') || ctx.includes('destroy') || ctx.includes('enemy')) {
      return 'angry';
    }
    if (ctx.includes('help') || ctx.includes('save') || ctx.includes('protect')) {
      return 'pleading';
    }
    return 'calm';
  }

  /**
   * Get emotion voice tone
   */
  private getEmotionVoiceTone(emotion: FactionDialogue['emotion']): VoiceTone {
    switch (emotion) {
      case 'desperate': return VoiceTone.Panicked;
      case 'triumphant': return VoiceTone.Triumphant;
      case 'angry': return VoiceTone.Arrogant;
      case 'pleading': return VoiceTone.Worried;
      default: return VoiceTone.Calm;
    }
  }

  /**
   * Get tone for event type
   */
  private getToneForEventType(type: NarrativeEvent['type']): VoiceTone {
    switch (type) {
      case 'victory': return VoiceTone.Triumphant;
      case 'defeat': return VoiceTone.Neutral;
      case 'terrain_event': return VoiceTone.Excited;
      case 'choice': return VoiceTone.Worried;
      default: return VoiceTone.Calm;
    }
  }

  /**
   * Get tone for emotional tone
   */
  private getToneForEmotionalTone(
    tone: 'melancholic' | 'hopeful' | 'ominous' | 'triumphant' | 'mysterious'
  ): VoiceTone {
    switch (tone) {
      case 'triumphant': return VoiceTone.Triumphant;
      case 'ominous': return VoiceTone.Panicked;
      case 'hopeful': return VoiceTone.Calm;
      case 'melancholic': return VoiceTone.Neutral;
      case 'mysterious': return VoiceTone.Neutral;
      default: return VoiceTone.Neutral;
    }
  }

  /**
   * Parse JSON response
   */
  private parseJSONResponse(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('JSON parsing failed', error);
    }
    return null;
  }

  /**
   * Get narrative history
   */
  getNarrativeHistory(): NarrativeEvent[] {
    return [...this.narrativeHistory];
  }

  /**
   * Get current faction
   */
  getCurrentFaction(): FactionLore | undefined {
    return this.currentFaction;
  }

  /**
   * Get world backstory
   */
  getWorldBackstory() {
    return this.worldBuilder.getWorldBackstory();
  }
}

