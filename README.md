# 🎮 Quaternion - AI-Powered Real-Time Strategy Game

<div align="center">

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![AI-Powered](https://img.shields.io/badge/AI--Powered-LLM%20%2B%20Heuristics-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

**A cutting-edge RTS game featuring hybrid AI systems, procedural generation, and intelligent opponents powered by Large Language Models**

[Quick Start](#-quick-start) • [AI Architecture](#-ai-architecture) • [Game Features](#-game-features) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [AI-Powered Features](#-ai-powered-features)
- [Technical Architecture](#-technical-architecture)
- [AI System Architecture](#-ai-system-architecture)
- [Quick Start](#-quick-start)
- [Game Mechanics](#-game-mechanics)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

**Quaternion** is a sophisticated real-time strategy game that showcases advanced AI integration, combining:

- **🤖 Hybrid AI System**: LLM-powered strategic decision-making with deterministic fallbacks
- **🗺️ Procedural Generation**: Quaternion-based deterministic map generation
- **⚔️ Intelligent Opponents**: Adaptive AI with multiple difficulty levels and personality traits
- **📊 4-Resource System**: Matter, Energy, Life, and Knowledge management
- **🎬 Replay System**: Deterministic replay artifacts for judge verification
- **💬 AI Advisors**: Dynamic commentary from 5 unique commander personalities

The game demonstrates state-of-the-art AI integration in game development, using Google Gemini 2.5 Flash for strategic decision-making while maintaining deterministic gameplay for replayability.

---

## 🤖 AI-Powered Features

### Core AI Capabilities

1. **Strategic Commander AI** (LLM-Powered)
   - Uses Google Gemini 2.5 Flash via Lovable AI Gateway
   - Analyzes game state and provides strategic orders
   - Rate-limited to 1 decision per 50 ticks (~1 decision/second)
   - Validates all LLM outputs before execution
   - Falls back to deterministic heuristics on errors

2. **Adaptive AI Controller** (Heuristic-Based)
   - Four strategic states: Expansion, Tech, Aggression, Defense
   - Personality traits: Aggression, Efficiency, Adaptability
   - Three difficulty levels with scaling reaction times
   - State-based decision making with cooldown management

3. **Utility-Based Unit AI** (Deterministic)
   - Fast unit-level decision making (<1ms per unit)
   - Squad coordination and formation management
   - Tactical behaviors: attack, retreat, ability usage
   - Spatial awareness and target prioritization

4. **Procedural Map Generation** (Quaternion-Based)
   - Deterministic seeded random number generation
   - Perlin-like noise for terrain variation
   - Symmetric start positions for fair gameplay
   - Multiple map types with configurable parameters

---

## 🏗️ Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React + TypeScript + Phaser 3 Game Engine              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Game UI    │  │  Game State  │  │  AI Client   │  │  │
│  │  │  Components  │  │   Manager    │  │   (Hybrid)   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              Supabase Edge Functions (Deno)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AI Strategy Function (ai-strategy/index.ts)            │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  LLM Gateway (Google Gemini 2.5 Flash)            │ │  │
│  │  │  + Deterministic Fallback Logic                    │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
quaternion/
├── quaternion-game/              # Full game implementation
│   ├── src/
│   │   ├── ai/                   # AI System
│   │   │   ├── AIController.ts   # Adaptive AI controller
│   │   │   ├── commanderClient.js # LLM-powered commander
│   │   │   ├── modelClient.js    # LLM API client
│   │   │   ├── utilityAgent.js   # Unit-level AI
│   │   │   └── planner/
│   │   │       └── MCTS.js       # Monte Carlo Tree Search
│   │   ├── game/
│   │   │   └── QuaternionGameState.ts # Game state management
│   │   ├── map/
│   │   │   └── ProceduralMapGenerator.ts # Map generation
│   │   ├── components/           # React UI components
│   │   └── pages/                # Game pages
│   └── public/                   # Static assets
├── supabase/
│   └── functions/
│       └── ai-strategy/          # Edge function for AI
│           └── index.ts          # LLM integration
└── config/
    └── commanders.json          # AI commander configurations
```

---

## 🧠 AI System Architecture

### Hybrid AI Decision Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Game Loop (60 TPS)                           │
│                    ┌──────────────┐                             │
│                    │  Game Tick   │                             │
│                    └──────┬───────┘                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
    ┌───────▼────────┐            ┌────────▼────────┐
    │  Unit Agents   │            │  Commander AI   │
    │  (Utility AI)  │            │  (LLM Hybrid)   │
    └───────┬────────┘            └────────┬────────┘
            │                               │
            │ Deterministic                 │ Strategic
            │ Fast (<1ms)                  │ Slow (~50 ticks)
            │                               │
    ┌───────▼────────┐            ┌────────▼──────────┐
    │  Attack/Move   │            │  Edge Function    │
    │  Retreat       │            │  ai-strategy      │
    │  Ability       │            │                   │
    └────────────────┘            └────────┬──────────┘
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                    ┌─────────▼──────────┐   ┌─────────▼──────────┐
                    │  LLM Decision      │   │  Fallback Heuristic │
                    │  (Gemini 2.5)     │   │  (Deterministic)    │
                    └─────────┬──────────┘   └─────────┬──────────┘
                              │                         │
                              └────────────┬────────────┘
                                           │
                                  ┌────────▼────────┐
                                  │  Validate &     │
                                  │  Execute        │
                                  └─────────────────┘
```

### AI Decision Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    Commander AI Decision Cycle                    │
└──────────────────────────────────────────────────────────────────┘

Step 1: State Snapshot Creation
┌─────────────────────────────────────────────────────────────┐
│ • Extract player resources (ore, energy, biomass)          │
│ • Count units by type                                      │
│ • Identify visible enemy units                             │
│ • Analyze map features                                     │
│ • Capture current game tick                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 2: Decision Trigger Check
┌─────────────────────────────────────────────────────────────┐
│ IF (tick % 50 === 0) OR (resources abundant)              │
│   → Proceed to LLM call                                    │
│ ELSE                                                        │
│   → Use deterministic fallback                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 3: LLM Strategy Call (if triggered)
┌─────────────────────────────────────────────────────────────┐
│ POST to: ai-strategy edge function                         │
│                                                             │
│ System Prompt:                                              │
│ "You are a tactical RTS AI commander. Analyze game state   │
│  and provide ONE strategic order."                         │
│                                                             │
│ User Prompt:                                                │
│ "Game State: Resources, Units, Enemy, Map, Tick"           │
│                                                             │
│ Model: google/gemini-2.5-flash                             │
│ Temperature: 0.7                                           │
│ Max Tokens: 200                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 4: Response Validation
┌─────────────────────────────────────────────────────────────┐
│ ✓ Check order type is valid                                │
│ ✓ Verify resource availability                             │
│ ✓ Validate confidence score (≥ 0.3)                         │
│ ✓ Ensure decision is within game constraints                │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐        ┌───────▼──────┐
         │  Valid      │        │  Invalid     │
         │  Decision   │        │  Decision    │
         └──────┬──────┘        └───────┬──────┘
                │                       │
                │              ┌────────▼────────┐
                │              │ Use Fallback    │
                │              │ Heuristic       │
                │              └────────┬────────┘
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
Step 5: Execute Decision
┌─────────────────────────────────────────────────────────────┐
│ • Apply order to game state                                 │
│ • Log decision to history                                   │
│ • Update AI highlights for replay                          │
│ • Record telemetry data                                     │
└─────────────────────────────────────────────────────────────┘
```

### AI Agent Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│                    AI Agent Hierarchy                       │
└──────────────────────────────────────────────────────────────┘

Level 1: Commander AI (Strategic)
├── Frequency: Every 50 ticks (~1 decision/sec)
├── Method: LLM (Gemini 2.5 Flash) + Fallback Heuristics
├── Decisions: build, attack, tech, defend, expand
├── Input: Full game state snapshot
└── Output: High-level strategic orders
    │
    ├─→ Level 2: Squad Agents (Tactical)
    │   ├── Frequency: Every tick
    │   ├── Method: Finite State Machine
    │   ├── States: idle, hold, attack, flank, retreat
    │   ├── Input: Squad composition, enemy positions
    │   └── Output: Formation orders, tactical goals
    │       │
    │       └─→ Level 3: Unit Agents (Operational)
    │           ├── Frequency: Every tick
    │           ├── Method: Utility-based scoring
    │           ├── Actions: attack, move, retreat, ability, idle
    │           ├── Input: Unit state, nearby units, targets
    │           └── Output: Immediate unit actions
    │
    └─→ Level 2: Building Manager (Economic)
        ├── Frequency: Every tick
        ├── Method: Priority queue + resource constraints
        ├── Decisions: Build order, research queue
        └── Output: Construction/research commands
```

### LLM Integration Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              LLM Integration Flow                            │
└──────────────────────────────────────────────────────────────┘

Client (Browser)
    │
    │ 1. Create State Snapshot
    │    ┌─────────────────────────────┐
    │    │ commanderClient.js          │
    │    │ • Extract game state        │
    │    │ • Format for AI             │
    │    │ • Rate limit check          │
    │    └─────────────────────────────┘
    │
    │ 2. HTTP Request
    │    POST /functions/v1/ai-strategy
    │    {
    │      gameState: {...},
    │      agentType: "commander"
    │    }
    │
    ▼
Supabase Edge Function (Deno)
    │
    │ 3. Process Request
    │    ┌─────────────────────────────┐
    │    │ ai-strategy/index.ts        │
    │    │ • Validate input            │
    │    │ • Generate fallback         │
    │    │ • Check LLM eligibility     │
    │    └─────────────────────────────┘
    │
    │ 4. LLM Call (if eligible)
    │    ┌─────────────────────────────┐
    │    │ POST to Lovable AI Gateway  │
    │    │ • Model: Gemini 2.5 Flash   │
    │    │ • System + User prompts     │
    │    │ • Temperature: 0.7          │
    │    │ • Max tokens: 200           │
    │    └─────────────────────────────┘
    │
    │ 5. Response Processing
    │    ┌─────────────────────────────┐
    │    │ • Parse JSON from response  │
    │    │ • Validate decision         │
    │    │ • Apply confidence filter   │
    │    │ • Return or use fallback    │
    │    └─────────────────────────────┘
    │
    │ 6. Return Decision
    │    {
    │      order: "build" | "attack" | ...,
    │      reason: "...",
    │      confidence: 0.0-1.0,
    │      fallback: boolean
    │    }
    │
    ▼
Client (Browser)
    │
    │ 7. Execute Decision
    │    ┌─────────────────────────────┐
    │    │ • Apply to game state        │
    │    │ • Log to history             │
    │    │ • Update telemetry           │
    │    └─────────────────────────────┘
```

### Deterministic Fallback System

```
┌──────────────────────────────────────────────────────────────┐
│         Deterministic Fallback Decision Tree                 │
└──────────────────────────────────────────────────────────────┘

Game State Analysis
    │
    ├─→ Calculate Scores for Each Action
    │   │
    │   ├─→ Build Score
    │   │   IF (ore > 200 AND units < 10)
    │   │       score = 0.8
    │   │
    │   ├─→ Attack Score
    │   │   IF (ourUnits > enemyUnits * 1.5 AND enemyUnits > 0)
    │   │       score = 0.9
    │   │
    │   ├─→ Defend Score
    │   │   IF (enemyUnits > ourUnits AND enemyUnits > 0)
    │   │       score = 0.85
    │   │
    │   ├─→ Tech Score
    │   │   IF (tick > 100 AND ore > 300 AND energy > 80)
    │   │       score = 0.7
    │   │
    │   └─→ Expand Score
    │       IF (tick < 200 AND ore < 150)
    │           score = 0.75
    │
    └─→ Select Best Action
        │
        └─→ Return Decision
            {
              order: bestAction,
              reason: predefinedReason[bestAction],
              confidence: bestScore,
              fallback: true
            }
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for AI edge functions)
- Lovable AI API key (for LLM integration)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd quaternion

# Install dependencies
npm install

# Navigate to game directory
cd quaternion-game
npm install
```

### Configuration

1. **Set up Supabase Edge Function**:
   ```bash
   # Deploy edge function
   supabase functions deploy ai-strategy
   ```

2. **Configure Environment Variables**:
   ```bash
   # In Supabase dashboard, set:
   LOVABLE_API_KEY=your_api_key_here
   ```

3. **Start Development Server**:
   ```bash
   cd quaternion-game
   npm run dev
   ```

4. **Access the Game**:
   - Open http://localhost:5173/quaternion
   - The game will load with AI opponents ready

### Build for Production

```bash
cd quaternion-game
npm run build
# Output in dist/ directory
```

---

## 🎮 Game Mechanics

### Resource System

| Resource | Description | Optimal Range | Generation |
|----------|-------------|---------------|------------|
| **Matter** 🔷 | Raw material foundation | 30-70 | Extractors |
| **Energy** ⚡ | Powers all operations | 40-80 | Refineries |
| **Life** 🌿 | Biomass and unit production | 25-60 | Bio Labs |
| **Knowledge** 🧠 | Tech tree advancement | 35-75 | Research Centers |

### Win Conditions

1. **Equilibrium Victory**: Maintain all resources within ±15% for 60 seconds
2. **Technological Victory**: Unlock Quantum Ascendancy terminal tech
3. **Territorial Victory**: Hold Central Node for 90 seconds
4. **Moral Victory**: Achieve +80 moral alignment through ethical choices

### AI Difficulty Levels

| Difficulty | Reaction Time | Aggression | Efficiency | Adaptability |
|------------|---------------|------------|------------|--------------|
| **Easy** | 3.0 seconds | 0.3 | 0.5 | 0.4 |
| **Medium** | 1.5 seconds | 0.5 | 0.7 | 0.6 |
| **Hard** | 0.5 seconds | 0.7 | 0.9 | 0.8 |

### AI Strategic States

```
┌──────────────────────────────────────────────────────────────┐
│              AI State Machine                                │
└──────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │  Expansion  │ ←─── Initial State
    └──────┬──────┘
           │
           │ IF (resources low OR bases < 2)
           │
    ┌──────▼──────┐
    │    Tech     │ ←─── IF (resources abundant AND mid-game)
    └──────┬──────┘
           │
           │ IF (military advantage > 0.5)
           │
    ┌──────▼──────┐
    │ Aggression  │ ←─── IF (enemy weak OR advantage)
    └──────┬──────┘
           │
           │ IF (enemy strong OR under attack)
           │
    ┌──────▼──────┐
    │   Defense   │ ←─── IF (threat detected)
    └──────┬──────┘
           │
           └───────┐
                   │
         State Change Cooldown: 3 seconds
```

---

## 💻 Development

### Project Structure

```
quaternion-game/
├── src/
│   ├── ai/                      # AI System
│   │   ├── AIController.ts      # Adaptive AI with states
│   │   ├── commanderClient.js   # LLM-powered commander
│   │   ├── modelClient.js       # LLM API wrapper
│   │   ├── utilityAgent.js      # Unit-level AI
│   │   └── planner/
│   │       └── MCTS.js          # Monte Carlo Tree Search
│   ├── game/
│   │   └── QuaternionGameState.ts
│   ├── map/
│   │   └── ProceduralMapGenerator.ts
│   ├── components/
│   │   └── game/
│   │       ├── JudgeHUD.tsx     # Replay system UI
│   │       ├── BuildMenu.tsx
│   │       └── TechTreeModal.tsx
│   └── pages/
│       └── QuaternionGame.tsx   # Main game page
└── supabase/
    └── functions/
        └── ai-strategy/
            └── index.ts         # Edge function
```

### Key Technologies

- **Frontend**: React 18, TypeScript, Phaser 3
- **AI**: Google Gemini 2.5 Flash (via Lovable AI)
- **Backend**: Supabase Edge Functions (Deno)
- **UI**: shadcn/ui, Tailwind CSS
- **Build**: Vite

### AI Development Workflow

1. **Test AI Locally**:
   ```bash
   # Run game in dev mode
   npm run dev
   
   # Check AI decisions in console
   # Monitor edge function logs in Supabase dashboard
   ```

2. **Modify AI Behavior**:
   - Edit `AIController.ts` for heuristic-based AI
   - Edit `commanderClient.js` for LLM integration
   - Edit `supabase/functions/ai-strategy/index.ts` for LLM prompts

3. **Test Deterministic Fallback**:
   ```javascript
   // Disable LLM temporarily
   // In ai-strategy/index.ts, set:
   if (false && agentType === 'commander' && shouldUseLLM(gameState)) {
     // LLM call
   }
   ```

---

## 🚢 Deployment

### Deploy to Lovable

1. Upload `quaternion-game/` folder to Lovable
2. Configure build:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Set environment variables in Supabase:
   - `LOVABLE_API_KEY`
4. Deploy edge function:
   ```bash
   supabase functions deploy ai-strategy
   ```

### Manual Deployment

1. **Build the game**:
   ```bash
   cd quaternion-game
   npm run build
   ```

2. **Deploy static files**:
   - Upload `dist/` to any static host (Vercel, Netlify, etc.)
   - Configure SPA routing

3. **Deploy edge function**:
   ```bash
   supabase functions deploy ai-strategy
   ```

4. **Configure CORS**:
   - Ensure edge function allows your domain
   - Update Supabase client configuration

---

## 📊 Performance Metrics

### AI Performance

- **Unit Agents**: <0.5ms per unit per tick
- **Squad Agents**: <5ms per squad per tick
- **Commander AI**: <100ms per decision (rate-limited to 1/sec)
- **LLM Calls**: ~200-500ms (cached when possible)

### Game Performance

- **Frame Rate**: 60 FPS target
- **Game Tick Rate**: 60 TPS
- **Memory Usage**: ~150-200 MB
- **Bundle Size**: ~465 KB (gzipped)

---

## 🔒 AI Safety & Determinism

### Validation System

All LLM decisions are validated before execution:

```typescript
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

### Deterministic Guarantees

- **Replay System**: All actions logged with timestamps
- **Seeded Random**: Deterministic map generation
- **Fallback Logic**: Always deterministic
- **State Snapshots**: Reproducible game states

---

## 📚 Documentation

- **[Game README](quaternion-game/GAME_README.md)**: Player-facing documentation
- **[AI README](quaternion-game/src/ai/README.md)**: Detailed AI system documentation
- **[Project Summary](quaternion-game/PROJECT_SUMMARY.md)**: Complete feature list
- **[Deployment Guide](quaternion-game/DEPLOYMENT.md)**: Deployment instructions

---

## 🏆 Competition Ready

This game is fully prepared for AI game competitions:

- ✅ **AI-Powered**: LLM integration with deterministic fallbacks
- ✅ **Deterministic Replays**: Full game verification support
- ✅ **Completable**: <30 minutes gameplay
- ✅ **Browser-Based**: No downloads required
- ✅ **Judge-Ready**: Replay artifacts with metadata
- ✅ **Professional**: Production-quality code and UI

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Enhanced AI strategies
- Additional map types
- More unit types and abilities
- Performance optimizations
- Mobile support

---

## 📄 License

MIT License - Built for the Chroma Awards AI Games competition.

---

## 🙏 Credits

Built with ❤️ using:
- **React** + **TypeScript** for the frontend
- **Phaser 3** for game rendering
- **Google Gemini 2.5 Flash** for AI strategy
- **Supabase** for edge functions
- **Lovable AI** for LLM gateway

---

<div align="center">

**Experience the future of AI-powered gaming with Quaternion** 🚀

[Report Bug](https://github.com/your-repo/issues) • [Request Feature](https://github.com/your-repo/issues) • [Documentation](quaternion-game/GAME_README.md)

</div>
