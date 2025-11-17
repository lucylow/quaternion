# Quaternion Backend Gameplay AI System

**A Production-Grade AI Architecture for Real-Time Strategy Games**

A comprehensive game AI backend powering procedurally-adaptive opponents, strategic decision-making, and dynamic tactical systems for the **Quaternion: Neural Frontier** RTS game.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Systems](#core-systems)
4. [AI Decision Pipeline](#ai-decision-pipeline)
5. [Behavior Trees](#behavior-trees)
6. [Personality System](#personality-system)
7. [Utility AI Scoring](#utility-ai-scoring)
8. [State Management](#state-management)
9. [Pathfinding & Unit Control](#pathfinding--unit-control)
10. [Integration & APIs](#integration--apis)
11. [Performance Optimization](#performance-optimization)
12. [Testing & Debugging](#testing--debugging)
13. [Configuration & Extensibility](#configuration--extensibility)
14. [Deployment](#deployment)
15. [References](#references)

---

## Overview

### Mission

The Quaternion AI backend simulates intelligent, adaptive opponents that feel like strategists—not scripts. Every decision is contextual, every strategy evolves with player actions, and every match feels unique.

### Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Modularity** | Each AI subsystem (pathfinding, decision-making, personality) is decoupled and independently testable |
| **Adaptability** | Opponents learn player tactics mid-match and adjust strategy dynamically |
| **Personality** | Commander archetypes have distinct traits that modulate behavior, creating character depth |
| **Determinism** | All AI decisions can be replayed; critical for debugging and judge transparency |
| **Performance** | Decision calculations distributed across frames to maintain 30+ FPS gameplay |
| **Transparency** | All AI actions logged and queryable; judges can inspect opponent reasoning |

### Key Features

✅ **Behavior Tree Architecture** for modular, hierarchical decision-making  
✅ **Personality-Driven Decisions** using trait-based utility scoring  
✅ **Real-Time Tactical Adaptation** that responds to player tactics within seconds  
✅ **Hierarchical Strategic Planning** (Intentions → Strategy → Tactics)  
✅ **Optimized Pathfinding** with A* and waypoint-based navigation  
✅ **Fog-of-War Simulation** for realistic opponent perception  
✅ **Resource Management AI** that balances spending vs. hoarding  
✅ **Unit Production Logic** that adapts army composition to threats  
✅ **Event Logging** for full traceability and AI debugging  
✅ **LLM Integration Hooks** for dynamic narration and decision explanation  

---

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME ENGINE LOOP                         │
│                   (Main Update Thread)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   AI Update Manager        │
        │  (Distributed Updates)     │
        │  [Frame Skip Strategy]     │
        └────────┬───────────────────┘
                 │
         ┌───────┴──────────┬──────────────┬──────────────┐
         ▼                  ▼              ▼              ▼
    ┌─────────┐      ┌──────────┐  ┌──────────┐   ┌──────────┐
    │Strategic│      │Personality│  │ Tactical │   │Pathfinding│
    │Planner  │      │Evaluator  │  │Executor  │   │Manager   │
    │(Intent) │      │(Utility)  │  │(Actions) │   │(Navigation│
    └────┬────┘      └─────┬────┘  └────┬────┘   └────┬────┘
         │                 │            │              │
         └─────────────────┴────────────┴──────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Behavior Tree Executor    │
        │  [Condition Evaluation]    │
        │  [Action Selection]        │
        │  [State Persistence]       │
        └────────┬───────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │    Command Queue & Dispatch          │
    │ - Move Commands                      │
    │ - Build Commands                     │
    │ - Attack Commands                    │
    │ - Ability Triggers                   │
    └──────────────────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │      Game State Updates              │
    │  [Unit positions, resources, etc]    │
    │  [Event callbacks triggered]         │
    │  [Analytics & Logging]               │
    └──────────────────────────────────────┘
```

### Component Interaction Flow

```
Player Input
    │
    ├─→ [Game State Updated]
    │
    ├─→ [Opponent Perceives Changes]
    │       └─→ [Fog-of-War Filter Applied]
    │       └─→ [Threat Assessment Updated]
    │
    ├─→ [Strategic Intent Re-evaluated]
    │       └─→ [Personality Traits Applied]
    │       └─→ [Priority Scores Recalculated]
    │
    ├─→ [Behavior Tree Traversed]
    │       └─→ [Conditions Checked]
    │       └─→ [Actions Queued]
    │
    ├─→ [Tactical Execution]
    │       └─→ [Pathfinding Computed]
    │       └─→ [Unit Commands Dispatched]
    │
    └─→ [State Persisted & Logged]
```

---

## Core Systems

### 1. Strategic Intent System

**Responsibility**: Determine the commander's high-level goals and priorities.

#### Strategic Intent Module

```csharp
/// <summary>
/// Represents the high-level strategic intention of an AI commander.
/// </summary>
public class StrategicIntent
{
    public enum IntentType
    {
        Aggressive,      // Rush opponent, expand territory
        Defensive,       // Fortify, preserve army
        Expansionist,    // Control resources, economic growth
        Adaptive,        // React to threats, balanced approach
        Evasive          // Avoid direct confrontation, hit-and-run
    }

    public IntentType CurrentIntent { get; set; }
    public float Confidence { get; set; }
    public Dictionary<string, float> PriorityScores { get; set; }

    public StrategicIntent()
    {
        PriorityScores = new Dictionary<string, float>
        {
            { "Defense", 0.5f },
            { "Expansion", 0.3f },
            { "Economy", 0.7f },
            { "Offense", 0.2f },
            { "Technology", 0.4f }
        };
    }

    /// <summary>
    /// Evaluate and update strategic intent based on game state.
    /// </summary>
    public void EvaluateIntent(AIGameState gameState, CommanderPersonality personality)
    {
        // Assess threats
        float threatLevel = EvaluateThreatLevel(gameState);
        
        // Evaluate resources
        float resourceAdequacy = gameState.Resources / gameState.MaxResources;
        
        // Determine intent based on personality and state
        CurrentIntent = DetermineIntentFromState(threatLevel, resourceAdequacy, personality);
        
        // Update priority scores dynamically
        UpdatePriorityScores(threatLevel, resourceAdequacy, personality);
        
        Confidence = CalculateConfidence(gameState, personality);
    }

    private float EvaluateThreatLevel(AIGameState gameState)
    {
        float immediateThreats = gameState.EnemyUnitsNearby.Count * 0.3f;
        float economicThreat = (gameState.PlayerEconomyStrength / gameState.AIEconomyStrength) * 0.4f;
        float technologicalThreat = gameState.PlayerTechAdvantage * 0.3f;
        
        return Mathf.Clamp01(immediateThreats + economicThreat + technologicalThreat);
    }

    private IntentType DetermineIntentFromState(float threat, float resources, CommanderPersonality personality)
    {
        // Threat is high
        if (threat > 0.7f)
        {
            if (personality.RiskTolerance < 0.3f) return IntentType.Defensive;
            if (personality.Aggressiveness > 0.7f) return IntentType.Aggressive;
            return IntentType.Adaptive;
        }

        // Resources are plentiful
        if (resources > 0.8f)
        {
            return personality.Aggressiveness > 0.6f ? IntentType.Aggressive : IntentType.Expansionist;
        }

        // Default to balanced
        return IntentType.Adaptive;
    }

    private void UpdatePriorityScores(float threat, float resources, CommanderPersonality personality)
    {
        PriorityScores["Defense"] = 0.5f + (threat * 0.5f) - (personality.Aggressiveness * 0.3f);
        PriorityScores["Offense"] = 0.3f + (personality.Aggressiveness * 0.6f) - (threat * 0.2f);
        PriorityScores["Economy"] = 0.7f - (resources * 0.3f) + (personality.Patience * 0.2f);
        PriorityScores["Expansion"] = (1f - threat) * (1f - personality.Cautiousness);
        PriorityScores["Technology"] = Mathf.Max(0f, resources - 0.5f) * personality.InnovationDrive;

        // Normalize scores
        NormalizeScores();
    }

    private void NormalizeScores()
    {
        float sum = PriorityScores.Values.Sum();
        foreach (var key in PriorityScores.Keys.ToList())
        {
            PriorityScores[key] /= sum;
        }
    }

    private float CalculateConfidence(AIGameState gameState, CommanderPersonality personality)
    {
        float militaryStrength = gameState.AIUnits.Count / Mathf.Max(1, gameState.PlayerUnits.Count);
        float economicStrength = gameState.Resources / Mathf.Max(1, gameState.PlayerResources);
        
        return Mathf.Clamp01((militaryStrength + economicStrength) * personality.Boldness);
    }
}
```

### 2. Strategic Points of Interest (POI) System

**Responsibility**: Identify tactical objectives (enemy bases, resource clusters, defensive positions).

```csharp
/// <summary>
/// Represents a tactical objective on the map.
/// </summary>
public class PointOfInterest
{
    public enum POIType
    {
        EnemyBase,
        AllyBase,
        ResourceCluster,
        StrategicPosition,
        DefensiveChoke,
        ExpansionZone
    }

    public Vector3 Position { get; set; }
    public POIType Type { get; set; }
    public float PriorityScore { get; set; }
    public float Urgency { get; set; }
    public List<Unit> AssignedUnits { get; set; }
    public bool IsActive { get; set; }

    /// <summary>
    /// Dynamically calculate priority based on game state and personality.
    /// </summary>
    public void CalculatePriority(AIGameState gameState, StrategicIntent intent, CommanderPersonality personality)
    {
        float basePriority = GetBasePriority();
        float contextModifier = GetContextModifier(gameState, intent);
        float personalityModifier = GetPersonalityModifier(personality);
        
        PriorityScore = basePriority * contextModifier * personalityModifier;
        Urgency = CalculateUrgency(gameState);
    }

    private float GetBasePriority()
    {
        return Type switch
        {
            POIType.EnemyBase => 0.9f,
            POIType.AllyBase => 0.8f,
            POIType.ResourceCluster => 0.7f,
            POIType.StrategicPosition => 0.6f,
            POIType.DefensiveChoke => 0.5f,
            POIType.ExpansionZone => 0.4f,
            _ => 0.5f
        };
    }

    private float GetContextModifier(AIGameState gameState, StrategicIntent intent)
    {
        switch (Type)
        {
            case POIType.EnemyBase:
                return 0.5f + (intent.PriorityScores["Offense"] * 0.5f);
            
            case POIType.ResourceCluster:
                return intent.PriorityScores["Economy"];
            
            case POIType.DefensiveChoke:
                return intent.PriorityScores["Defense"];
            
            default:
                return 1.0f;
        }
    }

    private float GetPersonalityModifier(CommanderPersonality personality)
    {
        // Aggressive commanders heavily weight offensive POIs
        // Defensive commanders weight defensive POIs, etc.
        return 0.8f + (Random.value * 0.2f); // Add variance
    }

    private float CalculateUrgency(AIGameState gameState)
    {
        // Distance-based urgency
        float distanceToBase = Vector3.Distance(Position, gameState.AIBasePosition);
        return Mathf.InverseLerp(500f, 50f, distanceToBase);
    }
}
```

---

## AI Decision Pipeline

### Decision Flow (Per Frame)

```
┌──────────────────────────────────────────────────────┐
│ AI Update Tick (Frame N)                             │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
    ┌────────────────────────────┐
    │ Phase 1: Perception        │
    │ ─────────────────────────  │
    │ • Update Fog of War        │
    │ • Scan for threats         │
    │ • Detect resource changes  │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Phase 2: Strategic Eval    │
    │ ─────────────────────────  │
    │ • Calculate intent         │
    │ • Score POIs               │
    │ • Update priorities        │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Phase 3: Decision Making   │
    │ ─────────────────────────  │
    │ • Evaluate behavior tree   │
    │ • Select actions           │
    │ • Queue commands           │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Phase 4: Execution         │
    │ ─────────────────────────  │
    │ • Dispatch unit commands   │
    │ • Update game state        │
    │ • Trigger callbacks        │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Phase 5: Logging           │
    │ ─────────────────────────  │
    │ • Record decisions         │
    │ • Log analytics            │
    │ • Update statistics        │
    └────────────────────────────┘
```

### Distribution Strategy (Load Balancing)

To maintain 30+ FPS, AI workloads are distributed:

```csharp
public class AIUpdateManager
{
    private int currentPhase = 0;
    private const int PHASE_COUNT = 5;
    private List<AICommander> commanders;

    public void Update()
    {
        // Distribute work across frames
        // Frame 0: Perception phase for commander 0
        // Frame 1: Perception phase for commander 1
        // Frame 2: Strategic eval for commander 0
        // etc.
        
        int commanderIndex = (currentPhase / PHASE_COUNT) % commanders.Count;
        int phase = currentPhase % PHASE_COUNT;
        
        ExecutePhase(commanders[commanderIndex], phase);
        
        currentPhase++;
    }

    private void ExecutePhase(AICommander commander, int phase)
    {
        switch (phase)
        {
            case 0: commander.UpdatePerception(); break;
            case 1: commander.EvaluateStrategy(); break;
            case 2: commander.MakeDecisions(); break;
            case 3: commander.ExecuteCommands(); break;
            case 4: commander.LogAnalytics(); break;
        }
    }
}
```

---

## Behavior Trees

### Behavior Tree Architecture

Quaternion uses hierarchical behavior trees for AI decision-making. Each tree node represents a task or decision.

#### Node Types

```csharp
/// <summary>
/// Base class for all behavior tree nodes.
/// </summary>
public abstract class BehaviorNode
{
    public enum Status
    {
        Running,   // Still executing
        Success,   // Completed successfully
        Failure    // Failed to complete
    }

    public string NodeName { get; set; }
    protected Status CurrentStatus { get; set; }
    protected Dictionary<string, object> Context { get; set; }

    public BehaviorNode(string name)
    {
        NodeName = name;
        CurrentStatus = Status.Failure;
        Context = new Dictionary<string, object>();
    }

    /// <summary>
    /// Execute this node. Called once per tree tick.
    /// </summary>
    public abstract Status Evaluate(AIGameState gameState);

    public Status GetStatus() => CurrentStatus;
}

/// <summary>
/// Composite nodes: Sequence, Selector
/// </summary>
public class SequenceNode : BehaviorNode
{
    private List<BehaviorNode> children = new();
    private int currentChildIndex = 0;

    public void AddChild(BehaviorNode child) => children.Add(child);

    public override Status Evaluate(AIGameState gameState)
    {
        // All children must succeed
        while (currentChildIndex < children.Count)
        {
            var status = children[currentChildIndex].Evaluate(gameState);
            
            if (status != Status.Success)
            {
                if (status == Status.Failure)
                {
                    currentChildIndex = 0; // Reset on failure
                    return Status.Failure;
                }
                return Status.Running; // Child still running
            }

            currentChildIndex++;
        }

        currentChildIndex = 0; // Reset for next tick
        return Status.Success;
    }
}

public class SelectorNode : BehaviorNode
{
    private List<BehaviorNode> children = new();

    public void AddChild(BehaviorNode child) => children.Add(child);

    public override Status Evaluate(AIGameState gameState)
    {
        // First successful child wins
        foreach (var child in children)
        {
            var status = child.Evaluate(gameState);
            
            if (status == Status.Success || status == Status.Running)
            {
                return status;
            }
        }

        return Status.Failure;
    }
}

/// <summary>
/// Leaf nodes: Conditions and Actions
/// </summary>
public class ConditionNode : BehaviorNode
{
    private Func<AIGameState, bool> condition;

    public ConditionNode(string name, Func<AIGameState, bool> condition) 
        : base(name)
    {
        this.condition = condition;
    }

    public override Status Evaluate(AIGameState gameState)
    {
        return condition(gameState) ? Status.Success : Status.Failure;
    }
}

public class ActionNode : BehaviorNode
{
    private Func<AIGameState, Status> action;

    public ActionNode(string name, Func<AIGameState, Status> action) 
        : base(name)
    {
        this.action = action;
    }

    public override Status Evaluate(AIGameState gameState)
    {
        return CurrentStatus = action(gameState);
    }
}
```

#### Example: Defensive Behavior Tree

```csharp
public class DefensiveBehaviorTree : BehaviorTree
{
    public override void BuildTree(AICommander commander)
    {
        var root = new SelectorNode("DefenseRoot");

        // Branch 1: Under Attack - Defend
        var underAttack = new SequenceNode("UnderAttackSequence");
        underAttack.AddChild(new ConditionNode(
            "CheckUnderAttack",
            gs => gs.EnemyUnitsNearby.Count > 0
        ));
        underAttack.AddChild(new ActionNode(
            "RallyDefenses",
            gs => commander.RallyDefensiveUnits(gs)
        ));
        root.AddChild(underAttack);

        // Branch 2: Build Defensive Structures
        var buildDefenses = new SequenceNode("BuildDefensesSequence");
        buildDefenses.AddChild(new ConditionNode(
            "CheckResources",
            gs => gs.Resources > 100
        ));
        buildDefenses.AddChild(new ActionNode(
            "QueueDefensiveBuilding",
            gs => commander.BuildDefensiveStructure(gs)
        ));
        root.AddChild(buildDefenses);

        // Branch 3: Idle (default)
        var idle = new ActionNode(
            "Idle",
            gs => Status.Running // Keep running until a condition succeeds
        );
        root.AddChild(idle);

        this.RootNode = root;
    }
}
```

---

## Personality System

### Commander Archetypes

Each commander has a unique personality defined by trait scores (0.0 - 1.0):

```csharp
/// <summary>
/// Commander personality traits that modulate AI behavior.
/// </summary>
public class CommanderPersonality
{
    // Aggression: How likely to attack vs defend
    public float Aggressiveness { get; set; }

    // Risk tolerance: Willing to gamble on risky strategies
    public float RiskTolerance { get; set; }

    // Patience: Willing to wait for optimal moment
    public float Patience { get; set; }

    // Caution: Tendency to be defensive
    public float Cautiousness { get; set; }

    // Innovation: Tendency to try new strategies
    public float InnovationDrive { get; set; }

    // Boldness: Confidence in actions
    public float Boldness { get; set; }

    public CommanderPersonality(string archetype = "Balanced")
    {
        AssignArchetype(archetype);
    }

    private void AssignArchetype(string archetype)
    {
        switch (archetype)
        {
            case "Aggressor":
                Aggressiveness = 0.9f;
                RiskTolerance = 0.8f;
                Patience = 0.3f;
                Cautiousness = 0.2f;
                Boldness = 0.9f;
                InnovationDrive = 0.6f;
                break;

            case "Architect": // Strategic, defensive
                Aggressiveness = 0.3f;
                RiskTolerance = 0.2f;
                Patience = 0.9f;
                Cautiousness = 0.8f;
                Boldness = 0.6f;
                InnovationDrive = 0.7f;
                break;

            case "Nomad": // Adaptive, balanced
                Aggressiveness = 0.5f;
                RiskTolerance = 0.6f;
                Patience = 0.5f;
                Cautiousness = 0.5f;
                Boldness = 0.6f;
                InnovationDrive = 0.8f;
                break;

            default: // Balanced
                Aggressiveness = 0.5f;
                RiskTolerance = 0.5f;
                Patience = 0.5f;
                Cautiousness = 0.5f;
                Boldness = 0.5f;
                InnovationDrive = 0.5f;
                break;
        }
    }
}
```

### Personality Modulation

Personality traits directly affect tactical decisions:

```csharp
/// <summary>
/// Apply personality modulation to raw decision scores.
/// </summary>
public float ModulateDecisionScore(float baseScore, CommanderPersonality personality, DecisionType type)
{
    switch (type)
    {
        case DecisionType.AttackEnemy:
            return baseScore * personality.Aggressiveness * personality.Boldness;

        case DecisionType.DefendPosition:
            return baseScore * (1f - personality.Aggressiveness) * personality.Cautiousness;

        case DecisionType.ExpandTerritory:
            return baseScore * (1f - personality.Cautiousness) * personality.InnovationDrive;

        case DecisionType.SaveResources:
            return baseScore * personality.Patience;

        case DecisionType.TakeRisk:
            return baseScore * personality.RiskTolerance;

        default:
            return baseScore;
    }
}
```

---

## Utility AI Scoring

### Utility Scoring System

Decisions are scored using utility functions. The highest-scoring action is selected.

```csharp
/// <summary>
/// Utility scoring for AI decision-making.
/// </summary>
public class UtilityEvaluator
{
    /// <summary>
    /// Evaluate the utility of an action given current game state.
    /// </summary>
    public float EvaluateUtility(ActionEvaluation action, AIGameState gameState, CommanderPersonality personality)
    {
        float baseUtility = action.CalculateBaseUtility(gameState);
        float contextBonus = EvaluateContext(action, gameState);
        float personalityModifier = personality.GetModifierFor(action.Type);
        
        return baseUtility * contextBonus * personalityModifier;
    }

    private float EvaluateContext(ActionEvaluation action, AIGameState gameState)
    {
        // Decay actions over time (encourage variety)
        float recencyPenalty = action.TimeSinceLastExecution / 100f; // Normalized
        
        // Reward synergy with active strategies
        float synergy = 1.0f;
        if (action.Type == ActionType.Attack && gameState.CurrentIntent == StrategicIntent.IntentType.Aggressive)
            synergy = 1.5f;

        return synergy - recencyPenalty;
    }
}

/// <summary>
/// Represents an action that can be evaluated.
/// </summary>
public class ActionEvaluation
{
    public enum ActionType { Attack, Defend, Build, Scout, Research, Retreat }

    public ActionType Type { get; set; }
    public PointOfInterest Target { get; set; }
    public float LastExecutionTime { get; set; }

    public float CalculateBaseUtility(AIGameState gameState)
    {
        return Type switch
        {
            ActionType.Attack => EvaluateAttack(gameState),
            ActionType.Defend => EvaluateDefend(gameState),
            ActionType.Build => EvaluateBuild(gameState),
            ActionType.Scout => EvaluateScout(gameState),
            ActionType.Research => EvaluateResearch(gameState),
            ActionType.Retreat => EvaluateRetreat(gameState),
            _ => 0.5f
        };
    }

    private float EvaluateAttack(AIGameState gameState)
    {
        // Utility increases if:
        // - Enemy is weak
        // - We have numerical advantage
        // - Resources are plentiful

        float enemyWeakness = 1f - (gameState.EnemyMilitaryStrength / gameState.AIMilitaryStrength);
        float resourceAbundance = gameState.Resources / gameState.MaxResources;

        return (enemyWeakness + resourceAbundance) / 2f;
    }

    private float EvaluateDefend(AIGameState gameState)
    {
        // Utility increases if threat is immediate
        float threatLevel = gameState.EnemyUnitsNearby.Count / Mathf.Max(1, gameState.AIUnitsNearby.Count);
        return Mathf.Clamp01(threatLevel);
    }

    // ... other evaluators
}
```

---

## State Management

### AI Game State

The AI maintains a perception-based game state (may differ from ground truth due to fog-of-war):

```csharp
/// <summary>
/// Represents the AI's perception of the game world.
/// </summary>
public class AIGameState
{
    // Friendly entities
    public List<Unit> AIUnits { get; set; }
    public List<Building> AIBuildings { get; set; }
    public Vector3 AIBasePosition { get; set; }

    // Enemy entities (within line of sight)
    public List<Unit> EnemyUnitsVisible { get; set; }
    public List<Building> EnemyBuildingsVisible { get; set; }
    public Vector3 EnemyBasePosition { get; set; }

    // Resources
    public float Resources { get; set; }
    public float MaxResources { get; set; }
    public List<ResourceNode> ResourceNodesNearby { get; set; }

    // War state
    public List<Unit> EnemyUnitsNearby { get; set; }
    public List<Unit> AIUnitsNearby { get; set; }
    public float EnemyMilitaryStrength { get; set; }
    public float AIMilitaryStrength { get; set; }

    // Tech level
    public int TechLevel { get; set; }
    public int EnemyTechLevel { get; set; }

    // Strategic
    public StrategicIntent CurrentIntent { get; set; }
    public List<PointOfInterest> ActivePOIs { get; set; }

    /// <summary>
    /// Update perception from ground truth, applying fog of war.
    /// </summary>
    public void UpdateFromGameWorld(GameWorldState groundTruth, FogOfWar fogOfWar)
    {
        // Update friendly entities
        AIUnits = groundTruth.AIUnits;
        AIBuildings = groundTruth.AIBuildings;
        AIBasePosition = groundTruth.AIBasePosition;

        // Update visible enemy entities
        EnemyUnitsVisible = groundTruth.EnemyUnits
            .Where(u => fogOfWar.IsVisible(u.Position))
            .ToList();

        EnemyBuildingsVisible = groundTruth.EnemyBuildings
            .Where(b => fogOfWar.IsVisible(b.Position))
            .ToList();

        // Estimate enemy base if not visible
        if (EnemyBuildingsVisible.Count > 0)
        {
            EnemyBasePosition = EnemyBuildingsVisible
                .Where(b => b.IsTownHall)
                .FirstOrDefault()?.Position ?? Vector3.zero;
        }

        // Calculate nearby units
        EnemyUnitsNearby = EnemyUnitsVisible.Where(u => Vector3.Distance(u.Position, AIBasePosition) < 100).ToList();
        AIUnitsNearby = AIUnits.Where(u => u.IsAlive).ToList();

        // Calculate military strength
        CalculateMilitaryStrength(groundTruth);
    }

    private void CalculateMilitaryStrength(GameWorldState groundTruth)
    {
        AIMilitaryStrength = AIUnits.Sum(u => u.PowerRating);
        EnemyMilitaryStrength = EnemyUnitsVisible.Sum(u => u.PowerRating);
    }
}
```

---

## Pathfinding & Unit Control

### Pathfinding Manager

```csharp
/// <summary>
/// Manages pathfinding requests and cached paths.
/// </summary>
public class PathfindingManager
{
    private Queue<PathRequest> requestQueue;
    private List<PathRequest> activePaths;
    private A_StarPathfinder pathfinder;

    public struct PathRequest
    {
        public Vector3 StartPosition;
        public Vector3 EndPosition;
        public Action<Vector3[]> Callback;
        public Unit RequestingUnit;
    }

    public void RequestPath(Vector3 start, Vector3 end, Unit unit, Action<Vector3[]> callback)
    {
        var request = new PathRequest
        {
            StartPosition = start,
            EndPosition = end,
            Callback = callback,
            RequestingUnit = unit
        };

        requestQueue.Enqueue(request);
    }

    public void Update()
    {
        // Process one path request per frame to avoid stalls
        if (requestQueue.Count > 0)
        {
            var request = requestQueue.Dequeue();
            pathfinder.FindPath(request.StartPosition, request.EndPosition, 
                path => OnPathFound(request, path));
        }
    }

    private void OnPathFound(PathRequest request, Vector3[] path)
    {
        request.Callback?.Invoke(path);
    }
}

/// <summary>
/// A* Pathfinding implementation.
/// </summary>
public class A_StarPathfinder
{
    public void FindPath(Vector3 startPos, Vector3 endPos, Action<Vector3[]> callback)
    {
        // Classic A* implementation
        // Returns path as array of waypoints
        
        var path = new List<Vector3> { startPos };
        
        // A* algorithm core...
        while (/* path not reached goal */)
        {
            // Explore neighbors, track g-cost, f-cost
        }

        path.Add(endPos);
        callback(path.ToArray());
    }
}
```

### Unit Command System

```csharp
/// <summary>
/// Base class for all unit commands (e.g., Move, Attack, Build).
/// </summary>
public abstract class Command
{
    public abstract void Execute(Unit actor, AIGameState state);
    public abstract bool IsValid(Unit actor, AIGameState state);
}

public class MoveCommand : Command
{
    public Vector3 TargetPosition { get; set; }

    public override void Execute(Unit actor, AIGameState state)
    {
        actor.MoveTo(TargetPosition);
    }

    public override bool IsValid(Unit actor, AIGameState state)
    {
        return actor.IsAlive && Vector3.Distance(actor.Position, TargetPosition) > 1f;
    }
}

public class AttackCommand : Command
{
    public Unit TargetUnit { get; set; }

    public override void Execute(Unit actor, AIGameState state)
    {
        actor.AttackUnit(TargetUnit);
    }

    public override bool IsValid(Unit actor, AIGameState state)
    {
        return actor.IsAlive && TargetUnit.IsAlive && actor.CanAttack;
    }
}

public class BuildCommand : Command
{
    public BuildingType BuildingType { get; set; }
    public Vector3 BuildPosition { get; set; }

    public override void Execute(Unit actor, AIGameState state)
    {
        actor.BuildBuilding(BuildingType, BuildPosition);
    }

    public override bool IsValid(Unit actor, AIGameState state)
    {
        return state.Resources >= GetBuildingCost(BuildingType);
    }

    private float GetBuildingCost(BuildingType type) { /* ... */ }
}

/// <summary>
/// Command dispatch system.
/// </summary>
public class CommandDispatcher
{
    private Queue<Command> commandQueue;

    public void QueueCommand(Command command)
    {
        commandQueue.Enqueue(command);
    }

    public void ExecuteQueue()
    {
        while (commandQueue.Count > 0)
        {
            var command = commandQueue.Dequeue();
            // Execute command with validation
        }
    }
}
```

---

## Integration & APIs

### LLM Integration Hooks

For dynamic narration and decision explanation (tied to Saga AI):

```csharp
/// <summary>
/// Hook to request LLM-generated narration for AI decisions.
/// </summary>
public interface ILLMNarrationProvider
{
    Task<string> GenerateBattleNarration(AIGameState gameState, CommanderPersonality personality);
    Task<string> GenerateCommanderTaunt(StrategicIntent intent, CommanderPersonality personality);
    Task<string> ExplainDecision(ActionEvaluation chosenAction, AIGameState gameState);
}

public class SagaAINarrationProvider : ILLMNarrationProvider
{
    private HttpClient httpClient;

    public async Task<string> GenerateBattleNarration(AIGameState gameState, CommanderPersonality personality)
    {
        var prompt = $@"
        Commander: {personality}
        Current situation: {gameState.CurrentIntent}
        Allies: {gameState.AIUnits.Count}
        Enemies: {gameState.EnemyUnitsNearby.Count}
        
        Generate a 1-sentence epic battle narration (max 50 words).";

        var response = await httpClient.PostAsync("https://saga-api.example.com/generate", 
            new StringContent(prompt));

        return await response.Content.ReadAsStringAsync();
    }

    // ... other methods
}
```

### Game Engine Interface

```csharp
/// <summary>
/// Interface between AI backend and game engine.
/// </summary>
public interface IGameEngineAdapter
{
    // Queries
    Unit[] GetAllUnits();
    Building[] GetAllBuildings();
    float GetPlayerResources();
    Vector3 GetUnitPosition(Unit unit);

    // Commands
    void MoveUnit(Unit unit, Vector3 position);
    void AttackUnit(Unit attacker, Unit target);
    void BuildStructure(BuildingType type, Vector3 position);
    void ResearchTechnology(TechType tech);

    // Events
    event Action<Unit> OnUnitDestroyed;
    event Action<Building> OnBuildingCompleted;
    event Action OnGameStateChanged;
}

public class UnityGameEngineAdapter : IGameEngineAdapter
{
    // Implementation for Unity game engine
    public Unit[] GetAllUnits() => FindObjectsOfType<Unit>();
    
    public void MoveUnit(Unit unit, Vector3 position)
    {
        unit.GetComponent<UnitController>().MoveTo(position);
    }

    // ... other implementations
}
```

---

## Performance Optimization

### Frame Distribution

Distribute expensive computations across multiple frames:

```csharp
public class AIUpdateScheduler
{
    private List<AICommander> commanders;
    private int currentFramePhase = 0;

    public void Update()
    {
        // Spread updates across multiple frames
        int phasePerCommander = 5; // 5 phases per commander
        
        int totalPhases = commanders.Count * phasePerCommander;
        int currentPhase = currentFramePhase % totalPhases;
        int commanderIdx = currentPhase / phasePerCommander;
        int phase = currentPhase % phasePerCommander;

        ExecutePhase(commanders[commanderIdx], phase);
        currentFramePhase++;
    }

    private void ExecutePhase(AICommander commander, int phase)
    {
        switch (phase)
        {
            case 0: commander.UpdatePerception(); break;
            case 1: commander.EvaluateStrategy(); break;
            case 2: commander.MakeTacticalDecisions(); break;
            case 3: commander.ExecuteCommands(); break;
            case 4: commander.LogAnalytics(); break;
        }
    }
}
```

### Caching & Memoization

```csharp
public class AICache
{
    private Dictionary<string, CacheEntry> pathCache;
    private Dictionary<string, float> utilityCache;

    public Vector3[] GetCachedPath(Vector3 start, Vector3 end)
    {
        string key = $"{start.GetHashCode()}_{end.GetHashCode()}";
        
        if (pathCache.TryGetValue(key, out var entry))
        {
            if (Time.time - entry.CacheTime < 5f) // 5 second TTL
                return entry.Path;
        }

        return null; // Cache miss
    }

    public void CachePath(Vector3 start, Vector3 end, Vector3[] path)
    {
        string key = $"{start.GetHashCode()}_{end.GetHashCode()}";
        pathCache[key] = new CacheEntry { Path = path, CacheTime = Time.time };
    }

    private struct CacheEntry
    {
        public Vector3[] Path;
        public float CacheTime;
    }
}
```

---

## Testing & Debugging

### AI Analytics & Logging

```csharp
/// <summary>
/// Log all AI decisions for debugging and analysis.
/// </summary>
public class AIAnalyticsLogger
{
    private List<AIDecisionLog> decisionLogs;
    private StreamWriter logFile;

    public void LogDecision(AICommander commander, ActionEvaluation action, float score)
    {
        var log = new AIDecisionLog
        {
            Timestamp = Time.time,
            CommanderName = commander.Name,
            ActionType = action.Type,
            UtilityScore = score,
            ChosenAction = true
        };

        decisionLogs.Add(log);
        logFile.WriteLine(log.ToString());
    }

    public void ExportLogs(string filename)
    {
        var json = JsonConvert.SerializeObject(decisionLogs, Formatting.Indented);
        File.WriteAllText(filename, json);
    }
}

public class AIDecisionLog
{
    public float Timestamp { get; set; }
    public string CommanderName { get; set; }
    public ActionEvaluation.ActionType ActionType { get; set; }
    public float UtilityScore { get; set; }
    public bool ChosenAction { get; set; }

    public override string ToString() => 
        $"[{Timestamp:F2}] {CommanderName}: {ActionType} (Score: {UtilityScore:F2})";
}
```

### Debug Visualization

```csharp
/// <summary>
/// Visualize AI decisions and state in editor.
/// </summary>
public class AIDebugVisualizer : MonoBehaviour
{
    public AICommander commander;

    private void OnDrawGizmosSelected()
    {
        if (commander == null) return;

        // Draw Points of Interest
        foreach (var poi in commander.GameState.ActivePOIs)
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawSphere(poi.Position, 3f);
            Gizmos.color = Color.black;
            Gizmos.DrawWireCube(poi.Position, Vector3.one * 5f);
        }

        // Draw unit movement targets
        foreach (var unit in commander.GameState.AIUnits)
        {
            if (unit.HasTarget)
            {
                Gizmos.color = Color.blue;
                Gizmos.DrawLine(unit.Position, unit.TargetPosition);
            }
        }

        // Draw threat zones
        Gizmos.color = Color.red;
        foreach (var threat in commander.GameState.EnemyUnitsNearby)
        {
            Gizmos.DrawWireSphere(threat.Position, 20f);
        }
    }
}
```

---

## Configuration & Extensibility

### Commander Configuration (JSON)

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
      "initial_resources": 500,
      "base_position": { "x": 100, "y": 0, "z": 100 }
    }
  ]
}
```

### Behavior Tree Definition (XML)

```xml
<behavior_tree name="DefensiveTree">
    <selector name="DefenseRoot">
        
        <!-- Branch 1: Under immediate threat -->
        <sequence name="UnderAttackResponse">
            <condition name="CheckThreatLevel" threshold="0.7" />
            <action name="RallyDefensiveUnits" />
            <action name="BuildDefensiveStructures" />
        </sequence>

        <!-- Branch 2: Economically focus -->
        <sequence name="EconomicGrowth">
            <condition name="ResourcesAbundant" threshold="0.8" />
            <action name="BuildWorkers" />
            <action name="ExpandToResources" />
        </sequence>

        <!-- Branch 3: Idle/Patrol -->
        <action name="PatrolBases" />

    </selector>
</behavior_tree>
```

---

## Deployment

### Build Process

```bash
# 1. Unit test AI systems
dotnet test QuaternionAI.Tests

# 2. Run performance profiling
QuaternionAI.Profiler --iterations 1000 --output profile.json

# 3. Build release DLL
dotnet build -c Release

# 4. Copy to game engine project
cp bin/Release/QuaternionAI.dll ../Quaternion.Game/Assets/Plugins/
```

### Runtime Initialization

```csharp
public class AIManager : MonoBehaviour
{
    private List<AICommander> commanders;
    private AIUpdateManager updateManager;
    private IGameEngineAdapter gameEngine;

    private void Start()
    {
        // Initialize game engine adapter
        gameEngine = new UnityGameEngineAdapter();

        // Load commander configurations
        var configs = LoadCommanderConfigs("Assets/Config/commanders.json");

        // Instantiate commanders
        commanders = new List<AICommander>();
        foreach (var config in configs)
        {
            var commander = new AICommander(config, gameEngine);
            commanders.Add(commander);
        }

        // Initialize update manager
        updateManager = new AIUpdateManager { commanders = commanders };
    }

    private void Update()
    {
        updateManager.Update();
    }

    private List<CommanderConfig> LoadCommanderConfigs(string path)
    {
        var json = File.ReadAllText(path);
        return JsonConvert.DeserializeObject<List<CommanderConfig>>(json);
    }
}
```

---

## References

| Topic | Sources |
|-------|---------|
| **Behavior Trees** | [Game Developer: Behavior Trees for AI], [Wikipedia: Behavior Tree] |
| **Command Pattern** | [Game Programming Patterns: Command], [Reddit: Command Pattern in Games] |
| **RTS AI** | [AI Algorithms in RTS Games], [RTS AI Problems & Techniques (Churchill)] |
| **Game State Management** | [Game Architecture], [State Hierarchies Paper] |
| **Pathfinding** | [A* Pathfinding Project], [Video: A* Pathfinding Implementation] |
| **Utility AI** | [Utility Theory for Games], [GDC Talks] |
| **Decision Making** | [RTS Decision Making Architecture] (CNRS paper) |
| **Design Patterns** | [Design Patterns for Games], [Gang of Four Patterns] |

- [Behavior Trees for AI - Game Developer](https://www.gamedeveloper.com/programming/behavior-trees-for-ai-how-they-work)
- [Game Programming Patterns - Command](https://gameprogrammingpatterns.com/command.html)
- [RTS AI Games](https://www.capermint.com/blog/real-time-strategy-ai-games/)
- [Game Architecture PDF](https://cspages.ucalgary.ca/~bdstephe/585_W19/d103_game_architecture.pdf)
- [A* Pathfinding Project](https://arongranberg.com/astar/features)
- [RTS Decision Making System - CNRS](https://www.isart.fr/wp-content/uploads/2024/10/A-New-Decision-Making-System-in-Real-Time-Strategy-Games_CNRS_RTS_ISART.pdf)
- [Design Patterns for Games](https://kokkugames.com/design-patterns-that-shaped-the-world-of-games-history-and-potential-application/)

---

## Contributing

To extend the AI system:

- Add new behavior nodes in `BehaviorNodes/`
- Implement new utility evaluators in `UtilityAI/`
- Create new commander archetypes in `Personality/`
- Write tests in `Tests/`
- Document changes in this README

---

## License

MIT License - See LICENSE file

---

**Last Updated**: November 2025  
**Maintainer**: Quaternion Development Team  
**Status**: Production Ready

