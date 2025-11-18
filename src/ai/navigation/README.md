# 🧭 Open-World AI Navigation & Interaction System

A comprehensive navigation system implementing hierarchical pathfinding, reinforcement learning, context-aware decision making, human behavior clustering, multi-modal transportation, and dynamic world adaptation for intelligent NPCs in open worlds.

## 🎯 Features

### 1. **Hierarchical Pathfinding (HPA*)**
- Scales pathfinding to massive open worlds using chunk-based abstraction
- Two-phase pathfinding: macro (chunk-level) and micro (tile-level)
- Handles dynamic obstacles and adaptive chunk sizing
- Efficient for worlds spanning kilometers

### 2. **Reinforcement Learning Navigation**
- Q-learning based agents that learn from experience
- Remembers successful and failed routes
- Adapts navigation strategies based on outcomes
- Reduces exploration rate over time as agents learn

### 3. **Context-Aware Decision Making**
- Understands navigation purpose (commute, exploration, escape, stealth, etc.)
- Adapts strategy based on urgency, social constraints, and environmental factors
- Generates intelligent navigation plans with risk assessment
- Considers historical patterns and agent capabilities

### 4. **Human Navigation Clustering**
- Analyzes player navigation patterns using K-means clustering
- Identifies navigation styles: Efficiency Expert, Explorer, Cautious Navigator, Social Navigator, Adventurous
- Trains NPCs to imitate human navigation behaviors
- Creates more believable, human-like NPC movement

### 5. **Multi-Modal Transportation**
- Intelligently chooses between walking, running, vehicles, flying, fast travel
- Considers distance, urgency, cost, terrain, weather, and agent capabilities
- Evaluates transport options with confidence scores
- Adapts to changing conditions

### 6. **Dynamic World Adaptation**
- Handles world changes: construction, disasters, player influence, environmental changes
- Discovers alternative routes when paths are blocked
- Multiple discovery methods: exploration, social observation, map consultation, trial-and-error, AI-assisted
- Tracks route discoveries and efficiency improvements

## 📦 Usage

### Basic Setup

```typescript
import { OpenWorldNavigationManager } from './ai/navigation';
import { ChunkManager } from './map/ChunkManager';

// Initialize chunk manager
const chunkManager = new ChunkManager({
  chunkSize: 32,
  tileSize: 1,
  viewDistance: 3,
  seed: 12345
});

// Create navigation manager
const navManager = new OpenWorldNavigationManager(chunkManager, {
  useHierarchicalPathfinding: true,
  useReinforcementLearning: true,
  useContextAwareness: true,
  useHumanClustering: true,
  useMultiModalTransport: true,
  useDynamicAdaptation: true
});
```

### Finding a Path

```typescript
import { NavigationRequest, NavigationPurpose, UrgencyLevel } from './ai/navigation';

const request: NavigationRequest = {
  start: { x: 10, y: 10 },
  destination: { x: 100, y: 100 },
  purpose: NavigationPurpose.COMMUTE,
  urgency: UrgencyLevel.NORMAL,
  agentId: 'npc_001',
  constraints: {
    maxTime: 60,
    requireCover: false
  }
};

const result = navManager.navigate(request, gameState, 'npc_001');

if (result) {
  console.log(`Path found: ${result.path.length} waypoints`);
  console.log(`Strategy: ${result.strategy}`);
  console.log(`Reasoning: ${result.reasoning}`);
  console.log(`Estimated time: ${result.estimatedTime}s`);
}
```

### Recording Outcomes for Learning

```typescript
// After navigation completes, record outcome
navManager.recordNavigationOutcome(
  'npc_001',
  request.start,
  request.destination,
  result.path,
  {
    reachedDestination: true,
    timeTaken: 45,
    energyUsed: 30,
    obstaclesEncountered: 2,
    pathEfficiency: 0.85
  }
);
```

### Recording Player Navigation

```typescript
// Record player navigation for clustering
navManager.recordPlayerNavigation('player_001', {
  waypoints: [
    { x: 10, y: 10, timestamp: Date.now() },
    { x: 20, y: 15, timestamp: Date.now() + 1000 },
    { x: 30, y: 20, timestamp: Date.now() + 2000 }
  ],
  start: { x: 10, y: 10 },
  end: { x: 30, y: 20 },
  purpose: 'exploration',
  duration: 2000,
  detours: 1,
  backtracking: 0,
  transportMode: 'walking'
});
```

### Handling World Changes

```typescript
import { WorldChange, WorldChangeType } from './ai/navigation';

// Register a world change (e.g., construction blocking a road)
const change: WorldChange = {
  id: 'construction_001',
  type: WorldChangeType.CONSTRUCTION,
  position: { x: 50, y: 50 },
  radius: 10,
  severity: 0.8,
  estimatedDuration: 300000, // 5 minutes
  timestamp: Date.now(),
  description: 'Road construction blocking main route',
  affectedRoutes: [
    { start: { x: 10, y: 10 }, end: { x: 100, y: 100 } }
  ]
};

navManager.registerWorldChange(change);
```

## 🏗️ Architecture

### System Components

1. **HierarchicalPathfinding**: Chunk-based pathfinding for large worlds
2. **RLNavigationAgent**: Q-learning agent for adaptive navigation
3. **ContextAwareNavigation**: Purpose-driven navigation planning
4. **HumanNavigationClustering**: Player behavior analysis and clustering
5. **MultiModalTransport**: Intelligent transport mode selection
6. **DynamicWorldAdaptation**: Handling dynamic world changes
7. **OpenWorldNavigationManager**: Main integration manager

### Data Flow

```
Navigation Request
    ↓
OpenWorldNavigationManager
    ↓
├─→ DynamicWorldAdaptation (check for blockages)
├─→ RLNavigationAgent (check learned routes)
├─→ ContextAwareNavigation (generate plan)
├─→ HierarchicalPathfinding (find path)
├─→ MultiModalTransport (select transport)
    ↓
Navigation Result
```

## 🔬 Research Features

### Hierarchical Pathfinding Research Questions
- What's the optimal chunk size for different terrain types?
- How to handle dynamic obstacles spanning multiple chunks?
- When should we recompute the abstract graph?
- How to balance computation between hierarchy levels?

### Reinforcement Learning Research
- Can NPCs learn to navigate like humans through experience?
- What reward function produces the most human-like behavior?
- How does exploration rate decay affect learning?
- What's the optimal state space discretization?

### Context-Aware Navigation Research
- How does purpose change navigation behavior?
- What factors influence transport choice?
- How do social constraints affect path selection?
- Can we predict navigation needs from context?

### Human Clustering Research
- How many distinct navigation styles exist?
- Can NPCs successfully imitate human navigation styles?
- What features best distinguish navigation personalities?
- How stable are navigation styles over time?

## 📊 Metrics & Evaluation

### Performance Metrics
- Pathfinding Success Rate
- Average Travel Time
- Computational Efficiency
- Memory Usage
- Collision Frequency
- Route Optimality Gap

### Behavioral Metrics
- Human Likeness Score
- Style Consistency
- Adaptation Speed
- Decision Transparency
- Social Compliance

### Immersion Metrics
- Player Suspension of Disbelief
- NPC Behavior Noticeability
- World Believability
- Emergent Story Potential

## 🚀 Future Enhancements

1. **Deep Q-Networks**: Replace Q-tables with neural networks for continuous state spaces
2. **Imitation Learning**: Directly learn from player demonstrations
3. **Social Navigation**: Group coordination and crowd navigation
4. **Predictive Pathfinding**: Anticipate future obstacles and plan accordingly
5. **Emotional Navigation**: Emotions affect navigation decisions
6. **Long-term Memory**: Remember routes and locations across sessions

## 📝 Integration with Existing Systems

The navigation system integrates with:
- `AIPathfinding.ts`: Can use existing pathfinding as fallback
- `UnitAgent.ts`: Provides navigation decisions to unit agents
- `ChunkManager.ts`: Uses chunk system for hierarchical pathfinding
- `TerrainSystem.ts`: Considers terrain properties in navigation

## 🔧 Configuration

All systems are configurable through the `NavigationConfig` interface:

```typescript
const config: NavigationConfig = {
  useHierarchicalPathfinding: true,  // Enable HPA*
  useReinforcementLearning: true,    // Enable RL learning
  useContextAwareness: true,         // Enable context-aware planning
  useHumanClustering: true,           // Enable player clustering
  useMultiModalTransport: true,      // Enable transport selection
  useDynamicAdaptation: true,        // Enable world change handling
  chunkSize: 32                      // Chunk size for HPA*
};
```

## 📚 References

Based on research in:
- Hierarchical Pathfinding A* (HPA*)
- Q-Learning for navigation
- Human behavior analysis
- Multi-modal transportation planning
- Dynamic environment adaptation


