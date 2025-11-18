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
    name: 'Biomass Bloom',
    description: 'Start with zero biomass. Grow your organic resources from scratch while maintaining other resource flows.',
    difficulty: 'medium',
    category: 'resource_race',
    startingResources: {
      ore: 200,
      energy: 200,
      biomass: 0,
      data: 100
    },
    constraints: [
      { type: 'resource_min', resource: 'biomass', value: 1 }, // Must maintain at least 1 biomass
      { type: 'time_limit', value: 300 }
    ],
    winCondition: {
      type: 'resource_target',
      description: 'Reach 300 biomass while maintaining equilibrium with other resources',
      target: 300
    },
    hints: [
      'Build biomass extractors immediately',
      'Don\'t let biomass drop to zero',
      'Balance biomass growth with other resources',
      'Workers can help gather biomass from nodes'
    ],
    seed: 999013,
    unlockedBy: 'puzzle_2'
  },

  puzzle_14: {
    id: 'puzzle_14',
    name: 'The Clockwork',
    description: 'Maintain resources in a specific ratio: 2:1:1:1 (ore:energy:biomass:data). Precision timing required.',
    difficulty: 'medium',
    category: 'equilibrium',
    startingResources: {
      ore: 200,
      energy: 100,
      biomass: 100,
      data: 100
    },
    constraints: [
      { type: 'time_limit', value: 360 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain 2:1:1:1 ratio (ore:energy:biomass:data) for 25 seconds',
      duration: 25
    },
    hints: [
      'Ore should be exactly double the other resources',
      'Monitor ratios constantly',
      'Adjust production rates carefully',
      'Use buildings to fine-tune resource generation'
    ],
    seed: 999014,
    unlockedBy: 'puzzle_1'
  },

  puzzle_15: {
    id: 'puzzle_15',
    name: 'Rapid Fire',
    description: 'Complete the challenge in under 2 minutes. Speed and efficiency are everything.',
    difficulty: 'hard',
    category: 'timing',
    startingResources: {
      ore: 150,
      energy: 150,
      biomass: 150,
      data: 150
    },
    constraints: [
      { type: 'time_limit', value: 120 } // Only 2 minutes!
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Achieve equilibrium within 2 minutes',
      duration: 15
    },
    hints: [
      'Act quickly - time is critical',
      'Prioritize essential buildings',
      'Don\'t waste time on unnecessary tech',
      'Focus on immediate resource balance'
    ],
    seed: 999015,
    unlockedBy: 'puzzle_9'
  },

  puzzle_16: {
    id: 'puzzle_16',
    name: 'The Juggler',
    description: 'Keep all four resources above 100 but below 200. A delicate balancing act.',
    difficulty: 'hard',
    category: 'equilibrium',
    startingResources: {
      ore: 150,
      energy: 150,
      biomass: 150,
      data: 150
    },
    constraints: [
      { type: 'resource_min', resource: 'ore', value: 100 },
      { type: 'resource_min', resource: 'energy', value: 100 },
      { type: 'resource_min', resource: 'biomass', value: 100 },
      { type: 'resource_min', resource: 'data', value: 100 },
      { type: 'resource_max', resource: 'ore', value: 200 },
      { type: 'resource_max', resource: 'energy', value: 200 },
      { type: 'resource_max', resource: 'biomass', value: 200 },
      { type: 'resource_max', resource: 'data', value: 200 },
      { type: 'time_limit', value: 420 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Maintain all resources between 100-200 for 30 seconds',
      duration: 30
    },
    hints: [
      'Stop gathering when approaching limits',
      'Use resources to stay in range',
      'Monitor all four resources constantly',
      'This requires precise control'
    ],
    seed: 999016,
    unlockedBy: 'puzzle_6'
  },

  puzzle_17: {
    id: 'puzzle_17',
    name: 'Data Drought',
    description: 'Knowledge is scarce. Research efficiently with minimal data resources available.',
    difficulty: 'medium',
    category: 'resource_race',
    startingResources: {
      ore: 300,
      energy: 300,
      biomass: 300,
      data: 15 // Very low data
    },
    constraints: [
      { type: 'resource_min', resource: 'data', value: 5 }, // Can't drop below 5
      { type: 'time_limit', value: 480 }
    ],
    winCondition: {
      type: 'technological',
      description: 'Research 3 technologies while keeping data above 5',
    },
    hints: [
      'Build data extractors first',
      'Don\'t research too quickly',
      'Balance data generation with research needs',
      'Prioritize efficient research paths'
    ],
    seed: 999017,
    unlockedBy: 'puzzle_4'
  },

  puzzle_18: {
    id: 'puzzle_18',
    name: 'The Cascade',
    description: 'Resources must flow in sequence: ore → energy → biomass → data. Build the chain correctly.',
    difficulty: 'hard',
    category: 'efficiency',
    startingResources: {
      ore: 400,
      energy: 50,
      biomass: 50,
      data: 50
    },
    constraints: [
      { type: 'time_limit', value: 540 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Achieve equilibrium by converting resources in sequence',
      duration: 20
    },
    hints: [
      'Convert ore to energy first',
      'Then use energy to produce biomass',
      'Finally convert biomass to data',
      'Build the conversion chain systematically'
    ],
    seed: 999018,
    unlockedBy: 'puzzle_13'
  },

  puzzle_19: {
    id: 'puzzle_19',
    name: 'Zero Sum',
    description: 'Total resources must never exceed 1000. Balance growth with strict limits.',
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
      description: 'Maintain equilibrium for 40 seconds with total resources ≤ 1000',
      duration: 40
    },
    hints: [
      'Sum of all resources must stay under 1000',
      'Spend resources to stay within limit',
      'Balance is key - can\'t hoard resources',
      'Monitor total resource count constantly'
    ],
    seed: 999019,
    unlockedBy: 'puzzle_16'
  },

  puzzle_20: {
    id: 'puzzle_20',
    name: 'The Spiral',
    description: 'Resources must cycle: ore peaks, then energy, then biomass, then data. Create the spiral pattern.',
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
      description: 'Complete one full cycle (ore→energy→biomass→data→ore) and return to equilibrium',
      duration: 20
    },
    hints: [
      'Let ore peak first, then shift to energy',
      'Follow the cycle: ore → energy → biomass → data',
      'Time your resource production shifts',
      'End with all resources balanced'
    ],
    seed: 999020,
    unlockedBy: 'puzzle_14'
  },

  puzzle_21: {
    id: 'puzzle_21',
    name: 'The Foundation',
    description: 'Build exactly 8 buildings total - 2 of each type. No more, no less.',
    difficulty: 'medium',
    category: 'efficiency',
    startingResources: {
      ore: 300,
      energy: 300,
      biomass: 300,
      data: 300
    },
    constraints: [
      { type: 'time_limit', value: 480 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Achieve equilibrium with exactly 8 buildings (2 of each type)',
      duration: 20
    },
    hints: [
      'Plan your building layout carefully',
      'You need 2 ore extractors, 2 refineries, 2 biomass farms, 2 research centers',
      'Balance production across building types',
      'No extra buildings allowed'
    ],
    seed: 999021,
    unlockedBy: 'puzzle_3'
  },

  puzzle_22: {
    id: 'puzzle_22',
    name: 'The Pendulum',
    description: 'Resources swing between two states: high ore/low energy, then high energy/low ore. Control the swing.',
    difficulty: 'hard',
    category: 'timing',
    startingResources: {
      ore: 400,
      energy: 50,
      biomass: 200,
      data: 200
    },
    constraints: [
      { type: 'time_limit', value: 540 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Complete two full swings (high ore→high energy→high ore) then achieve balance',
      duration: 15
    },
    hints: [
      'Start with high ore, convert to energy',
      'Then convert energy back to ore',
      'Complete the pendulum swing twice',
      'End in perfect balance'
    ],
    seed: 999022,
    unlockedBy: 'puzzle_18'
  },

  puzzle_23: {
    id: 'puzzle_23',
    name: 'The Trinity',
    description: 'Maintain three resources equal while the fourth stays at exactly half their value.',
    difficulty: 'hard',
    category: 'equilibrium',
    startingResources: {
      ore: 200,
      energy: 200,
      biomass: 200,
      data: 100
    },
    constraints: [
      { type: 'time_limit', value: 480 }
    ],
    winCondition: {
      type: 'equilibrium',
      description: 'Keep ore, energy, and biomass equal while data is exactly half for 30 seconds',
      duration: 30
    },
    hints: [
      'Three resources must match exactly',
      'Data must be exactly half of the others',
      'Monitor all four resources carefully',
      'Precision is critical'
    ],
    seed: 999023,
    unlockedBy: 'puzzle_14'
  },

  puzzle_24: {
    id: 'puzzle_24',
    name: 'The Gauntlet',
    description: 'Survive 5 minutes with enemies attacking while maintaining resource balance. Multi-tasking mastery.',
    difficulty: 'hard',
    category: 'defense',
    startingResources: {
      ore: 200,
      energy: 200,
      biomass: 200,
      data: 200
    },
    constraints: [
      { type: 'time_limit', value: 600 },
      { type: 'resource_min', resource: 'ore', value: 50 },
      { type: 'resource_min', resource: 'energy', value: 50 }
    ],
    winCondition: {
      type: 'survival',
      description: 'Survive 5 minutes while maintaining equilibrium and keeping resources above minimums',
      duration: 300
    },
    hints: [
      'Balance defense with resource management',
      'Don\'t let resources drop too low',
      'Build defensive structures',
      'This tests all your skills'
    ],
    seed: 999024,
    unlockedBy: 'puzzle_5'
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

