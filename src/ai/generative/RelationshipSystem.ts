/**
 * Relationship System
 * Tracks NPC-NPC and NPC-Player relationships
 * Based on research: reputation systems and relationship history
 * 
 * Maintains relationship strength, history, and subjective knowledge
 */

export interface Relationship {
  entityId: string; // ID of the other entity (player or NPC)
  entityType: 'player' | 'npc';
  strength: number; // 0-100, closeness/trust
  history: RelationshipEvent[];
  subjectiveKnowledge: string[]; // What this NPC knows/thinks about the other
  lastInteraction: number;
  interactionCount: number;
}

export interface RelationshipEvent {
  id: string;
  timestamp: number;
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  impact: number; // -10 to 10, how much this event affected the relationship
  context?: string;
}

export interface RelationshipSummary {
  entityId: string;
  relationship: Relationship;
  sentiment: 'positive' | 'neutral' | 'negative';
  trustLevel: 'high' | 'medium' | 'low';
  familiarity: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'enemy';
}

/**
 * Relationship System
 * Manages social relationships between NPCs and players
 */
export class RelationshipSystem {
  private relationships: Map<string, Relationship> = new Map(); // entityId -> Relationship

  /**
   * Get or create relationship with an entity
   */
  getRelationship(entityId: string, entityType: 'player' | 'npc' = 'player'): Relationship {
    const key = this.getRelationshipKey(entityId, entityType);
    
    if (!this.relationships.has(key)) {
      // Create new relationship
      const relationship: Relationship = {
        entityId,
        entityType,
        strength: 50, // Neutral starting point
        history: [],
        subjectiveKnowledge: [],
        lastInteraction: Date.now(),
        interactionCount: 0
      };
      this.relationships.set(key, relationship);
    }

    return this.relationships.get(key)!;
  }

  /**
   * Record an interaction event
   */
  recordInteraction(
    entityId: string,
    event: Omit<RelationshipEvent, 'id' | 'timestamp'>,
    entityType: 'player' | 'npc' = 'player'
  ): void {
    const relationship = this.getRelationship(entityId, entityType);
    
    const fullEvent: RelationshipEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...event
    };

    relationship.history.push(fullEvent);
    relationship.lastInteraction = fullEvent.timestamp;
    relationship.interactionCount++;

    // Update relationship strength
    relationship.strength = Math.max(0, Math.min(100, relationship.strength + event.impact));

    // Limit history size
    if (relationship.history.length > 100) {
      relationship.history = relationship.history.slice(-100);
    }
  }

  /**
   * Add subjective knowledge about an entity
   */
  addKnowledge(
    entityId: string,
    knowledge: string,
    entityType: 'player' | 'npc' = 'player'
  ): void {
    const relationship = this.getRelationship(entityId, entityType);
    
    // Avoid duplicates
    if (!relationship.subjectiveKnowledge.includes(knowledge)) {
      relationship.subjectiveKnowledge.push(knowledge);
      
      // Limit knowledge size
      if (relationship.subjectiveKnowledge.length > 50) {
        relationship.subjectiveKnowledge = relationship.subjectiveKnowledge.slice(-50);
      }
    }
  }

  /**
   * Get relationship summary
   */
  getSummary(entityId: string, entityType: 'player' | 'npc' = 'player'): RelationshipSummary {
    const relationship = this.getRelationship(entityId, entityType);
    
    const sentiment = relationship.strength > 60 ? 'positive' :
                     relationship.strength < 40 ? 'negative' : 'neutral';
    
    const trustLevel = relationship.strength > 70 ? 'high' :
                      relationship.strength > 40 ? 'medium' : 'low';
    
    let familiarity: RelationshipSummary['familiarity'] = 'stranger';
    if (relationship.strength > 80) {
      familiarity = relationship.strength > 90 ? 'close_friend' : 'friend';
    } else if (relationship.strength > 50) {
      familiarity = 'acquaintance';
    } else if (relationship.strength < 30) {
      familiarity = 'enemy';
    }

    return {
      entityId,
      relationship: { ...relationship },
      sentiment,
      trustLevel,
      familiarity
    };
  }

  /**
   * Get all relationships
   */
  getAllRelationships(): Relationship[] {
    return Array.from(this.relationships.values());
  }

  /**
   * Get relationships by type
   */
  getRelationshipsByType(type: 'player' | 'npc'): Relationship[] {
    return Array.from(this.relationships.values())
      .filter(r => r.entityType === type);
  }

  /**
   * Get top relationships (by strength)
   */
  getTopRelationships(limit: number = 10): Relationship[] {
    return Array.from(this.relationships.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }

  /**
   * Check if relationship exists
   */
  hasRelationship(entityId: string, entityType: 'player' | 'npc' = 'player'): boolean {
    const key = this.getRelationshipKey(entityId, entityType);
    return this.relationships.has(key);
  }

  /**
   * Remove relationship
   */
  removeRelationship(entityId: string, entityType: 'player' | 'npc' = 'player'): void {
    const key = this.getRelationshipKey(entityId, entityType);
    this.relationships.delete(key);
  }

  /**
   * Get relationship strength
   */
  getStrength(entityId: string, entityType: 'player' | 'npc' = 'player'): number {
    const relationship = this.getRelationship(entityId, entityType);
    return relationship.strength;
  }

  /**
   * Modify relationship strength directly
   */
  modifyStrength(
    entityId: string,
    delta: number,
    entityType: 'player' | 'npc' = 'player'
  ): void {
    const relationship = this.getRelationship(entityId, entityType);
    relationship.strength = Math.max(0, Math.min(100, relationship.strength + delta));
  }

  /**
   * Get relationship history
   */
  getHistory(entityId: string, entityType: 'player' | 'npc' = 'player', limit: number = 20): RelationshipEvent[] {
    const relationship = this.getRelationship(entityId, entityType);
    return relationship.history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get subjective knowledge
   */
  getKnowledge(entityId: string, entityType: 'player' | 'npc' = 'player'): string[] {
    const relationship = this.getRelationship(entityId, entityType);
    return [...relationship.subjectiveKnowledge];
  }

  /**
   * Clear all relationships
   */
  clear(): void {
    this.relationships.clear();
  }

  /**
   * Export relationships for persistence
   */
  export(): Relationship[] {
    return Array.from(this.relationships.values()).map(r => ({ ...r }));
  }

  /**
   * Import relationships from persistence
   */
  import(relationships: Relationship[]): void {
    this.relationships.clear();
    for (const relationship of relationships) {
      const key = this.getRelationshipKey(relationship.entityId, relationship.entityType);
      this.relationships.set(key, { ...relationship });
    }
  }

  private getRelationshipKey(entityId: string, entityType: 'player' | 'npc'): string {
    return `${entityType}:${entityId}`;
  }

  private generateId(): string {
    return `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}


