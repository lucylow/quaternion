import Phaser from 'phaser';

export class MapTheme {
  name: string;
  terrainTypes: Record<string, TerrainType>;
  colorPalette: ColorPalette;
  particleEmitters: Record<string, ParticleEmitterConfig>;
  ambientLighting: AmbientLighting;
  soundscape: Soundscape;
  overlayEffects: OverlayEffects;

  constructor(name: string, config: MapThemeConfig) {
    this.name = name;
    this.terrainTypes = config.terrainTypes;
    this.colorPalette = config.colorPalette;
    this.particleEmitters = config.particleEmitters || {};
    this.ambientLighting = config.ambientLighting || {};
    this.soundscape = config.soundscape || {};
    this.overlayEffects = config.overlayEffects || {};
  }
}

export interface TerrainType {
  id: number;
  color: string;
  walkable: boolean;
  resourceValue: number;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  background: string;
}

export interface ParticleEmitterConfig {
  speed?: { min: number; max: number } | { x?: { min: number; max: number }; y?: { min: number; max: number } };
  scale?: { start: number; end: number };
  alpha?: { start: number; end: number };
  lifespan?: number;
  angle?: { min: number; max: number };
  rotate?: { start: number; end: number };
  tint?: number;
  gravityY?: number;
  emitZone?: { type: string; source: Phaser.Geom.Circle | Phaser.Geom.Rectangle };
}

export interface AmbientLighting {
  enabled: boolean;
  baseColor: string;
  intensity: number;
  flickerIntensity: number;
  flickerSpeed: number;
}

export interface Soundscape {
  ambient: string;
  wind: string;
  volume: number;
}

export interface OverlayEffects {
  heat_shimmer?: boolean;
  frost_shimmer?: boolean;
  dappled_light?: boolean;
  glow_effect?: boolean;
  color_shift?: { min: number; max: number };
}

export interface MapThemeConfig {
  terrainTypes: Record<string, TerrainType>;
  colorPalette: ColorPalette;
  particleEmitters?: Record<string, ParticleEmitterConfig>;
  ambientLighting?: AmbientLighting;
  soundscape?: Soundscape;
  overlayEffects?: OverlayEffects;
}

export const MAP_THEMES: Record<string, MapTheme> = {
  FIRE: new MapTheme('Fire', {
    terrainTypes: {
      lava: { id: 0, color: '#FF4500', walkable: false, resourceValue: 0 },
      scorched: { id: 1, color: '#8B4513', walkable: true, resourceValue: 5 },
      volcanic: { id: 2, color: '#654321', walkable: true, resourceValue: 15 },
      ash: { id: 3, color: '#A9A9A9', walkable: true, resourceValue: 2 },
      magma_vein: { id: 4, color: '#FF6347', walkable: false, resourceValue: 50 }
    },
    colorPalette: {
      primary: '#FF4500',
      secondary: '#FFD700',
      tertiary: '#DC143C',
      accent: '#FF1493',
      background: '#1a0f08'
    },
    particleEmitters: {
      lava_bubble: {
        speed: { min: -200, max: 200 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 1000,
        emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 5) }
      },
      ember: {
        speed: { min: 50, max: 150 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        angle: { min: 0, max: 360 }
      }
    },
    ambientLighting: {
      enabled: true,
      baseColor: '#FF6347',
      intensity: 0.7,
      flickerIntensity: 0.3,
      flickerSpeed: 2000
    },
    soundscape: {
      ambient: 'fire_crackling',
      wind: 'low_rumble',
      volume: 0.6
    },
    overlayEffects: {
      heat_shimmer: true,
      glow_effect: true,
      color_shift: { min: -10, max: 10 }
    }
  }),

  ICE: new MapTheme('Ice', {
    terrainTypes: {
      ice: { id: 0, color: '#E0FFFF', walkable: true, resourceValue: 3 },
      frozen_tundra: { id: 1, color: '#B0E0E6', walkable: true, resourceValue: 8 },
      glacial: { id: 2, color: '#87CEEB', walkable: true, resourceValue: 12 },
      permafrost: { id: 3, color: '#6495ED', walkable: true, resourceValue: 20 },
      crevasse: { id: 4, color: '#000080', walkable: false, resourceValue: 0 }
    },
    colorPalette: {
      primary: '#87CEEB',
      secondary: '#B0E0E6',
      tertiary: '#E0FFFF',
      accent: '#00CED1',
      background: '#001a33'
    },
    particleEmitters: {
      snow: {
        speed: { x: { min: -50, max: 50 }, y: { min: 100, max: 200 } },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.9, end: 0.3 },
        lifespan: 3000,
        gravityY: 0
      },
      ice_sparkle: {
        speed: { min: 50, max: 100 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1500,
        tint: 0x00FFFF
      }
    },
    ambientLighting: {
      enabled: true,
      baseColor: '#87CEEB',
      intensity: 0.6,
      flickerIntensity: 0.1,
      flickerSpeed: 3000
    },
    soundscape: {
      ambient: 'wind_howl',
      wind: 'distant_ice_crack',
      volume: 0.5
    },
    overlayEffects: {
      frost_shimmer: true,
      glow_effect: true,
      color_shift: { min: -5, max: 5 }
    }
  }),

  FOREST: new MapTheme('Forest', {
    terrainTypes: {
      grass: { id: 0, color: '#228B22', walkable: true, resourceValue: 5 },
      dense_forest: { id: 1, color: '#1a5c1a', walkable: true, resourceValue: 20 },
      woodland: { id: 2, color: '#355E3B', walkable: true, resourceValue: 15 },
      swamp: { id: 3, color: '#556B2F', walkable: true, resourceValue: 10 },
      tree_grove: { id: 4, color: '#0B5E3C', walkable: false, resourceValue: 40 }
    },
    colorPalette: {
      primary: '#228B22',
      secondary: '#32CD32',
      tertiary: '#90EE90',
      accent: '#7CFC00',
      background: '#0a1a0a'
    },
    particleEmitters: {
      leaves: {
        speed: { x: { min: -30, max: 30 }, y: { min: 20, max: 100 } },
        scale: { start: 0.8, end: 0.2 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 2000,
        angle: { min: 0, max: 360 },
        rotate: { start: 0, end: 360 }
      },
      pollen: {
        speed: { min: 10, max: 40 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 2500,
        tint: 0xFFDD00
      }
    },
    ambientLighting: {
      enabled: true,
      baseColor: '#32CD32',
      intensity: 0.5,
      flickerIntensity: 0.15,
      flickerSpeed: 2500
    },
    soundscape: {
      ambient: 'forest_birds',
      wind: 'rustling_leaves',
      volume: 0.6
    },
    overlayEffects: {
      dappled_light: true,
      glow_effect: true,
      color_shift: { min: -8, max: 8 }
    }
  }),

  DESERT: new MapTheme('Desert', {
    terrainTypes: {
      sand: { id: 0, color: '#EDC9AF', walkable: true, resourceValue: 2 },
      dune: { id: 1, color: '#DEB887', walkable: true, resourceValue: 5 },
      rocky: { id: 2, color: '#CD853F', walkable: true, resourceValue: 18 },
      oasis: { id: 3, color: '#7CB9E8', walkable: true, resourceValue: 35 },
      canyonfloor: { id: 4, color: '#8B4513', walkable: true, resourceValue: 12 }
    },
    colorPalette: {
      primary: '#DEB887',
      secondary: '#F0E68C',
      tertiary: '#FFD700',
      accent: '#FF8C00',
      background: '#2a2115'
    },
    particleEmitters: {
      sand_storm: {
        speed: { x: { min: 100, max: 300 }, y: { min: -50, max: 50 } },
        scale: { start: 0.9, end: 0.3 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 1500,
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, 50, 30) }
      },
      dust: {
        speed: { min: 50, max: 150 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 2000,
        angle: { min: 0, max: 360 }
      }
    },
    ambientLighting: {
      enabled: true,
      baseColor: '#FFB347',
      intensity: 0.8,
      flickerIntensity: 0.2,
      flickerSpeed: 1500
    },
    soundscape: {
      ambient: 'desert_wind',
      wind: 'sand_whistle',
      volume: 0.65
    },
    overlayEffects: {
      heat_shimmer: true,
      glow_effect: true,
      color_shift: { min: -15, max: 15 }
    }
  }),

  VOLCANIC: new MapTheme('Volcanic', {
    terrainTypes: {
      basalt: { id: 0, color: '#2F4F4F', walkable: true, resourceValue: 10 },
      dark_stone: { id: 1, color: '#1C1C1C', walkable: true, resourceValue: 15 },
      cooled_lava: { id: 2, color: '#36454F', walkable: true, resourceValue: 20 },
      obsidian: { id: 3, color: '#0B0B0B', walkable: true, resourceValue: 45 },
      lava_flow: { id: 4, color: '#FF4500', walkable: false, resourceValue: 0 }
    },
    colorPalette: {
      primary: '#FF4500',
      secondary: '#8B4513',
      tertiary: '#DC143C',
      accent: '#FFD700',
      background: '#0a0805'
    },
    particleEmitters: {
      volcanic_gas: {
        speed: { min: 50, max: 150 },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 2000,
        angle: { min: 0, max: 360 },
        tint: 0x8B0000
      },
      spark: {
        speed: { min: 150, max: 300 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        angle: { min: 0, max: 360 }
      }
    },
    ambientLighting: {
      enabled: true,
      baseColor: '#DC143C',
      intensity: 0.75,
      flickerIntensity: 0.4,
      flickerSpeed: 1800
    },
    soundscape: {
      ambient: 'volcanic_rumble',
      wind: 'lava_sizzle',
      volume: 0.7
    },
    overlayEffects: {
      heat_shimmer: true,
      glow_effect: true,
      color_shift: { min: -12, max: 12 }
    }
  })
};

