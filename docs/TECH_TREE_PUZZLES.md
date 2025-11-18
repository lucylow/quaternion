# Tech Tree Puzzles System - Implementation Guide

## Overview

The Tech Tree Puzzles system transforms the tech tree into a strategic puzzle space where players must make optimal sequencing decisions under constraints. This system includes:

- **Puzzle Evaluation Engine**: Analyzes tech choices based on immediate impact, long-term value, synergies, and urgency
- **Recommendation System**: AI advisor that provides personalized recommendations
- **Sequence Simulation**: "What-if" analysis for planning multi-turn research sequences
- **Puzzle Generation**: Context-aware puzzle generation based on game state
- **Enhanced UI**: Visual feedback for opportunity costs, synergies, and recommendations

## Core Components

### 1. TechTreeSolver (`src/game/tech/TechTreeSolver.ts`)

The core puzzle-solving engine that evaluates tech nodes and generates recommendations.

**Key Features:**
- Evaluates techs based on immediate impact, long-term value, synergy bonus, and urgency
- Solves knapsack puzzles for budget-constrained selection
- Generates optimal sequences for multi-turn planning
- Adapts evaluation weights based on game phase

**Usage:**
```typescript
import { TechTreeSolver, PuzzleContext } from '@/game/tech/TechTreeSolver';

const solver = new TechTreeSolver(techManager, resourceManager);

const context: PuzzleContext = {
  currentResources: { ore: 300, energy: 100, biomass: 50, data: 80 },
  researchedTech: ['basic_refinery'],
  availableTech: techManager.getAvailableTechNodes(),
  gamePhase: 0.3, // Early game
  enemyComposition: { hasAir: true, hasHeavy: false, hasStealth: false }
};

const evaluations = solver.evaluateAvailableTechs(context);
// Returns ranked list of tech evaluations
```

### 2. TechAdvisor (`src/game/tech/TechAdvisor.ts`)

Provides intelligent recommendations with personality-based selection.

**Advisor Styles:**
- **Conservative**: Favors long-term value and synergies
- **Aggressive**: Prioritizes immediate impact and urgency
- **Innovative**: Focuses on synergy potential and creative paths
- **Adaptive**: Changes strategy based on game state

**Usage:**
```typescript
import { TechAdvisor, AdvisorStyle } from '@/game/tech/TechAdvisor';

const advisor = new TechAdvisor(solver, techManager, resourceManager);
advisor.setPersonality({
  name: 'Tactical Advisor',
  style: AdvisorStyle.ADAPTIVE,
  riskTolerance: 0.5,
  planningHorizon: 3
});

const recommendation = advisor.generateRecommendation(context);
// Returns: { recommendation: 'tech_id', confidence: 0.8, reasoning: '...' }
```

### 3. SequenceSimulator (`src/game/tech/SequenceSimulator.ts`)

Simulates multi-turn research sequences for planning.

**Features:**
- Preview 2-turn sequences starting with any tech
- Calculate projected resources and effects
- Identify synergy bonuses
- Compare alternative sequences

**Usage:**
```typescript
import { SequenceSimulator } from '@/game/tech/SequenceSimulator';

const simulator = new SequenceSimulator(techManager, resourceManager, solver);
const preview = simulator.previewSequence(startingNode, context);

// Returns: {
//   sequence: [node1, node2],
//   projectedResources: {...},
//   projectedEffects: [...],
//   totalCost: {...},
//   totalTime: 60,
//   synergyBonus: 0.3
// }
```

### 4. TechPuzzleGenerator (`src/game/tech/TechPuzzleGenerator.ts`)

Generates contextual puzzles based on game state.

**Puzzle Types:**
- **Sequence Optimization**: Order matters for optimal benefits
- **Budget Allocation**: Limited resources, maximize value
- **Synergy Discovery**: Find powerful tech combinations
- **Counter Pick**: Respond to enemy threats

**Usage:**
```typescript
import { TechPuzzleGenerator } from '@/game/tech/TechPuzzleGenerator';

const generator = new TechPuzzleGenerator(techManager, resourceManager);
const puzzle = generator.generateContextualPuzzle(context);

// Returns: {
//   puzzleId: 'synergy_123',
//   scenarioDescription: '...',
//   availableOptions: [...],
//   successCondition: '...',
//   optimalSolution: [...],
//   puzzleType: PuzzleType.SYNERGY_DISCOVERY
// }
```

## Enhanced Tech Tree Features

### Synergy System

Tech nodes can have synergy relationships. When multiple synergy nodes are researched, they provide bonus effects.

**Example:**
- `drone_bay` + `drone_ai` + `reactive_swarm` = Exponential swarm bonus

**Defining Synergies:**
```typescript
{
  nodeId: 'drone_bay',
  synergyNodes: ['drone_ai', 'reactive_swarm'],
  // ...
}
```

### Urgency Factor

Each tech node has an `urgencyFactor` (0-1) that indicates how time-sensitive it is:
- **0.0-0.3**: Long-term investment
- **0.4-0.6**: Balanced timing
- **0.7-1.0**: Immediate need

### Discovery Conditions

Hidden tech nodes can be revealed based on conditions:
```typescript
{
  nodeId: 'bio_conserve',
  isHidden: true,
  discoveryConditions: ['biomass_threshold'],
  // ...
}
```

### Counter Tech

Tech nodes can counter specific enemy strategies:
```typescript
{
  nodeId: 'fast_anti_air',
  counterTech: ['stealth_tech', 'armored_air'],
  // ...
}
```

## UI Integration

### EnhancedTechTreeModal

The enhanced modal provides:
- **Advisor Recommendations**: AI-suggested techs with reasoning
- **Sequence Preview**: 2-turn projection when hovering a tech
- **Opportunity Cost**: Shows what becomes unaffordable
- **Synergy Visualization**: Highlights synergy relationships
- **Urgency Indicators**: Visual cues for time-sensitive techs

**Usage:**
```typescript
import { EnhancedTechTreeModal } from '@/components/game/EnhancedTechTreeModal';

<EnhancedTechTreeModal
  techManager={techManager}
  resourceManager={resourceManager}
  researchedTechs={researchedTechs}
  onResearch={handleResearch}
  onClose={handleClose}
  gamePhase={0.3}
  enemyComposition={{ hasAir: true, hasHeavy: false, hasStealth: false }}
/>
```

## Puzzle Examples

### Demo Puzzle A: The Gatekeeper

**Scenario:**
- Start: 300 Ore, 1 refinery
- Map: 1 chokepoint, 1 airfield (enemy controlled)
- Options:
  - Fast Anti-Air (200 ore, 20s) - Immediate counter
  - Reactor Overclock (250 ore, 45s) - Long-term production

**Puzzle:** Choose immediate tactical advantage vs long-term economic scaling.

### Demo Puzzle B: Synergy Gamble

**Scenario:**
- Nodes: `drone_bay` → `drone_ai` → `reactive_swarm`
- Early investment in weak nodes enables late exponential payoff
- Risk: If enemy contests early, you may be ruined

**Puzzle:** Evaluate map control vs synergy gamble.

## Balancing Heuristics

### Metrics to Track

1. **Tech Pick Diversity**: % of games using ≥3 distinct paths (target: 40-60%)
2. **Win Rate by Path**: Ensure no single path > 65% win rate
3. **Time-to-First-Transformative-Tech**: Average and variance
4. **Decision Entropy**: How often players deviate from recommendations

### Adjusting Balance

- **Cost/Time**: Adjust to control pacing
- **Synergy Bonus**: Increase for more combo-focused gameplay
- **Urgency Factor**: Tune based on game phase sensitivity
- **Strategic Weight**: Balance AI decision making

## LLM Integration (Optional)

The system supports LLM enhancement for:
- Natural language reasoning in recommendations
- Dynamic puzzle narrative generation
- Personalized advisor personalities

**Enabling LLM:**
```typescript
advisor.setLLMEnabled(true);
const enhancedRecommendation = await advisor.generateLLMRecommendation(context);
```

## Testing

### Unit Tests

Test puzzle solver logic:
```typescript
describe('TechTreeSolver', () => {
  it('should evaluate techs correctly', () => {
    const evaluations = solver.evaluateAvailableTechs(context);
    expect(evaluations.length).toBeGreaterThan(0);
    expect(evaluations[0].totalScore).toBeGreaterThan(0);
  });
});
```

### Integration Tests

Test full puzzle flow:
```typescript
describe('Tech Puzzle System', () => {
  it('should generate contextual puzzle', () => {
    const puzzle = generator.generateContextualPuzzle(context);
    expect(puzzle).toBeDefined();
    expect(puzzle.availableOptions.length).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

- **Evaluation Caching**: Cache evaluations for unchanged game states
- **Lazy Loading**: Only evaluate when needed
- **Horizon Limiting**: Limit sequence simulation to 2-3 turns
- **LLM Throttling**: Rate limit LLM calls (45s cooldown default)

## Future Enhancements

- [ ] MCTS-based deep planning
- [ ] Multi-player puzzle generation
- [ ] Dynamic difficulty adjustment
- [ ] Player learning analytics
- [ ] Procedural puzzle generation

## References

- Design Document: Tech-Tree Puzzles — deep implementation & design guide
- Demo Puzzles: See `TechPuzzleGenerator` for examples
- UI Components: `EnhancedTechTreeModal` for visual integration


