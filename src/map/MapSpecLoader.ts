/**
 * Map Spec Loader
 * Loads deterministic map specifications from JSON and generates terrain
 */

import { TerrainSystem, MapSpec, DynamicAnomalyType } from './TerrainSystem';

export interface MapSeed {
  seed: number;
  name: string;
  description: string;
  tacticalProfile: string;
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

