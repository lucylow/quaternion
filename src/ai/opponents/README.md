# Enhanced AI Opponents System

A comprehensive AI opponent system that creates intelligent, adaptive, and memorable adversaries for the game. This system implements personality-driven commanders, learning algorithms, psychological warfare, and various specialized AI behaviors.

## Features

### 1. Personality-Driven AI Commanders
- **Dynamic Personality Matrix**: Traits that adapt based on player strategies
- **Commander Archetypes**: Unique commander types with distinct behaviors:
  - **The Innovator**: Unconventional strategies, tech rushes
  - **The Butcher**: Constant attacks, sacrifices economy for military
  - **The Spider**: Methodical expansion, strong defenses
  - **The Mirror**: Copies and improves player strategies
  - **The Tactician**: Balanced approach with tactical focus
  - **The Economist**: Economic superiority focus
  - **The Wildcard**: Completely unpredictable, chaotic strategies

### 2. Learning and Adaptation
- **Strategy Memory**: Remembers player strategies and develops counters
- **Real-Time Adaptation**: Adjusts personality traits based on success/failure
- **Counter-Strategy Development**: Analyzes weaknesses and generates effective counters

### 3. Psychological Warfare
- **Deception AI**: Feints, false retreats, bait and switch tactics
- **Emotional Manipulation**: Taunts and mind games to influence player decisions
- **Player Susceptibility Tracking**: Learns what tricks work on the player

### 4. Asymmetric AI Opponents
- **Non-Human Thinking**: Alien species with unique decision-making:
  - **Hive Mind**: Collective intelligence, unit sacrifice for strategic gain
  - **Quantum Entity**: Probability cloud analysis across multiple futures
  - **Biological Collective**: Evolutionary algorithm decision-making
  - **Crystalline Network**: Resonance pattern analysis
  - **Energy Being**: Energy flow optimization

### 5. Progressive AI Evolution
- **Skill-Based Evolution**: AI grows with player skill
- **Evolution Stages**: Newborn → Apprentice → Adept → Master → Legend
- **Unlocked Abilities**: New capabilities unlock as player improves

### 6. Cooperative AI Opponents
- **Team Coordination**: Multiple AI commanders working together
- **Role Assignment**: Specialized roles (attacker, defender, tech specialist, economist)
- **Coordinated Attacks**: Multi-pronged assaults with support

### 7. Environmental AI
- **Terrain Exploitation**: Uses chokepoints, high ground, ambush locations
- **Environmental Traps**: Area denial, ambushes, movement restrictions
- **Strategic Positioning**: Lures players into prepared advantages

### 8. Meta-Game AI
- **Cross-Session Learning**: Remembers player across multiple games
- **Player Tendency Analysis**: Identifies preferred openings and responses
- **Adaptive Initial Strategies**: Starts with strategies that worked before

### 9. Unpredictable AI
- **Chaos Theory**: Balances optimal play with chaotic behavior
- **Surprise Value**: Calculates how unexpected decisions are
- **Strange Attractors**: Patterns in the chaos

### 10. AI with Flaws and Quirks
- **Purposeful Imperfections**: Memorable character-driven AI
- **Obsessions**: Things the AI cares about too much
- **Irrational Fears**: Things the AI avoids irrationally
- **Quirk Development**: Can develop new quirks from traumatic experiences

## Usage

### Basic Usage

```typescript
import { EnhancedAIOpponent } from './ai/opponents';

// Create AI opponent
const aiOpponent = new EnhancedAIOpponent({
  seed: 12345,
  archetype: 'THE_INNOVATOR',
  enableDeception: true,
  enableEmotionalWarfare: true,
  enableEvolution: true,
  playerId: 'player_123'
});

// Make decision
const decision = aiOpponent.makeDecision(gameState);
console.log(decision.action); // 'attack', 'defend', etc.
console.log(decision.reasoning); // Explanation
console.log(decision.deception); // Optional deception plan
console.log(decision.emotionalTrigger); // Optional taunt

// Learn from outcome
aiOpponent.learnFromOutcome(
  true, // won
  'rush', // player strategy
  'defensive_turtle', // AI strategy
  600 // game duration in seconds
);
```

### Advanced Configuration

```typescript
const aiOpponent = new EnhancedAIOpponent({
  seed: 12345,
  archetype: 'THE_MIRROR',
  alienSpecies: 'hive_mind', // Use alien thinking
  chaosLevel: 0.4, // 40% chaos
  quirks: ['overvalues_cavalry', 'fears_naval_warfare'],
  enableDeception: true,
  enableEmotionalWarfare: true,
  enableEvolution: true,
  enablePersistence: true,
  playerId: 'player_123',
  skillTracker: playerSkillTracker,
  voiceSystem: voiceSystem,
  mapAnalyzer: mapAnalyzer
});
```

### Team Coordination

```typescript
import { AITeamCoordinator, AICommanderArchetypes } from './ai/opponents';

// Create multiple commanders
const commanders = [
  AICommanderArchetypes.createCommander('THE_BUTCHER', seed1),
  AICommanderArchetypes.createCommander('THE_SPIDER', seed2),
  AICommanderArchetypes.createCommander('THE_ECONOMIST', seed3)
];

// Create team coordinator
const teamCoordinator = new AITeamCoordinator(seed, commanders);

// Coordinate attack
const plan = teamCoordinator.coordinateAttack({ x: 500, y: 500 });
```

## Architecture

### Core Components

1. **AIPersonalityMatrix**: Dynamic personality with memory and adaptation
2. **AICommanderArchetypes**: Predefined commander types with traits
3. **AIStrategyLearner**: Learning and counter-strategy development
4. **DeceptionAI**: Psychological warfare and deception tactics
5. **EmotionalManipulator**: Taunts and emotional manipulation
6. **AsymmetricAI**: Non-human thinking patterns
7. **EvolvingAI**: Progressive skill-based evolution
8. **AITeamCoordinator**: Multi-commander coordination
9. **EnvironmentalStrategist**: Terrain-based strategies
10. **PersistentAI**: Cross-session learning
11. **ChaoticAI**: Unpredictable behavior
12. **QuirkyAI**: Flaws and quirks
13. **EnhancedAIOpponent**: Main integration class

### Integration Points

The system integrates with:
- **Game State**: Receives game state for decision-making
- **Voice System**: Plays taunts and voice lines
- **Map Analyzer**: Analyzes terrain for strategic advantages
- **Skill Tracker**: Tracks player skill for evolution
- **Player ID**: Enables cross-session learning

## Design Philosophy

The Enhanced AI Opponents system is designed to create:

1. **Intelligent but not Perfect**: AI makes good decisions but has flaws
2. **Challenging but Fair**: Adapts to player skill level
3. **Memorable Characters**: Each AI has distinct personality and quirks
4. **Learning and Adaptation**: Gets better over time
5. **Psychological Depth**: Uses mind games and deception
6. **Variety**: Different archetypes and behaviors for replayability

## Future Enhancements

- Integration with actual game state analysis
- More sophisticated deception tactics
- Advanced emotional state detection
- Machine learning integration for strategy prediction
- Voice synthesis for taunts
- Visual personality indicators in UI
- Replay analysis and strategy recommendations

