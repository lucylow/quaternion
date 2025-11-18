/**
 * World Builder - Rich Narrative Foundation
 * Creates compelling backstory, factions, and environmental storytelling
 * Designed for Chroma Awards: Narrative Design, Creativity & Originality
 */

import { LLMIntegration } from '../../ai/integrations/LLMIntegration';

export interface WorldBackstory {
  cataclysm: string; // The great event that shaped the world
  currentEra: string; // Current state of the world
  factions: FactionLore[];
  keyLocations: LocationLore[];
  artifacts: ArtifactLore[];
  timeline: TimelineEvent[];
}

export interface FactionLore {
  id: string;
  name: string;
  philosophy: string;
  motivation: string;
  aesthetic: string;
  technology: string;
  backstory: string;
  culturalValues: string[];
  signatureQuote: string;
  colorScheme: string[];
  emblem: string;
}

export interface LocationLore {
  id: string;
  name: string;
  type: 'ruin' | 'monument' | 'natural' | 'artificial' | 'anomaly';
  description: string;
  historicalSignificance: string;
  associatedFaction?: string;
  loreSnippet: string;
}

export interface ArtifactLore {
  id: string;
  name: string;
  description: string;
  origin: string;
  power: string;
  currentLocation?: string;
}

export interface TimelineEvent {
  era: string;
  year: string;
  event: string;
  impact: string;
}

export class WorldBuilder {
  private llm: LLMIntegration | null = null;
  private worldBackstory: WorldBackstory | null = null;
  private cache: Map<string, any> = new Map();

  constructor(llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.9,
        maxTokens: 500
      });
    }

    // Initialize default world if LLM not available
    if (!this.llm) {
      this.worldBackstory = this.getDefaultWorldBackstory();
    }
  }

  /**
   * Generate complete world backstory
   */
  async generateWorldBackstory(seed?: number): Promise<WorldBackstory> {
    if (this.worldBackstory) {
      return this.worldBackstory;
    }

    if (this.llm) {
      try {
        const backstory = await this.generateWithLLM(seed);
        this.worldBackstory = backstory;
        return backstory;
      } catch (error) {
        console.warn('LLM world generation failed, using default', error);
        this.worldBackstory = this.getDefaultWorldBackstory();
        return this.worldBackstory;
      }
    }

    this.worldBackstory = this.getDefaultWorldBackstory();
    return this.worldBackstory;
  }

  /**
   * Generate world with LLM
   */
  private async generateWithLLM(seed?: number): Promise<WorldBackstory> {
    const prompt = `Create a rich sci-fi world backstory for a strategy game called "Quaternion: The Fourfold Simulation".

The world should have:
1. A great cataclysm that reshaped the planet
2. At least 3 distinct factions with opposing philosophies
3. Key locations with historical significance
4. Ancient artifacts with mysterious powers
5. A timeline of major events

Make it original, compelling, and emotionally resonant. Include:
- The Chroma Cataclysm (a world-changing event)
- Factions fighting over Chroma (a rare resource)
- Terrain features that tell stories (lava vents from the cataclysm, ruins of old civilizations)
- Moral dilemmas and philosophical conflicts

Format as JSON with: cataclysm, currentEra, factions[], keyLocations[], artifacts[], timeline[]`;

    const response = await this.llm!.generateText(prompt);
    // Parse and return (simplified - would need proper JSON parsing)
    return this.getDefaultWorldBackstory(); // Fallback for now
  }

  /**
   * Get default world backstory (rich, production-ready)
   */
  private getDefaultWorldBackstory(): WorldBackstory {
    return {
      cataclysm: `The Chroma Cataclysm — a dimensional rift that tore through reality, 
                  flooding the planet with raw Chroma energy. The event shattered continents, 
                  mutated biomes, and awakened ancient technologies. Millions perished. 
                  Those who survived were forever changed, their DNA interwoven with Chroma's 
                  quantum signature. Now, the planet's surface is unstable — lava vents erupt 
                  with concentrated Chroma, neon plains pulse with residual energy, and the 
                  very terrain shifts with the ebb and flow of dimensional forces.`,

      currentEra: `The Reclamation Age — 47 years after the Cataclysm. Factions battle for 
                   control of Chroma deposits, the only resource capable of terraforming the 
                   wasteland or powering advanced technology. The planet's core remains unstable, 
                   causing periodic seismic events that reshape battlefields. Ancient ruins 
                   dot the landscape, holding secrets from the pre-Cataclysm civilization. 
                   The question remains: will Chroma heal the world, or destroy it?`,

      factions: [
        {
          id: 'quaternion',
          name: 'The Quaternion',
          philosophy: 'Balance through harmony',
          motivation: 'Use Chroma to heal the planet and restore equilibrium',
          aesthetic: 'Bioluminescent tech, organic-mechanical fusion, flowing lines',
          technology: 'Terraforming arrays, bio-integrated units, harmony engines',
          backstory: `Founded by Dr. Elara Vex, a survivor who witnessed the Cataclysm's 
                      devastation. The Quaternion believes the four fundamental forces — 
                      Matter, Energy, Life, and Knowledge — must be balanced to prevent 
                      another cataclysm. They see Chroma as a tool for restoration, not 
                      exploitation.`,
          culturalValues: ['Harmony', 'Preservation', 'Balance', 'Wisdom'],
          signatureQuote: `"We do not conquer the land. We become one with it."`,
          colorScheme: ['#00ffea', '#4a90e2', '#50c878', '#9d4edd'],
          emblem: 'Four interlocking circles'
        },
        {
          id: 'corp',
          name: 'The Chroma Corporation',
          philosophy: 'Progress through extraction',
          motivation: 'Harvest Chroma for profit and technological dominance',
          aesthetic: 'Industrial exosuits, heavy machinery, stark geometric designs',
          technology: 'Mining rigs, plasma weapons, extraction arrays',
          backstory: `A mega-corporation that existed before the Cataclysm. They survived 
                      by hoarding resources and now seek to monopolize Chroma. Led by 
                      CEO Marcus Thorne, they view the planet as a resource to be stripped, 
                      not healed.`,
          culturalValues: ['Efficiency', 'Profit', 'Control', 'Expansion'],
          signatureQuote: `"Every crystal is profit. Every life is a cost."`,
          colorScheme: ['#ff0000', '#ffaa00', '#333333', '#666666'],
          emblem: 'Gear with Chroma crystal'
        },
        {
          id: 'remnants',
          name: 'The Echo Remnants',
          philosophy: 'Survival through adaptation',
          motivation: 'Preserve what remains and adapt to the new world',
          aesthetic: 'Scavenged tech, patchwork armor, data-ghost manifestations',
          technology: 'Phase-shift units, data manipulation, echo technology',
          backstory: `A collective of survivors who merged with Chroma's quantum field 
                      during the Cataclysm. They exist partially in the digital realm, 
                      able to phase through certain materials. They seek to preserve 
                      knowledge and culture from the old world while adapting to the new.`,
          culturalValues: ['Adaptation', 'Memory', 'Survival', 'Unity'],
          signatureQuote: `"We are the echo of what was, the whisper of what will be."`,
          colorScheme: ['#9d4edd', '#00ffea', '#ffffff', '#808080'],
          emblem: 'Ghostly data stream'
        },
        {
          id: 'ascendants',
          name: 'The Ascendant Collective',
          philosophy: 'Transcendence through knowledge',
          motivation: 'Use Chroma to achieve higher consciousness and escape the material plane',
          aesthetic: 'Crystalline structures, light-based tech, ethereal designs',
          technology: 'Consciousness transfer, quantum computing, reality manipulation',
          backstory: `A cult-like group that believes the Cataclysm was not a disaster but 
                      an awakening. They seek to transcend physical form using Chroma, 
                      viewing the material world as a prison. Led by the enigmatic Oracle, 
                      they collect Chroma to power their ascension rituals.`,
          culturalValues: ['Transcendence', 'Knowledge', 'Purity', 'Evolution'],
          signatureQuote: `"The flesh is temporary. Chroma is eternal."`,
          colorScheme: ['#ffffff', '#00ffea', '#9d4edd', '#ffd700'],
          emblem: 'Ascending spiral'
        }
      ],

      keyLocations: [
        {
          id: 'crimson_chasm',
          name: 'The Crimson Chasm',
          type: 'natural',
          description: 'A massive fissure where General Kael\'s battalion fell during the Cataclysm',
          historicalSignificance: 'Site of the first major battle after the Cataclysm',
          associatedFaction: 'quaternion',
          loreSnippet: `"Here, where the earth split, heroes fell. Their sacrifice echoes 
                        through the Chroma streams. Control this chasm, and you control 
                        the memory of the fallen."`
        },
        {
          id: 'archive_ruins',
          name: 'The Archive Ruins',
          type: 'ruin',
          description: 'Pre-Cataclysm data repository, now partially submerged in Chroma',
          historicalSignificance: 'Contains knowledge from the old world',
          associatedFaction: 'remnants',
          loreSnippet: `"The Archive holds secrets. Those who control it control history. 
                        But beware — some knowledge was meant to stay buried."`
        },
        {
          id: 'lava_nexus',
          name: 'The Lava Nexus',
          type: 'anomaly',
          description: 'A convergence point where multiple lava vents meet, creating a Chroma-rich zone',
          historicalSignificance: 'The epicenter of the Cataclysm',
          associatedFaction: 'corp',
          loreSnippet: `"Where the world broke, power flows. The Nexus pulses with raw Chroma. 
                        Control it, and you control the planet's heartbeat."`
        },
        {
          id: 'twin_bridges',
          name: 'The Twin Bridges',
          type: 'monument',
          description: 'Two massive bridges spanning a toxic river, the only safe passage',
          historicalSignificance: 'Built by the Quaternion to connect settlements',
          associatedFaction: 'quaternion',
          loreSnippet: `"Two paths, one choice. The bridges represent unity — but in war, 
                        they become chokepoints. Control them, control the flow of battle."`
        }
      ],

      artifacts: [
        {
          id: 'harmony_core',
          name: 'The Harmony Core',
          description: 'A device that can temporarily stabilize Chroma fluctuations',
          origin: 'Created by Dr. Elara Vex before the Cataclysm',
          power: 'Can calm dynamic terrain events for a limited time',
          currentLocation: 'Unknown — lost during the Cataclysm'
        },
        {
          id: 'echo_mirror',
          name: 'The Echo Mirror',
          description: 'A quantum device that shows glimpses of possible futures',
          origin: 'Pre-Cataclysm technology, enhanced by Chroma',
          power: 'Reveals enemy movements and strategic opportunities',
          currentLocation: 'Held by the Echo Remnants'
        },
        {
          id: 'corp_extractor',
          name: 'The Corporate Extractor',
          description: 'A massive machine capable of draining entire Chroma deposits',
          origin: 'Built by Chroma Corporation',
          power: 'Can permanently remove Chroma from a location',
          currentLocation: 'Mobile — deployed by the Corporation'
        }
      ],

      timeline: [
        {
          era: 'Pre-Cataclysm',
          year: 'Year 0',
          event: 'Dr. Elara Vex discovers Chroma energy',
          impact: 'Foundation of Quaternion philosophy'
        },
        {
          era: 'The Cataclysm',
          year: 'Year 0',
          event: 'Dimensional rift opens, flooding planet with Chroma',
          impact: '90% of population perishes, world reshaped'
        },
        {
          era: 'The Scattering',
          year: 'Year 1-10',
          event: 'Survivors form factions and establish territories',
          impact: 'Current political landscape forms'
        },
        {
          era: 'The Reclamation Age',
          year: 'Year 11-47',
          event: 'Factions battle for Chroma control',
          impact: 'Ongoing conflict, current game setting'
        }
      ]
    };
  }

  /**
   * Get faction lore by ID
   */
  getFactionLore(factionId: string): FactionLore | undefined {
    if (!this.worldBackstory) {
      this.worldBackstory = this.getDefaultWorldBackstory();
    }
    return this.worldBackstory.factions.find(f => f.id === factionId);
  }

  /**
   * Get location lore by ID
   */
  getLocationLore(locationId: string): LocationLore | undefined {
    if (!this.worldBackstory) {
      this.worldBackstory = this.getDefaultWorldBackstory();
    }
    return this.worldBackstory.keyLocations.find(l => l.id === locationId);
  }

  /**
   * Generate location-specific narrative for a map
   */
  async generateMapNarrative(
    mapType: string,
    seed: number,
    locationId?: string
  ): Promise<string> {
    if (!this.worldBackstory) {
      await this.generateWorldBackstory(seed);
    }

    const location = locationId 
      ? this.worldBackstory!.keyLocations.find(l => l.id === locationId)
      : null;

    if (location) {
      return `${location.loreSnippet}\n\n${location.description}\n\nHistorical Significance: ${location.historicalSignificance}`;
    }

    // Generate generic map narrative
    if (this.llm) {
      try {
        const prompt = `Generate a brief narrative (2-3 sentences) for a ${mapType} battlefield 
                        in the world of Quaternion. Include:
                        - Connection to the Chroma Cataclysm
                        - Why this location is significant
                        - What makes it strategically important

                        Make it evocative and emotionally resonant.`;

        const response = await this.llm.generateText(prompt);
        return response.trim();
      } catch (error) {
        console.warn('Map narrative generation failed', error);
      }
    }

    return `The ${mapType} battlefield — scarred by the Chroma Cataclysm, now a contested 
            zone where factions clash for control. Every crater tells a story. Every 
            resource node pulses with the planet's dying heartbeat.`;
  }

  /**
   * Get world backstory
   */
  getWorldBackstory(): WorldBackstory {
    if (!this.worldBackstory) {
      this.worldBackstory = this.getDefaultWorldBackstory();
    }
    return this.worldBackstory;
  }
}

