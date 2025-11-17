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
export const TECH_TREE: Record<string, TechNode> = {
  // Matter Branch
  quantum_core: {
    id: 'quantum_core',
    name: 'Quantum Core',
    branch: 'matter',
    cost: { matter: 100, knowledge: 50 },
    researchTime: 30,
    prerequisites: [],
    effects: '+20% Matter generation',
    description: 'Harness quantum mechanics to boost matter extraction'
  },
  matter_compression: {
    id: 'matter_compression',
    name: 'Matter Compression',
    branch: 'matter',
    cost: { matter: 200, knowledge: 100 },
    researchTime: 45,
    prerequisites: ['quantum_core'],
    effects: '+50% Matter storage capacity',
    description: 'Compress matter to store more resources'
  },
  
  // Energy Branch
  fusion_reactor: {
    id: 'fusion_reactor',
    name: 'Fusion Reactor',
    branch: 'energy',
    cost: { matter: 150, energy: 100, knowledge: 75 },
    researchTime: 40,
    prerequisites: [],
    effects: '+30% Energy generation',
    description: 'Unlock fusion power for massive energy output'
  },
  energy_grid: {
    id: 'energy_grid',
    name: 'Energy Grid',
    branch: 'energy',
    cost: { matter: 100, energy: 150, knowledge: 100 },
    researchTime: 50,
    prerequisites: ['fusion_reactor'],
    effects: '-25% Energy consumption',
    description: 'Optimize energy distribution across the network'
  },
  
  // Life Branch
  bioconserve: {
    id: 'bioconserve',
    name: 'BioConserve',
    branch: 'life',
    cost: { life: 200, knowledge: 100 },
    researchTime: 35,
    prerequisites: [],
    effects: '+40% Life regeneration',
    description: 'Preserve and regenerate biological resources'
  },
  genetic_enhancement: {
    id: 'genetic_enhancement',
    name: 'Genetic Enhancement',
    branch: 'life',
    cost: { life: 250, knowledge: 150 },
    researchTime: 60,
    prerequisites: ['bioconserve'],
    effects: '+50% Unit health and damage',
    description: 'Enhance units through genetic modification'
  },
  
  // Knowledge Branch
  neural_network: {
    id: 'neural_network',
    name: 'Neural Network',
    branch: 'knowledge',
    cost: { energy: 100, knowledge: 150 },
    researchTime: 45,
    prerequisites: [],
    effects: '+25% Research speed',
    description: 'AI-powered research acceleration'
  },
  quantum_computing: {
    id: 'quantum_computing',
    name: 'Quantum Computing',
    branch: 'knowledge',
    cost: { matter: 200, energy: 200, knowledge: 300 },
    researchTime: 90,
    prerequisites: ['neural_network', 'quantum_core'],
    effects: '+100% Knowledge generation',
    description: 'Unlock quantum computing capabilities'
  },
  
  // Terminal Technology
  quantum_ascendancy: {
    id: 'quantum_ascendancy',
    name: 'Quantum Ascendancy',
    branch: 'knowledge',
    cost: { matter: 500, energy: 500, life: 500, knowledge: 500 },
    researchTime: 120,
    prerequisites: ['matter_compression', 'energy_grid', 'genetic_enhancement', 'quantum_computing'],
    effects: 'Win Condition: Technological Victory',
    description: 'Achieve transcendence through perfect harmony'
  }
};

// Buildings
export const BUILDINGS: Record<string, Building> = {
  matter_extractor: {
    id: 'matter_extractor',
    name: 'Matter Extractor',
    cost: { matter: 100 },
    buildTime: 20,
    produces: { matter: 2 },
    description: 'Extracts raw matter from resource nodes',
    icon: 'Box'
  },
  refinery: {
    id: 'refinery',
    name: 'Refinery',
    cost: { matter: 150, energy: 50 },
    buildTime: 30,
    produces: { energy: 3 },
    description: 'Converts matter into energy',
    icon: 'Zap'
  },
  bio_lab: {
    id: 'bio_lab',
    name: 'Bio Lab',
    cost: { matter: 200, energy: 100 },
    buildTime: 40,
    produces: { life: 1.5 },
    description: 'Cultivates biological resources',
    icon: 'Leaf'
  },
  research_center: {
    id: 'research_center',
    name: 'Research Center',
    cost: { matter: 250, energy: 150, life: 50 },
    buildTime: 50,
    produces: { knowledge: 1 },
    description: 'Generates knowledge through research',
    icon: 'Brain'
  },
  command_center: {
    id: 'command_center',
    name: 'Command Center',
    cost: { matter: 500, energy: 300, life: 200, knowledge: 100 },
    buildTime: 90,
    produces: { matter: 1, energy: 1, life: 1, knowledge: 1 },
    description: 'Central hub that produces all resources',
    icon: 'Building'
  },
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    cost: { matter: 200, energy: 100 },
    buildTime: 35,
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
    cost: { matter: 100, energy: 50, life: 25 },
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
    cost: { matter: 200, energy: 100, life: 50 },
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
export const WIN_CONDITIONS = [
  {
    id: 'equilibrium',
    name: 'Equilibrium Victory',
    description: 'Maintain all four resources in harmony (±15%) for 60 seconds',
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
    description: 'Capture and hold the Central Node for 90 seconds',
    icon: '🏰'
  },
  {
    id: 'moral',
    name: 'Moral Victory',
    description: 'Make ethical choices over 4 key events (+80 moral alignment)',
    icon: '✨'
  }
];
