/**
 * Quaternion Design System
 * Fourfold Thematic Visual Palette for Matter, Energy, Life, and Knowledge
 * Based on the artistic design specifications
 */

export type QuaternionAxis = 'matter' | 'energy' | 'life' | 'knowledge';

export interface AxisDesign {
  // Color Palette
  primary: string;        // Main color (hex)
  secondary: string;       // Accent color (hex)
  tertiary: string;       // Highlight color (hex)
  glow: string;           // Glow effect color (hex)
  particle: string;       // Particle effect color (hex)
  
  // Visual Motifs
  shape: 'angular' | 'dynamic' | 'organic' | 'fractal';
  texture: string;        // Texture description
  pattern: string;        // Pattern description
  
  // Effects
  particleConfig: {
    speed: { min: number; max: number };
    scale: { start: number; end: number };
    lifespan: number;
    quantity: number;
  };
  
  // UI Elements
  icon: string;          // Icon identifier
  borderStyle: string;   // CSS border style
  gradient: string[];    // Gradient colors
}

/**
 * Fourfold Thematic Visual Palette
 */
export const AXIS_DESIGNS: Record<QuaternionAxis, AxisDesign> = {
  matter: {
    primary: '#4a90e2',      // Industrial steel blue
    secondary: '#2c5aa0',     // Darker blue
    tertiary: '#6ba3f0',     // Lighter blue
    glow: '#5aa0ff',         // Glow blue
    particle: '#7bb3ff',     // Particle blue
    shape: 'angular',
    texture: 'mechanical',
    pattern: 'geometric',
    particleConfig: {
      speed: { min: 30, max: 80 },
      scale: { start: 0.4, end: 0 },
      lifespan: 800,
      quantity: 8
    },
    icon: 'Box',
    borderStyle: 'solid',
    gradient: ['#2c5aa0', '#4a90e2', '#6ba3f0']
  },
  
  energy: {
    primary: '#ff6b35',      // Fiery red-orange
    secondary: '#ff4500',     // Deep red
    tertiary: '#ff8c42',     // Bright orange
    glow: '#ff6b35',         // Electric orange glow
    particle: '#ffaa5a',     // Particle orange
    shape: 'dynamic',
    texture: 'electric',
    pattern: 'particle',
    particleConfig: {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 600,
      quantity: 12
    },
    icon: 'Zap',
    borderStyle: 'dashed',
    gradient: ['#ff4500', '#ff6b35', '#ff8c42']
  },
  
  life: {
    primary: '#50c878',      // Earthy green
    secondary: '#2d8659',     // Dark green
    tertiary: '#6dd89a',      // Light green
    glow: '#50c878',         // Organic green glow
    particle: '#7de8a8',     // Particle green
    shape: 'organic',
    texture: 'organic',
    pattern: 'flowing',
    particleConfig: {
      speed: { min: 20, max: 60 },
      scale: { start: 0.3, end: 0 },
      lifespan: 1000,
      quantity: 6
    },
    icon: 'Leaf',
    borderStyle: 'dotted',
    gradient: ['#2d8659', '#50c878', '#6dd89a']
  },
  
  knowledge: {
    primary: '#9d4edd',       // Futuristic neon purple
    secondary: '#6a1b9a',     // Deep purple
    tertiary: '#b77de8',     // Light purple
    glow: '#9d4edd',         // Neon purple glow
    particle: '#c89df0',     // Particle purple
    shape: 'fractal',
    texture: 'circuitry',
    pattern: 'fractal',
    particleConfig: {
      speed: { min: 40, max: 100 },
      scale: { start: 0.35, end: 0 },
      lifespan: 700,
      quantity: 10
    },
    icon: 'Brain',
    borderStyle: 'double',
    gradient: ['#6a1b9a', '#9d4edd', '#b77de8']
  }
};

/**
 * Get design for a resource type
 */
export function getAxisDesign(resourceType: 'ore' | 'energy' | 'biomass' | 'data'): AxisDesign {
  const mapping: Record<string, QuaternionAxis> = {
    ore: 'matter',
    energy: 'energy',
    biomass: 'life',
    data: 'knowledge'
  };
  return AXIS_DESIGNS[mapping[resourceType] || 'matter'];
}

/**
 * Convert hex to Phaser color number
 */
export function hexToPhaserColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Get Phaser color for axis
 */
export function getAxisPhaserColor(axis: QuaternionAxis): number {
  return hexToPhaserColor(AXIS_DESIGNS[axis].primary);
}

/**
 * AI Thought Visual Configurations
 */
export interface AIThoughtVisual {
  type: 'dataStream' | 'glowingNode' | 'circuitry' | 'particleField';
  color: number;
  speed: number;
  intensity: number;
}

export const AI_THOUGHT_VISUALS: Record<string, AIThoughtVisual> = {
  dataStream: {
    type: 'dataStream',
    color: 0x9d4edd,
    speed: 2,
    intensity: 0.6
  },
  glowingNode: {
    type: 'glowingNode',
    color: 0x00ffea,
    speed: 1,
    intensity: 0.8
  },
  circuitry: {
    type: 'circuitry',
    color: 0x4a90e2,
    speed: 1.5,
    intensity: 0.5
  },
  particleField: {
    type: 'particleField',
    color: 0xff6b35,
    speed: 3,
    intensity: 0.4
  }
};

/**
 * Biome Visual Themes
 */
export interface BiomeTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  effects: string[];
  particleType: 'dust' | 'mist' | 'glow' | 'sparkle';
}

export const BIOME_THEMES: Record<string, BiomeTheme> = {
  CrimsonDesert: {
    name: 'Crimson Desert',
    colors: {
      primary: '#8B4513',
      secondary: '#A0522D',
      accent: '#FF6347'
    },
    effects: ['dust', 'heat_shimmer'],
    particleType: 'dust'
  },
  VerdantForest: {
    name: 'Verdant Forest',
    colors: {
      primary: '#228B22',
      secondary: '#32CD32',
      accent: '#90EE90'
    },
    effects: ['mist', 'growth'],
    particleType: 'mist'
  },
  NeonPlains: {
    name: 'Neon Plains',
    colors: {
      primary: '#4B0082',
      secondary: '#9370DB',
      accent: '#BA55D3'
    },
    effects: ['glow', 'circuitry'],
    particleType: 'glow'
  },
  CraterField: {
    name: 'Crater Field',
    colors: {
      primary: '#2F2F2F',
      secondary: '#4A4A4A',
      accent: '#FFD700'
    },
    effects: ['sparkle', 'geometric'],
    particleType: 'sparkle'
  },
  FogVault: {
    name: 'Fog Vault',
    colors: {
      primary: '#708090',
      secondary: '#B0C4DE',
      accent: '#E0E0E0'
    },
    effects: ['mist', 'ethereal'],
    particleType: 'mist'
  }
};

/**
 * UI Design Tokens
 */
export const UI_DESIGN_TOKENS = {
  // Minimalistic UI with AI Flair
  panel: {
    background: 'rgba(17, 24, 39, 0.85)',
    border: 'rgba(0, 255, 234, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    backdropBlur: 'blur(8px)'
  },
  
  // Pulsing indicators
  pulse: {
    duration: 2000,
    scale: { from: 1, to: 1.1 },
    alpha: { from: 0.6, to: 1 }
  },
  
  // Waveform overlays
  waveform: {
    color: 'rgba(0, 255, 234, 0.2)',
    thickness: 2,
    frequency: 0.02
  },
  
  // AI Feedback elements
  aiFeedback: {
    glowColor: '#00ffea',
    glowIntensity: 0.5,
    animationSpeed: 1.5
  }
};

