# Generative NPC System

A comprehensive implementation of believable NPCs with generative behavior, based on Stanford Generative Agents research.

## Overview

This system creates NPCs that exhibit human-like behavior through a cognitive architecture combining:

1. **Memory Stream** - Stores observations with importance scoring
2. **Reflection System** - Synthesizes memories into higher-level insights
3. **Planning System** - Generates hierarchical action plans
4. **OCEAN Personality** - Big Five personality model
5. **Emotional Modeling** - Russell's Circumplex Model (Valence-Arousal)
6. **Relationship System** - Tracks NPC-NPC and NPC-Player relationships

## Core Components

### EnhancedMemoryStream

Stores observations with weighted retrieval based on:
- **Recency**: Exponential decay over time
- **Relevance**: Semantic similarity to query
- **Importance**: LLM-scored importance (0-10)

```typescript
const memoryStream = new EnhancedMemoryStream(llm);
await memoryStream.addObservation("Player helped me with a quest", ['quest', 'positive']);
const memories = await memoryStream.retrieveMemories({
  query: "player interaction",
  limit: 10
});
```

### ReflectionSystem

Converts raw observations into abstract insights. Reflection is triggered when cumulative importance exceeds a threshold (default 150).

```typescript
const reflectionSystem = new ReflectionSystem(memoryStream, llm);
const reflection = await reflectionSystem.processObservation(memory);
// Generates insights like "I trust this player" or "I enjoy trading"
```

### PlanningSystem

Creates hierarchical action plans:
- High-level goals (e.g., "Have a productive work day")
- Hourly breakdowns ("9-10am: Work on project")
- 15-minute action granularities

```typescript
const planningSystem = new PlanningSystem(memoryStream, reflectionSystem, llm);
const plan = await planningSystem.generatePlan(context, 8); // 8-hour plan
```

### OCEANPersonality

Big Five personality traits (0-1 scale):
- **Openness**: Receptiveness to new experiences
- **Conscientiousness**: Organization and discipline
- **Extraversion**: Sociability
- **Agreeableness**: Cooperativeness
- **Neuroticism**: Emotional stability (inverted)

```typescript
const personality = OCEANPersonalitySystem.fromArchetype('greedy_trader');
const traits = OCEANPersonalitySystem.getTraits(personality);
// Returns: ['organized', 'disciplined', 'competitive', 'skeptical']
```

### EmotionalModel

Tracks emotions and mood using Russell's Circumplex Model:
- **Valence**: -1 (negative) to 1 (positive)
- **Arousal**: 0 (calm) to 1 (excited)

```typescript
const emotionalModel = new EmotionalModel(personality);
await emotionalModel.processEvent('successful_trade');
const mood = emotionalModel.getMood();
// Returns current mood with valence, arousal, and dominant emotion
```

### RelationshipSystem

Tracks relationships with strength (0-100), history, and subjective knowledge:

```typescript
const relationshipSystem = new RelationshipSystem();
relationshipSystem.recordInteraction(playerId, {
  type: 'positive',
  description: 'Player helped with quest',
  impact: 5
});
const summary = relationshipSystem.getSummary(playerId);
// Returns: strength, sentiment, trust level, familiarity
```

## Complete GenerativeNPC

The `GenerativeNPC` class integrates all systems:

```typescript
import { GenerativeNPC } from './generative/GenerativeNPC';
import { LLMIntegration } from './integrations/LLMIntegration';

// Create LLM integration
const llm = new LLMIntegration({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY
});

// Create generative NPC
const npc = new GenerativeNPC({
  id: 'trader_1',
  name: 'Marcus',
  role: 'trader',
  position: { x: 100, y: 200 },
  personality: 'honest_trader', // or custom OCEAN scores
  llm
});

// Process events
await npc.processEvent('Player greeted me warmly', 'player_123', 'player');
await npc.processEvent('Combat nearby, feeling anxious', undefined, 'npc');

// Generate dialogue
const dialogue = await npc.generateDialogue(
  'Hello, I need some resources',
  'player_123'
);
// NPC responds based on memory, relationship, mood, and personality

// Update NPC (call every game tick)
await npc.update(Date.now(), gameState);

// Get NPC state
const state = npc.getState();
const mood = npc.getMood();
const relationship = npc.getRelationship('player_123');
```

## Features

### Memory & Reflection

- **Importance Scoring**: LLM evaluates how important each event is
- **Weighted Retrieval**: Combines recency, relevance, and importance
- **Reflection Synthesis**: Converts experiences into abstract insights
- **Memory Consolidation**: Older memories are summarized

### Planning & Behavior

- **Hierarchical Planning**: Goals → Hourly plans → 15-minute actions
- **Reactive Adjustment**: Plans adapt to significant events
- **Personality-Driven**: Plans reflect NPC's personality traits
- **Dynamic Goals**: Goals emerge from reflections and current state

### Personality & Emotions

- **OCEAN Model**: Five-factor personality system
- **Emotion Elicitors**: Events trigger appropriate emotions
- **Mood System**: Mid-term affective state influences behavior
- **Personality Modulation**: Traits affect emotion intensity and behavior

### Relationships

- **Relationship Strength**: 0-100 scale tracking closeness
- **Interaction History**: Detailed log of past interactions
- **Subjective Knowledge**: NPCs build opinions about others
- **Dynamic Updates**: Relationships change based on events

## Integration Example

```typescript
import { EnhancedNPCTraderSystem } from './systems/EnhancedNPCTraderSystem';

// Create trader system
const traderSystem = new EnhancedNPCTraderSystem({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY
});

// Create trader
const trader = await traderSystem.createTrader(
  'trader_1',
  'Marcus',
  { x: 100, y: 200 },
  'honest_trader'
);

// Generate trade offer with dialogue
const offer = await traderSystem.generateTradeOffer(
  'trader_1',
  'ore',
  50,
  'player_123'
);
// Returns: { traderId, resource, amount, price, dialogue }
// Dialogue is generated based on:
// - Past interactions with player
// - Current mood
// - Relationship strength
// - Personality traits

// Execute trade
const result = await traderSystem.executeTrade(
  'trader_1',
  'player_123',
  'ore',
  50,
  100
);
// NPC remembers the trade and relationship updates

// Update traders (call every game tick)
await traderSystem.update(gameState, Date.now());
```

## Research Basis

This implementation is based on:

1. **Stanford Generative Agents** (Park et al., 2023)
   - Memory stream with importance scoring
   - Reflection synthesis
   - Hierarchical planning

2. **OCEAN Personality Model**
   - Big Five framework
   - Personality-consistent behavior

3. **Emotion Behavior Tree (EmoBeT)**
   - Russell's Circumplex Model
   - Emotion elicitors
   - Mood-driven behavior

4. **AgentSociety** (Piao et al., 2025)
   - Large-scale social simulation
   - Relationship tracking
   - Dynamic group behavior

## Performance Considerations

- **Token Limits**: Memory retrieval uses weighted scoring to stay within token budgets
- **Reflection Cooldown**: Minimum 1 hour between reflections to prevent spam
- **Memory Limits**: Maximum 1000 memories per NPC (least important removed)
- **Caching**: LLM responses can be cached for repeated queries

## Future Enhancements

- [ ] Embedding-based semantic search for memory retrieval
- [ ] Cross-platform persistent memory (game + Discord)
- [ ] NPC-NPC social dynamics and gossip
- [ ] Daily routine templates with dynamic variation
- [ ] Group coordination (NPCs planning events together)

