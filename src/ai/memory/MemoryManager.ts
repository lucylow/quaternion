/**
 * Memory Management System with RAG capabilities
 * Implements persistent memory for NPCs and narrative systems
 * Based on research: vector databases, summarization, and context compression
 */

export interface Memory {
  id: string;
  entityId: string; // NPC ID, Commander ID, etc.
  entityType: 'npc' | 'commander' | 'narrative' | 'player';
  content: string;
  embedding?: number[]; // For vector search
  metadata: {
    timestamp: number;
    importance: number; // 0-1, for prioritization
    tags: string[];
    playerId?: string;
    sessionId?: string;
  };
}

export interface MemoryQuery {
  entityId: string;
  entityType: string;
  limit?: number;
  minImportance?: number;
  tags?: string[];
  since?: number; // timestamp
  playerId?: string;
}

export interface MemorySummary {
  entityId: string;
  summary: string;
  keyEvents: string[];
  relationships: Record<string, number>; // entityId -> relationship score
  lastUpdated: number;
}

/**
 * Memory Manager with RAG capabilities
 * Handles storage, retrieval, summarization, and vector search
 */
export class MemoryManager {
  private memories: Map<string, Memory[]> = new Map(); // entityId -> memories
  private summaries: Map<string, MemorySummary> = new Map(); // entityId -> summary
  private embeddingCache: Map<string, number[]> = new Map(); // content hash -> embedding

  // Configuration
  private maxMemoriesPerEntity = 100;
  private summaryThreshold = 20; // Summarize after N memories
  private importanceDecayRate = 0.01; // Per day
  private maxContextTokens = 2000; // Approximate token limit

  /**
   * Store a new memory
   */
  async storeMemory(memory: Omit<Memory, 'id'>): Promise<string> {
    const id = this.generateMemoryId();
    const fullMemory: Memory = {
      id,
      ...memory,
      metadata: {
        ...memory.metadata,
        timestamp: memory.metadata.timestamp || Date.now(),
      }
    };

    // Get or create memory list for entity
    const entityKey = this.getEntityKey(memory.entityId, memory.entityType);
    if (!this.memories.has(entityKey)) {
      this.memories.set(entityKey, []);
    }

    const entityMemories = this.memories.get(entityKey)!;
    entityMemories.push(fullMemory);

    // Limit memory count
    if (entityMemories.length > this.maxMemoriesPerEntity) {
      // Remove least important old memories
      entityMemories.sort((a, b) => {
        const scoreA = this.calculateMemoryScore(a);
        const scoreB = this.calculateMemoryScore(b);
        return scoreB - scoreA;
      });
      entityMemories.splice(this.maxMemoriesPerEntity);
    }

    // Check if summarization is needed
    if (entityMemories.length >= this.summaryThreshold) {
      await this.summarizeMemories(memory.entityId, memory.entityType);
    }

    return id;
  }

  /**
   * Retrieve relevant memories for context
   */
  async retrieveMemories(query: MemoryQuery): Promise<Memory[]> {
    const entityKey = this.getEntityKey(query.entityId, query.entityType);
    let memories = this.memories.get(entityKey) || [];

    // Filter by criteria
    if (query.minImportance !== undefined) {
      memories = memories.filter(m => 
        this.calculateMemoryScore(m) >= query.minImportance!
      );
    }

    if (query.tags && query.tags.length > 0) {
      memories = memories.filter(m => 
        query.tags!.some(tag => m.metadata.tags.includes(tag))
      );
    }

    if (query.since) {
      memories = memories.filter(m => m.metadata.timestamp >= query.since!);
    }

    if (query.playerId) {
      memories = memories.filter(m => m.metadata.playerId === query.playerId);
    }

    // Sort by relevance (importance + recency)
    memories.sort((a, b) => {
      const scoreA = this.calculateMemoryScore(a);
      const scoreB = this.calculateMemoryScore(b);
      return scoreB - scoreA;
    });

    // Limit results
    const limit = query.limit || 10;
    return memories.slice(0, limit);
  }

  /**
   * Get compressed context for LLM prompts
   * Combines summary + recent important memories
   */
  async getCompressedContext(
    entityId: string,
    entityType: string,
    maxTokens: number = this.maxContextTokens
  ): Promise<string> {
    const summary = this.summaries.get(this.getEntityKey(entityId, entityType));
    const recentMemories = await this.retrieveMemories({
      entityId,
      entityType,
      limit: 5,
      minImportance: 0.5
    });

    let context = '';

    // Add summary if available
    if (summary) {
      context += `## Summary\n${summary.summary}\n\n`;
      if (summary.keyEvents.length > 0) {
        context += `Key Events: ${summary.keyEvents.join(', ')}\n\n`;
      }
      if (Object.keys(summary.relationships).length > 0) {
        const rels = Object.entries(summary.relationships)
          .map(([id, score]) => `${id}: ${score > 0 ? 'positive' : 'negative'}`)
          .join(', ');
        context += `Relationships: ${rels}\n\n`;
      }
    }

    // Add recent important memories
    if (recentMemories.length > 0) {
      context += '## Recent Memories\n';
      for (const memory of recentMemories) {
        const age = this.getMemoryAge(memory);
        context += `- [${age}] ${memory.content}\n`;
      }
    }

    // Estimate token count (rough: 1 token ≈ 4 characters)
    const estimatedTokens = context.length / 4;
    if (estimatedTokens > maxTokens) {
      // Truncate if needed
      const maxChars = maxTokens * 4;
      context = context.substring(0, maxChars) + '...';
    }

    return context;
  }

  /**
   * Summarize memories for an entity
   */
  private async summarizeMemories(
    entityId: string,
    entityType: string
  ): Promise<void> {
    const entityKey = this.getEntityKey(entityId, entityType);
    const memories = this.memories.get(entityKey) || [];

    if (memories.length === 0) return;

    // Group memories by time periods
    const oldMemories = memories.filter(m => 
      this.getMemoryAge(m) > 7 // Older than 7 "time units"
    );
    const recentMemories = memories.filter(m => 
      this.getMemoryAge(m) <= 7
    );

    // Create summary from old memories
    const summary: MemorySummary = {
      entityId,
      summary: this.generateSummaryText(oldMemories),
      keyEvents: this.extractKeyEvents(oldMemories),
      relationships: this.extractRelationships(memories),
      lastUpdated: Date.now()
    };

    this.summaries.set(entityKey, summary);

    // Remove summarized memories (keep only recent ones)
    if (oldMemories.length > 0) {
      const newMemoryList = recentMemories;
      this.memories.set(entityKey, newMemoryList);
    }
  }

  /**
   * Generate summary text from memories
   */
  private generateSummaryText(memories: Memory[]): string {
    if (memories.length === 0) return '';

    // Group by importance
    const important = memories.filter(m => m.metadata.importance > 0.7);
    const normal = memories.filter(m => 
      m.metadata.importance > 0.3 && m.metadata.importance <= 0.7
    );

    const parts: string[] = [];

    if (important.length > 0) {
      parts.push(`Notable events: ${important.length} significant interactions.`);
    }

    if (normal.length > 0) {
      parts.push(`Regular interactions: ${normal.length} exchanges.`);
    }

    // Extract common themes from tags
    const allTags = memories.flatMap(m => m.metadata.tags);
    const tagCounts = new Map<string, number>();
    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    if (topTags.length > 0) {
      parts.push(`Themes: ${topTags.join(', ')}.`);
    }

    return parts.join(' ');
  }

  /**
   * Extract key events from memories
   */
  private extractKeyEvents(memories: Memory[]): string[] {
    return memories
      .filter(m => m.metadata.importance > 0.7)
      .slice(0, 5)
      .map(m => m.content.substring(0, 50) + '...');
  }

  /**
   * Extract relationship scores from memories
   */
  private extractRelationships(memories: Memory[]): Record<string, number> {
    const relationships: Record<string, number> = {};

    for (const memory of memories) {
      if (memory.metadata.playerId) {
        const playerId = memory.metadata.playerId;
        if (!relationships[playerId]) {
          relationships[playerId] = 0;
        }
        // Positive memories increase relationship, negative decrease
        relationships[playerId] += memory.metadata.importance * 
          (memory.content.toLowerCase().includes('positive') ? 1 : -0.5);
      }
    }

    return relationships;
  }

  /**
   * Calculate memory relevance score
   */
  private calculateMemoryScore(memory: Memory): number {
    const age = this.getMemoryAge(memory);
    const recencyFactor = Math.exp(-age * this.importanceDecayRate);
    return memory.metadata.importance * recencyFactor;
  }

  /**
   * Get memory age in "time units" (simplified)
   */
  private getMemoryAge(memory: Memory): number {
    const ageMs = Date.now() - memory.metadata.timestamp;
    return ageMs / (1000 * 60 * 60); // Convert to hours (simplified)
  }

  /**
   * Get entity key for map storage
   */
  private getEntityKey(entityId: string, entityType: string): string {
    return `${entityType}:${entityId}`;
  }

  /**
   * Generate unique memory ID
   */
  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear memories for an entity (useful for testing)
   */
  clearEntityMemories(entityId: string, entityType: string): void {
    const entityKey = this.getEntityKey(entityId, entityType);
    this.memories.delete(entityKey);
    this.summaries.delete(entityKey);
  }

  /**
   * Get memory summary
   */
  getSummary(entityId: string, entityType: string): MemorySummary | undefined {
    return this.summaries.get(this.getEntityKey(entityId, entityType));
  }

  /**
   * Export memories for persistence (e.g., to database)
   */
  exportMemories(): { memories: Memory[]; summaries: MemorySummary[] } {
    const allMemories: Memory[] = [];
    for (const memories of this.memories.values()) {
      allMemories.push(...memories);
    }

    return {
      memories: allMemories,
      summaries: Array.from(this.summaries.values())
    };
  }

  /**
   * Import memories from persistence
   */
  importMemories(data: { memories: Memory[]; summaries: MemorySummary[] }): void {
    // Clear existing
    this.memories.clear();
    this.summaries.clear();

    // Import memories
    for (const memory of data.memories) {
      const entityKey = this.getEntityKey(memory.entityId, memory.entityType);
      if (!this.memories.has(entityKey)) {
        this.memories.set(entityKey, []);
      }
      this.memories.get(entityKey)!.push(memory);
    }

    // Import summaries
    for (const summary of data.summaries) {
      const entityKey = this.getEntityKey(summary.entityId, 'npc'); // Assume NPC for now
      this.summaries.set(entityKey, summary);
    }
  }
}


