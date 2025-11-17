// Game Constants and Data

export interface TechNode {
  id: string;
  name: string;
  branch: 'matter' | 'energy' | 'life' | 'knowledge';
  cost: { ore?: number; energy?: number; biomass?: number; data?: number };
  researchTime: number;
  prerequisites: string[];
  effects: string;
}

export interface Building {
  id: string;
  name: string;
  cost: { ore?: number; energy?: number; biomass?: number; data?: number };
  buildTime: number;
  produces?: { ore?: number; energy?: number; biomass?: number; data?: number };
  description: string;
}

export interface Commander {
  id: string;
  name: string;
  role: string;
  color: string;
  focus: string;
  quote: string;
}

export interface UnitType {
  id: string;
  name: string;
  cost: { ore?: number; energy?: number };
  health: number;
  damage: number;
  speed: number;
  range: number;
}

export const TECH_TREE: Record<string, TechNode> = {
  quantum_core: {
    id: 'quantum_core',
    name: 'Quantum Core',
    branch: 'matter',
    cost: { ore: 100, data: 50 },
    researchTime: 30,
    prerequisites: [],
    effects: '+20% Ore generation'
  },
  advanced_refinery: {
    id: 'advanced_refinery',
    name: 'Advanced Refinery',
    branch: 'matter',
    cost: { ore: 200, energy: 100, data: 75 },
    researchTime: 45,
    prerequisites: ['quantum_core'],
    effects: '+40% Ore generation, unlocks advanced buildings'
  },
  energy_harnessing: {
    id: 'energy_harnessing',
    name: 'Energy Harnessing',
    branch: 'energy',
    cost: { energy: 150, data: 50 },
    researchTime: 30,
    prerequisites: [],
    effects: '+25% Energy generation'
  },
  reactor_overclock: {
    id: 'reactor_overclock',
    name: 'Reactor Overclock',
    branch: 'energy',
    cost: { ore: 150, energy: 200, data: 100 },
    researchTime: 50,
    prerequisites: ['energy_harnessing'],
    effects: '+50% Energy, +10% unit speed'
  },
  bio_engineering: {
    id: 'bio_engineering',
    name: 'Bio Engineering',
    branch: 'life',
    cost: { biomass: 100, data: 50 },
    researchTime: 35,
    prerequisites: [],
    effects: '+30% Unit health'
  },
  neural_interface: {
    id: 'neural_interface',
    name: 'Neural Interface',
    branch: 'life',
    cost: { biomass: 150, energy: 100, data: 100 },
    researchTime: 55,
    prerequisites: ['bio_engineering'],
    effects: '+20% Combat effectiveness'
  },
  data_analysis: {
    id: 'data_analysis',
    name: 'Data Analysis',
    branch: 'knowledge',
    cost: { data: 100 },
    researchTime: 25,
    prerequisites: [],
    effects: '+30% Research speed'
  },
  quantum_computing: {
    id: 'quantum_computing',
    name: 'Quantum Computing',
    branch: 'knowledge',
    cost: { ore: 200, energy: 200, data: 200 },
    researchTime: 60,
    prerequisites: ['data_analysis'],
    effects: '+15% to all production'
  }
};

export const BUILDINGS: Record<string, Building> = {
  ore_extractor: {
    id: 'ore_extractor',
    name: 'Ore Extractor',
    cost: { ore: 50 },
    buildTime: 20,
    produces: { ore: 5 },
    description: 'Extracts ore from the ground'
  },
  energy_reactor: {
    id: 'energy_reactor',
    name: 'Energy Reactor',
    cost: { ore: 100, energy: 50 },
    buildTime: 25,
    produces: { energy: 3 },
    description: 'Generates energy for your base'
  },
  bio_lab: {
    id: 'bio_lab',
    name: 'Bio Lab',
    cost: { ore: 80, energy: 60 },
    buildTime: 30,
    produces: { biomass: 2 },
    description: 'Cultivates biomass resources'
  },
  data_center: {
    id: 'data_center',
    name: 'Data Center',
    cost: { ore: 120, energy: 100 },
    buildTime: 35,
    produces: { data: 1 },
    description: 'Processes and generates data'
  },
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    cost: { ore: 150, energy: 75 },
    buildTime: 40,
    description: 'Trains infantry units'
  },
  factory: {
    id: 'factory',
    name: 'Factory',
    cost: { ore: 200, energy: 150 },
    buildTime: 50,
    description: 'Produces advanced units'
  }
};

export const COMMANDERS: Commander[] = [
  {
    id: 'auren',
    name: 'AUREN',
    role: 'Architect of Matter',
    color: '#00ffea',
    focus: 'Resource optimization, construction efficiency',
    quote: 'Matter is will. Build, and the world obeys.'
  },
  {
    id: 'virel',
    name: 'VIREL',
    role: 'Keeper of Energy',
    color: '#ff00aa',
    focus: 'Power management, aggressive expansion',
    quote: 'Energy is breath. Burn too bright, and you vanish.'
  },
  {
    id: 'lira',
    name: 'LIRA',
    role: 'Voice of Life',
    color: '#00ff00',
    focus: 'Ecological balance, defensive strategies',
    quote: 'Life is memory. Take, and the roots remember.'
  },
  {
    id: 'kor',
    name: 'KOR',
    role: 'Seer of Knowledge',
    color: '#ffaa00',
    focus: 'Research advancement, technological superiority',
    quote: 'Knowledge is recursion. You are both input and error.'
  }
];

export const UNIT_TYPES: Record<string, UnitType> = {
  worker: {
    id: 'worker',
    name: 'Worker',
    cost: { ore: 50 },
    health: 50,
    damage: 5,
    speed: 100,
    range: 30
  },
  infantry: {
    id: 'infantry',
    name: 'Infantry',
    cost: { ore: 75, energy: 25 },
    health: 100,
    damage: 15,
    speed: 120,
    range: 50
  },
  artillery: {
    id: 'artillery',
    name: 'Artillery',
    cost: { ore: 150, energy: 75 },
    health: 80,
    damage: 40,
    speed: 80,
    range: 150
  }
};

export const AI_SUGGESTIONS = [
  { commander: 'AUREN', message: 'Consider building more ore extractors to boost production.' },
  { commander: 'AUREN', message: 'Your base could benefit from additional energy reactors.' },
  { commander: 'VIREL', message: 'Energy reserves are low. Prioritize power generation.' },
  { commander: 'VIREL', message: 'The enemy is vulnerable. Consider an offensive push.' },
  { commander: 'LIRA', message: 'Strengthen your defenses before expanding further.' },
  { commander: 'LIRA', message: 'Bio labs would provide sustainable resource growth.' },
  { commander: 'KOR', message: 'Research Quantum Core to unlock advanced technologies.' },
  { commander: 'KOR', message: 'Data production is crucial for technological advancement.' }
];
