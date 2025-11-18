/**
 * Complete game data for Quaternion strategy game
 */

export interface TechNode {
  id: string;
  name: string;
  branch: 'matter' | 'energy' | 'life' | 'knowledge';
  cost: { matter?: number; energy?: number; life?: number; knowledge?: number };
  researchTime: number;
  prerequisites: string[];
  effects: string;
  description: string;
}

export interface Building {
  id: string;
  name: string;
  cost: { matter?: number; energy?: number; life?: number; knowledge?: number };
  buildTime: number;
  produces?: { matter?: number; energy?: number; life?: number; knowledge?: number };
  description: string;
  icon: string;
}

export interface Commander {
  id: string;
  name: string;
  role: string;
  color: string;
  focus: string;
  quote: string;
  personality: string;
}

export interface UnitType {
  id: string;
  name: string;
  cost: { matter?: number; energy?: number };
  health: number;
  damage: number;
  speed: number;
  range: number;
  description: string;
}

// Complete Tech Tree
// Optimized for 30-minute game sessions - reduced times and costs
export const TECH_TREE: Record<string, TechNode> = {
  // Matter Branch
  quantum_core: {
    id: 'quantum_core',
    name: 'Quantum Core',
    branch: 'matter',
    cost: { matter: 70, knowledge: 35 }, // Reduced by 30%
    researchTime: 10, // Reduced from 30 to 10 seconds
    prerequisites: [],
    effects: '+20% Matter generation',
    description: 'Harness quantum mechanics to boost matter extraction'
  },
  matter_compression: {
    id: 'matter_compression',
    name: 'Matter Compression',
    branch: 'matter',
    cost: { matter: 140, knowledge: 70 }, // Reduced by 30%
    researchTime: 15, // Reduced from 45 to 15 seconds
    prerequisites: ['quantum_core'],
    effects: '+50% Matter storage capacity',
    description: 'Compress matter to store more resources'
  },
  
  // Energy Branch
  fusion_reactor: {
    id: 'fusion_reactor',
    name: 'Fusion Reactor',
    branch: 'energy',
    cost: { matter: 105, energy: 70, knowledge: 50 }, // Reduced by 30%
    researchTime: 12, // Reduced from 40 to 12 seconds
    prerequisites: [],
    effects: '+30% Energy generation',
    description: 'Unlock fusion power for massive energy output'
  },
  energy_grid: {
    id: 'energy_grid',
    name: 'Energy Grid',
    branch: 'energy',
    cost: { matter: 70, energy: 105, knowledge: 70 }, // Reduced by 30%
    researchTime: 18, // Reduced from 50 to 18 seconds
    prerequisites: ['fusion_reactor'],
    effects: '-25% Energy consumption',
    description: 'Optimize energy distribution across the network'
  },
  
  // Life Branch
  bioconserve: {
    id: 'bioconserve',
    name: 'BioConserve',
    branch: 'life',
    cost: { life: 140, knowledge: 70 }, // Reduced by 30%
    researchTime: 12, // Reduced from 35 to 12 seconds
    prerequisites: [],
    effects: '+40% Life regeneration',
    description: 'Preserve and regenerate biological resources'
  },
  genetic_enhancement: {
    id: 'genetic_enhancement',
    name: 'Genetic Enhancement',
    branch: 'life',
    cost: { life: 175, knowledge: 105 }, // Reduced by 30%
    researchTime: 20, // Reduced from 60 to 20 seconds
    prerequisites: ['bioconserve'],
    effects: '+50% Unit health and damage',
    description: 'Enhance units through genetic modification'
  },
  
  // Knowledge Branch
  neural_network: {
    id: 'neural_network',
    name: 'Neural Network',
    branch: 'knowledge',
    cost: { energy: 70, knowledge: 105 }, // Reduced by 30%
    researchTime: 15, // Reduced from 45 to 15 seconds
    prerequisites: [],
    effects: '+25% Research speed',
    description: 'AI-powered research acceleration'
  },
  quantum_computing: {
    id: 'quantum_computing',
    name: 'Quantum Computing',
    branch: 'knowledge',
    cost: { matter: 140, energy: 140, knowledge: 210 }, // Reduced by 30%
    researchTime: 30, // Reduced from 90 to 30 seconds
    prerequisites: ['neural_network', 'quantum_core'],
    effects: '+100% Knowledge generation',
    description: 'Unlock quantum computing capabilities'
  },
  
  // Terminal Technology
  quantum_ascendancy: {
    id: 'quantum_ascendancy',
    name: 'Quantum Ascendancy',
    branch: 'knowledge',
    cost: { matter: 350, energy: 350, life: 350, knowledge: 350 }, // Reduced by 30%
    researchTime: 40, // Reduced from 120 to 40 seconds
    prerequisites: ['matter_compression', 'energy_grid', 'genetic_enhancement', 'quantum_computing'],
    effects: 'Win Condition: Technological Victory',
    description: 'Achieve transcendence through perfect harmony'
  }
};

// Buildings
// Optimized for 30-minute game sessions - reduced times, costs, and increased production
export const BUILDINGS: Record<string, Building> = {
  matter_extractor: {
    id: 'matter_extractor',
    name: 'Matter Extractor',
    cost: { matter: 70 }, // Reduced by 30%
    buildTime: 8, // Reduced from 20 to 8 seconds
    produces: { matter: 3 }, // Increased from 2 to 3
    description: 'Extracts raw matter from resource nodes',
    icon: 'Box'
  },
  refinery: {
    id: 'refinery',
    name: 'Refinery',
    cost: { matter: 105, energy: 35 }, // Reduced by 30%
    buildTime: 12, // Reduced from 30 to 12 seconds
    produces: { energy: 4 }, // Increased from 3 to 4
    description: 'Converts matter into energy',
    icon: 'Zap'
  },
  bio_lab: {
    id: 'bio_lab',
    name: 'Bio Lab',
    cost: { matter: 140, energy: 70 }, // Reduced by 30%
    buildTime: 16, // Reduced from 40 to 16 seconds
    produces: { life: 2.5 }, // Increased from 1.5 to 2.5
    description: 'Cultivates biological resources',
    icon: 'Leaf'
  },
  research_center: {
    id: 'research_center',
    name: 'Research Center',
    cost: { matter: 175, energy: 105, life: 35 }, // Reduced by 30%
    buildTime: 20, // Reduced from 50 to 20 seconds
    produces: { knowledge: 1.5 }, // Increased from 1 to 1.5
    description: 'Generates knowledge through research',
    icon: 'Brain'
  },
  command_center: {
    id: 'command_center',
    name: 'Command Center',
    cost: { matter: 350, energy: 210, life: 140, knowledge: 70 }, // Reduced by 30%
    buildTime: 35, // Reduced from 90 to 35 seconds
    produces: { matter: 1.5, energy: 1.5, life: 1.5, knowledge: 1.5 }, // Increased from 1 to 1.5
    description: 'Central hub that produces all resources',
    icon: 'Building'
  },
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    cost: { matter: 140, energy: 70 }, // Reduced by 30%
    buildTime: 14, // Reduced from 35 to 14 seconds
    description: 'Trains combat units',
    icon: 'Swords'
  }
};

// Commanders (AI Advisors)
export const COMMANDERS: Record<string, Commander> = {
  CORE: {
    id: 'CORE',
    name: 'Core',
    role: 'Logic Advisor',
    color: '#00ffea',
    focus: 'Efficiency & Strategy',
    quote: 'Optimize your resource flow. Efficiency is survival.',
    personality: 'Analytical, precise, focused on optimization'
  },
  AUREN: {
    id: 'AUREN',
    name: 'Auren',
    role: 'Empathy Advisor',
    color: '#ff6b9d',
    focus: 'Ethics & Morality',
    quote: 'Every choice has consequences. Choose wisely.',
    personality: 'Compassionate, ethical, values preservation'
  },
  LIRA: {
    id: 'LIRA',
    name: 'Lira',
    role: 'Agility Advisor',
    color: '#ffd700',
    focus: 'Tactics & Combat',
    quote: 'Strike fast, strike hard. Hesitation is defeat.',
    personality: 'Aggressive, tactical, combat-focused'
  },
  VIREL: {
    id: 'VIREL',
    name: 'Virel',
    role: 'Knowledge Advisor',
    color: '#9d4edd',
    focus: 'Research & Technology',
    quote: 'Knowledge is power. Unlock the secrets of the universe.',
    personality: 'Curious, intellectual, research-oriented'
  },
  KOR: {
    id: 'KOR',
    name: 'Kor',
    role: 'Chaos Advisor',
    color: '#ff4500',
    focus: 'Unpredictability',
    quote: 'Embrace chaos. Order is an illusion.',
    personality: 'Unpredictable, chaotic, challenges conventions'
  }
};

// Unit Types
export const UNIT_TYPES: Record<string, UnitType> = {
  worker: {
    id: 'worker',
    name: 'Worker',
    cost: { matter: 50, energy: 25 },
    health: 100,
    damage: 5,
    speed: 3,
    range: 1,
    description: 'Basic unit for gathering and building'
  },
  soldier: {
    id: 'soldier',
    name: 'Soldier',
    cost: { matter: 100, energy: 50 },
    health: 200,
    damage: 25,
    speed: 4,
    range: 5,
    description: 'Combat unit for attacking enemies'
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    cost: { matter: 75, energy: 75 },
    health: 80,
    damage: 10,
    speed: 8,
    range: 8,
    description: 'Fast reconnaissance unit'
  },
  heavy: {
    id: 'heavy',
    name: 'Heavy Unit',
    cost: { matter: 200, energy: 100 },
    health: 500,
    damage: 50,
    speed: 2,
    range: 6,
    description: 'Heavily armored combat unit'
  }
};

// AI Suggestions (Commander messages)
export const AI_SUGGESTIONS = {
  resource_low: [
    { commander: 'CORE', message: 'Warning: {resource} levels critically low. Adjust production immediately.' },
    { commander: 'VIREL', message: 'Resource imbalance detected. Consider researching efficiency upgrades.' }
  ],
  resource_high: [
    { commander: 'CORE', message: 'Excellent resource management. {resource} levels optimal.' },
    { commander: 'AUREN', message: 'Your balanced approach is commendable.' }
  ],
  enemy_spotted: [
    { commander: 'LIRA', message: 'Enemy forces detected at {location}. Prepare defenses!' },
    { commander: 'KOR', message: 'Chaos incoming! Enemy at the gates!' }
  ],
  tech_unlocked: [
    { commander: 'VIREL', message: 'Research complete: {tech}. New possibilities await.' },
    { commander: 'CORE', message: 'Technology {tech} integrated. Efficiency increased.' }
  ],
  moral_choice: [
    { commander: 'AUREN', message: 'This decision will define who you are. Choose carefully.' },
    { commander: 'KOR', message: 'Rules are meant to be broken. Do what you must.' }
  ]
};

// Map Types
export const MAP_TYPES = [
  { id: 'crystalline_plains', name: 'Crystalline Plains', description: 'Open terrain with scattered resources' },
  { id: 'jagged_island', name: 'Jagged Island', description: 'Island map with limited expansion' },
  { id: 'quantum_nexus', name: 'Quantum Nexus', description: 'Central resource hub with high risk' },
  { id: 'void_expanse', name: 'Void Expanse', description: 'Sparse resources, high difficulty' }
];

// Win Conditions
// Optimized for 30-minute game sessions - reduced time requirements
export const WIN_CONDITIONS = [
  {
    id: 'equilibrium',
    name: 'Equilibrium Victory',
    description: 'Maintain all four resources in harmony (±15%) for 15 seconds (Quick Match: 10s)',
    icon: '⚖️'
  },
  {
    id: 'technological',
    name: 'Technological Victory',
    description: 'Unlock the Terminal Technology: Quantum Ascendancy',
    icon: '🔬'
  },
  {
    id: 'territorial',
    name: 'Territorial Victory',
    description: 'Capture and hold the Central Node for 20 seconds (Quick Match: 15s)',
    icon: '🏰'
  },
  {
    id: 'moral',
    name: 'Moral Victory',
    description: 'Make ethical choices over 3 key events (+60 moral alignment)',
    icon: '✨'
  }
];

// Neural Frontier (Simple Game) Victory Conditions
export const NEURAL_FRONTIER_WIN_CONDITIONS = [
  {
    id: 'domination',
    name: 'Domination Victory',
    description: 'Eliminate all enemy units and control the battlefield',
    icon: '⚔️'
  },
  {
    id: 'resource',
    name: 'Resource Victory',
    description: 'Accumulate 2000 total resources (Ore + Energy + Biomass + Data)',
    icon: '💰'
  }
];
