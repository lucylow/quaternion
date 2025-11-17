# Quaternion AI Backend: Developer Quick Reference

**Fast reference guide for integrating the Quaternion AI backend into your game engine.**

---

## 1. Quick Setup

### Install Dependencies

```bash
# Required NuGet packages
dotnet add package Newtonsoft.Json
dotnet add package UnityEngine (if using Unity)
```

### Initialize AI Manager

```csharp
// In your game's main update loop
private AIManager aiManager;

void Start()
{
    aiManager = new AIManager();
    aiManager.Initialize("Assets/Config/commanders.json");
}

void Update()
{
    aiManager.UpdateAI();
}
```

---

## 2. Core Concepts (TL;DR)

| Concept | What It Does | When It Runs |
|---------|--------------|--------------|
| **Strategic Intent** | Determines commander's high-level goal (Aggressive/Defensive/Balanced) | Every 30 frames |
| **Points of Interest (POI)** | Identifies tactical objectives (enemy base, resources, etc.) | Every 20 frames |
| **Behavior Tree** | Hierarchical decision-making (like a flowchart for AI) | Every frame |
| **Utility Scoring** | Scores actions and picks the highest-scoring one | Every frame |
| **Personality** | Modulates decisions (e.g., aggressive commander attacks more) | Every decision |
| **Pathfinding** | Calculates paths for units to move | On-demand (queued) |
| **Command Dispatch** | Sends orders to game engine (move, attack, build) | Every frame |

---

## 3. Key Classes & Their Roles

### Strategic Planning

```csharp
// High-level decision
var strategicIntent = new StrategicIntent();
strategicIntent.EvaluateIntent(gameState, personality);
// Result: commander.CurrentIntent = Aggressive/Defensive/etc

// Tactical objectives
var poi = new PointOfInterest { Type = POIType.EnemyBase, Position = vec3 };
poi.CalculatePriority(gameState, intent, personality);
// Result: poi.PriorityScore = 0.95 (very high priority)
```

### Decision Making

```csharp
// Behavior tree (flowchart for AI)
var tree = new DefensiveBehaviorTree();
tree.BuildTree(commander);
var status = tree.RootNode.Evaluate(gameState);
// Result: status = Running/Success/Failure

// Utility scoring (pick best action)
var evaluator = new UtilityEvaluator();
float attackScore = evaluator.EvaluateUtility(attackAction, gameState, personality);
float defendScore = evaluator.EvaluateUtility(defendAction, gameState, personality);
// Pick whichever has higher score
```

### Unit Control

```csharp
// Queue a command
var moveCmd = new MoveCommand { TargetPosition = new Vector3(10, 0, 10) };
dispatcher.QueueCommand(moveCmd);

// Dispatch to game engine
dispatcher.ExecuteQueue(); // Commands execute and modify game state
```

---

## 4. Common Tasks

### Create a New Commander Archetype

```csharp
// 1. Define personality
var personality = new CommanderPersonality("Nomad");
personality.Aggressiveness = 0.5f;
personality.Patience = 0.8f;
// ... set other traits

// 2. Create behavior tree
public class NomadBehaviorTree : BehaviorTree
{
    public override void BuildTree(AICommander commander)
    {
        var root = new SelectorNode("NomadRoot");
        
        // Add branches for nomad tactics
        // Branch: Scout and hit-and-run attacks
        // Branch: Avoid direct confrontation
        // Branch: Relocate base if threatened
        
        this.RootNode = root;
    }
}

// 3. Register in config
// In commanders.json:
{
    "name": "The Nomad",
    "archetype": "Nomad",
    "traits": { "aggressiveness": 0.5, ... }
}
```

### Add a New AI Action

```csharp
// 1. Create action class
public class MassAttackAction : ActionEvaluation
{
    public ActionType Type => ActionType.Attack;
    
    public float CalculateBaseUtility(AIGameState gameState)
    {
        // High utility if we have overwhelming force
        float forceRatio = gameState.AIMilitaryStrength / 
                          Mathf.Max(1, gameState.EnemyMilitaryStrength);
        return Mathf.Clamp01(forceRatio);
    }
}

// 2. Add to behavior tree
var massAttack = new ActionNode("MassAttack", gs => 
{
    var action = new MassAttackAction();
    return commander.ExecuteMassAttack(gs);
});
tree.AddChild(massAttack);

// 3. Test it
var score = evaluator.EvaluateUtility(massAttack, gameState, personality);
```

### Log AI Decisions (for Debugging)

```csharp
// Enable logging
var logger = new AIAnalyticsLogger();

// Log each decision
logger.LogDecision(commander, chosenAction, utilityScore);

// Export after match
logger.ExportLogs("match_debug.json");

// Inspect the JSON file to see all AI decisions in sequence
// Useful for judges to understand opponent reasoning
```

---

## 5. Integration Checklist

- [ ] **Game Engine Adapter**: Implement `IGameEngineAdapter` for your engine

```csharp
public class MyEngineAdapter : IGameEngineAdapter
{
    public Unit[] GetAllUnits() { /* ... */ }
    public void MoveUnit(Unit unit, Vector3 pos) { /* ... */ }
    // Implement all interface methods
}
```

- [ ] **Game State Provider**: Keep `AIGameState` synchronized with game world

```csharp
public void Update()
{
    groundTruth = gameEngine.GetWorldState();
    aiGameState.UpdateFromGameWorld(groundTruth, fogOfWar);
}
```

- [ ] **Command Execution**: Wire commands to game engine

```csharp
public void ExecuteCommand(Command cmd, Unit actor)
{
    if (cmd.IsValid(actor, gameState))
        cmd.Execute(actor, gameState);
}
```

- [ ] **Logging**: Optional but highly recommended for debugging

```csharp
var logger = new AIAnalyticsLogger();
logger.LogDecision(commander, action, score);
```

---

## 6. Performance Tips

### Distribute AI Work Across Frames

```csharp
// Good: Spread work over 5 frames per commander
public class AIUpdateManager
{
    void Update()
    {
        int phase = frameCount % 5;
        switch (phase)
        {
            case 0: UpdatePerception(); break;
            case 1: EvaluateStrategy(); break;
            case 2: MakeDecisions(); break;
            case 3: ExecuteCommands(); break;
            case 4: LogAnalytics(); break;
        }
        frameCount++;
    }
}

// Bad: Running all AI updates in one frame
// Result: FPS drops to 15-20 FPS (unplayable)
```

### Cache Expensive Computations

```csharp
// Cache pathfinding results
var cachedPath = pathCache.GetCachedPath(start, end);
if (cachedPath == null)
{
    // Compute new path
    var path = astar.FindPath(start, end);
    pathCache.CachePath(start, end, path);
}
```

### Use Fog-of-War to Limit Perception

```csharp
// AI should only "see" units within line-of-sight
var visibleEnemies = groundTruth.AllEnemyUnits
    .Where(u => fogOfWar.IsVisible(u.Position))
    .ToList();
// Much faster than tracking all enemy units
```

---

## 7. Debugging Gizmos

In your game editor, draw AI state to visualize decisions:

```csharp
public class AIDebugVisualizer : MonoBehaviour
{
    void OnDrawGizmosSelected()
    {
        // Draw Points of Interest
        Gizmos.color = Color.yellow;
        foreach (var poi in commander.GameState.ActivePOIs)
            Gizmos.DrawSphere(poi.Position, 3f);

        // Draw threats
        Gizmos.color = Color.red;
        foreach (var enemy in commander.GameState.EnemyUnitsNearby)
            Gizmos.DrawWireSphere(enemy.Position, 20f);

        // Draw unit targets
        Gizmos.color = Color.blue;
        foreach (var unit in commander.GameState.AIUnits)
            if (unit.HasTarget)
                Gizmos.DrawLine(unit.Position, unit.TargetPosition);
    }
}
```

---

## 8. Configuration (JSON)

Edit `commanders.json` to tune commander behaviors:

```json
{
  "commanders": [
    {
      "name": "The Architect",
      "archetype": "Architect",
      "traits": {
        "aggressiveness": 0.3,
        "riskTolerance": 0.2,
        "patience": 0.9,
        "cautiousness": 0.8
      },
      "behavior_tree": "defensive_tree.xml",
      "initial_resources": 500
    }
  ]
}
```

**Live-edit traits to balance difficulty:**

- Increase `aggressiveness` → commander attacks more
- Increase `cautiousness` → commander defends more
- Increase `patience` → commander waits for better timing

---

## 9. Testing & Validation

### Unit Test Example

```csharp
[TestClass]
public class AITests
{
    [TestMethod]
    public void TestDefensiveIntentUnderThreat()
    {
        // Arrange
        var gameState = new AIGameState { EnemyUnitsNearby = new List<Unit> { enemy1, enemy2 } };
        var personality = new CommanderPersonality("Architect");
        var intent = new StrategicIntent();

        // Act
        intent.EvaluateIntent(gameState, personality);

        // Assert
        Assert.AreEqual(StrategicIntent.IntentType.Defensive, intent.CurrentIntent);
    }
}
```

### Playtesting Checklist

- [ ] AI makes reasonable decisions (not obviously broken)
- [ ] AI adapts to player tactics (not scripted)
- [ ] AI has distinct personality (not all identical)
- [ ] Performance is smooth (30+ FPS)
- [ ] No infinite loops or game-breaking bugs

---

## 10. Common Pitfalls & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| FPS drops to 5-10 | AI running all updates per frame | Distribute work across frames (see #6) |
| AI is too dumb | Behavior tree is incomplete | Add more branches/conditions to tree |
| AI is too smart | Perfect information (sees all units) | Apply fog-of-war filtering |
| Decisions feel scripted | No personality modulation | Ensure personality traits affect scores |
| Game crashes | Invalid commands (e.g., move to unwalkable position) | Validate commands before execution |
| Infinite loops | Behavior tree cycle | Ensure leaf nodes eventually return Success/Failure |

---

## 11. API Cheat Sheet

### Strategic Planning

```csharp
intent.EvaluateIntent(gameState, personality);  // Update high-level goal
poi.CalculatePriority(gameState, intent, personality);  // Score objectives
```

### Decision Making

```csharp
var status = tree.RootNode.Evaluate(gameState);  // Execute behavior tree
var score = evaluator.EvaluateUtility(action, gameState, personality);  // Score action
```

### Unit Control

```csharp
dispatcher.QueueCommand(new MoveCommand { TargetPosition = vec3 });  // Queue order
dispatcher.ExecuteQueue();  // Dispatch all queued commands
pathfinder.RequestPath(start, end, unit, OnPathFound);  // Request path
```

### Logging & Debug

```csharp
logger.LogDecision(commander, action, score);  // Log decision
logger.ExportLogs("debug.json");  // Export analytics
```

---

## 12. Resources

- **Behavior Trees**: [Game Developer Article](https://www.gamedeveloper.com/programming/behavior-trees-for-ai-how-they-work)
- **Utility AI**: [GDC Talks on Utility Theory](https://gdcvault.com)
- **RTS AI**: [AI Algorithms in RTS Games](https://www.capermint.com/blog/real-time-strategy-ai-games/)
- **Pathfinding**: [A* Pathfinding Project](https://arongranberg.com/astar/features)

---

## 13. Getting Help

- **Is AI too aggressive?** → Decrease `aggressiveness` in commander config
- **Is AI not attacking?** → Check behavior tree has attack branches
- **Is performance bad?** → Check frame distribution in `AIUpdateManager`
- **Does AI feel dumb?** → Add more decision branches to behavior tree
- **Is game crashing?** → Enable logging and inspect debug JSON

---

**Last Updated**: November 2025  
**Version**: 1.0 (Production)

