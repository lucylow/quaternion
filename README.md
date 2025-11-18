# 🎮 Quaternion: The Fourfold Simulation

> **"In Quaternion, AI isn't the opponent. It's the ecosystem itself — creating, reacting, and storytelling alongside the player."**

A cutting-edge real-time strategy game built for the **Chroma Awards AI Games Competition**, featuring comprehensive AI integration as co-creator, narrator, and strategist. Quaternion combines traditional RTS gameplay with innovative AI systems that generate worlds, music, dialogue, and evolving adversaries.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chroma Awards](https://img.shields.io/badge/Chroma-Awards-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![Phaser](https://img.shields.io/badge/Phaser-3.60-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
  - [High-Level Architecture](#high-level-architecture)
  - [Backend System Architecture](#backend-system-architecture)
  - [API Sequence Diagrams](#api-sequence-diagrams)
  - [Data Model & Entity Relationships](#data-model--entity-relationships)
  - [AI Decision Flow Diagrams](#ai-decision-flow-diagram)
- [Technical Diagram Generation](#-technical-diagram-generation)
- [Core Gameplay Systems](#core-gameplay-systems)
- [AI Integration Systems](#ai-integration-systems)
- [Technical Stack](#technical-stack)
- [Installation & Setup](#installation--setup)
- [Development Guide](#development-guide)
- [Performance Optimizations](#performance-optimizations)
- [Deployment](#deployment)

---

## 🌟 Overview

Quaternion is a sci-fi RTS game where players must balance four fundamental axes: **Matter** (Ore), **Energy**, **Life** (Biomass), and **Knowledge** (Data). The game features:

- **AI-Driven World Generation** - Procedural maps created from natural language prompts
- **Adaptive AI Commanders** - Learning opponents with evolving personalities
- **AI-Generated Voiceover** - Emotionally reactive narration with sentiment modulation
- **Adaptive Music System** - Procedurally generated soundtracks that respond to game state
- **Dynamic Lore Engine** - AI-generated world-building with moral memory tracking
- **Meta-AI: The Quaternion Core** - Symbolic AI entity that judges player philosophy

---

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React UI Components]
        Game[Phaser Game Engine]
        Audio[Audio System]
    end
    
    subgraph "Game Core"
        GSL[Game State Manager]
        GL[Game Loop]
        RM[Resource Manager]
        UM[Unit Manager]
        TM[Tech Tree Manager]
        MM[Map Manager]
    end
    
    subgraph "AI Integration Layer"
        AIM[AIIntegrationManager]
        LLM[LLM Integration]
        TTS[ElevenLabs TTS]
        MUSIC[Music Integration]
    end
    
    subgraph "AI Systems"
        PG[Procedural Generation]
        EC[Enhanced Commanders]
        DE[Dynamic Events]
        NC[Narrative Characters]
    end
    
    subgraph "Backend Services"
        API[Express API]
        WS[WebSocket Server]
        DB[(Supabase/PostgreSQL)]
    end
    
    UI --> Game
    Game --> GSL
    GSL --> GL
    GL --> RM
    GL --> UM
    GL --> TM
    GL --> MM
    
    GSL --> AIM
    AIM --> LLM
    AIM --> TTS
    AIM --> MUSIC
    
    AIM --> PG
    AIM --> EC
    AIM --> DE
    AIM --> NC
    
    Game --> API
    API --> WS
    API --> DB
```

### Game Loop Architecture

```mermaid
sequenceDiagram
    participant User
    participant GameLoop
    participant GameState
    participant AI
    participant Renderer
    
    User->>GameLoop: Input Event
    GameLoop->>GameState: Process Input
    GameLoop->>GameState: Fixed Update (60 FPS)
    GameState->>AI: Get AI Decisions
    AI->>GameState: Return Actions
    GameState->>GameState: Update Entities
    GameState->>GameState: Check Win Conditions
    GameLoop->>Renderer: Variable Update (Variable FPS)
    Renderer->>User: Render Frame
```

### Four-Axis Resource System

```mermaid
graph LR
    subgraph "Resource Axes"
        M[Matter<br/>Ore]
        E[Energy]
        L[Life<br/>Biomass]
        K[Knowledge<br/>Data]
    end
    
    subgraph "Derived Metrics"
        S[Stability]
        EN[Entropy]
        P[Progress]
    end
    
    subgraph "Synergies"
        ME[Matter+Energy<br/>Industrial]
        LK[Life+Knowledge<br/>BioTech]
        ALL[All Balanced<br/>Harmonic]
    end
    
    M --> S
    E --> S
    L --> S
    K --> S
    
    S --> EN
    S --> P
    
    M --> ME
    E --> ME
    L --> LK
    K --> LK
    M --> ALL
    E --> ALL
    L --> ALL
    K --> ALL
```

### AI System Integration Flow

```mermaid
graph TD
    Start[Game Start] --> Init[Initialize AI Manager]
    Init --> MapGen[Generate Map with AI]
    MapGen --> Theme[LLM: Generate Theme]
    Theme --> Map[Create Procedural Map]
    
    Init --> Commander[Create AI Commander]
    Commander --> Personality[LLM: Generate Personality]
    Personality --> Behavior[Build Behavior Tree]
    
    Map --> GameLoop[Start Game Loop]
    Behavior --> GameLoop
    
    GameLoop --> Events[Check for Events]
    Events --> EventGen[LLM: Generate Event]
    EventGen --> Voice[ElevenLabs: Narrate]
    Voice --> Music[Update Music]
    
    GameLoop --> State[Update Game State]
    State --> AI[AI Decision Making]
    AI --> Actions[Execute Actions]
    Actions --> GameLoop
    
    GameLoop --> End[Game End]
    End --> Lore[Generate Lore]
    Lore --> Core[Quaternion Core Judgment]
```

### Backend System Architecture

```mermaid
graph TB
    subgraph "Client Applications"
        Web[Web Client<br/>React + Phaser]
        Mobile[Mobile Client]
    end
    
    subgraph "API Gateway Layer"
        Express[Express.js Server<br/>RESTful API]
        WS[WebSocket Server<br/>Real-time Updates]
    end
    
    subgraph "Game Core Backend"
        GS[GameState Manager<br/>State Synchronization]
        GL[Game Loop<br/>60 FPS Fixed Timestep]
        RM[Resource Manager<br/>Four-Axis System]
        UM[Unit Manager<br/>Entity Management]
        BM[Building Manager<br/>Structure Management]
        MM[Map Manager<br/>Procedural Generation]
        TM[Tech Tree Manager<br/>Research System]
    end
    
    subgraph "AI Controller System"
        AIC[AIController<br/>Decision Engine]
        Archetypes[Commander Archetypes<br/>7 Personality Types]
        Agents[Specialized Agents<br/>Economic/Military/Research]
        BT[Behavior Trees<br/>Decision Logic]
    end
    
    subgraph "AI Integration Services"
        LLM[LLM Integration<br/>Google AI Gemini]
        TTS[ElevenLabs TTS<br/>Voice Narration]
        Music[Fuser API<br/>Adaptive Music]
        PG[Procedural Generator<br/>Map Generation]
    end
    
    subgraph "Data Layer"
        DB[(Supabase/PostgreSQL<br/>Game State Persistence)]
        Cache[(Redis Cache<br/>Session Data)]
        Files[File Storage<br/>Maps/Assets]
    end
    
    Web --> Express
    Mobile --> Express
    Web --> WS
    Mobile --> WS
    
    Express --> GS
    WS --> GS
    
    GS --> GL
    GL --> RM
    GL --> UM
    GL --> BM
    GL --> MM
    GL --> TM
    
    GL --> AIC
    AIC --> Archetypes
    AIC --> Agents
    AIC --> BT
    
    AIC --> LLM
    GS --> TTS
    GS --> Music
    MM --> PG
    
    GS --> DB
    Express --> Cache
    PG --> Files
    Express --> Files
```

### API Sequence Diagrams

#### Game Creation and Initialization Flow

```mermaid
sequenceDiagram
    participant Client
    participant Express API
    participant GameState
    participant MapGenerator
    participant AIController
    participant Database
    
    Client->>Express API: POST /api/game/create
    Express API->>GameState: Initialize Game State
    Express API->>MapGenerator: Generate Map (seed, type)
    MapGenerator->>MapGenerator: Procedural Generation
    MapGenerator-->>Express API: Map Data
    Express API->>AIController: Initialize AI Commander
    AIController->>AIController: Generate Personality
    AIController-->>Express API: Commander Config
    Express API->>Database: Save Game State
    Database-->>Express API: Game ID
    Express API-->>Client: { gameId, initialState }
    
    Client->>Express API: POST /api/game/:id/start
    Express API->>GameState: Start Game Loop
    GameState->>GameState: Begin Fixed Timestep Updates
    Express API-->>Client: { status: "started" }
    
    loop Game Loop
        Client->>Express API: GET /api/game/:id/state
        Express API->>GameState: Get Current State
        GameState-->>Express API: State Snapshot
        Express API-->>Client: Game State JSON
    end
```

#### Player Action Processing Flow

```mermaid
sequenceDiagram
    participant Client
    participant Express API
    participant GameState
    participant UnitManager
    participant ResourceManager
    participant AIController
    participant WebSocket
    
    Client->>Express API: POST /api/game/:id/move
    Note over Client,Express API: { unitId, targetX, targetY }
    Express API->>GameState: Validate Action
    GameState->>UnitManager: Check Unit Availability
    UnitManager->>ResourceManager: Check Energy Cost
    ResourceManager-->>UnitManager: Energy Available
    UnitManager->>UnitManager: Execute Move
    UnitManager-->>GameState: Action Result
    GameState->>AIController: Notify State Change
    AIController->>AIController: Evaluate Response
    GameState->>WebSocket: Broadcast Update
    WebSocket-->>Client: Real-time State Update
    Express API-->>Client: { success: true, newState }
    
    Client->>Express API: POST /api/game/:id/attack
    Express API->>GameState: Process Attack
    GameState->>UnitManager: Execute Combat
    UnitManager-->>GameState: Combat Result
    GameState->>WebSocket: Broadcast Combat Event
    Express API-->>Client: Combat Result
```

#### AI Decision Making Flow

```mermaid
sequenceDiagram
    participant GameLoop
    participant GameState
    participant AIController
    participant BehaviorTree
    participant EconomicAgent
    participant MilitaryAgent
    participant ResourceManager
    
    GameLoop->>GameState: Fixed Update Tick
    GameState->>AIController: Request AI Decision
    AIController->>GameState: Read Current State
    GameState-->>AIController: State Snapshot
    
    AIController->>ResourceManager: Get Resource Status
    ResourceManager-->>AIController: Resource Levels
    
    AIController->>BehaviorTree: Evaluate Decision Tree
    BehaviorTree->>BehaviorTree: Check Conditions
    
    alt Economic Priority
        BehaviorTree->>EconomicAgent: Evaluate Economy
        EconomicAgent->>EconomicAgent: Analyze Resource Balance
        EconomicAgent-->>AIController: Build/Gather Decision
    else Military Priority
        BehaviorTree->>MilitaryAgent: Evaluate Threats
        MilitaryAgent->>MilitaryAgent: Assess Enemy Positions
        MilitaryAgent-->>AIController: Attack/Defend Decision
    end
    
    AIController->>AIController: Select Best Action
    AIController-->>GameState: Execute Command
    GameState->>GameState: Apply Action
    GameState-->>GameLoop: State Updated
```

### Data Model & Entity Relationships

```mermaid
erDiagram
    GAME ||--o{ PLAYER : has
    GAME ||--|| MAP : uses
    GAME ||--o{ UNIT : contains
    GAME ||--o{ BUILDING : contains
    GAME ||--o{ RESOURCE_NODE : contains
    GAME ||--|| GAME_STATE : maintains
    
    PLAYER ||--o{ UNIT : owns
    PLAYER ||--o{ BUILDING : owns
    PLAYER ||--|| RESOURCES : has
    PLAYER ||--o{ TECH_RESEARCH : conducts
    
    MAP ||--o{ TILE : contains
    MAP ||--o{ RESOURCE_NODE : contains
    
    UNIT ||--|| UNIT_TYPE : is
    UNIT ||--o{ ACTION : performs
    UNIT }o--|| POSITION : has
    
    BUILDING ||--|| BUILDING_TYPE : is
    BUILDING ||--o{ PRODUCTION : generates
    BUILDING }o--|| POSITION : has
    
    RESOURCE_NODE ||--|| RESOURCE_TYPE : is
    RESOURCE_NODE }o--|| POSITION : has
    
    TECH_RESEARCH ||--|| TECHNOLOGY : unlocks
    
    GAME {
        string id PK
        string seed
        datetime createdAt
        datetime updatedAt
        string status
        json config
    }
    
    PLAYER {
        string id PK
        string gameId FK
        string userId
        string faction
        json personality
        int score
    }
    
    MAP {
        string id PK
        string gameId FK
        int width
        int height
        string theme
        json terrain
        json features
    }
    
    UNIT {
        string id PK
        string gameId FK
        string playerId FK
        string type
        int x
        int y
        int health
        int energy
        json stats
    }
    
    BUILDING {
        string id PK
        string gameId FK
        string playerId FK
        string type
        int x
        int y
        int health
        json production
    }
    
    RESOURCE_NODE {
        string id PK
        string mapId FK
        string type
        int x
        int y
        int amount
        int remaining
    }
    
    RESOURCES {
        string playerId PK
        int ore
        int energy
        int biomass
        int data
        int instability
    }
    
    TECH_RESEARCH {
        string id PK
        string playerId FK
        string technologyId FK
        datetime startedAt
        datetime completedAt
        int progress
    }
```

### AI Decision Flow Diagram

```mermaid
flowchart TD
    Start[Game Tick] --> Observe[Observe Game State]
    Observe --> ReadState[Read: Resources, Units, Buildings, Map]
    ReadState --> Assess[Assess Current Situation]
    
    Assess --> CheckResources{Resource<br/>Status?}
    CheckResources -->|Low| Economic[Economic Priority]
    CheckResources -->|Balanced| Strategic[Strategic Decision]
    
    Assess --> CheckThreats{Enemy<br/>Threats?}
    CheckThreats -->|High| Military[Military Priority]
    CheckThreats -->|Low| Expansion[Expansion Priority]
    
    Economic --> EvalEcon[Evaluate Economy]
    EvalEcon --> Gather[Gather Resources]
    EvalEcon --> BuildEcon[Build Economic Structures]
    
    Military --> EvalMil[Evaluate Military]
    EvalMil --> Attack[Attack Enemy]
    EvalMil --> Defend[Defend Position]
    EvalMil --> Scout[Scout Enemy]
    
    Strategic --> EvalTech[Evaluate Technology]
    EvalTech --> Research[Research Technology]
    EvalTech --> Upgrade[Upgrade Units/Buildings]
    
    Expansion --> EvalMap[Evaluate Map]
    EvalMap --> Expand[Expand Territory]
    EvalMap --> Capture[Capture Resource Nodes]
    
    Gather --> Execute[Execute Command]
    BuildEcon --> Execute
    Attack --> Execute
    Defend --> Execute
    Scout --> Execute
    Research --> Execute
    Upgrade --> Execute
    Expand --> Execute
    Capture --> Execute
    
    Execute --> Queue[Add to Command Queue]
    Queue --> Apply[Apply to Game State]
    Apply --> Update[Update AI Memory]
    Update --> End[End Tick]
    
    style Economic fill:#ffcccc
    style Military fill:#ccffcc
    style Strategic fill:#ccccff
    style Expansion fill:#ffffcc
```

### AI Commander Personality Decision Matrix

```mermaid
graph TB
    subgraph "Personality Traits"
        Aggression[Aggression: 0.0-1.0]
        Caution[Caution: 0.0-1.0]
        Adaptability[Adaptability: 0.0-1.0]
        Innovation[Innovation: 0.0-1.0]
    end
    
    subgraph "Commander Archetypes"
        Innovator[The Innovator<br/>High Innovation<br/>Low Aggression]
        Butcher[The Butcher<br/>High Aggression<br/>Low Caution]
        Spider[The Spider<br/>High Caution<br/>Methodical]
        Mirror[The Mirror<br/>High Adaptability<br/>Copies Player]
        Tactician[The Tactician<br/>Balanced Traits<br/>Tactical Focus]
        Economist[The Economist<br/>Economic Focus<br/>Resource Superiority]
        Wildcard[The Wildcard<br/>Unpredictable<br/>Random Strategies]
    end
    
    subgraph "Decision Weights"
        TechWeight[Tech Research Weight]
        AttackWeight[Attack Weight]
        DefendWeight[Defend Weight]
        ExpandWeight[Expand Weight]
        GatherWeight[Gather Weight]
    end
    
    Aggression --> AttackWeight
    Caution --> DefendWeight
    Innovation --> TechWeight
    Adaptability --> ExpandWeight
    
    Innovator --> TechWeight
    Butcher --> AttackWeight
    Spider --> DefendWeight
    Mirror --> Adaptability
    Tactician --> AttackWeight
    Tactician --> DefendWeight
    Economist --> GatherWeight
    Wildcard --> AttackWeight
    Wildcard --> DefendWeight
    Wildcard --> TechWeight
    
    TechWeight --> Decision[Final Decision]
    AttackWeight --> Decision
    DefendWeight --> Decision
    ExpandWeight --> Decision
    GatherWeight --> Decision
```

---

## 📊 Technical Diagram Generation

The diagrams above are rendered using **Mermaid** (natively supported by GitHub). For more detailed, professional diagrams, you can use AI-powered diagramming tools with the prompts below.

### AI Diagramming Tools

Generate enhanced technical diagrams using these tools:
- **[DiagramGPT](https://diagramgpt.com)** - AI-powered diagram generation
- **[Eraser.io DiagramGPT](https://www.eraser.io/diagramgpt)** - Code-to-diagram conversion
- **[Lucidchart LucidGPT](https://www.lucidchart.com/pages)** - Enterprise diagramming with AI
- **[Miro AI](https://miro.com/ai/diagram-ai/)** - Collaborative AI diagrams
- **[EdrawMax AI](https://www.edrawmax.com/app/ai-diagram/)** - AI diagram generator
- **[Whimsical AI](https://whimsical.com/ai)** - Flowchart and wireframe generation

### System Architecture Prompt

**Prompt for AI Diagramming Tools:**

```
Draw a technical architecture diagram for 'Quaternion: The Fourfold Simulation' backend system:

Backend Node.js server with Express.js RESTful API
WebSocket server for real-time game state updates
Game Core modules: GameState Manager, Game Loop (60 FPS fixed timestep), Resource Manager (Four-Axis System), Unit Manager, Building Manager, Map Manager, Tech Tree Manager
AI Controller System: AIController decision engine, 7 Commander Archetypes (Innovator, Butcher, Spider, Mirror, Tactician, Economist, Wildcard), Specialized Agents (Economic/Military/Research), Behavior Trees
AI Integration Services: LLM Integration (Google AI Gemini), ElevenLabs TTS, Fuser Music API, Procedural Map Generator
Data Layer: Supabase/PostgreSQL for game state persistence, Redis cache for sessions, File storage for maps/assets
Client connections: Web client (React + Phaser), Mobile client
Show data flows between components and API endpoints
```

### API Sequence Flow Prompt

**Prompt for AI Diagramming Tools:**

```
Create a sequence flow diagram showing the complete game lifecycle:

1. User → API POST /api/game/create → Backend initializes GameState → MapGenerator creates procedural map → AIController initializes commander → Database saves state → Returns gameId

2. User → API POST /api/game/:id/start → GameState starts game loop → Fixed timestep updates begin → Returns started status

3. Game Loop: User → API GET /api/game/:id/state → GameState returns current snapshot → User polls state continuously

4. User Action: User → API POST /api/game/:id/move → GameState validates → UnitManager checks availability → ResourceManager checks costs → Execute action → WebSocket broadcasts update → AIController evaluates response

5. AI Decision: GameLoop tick → AIController reads state → BehaviorTree evaluates → Specialized Agents analyze → Execute AI command → Update game state
```

### Data Model ER Diagram Prompt

**Prompt for AI Diagramming Tools:**

```
Create an entity-relationship diagram for Quaternion game database:

Core Entities:
- GAME (id, seed, status, config, timestamps)
- PLAYER (id, gameId FK, userId, faction, personality JSON, score)
- MAP (id, gameId FK, width, height, theme, terrain JSON, features JSON)
- UNIT (id, gameId FK, playerId FK, type, position x/y, health, energy, stats JSON)
- BUILDING (id, gameId FK, playerId FK, type, position x/y, health, production JSON)
- RESOURCE_NODE (id, mapId FK, type, position x/y, amount, remaining)
- RESOURCES (playerId PK, ore, energy, biomass, data, instability)
- TECH_RESEARCH (id, playerId FK, technologyId FK, timestamps, progress)

Relationships:
- GAME has many PLAYERs
- GAME has one MAP
- GAME contains many UNITS and BUILDINGS
- MAP contains many RESOURCE_NODEs
- PLAYER owns many UNITS and BUILDINGS
- PLAYER has one RESOURCES record
- PLAYER conducts many TECH_RESEARCH projects
- UNITS and BUILDINGS have positions
- RESOURCE_NODEs are positioned on MAP
```

### AI Decision Flow Prompt

**Prompt for AI Diagramming Tools:**

```
Make a detailed flowchart for Quaternion AI decision-making system:

Start: Game Tick (60 FPS fixed timestep)
→ Observe Game State (read resources, units, buildings, map, enemy positions)
→ Assess Current Situation (evaluate resource balance, threat levels, strategic opportunities)

Decision Branches:
1. Resource Status Check:
   - Low Resources → Economic Priority → Evaluate Economy → Gather Resources OR Build Economic Structures
   - Balanced Resources → Strategic Decision → Evaluate Technology → Research OR Upgrade

2. Enemy Threat Check:
   - High Threats → Military Priority → Evaluate Military → Attack Enemy OR Defend Position OR Scout
   - Low Threats → Expansion Priority → Evaluate Map → Expand Territory OR Capture Resource Nodes

Personality Modifiers:
- The Innovator: High tech research weight
- The Butcher: High attack weight, low caution
- The Spider: High defend weight, methodical
- The Mirror: Adapts to player strategies
- The Tactician: Balanced attack/defend weights
- The Economist: High gather weight
- The Wildcard: Random weight distribution

Final: Execute Command → Add to Command Queue → Apply to Game State → Update AI Memory → End Tick
```

### Network & Data Flow Prompt

**Prompt for AI Diagramming Tools:**

```
Create a network diagram showing client-server data flow for Quaternion:

Client Side:
- React UI Components → Phaser Game Engine → Audio System
- WebSocket Client (real-time updates)
- HTTP Client (REST API calls)

Network Layer:
- HTTPS/WSS connections
- API Gateway (Express.js)
- WebSocket Server

Server Side:
- Express API routes: /api/game/create, /api/game/:id/start, /api/game/:id/state, /api/game/:id/move, /api/game/:id/attack, /api/game/:id/build
- GameState Manager (central state coordination)
- Game Loop (60 FPS fixed timestep processing)
- AIController (decision making every tick)

Data Flow:
- Client requests → Express API → GameState → Managers → Database
- GameState updates → WebSocket → All connected clients
- AI decisions → GameState → Command Queue → Execution
- Map generation → File storage → Client download
```

### Export & Integration

After generating diagrams with AI tools:

1. **Export Formats**: Save as SVG (for web), PNG (for documentation), or PDF (for presentations)
2. **Update README**: Replace or supplement Mermaid diagrams with exported images
3. **Version Control**: Commit diagram files to `/docs/diagrams/` directory
4. **Documentation**: Reference diagrams in technical documentation

**Example file structure:**
```
docs/
  diagrams/
    architecture-backend.svg
    api-sequence-flow.png
    data-model-er.png
    ai-decision-flow.png
    network-topology.svg
```

---

## 🎮 Core Gameplay Systems

### 1. Four-Axis Resource System

The game revolves around balancing four interconnected resources:

| Resource | Symbol | Description | Generation | Consumption |
|----------|--------|-------------|------------|-------------|
| **Matter** (Ore) | ⚙️ | Industrial capacity, construction materials | Mining nodes, industrial buildings | Unit production, building construction |
| **Energy** | 🔋 | Power grid stability, operational capacity | Power plants, generators | Unit movement, building operation |
| **Life** (Biomass) | 🌿 | Ecological balance, biological resources | Farms, organic nodes | Unit healing, biological units |
| **Knowledge** (Data) | 🧬 | Tech progression, research capacity | Research labs, data nodes | Technology research, upgrades |

**Resource Interactions:**
- **Instability System**: Imbalance between resources creates instability (0-200)
- **Synergies**: Certain resource combinations provide bonuses
- **Perfect Balance**: Maintaining all four resources in harmony unlocks special endings

### 2. Game State Management

```typescript
// Core Game State Structure
class QuaternionGameState {
  // Resources
  resources: {
    ore: number;
    energy: number;
    biomass: number;
    data: number;
  };
  
  // Instability tracking
  instability: number; // 0-200
  
  // Managers
  resourceManager: ResourceManager;
  unitManager: UnitManager;
  techTreeManager: TechTreeManager;
  mapManager: MapManager;
  
  // AI State
  aiControllers: AIController[];
  
  // Game Loop
  update(deltaTime: number): void;
}
```

### 3. Game Loop Implementation

The game uses a **hybrid fixed/variable timestep** approach:

```mermaid
graph TD
    Start[Frame Start] --> Input[Process Input]
    Input --> Accumulate[Accumulate Time]
    Accumulate --> Fixed{Time >= Fixed Step?}
    Fixed -->|Yes| FixedUpdate[Fixed Update 60 FPS]
    FixedUpdate --> Accumulate
    Fixed -->|No| Variable[Variable Update]
    Variable --> Interpolate[Calculate Interpolation]
    Interpolate --> Render[Render Frame]
    Render --> Start
```

**Key Features:**
- **Fixed Timestep**: 60 FPS for game logic (deterministic)
- **Variable Timestep**: Variable FPS for rendering (smooth)
- **Frame Skipping**: Prevents spiral of death
- **Interpolation**: Smooth rendering between fixed updates

### 4. Victory Conditions

The game supports multiple victory paths:

1. **Equilibrium Victory**: Maintain perfect balance of all four resources
2. **Technological Victory**: Research all technologies in one branch
3. **Territorial Victory**: Control majority of map nodes
4. **Moral Victory**: Achieve high moral alignment through choices

---

## 🤖 AI Integration Systems

### AI Architecture Overview

```mermaid
graph TB
    subgraph "AI Integration Manager"
        AIM[AIIntegrationManager<br/>Central Coordinator]
    end
    
    subgraph "External APIs"
        GAI[Google AI Pro<br/>Gemini]
        EL[ElevenLabs<br/>TTS]
        FUSER[Fuser<br/>Music]
    end
    
    subgraph "AI Systems"
        PG[Procedural Generation<br/>Map Themes]
        EC[Enhanced Commanders<br/>Personality AI]
        DE[Dynamic Events<br/>Narrative Events]
        NC[Narrative Characters<br/>4 AI Advisors]
    end
    
    subgraph "Game Integration"
        GS[Game State]
        MAP[Map Manager]
        CMD[Commander System]
        EVT[Event System]
    end
    
    AIM --> GAI
    AIM --> EL
    AIM --> FUSER
    
    AIM --> PG
    AIM --> EC
    AIM --> DE
    AIM --> NC
    
    PG --> MAP
    EC --> CMD
    DE --> EVT
    NC --> GS
```

### 1. Procedural Generation System

**Location**: `src/ai/systems/ProceduralGenerationSystem.ts`

**Features:**
- LLM-generated map themes from natural language prompts
- Strategic feature placement based on theme
- Semantic map descriptions
- Terrain generation with strategic intent

**Flow:**
```mermaid
sequenceDiagram
    participant Game
    participant PG[Procedural Gen]
    participant LLM[Google AI]
    participant Map
    
    Game->>PG: generateMap(seed, width, height, type)
    PG->>LLM: Generate theme description
    LLM-->>PG: Theme + strategic features
    PG->>Map: Create map with features
    Map-->>Game: Map with metadata
```

### 2. Enhanced Commander System

**Location**: `src/ai/systems/EnhancedCommanderSystem.ts`

**Commander Archetypes:**

| Archetype | Traits | Strategy | Weakness |
|-----------|--------|----------|----------|
| **The Innovator** | High innovation, low aggression | Tech rush, unconventional tactics | Vulnerable to early aggression |
| **The Butcher** | High aggression, low caution | Constant attacks, military focus | Poor late-game economy |
| **The Spider** | High caution, methodical | Defensive expansion, strong defenses | Slow to react |
| **The Mirror** | High adaptability | Copies and improves player strategies | Struggles with novel approaches |
| **The Tactician** | Balanced, tactical | Positioning, flanking, timing | May overthink |
| **The Economist** | Economic focus | Resource superiority, late game | Weak early military |
| **The Wildcard** | Unpredictable | Chaotic, random strategies | Inconsistent |

**Personality Matrix:**
```typescript
interface PersonalityTraits {
  aggression: number;      // 0.0 - 1.0
  caution: number;        // 0.0 - 1.0
  adaptability: number;   // 0.0 - 1.0
  innovation: number;     // 0.0 - 1.0
  ruthlessness: number;   // 0.0 - 1.0
  predictability: number; // 0.0 - 1.0
}
```

### 3. Dynamic Event System

**Location**: `src/ai/systems/DynamicEventSystem.ts`

**Event Types:**
- **Terrain Events**: Map modifications, obstacles
- **Resource Events**: Resource node spawns, bonuses
- **Combat Events**: Enemy spawns, tactical opportunities
- **Narrative Events**: Story-driven occurrences

**Event Generation Flow:**
```mermaid
graph LR
    Trigger[Game State Trigger] --> Check[Check Event Conditions]
    Check --> LLM[LLM: Generate Event]
    LLM --> Validate[Validate Event]
    Validate --> Execute[Execute Event]
    Execute --> Voice[ElevenLabs: Narrate]
    Voice --> Update[Update Game State]
```

### 4. Narrative Character System

**Location**: `src/game/narrative/`

**Four AI Advisors:**

1. **AUREN - The Architect of Matter** ⚙️
   - Personality: Calculating, rational, engineering metaphors
   - Voice: Deep baritone, mechanical cadence
   - Philosophy: "Perfection is precision multiplied by discipline."

2. **VIREL - The Keeper of Energy** 🔋
   - Personality: Intense, passionate, oscillates between calm and fury
   - Voice: Expressive TTS with emotional modulation
   - Philosophy: "Power demands harmony, not hunger."

3. **LIRA - The Voice of Life** 🌿
   - Personality: Gentle but firm, empathic, critical of industry
   - Voice: Soft contralto, warm organic tone
   - Philosophy: "Even creation tires of giving."

4. **KOR - The Seer of Knowledge** 🧬
   - Personality: Coldly logical, detached, recursive statements
   - Voice: Digitally flattened tenor, synthetic overtone
   - Philosophy: "Knowledge expands faster than stability."

**Character Evolution System:**
- Characters evolve based on player actions
- Tension system creates conflicts between advisors
- Dynamic dialogue generation using LLM
- Voice synthesis with ElevenLabs

### 5. Quaternion Core (Meta-AI)

**Location**: `src/game/narrative/QuaternionCoreNarrative.ts`

The Quaternion Core is a meta-AI that:
- Observes player actions throughout the game
- Generates personalized endgame monologues
- Judges player philosophy and choices
- Provides fourth-wall-breaking commentary

---

## 🛠️ Technical Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3 | UI framework |
| **TypeScript** | 5.8 | Type safety |
| **Vite** | 5.4 | Build tool & dev server |
| **Phaser** | 3.60 | Game engine |
| **Radix UI** | Latest | Component library |
| **Tailwind CSS** | 3.4 | Styling |
| **React Query** | 5.83 | State management |
| **React Router** | 6.30 | Routing |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | 4.18 | API server |
| **WebSocket (ws)** | 8.18 | Real-time multiplayer |
| **Supabase** | Latest | Database & auth |
| **PostgreSQL** | - | Database (via Supabase) |
| **Prisma** | 5.20 | ORM |

### AI Integration

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Google AI Pro (Gemini)** | LLM for content generation | `src/ai/integrations/LLMIntegration.ts` |
| **ElevenLabs** | Text-to-speech | `src/ai/integrations/ElevenLabsIntegration.ts` |
| **Fuser** | Adaptive music | `src/ai/integrations/MusicIntegration.ts` |

### Development Tools

- **ESLint**: Code linting
- **Vitest**: Testing framework
- **TypeScript**: Type checking
- **Prisma Studio**: Database management

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Modern browser** with Web Audio API support
- **API Keys** (optional, for full AI features):
  - Google AI API (for LLM features)
  - ElevenLabs API (for voice narration)
  - Fuser API (for adaptive music)

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/quaternion.git
cd quaternion

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Set up database (if using Supabase)
npm run prisma:generate
npm run prisma:migrate

# 5. Start development server
npm run dev
```

The game will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
# AI Integration (Optional - game works without these)
GOOGLE_AI_API_KEY=your_google_ai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
FUSER_API_KEY=your_fuser_key

# Stripe (for monetization)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Supabase (for multiplayer and persistence)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_key
```

**Note**: The game works without API keys using fallback systems, but AI features will be limited.

---

## 🏗️ Project Structure

```
quaternion/
├── src/
│   ├── ai/                          # AI systems
│   │   ├── agents/                  # Specialized AI agents
│   │   │   ├── EconomicAgent.ts
│   │   │   ├── MilitaryAgent.ts
│   │   │   ├── ResearchAgent.ts
│   │   │   └── ScoutingAgent.ts
│   │   ├── creative/                # AI creative features
│   │   │   ├── AdaptiveCommanderAI.ts
│   │   │   └── NarrativeGeneration.ts
│   │   ├── generative/              # Generative NPCs
│   │   │   └── GenerativeNPC.ts
│   │   ├── integrations/           # External AI APIs
│   │   │   ├── LLMIntegration.ts
│   │   │   ├── ElevenLabsIntegration.ts
│   │   │   └── MusicIntegration.ts
│   │   ├── opponents/               # AI opponents
│   │   │   ├── AICommanderArchetypes.ts
│   │   │   └── EnhancedAIOpponent.ts
│   │   ├── systems/                 # AI game systems
│   │   │   ├── ProceduralGenerationSystem.ts
│   │   │   ├── EnhancedCommanderSystem.ts
│   │   │   └── DynamicEventSystem.ts
│   │   └── AIIntegrationManager.ts  # Central coordinator
│   ├── game/                        # Game logic
│   │   ├── QuaternionGameState.ts   # Main game state
│   │   ├── GameLoop.ts              # Game loop implementation
│   │   ├── ResourceManager.ts       # Resource management
│   │   ├── UnitManager.ts           # Unit management
│   │   ├── TechTreeManager.ts       # Technology system
│   │   ├── MapManager.ts            # Map management
│   │   ├── narrative/               # Narrative systems
│   │   │   ├── AINarrativeDirector.ts
│   │   │   ├── AICreativeCharacters.ts
│   │   │   └── QuaternionCoreNarrative.ts
│   │   └── strategic/               # Strategic AI
│   ├── components/                  # React components
│   │   ├── game/                   # Game UI components
│   │   ├── ui/                     # UI components (Radix)
│   │   └── narrative/              # Narrative UI
│   ├── audio/                      # Audio systems
│   │   ├── AudioEngine.ts
│   │   ├── AdaptiveMusicSystem.ts
│   │   └── ElevenLabsAudioIntegration.ts
│   ├── map/                        # Map generation
│   │   └── MapGenerator.ts
│   ├── pages/                      # Route pages
│   └── App.tsx                     # Main app component
├── server/                         # Backend server
│   └── server.js
├── public/                         # Static assets
├── docs/                           # Documentation
├── supabase/                       # Database migrations
└── package.json
```

---

## 💻 Development Guide

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (Vite)
npm run build           # Production build
npm run preview         # Preview production build

# Database
npm run seed            # Seed database
npm run seed:minimal    # Minimal seed
npm run prisma:studio   # Open Prisma Studio

# Linting
npm run lint            # Run ESLint
```

### Code Structure Guidelines

1. **TypeScript**: Full type safety throughout
2. **Modular Architecture**: Clean separation of concerns
3. **Component-Based**: Reusable React components
4. **AI-First Design**: All systems designed with AI integration in mind

### Adding New AI Features

1. **Create Integration** (if needed):
   ```typescript
   // src/ai/integrations/NewAIIntegration.ts
   export class NewAIIntegration {
     async generateContent(prompt: string) {
       // Implementation
     }
   }
   ```

2. **Add to AI Manager**:
   ```typescript
   // src/ai/AIIntegrationManager.ts
   import { NewAIIntegration } from './integrations/NewAIIntegration';
   
   // Add to constructor and methods
   ```

3. **Integrate with Game**:
   ```typescript
   // In game component
   const result = await aiManager.newFeature(params);
   ```

---

## ⚡ Performance Optimizations

### Game Loop Performance

- **Fixed Timestep**: 60 FPS for deterministic game logic
- **Frame Skipping**: Prevents spiral of death
- **Interpolation**: Smooth rendering between fixed updates
- **Performance Monitoring**: Adaptive quality settings

### AI Performance

- **Caching**: Map themes, commander personalities, voice lines cached
- **Rate Limiting**: LLM calls max 1 per 5 seconds
- **Pre-generation**: Voice lines and music stems pre-generated
- **Lazy Loading**: AI systems initialize on first use
- **Fallbacks**: All systems work without API keys

### Rendering Performance

- **Object Pooling**: Reuse game objects
- **Spatial Partitioning**: Efficient collision detection
- **LOD System**: Level of detail for distant objects
- **Asset Optimization**: Compressed textures and audio

### Target Performance Metrics

- **FPS**: 60 FPS on modern hardware
- **AI Response Time**: <100ms for strategic decisions
- **Memory Usage**: <500MB for typical game session
- **Load Time**: <3 seconds for initial load

---

## 🚀 Deployment

### Production Build

```bash
npm run build:production
```

This creates an optimized build in the `dist/` directory.

### Deployment Options

1. **Vercel** (Recommended for frontend):
   - Connect GitHub repository
   - Vercel auto-detects Vite configuration
   - Set environment variables in Vercel dashboard

2. **Netlify**:
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Itch.io**:
   ```bash
   npm run build:itch
   # Upload dist/ directory to Itch.io
   ```

### Environment Setup

Ensure all environment variables are set in your deployment platform:
- `GOOGLE_AI_API_KEY`
- `ELEVENLABS_API_KEY`
- `FUSER_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## 🎯 For Chroma Awards Judges

### AI Innovation Highlights

1. **AI as Co-Creator**: World generation, music, dialogue, and lore all AI-generated
2. **Emergent Narrative**: Stories emerge from gameplay, not pre-written scripts
3. **Emotional Reactivity**: Voice, music, and lore adapt to player actions
4. **Moral Memory**: System remembers and reflects on player choices
5. **Philosophical Depth**: AI judges not just victory, but player philosophy

### Key Metrics

- **World Generation**: 1000+ unique maps from prompts
- **Commander Learning**: Personality evolution tracked across matches
- **Voice Narration**: 500+ unique lines with emotional modulation
- **Music Adaptation**: Real-time style transitions based on game state
- **Lore Generation**: Unique chronicles per map seed
- **Core Judgments**: Personalized monologues for each playthrough

### Demo Scenarios

1. **World Generation Demo**: Generate maps from different prompts
2. **Commander Learning Demo**: Show personality evolution over matches
3. **Voice Narration Demo**: Demonstrate tone shifting based on game state
4. **Music Adaptation Demo**: Show music morphing with resource balance
5. **Lore Generation Demo**: Generate world chronicles and moral reflections
6. **Core Judgment Demo**: Show endgame philosophy analysis

### AI Tools Used

- **Google AI Pro (Gemini)**: Strategic content generation, narrative creation
- **ElevenLabs**: Voice narration and commander dialogue
- **Fuser**: Adaptive music generation
- **Saga AI**: Alternative LLM provider (fallback)

---

## 📚 Additional Documentation

### Core Systems

- **[AI Integration Summary](./CHROMA_AWARDS_AI_INTEGRATION.md)** - Complete AI integration overview
- **[Project Summary](./docs/PROJECT_SUMMARY.md)** - High-level overview
- **[Backend AI README](./docs/BACKEND_AI_README.md)** - AI architecture guide
- **[Game Integration Guide](./GAME_INTEGRATION_GUIDE.md)** - Game modes and integration

### AI Systems

- **[Generative NPCs README](./src/ai/generative/README.md)** - Complete cognitive architecture
- **[AI Creative Features](./AI_CREATIVE_FEATURES.md)** - Chroma Awards submission write-up
- **[Creative Systems README](./src/ai/creative/README.md)** - Technical documentation
- **[AI Tools Stack](./docs/AI_TOOLS_STACK.md)** - Comprehensive AI tools documentation

### Features

- **[Campaign System](./CAMPAIGN_SYSTEM.md)** - Narrative campaigns
- **[Monetization](./MONETIZATION_README.md)** - Shop, battle pass, tournaments
- **[Procedural Generation](./PROCEDURAL_GENERATION_IMPROVEMENTS.md)** - Map generation
- **[Resource Puzzles](./RESOURCE_PUZZLE_IMPLEMENTATION.md)** - Puzzle system

### Deployment

- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment
- **[Itch.io Deployment](./ITCH_IO_DEPLOYMENT.md)** - Itch.io publishing

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test specific systems
npm test -- ai
npm test -- game
```

---

## 🤝 Contributing

This project is built for the Chroma Awards competition. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Chroma Awards** - Competition platform
- **Stanford Generative Agents** - Research foundation for NPC systems
- **Phaser 3** - Game engine
- **Radix UI** - Component library
- **AI Providers**: Google AI, ElevenLabs, Fuser

---

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: See `/docs` directory
- **AI Features**: See `AI_CREATIVE_FEATURES.md`
- **Chroma Awards Submission**: See project page

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check documentation in `/docs`
- Review AI system READMEs in `/src/ai`

---

**Built with ❤️ for the Chroma Awards AI Games Competition**

*"The AI becomes a storytelling conscience — not just a mechanic, but a moral mirror."*
