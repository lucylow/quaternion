# Generative NPCs Implementation

## Overview

A comprehensive implementation of believable NPCs with generative behavior, based on Stanford Generative Agents research. This system creates NPCs that remember past interactions, form opinions, and have dynamic goals and schedules.

## Architecture

The system implements a complete cognitive architecture with six core components:

### 1. Enhanced Memory Stream (`EnhancedMemoryStream.ts`)

- **Weighted Retrieval**: Combines recency, relevance, and importance
- **LLM-Based Importance Scoring**: Each memory is scored 0-10 by asking "How important is this event to you?"
- **Automatic Memory Management**: Removes least important memories when limit reached
- **Entity-Specific Memories**: Track memories related to specific players or NPCs

**Key Features:**
- Exponential decay for recency (configurable decay rate)
- Semantic similarity for relevance (can be enhanced with embeddings)
- Importance-weighted retrieval prevents forgetting critical events

### 2. Reflection System (`ReflectionSystem.ts`)

- **Automatic Reflection**: Triggered when cumulative importance exceeds threshold (default 150)
- **Question Generation**: LLM generates questions about recent experiences
- **Insight Extraction**: Synthesizes memories into abstract patterns
- **Reflection Tree**: Creates hierarchical understanding (observations → reflections → core truths)

**Example Reflections:**
- "I trust this player based on our past interactions"
- "I enjoy trading more than combat"
- "Players who help me tend to be reliable"

### 3. Planning System (`PlanningSystem.ts`)

- **Hierarchical Decomposition**: Goals → Hourly plans → 15-minute actions
- **Context-Aware Planning**: Incorporates current state, memories, and reflections
- **Reactive Adjustment**: Plans adapt to significant events
- **Re-planning Triggers**: Automatically re-plans when critical events occur

**Planning Levels:**
1. High-level goals (e.g., "Have a productive work day")
2. Hourly breakdowns ("9-10am: Work on project")
3. 15-minute action granularities

### 4. OCEAN Personality Model (`OCEANPersonality.ts`)

- **Big Five Framework**: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- **Archetype System**: Pre-defined personality archetypes (greedy_trader, honest_trader, etc.)
- **Trait Extraction**: Automatically generates descriptive traits from OCEAN scores
- **Behavioral Influence**: Personality modifies risk tolerance, cooperation, social activity

**Archetypes Included:**
- `greedy_trader`: Low openness, high conscientiousness, high extraversion, low agreeableness
- `honest_trader`: Balanced, high conscientiousness and agreeableness
- `cautious_trader`: Low openness and extraversion, high neuroticism
- `charismatic_trader`: High openness and extraversion
- Commander archetypes: aggressive, defensive, strategic

### 5. Emotional Modeling (`EmotionalModel.ts`)

- **Russell's Circumplex Model**: Valence (-1 to 1) and Arousal (0 to 1)
- **24 Emotion Types**: Joy, sadness, fear, anger, disgust, surprise, and variants
- **Emotion Elicitors**: Events trigger appropriate emotions (e.g., "successful_trade" → joy)
- **Personality Modulation**: Neuroticism increases negative emotion intensity
- **Mood System**: Mid-term affective state influences behavior

**Emotion Properties:**
- Each emotion has valence (positive/negative) and arousal (calm/excited)
- Duration calculated based on emotion type and intensity
- Mood aggregates recent emotions to determine current state

### 6. Relationship System (`RelationshipSystem.ts`)

- **Relationship Strength**: 0-100 scale tracking closeness/trust
- **Interaction History**: Detailed log of all interactions
- **Subjective Knowledge**: NPCs build opinions about others
- **Dynamic Updates**: Relationships change based on events
- **Sentiment Analysis**: Positive, neutral, or negative sentiment
- **Familiarity Levels**: Stranger, acquaintance, friend, close friend, enemy

**Relationship Tracking:**
- Records every interaction with impact scores (-10 to 10)
- Maintains knowledge about other entities
- Provides relationship summaries for dialogue generation

## Complete Integration: GenerativeNPC

The `GenerativeNPC` class combines all systems into a single cohesive entity:

```typescript
const npc = new GenerativeNPC({
  id: 'trader_1',
  name: 'Marcus',
  role: 'trader',
  position: { x: 100, y: 200 },
  personality: 'honest_trader',
  llm: llmIntegration
});

// Process events (automatically stored in memory, triggers emotions, updates relationships)
await npc.processEvent('Player helped me with a quest', 'player_123', 'player');

// Generate dialogue (uses memory, relationship, mood, personality)
const dialogue = await npc.generateDialogue('Hello!', 'player_123');

// Update NPC (processes plans, updates state)
await npc.update(Date.now(), gameState);
```

## Usage Example

### Creating a Trader with Generative Behavior

```typescript
import { EnhancedNPCTraderSystem } from './ai/systems/EnhancedNPCTraderSystem';
import { LLMIntegration } from './ai/integrations/LLMIntegration';

// Initialize LLM
const llm = new LLMIntegration({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY
});

// Create trader system
const traderSystem = new EnhancedNPCTraderSystem({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY
});

// Create trader with personality
const trader = await traderSystem.createTrader(
  'trader_1',
  'Marcus',
  { x: 100, y: 200 },
  'honest_trader' // or custom OCEAN personality
);

// Generate trade offer (dialogue is context-aware)
const offer = await traderSystem.generateTradeOffer(
  'trader_1',
  'ore',
  50,
  'player_123'
);
// Dialogue reflects:
// - Past interactions with player
// - Current mood
// - Relationship strength
// - Personality traits

// Execute trade (updates memory and relationship)
await traderSystem.executeTrade(
  'trader_1',
  'player_123',
  'ore',
  50,
  100
);

// Update traders every game tick
await traderSystem.update(gameState, Date.now());
```

## Key Features

### Memory & Recall

- NPCs remember past interactions with players
- Memories are weighted by importance, recency, and relevance
- Reflection system creates higher-level insights
- Memory retrieval stays within token limits

### Dynamic Behavior

- NPCs generate plans based on current state
- Plans adapt to significant events
- Personality influences decision-making
- Emotions affect behavior (negative mood = more cautious)

### Relationship Building

- NPCs track relationships with all entities
- Relationships evolve based on interactions
- NPCs form opinions about others
- Relationship strength affects dialogue tone

### Personality Consistency

- OCEAN traits influence all behavior
- Speech style matches personality
- Emotional reactions are personality-consistent
- Decision-making reflects traits

## Research Basis

This implementation is based on:

1. **Generative Agents: Interactive Simulacra of Human Behavior** (Park et al., Stanford, 2023)
   - Memory stream architecture
   - Reflection synthesis
   - Hierarchical planning

2. **OCEAN Personality Model**
   - Big Five framework
   - Personality-consistent behavior validation

3. **Emotion Behavior Tree (EmoBeT)**
   - Russell's Circumplex Model
   - Emotion elicitors and mood system

4. **AgentSociety** (Piao et al., 2025)
   - Large-scale social simulation
   - Relationship tracking and dynamics

## Performance Optimizations

- **Token Management**: Weighted memory retrieval prevents token exhaustion
- **Reflection Cooldown**: Minimum 1 hour between reflections
- **Memory Limits**: Maximum 1000 memories per NPC
- **Efficient Retrieval**: Only most relevant memories retrieved per query

## Files Created

1. `src/ai/generative/EnhancedMemoryStream.ts` - Memory system with importance scoring
2. `src/ai/generative/ReflectionSystem.ts` - Reflection synthesis system
3. `src/ai/generative/PlanningSystem.ts` - Hierarchical planning system
4. `src/ai/generative/OCEANPersonality.ts` - Personality model and archetypes
5. `src/ai/generative/EmotionalModel.ts` - Emotion and mood tracking
6. `src/ai/generative/RelationshipSystem.ts` - Relationship management
7. `src/ai/generative/GenerativeNPC.ts` - Complete NPC integration
8. `src/ai/generative/index.ts` - Module exports
9. `src/ai/systems/EnhancedNPCTraderSystem.ts` - Enhanced trader system using GenerativeNPC
10. `src/ai/generative/README.md` - Detailed documentation

## Integration with Existing Systems

The new system can be integrated with existing NPC systems:

- **NPCTraderSystem**: Can be gradually migrated to use `EnhancedNPCTraderSystem`
- **MemoryManager**: `EnhancedMemoryStream` provides more sophisticated retrieval
- **LLMIntegration**: Already compatible, no changes needed

## Next Steps

1. **Testing**: Create unit tests for each component
2. **Integration**: Integrate with game state management
3. **Persistence**: Add database storage for NPC memories and relationships
4. **Optimization**: Implement embedding-based semantic search
5. **Expansion**: Add more NPC types (quest givers, commanders, etc.)

## Metrics to Track

- Number of daily interactions per NPC
- Percentage of responses referencing prior memories
- Relationship strength changes over time
- Reflection frequency and quality
- Plan execution success rate

These metrics demonstrate the system's effectiveness for Chroma Awards submission.

