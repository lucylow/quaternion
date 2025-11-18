/**
 * Reflection System
 * Converts raw observations into higher-level insights
 * Based on Stanford Generative Agents research
 * 
 * Reflection occurs when cumulative importance of recent observations exceeds threshold
 * Generates abstract thoughts about patterns, relationships, and core truths
 */

import { LLMIntegration } from '../integrations/LLMIntegration';
import { EnhancedMemoryStream, MemoryObservation } from './EnhancedMemoryStream';

export interface Reflection {
  id: string;
  content: string; // Abstract insight
  timestamp: number;
  importance: number;
  supportingMemories: string[]; // IDs of memories that support this reflection
  questions: string[]; // Questions that led to this reflection
}

export interface ReflectionOptions {
  importanceThreshold?: number; // Default 150 (sum of importance scores)
  maxReflections?: number; // Limit number of reflections generated
}

/**
 * Reflection System
 * Synthesizes memories into higher-level abstract thoughts
 */
export class ReflectionSystem {
  private llm: LLMIntegration | null = null;
  private memoryStream: EnhancedMemoryStream;
  private reflections: Reflection[] = [];
  private importanceAccumulator = 0;
  private lastReflectionTime = 0;
  private reflectionCooldown = 1000 * 60 * 60; // 1 hour minimum between reflections

  constructor(memoryStream: EnhancedMemoryStream, llm?: LLMIntegration) {
    this.memoryStream = memoryStream;
    this.llm = llm || null;
  }

  /**
   * Process new observation and trigger reflection if threshold reached
   */
  async processObservation(
    observation: MemoryObservation,
    options: ReflectionOptions = {}
  ): Promise<Reflection | null> {
    const { importanceThreshold = 150 } = options;

    // Add to accumulator
    this.importanceAccumulator += observation.importance;

    // Check if reflection should be triggered
    const shouldReflect = 
      this.importanceAccumulator >= importanceThreshold &&
      (Date.now() - this.lastReflectionTime) >= this.reflectionCooldown;

    if (!shouldReflect) {
      return null;
    }

    // Generate reflection
    const reflection = await this.generateReflection(options);
    
    if (reflection) {
      this.reflections.push(reflection);
      this.importanceAccumulator = 0; // Reset accumulator
      this.lastReflectionTime = Date.now();

      // Store reflection as a memory observation
      await this.memoryStream.addObservation(
        `Reflection: ${reflection.content}`,
        ['reflection', 'insight'],
        undefined
      );
    }

    return reflection;
  }

  /**
   * Generate reflection from recent memories
   */
  private async generateReflection(
    options: ReflectionOptions = {}
  ): Promise<Reflection | null> {
    const { maxReflections = 3 } = options;

    // Get recent important memories
    const recentMemories = await this.memoryStream.retrieveMemories({
      limit: 20,
      minImportance: 5,
      recencyWeight: 0.4,
      relevanceWeight: 0.3,
      importanceWeight: 0.3
    });

    if (recentMemories.length < 3) {
      return null; // Need enough memories to reflect on
    }

    // Generate questions about recent experiences
    const questions = await this.generateQuestions(recentMemories);
    
    if (questions.length === 0) {
      return null;
    }

    // For each question, generate insights
    const insights: Reflection[] = [];

    for (const question of questions.slice(0, maxReflections)) {
      const insight = await this.generateInsight(question, recentMemories);
      if (insight) {
        insights.push(insight);
      }
    }

    // Return the most important insight
    if (insights.length === 0) {
      return null;
    }

    insights.sort((a, b) => b.importance - a.importance);
    return insights[0];
  }

  /**
   * Generate questions about recent memories
   */
  private async generateQuestions(
    memories: MemoryObservation[]
  ): Promise<string[]> {
    if (!this.llm) {
      // Fallback: generate simple questions
      return [
        'What activities have I engaged in recently?',
        'What relationships have I formed?',
        'What patterns do I notice in my experiences?'
      ];
    }

    try {
      const memoryText = memories
        .slice(0, 10)
        .map(m => `- ${m.content}`)
        .join('\n');

      const prompt = `You are an NPC reflecting on recent experiences. Based on these memories, generate 2-3 key questions that would help you understand patterns, relationships, or important truths about yourself or others.

Memories:
${memoryText}

Generate questions like:
- "What activities have I engaged in recently?"
- "What is [person] passionate about?"
- "What patterns do I notice in my interactions?"

Respond with ONLY the questions, one per line, no numbering.`;

      const response = await this.llm.generateText(prompt);
      const questions = response
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0 && q.includes('?'))
        .slice(0, 3);

      return questions.length > 0 ? questions : [
        'What patterns do I notice in my recent experiences?'
      ];
    } catch (error) {
      console.warn('Question generation failed', error);
      return ['What patterns do I notice in my recent experiences?'];
    }
  }

  /**
   * Generate insight for a specific question
   */
  private async generateInsight(
    question: string,
    memories: MemoryObservation[]
  ): Promise<Reflection | null> {
    if (!this.llm) {
      // Fallback: simple pattern extraction
      const tags = new Set<string>();
      memories.forEach(m => m.tags.forEach(tag => tags.add(tag)));
      const commonTags = Array.from(tags).slice(0, 3);

      return {
        id: this.generateId(),
        content: `I have been engaging in activities related to: ${commonTags.join(', ')}`,
        timestamp: Date.now(),
        importance: 7,
        supportingMemories: memories.slice(0, 3).map(m => m.id),
        questions: [question]
      };
    }

    try {
      // Get memories relevant to the question
      const relevantMemories = await this.memoryStream.retrieveMemories({
        query: question,
        limit: 10,
        minImportance: 4
      });

      if (relevantMemories.length === 0) {
        return null;
      }

      const memoryText = relevantMemories
        .map(m => `- ${m.content}`)
        .join('\n');

      const prompt = `You are an NPC reflecting on your experiences. Answer this question based on your memories:

Question: ${question}

Your memories:
${memoryText}

Generate a concise insight (1-2 sentences) that:
- Answers the question directly
- Identifies patterns or truths
- Is abstract and generalizable
- Can guide future behavior

Respond with ONLY the insight text, no quotes or formatting.`;

      const response = await this.llm.generateText(prompt);
      const insight = response.trim();

      if (insight.length < 10) {
        return null; // Too short to be meaningful
      }

      // Score importance of this reflection
      const importance = await this.scoreReflectionImportance(insight, relevantMemories);

      return {
        id: this.generateId(),
        content: insight,
        timestamp: Date.now(),
        importance,
        supportingMemories: relevantMemories.map(m => m.id),
        questions: [question]
      };
    } catch (error) {
      console.warn('Insight generation failed', error);
      return null;
    }
  }

  /**
   * Score importance of a reflection
   */
  private async scoreReflectionImportance(
    insight: string,
    supportingMemories: MemoryObservation[]
  ): Promise<number> {
    // Average importance of supporting memories, with bonus for abstract insights
    const avgImportance = supportingMemories.reduce((sum, m) => sum + m.importance, 0) / 
      Math.max(supportingMemories.length, 1);
    
    // Reflections are generally more important than raw observations
    return Math.min(10, avgImportance + 1);
  }

  /**
   * Get all reflections
   */
  getReflections(): Reflection[] {
    return [...this.reflections];
  }

  /**
   * Get recent reflections
   */
  getRecentReflections(limit: number = 5): Reflection[] {
    return this.reflections
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get reflections related to a topic
   */
  async getReflectionsByTopic(topic: string, limit: number = 5): Promise<Reflection[]> {
    const memories = await this.memoryStream.retrieveMemories({
      query: topic,
      limit: 10
    });

    const memoryIds = new Set(memories.map(m => m.id));
    
    return this.reflections
      .filter(r => 
        r.content.toLowerCase().includes(topic.toLowerCase()) ||
        r.supportingMemories.some(id => memoryIds.has(id))
      )
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  /**
   * Clear all reflections
   */
  clear(): void {
    this.reflections = [];
    this.importanceAccumulator = 0;
  }

  private generateId(): string {
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}


