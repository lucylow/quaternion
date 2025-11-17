# AI Agent System for Quaternion: Neural Frontier

## Overview

This is a comprehensive AI Agent system that provides multi-layered, personality-driven AI for the Quaternion RTS game. The system features specialized agents, learning capabilities, and LLM integration for strategic decision-making.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           AIControllerCoordinator (Master)              │
│         Coordinates all specialized agents              │
└────────────────┬────────────────────────────────────────┘
                  │
      ┌───────────┼───────────┬──────────────┐
      │           │           │              │
┌─────▼─────┐ ┌──▼──────┐ ┌──▼──────┐ ┌────▼──────┐
│ Economic  │ │Military │ │Research │ │ Scouting │
│   Agent   │ │  Agent  │ │  Agent  │ │  Agent   │
└───────────┘ └─────────┘ └─────────┘ └──────────┘
      │           │           │              │
      └───────────┴───────────┴──────────────┘
                  │
         ┌────────▼────────┐
         │  Unit Agents   │
         │ (Individual)    │
         └─────────────────┘
```

## Components

### 1. Core Base System (`AgentBase.ts`)

- **BaseAgent**: Abstract base class for all agents
- **IAgent**: Interface defining agent contract
- **AgentPersonality**: Personality traits for agents
- **GameStateSnapshot**: Structured game state for AI decisions
- **AgentRecommendation**: Output format from agents

### 2. Specialized Agents

#### Economic Agent (`EconomicAgent.ts`)
- Manages resource generation and economic expansion
- Analyzes resource balance, expansion potential, and risk exposure
- Generates economic strategies (aggressive expansion, defensive economy, tech investment)

#### Military Agent (`MilitaryAgent.ts`)
- Handles combat, defense, and tactical operations
- Analyzes threats and opportunities
- Generates military strategies (defensive, offensive, expansion, harassment)

#### Research Agent (`ResearchAgent.ts`)
- Manages technology research and tech tree optimization
- Analyzes tech gaps and research efficiency
- Generates research paths (military, economic, defensive, balanced)

#### Scouting Agent (`ScoutingAgent.ts`)
- Handles reconnaissance and intelligence gathering
- Identifies unknown areas and intelligence gaps
- Prioritizes scouting targets based on strategic value

### 3. Coordination System (`AIControllerCoordinator.ts`)

The master controller that:
- Coordinates all specialized agents
- Resolves conflicts between agent recommendations
- Makes final strategic decisions
- Manages resource allocation
- Generates strategic narratives

### 4. Unit-Level Agents (`UnitAgent.ts`)

Individual unit AI with:
- Personality-driven behaviors
- Multiple behavior types (Combat, Movement, Survival, Ability, Communication)
- Sensor system for environmental awareness
- Memory system for learning

### 5. Safety System (`LLMSafetyManager.ts`)

LLM validation and safety:
- Resource validation
- Strategic soundness checks
- Game rules compliance
- Fallback heuristics
- Response caching

## Usage

### Basic Setup

```typescript
import { AIControllerCoordinator } from './ai/agents';
import { EnhancedCommanderPersonality } from './ai/EnhancedCommanderPersonality';

// Create commander personality
const commanderPersonality = new EnhancedCommanderPersonality(seed, 'aggressor');
const personality = commanderPersonality.getPersonality();

// Create AI coordinator
const aiController = new AIControllerCoordinator(personality, seed);

// Update each game tick
const decision = aiController.update(gameState, currentTick);

if (decision) {
  // Execute decision.actions
  decision.actions.forEach(action => {
    executeAction(action);
  });
}
```

### Using Individual Agents

```typescript
import { EconomicAgent, AgentPersonality } from './ai/agents';

const personality: AgentPersonality = {
  personalityName: 'Economic Specialist',
  aggression: 0.3,
  adaptability: 0.7,
  riskTolerance: 0.5,
  economicFocus: 0.9,
  strategicPatience: 0.8
};

const economicAgent = new EconomicAgent(personality, seed);
const recommendation = economicAgent.generateRecommendation(gameStateSnapshot);

console.log(recommendation.reasoning);
// Execute recommendation.recommendedActions
```

### Unit-Level AI

```typescript
import { UnitAgent, UnitPersonality, UnitRole } from './ai/agents';

const unitPersonality: UnitPersonality = {
  aggression: 0.7,
  courage: 0.8,
  discipline: 0.6,
  independence: 0.4,
  preferredRole: UnitRole.ASSAULT,
  roleAdherence: 0.8
};

const unitAgent = new UnitAgent(
  'unit_123',
  'soldier',
  unitPersonality,
  seed,
  { x: 100, y: 100 },
  100,
  100
);

// Update each tick
const action = unitAgent.update(gameState, currentTick);
if (action) {
  executeUnitAction(action);
}
```

### LLM Safety Integration

```typescript
import { LLMSafetyManager } from './ai/agents';
import { generateStrategy } from './ai/modelClient';

const safetyManager = new LLMSafetyManager();

// Get LLM response
const rawResponse = await generateStrategy({ prompt: strategicPrompt });

// Validate and get safe response
const validatedResponse = safetyManager.getValidatedResponse(
  strategicPrompt,
  gameStateSnapshot,
  rawResponse.text
);

if (validatedResponse.isValid) {
  // Use validatedResponse.proposedActions
} else {
  // Fallback is automatically provided
  console.warn('Using fallback:', validatedResponse.fallbackReason);
}
```

## Personality System

Agents use personality traits to drive decision-making:

- **Aggression** (0-1): Tendency toward offensive actions
- **Adaptability** (0-1): Learning rate and flexibility
- **Risk Tolerance** (0-1): Willingness to take risks
- **Economic Focus** (0-1): Emphasis on economic development
- **Strategic Patience** (0-1): Long-term planning vs immediate action

Personalities can be:
- Generated from commander archetypes
- Created manually
- Evolved through gameplay

## Learning System

All agents learn from outcomes:

```typescript
// After executing actions and seeing results
const previousState = captureGameState();
// ... execute actions ...
const newState = captureGameState();

// Learn from outcome
aiController.learnFromOutcome(decision, previousState, newState);
```

Agents maintain memory of past decisions and adjust strategy weights based on outcomes.

## Integration with Existing Systems

The new agent system integrates with:

- **EnhancedCommanderPersonality**: Uses commander personality as base
- **QuaternionGameState**: Captures game state for decisions
- **modelClient**: LLM integration for strategic advice
- **Existing AIController**: Can be gradually migrated or used alongside

## Performance Considerations

- **Decision Intervals**: Strategic decisions made every 2 seconds (120 ticks)
- **Unit Decisions**: Unit-level decisions every 0.5 seconds (30 ticks)
- **Caching**: LLM responses cached to reduce API calls
- **Memory Limits**: Agent memory limited to prevent unbounded growth

## Future Enhancements

- Squad-level coordination agents
- MCTS (Monte Carlo Tree Search) for strategic planning
- Advanced personality evolution
- Multi-agent communication protocols
- Real-time voice generation integration (ElevenLabs)

## Testing

```typescript
// Test individual agent
const agent = new EconomicAgent(personality, seed);
const recommendation = agent.generateRecommendation(mockGameState);
expect(recommendation.recommendedActions.length).toBeGreaterThan(0);

// Test coordinator
const coordinator = new AIControllerCoordinator(commanderPersonality, seed);
const decision = coordinator.update(mockGameState, 120);
expect(decision).not.toBeNull();
expect(decision.actions.length).toBeGreaterThan(0);
```

## Notes

- All agents use seeded random number generators for determinism
- Personality traits are clamped to 0-1 range
- Resource costs are validated before execution
- Fallback systems ensure AI always has valid decisions

