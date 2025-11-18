# AI Agent System - Quaternion

This directory contains the hybrid AI system for Quaternion, combining deterministic heuristics with LLM-powered strategic decision making.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Game Loop (tick)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼────┐                    ┌────▼────┐
    │  Unit   │                    │Commander│
    │ Agents  │                    │   AI    │
    │(Utility)│                    │(Hybrid) │
    └────┬────┘                    └────┬────┘
         │                               │
         │ Deterministic                 │ Strategic
         │ Fast (<1ms)                   │ Slow (~50 ticks)
         │                               │
    ┌────▼────────┐              ┌──────▼──────────┐
    │ Attack/Move │              │  Edge Function  │
    │   Retreat   │              │ ai-strategy     │
    │   Ability   │              │(LLM + Fallback) │
    └─────────────┘              └─────────────────┘
```

## Files

### Core AI Components

- **utilityAgent.js** - Unit and squad level AI
  - `UtilityAgent` - Individual unit decision making
  - `SquadAgent` - Group coordination and tactics
  - Deterministic, fast, debuggable
  - ~1ms per unit per tick

- **commanderClient.js** - Strategic AI commander
  - Calls Lovable AI edge function for high-level decisions
  - Fallback to deterministic heuristics
  - Rate-limited (every 50 ticks)
  - Records decision history for replay

- **AIController.js** - Existing AI controller (legacy)
  - Can be refactored to use new agent system

### Edge Function

- **supabase/functions/ai-strategy/index.ts**
  - Strategic decision endpoint
  - Uses Lovable AI (Google Gemini 2.5 Flash)
  - Validates LLM output
  - Returns deterministic fallback on error

## Usage Example

### Unit Agent

```javascript
import { UtilityAgent } from './ai/utilityAgent';

// Per unit, per tick
const unitAgent = new UtilityAgent(unit, gameState);
const action = unitAgent.tick();

// Execute action
gameState.applyAction(action);
```

### Squad Agent

```javascript
import { SquadAgent } from './ai/utilityAgent';

// Per squad, per tick
const squad = new SquadAgent(units, gameState);
squad.tick(); // Issues goals to units

// Units then use their UtilityAgent to achieve goals
```

### Commander AI

```javascript
import { CommanderAI } from './ai/commanderClient';

// Initialize once
const commander = new CommanderAI('cautious_geologist', gameState);

// Call periodically (automatically rate-limited)
async function gameTick(tick) {
  const decision = await commander.tick(tick);
  
  if (decision) {
    console.log(`Commander order: ${decision.order} - ${decision.reason}`);
    executeCommanderOrder(decision);
  }
}

// Get AI highlights for replay
const highlights = commander.getAIHighlights(3);
```

## Agent Types

### 1. Unit Agents (Utility-based)
- **Role**: Individual unit control
- **Speed**: <1ms per tick
- **Method**: Deterministic utility scoring
- **Actions**: attack, move, retreat, ability, idle

**Heuristics:**
- Distance to target
- Target HP
- Our HP
- Friendly support nearby
- Cover/terrain modifiers

### 2. Squad Agents (FSM)
- **Role**: Coordinate 3-10 units
- **Speed**: ~5ms per tick
- **Method**: Finite state machine
- **States**: idle, hold, attack, flank, retreat

**Logic:**
- Calculate squad vs enemy strength
- Detect flanking opportunities
- Issue formation orders
- Maintain cohesion

### 3. Commander AI (Hybrid)
- **Role**: Strategic decisions
- **Speed**: Every 50 ticks (~1 decision/sec)
- **Method**: LLM + deterministic fallback
- **Orders**: build, attack, tech, defend, expand

**Decision Flow:**
1. Create state snapshot
2. Call edge function (LLM)
3. Validate decision
4. Execute or fallback to heuristic

## AI Safety & Determinism

### LLM Output Validation

All LLM decisions are validated before execution:

```javascript
function validateDecision(decision, gameState) {
  // Check order type
  if (!validOrders.includes(decision.order)) return false;
  
  // Check resources
  if (decision.order === 'build' && !hasResources(gameState)) return false;
  
  // Check confidence
  if (decision.confidence < 0.3) return false;
  
  return true;
}
```

### Deterministic Fallback

Every LLM call has a deterministic fallback:

```javascript
try {
  const llmDecision = await getLLMDecision(gameState);
  if (validate(llmDecision)) return llmDecision;
} catch (error) {
  console.warn('LLM failed, using fallback');
}

return generateFallbackDecision(gameState); // Always deterministic
```

### Rate Limiting

- Commander AI: Max 1 call per 50 ticks
- LLM only called when resources abundant or every 50 ticks
- Prevents cost explosion and API rate limits

## Debugging & Telemetry

### Decision Logging

```javascript
// Enable debug logging
const unitAgent = new UtilityAgent(unit, gameState);
unitAgent.tick(); // Logs: "Unit 42 chose attack (score: 0.87)"

// Commander history
const history = commander.getDecisionHistory();
// [{tick: 100, decision: {...}, timestamp: "..."}]
```

### AI Highlights for Replay

```javascript
const highlights = commander.getAIHighlights(3);
// Returns top 3 high-confidence decisions for judge summary
```

### Performance Monitoring

```javascript
// Track agent performance
console.time('unit-agents');
units.forEach(u => new UtilityAgent(u, gameState).tick());
console.timeEnd('unit-agents'); // Should be <10ms for 100 units
```

## Configuration

### Commander Personalities

Define in `commanderClient.js`:

```javascript
const personalities = {
  'cautious_geologist': { aggressiveness: 0.3, risk: 0.2, patience: 0.8 },
  'aggressive_commander': { aggressiveness: 0.9, risk: 0.8, patience: 0.2 },
  'balanced_strategist': { aggressiveness: 0.5, risk: 0.5, patience: 0.5 }
};
```

### Utility Weights

Adjust in `utilityAgent.js`:

```javascript
attackScore() {
  let score = 0.5; // Base
  score += distanceFactor * 0.3;  // Tweak these weights
  score += targetHpFactor * 0.2;
  score += ourHpFactor * 0.2;
  return score;
}
```

## Testing

### Unit Tests

```javascript
// Test utility scoring
const agent = new UtilityAgent(mockUnit, mockGameState);
const attackScore = agent.attackScore();
expect(attackScore).toBeGreaterThan(0);

// Test determinism
const score1 = agent.evaluate(action);
const score2 = agent.evaluate(action);
expect(score1).toBe(score2); // Deterministic!
```

### Integration Tests

```javascript
// Test full decision flow
const commander = new CommanderAI('test', gameState);
const decision = await commander.tick(100);
expect(decision).toHaveProperty('order');
expect(decision).toHaveProperty('reason');
```

## Performance Guidelines

### Targets

- Unit agents: <0.5ms per unit
- Squad agents: <5ms per squad
- Commander: <100ms per decision (rate-limited)

### Optimization Tips

1. **Batch calculations** - Calculate enemy distances once per tick
2. **Spatial partitioning** - Use grids for nearest-neighbor searches
3. **Lazy evaluation** - Only evaluate visible enemies
4. **Cache results** - Cache LLM responses for identical states

## Future Enhancements

- [ ] Reinforcement learning for unit micro
- [ ] MCTS for tactical planning
- [ ] Multi-agent coordination protocols
- [ ] Adaptive difficulty scaling
- [ ] Personality learning from replays

## References

- Utility AI: [Game AI Pro](http://www.gameaipro.com/)
- Behavior Trees: [Chris Simpson](https://www.gamedeveloper.com/programming/behavior-trees-for-ai-how-they-work)
- MCTS: [DeepMind AlphaGo](https://deepmind.com/research/publications/mastering-game-go-deep-neural-networks-tree-search)

## Additional Documentation

For comprehensive backend AI architecture documentation, see:

- **[Backend AI README](./docs/BACKEND_AI_README.md)** - Complete architecture guide covering behavior trees, personality system, utility AI scoring, pathfinding, and deployment
- **[Backend AI Quick Start](./docs/BACKEND_AI_QUICK_START.md)** - Fast reference guide for developers with code examples and integration checklist

These documents provide production-grade technical documentation for judges and developers, including:
- Complete behavior tree implementation
- Personality-driven decision making
- Strategic intent system
- Utility AI scoring framework
- Performance optimization strategies
- Debugging and testing guides
