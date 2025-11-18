# 🧠 Terrain-Aware AI Agent System

A comprehensive AI agent behavior system that implements intelligent, terrain-aware decision-making with multiple strategic personalities, advanced pathfinding, tactical unit management, dynamic adaptation, and learning capabilities.

## Features

### 🎯 **Core AI Agent Architecture**

- **Four Strategic Personalities:**
  - `CAUTIOUS_GEOLOGIST`: Values defensive positions and resource control
  - `RECKLESS_STORM_CHASER`: Aggressive, risks dynamic tiles for tactical advantages
  - `METHODICAL_ENGINEER`: Focuses on tech and terrain manipulation
  - `ADAPTIVE_SURVIVOR`: Reacts to opponent behavior and counters terrain advantages

### 🗺️ **Advanced Tile Evaluation System**

- Evaluates strategic value of tiles based on:
  - Defensive properties (chokepoints, elevation, cover)
  - Resource value (clustering, biome affinity)
  - Vision/expansion potential
  - Dynamic tile timing
  - Counterplay opportunities
  - Threat assessment

### 🛣️ **Advanced Pathfinding**

- Multiple pathfinding strategies:
  - Direct pathfinding
  - Cover-based paths
  - High ground routes
  - Flanking paths
- Evaluates paths on:
  - Safety (defense bonus, concealment)
  - Speed (passability)
  - Tactical value (chokepoints, elevation)
  - Threat level

### ⚔️ **Tactical Unit Management**

- Role-based unit assignment:
  - `RECON`: Exploration and intelligence gathering
  - `SENTRY`: Observation and early warning
  - `FLANKER`: Tactical positioning
  - `DEFENDER`: Defensive positioning
  - `ATTACKER`: Offensive operations
  - `AMBUSHER`: Concealed attacks
  - `REPAIR`: Structure maintenance
  - `CONSTRUCT`: Building operations
  - `SUPPORT`: General support
  - `BODYGUARD`: Unit protection

### 🔄 **Dynamic Adaptation System**

- Tracks strategy effectiveness
- Adapts to opponent patterns
- Reacts to critical game events:
  - Dynamic tile activations
  - Chokepoint captures
  - Research completions
  - Resource depletion
  - Base attacks

### 📊 **Learning & Optimization**

- Records decision outcomes
- Learns from experience
- Optimizes future decisions
- Tracks success rates by action type
- Provides decision statistics

## Usage

### Basic Setup

```typescript
import {
  TerrainAIPersonalityManager,
  AIPersonality,
  AIDecisionEngine,
  AITileEvaluator,
  AIPathfinding,
  AIUnitController,
  AIAdaptationManager,
  AILearningSystem
} from './ai/terrain';

// Create personality manager
const personalityManager = new TerrainAIPersonalityManager(seed);

// Create AI agent with personality
const agent = personalityManager.createAgent(
  AIPersonality.CAUTIOUS_GEOLOGIST,
  'quantum' // faction
);

// Initialize systems
const decisionEngine = new AIDecisionEngine();
const tileEvaluator = new AITileEvaluator();
const pathfinding = new AIPathfinding();
const unitController = new AIUnitController();
const adaptationManager = new AIAdaptationManager();
const learningSystem = new AILearningSystem();
```

### Making Strategic Decisions

```typescript
// Generate strategic action based on personality
const action = decisionEngine.generateStrategicAction(agent, gameState, playerId);

if (action) {
  console.log(`Action: ${action.type}`);
  console.log(`Priority: ${action.priority}`);
  console.log(`Reasoning: ${action.reasoning}`);
}
```

### Evaluating Tiles

```typescript
// Evaluate strategic value of a tile
const tile = gameState.map.getTile(x, y);
const evaluation = tileEvaluator.evaluateTileStrategicValue(
  tile,
  gameState,
  agent,
  playerId
);

console.log(`Tile score: ${evaluation.score}`);
console.log(`Reasoning: ${evaluation.reasoning}`);
```

### Finding Optimal Paths

```typescript
// Find optimal path with terrain awareness
const path = pathfinding.findOptimalPath(
  startPosition,
  targetPosition,
  gameState,
  agent,
  playerId,
  {
    avoidThreats: true,
    preferCover: true,
    allowFlanking: true
  }
);

if (path) {
  console.log(`Path score: ${path.score}`);
  console.log(`Reasoning: ${path.reasoning}`);
  // Use path.waypoints for movement
}
```

### Managing Units

```typescript
// Assign roles to units
unitController.assignUnitRoles(units, gameState, agent, playerId);

// Execute unit tactics
for (const unit of units) {
  const action = unitController.executeUnitTactics(unit, gameState, agent, playerId);
  if (action) {
    // Execute the action
    executeAction(action);
  }
}
```

### Adaptation and Learning

```typescript
// Analyze game state and adapt
adaptationManager.analyzeGameState(gameState, agent, playerId);

// Record events
adaptationManager.recordEvent({
  type: GameEventType.DYNAMIC_TILE_ACTIVATION,
  timestamp: Date.now(),
  affectedTile: { x: 10, y: 20 }
});

// Record decision outcomes for learning
learningSystem.recordDecisionOutcome(decision, outcome);

// Get expected outcome for a decision
const expectedOutcome = learningSystem.getExpectedOutcome(decision);
```

## Personality Descriptions

### CAUTIOUS_GEOLOGIST
- **Focus**: Defensive positions, resource control
- **Preferred Actions**: Secure chokepoints, safe resource expansion
- **Risk Tolerance**: Low
- **Best For**: Defensive playstyles, resource-heavy strategies

### RECKLESS_STORM_CHASER
- **Focus**: Aggressive expansion, dynamic tile opportunities
- **Preferred Actions**: Rush dynamic tiles, strike vulnerable positions
- **Risk Tolerance**: High
- **Best For**: Aggressive playstyles, opportunistic strategies

### METHODICAL_ENGINEER
- **Focus**: Technology and terrain manipulation
- **Preferred Actions**: Research tech, build synergy structures
- **Risk Tolerance**: Medium
- **Best For**: Tech-focused strategies, systematic approaches

### ADAPTIVE_SURVIVOR
- **Focus**: Countering opponent strategies
- **Preferred Actions**: Adaptive responses, terrain advantage exploitation
- **Risk Tolerance**: Variable
- **Best For**: Versatile playstyles, reactive strategies

## Integration with Existing AI

This system is designed to integrate with the existing AI controller system. You can use it alongside or as a replacement for the current AI decision-making logic.

### Example Integration

```typescript
import { AIController } from '../AIController';
import { TerrainAIPersonalityManager, AIDecisionEngine } from './terrain';

class EnhancedAIController extends AIController {
  private terrainAgent: TerrainAIAgent;
  private decisionEngine: AIDecisionEngine;

  constructor(playerId: string, difficulty: AIDifficulty, commanderId: string) {
    super(playerId, difficulty, commanderId);
    
    const personalityManager = new TerrainAIPersonalityManager(seed);
    this.terrainAgent = personalityManager.createAgent(
      AIPersonality.ADAPTIVE_SURVIVOR
    );
    this.decisionEngine = new AIDecisionEngine();
  }

  async makeDecisions(gameState: any) {
    // Use terrain-aware decision making
    const terrainAction = this.decisionEngine.generateStrategicAction(
      this.terrainAgent,
      gameState,
      this.playerId
    );

    if (terrainAction) {
      // Execute terrain-aware action
      this.executeTerrainAction(terrainAction, gameState);
    } else {
      // Fall back to base AI
      return super.makeDecisions(gameState);
    }
  }
}
```

## Performance Considerations

- Strategic value cache is used to avoid redundant calculations
- Decision history is limited to prevent memory bloat
- Pathfinding uses simplified A* for performance (can be enhanced)
- Learning system uses efficient signature-based matching

## Future Enhancements

- Full A* pathfinding implementation
- More sophisticated opponent pattern recognition
- Enhanced terrain feature detection
- Multi-unit coordination and formations
- Advanced learning algorithms (neural networks, reinforcement learning)


