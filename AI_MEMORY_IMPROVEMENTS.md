# AI Memory System Improvements

## Overview

This document summarizes the comprehensive AI memory and narrative improvements made to Quaternion based on research into LLM-driven dynamic narratives, persistent NPC memory, and context management.

## Research Basis

The improvements are based on research from:
- **AI Dungeon** (2019): LLM-driven text adventures with infinite freedom
- **NarrativePlay** (2023): Character-driven narratives with memory
- **Hidden Door** (2024-25): LLM-driven story games with grounding
- **Cross-Platform NPC Demo** (2024): Persistent memory across platforms
- **Ian Bicking's experiments**: Context compression and summarization techniques

## New Systems Implemented

### 1. Memory Management System (`src/ai/memory/MemoryManager.ts`)

A comprehensive memory system with RAG capabilities:

**Features:**
- Persistent memory storage for NPCs, commanders, and narrative entities
- Automatic summarization when memory count exceeds threshold (default: 20)
- Importance-based memory scoring and decay
- Relationship tracking between entities
- Compressed context generation for LLM prompts
- Export/import for cross-session persistence

**Key Methods:**
- `storeMemory()`: Store new memories with importance scoring
- `retrieveMemories()`: Query memories with filters (importance, tags, time)
- `getCompressedContext()`: Get token-limited context for prompts
- `summarizeMemories()`: Automatically compress old memories

**Example:**
```typescript
await memoryManager.storeMemory({
  entityId: 'trader_1',
  entityType: 'npc',
  content: 'Player traded 100 ore for 50 energy',
  metadata: {
    importance: 0.7,
    tags: ['trade', 'ore', 'energy'],
    playerId: 'player_1'
  }
});
```

### 2. Context Compression System (`src/ai/memory/ContextCompressor.ts`)

Intelligent conversation history compression:

**Features:**
- LLM-powered summarization of old conversation turns
- Token-aware compression to stay within limits
- Key fact extraction from conversations
- Simple fallback summarization when LLM unavailable

**Key Methods:**
- `compressConversation()`: Compress conversation history
- `formatContext()`: Format compressed context for prompts
- `compressGameState()`: Compress game state for context

**Example:**
```typescript
const compressed = await contextCompressor.compressConversation(
  conversationTurns,
  2000 // max tokens
);
```

### 3. Structured Output Parser (`src/ai/memory/StructuredOutputParser.ts`)

Reliable parsing of LLM responses:

**Features:**
- JSON extraction from mixed-format responses
- XML tag parsing (e.g., `<SET_FLAG>value</SET_FLAG>`)
- Output validation against schemas
- Graceful error handling with fallbacks

**Key Methods:**
- `parseJSON()`: Parse JSON from LLM response
- `parseXMLTags()`: Extract XML-like tags
- `parseStructuredOutput()`: Multi-format parsing
- `validateOutput()`: Schema validation

### 4. Enhanced NPC Trader System

The `NPCTraderSystem` has been significantly enhanced:

**New Features:**
- **Personality Generation**: LLM-generated trader personalities
- **Persistent Memory**: Traders remember past interactions
- **Relationship Tracking**: Reputation affects dialogue
- **Context-Aware Dialogue**: Dialogue references past events
- **Conversation History**: Maintains full conversation context

**Improvements:**
- `createTrader()` now generates personality using LLM
- `generateTradeDialogue()` includes memory context in prompts
- `executeTrade()` stores memories of all trades
- New methods: `getTraderMemory()`, `recordPlayerDialogue()`, `exportMemory()`

**Example:**
```typescript
// Create trader with generated personality
const trader = await npcSystem.createTrader('trader_1', 'Marcus', { x: 100, y: 200 });

// Generate dialogue with memory
const offer = await npcSystem.generateTradeOffer('trader_1', 'ore', 50);
// Dialogue will reference past interactions if relevant

// Record player dialogue
npcSystem.recordPlayerDialogue('trader_1', 'player_1', 'I need more energy');

// Get memory summary
const memory = await npcSystem.getTraderMemory('trader_1');
```

### 5. Enhanced Prompt Templates (`src/ai/promptTemplates/EnhancedPromptTemplates.ts`)

Improved prompt scaffolding with memory injection:

**Templates:**
- `EnhancedNPCDialogueTemplate`: Memory-aware NPC dialogue
- `EnhancedNarrativeEventTemplate`: Structured narrative events
- `EnhancedCommanderDialogueTemplate`: Commander personality dialogue
- `DynamicStoryTemplate`: Evolving story generation
- `MemoryAwarePromptBuilder`: Utility for memory injection

**Features:**
- Automatic memory context injection
- Personality section generation
- Structured output format instructions
- Player relationship context

## Integration Points

### NPC Systems
- `NPCTraderSystem` fully integrated with memory
- Traders remember past trades and conversations
- Dialogue adapts based on relationship history

### Commander Systems
- `EnhancedCommanderSystem` integrated with memory
- Commanders remember strategic decisions
- Personality-driven dialogue with memory context

### Narrative Systems
- Ready for integration with `NarrativeEventSystem`
- Memory can track campaign choices and outcomes
- Story generation can reference past events

## Best Practices

### Memory Importance Scoring
- **0.9+**: Critical events (major trades, relationship changes, story milestones)
- **0.7-0.9**: Important interactions (significant trades, key dialogue)
- **0.5-0.7**: Regular interactions (normal trades, casual dialogue)
- **<0.5**: Trivial events (minor actions, filler dialogue)

### Tagging Strategy
- **Resource types**: `ore`, `energy`, `biomass`, `data`
- **Event types**: `trade`, `dialogue`, `combat`, `narrative`
- **Relationship**: `positive`, `negative`, `neutral`
- **Context**: `creation`, `setup`, `milestone`

### Context Limits
- Keep compressed contexts under **2000 tokens** for best performance
- Summarize when memory count exceeds **20** per entity
- Use importance filters to retrieve only relevant memories

## Performance Considerations

1. **Memory Summarization**: Automatically triggers at 20 memories per entity
2. **Token Management**: Context compression ensures prompts stay within limits
3. **Caching**: Memory summaries are cached to avoid repeated computation
4. **Lazy Loading**: Memories are only retrieved when needed

## Future Enhancements

### Planned Features
1. **Vector Embeddings**: Semantic search for better memory retrieval
2. **Database Persistence**: Supabase integration for cross-session memory
3. **Cross-Platform Sync**: Memory shared across game sessions
4. **Advanced Relationships**: Multi-dimensional relationship modeling
5. **Emotion Tracking**: Emotional state in memories
6. **Memory Visualization**: Debug tools for viewing memory state

### Research Opportunities
- Implement vector database (e.g., Pinecone, Weaviate) for semantic search
- Add emotion/affect tracking based on interaction outcomes
- Create memory visualization tools for debugging
- Implement memory "fading" based on time and importance
- Add memory "consolidation" for long-term story coherence

## Files Created/Modified

### New Files
- `src/ai/memory/MemoryManager.ts` - Core memory management
- `src/ai/memory/ContextCompressor.ts` - Conversation compression
- `src/ai/memory/StructuredOutputParser.ts` - Output parsing
- `src/ai/memory/index.ts` - Module exports
- `src/ai/memory/README.md` - Documentation
- `src/ai/promptTemplates/EnhancedPromptTemplates.ts` - Enhanced templates
- `AI_MEMORY_IMPROVEMENTS.md` - This document

### Modified Files
- `src/ai/systems/NPCTraderSystem.ts` - Enhanced with memory
- `src/ai/systems/EnhancedCommanderSystem.ts` - Memory integration

## Testing Recommendations

1. **Memory Storage**: Verify memories are stored correctly with proper importance
2. **Context Compression**: Test that compressed contexts stay within token limits
3. **Dialogue Quality**: Verify NPCs reference past interactions appropriately
4. **Performance**: Monitor memory system performance with many entities
5. **Persistence**: Test export/import for cross-session memory

## Conclusion

These improvements transform Quaternion's AI systems from simple dialogue generators into sophisticated, memory-aware agents that create persistent, evolving relationships with players. The implementation follows research best practices while maintaining performance and reliability.

The memory system is production-ready and can be extended with database persistence, vector search, and advanced relationship modeling as needed.

