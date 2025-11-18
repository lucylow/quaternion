/**
 * Enhanced Memory Stream System
 * Based on Stanford Generative Agents research
 * Implements memory with importance scoring, weighted retrieval (recency, relevance, importance)
 */

import { LLMIntegration } from '../integrations/LLMIntegration';

export interface MemoryObservation {
  id: string;
  content: string;
  timestamp: number;
  lastAccess: number;
  importance: number; // 0-10, scored by LLM
  embedding?: number[]; // For semantic similarity
  tags: string[];
  entityId?: string; // Related entity (player, other NPC, etc.)
}

export interface MemoryRetrievalOptions {
  query?: string; // Semantic query for relevance
  limit?: number;
  minImportance?: number;
  recencyWeight?: number; // 0-1, how much to weight recency
  relevanceWeight?: number; // 0-1, how much to weight relevance
  importanceWeight?: number; // 0-1, how much to weight importance
  since?: number; // Only memories after this timestamp
}

/**
 * Enhanced Memory Stream
 * Stores observations with importance scoring and weighted retrieval
 */
export class EnhancedMemoryStream {
  private memories: MemoryObservation[] = [];
  private llm: LLMIntegration | null = null;
  private embeddingCache: Map<string, number[]> = new Map();
  private maxMemories = 1000;
  private importanceDecayRate = 0.01; // Per day

  constructor(llm?: LLMIntegration) {
    this.llm = llm || null;
  }

  /**
   * Add a new observation to memory stream
   */
  async addObservation(
    content: string,
    tags: string[] = [],
    entityId?: string
  ): Promise<string> {
    const id = this.generateId();
    const timestamp = Date.now();
    
    // Score importance using LLM
    const importance = await this.scoreImportance(content, tags);
    
    const memory: MemoryObservation = {
      id,
      content,
      timestamp,
      lastAccess: timestamp,
      importance,
      tags,
      entityId
    };

    this.memories.push(memory);

    // Limit memory count (remove least important old memories)
    if (this.memories.length > this.maxMemories) {
      this.memories.sort((a, b) => {
        const scoreA = this.calculateRetrievalScore(a, '', {
          recencyWeight: 0.3,
          relevanceWeight: 0.3,
          importanceWeight: 0.4
        });
        const scoreB = this.calculateRetrievalScore(b, '', {
          recencyWeight: 0.3,
          relevanceWeight: 0.3,
          importanceWeight: 0.4
        });
        return scoreB - scoreA;
      });
      this.memories = this.memories.slice(0, this.maxMemories);
    }

    return id;
  }

  /**
   * Score importance of a memory using LLM
   * Asks: "How important is this event to you?"
   */
  private async scoreImportance(content: string, tags: string[]): Promise<number> {
    // Default importance if no LLM
    if (!this.llm) {
      // Heuristic: tag-based importance
      const importantTags = ['trade', 'combat', 'relationship', 'quest', 'decision'];
      const hasImportantTag = tags.some(tag => importantTags.includes(tag));
      return hasImportantTag ? 7 : 5;
    }

    try {
      const prompt = `You are an NPC in a sci-fi RTS game. Rate the importance of this event on a scale of 0-10, where:
- 0-2: Trivial, easily forgotten
- 3-5: Normal, routine event
- 6-7: Notable, worth remembering
- 8-9: Significant, affects relationships or goals
- 10: Critical, life-changing event

Event: "${content}"
Tags: ${tags.join(', ')}

Respond with ONLY a number from 0-10.`;

      const response = await this.llm.generateText(prompt);
      const score = parseFloat(response.trim());
      
      if (!isNaN(score) && score >= 0 && score <= 10) {
        return score;
      }
    } catch (error) {
      console.warn('Importance scoring failed', error);
    }

    // Fallback
    return 5;
  }

  /**
   * Retrieve relevant memories with weighted scoring
   * Combines recency, relevance (semantic similarity), and importance
   */
  async retrieveMemories(options: MemoryRetrievalOptions = {}): Promise<MemoryObservation[]> {
    const {
      query = '',
      limit = 10,
      minImportance = 0,
      recencyWeight = 0.3,
      relevanceWeight = 0.3,
      importanceWeight = 0.4,
      since
    } = options;

    // Filter by criteria
    let candidates = this.memories;
    
    if (since) {
      candidates = candidates.filter(m => m.timestamp >= since);
    }

    if (minImportance > 0) {
      candidates = candidates.filter(m => m.importance >= minImportance);
    }

    // Calculate weighted scores
    const scored = candidates.map(memory => ({
      memory,
      score: this.calculateRetrievalScore(memory, query, {
        recencyWeight,
        relevanceWeight,
        importanceWeight
      })
    }));

    // Sort by score and return top N
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => {
      // Update last access time
      s.memory.lastAccess = Date.now();
      return s.memory;
    });
  }

  /**
   * Calculate retrieval score combining recency, relevance, and importance
   */
  private calculateRetrievalScore(
    memory: MemoryObservation,
    query: string,
    weights: {
      recencyWeight: number;
      relevanceWeight: number;
      importanceWeight: number;
    }
  ): number {
    // Recency: exponential decay over time
    const age = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24); // days
    const recencyScore = Math.exp(-age * this.importanceDecayRate);

    // Relevance: semantic similarity (simplified - could use embeddings)
    let relevanceScore = 0.5; // Default
    if (query) {
      const queryLower = query.toLowerCase();
      const contentLower = memory.content.toLowerCase();
      const tagMatch = memory.tags.some(tag => 
        queryLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(queryLower)
      );
      
      if (contentLower.includes(queryLower)) {
        relevanceScore = 1.0;
      } else if (tagMatch) {
        relevanceScore = 0.8;
      } else {
        // Simple word overlap
        const queryWords = new Set(queryLower.split(/\s+/));
        const contentWords = new Set(contentLower.split(/\s+/));
        const overlap = Array.from(queryWords).filter(w => contentWords.has(w)).length;
        relevanceScore = Math.min(0.7, overlap / Math.max(queryWords.size, 1));
      }
    } else {
      relevanceScore = 1.0; // No query means all memories are equally relevant
    }

    // Importance: normalized 0-1
    const importanceScore = memory.importance / 10;

    // Weighted combination
    return (
      recencyScore * weights.recencyWeight +
      relevanceScore * weights.relevanceWeight +
      importanceScore * weights.importanceWeight
    );
  }

  /**
   * Get memories related to a specific entity
   */
  async getEntityMemories(entityId: string, limit: number = 10): Promise<MemoryObservation[]> {
    return this.memories
      .filter(m => m.entityId === entityId)
      .sort((a, b) => {
        const scoreA = this.calculateRetrievalScore(a, '', {
          recencyWeight: 0.3,
          relevanceWeight: 0.3,
          importanceWeight: 0.4
        });
        const scoreB = this.calculateRetrievalScore(b, '', {
          recencyWeight: 0.3,
          relevanceWeight: 0.3,
          importanceWeight: 0.4
        });
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get recent memories (last N hours)
   */
  getRecentMemories(hours: number = 24, limit: number = 20): MemoryObservation[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.memories
      .filter(m => m.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get all memories
   */
  getAllMemories(): MemoryObservation[] {
    return [...this.memories];
  }

  /**
   * Clear all memories
   */
  clear(): void {
    this.memories = [];
  }

  /**
   * Export memories for persistence
   */
  export(): MemoryObservation[] {
    return this.memories.map(m => ({ ...m }));
  }

  /**
   * Import memories from persistence
   */
  import(memories: MemoryObservation[]): void {
    this.memories = memories.map(m => ({ ...m }));
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}


