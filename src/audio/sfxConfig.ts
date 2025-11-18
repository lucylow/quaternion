/**
 * SFX Configuration
 * Defines sound effects and their properties
 */

export interface SFXConfig {
  path: string;
  volume: number;
  randomPitch?: [number, number];
  loop?: boolean;
  category: 'ui' | 'combat' | 'environment' | 'resource' | 'narrative';
}

export const SFX_CONFIG: Record<string, SFXConfig> = {
  // UI Sounds
  ui_click: {
    path: '/assets/sfx/ui/click.wav',
    volume: 0.6,
    category: 'ui'
  },
  ui_hover: {
    path: '/assets/sfx/ui/hover.wav',
    volume: 0.4,
    category: 'ui'
  },
  ui_select: {
    path: '/assets/sfx/ui/select.wav',
    volume: 0.7,
    category: 'ui'
  },
  ui_error: {
    path: '/assets/sfx/ui/error.wav',
    volume: 0.8,
    category: 'ui'
  },
  ui_success: {
    path: '/assets/sfx/ui/success.wav',
    volume: 0.8,
    category: 'ui'
  },
  
  // Resource Sounds
  resource_ore: {
    path: '/assets/sfx/resources/ore_collect.wav',
    volume: 0.7,
    randomPitch: [0.95, 1.05],
    category: 'resource'
  },
  resource_energy: {
    path: '/assets/sfx/resources/energy_collect.wav',
    volume: 0.7,
    randomPitch: [0.95, 1.05],
    category: 'resource'
  },
  resource_biomass: {
    path: '/assets/sfx/resources/biomass_collect.wav',
    volume: 0.7,
    randomPitch: [0.95, 1.05],
    category: 'resource'
  },
  resource_data: {
    path: '/assets/sfx/resources/data_collect.wav',
    volume: 0.7,
    randomPitch: [0.95, 1.05],
    category: 'resource'
  },
  
  // Combat Sounds
  combat_attack: {
    path: '/assets/sfx/combat/attack.wav',
    volume: 0.8,
    randomPitch: [0.9, 1.1],
    category: 'combat'
  },
  combat_hit: {
    path: '/assets/sfx/combat/hit.wav',
    volume: 0.8,
    randomPitch: [0.9, 1.1],
    category: 'combat'
  },
  combat_explosion: {
    path: '/assets/sfx/combat/explosion.wav',
    volume: 1.0,
    category: 'combat'
  },
  combat_defense: {
    path: '/assets/sfx/combat/defense.wav',
    volume: 0.7,
    category: 'combat'
  },
  
  // Environmental Sounds
  env_wind: {
    path: '/assets/sfx/environment/wind.wav',
    volume: 0.5,
    loop: true,
    category: 'environment'
  },
  env_lava: {
    path: '/assets/sfx/environment/lava_rumble.wav',
    volume: 0.6,
    loop: true,
    category: 'environment'
  },
  env_creak: {
    path: '/assets/sfx/environment/creak.wav',
    volume: 0.5,
    category: 'environment'
  },
  env_rumble: {
    path: '/assets/sfx/environment/rumble.wav',
    volume: 0.6,
    category: 'environment'
  },
  
  // Narrative/Kaiju Sounds
  kaiju_heartbeat: {
    path: '/assets/sfx/narrative/kaiju_heartbeat.wav',
    volume: 0.7,
    loop: true,
    category: 'narrative'
  },
  kaiju_roar: {
    path: '/assets/sfx/narrative/kaiju_roar.wav',
    volume: 1.0,
    category: 'narrative'
  },
  narrative_event: {
    path: '/assets/sfx/narrative/event_sting.wav',
    volume: 0.8,
    category: 'narrative'
  }
};

/**
 * Get SFX config by name
 */
export function getSFXConfig(name: string): SFXConfig | undefined {
  return SFX_CONFIG[name];
}

/**
 * Get all SFX in a category
 */
export function getSFXByCategory(category: SFXConfig['category']): string[] {
  return Object.keys(SFX_CONFIG).filter(
    key => SFX_CONFIG[key].category === category
  );
}

