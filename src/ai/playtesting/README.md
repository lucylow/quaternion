# General Game-Playing AI for Testing & Balancing

A comprehensive automated playtesting system that uses procedural personas and MCTS to test game balance without prior specific knowledge.

## Overview

This system implements **General Video Game AI (GVGAI)** principles to create automated playtesting agents that can competently test a wide variety of game mechanics and levels. It combines:

- **Procedural Personas**: Different player archetypes (Efficiency Expert, Explorer, Aggressive Rusher, etc.)
- **Monte Carlo Tree Search (MCTS)**: General game-playing algorithm that doesn't require game-specific knowledge
- **Balance Detection**: Automated identification of balance issues, difficulty spikes, and strategy dominance
- **Exploit Detection**: Adversarial testing to find vulnerabilities and exploits

## Features

### 🎭 Procedural Personas

Eight distinct player archetypes that simulate different play styles:

- **Efficiency Expert**: Optimizes resource usage and shortest paths
- **Explorer**: Seeks novel strategies and explores unknown areas
- **Cautious Navigator**: Prioritizes risk avoidance and defensive play
- **Social Navigator**: Prefers populated routes and cooperative patterns
- **Adventurous Player**: Embraces novel and challenging situations
- **Aggressive Rusher**: Focuses on early military aggression
- **Defensive Turtler**: Builds strong defenses before attacking
- **Tech Focused**: Prioritizes technology research and upgrades

Each persona uses evolved heuristics that replace the standard UCB1 criterion in MCTS, creating synthetic playtesters that reveal how different player populations experience game content.

### ⚖️ Balance Detection

Automatically detects:

- **Win Rate Imbalances**: Strategies with >55% or <45% win rate
- **Pickrate vs Winrate Coupling**: High pickrate + high winrate = dominant strategy
- **Difficulty Spikes**: Violations of smooth progression curves (>2 standard deviations)
- **Resource Imbalances**: Significant variance in resource efficiency
- **Unwinnable/Trivial Games**: Games that are too easy or too hard

### 🔍 Exploit Detection

Identifies vulnerabilities through adversarial testing:

- **Resource Loops**: Infinite resource generation patterns
- **Edge Cases**: Boundary conditions and null/undefined handling issues
- **Mechanical Breaks**: Action combinations that break game balance
- **State Anomalies**: Unexpected state transitions
- **Performance Issues**: Games that take too long or generate too many actions

## Usage

### Basic Playtesting

```typescript
import { PlaytestingCoordinator, PersonaType } from './ai/playtesting';
import { QuaternionGameState } from './game/QuaternionGameState';

const coordinator = new PlaytestingCoordinator();

// Run playtest session
const session = await coordinator.runPlaytestSession(
  (seed) => new QuaternionGameState({
    seed,
    mapWidth: 64,
    mapHeight: 64,
    aiDifficulty: 'medium'
  }),
  {
    personas: [
      PersonaType.EFFICIENCY_EXPERT,
      PersonaType.AGGRESSIVE_RUSHER,
      PersonaType.DEFENSIVE_TURTLER
    ],
    gamesPerPersona: 10,
    maxTicks: 5000,
    parallel: true // Run games in parallel for faster testing
  }
);

// Generate summary
const summary = coordinator.generateSummary(session);

console.log('Balance Status:', summary.balanceStatus);
console.log('Critical Issues:', summary.criticalIssues);
console.log('Recommendations:', summary.recommendations);
```

### Using Individual Components

```typescript
import { PlaytestingAgent, PersonaType } from './ai/playtesting';

// Create a playtesting agent with a specific persona
const agent = new PlaytestingAgent(PersonaType.EFFICIENCY_EXPERT, playerId);

// Update agent with game state
agent.update(gameState);

// Get best action for this persona
const action = agent.getBestAction();

// Execute action in game...
// ...game loop...

// Get playtest result
const result = agent.getPlaytestResult('win', finalScore);
```

### Balance Analysis

```typescript
import { BalanceDetector } from './ai/playtesting';

const detector = new BalanceDetector();
detector.addPlaytestResults(playtestResults);

const report = detector.analyzeBalance();

console.log('Overall Balance:', report.overallBalance);
console.log('Issues Found:', report.issues.length);
console.log('Recommendations:', report.recommendations);
```

### Exploit Detection

```typescript
import { ExploitDetector } from './ai/playtesting';

const detector = new ExploitDetector();
const exploits = detector.analyzeForExploits(playtestResults);

exploits.forEach(exploit => {
  console.log(`${exploit.severity}: ${exploit.description}`);
  if (exploit.reproductionSteps) {
    console.log('Reproduction:', exploit.reproductionSteps);
  }
});
```

## Architecture

```
PlaytestingCoordinator
├── PlaytestingAgent (per persona)
│   ├── ProceduralPersona (personality traits)
│   └── MCTS (Monte Carlo Tree Search)
├── BalanceDetector
│   ├── Win Rate Analysis
│   ├── Pickrate Analysis
│   ├── Difficulty Curve Analysis
│   └── Resource Efficiency Analysis
└── ExploitDetector
    ├── Resource Loop Detection
    ├── Edge Case Detection
    ├── Mechanical Break Detection
    └── State Anomaly Detection
```

## Metrics

The system tracks comprehensive metrics:

- **Win Rates**: By strategy/persona
- **Pick Rates**: Strategy popularity
- **Difficulty Curves**: Smoothness of progression
- **Resource Efficiency**: Resource usage patterns
- **Strategy Dominance**: Win rate × Pick rate
- **Game Duration**: Average and variance
- **Action Sequences**: Patterns in decision-making

## Integration with Game

To integrate with your game:

1. **Implement Game State Factory**: Create a function that generates game states with different seeds
2. **Connect Action Execution**: Wire up action execution to your game's command system
3. **Implement Game Tick Simulation**: Connect to your game's update loop
4. **Add UI Dashboard**: Use `PlaytestDashboard` component to visualize results

Example integration:

```typescript
// In your game code
const coordinator = new PlaytestingCoordinator();

const session = await coordinator.runPlaytestSession(
  (seed) => {
    const gameState = new QuaternionGameState({
      seed,
      mapWidth: 64,
      mapHeight: 64,
      aiDifficulty: 'medium'
    });
    // Initialize game state...
    return gameState;
  },
  {
    personas: Object.values(PersonaType),
    gamesPerPersona: 5,
    maxTicks: 5000
  }
);

// Display results
const summary = coordinator.generateSummary(session);
// Show in UI or log to console
```

## Research Basis

This implementation is based on:

- **Holmgård et al.**, "Automated Playtesting with Procedural Personas through MCTS with Evolved Heuristics" (IEEE, 2018)
- **Perez-Liebana et al.**, "General Video Game AI: a Multi-Track Framework for Evaluating Agents, Games and Content Generation Algorithms" (IEEE ToG, 2019)
- **Jaffe et al.**, "Evaluating Competitive Game Balance with Restricted Play" (2012)
- **Politowski et al.**, "Assessing Video Game Balance using Autonomous Agents" (2023)
- **Wilkins et al.**, "A Metric Learning Approach to Anomaly Detection in Video Games" (IEEE CoG, 2020)

## Performance

- **Decision Speed**: ~1-5ms per decision (depending on MCTS rollouts)
- **Game Simulation**: Can run 1000+ games per hour on modern hardware
- **Parallel Execution**: Supports parallel game execution for faster testing
- **Memory Usage**: Efficient caching and state management

## Future Enhancements

- [ ] Integration with procedural content generation
- [ ] Real-time playtesting during development
- [ ] Machine learning-based persona evolution
- [ ] Advanced anomaly detection using deep learning
- [ ] Integration with game analytics systems
- [ ] Automated balance adjustment suggestions

## License

Part of the Quaternion game project for Chroma Awards AI Games competition.

