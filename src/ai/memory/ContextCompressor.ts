/**
 * Context Compression System
 * Compresses long conversation histories and game state for LLM prompts
 * Based on research: summarization techniques and token management
 */

import { LLMIntegration } from '../integrations/LLMIntegration';

export interface ConversationTurn {
  role: 'player' | 'npc' | 'system';
  content: string;
  timestamp: number;
  importance?: number;
}

export interface CompressedContext {
  summary: string;
  recentTurns: ConversationTurn[];
  keyFacts: string[];
  totalTokens: number; // Estimated
}

/**
 * Context Compressor
 * Reduces long conversation histories to manageable sizes for LLM prompts
 */
export class ContextCompressor {
  private llm: LLMIntegration | null = null;
  private maxRecentTurns = 5;
  private maxSummaryLength = 200; // characters

  constructor(llmConfig?: { provider: 'google' | 'saga' | 'openai'; apiKey?: string }) {
    if (llmConfig) {
      this.llm = new LLMIntegration({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        temperature: 0.3, // Lower temperature for more factual summaries
        maxTokens: 300
      });
    }
  }

  /**
   * Compress conversation history
   */
  async compressConversation(
    turns: ConversationTurn[],
    maxTokens: number = 2000
  ): Promise<CompressedContext> {
    if (turns.length === 0) {
      return {
        summary: '',
        recentTurns: [],
        keyFacts: [],
        totalTokens: 0
      };
    }

    // Separate recent and old turns
    const recentTurns = turns.slice(-this.maxRecentTurns);
    const oldTurns = turns.slice(0, -this.maxRecentTurns);

    // Generate summary of old turns
    let summary = '';
    if (oldTurns.length > 0) {
      summary = await this.summarizeTurns(oldTurns);
    }

    // Extract key facts
    const keyFacts = this.extractKeyFacts(turns);

    // Estimate token count (rough: 1 token ≈ 4 characters)
    const summaryTokens = summary.length / 4;
    const recentTokens = recentTurns.reduce((sum, turn) => sum + turn.content.length / 4, 0);
    const factsTokens = keyFacts.reduce((sum, fact) => sum + fact.length / 4, 0);
    const totalTokens = summaryTokens + recentTokens + factsTokens;

    // If over limit, truncate summary
    if (totalTokens > maxTokens) {
      const excess = totalTokens - maxTokens;
      const summaryChars = Math.max(0, summary.length - (excess * 4));
      summary = summary.substring(0, summaryChars);
    }

    return {
      summary,
      recentTurns,
      keyFacts,
      totalTokens: Math.ceil(totalTokens)
    };
  }

  /**
   * Summarize old conversation turns
   */
  private async summarizeTurns(turns: ConversationTurn[]): Promise<string> {
    if (turns.length === 0) return '';

    // If no LLM, use simple extraction
    if (!this.llm) {
      return this.simpleSummarize(turns);
    }

    try {
      // Build prompt for summarization
      const conversationText = turns
        .map(t => `${t.role}: ${t.content}`)
        .join('\n');

      const prompt = `Summarize this conversation history in 2-3 sentences, focusing on:
- Key topics discussed
- Important decisions or agreements
- Relationship changes
- Any unresolved issues

Conversation:
${conversationText}

Summary:`;

      const response = await this.llm.generateText(prompt);
      return response.trim().substring(0, this.maxSummaryLength);
    } catch (error) {
      console.warn('LLM summarization failed, using simple method', error);
      return this.simpleSummarize(turns);
    }
  }

  /**
   * Simple summarization without LLM
   */
  private simpleSummarize(turns: ConversationTurn[]): string {
    const importantTurns = turns.filter(t => 
      (t.importance || 0.5) > 0.6
    );

    if (importantTurns.length === 0) {
      return `Previous conversation: ${turns.length} exchanges.`;
    }

    const topics = new Set<string>();
    importantTurns.forEach(turn => {
      // Extract simple topics (first few words)
      const words = turn.content.split(' ').slice(0, 3).join(' ');
      topics.add(words);
    });

    return `Previous conversation covered: ${Array.from(topics).slice(0, 3).join(', ')}.`;
  }

  /**
   * Extract key facts from conversation
   */
  private extractKeyFacts(turns: ConversationTurn[]): string[] {
    const facts: string[] = [];
    const seenFacts = new Set<string>();

    // Look for declarative statements and important information
    for (const turn of turns) {
      if (turn.importance && turn.importance > 0.7) {
        // Extract fact-like content (simplified)
        const content = turn.content.trim();
        if (content.length > 10 && content.length < 100) {
          const factKey = content.toLowerCase().substring(0, 50);
          if (!seenFacts.has(factKey)) {
            facts.push(content);
            seenFacts.add(factKey);
          }
        }
      }
    }

    // Also extract player name, preferences, etc.
    const playerTurns = turns.filter(t => t.role === 'player');
    for (const turn of playerTurns) {
      // Simple pattern matching for names
      const nameMatch = turn.content.match(/my name is (\w+)/i);
      if (nameMatch && !seenFacts.has('name')) {
        facts.push(`Player name: ${nameMatch[1]}`);
        seenFacts.add('name');
      }
    }

    return facts.slice(0, 5); // Limit to 5 key facts
  }

  /**
   * Format compressed context for LLM prompt
   */
  formatContext(context: CompressedContext): string {
    let formatted = '';

    if (context.summary) {
      formatted += `## Conversation Summary\n${context.summary}\n\n`;
    }

    if (context.keyFacts.length > 0) {
      formatted += `## Key Facts\n${context.keyFacts.map(f => `- ${f}`).join('\n')}\n\n`;
    }

    if (context.recentTurns.length > 0) {
      formatted += '## Recent Conversation\n';
      for (const turn of context.recentTurns) {
        formatted += `${turn.role}: ${turn.content}\n`;
      }
    }

    return formatted.trim();
  }

  /**
   * Compress game state for context
   */
  compressGameState(gameState: any): string {
    const parts: string[] = [];

    // Extract key game state info
    if (gameState.players) {
      const playerCount = Object.keys(gameState.players).length;
      parts.push(`Players: ${playerCount}`);
    }

    if (gameState.tick !== undefined) {
      parts.push(`Game time: ${gameState.tick} ticks`);
    }

    if (gameState.map) {
      parts.push(`Map: ${gameState.map.width || '?'}x${gameState.map.height || '?'}`);
    }

    return parts.join(', ');
  }
}


