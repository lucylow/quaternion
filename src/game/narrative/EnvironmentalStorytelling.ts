/**
 * Environmental Storytelling System
 * Uses terrain, objects, and world details to tell stories
 * Designed for Chroma Awards: Narrative Design, Creativity & Originality
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';
import { WorldBuilder, LocationLore } from './WorldBuilder';

export interface EnvironmentalDetail {
  id: string;
  type: 'ruin' | 'monument' | 'artifact' | 'corpse' | 'message' | 'anomaly';
  position: { x: number; y: number };
  description: string;
  lore: string;
  interaction?: string; // What happens when player interacts
  visualDescription: string;
  associatedFaction?: string;
}

export interface TerrainStory {
  terrainType: string;
  backstory: string;
  significance: string;
  emotionalTone: 'melancholic' | 'hopeful' | 'ominous' | 'triumphant' | 'mysterious';
  associatedEvents: string[];
}

export class EnvironmentalStorytelling {
  private llm: LLMIntegration | null = null;
  private worldBuilder: WorldBuilder;
  private environmentalDetails: Map<string, EnvironmentalDetail[]> = new Map();
  private terrainStories: Map<string, TerrainStory> = new Map();

  constructor(
    worldBuilder: WorldBuilder,
    llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }
  ) {
    this.worldBuilder = worldBuilder;
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.9,
        maxTokens: 300
      });
    }

    this.initializeTerrainStories();
  }

  /**
   * Initialize terrain stories
   */
  private initializeTerrainStories(): void {
    const backstory = this.worldBuilder.getWorldBackstory();

    this.terrainStories.set('lava', {
      terrainType: 'Lava Vents',
      backstory: `Scars from the Chroma Cataclysm. When the dimensional rift tore open, 
                  the planet's core erupted, creating these unstable vents. They pulse with 
                  concentrated Chroma — both a resource and a death trap.`,
      significance: `Control of lava vents means control of the planet's power source. 
                     But the unstable terrain claims many lives.`,
      emotionalTone: 'ominous',
      associatedEvents: ['eruption', 'chroma_surge', 'thermal_anomaly']
    });

    this.terrainStories.set('neon_plains', {
      terrainType: 'Neon Plains',
      backstory: `Residual Chroma energy from the Cataclysm has crystallized into glowing 
                  formations. The Quaternion see beauty here — the Corporation sees profit. 
                  The plains pulse with the planet's dying heartbeat.`,
      significance: `The neon formations are both beautiful and dangerous. They provide 
                     energy but can overload systems.`,
      emotionalTone: 'mysterious',
      associatedEvents: ['energy_surge', 'crystal_formation', 'overload']
    });

    this.terrainStories.set('ruins', {
      terrainType: 'Ancient Ruins',
      backstory: `Pre-Cataclysm structures, now partially buried. Some hold data archives, 
                  others are tombs. The Echo Remnants seek to preserve what remains. The 
                  Corporation seeks to strip them for resources.`,
      significance: `Ruins hold knowledge and artifacts. But they're also death traps — 
                     unstable structures that can collapse.`,
      emotionalTone: 'melancholic',
      associatedEvents: ['discovery', 'collapse', 'data_recovery']
    });

    this.terrainStories.set('frozen_wasteland', {
      terrainType: 'Frozen Wasteland',
      backstory: `The Cataclysm's dimensional energy froze entire regions. Now, these 
                  wastelands are both preserved and lifeless. Some say the frozen contain 
                  survivors in stasis — others say they're tombs.`,
      significance: `The frozen wasteland is treacherous but holds secrets. Movement is 
                     slow, but the ice preserves ancient technology.`,
      emotionalTone: 'melancholic',
      associatedEvents: ['ice_storm', 'thaw', 'discovery']
    });
  }

  /**
   * Generate environmental details for a map
   */
  async generateEnvironmentalDetails(
    mapType: string,
    seed: number,
    mapWidth: number,
    mapHeight: number
  ): Promise<EnvironmentalDetail[]> {
    const cacheKey = `env_${mapType}_${seed}`;
    if (this.environmentalDetails.has(cacheKey)) {
      return this.environmentalDetails.get(cacheKey)!;
    }

    const details: EnvironmentalDetail[] = [];
    const backstory = this.worldBuilder.getWorldBackstory();

    // Generate details based on map type
    if (mapType.includes('lava') || mapType.includes('volcanic')) {
      details.push(...this.generateLavaDetails(seed, mapWidth, mapHeight, backstory));
    }

    if (mapType.includes('ruin') || mapType.includes('urban')) {
      details.push(...this.generateRuinDetails(seed, mapWidth, mapHeight, backstory));
    }

    if (mapType.includes('neon') || mapType.includes('plains')) {
      details.push(...this.generateNeonDetails(seed, mapWidth, mapHeight, backstory));
    }

    // Always add some generic details
    details.push(...this.generateGenericDetails(seed, mapWidth, mapHeight, backstory));

    this.environmentalDetails.set(cacheKey, details);
    return details;
  }

  /**
   * Generate lava-specific details
   */
  private generateLavaDetails(
    seed: number,
    width: number,
    height: number,
    backstory: any
  ): EnvironmentalDetail[] {
    return [
      {
        id: `lava_detail_${seed}_1`,
        type: 'monument',
        position: { x: width * 0.3, y: height * 0.4 },
        description: 'A memorial to General Kael\'s fallen battalion',
        lore: `"Here, where the Crimson Chasm opened, General Kael's battalion made their 
               last stand. They held the line, buying time for civilians to escape. Their 
               sacrifice echoes through the Chroma streams. The memorial glows with residual 
               energy — some say you can still hear their battle cries in the wind."`,
        interaction: 'Gain temporary morale boost (+10% unit effectiveness for 60 seconds)',
        visualDescription: 'A crystalline monument with glowing inscriptions, surrounded by lava',
        associatedFaction: 'quaternion'
      },
      {
        id: `lava_detail_${seed}_2`,
        type: 'corpse',
        position: { x: width * 0.7, y: height * 0.6 },
        description: 'Fossilized remains of a pre-Cataclysm creature',
        lore: `"A massive creature, frozen in the moment of the Cataclysm. Its form is 
               partially crystallized, preserved by Chroma energy. Scientists debate 
               whether it was killed by the event or transformed by it. The Echo Remnants 
               consider it sacred — the Corporation sees it as a resource to be harvested."`,
        interaction: 'Research option: Study the remains (unlocks new tech)',
        visualDescription: 'A massive, partially-crystallized skeleton',
        associatedFaction: 'remnants'
      }
    ];
  }

  /**
   * Generate ruin-specific details
   */
  private generateRuinDetails(
    seed: number,
    width: number,
    height: number,
    backstory: any
  ): EnvironmentalDetail[] {
    return [
      {
        id: `ruin_detail_${seed}_1`,
        type: 'ruin',
        position: { x: width * 0.5, y: height * 0.3 },
        description: 'The Archive Ruins — partially submerged data repository',
        lore: `"The Archive once held the sum of human knowledge. Now, it's partially 
               submerged in Chroma-saturated ground. The Echo Remnants guard it fiercely — 
               they believe the data within could restore the old world. But accessing it 
               is dangerous — the structure is unstable, and Chroma corruption has damaged 
               the data cores."`,
        interaction: 'Attempt data recovery (risky but rewarding)',
        visualDescription: 'A massive, partially-buried structure with glowing data streams',
        associatedFaction: 'remnants'
      },
      {
        id: `ruin_detail_${seed}_2`,
        type: 'message',
        position: { x: width * 0.2, y: height * 0.8 },
        description: 'A pre-Cataclysm distress signal, still broadcasting',
        lore: `"A faint signal, repeating the same message: 'This is Dr. Elara Vex. The 
               rift is opening. We can't stop it. If anyone receives this... remember us. 
               Remember what we tried to build.' The message has been playing for 47 years. 
               Some say it's a ghost. Others say it's a warning."`,
        interaction: 'Decode the message (reveals hidden lore)',
        visualDescription: 'A damaged communication array, still pulsing with light',
        associatedFaction: 'quaternion'
      }
    ];
  }

  /**
   * Generate neon-specific details
   */
  private generateNeonDetails(
    seed: number,
    width: number,
    height: number,
    backstory: any
  ): EnvironmentalDetail[] {
    return [
      {
        id: `neon_detail_${seed}_1`,
        type: 'anomaly',
        position: { x: width * 0.6, y: height * 0.5 },
        description: 'A Chroma crystal formation pulsing with energy',
        lore: `"A massive crystal formation, grown from residual Chroma. It pulses in 
               rhythm with the planet's core. The Quaternion see it as a sign of hope — 
               proof that the planet can heal. The Corporation sees it as a resource to 
               be mined. But touching it is dangerous — the energy can overload systems 
               or, some say, grant visions of possible futures."`,
        interaction: 'Harvest Chroma (risky — may cause energy surge)',
        visualDescription: 'A massive, pulsing crystal formation with neon glow',
        associatedFaction: 'quaternion'
      }
    ];
  }

  /**
   * Generate generic environmental details
   */
  private generateGenericDetails(
    seed: number,
    width: number,
    height: number,
    backstory: any
  ): EnvironmentalDetail[] {
    return [
      {
        id: `generic_detail_${seed}_1`,
        type: 'artifact',
        position: { x: width * 0.4, y: height * 0.7 },
        description: 'A damaged Harmony Core fragment',
        lore: `"A fragment of Dr. Elara Vex's Harmony Core, damaged during the Cataclysm. 
               It still pulses with weak energy. If restored, it could stabilize Chroma 
               fluctuations in a small area. The Quaternion would pay dearly for this — 
               the Corporation would destroy it to prevent their advantage."`,
        interaction: 'Collect artifact (faction-specific reward)',
        visualDescription: 'A glowing, damaged device with intricate circuitry',
        associatedFaction: 'quaternion'
      }
    ];
  }

  /**
   * Get terrain story
   */
  getTerrainStory(terrainType: string): TerrainStory | undefined {
    return this.terrainStories.get(terrainType);
  }

  /**
   * Generate dynamic event narrative based on terrain
   */
  async generateTerrainEventNarrative(
    terrainType: string,
    eventType: string,
    context?: any
  ): Promise<string> {
    const story = this.terrainStories.get(terrainType);
    if (!story) {
      return `The ${terrainType} shifts, creating new tactical opportunities.`;
    }

    if (this.llm) {
      try {
        const prompt = `Generate a brief narrative event (2-3 sentences) for a ${terrainType} 
                        terrain in the world of Quaternion.

Terrain Backstory: ${story.backstory}
Event Type: ${eventType}
Context: ${JSON.stringify(context || {})}

Make it:
- Emotionally resonant (${story.emotionalTone} tone)
- Connected to the world's history
- Tactically relevant
- Evocative and memorable

Output only the narrative text, no quotes or formatting.`;

        const response = await this.llm.generateText(prompt);
        return response.trim();
      } catch (error) {
        console.warn('Terrain event narrative generation failed', error);
      }
    }

    // Fallback
    const eventTemplates: Record<string, string> = {
      eruption: `The lava vents erupt with concentrated Chroma — just like during the 
                 Cataclysm. The ground trembles, and for a moment, you feel the planet's 
                 pain. But in that chaos lies opportunity.`,
      energy_surge: `The neon formations pulse brighter, energy surging through the 
                     crystalline structures. It's beautiful and deadly — the same energy 
                     that destroyed the world now powers your weapons.`,
      discovery: `In the ruins, you find something: a data fragment, a preserved artifact, 
                  a message from the past. The old world speaks to you. What will you do 
                  with this knowledge?`
    };

    return eventTemplates[eventType] || story.backstory;
  }

  /**
   * Get environmental details for a map
   */
  getEnvironmentalDetails(mapType: string, seed: number): EnvironmentalDetail[] {
    const cacheKey = `env_${mapType}_${seed}`;
    return this.environmentalDetails.get(cacheKey) || [];
  }
}

