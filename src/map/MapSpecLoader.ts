/**
 * Map Spec Loader
 * Loads deterministic map specifications from JSON and generates terrain
 */

import { TerrainSystem, MapSpec, DynamicAnomalyType } from './TerrainSystem';

export interface FactionContext {
  name: string;
  philosophy: string;
  motivation: string;
  aesthetic: string;
  startingMessage?: string;
  victoryMessage?: string;
}

export interface NarrativeMetadata {
  backstory: string;
  setting: string;
  worldContext: string;
  emotionalHook: string;
  factions?: {
    primary?: FactionContext;
    secondary?: FactionContext;
  };
  environmentalStorytelling?: Array<{
    type: 'crashed_ship' | 'memorial' | 'artifact' | 'ancient_ruins' | 'broadcast_tower' | 'research_station' | 'cataclysm_scar';
    coordinates: number[];
    lore: {
      name: string;
      description: string;
      backstory: string;
      eventText?: string;
    };
  }>;
  creativeTerms?: Record<string, string>;
  objectives?: Array<{
    name: string;
    description: string;
    narrativeContext: string;
    coordinates: number[];
  }>;
}

export interface MapSeed {
  seed: number;
  name: string;
  description: string;
  tacticalProfile: string;
  narrative: NarrativeMetadata;
  spec: MapSpec;
}

/**
 * Three ready-to-run map seeds showcasing different terrain puzzle types
 */
export const MAP_SEEDS: Record<string, MapSeed> = {
  two_bridges: {
    seed: 74219,
    name: 'Two Bridges',
    description: 'Positional puzzle with two parallel bridges',
    tacticalProfile: 'Forces choice between defending the easily-held narrow bridge or controlling the wide bridge for faster reinforcement. Resource split creates expansion pressure.',
    narrative: {
      backstory: 'The Twin Span was once a vital trade route connecting the eastern settlements to the western Aether Ore mines. During the Chroma Cataclysm, the central supports were destroyed, leaving only two narrow passages across the chasm. The Terraformers seek to rebuild the bridges and restore the trade route, while the Resource Corps wants to control both spans to monopolize the ore shipments.',
      setting: 'A deep chasm cutting through the Neon Plains, with two remaining bridge structures spanning the gap. Ancient support pylons rise from the depths, their surfaces scarred by the cataclysm.',
      worldContext: 'Post-Chroma Cataclysm: The planet\'s crust fractured here, creating a permanent divide. The bridges are the only safe passage, making this location strategically critical for both factions.',
      emotionalHook: 'Every unit that crosses these bridges carries the weight of their faction\'s future. Will you secure the narrow defensive position, or risk the wider bridge for faster expansion?',
      factions: {
        primary: {
          name: 'Terraformers',
          philosophy: 'Restoration and harmony with the planet',
          motivation: 'Rebuild the bridges to reconnect the settlements and restore trade',
          aesthetic: 'Bioluminescent armor with organic, flowing designs',
          startingMessage: 'Our engineers will rebuild this land! The bridges must be restored.',
          victoryMessage: 'The Twin Span is ours. Trade routes flow once more.'
        },
        secondary: {
          name: 'Resource Corps',
          philosophy: 'Exploitation and profit above all',
          motivation: 'Control both bridges to monopolize Aether Ore shipments',
          aesthetic: 'Industrial exosuits with harsh, angular designs',
          startingMessage: 'Harvest that Chroma – leave none! Control the bridges, control the flow.',
          victoryMessage: 'Both spans secured. The ore flows to us alone.'
        }
      },
      environmentalStorytelling: [
        {
          type: 'memorial',
          coordinates: [400, 512],
          lore: {
            name: 'The Fallen Bridge Memorial',
            description: 'A weathered monument marking where the central bridge collapsed during the cataclysm',
            backstory: 'Erected by survivors to honor those who perished when the main span gave way. The inscription reads: "They crossed into the unknown, so we might remember the way home."',
            eventText: 'Sensors detect a faint energy signature from the memorial. Perhaps the fallen left something behind...'
          }
        },
        {
          type: 'ancient_ruins',
          coordinates: [256, 256],
          lore: {
            name: 'Pre-Cataclysm Settlement Ruins',
            description: 'Crumbling structures from before the disaster',
            backstory: 'These ruins were once a thriving trading post. Now they serve as a reminder of what was lost and what might be regained.',
            eventText: 'Ancient data nodes detected in the ruins. Could contain pre-cataclysm trade route maps.'
          }
        }
      ],
      creativeTerms: {
        'Aether Ore': 'Highly valuable energy-rich mineral deposits',
        'Chroma Cataclysm': 'The great disaster that reshaped the planet',
        'Twin Span': 'The two remaining bridge structures',
        'Neon Plains': 'The glowing grasslands that surround the chasm'
      },
      objectives: [
        {
          name: 'Narrow Bridge Control',
          description: 'Secure the defensible narrow passage',
          narrativeContext: 'The Terraformers see this as a defensive stronghold, while the Resource Corps views it as a bottleneck to exploit.',
          coordinates: [512, 768]
        },
        {
          name: 'Wide Bridge Control',
          description: 'Control the faster reinforcement route',
          narrativeContext: 'Whoever holds this bridge can move forces quickly, but at the cost of being more exposed.',
          coordinates: [512, 256]
        }
      ]
    },
    spec: {
      seed: 74219,
      size: 1024,
      biomes: { neon_plains: 0.6, crater: 0.4 },
      resourceClusters: 4,
      chokepoints: 2,
      objectives: 2,
      dynamicAnomalies: [],
      specialFeatures: [
        {
          type: 'parallel_bridges',
          coordinates: { 
            bridge_wide: [512, 256], 
            bridge_narrow: [512, 768] 
          },
          properties: { 
            width_wide: 3, 
            width_narrow: 1, 
            defense_bonus: 0.7 
          }
        }
      ],
      resourcePlacement: {
        ore: [[256, 256], [768, 768]],
        crystals: [[256, 768], [768, 256]]
      },
      startingPositions: [[128, 512], [896, 512]]
    }
  },
  
  lava_rush: {
    seed: 18342,
    name: 'Lava Rush',
    description: 'Timing puzzle with dynamic lava vent',
    tacticalProfile: 'Central high-value objective that becomes periodically accessible. Tests risk-reward calculation and tech timing (Thermal Shield research windows).',
    narrative: {
      backstory: 'The Caldera of Echoes marks the epicenter where the Chroma Cataclysm first struck. An ancient engine core, buried deep beneath the surface, periodically erupts, creating windows of opportunity to harvest the rare Quanta Crystals that form in its wake. The Terraformers believe the core can be stabilized to prevent future eruptions, while the Resource Corps sees only profit in the crystal-rich eruptions.',
      setting: 'A volcanic wasteland dominated by a massive central caldera. The ground trembles with each eruption, and the air shimmers with heat distortion. Ancient metal structures protrude from the lava flows, remnants of a lost civilization.',
      worldContext: 'This is ground zero of the cataclysm. The eruptions are growing more frequent, suggesting the core is destabilizing. Some say stabilizing it could reverse the planet\'s decline. Others say it\'s too late.',
      emotionalHook: 'Every eruption is a race against time. Do you risk your units for the valuable crystals, or wait for the next cycle? The core\'s instability grows with each passing moment.',
      factions: {
        primary: {
          name: 'Terraformers',
          philosophy: 'Stabilize the core to heal the planet',
          motivation: 'Research the core\'s patterns to develop technology that can prevent future cataclysms',
          aesthetic: 'Heat-resistant bioluminescent suits that pulse with energy',
          startingMessage: 'Sensors detect rising magma – just like when Old Earth\'s core imploded. We must stabilize it!',
          victoryMessage: 'The core is stabilized. The planet can begin to heal.'
        },
        secondary: {
          name: 'Resource Corps',
          philosophy: 'Extract maximum value before the core fails',
          motivation: 'Harvest Quanta Crystals during eruption windows, regardless of the long-term consequences',
          aesthetic: 'Industrial exosuits with heavy thermal shielding',
          startingMessage: 'The lava is unstable, but the crystals are worth it. Push forward!',
          victoryMessage: 'We\'ve extracted enough crystals to fund operations for years.'
        }
      },
      environmentalStorytelling: [
        {
          type: 'cataclysm_scar',
          coordinates: [512, 512],
          lore: {
            name: 'The Core Breach',
            description: 'The epicenter of the Chroma Cataclysm',
            backstory: 'This is where it all began. The ancient engine core that once powered the planet\'s terraforming network ruptured here, unleashing the cataclysm that reshaped the world.',
            eventText: 'The ground trembles. Ancient sensors detect the core\'s energy signature spiking. An eruption is imminent!'
          }
        },
        {
          type: 'research_station',
          coordinates: [300, 300],
          lore: {
            name: 'Abandoned Terraforming Station',
            description: 'A pre-cataclysm research facility',
            backstory: 'This station was monitoring the core when the cataclysm struck. The logs show they were close to a breakthrough in core stabilization technology.',
            eventText: 'Data nodes detected. The station\'s research could accelerate Thermal Shield development.'
          }
        },
        {
          type: 'crashed_ship',
          coordinates: [700, 700],
          lore: {
            name: 'The Last Exodus',
            description: 'A crashed evacuation vessel from the cataclysm',
            backstory: 'This ship was attempting to evacuate survivors when an eruption caught it mid-flight. The wreckage serves as a grim reminder of the cataclysm\'s cost.',
            eventText: 'The ship\'s black box is still transmitting. It contains the last words of those who tried to escape.'
          }
        }
      ],
      creativeTerms: {
        'Quanta Crystals': 'Rare energy crystals that form during core eruptions',
        'Caldera of Echoes': 'The central volcanic crater',
        'Thermal Shield': 'Technology that protects units from lava damage',
        'Core Breach': 'The epicenter of the cataclysm'
      },
      objectives: [
        {
          name: 'The Core Breach',
          description: 'Control the central caldera during eruption windows',
          narrativeContext: 'The most valuable Quanta Crystal deposits form here, but the risk is extreme. Only those with Thermal Shield technology can survive the eruptions.',
          coordinates: [512, 512]
        }
      ]
    },
    spec: {
      seed: 18342,
      size: 1024,
      biomes: { lava: 0.5, neon_plains: 0.3, crater: 0.2 },
      resourceClusters: 3,
      chokepoints: 1,
      objectives: 1,
      dynamicAnomalies: [
        {
          type: 'lava_vent',
          frequency: 'medium',
          duration: 90,
          coordinates: [512, 512],
          radius: 128,
          effect: { 
            damage_per_second: 5, 
            resource_multiplier: 2.0 
          }
        }
      ],
      specialFeatures: [
        {
          type: 'central_caldera',
          coordinates: [512, 512],
          properties: { 
            radius: 128,
            elevation: 0.8, 
            defense_bonus: 0.3 
          }
        }
      ],
      resourcePlacement: {
        ore: [[512, 300], [300, 700]],
        crystals: [[700, 700]]
      },
      startingPositions: [[200, 200], [824, 824]]
    }
  },
  
  fog_vault: {
    seed: 55921,
    name: 'Fog Vault',
    description: 'Information puzzle with sensor jamming',
    tacticalProfile: 'Hidden high-value objective in heavily obscured zone. Rewards scouting investment and creates tension between map control and information warfare.',
    narrative: {
      backstory: 'The Mistwood Vault was a secret data repository built before the Chroma Cataclysm. When the disaster struck, the vault\'s emergency protocols activated, flooding the area with sensor-jamming fog to protect its contents. The Terraformers believe the vault contains terraforming blueprints that could restore the planet, while the Resource Corps seeks the vault\'s resource allocation data to maximize their profits.',
      setting: 'A dense, fog-shrouded swamp where visibility is near zero. Ancient scout towers rise from the mist like sentinels. The air hums with the energy of active sensor jammers, and strange bioluminescent plants pulse in the darkness.',
      worldContext: 'The fog is artificial, created by the vault\'s defense systems. It\'s been active for decades, protecting secrets that could change the course of the planet\'s future.',
      emotionalHook: 'In the fog, you can\'t see what\'s coming. Every step could be your last, or it could lead you to the vault that holds the key to everything. Trust your scouts, trust your instincts, but most of all, trust that the fog hides as much opportunity as danger.',
      factions: {
        primary: {
          name: 'Terraformers',
          philosophy: 'Knowledge should be shared to heal the planet',
          motivation: 'Recover the terraforming blueprints to restore damaged biomes',
          aesthetic: 'Stealth-focused bioluminescent armor that blends with the fog',
          startingMessage: 'The vault\'s secrets could save us all. We must find it, no matter the cost.',
          victoryMessage: 'The blueprints are ours. The planet will bloom again.'
        },
        secondary: {
          name: 'Resource Corps',
          philosophy: 'Information is a commodity to be hoarded',
          motivation: 'Secure the vault\'s data to gain an economic advantage',
          aesthetic: 'Heavy sensor arrays and industrial detection equipment',
          startingMessage: 'That vault contains data worth more than all the ore on this planet. Find it.',
          victoryMessage: 'The vault\'s secrets are now our exclusive property.'
        }
      },
      environmentalStorytelling: [
        {
          type: 'broadcast_tower',
          coordinates: [600, 350],
          lore: {
            name: 'Scout Tower Alpha',
            description: 'An ancient observation post',
            backstory: 'Built by the pre-cataclysm civilization to monitor the vault. The tower\'s sensors can pierce the fog, but its power systems are failing.',
            eventText: 'The tower\'s sensors activate. For a brief moment, the fog clears, revealing hidden paths.'
          }
        },
        {
          type: 'artifact',
          coordinates: [350, 350],
          lore: {
            name: 'The Mistwood Vault',
            description: 'The legendary data repository',
            backstory: 'The vault contains the accumulated knowledge of a lost civilization. Its contents could reshape the world, for better or worse.',
            eventText: 'The vault\'s doors slide open. Inside, data streams cascade across holographic displays. The future of the planet lies within.'
          }
        },
        {
          type: 'ancient_ruins',
          coordinates: [100, 100],
          lore: {
            name: 'The First Settlement',
            description: 'Ruins of the original colony',
            backstory: 'This was where the first settlers landed. They built the vault to preserve their knowledge, never knowing it would outlast them.',
            eventText: 'Ancient logs found in the ruins. They speak of hope, of building a new world. A world that never came to be.'
          }
        }
      ],
      creativeTerms: {
        'Mistwood Vault': 'The legendary data repository hidden in the fog',
        'Sensor Jamming': 'Technology that disrupts detection systems',
        'Scout Towers': 'Ancient observation posts that can pierce the fog',
        'Data Nodes': 'Information storage units containing valuable knowledge'
      },
      objectives: [
        {
          name: 'The Mistwood Vault',
          description: 'Discover and control the hidden data repository',
          narrativeContext: 'The vault is the ultimate prize, but finding it requires navigating the fog and overcoming the defense systems.',
          coordinates: [350, 350]
        },
        {
          name: 'Scout Tower Network',
          description: 'Control the observation posts to gain vision advantage',
          narrativeContext: 'These towers can pierce the fog, but they\'re scattered and vulnerable. Controlling them is key to finding the vault.',
          coordinates: [600, 350]
        }
      ]
    },
    spec: {
      seed: 55921,
      size: 1024,
      biomes: { swamp: 0.4, forest: 0.4, neon_plains: 0.2 },
      resourceClusters: 5,
      chokepoints: 3,
      objectives: 3,
      dynamicAnomalies: [
        {
          type: 'sensor_jamming',
          frequency: 'continuous',
          duration: 0,
          coordinates: [350, 350],
          radius: 200,
          effect: { 
            visibility_modifier: -0.8, 
            detection_range: 0.5 
          }
        }
      ],
      specialFeatures: [
        {
          type: 'hidden_vault',
          coordinates: [350, 350],
          properties: { 
            resource_bonus: 3.0, 
            requires_vision: true 
          }
        },
        {
          type: 'scout_towers',
          coordinates: [[600, 350], [350, 600], [100, 100]],
          properties: { 
            vision_range: 2.0, 
            stealth_detection: true 
          }
        }
      ],
      resourcePlacement: {
        biomass: [[350, 350], [700, 200], [200, 700]],
        data_nodes: [[350, 350], [800, 800]]
      },
      startingPositions: [[150, 150], [874, 874]]
    }
  },

  crystal_nexus: {
    seed: 42891,
    name: 'Crystal Nexus',
    description: 'High-stakes resource control with crystal formations',
    tacticalProfile: 'Multiple crystal formations create natural chokepoints. Control of the central nexus determines resource flow. High ground advantage but exposed positions.',
    narrative: {
      backstory: 'The Crystal Nexus was once a sacred site where the planet\'s energy converged. After the Chroma Cataclysm, the crystals began to resonate with unstable frequencies, creating both opportunity and danger. The Terraformers seek to harmonize the crystals to restore the planet\'s energy network, while the Resource Corps wants to extract them for profit, even if it means destabilizing the entire region.',
      setting: 'A landscape of towering crystal formations that pulse with energy. The air crackles with power, and the ground shimmers with crystalline growths. The central nexus rises like a beacon, its light visible for miles.',
      worldContext: 'These crystals are the planet\'s lifeblood. They channel energy across the surface, but the cataclysm damaged their network. Extracting them could cause a cascade failure that would doom the region.',
      emotionalHook: 'Each crystal you control brings you closer to victory, but at what cost? The nexus pulses with warning. Will you save it, or exploit it?',
      factions: {
        primary: {
          name: 'Terraformers',
          philosophy: 'Harmony with the planet\'s energy network',
          motivation: 'Restore the crystal network to heal the planet',
          aesthetic: 'Crystalline armor that resonates with the nexus',
          startingMessage: 'The crystals sing to us. We must restore their harmony.',
          victoryMessage: 'The nexus is stabilized. The planet\'s energy flows once more.'
        },
        secondary: {
          name: 'Resource Corps',
          philosophy: 'Resources exist to be extracted',
          motivation: 'Harvest the crystals for maximum profit, regardless of consequences',
          aesthetic: 'Industrial mining equipment with crystal-cutting lasers',
          startingMessage: 'Those crystals are worth a fortune. Extract them all!',
          victoryMessage: 'We\'ve stripped the nexus. Profit secured.'
        }
      },
      environmentalStorytelling: [
        {
          type: 'artifact',
          coordinates: [512, 512],
          lore: {
            name: 'The Central Nexus',
            description: 'The heart of the crystal network',
            backstory: 'This is where all the planet\'s energy paths converge. Before the cataclysm, it was a place of pilgrimage. Now it\'s a battleground.',
            eventText: 'The nexus pulses with power. Its energy signature is unstable. Something must be done, and soon.'
          }
        },
        {
          type: 'ancient_ruins',
          coordinates: [256, 256],
          lore: {
            name: 'Temple of Resonance',
            description: 'An ancient structure built around a crystal formation',
            backstory: 'The pre-cataclysm civilization built this temple to honor the crystals. Its walls are covered in inscriptions describing the energy network.',
            eventText: 'The temple\'s inscriptions speak of balance, of harmony. They warn of what happens when the network is disrupted.'
          }
        },
        {
          type: 'memorial',
          coordinates: [768, 768],
          lore: {
            name: 'The Fallen Keepers',
            description: 'A memorial to those who protected the crystals',
            backstory: 'When the cataclysm struck, the Keepers tried to stabilize the nexus. They succeeded, but at the cost of their lives.',
            eventText: 'The memorial glows softly. The Keepers\' sacrifice bought the planet time. Will their work be undone?'
          }
        }
      ],
      creativeTerms: {
        'Crystal Nexus': 'The central energy convergence point',
        'Energy Network': 'The planet\'s natural power distribution system',
        'Resonance': 'The harmonic frequency that stabilizes crystals',
        'Keepers': 'The guardians who protected the crystals'
      },
      objectives: [
        {
          name: 'The Central Nexus',
          description: 'Control the heart of the crystal network',
          narrativeContext: 'Whoever controls the nexus controls the region\'s energy flow. But the responsibility comes with risk.',
          coordinates: [512, 512]
        }
      ]
    },
    spec: {
      seed: 42891,
      size: 1024,
      biomes: { crystal: 0.6, neon_plains: 0.3, crater: 0.1 },
      resourceClusters: 5,
      chokepoints: 4,
      objectives: 1,
      dynamicAnomalies: [
        {
          type: 'resource_flux',
          frequency: 'medium',
          duration: 120,
          coordinates: [512, 512],
          radius: 200,
          effect: { 
            resource_multiplier: 1.5 
          }
        }
      ],
      specialFeatures: [
        {
          type: 'central_nexus',
          coordinates: [512, 512],
          properties: { 
            radius: 150,
            elevation: 0.9, 
            defense_bonus: 0.2,
            vision_bonus: 1.5
          }
        },
        {
          type: 'crystal_formations',
          coordinates: [[256, 256], [768, 256], [256, 768], [768, 768]],
          properties: { 
            defense_bonus: 0.4,
            resource_bonus: 1.2
          }
        }
      ],
      resourcePlacement: {
        crystals: [[512, 512], [256, 256], [768, 256], [256, 768], [768, 768]],
        ore: [[400, 400], [624, 624]]
      },
      startingPositions: [[150, 512], [874, 512]]
    }
  },

  void_station: {
    seed: 67324,
    name: 'Void Station',
    description: 'Defensive puzzle in a void-tainted research facility',
    tacticalProfile: 'A research station surrounded by void zones. Limited safe paths create natural chokepoints. High-value objectives but dangerous terrain.',
    narrative: {
      backstory: 'The Void Station was a cutting-edge research facility studying the void zones that appeared after the Chroma Cataclysm. When their experiments went wrong, the station was partially consumed by the void, creating a dangerous but valuable research site. The Terraformers want to recover the research data to understand and potentially reverse the void zones, while the Resource Corps seeks the station\'s experimental technology for their own purposes.',
      setting: 'A partially collapsed research station floating above void zones. The void has consumed large sections of the facility, leaving only safe pathways. Warning lights flash, and emergency systems struggle to maintain containment.',
      worldContext: 'The void zones are spreading. The station\'s research could hold the key to stopping them, or it could accelerate their growth. Time is running out.',
      emotionalHook: 'The void is hungry. Every step could be your last. But the station\'s secrets could save the planet, or doom it. The choice is yours.',
      factions: {
        primary: {
          name: 'Terraformers',
          philosophy: 'Knowledge must be used to heal, not exploit',
          motivation: 'Recover the research to understand and reverse the void zones',
          aesthetic: 'Void-resistant suits with containment field generators',
          startingMessage: 'The void is spreading. We must recover the research before it\'s too late.',
          victoryMessage: 'The research is safe. We can now fight the void.'
        },
        secondary: {
          name: 'Resource Corps',
          philosophy: 'Danger is just another cost of doing business',
          motivation: 'Extract the station\'s experimental technology for profit',
          aesthetic: 'Heavy industrial suits with void containment units',
          startingMessage: 'That technology is worth billions. Get it, no matter the risk.',
          victoryMessage: 'The station\'s tech is ours. Profit secured, void be damned.'
        }
      },
      environmentalStorytelling: [
        {
          type: 'research_station',
          coordinates: [512, 512],
          lore: {
            name: 'The Void Station',
            description: 'The partially consumed research facility',
            backstory: 'This station was humanity\'s last hope for understanding the void. Now it\'s a tomb, a warning, and a treasure trove all at once.',
            eventText: 'The station\'s emergency systems activate. Containment fields flicker. The void is breaking through.'
          }
        },
        {
          type: 'crashed_ship',
          coordinates: [200, 200],
          lore: {
            name: 'The Evacuation Shuttle',
            description: 'A crashed escape vessel',
            backstory: 'The station\'s crew tried to escape when the void broke containment. They didn\'t make it far.',
            eventText: 'The shuttle\'s logs are still accessible. They tell a story of desperation, of hope, of failure.'
          }
        },
        {
          type: 'broadcast_tower',
          coordinates: [800, 800],
          lore: {
            name: 'Emergency Beacon',
            description: 'A distress signal still transmitting',
            backstory: 'The station\'s last message: "The void is breaking containment. Save the research. Save yourselves."',
            eventText: 'The beacon still pulses. Someone might still be alive in there. Or something else might be.'
          }
        }
      ],
      creativeTerms: {
        'Void Zones': 'Areas consumed by the void, where reality breaks down',
        'Containment Fields': 'Technology that prevents void spread',
        'Void Station': 'The research facility studying the void',
        'Void Taint': 'The corruption that spreads from void zones'
      },
      objectives: [
        {
          name: 'The Void Station',
          description: 'Control the research facility and its data',
          narrativeContext: 'The station holds the key to understanding the void, but it\'s also the most dangerous location on the map.',
          coordinates: [512, 512]
        }
      ]
    },
    spec: {
      seed: 67324,
      size: 1024,
      biomes: { void: 0.4, neon_plains: 0.4, crystal: 0.2 },
      resourceClusters: 4,
      chokepoints: 3,
      objectives: 1,
      dynamicAnomalies: [
        {
          type: 'quantum_fracture',
          frequency: 'short',
          duration: 60,
          coordinates: [300, 300],
          radius: 100,
          effect: { 
            movement_penalty: 0.5,
            visibility_modifier: -0.6
          }
        },
        {
          type: 'quantum_fracture',
          frequency: 'short',
          duration: 60,
          coordinates: [724, 724],
          radius: 100,
          effect: { 
            movement_penalty: 0.5,
            visibility_modifier: -0.6
          }
        }
      ],
      specialFeatures: [
        {
          type: 'research_station',
          coordinates: [512, 512],
          properties: { 
            radius: 120,
            defense_bonus: 0.5,
            resource_bonus: 2.0
          }
        },
        {
          type: 'void_barriers',
          coordinates: [[300, 300], [724, 300], [300, 724], [724, 724]],
          properties: { 
            impassable: true,
            damage_per_second: 10
          }
        }
      ],
      resourcePlacement: {
        data_nodes: [[512, 512], [400, 400], [624, 624]],
        crystals: [[512, 400], [512, 624]]
      },
      startingPositions: [[150, 150], [874, 874]]
    }
  }
};

/**
 * Load a map seed and generate terrain
 */
export function loadMapSeed(seedName: string): { terrain: TerrainSystem; seed: MapSeed } | null {
  const seed = MAP_SEEDS[seedName];
  if (!seed) {
    console.error(`Map seed "${seedName}" not found`);
    return null;
  }
  
  const terrain = new TerrainSystem(seed.spec.size, seed.spec.size, seed.spec.seed);
  terrain.generateFromSpec(seed.spec);
  
  // Apply environmental storytelling features from narrative metadata
  if (seed.narrative.environmentalStorytelling) {
    terrain.applyEnvironmentalStorytelling(seed.narrative.environmentalStorytelling);
  }
  
  return { terrain, seed };
}

/**
 * Load map from custom spec
 */
export function loadMapFromSpec(spec: MapSpec): TerrainSystem {
  const terrain = new TerrainSystem(spec.size, spec.size, spec.seed);
  terrain.generateFromSpec(spec);
  return terrain;
}

/**
 * Get all available map seeds
 */
export function getAvailableSeeds(): string[] {
  return Object.keys(MAP_SEEDS);
}

/**
 * Get map seed by name
 */
export function getMapSeed(name: string): MapSeed | null {
  return MAP_SEEDS[name] || null;
}

