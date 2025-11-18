# AI Memory Management System

This module implements advanced memory management for AI-driven game systems, based on research into LLM-driven narratives and NPC behavior.

## Features

### 1. MemoryManager
- **Persistent Memory Storage**: Stores memories for NPCs, commanders, and narrative entities
- **RAG Capabilities**: Retrieval-augmented generation for context-aware responses
- **Automatic Summarization**: Compresses old memories to maintain performance
- **Importance Scoring**: Prioritizes important memories over trivial ones
- **Relationship Tracking**: Maintains relationship scores between entities

### 2. ContextCompressor
- **Conversation Compression**: Reduces long conversation histories to manageable sizes
- **LLM-Powered Summarization**: Uses LLMs to create intelligent summaries
- **Token Management**: Ensures prompts stay within token limits
- **Key Fact Extraction**: Identifies and preserves important information

### 3. StructuredOutputParser
- **Reliable JSON Parsing**: Extracts structured data from LLM responses
- **XML Tag Support**: Parses XML-like tags for state changes
- **Error Handling**: Graceful fallbacks when parsing fails
- **Output Validation**: Validates parsed data against schemas

## Usage

### Basic Memory Management

```typescript
import { MemoryManager } from './memory';

const memoryManager = new MemoryManager();

// Store a memory
await memoryManager.storeMemory({
  entityId: 'trader_1',
  entityType: 'npc',
  content: 'Player traded 100 ore for 50 energy',
  metadata: {
    timestamp: Date.now(),
    importance: 0.7,
    tags: ['trade', 'ore', 'energy'],
    playerId: 'player_1'
  }
});

// Retrieve memories
const memories = await memoryManager.retrieveMemories({
  entityId: 'trader_1',
  entityType: 'npc',
  limit: 10,
  minImportance: 0.5
});

// Get compressed context for prompts
const context = await memoryManager.getCompressedContext(
  'trader_1',
  'npc',
  2000 // max tokens
);
```

### Context Compression

```typescript
import { ContextCompressor } from './memory';

const compressor = new ContextCompressor(llmConfig);

const compressed = await compressor.compressConversation(
  conversationTurns,
  2000 // max tokens
);

const formatted = compressor.formatContext(compressed);
```

### Structured Output Parsing

```typescript
import { StructuredOutputParser } from './memory';

const parser = new StructuredOutputParser();

// Parse JSON
const result = parser.parseJSON<MyType>(llmResponse);

// Parse structured output
const structured = parser.parseStructuredOutput(llmResponse);

// Validate output
const validation = parser.validateOutput(data, {
  required: ['narrative', 'choices'],
  types: { narrative: 'string', choices: 'object' }
});
```

## Integration with NPC Systems

The memory system is integrated into `NPCTraderSystem`:

```typescript
import { NPCTraderSystem } from './systems/NPCTraderSystem';

const npcSystem = new NPCTraderSystem(llmConfig);

// Create trader with personality
const trader = await npcSystem.createTrader('trader_1', 'Marcus', { x: 100, y: 200 });

// Generate dialogue with memory context
const offer = await npcSystem.generateTradeOffer('trader_1', 'ore', 50);

// Record player dialogue
npcSystem.recordPlayerDialogue('trader_1', 'player_1', 'I need more energy');

// Get memory summary
const memory = await npcSystem.getTraderMemory('trader_1');
```

## Best Practices

1. **Importance Scoring**: Use importance scores (0-1) to prioritize memories
   - 0.9+: Critical events (major trades, relationship changes)
   - 0.7-0.9: Important interactions
   - 0.5-0.7: Regular interactions
   - <0.5: Trivial events

2. **Tagging**: Use descriptive tags for better retrieval
   - Resource types: 'ore', 'energy', 'biomass'
   - Event types: 'trade', 'dialogue', 'combat'
   - Relationship: 'positive', 'negative', 'neutral'

3. **Context Limits**: Keep compressed contexts under 2000 tokens for best performance

4. **Memory Persistence**: Export/import memories for cross-session persistence

## Research Basis

This implementation is based on research into:
- LLM-driven dynamic narratives (AI Dungeon, NarrativePlay, Hidden Door)
- Memory management for NPCs (Cross-Platform NPC Demo)
- Context compression techniques (Ian Bicking's experiments)
- RAG for game narratives (vector databases, semantic search)

## Future Enhancements

- Vector embeddings for semantic search
- Database persistence (Supabase integration)
- Cross-platform memory sync
- Advanced relationship modeling
- Emotion tracking in memories

