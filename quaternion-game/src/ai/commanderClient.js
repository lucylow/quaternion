/**
 * Commander AI Client - interfaces with edge function for strategic decisions
 * Hybrid approach: deterministic fallback + LLM strategic insights
 */

import { supabase } from '../integrations/supabase/client';

export class CommanderAI {
  constructor(commanderId, gameState) {
    this.commanderId = commanderId;
    this.gameState = gameState;
    this.lastDecisionTick = 0;
    this.decisionCooldown = 50; // Make decisions every 50 ticks
    this.decisionHistory = [];
  }

  /**
   * Main decision loop
   */
  async tick(currentTick) {
    // Only make strategic decisions periodically
    if (currentTick - this.lastDecisionTick < this.decisionCooldown) {
      return null;
    }

    this.lastDecisionTick = currentTick;

    const gameStateSnapshot = this.createStateSnapshot(currentTick);
    
    try {
      const decision = await this.getStrategicDecision(gameStateSnapshot);
      this.recordDecision(decision, currentTick);
      return decision;
    } catch (error) {
      console.error('Commander AI error:', error);
      // Return local fallback on error
      return this.createLocalFallback(gameStateSnapshot);
    }
  }

  /**
   * Create compact state snapshot for AI
   */
  createStateSnapshot(tick) {
    const player = this.gameState.getPlayer(0); // Assuming AI is player 0
    const enemy = this.gameState.getPlayer(1);

    return {
      ore: player?.resources?.ore || 0,
      energy: player?.resources?.energy || 0,
      biomass: player?.resources?.biomass || 0,
      units: this.countUnitsByType(player?.units || []),
      enemyVisible: this.countUnitsByType(this.gameState.getVisibleEnemyUnits() || []),
      mapFeatures: this.getMapFeatures(),
      tick,
      commanderId: this.commanderId
    };
  }

  /**
   * Call edge function for AI decision
   */
  async getStrategicDecision(gameState) {
    const { data, error } = await supabase.functions.invoke('ai-strategy', {
      body: {
        gameState,
        agentType: 'commander'
      }
    });

    if (error) {
      throw new Error(`AI Strategy error: ${error.message}`);
    }

    return data;
  }

  /**
   * Local deterministic fallback
   */
  createLocalFallback(gameState) {
    const scores = {
      build: this.scoreBuild(gameState),
      attack: this.scoreAttack(gameState),
      tech: this.scoreTech(gameState),
      defend: this.scoreDefend(gameState),
      expand: this.scoreExpand(gameState)
    };

    const best = Object.entries(scores).reduce((max, [action, score]) =>
      score > max.score ? { action, score } : max,
      { action: 'build', score: 0 }
    );

    return {
      order: best.action,
      reason: `Local heuristic: ${best.action} scored ${best.score.toFixed(2)}`,
      confidence: best.score,
      fallback: true,
      local: true
    };
  }

  scoreBuild(state) {
    const totalUnits = Object.values(state.units).reduce((a, b) => a + b, 0);
    if (state.ore > 200 && totalUnits < 15) {
      return 0.8;
    }
    return 0.3;
  }

  scoreAttack(state) {
    const ourForce = Object.values(state.units).reduce((a, b) => a + b, 0);
    const enemyForce = Object.values(state.enemyVisible).reduce((a, b) => a + b, 0);
    
    if (ourForce > enemyForce * 1.5 && enemyForce > 0) {
      return 0.9;
    }
    return 0.2;
  }

  scoreTech(state) {
    if (state.tick > 100 && state.ore > 300 && state.energy > 80) {
      return 0.7;
    }
    return 0.1;
  }

  scoreDefend(state) {
    const ourForce = Object.values(state.units).reduce((a, b) => a + b, 0);
    const enemyForce = Object.values(state.enemyVisible).reduce((a, b) => a + b, 0);
    
    if (enemyForce > ourForce && enemyForce > 0) {
      return 0.85;
    }
    return 0.3;
  }

  scoreExpand(state) {
    if (state.tick < 200 && state.ore < 150) {
      return 0.75;
    }
    return 0.4;
  }

  /**
   * Helper methods
   */
  countUnitsByType(units) {
    const counts = {};
    units.forEach(unit => {
      const type = unit.type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }

  getMapFeatures() {
    const features = [];
    const map = this.gameState.map;
    
    if (map) {
      // Extract key map features for AI context
      if (map.hasChokepoints) features.push('chokepoint_north');
      if (map.hasHighGround) features.push('high_ground');
      if (map.type) features.push(map.type);
    }
    
    return features.length > 0 ? features : ['standard'];
  }

  recordDecision(decision, tick) {
    this.decisionHistory.push({
      tick,
      decision,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 decisions
    if (this.decisionHistory.length > 20) {
      this.decisionHistory.shift();
    }

    console.log(`Commander decision at tick ${tick}:`, decision);
  }

  /**
   * Get decision history for debugging/replay
   */
  getDecisionHistory() {
    return this.decisionHistory;
  }

  /**
   * Get AI highlights for judge summary
   */
  getAIHighlights(maxHighlights = 3) {
    return this.decisionHistory
      .filter(d => !d.decision.fallback && d.decision.confidence > 0.6)
      .slice(-maxHighlights)
      .map(d => ({
        t: d.tick,
        actor: this.commanderId,
        action: d.decision.order,
        reason: d.decision.reason
      }));
  }
}
