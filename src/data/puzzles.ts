/**
 * Puzzle definitions for Quaternion Puzzle Siege mode
 * Each puzzle presents a unique challenge focused on resource management and equilibrium
 */

export interface PuzzleConstraint {
  type: 'resource_limit' | 'resource_min' | 'resource_max' | 'equilibrium_duration' | 'time_limit' | 'no_building' | 'no_research' | 'unit_limit' | 'tech_required';
  value: number;
  resource?: 'ore' | 'energy' | 'biomass' | 'data';
  techId?: string;
}

export interface Puzzle {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'equilibrium' | 'resource_race' | 'defense' | 'efficiency' | 'timing';
  startingResources: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
  constraints: PuzzleConstraint[];
  winCondition: {
    type: 'equilibrium' | 'technological' | 'territorial' | 'resource_target' | 'survival';
    description: string;
    target?: number;
    duration?: number;
  };
  hints: string[];
  seed: number; // Specific seed for puzzle map
  unlockedBy?: string; // Puzzle ID that unlocks this one
}

export const PUZZLES: Record<string, Puzzle> = {
  puzzle_1: {
    id: 'puzzle_1',
    name: 'First Balance',
    description: 'Achieve perfect equilibrium between all four resources. Keep them balanced within 10% of each other.',
    difficulty: 'easy',
    category: 'equilibrium',
    startingResources: {
      ore: 100,
      energy: 100,
      biomass: 50,
      data: 50
    },
    constraints: [
      { type: 'time_limit', value: 300 } // 5 minutes
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain all resources within 10% balance for 15 seconds',
      duration: 15
    },
    hints: [
      'Focus on gathering resources evenly',
      'Build extractors for each resource type',
      'Monitor resource levels constantly',
      'Don\'t overspend on one resource'
    ],
    seed: 999001
  },
  
  puzzle_2: {
    id: 'puzzle_2',
    name: 'Energy Crisis',
    description: 'You start with massive ore reserves but almost no energy. Balance production before your base shuts down.',
    difficulty: 'easy',
    category: 'resource_race',
    startingResources: {
      ore: 500,
      energy: 10,
      biomass: 50,
      data: 50
    },
    constraints: [
      { type: 'resource_min', resource: 'energy', value: 5 }, // Energy must stay above 5
      { type: 'time_limit', value: 240 }
    ],
    winCondition: {
      type: 'resource_target',
      description: 'Reach 200 energy while maintaining at least 5 energy',
      target: 200
    },
    hints: [
      'Build refineries to convert ore to energy',
      'Watch your energy carefully - don\'t let it drop',
      'Prioritize energy production',
      'Use workers to gather ore quickly'
    ],
    seed: 999002
  },

  puzzle_3: {
    id: 'puzzle_3',
    name: 'The Four Pillars',
    description: 'Build exactly four buildings - one of each type. No more, no less. Achieve equilibrium with this limitation.',
    difficulty: 'medium',
    category: 'efficiency',
    startingResources: {
      ore: 200,
      energy: 150,
      biomass: 100,
      data: 100
    },
    constraints: [
      { type: 'no_research', value: 1 }, // No research allowed
      { type: 'time_limit', value: 360 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain equilibrium for 20 seconds with exactly 4 buildings',
      duration: 20
    },
    hints: [
      'Choose your 4 buildings carefully',
      'Balance production across all resource types',
      'You can\'t build more than 4 buildings',
      'Strategic placement matters'
    ],
    seed: 999003,
    unlockedBy: 'puzzle_1'
  },

  puzzle_4: {
    id: 'puzzle_4',
    name: 'Knowledge Rush',
    description: 'Research Quantum Ascendancy as quickly as possible with limited starting knowledge resources.',
    difficulty: 'medium',
    category: 'resource_race',
    startingResources: {
      ore: 150,
      energy: 150,
      biomass: 150,
      data: 20 // Very low knowledge
    },
    constraints: [
      { type: 'time_limit', value: 600 }, // 10 minutes
      { type: 'tech_required', techId: 'quantum_ascendancy', value: 1 }
    ],
    winCondition: {
      type: 'technological',
      description: 'Research Quantum Ascendancy technology',
    },
    hints: [
      'Prioritize data/knowledge gathering',
      'Build research centers early',
      'Research techs that boost knowledge generation',
      'Neural Network tech helps with research speed'
    ],
    seed: 999004,
    unlockedBy: 'puzzle_2'
  },

  puzzle_5: {
    id: 'puzzle_5',
    name: 'Minimal Defense',
    description: 'Survive waves of enemies with only 3 soldiers. Manage resources carefully to keep them alive.',
    difficulty: 'hard',
    category: 'defense',
    startingResources: {
      ore: 100,
      energy: 100,
      biomass: 100,
      data: 50
    },
    constraints: [
      { type: 'unit_limit', value: 3 }, // Maximum 3 soldiers
      { type: 'time_limit', value: 420 }
    ],
    winCondition: {
      type: 'survival',
      description: 'Survive for 7 minutes with at least one soldier alive',
      duration: 420
    },
    hints: [
      'Keep your soldiers alive at all costs',
      'Use healing/gathering to sustain resources',
      'Micro-manage unit positioning',
      'You can\'t build more units - only 3 allowed'
    ],
    seed: 999005,
    unlockedBy: 'puzzle_3'
  },

  puzzle_6: {
    id: 'puzzle_6',
    name: 'Perfect Symmetry',
    description: 'Maintain exactly equal amounts of all four resources for 30 seconds straight. Precision required.',
    difficulty: 'hard',
    category: 'equilibrium',
    startingResources: {
      ore: 200,
      energy: 200,
      biomass: 200,
      data: 200
    },
    constraints: [
      { type: 'resource_limit', resource: 'ore', value: 300 }, // Can't exceed 300 of any resource
      { type: 'resource_limit', resource: 'energy', value: 300 },
      { type: 'resource_limit', resource: 'biomass', value: 300 },
      { type: 'resource_limit', resource: 'data', value: 300 },
      { type: 'time_limit', value: 480 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Keep all resources exactly equal (±2%) for 30 seconds',
      duration: 30
    },
    hints: [
      'Balance is key - one resource going high breaks the challenge',
      'Stop gathering before you exceed limits',
      'Use buildings to fine-tune production',
      'Monitor all four resources constantly'
    ],
    seed: 999006,
    unlockedBy: 'puzzle_4'
  },

  puzzle_7: {
    id: 'puzzle_7',
    name: 'No Building Challenge',
    description: 'Achieve equilibrium victory without building a single structure. Workers and research only!',
    difficulty: 'hard',
    category: 'efficiency',
    startingResources: {
      ore: 150,
      energy: 150,
      biomass: 150,
      data: 150
    },
    constraints: [
      { type: 'no_building', value: 1 }, // No buildings allowed
      { type: 'time_limit', value: 540 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Achieve equilibrium for 20 seconds without building anything',
      duration: 20
    },
    hints: [
      'Use only workers to gather resources',
      'You can still research technologies',
      'Manage worker distribution carefully',
      'Research techs that boost gathering efficiency'
    ],
    seed: 999007,
    unlockedBy: 'puzzle_5'
  },

  puzzle_8: {
    id: 'puzzle_8',
    name: 'The Marathon',
    description: 'Maintain equilibrium for a full 2 minutes. This endurance test requires perfect resource management.',
    difficulty: 'hard',
    category: 'equilibrium',
    startingResources: {
      ore: 250,
      energy: 250,
      biomass: 250,
      data: 250
    },
    constraints: [
      { type: 'time_limit', value: 600 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain perfect equilibrium (±5%) for 120 seconds straight',
      duration: 120
    },
    hints: [
      'Set up sustainable resource production',
      'Build balanced infrastructure',
      'React quickly to imbalances',
      'This is a marathon, not a sprint'
    ],
    seed: 999008,
    unlockedBy: 'puzzle_6'
  },

  puzzle_9: {
    id: 'puzzle_9',
    name: 'Resource Scarcity',
    description: 'Start with minimal resources. Gather and balance quickly before time runs out.',
    difficulty: 'medium',
    category: 'resource_race',
    startingResources: {
      ore: 20,
      energy: 20,
      biomass: 20,
      data: 20
    },
    constraints: [
      { type: 'time_limit', value: 180 } // Only 3 minutes
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Reach equilibrium with all resources above 100 within 3 minutes',
      duration: 10
    },
    hints: [
      'Gather resources as quickly as possible',
      'Prioritize building extractors',
      'Don\'t waste resources on unnecessary tech',
      'Time is critical - be efficient'
    ],
    seed: 999009,
    unlockedBy: 'puzzle_1'
  },

  puzzle_10: {
    id: 'puzzle_10',
    name: 'The Paradox',
    description: 'Research requires knowledge, but you need research to generate knowledge efficiently. Solve this paradox.',
    difficulty: 'hard',
    category: 'efficiency',
    startingResources: {
      ore: 200,
      energy: 200,
      biomass: 200,
      data: 50
    },
    constraints: [
      { type: 'resource_max', resource: 'data', value: 500 }, // Knowledge capped at 500
      { type: 'time_limit', value: 480 }
    ],
    winCondition: {
      type: 'technological',
      description: 'Research Quantum Ascendancy with knowledge capped at 500',
    },
    hints: [
      'Research techs in the optimal order',
      'Neural Network helps with research speed',
      'You can\'t hoard knowledge - use it wisely',
      'Plan your research path carefully'
    ],
    seed: 999010,
    unlockedBy: 'puzzle_7'
  },

  puzzle_11: {
    id: 'puzzle_11',
    name: 'Territorial Control',
    description: 'Capture and hold all resource nodes while maintaining equilibrium. Balance expansion with stability.',
    difficulty: 'medium',
    category: 'efficiency',
    startingResources: {
      ore: 150,
      energy: 150,
      biomass: 150,
      data: 150
    },
    constraints: [
      { type: 'time_limit', value: 420 }
    ],
    winCondition: {
      type: 'territorial',
      description: 'Control all resource nodes for 30 seconds while maintaining equilibrium',
      duration: 30
    },
    hints: [
      'Expand to capture nodes quickly',
      'Balance expansion with resource management',
      'Don\'t neglect equilibrium while expanding',
      'Secure nodes before focusing on balance'
    ],
    seed: 999011,
    unlockedBy: 'puzzle_3'
  },

  puzzle_12: {
    id: 'puzzle_12',
    name: 'The Grand Master',
    description: 'The ultimate challenge. Maintain perfect equilibrium for 2 minutes while fending off enemies and researching the terminal tech.',
    difficulty: 'hard',
    category: 'equilibrium',
    startingResources: {
      ore: 300,
      energy: 300,
      biomass: 300,
      data: 300
    },
    constraints: [
      { type: 'time_limit', value: 900 }, // 15 minutes
      { type: 'tech_required', techId: 'quantum_ascendancy', value: 1 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Achieve equilibrium for 60 seconds while researching Quantum Ascendancy',
      duration: 60
    },
    hints: [
      'This is the ultimate test of skill',
      'Balance offense, defense, research, and equilibrium',
      'Multi-task efficiently',
      'Practice the previous puzzles first'
    ],
    seed: 999012,
    unlockedBy: 'puzzle_8'
  },

  puzzle_13: {
    id: 'puzzle_13',
    name: 'The Pendulum',
    description: 'Your resources oscillate wildly. Bring them into perfect sync by timing your actions precisely.',
    difficulty: 'medium',
    category: 'timing',
    startingResources: {
      ore: 400,
      energy: 50,
      biomass: 400,
      data: 50
    },
    constraints: [
      { type: 'time_limit', value: 300 },
      { type: 'resource_min', resource: 'energy', value: 10 },
      { type: 'resource_min', resource: 'data', value: 10 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Achieve equilibrium from extreme imbalance within 5 minutes',
      duration: 15
    },
    hints: [
      'Resources start very unbalanced',
      'Focus on the low resources first',
      'Time your conversions carefully',
      'Don\'t let any resource hit zero'
    ],
    seed: 999013,
    unlockedBy: 'puzzle_2'
  },

  puzzle_14: {
    id: 'puzzle_14',
    name: 'The Clockwork',
    description: 'Maintain equilibrium while your resource production rates change every 30 seconds. Adapt quickly!',
    difficulty: 'hard',
    category: 'timing',
    startingResources: {
      ore: 200,
      energy: 200,
      biomass: 200,
      data: 200
    },
    constraints: [
      { type: 'time_limit', value: 600 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain equilibrium through 10 production rate changes',
      duration: 30
    },
    hints: [
      'Production rates will change unpredictably',
      'Monitor resource trends constantly',
      'Build flexible infrastructure',
      'React quickly to rate changes'
    ],
    seed: 999014,
    unlockedBy: 'puzzle_6'
  },

  puzzle_15: {
    id: 'puzzle_15',
    name: 'The Vault',
    description: 'You can only store 100 of each resource. Exceed this limit and you lose. Balance perfectly within these constraints.',
    difficulty: 'hard',
    category: 'efficiency',
    startingResources: {
      ore: 80,
      energy: 80,
      biomass: 80,
      data: 80
    },
    constraints: [
      { type: 'resource_max', resource: 'ore', value: 100 },
      { type: 'resource_max', resource: 'energy', value: 100 },
      { type: 'resource_max', resource: 'biomass', value: 100 },
      { type: 'resource_max', resource: 'data', value: 100 },
      { type: 'time_limit', value: 480 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain equilibrium for 45 seconds without exceeding storage limits',
      duration: 45
    },
    hints: [
      'Stop gathering before hitting limits',
      'Use resources actively to stay under cap',
      'Balance production and consumption',
      'One resource overflowing means failure'
    ],
    seed: 999015,
    unlockedBy: 'puzzle_6'
  },

  puzzle_16: {
    id: 'puzzle_16',
    name: 'The Siege',
    description: 'Defend your base from constant attacks while maintaining resource equilibrium. Multi-task or perish.',
    difficulty: 'hard',
    category: 'defense',
    startingResources: {
      ore: 250,
      energy: 250,
      biomass: 250,
      data: 250
    },
    constraints: [
      { type: 'time_limit', value: 600 },
      { type: 'unit_limit', value: 10 }
    ],
    winCondition: {
      type: 'survival',
      description: 'Survive 10 minutes of attacks while maintaining equilibrium for 30 seconds',
      duration: 600
    },
    hints: [
      'Balance defense with resource management',
      'Don\'t overspend on military',
      'Maintain equilibrium even under pressure',
      'Use units efficiently - you\'re limited to 10'
    ],
    seed: 999016,
    unlockedBy: 'puzzle_5'
  },

  puzzle_17: {
    id: 'puzzle_17',
    name: 'The Conversion',
    description: 'Start with only ore. Convert it through the resource chain to achieve equilibrium across all four resources.',
    difficulty: 'medium',
    category: 'resource_race',
    startingResources: {
      ore: 1000,
      energy: 0,
      biomass: 0,
      data: 0
    },
    constraints: [
      { type: 'time_limit', value: 360 },
      { type: 'resource_min', resource: 'ore', value: 50 } // Must keep some ore
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Achieve equilibrium starting from only ore',
      duration: 20
    },
    hints: [
      'Use refineries to convert ore to energy',
      'Plan your conversion chain carefully',
      'Don\'t convert all your ore',
      'Balance the conversion rates'
    ],
    seed: 999017,
    unlockedBy: 'puzzle_2'
  },

  puzzle_18: {
    id: 'puzzle_18',
    name: 'The Pyramid',
    description: 'Build a perfect resource pyramid: ore at the base, then energy, then biomass, then data at the top. Maintain this ratio.',
    difficulty: 'medium',
    category: 'efficiency',
    startingResources: {
      ore: 400,
      energy: 300,
      biomass: 200,
      data: 100
    },
    constraints: [
      { type: 'time_limit', value: 420 }
    ],
    winCondition: {
      type: 'resource_target',
      description: 'Maintain 4:3:2:1 ratio (ore:energy:biomass:data) for 25 seconds',
      target: 1
    },
    hints: [
      'Keep ore highest, data lowest',
      'Maintain the exact ratio',
      'Monitor all four resources',
      'Adjust production to match ratios'
    ],
    seed: 999018,
    unlockedBy: 'puzzle_3'
  },

  puzzle_19: {
    id: 'puzzle_19',
    name: 'The Juggler',
    description: 'Keep all four resources between 150 and 250. Too high or too low and you fail. Precision juggling required.',
    difficulty: 'hard',
    category: 'equilibrium',
    startingResources: {
      ore: 200,
      energy: 200,
      biomass: 200,
      data: 200
    },
    constraints: [
      { type: 'resource_min', resource: 'ore', value: 150 },
      { type: 'resource_max', resource: 'ore', value: 250 },
      { type: 'resource_min', resource: 'energy', value: 150 },
      { type: 'resource_max', resource: 'energy', value: 250 },
      { type: 'resource_min', resource: 'biomass', value: 150 },
      { type: 'resource_max', resource: 'biomass', value: 250 },
      { type: 'resource_min', resource: 'data', value: 150 },
      { type: 'resource_max', resource: 'data', value: 250 },
      { type: 'time_limit', value: 540 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain all resources in the 150-250 range for 40 seconds',
      duration: 40
    },
    hints: [
      'Stay within tight bounds for all resources',
      'Stop gathering before hitting max',
      'Keep production balanced',
      'One resource out of bounds fails the puzzle'
    ],
    seed: 999019,
    unlockedBy: 'puzzle_6'
  },

  puzzle_20: {
    id: 'puzzle_20',
    name: 'The Cascade',
    description: 'Research three technologies in sequence while maintaining equilibrium. Each research changes your resource needs.',
    difficulty: 'hard',
    category: 'efficiency',
    startingResources: {
      ore: 300,
      energy: 300,
      biomass: 300,
      data: 200
    },
    constraints: [
      { type: 'time_limit', value: 600 }
    ],
    winCondition: {
      type: 'technological',
      description: 'Research 3 technologies while maintaining equilibrium throughout',
    },
    hints: [
      'Plan your research order',
      'Each tech changes resource consumption',
      'Maintain balance during research',
      'Don\'t let research break equilibrium'
    ],
    seed: 999020,
    unlockedBy: 'puzzle_4'
  },

  puzzle_21: {
    id: 'puzzle_21',
    name: 'The Zero Sum',
    description: 'Your total resources must always equal exactly 800. Distribute them perfectly across all four types.',
    difficulty: 'hard',
    category: 'equilibrium',
    startingResources: {
      ore: 200,
      energy: 200,
      biomass: 200,
      data: 200
    },
    constraints: [
      { type: 'time_limit', value: 480 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain total resources at exactly 800 with perfect balance for 35 seconds',
      duration: 35
    },
    hints: [
      'Total of all resources must be 800',
      'Balance distribution across all four',
      'Any gathering changes the total',
      'Precision is critical'
    ],
    seed: 999021,
    unlockedBy: 'puzzle_6'
  },

  puzzle_22: {
    id: 'puzzle_22',
    name: 'The Rush Hour',
    description: 'You have only 2 minutes to achieve equilibrium. Speed and precision are both required.',
    difficulty: 'medium',
    category: 'timing',
    startingResources: {
      ore: 100,
      energy: 150,
      biomass: 50,
      data: 100
    },
    constraints: [
      { type: 'time_limit', value: 120 } // Only 2 minutes!
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Achieve equilibrium within 2 minutes',
      duration: 10
    },
    hints: [
      'Time is extremely limited',
      'Make decisions quickly',
      'Don\'t waste resources',
      'Focus on balance immediately'
    ],
    seed: 999022,
    unlockedBy: 'puzzle_1'
  },

  puzzle_23: {
    id: 'puzzle_23',
    name: 'The Isolation',
    description: 'You can only build one type of building. Choose wisely and achieve equilibrium with this limitation.',
    difficulty: 'hard',
    category: 'efficiency',
    startingResources: {
      ore: 200,
      energy: 200,
      biomass: 200,
      data: 200
    },
    constraints: [
      { type: 'time_limit', value: 480 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Achieve equilibrium using only one building type',
      duration: 25
    },
    hints: [
      'Choose your building type carefully',
      'You can build multiple of the same type',
      'Balance through worker management',
      'Research can help compensate'
    ],
    seed: 999023,
    unlockedBy: 'puzzle_7'
  },

  puzzle_24: {
    id: 'puzzle_24',
    name: 'The Metronome',
    description: 'Resources must alternate: high ore/low energy, then high energy/low ore, cycling every 15 seconds. Maintain this rhythm.',
    difficulty: 'hard',
    category: 'timing',
    startingResources: {
      ore: 300,
      energy: 100,
      biomass: 200,
      data: 200
    },
    constraints: [
      { type: 'time_limit', value: 600 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Complete 4 full cycles of resource oscillation while maintaining overall balance',
      duration: 60
    },
    hints: [
      'Resources must oscillate in a pattern',
      'Time your conversions precisely',
      'Maintain the rhythm',
      'One missed cycle fails the puzzle'
    ],
    seed: 999024,
    unlockedBy: 'puzzle_14'
  },

  puzzle_25: {
    id: 'puzzle_25',
    name: 'The Master Architect',
    description: 'Build exactly 8 buildings in a perfect 2x2x2x2 distribution (2 of each resource type). Achieve equilibrium with this structure.',
    difficulty: 'hard',
    category: 'efficiency',
    startingResources: {
      ore: 250,
      energy: 250,
      biomass: 250,
      data: 250
    },
    constraints: [
      { type: 'time_limit', value: 540 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain equilibrium with exactly 2 buildings of each resource type',
      duration: 30
    },
    hints: [
      'Build exactly 2 of each building type',
      'No more, no less',
      'Balance production carefully',
      'Strategic placement matters'
    ],
    seed: 999025,
    unlockedBy: 'puzzle_3'
  }
};

/**
 * Get all available puzzles based on completed puzzles
 */
export function getAvailablePuzzles(completedPuzzles: string[]): Puzzle[] {
  return Object.values(PUZZLES).filter(puzzle => {
    // First two puzzles are always unlocked
    if (puzzle.id === 'puzzle_1' || puzzle.id === 'puzzle_2') {
      return true;
    }
    // Check if prerequisite is completed
    if (puzzle.unlockedBy) {
      return completedPuzzles.includes(puzzle.unlockedBy);
    }
    return false;
  });
}

/**
 * Get puzzle by ID
 */
export function getPuzzle(id: string): Puzzle | undefined {
  return PUZZLES[id];
}

/**
 * Get puzzles by category
 */
export function getPuzzlesByCategory(category: Puzzle['category']): Puzzle[] {
  return Object.values(PUZZLES).filter(p => p.category === category);
}

/**
 * Get puzzles by difficulty
 */
export function getPuzzlesByDifficulty(difficulty: Puzzle['difficulty']): Puzzle[] {
  return Object.values(PUZZLES).filter(p => p.difficulty === difficulty);
}

