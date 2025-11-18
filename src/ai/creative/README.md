# 🎨 AI Creative Features - Quaternion

**"In Quaternion, AI isn't the opponent. It's the ecosystem itself — creating, reacting, and storytelling alongside the player."**

This module implements comprehensive AI creative features that transform Quaternion from a traditional RTS into a living, breathing simulation where AI acts as co-creator, narrator, and moral mirror.

## 🌟 Overview

The AI Creative Features system integrates multiple AI tools to create:

1. **Procedural World Generation** - AI-driven terrain synthesis with prompt-based biome blending
2. **Adaptive Commander Agents** - Learning AI opponents with evolving personalities
3. **AI Voiceover & Narrative** - Emotionally reactive storytelling with sentiment modulation
4. **Adaptive Music** - Procedurally generated soundtracks that respond to game state
5. **Dynamic Lore Engine** - AI-generated world-building and moral memory tracking
6. **Meta-AI: The Quaternion Core** - Symbolic AI entity that judges player philosophy

## 🧬 1. AI-Driven World Generation

**File**: `AIWorldGenerator.ts`

### Features

- **Prompt-Based Terrain Synthesis**: Generate worlds from natural language descriptions
  - Example: `"arid wasteland"`, `"overgrown ruin"`, `"fractured ice plain"`
- **AI Biome Analysis**: LLM analyzes prompts to determine biome properties
- **Resource Probability Mapping**: Auto-labels tiles with resource densities
- **Strategic Personality Generation**: AI determines map's strategic character

### Usage

```typescript
import { AIWorldGenerator } from './ai/creative';

const generator = new AIWorldGenerator({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY
});

const world = await generator.generateWorld({
  descriptor: "fractured neon wasteland with overgrown biotech ruins",
  seed: 12345,
  width: 64,
  height: 64
});

// World includes:
// - Biome profiles with resource densities
// - Terrain map
// - Resource probability maps
// - Strategic personality
```

### Why It's Creative

- **No two maps are alike**: Each prompt generates unique strategic variety
- **Semantic understanding**: AI interprets terrain descriptions, not just random generation
- **Strategic depth**: Maps have personality that affects gameplay

## 🧠 2. Adaptive Commander Agents

**File**: `AdaptiveCommanderAI.ts`

### Features

- **Evolving Personalities**: Commanders learn from match outcomes
- **Four-Axis Weighting**: Personality based on Matter, Energy, Life, Knowledge
- **LLM-Driven Advisors**: Distinct advisor personalities (Economist, Biologist, Ascendant, Engineer)
- **Tactical Commentary**: AI generates strategic insights based on current state

### Usage

```typescript
import { AdaptiveCommanderAI, QuaternionAxis } from './ai/creative';

const commander = new AdaptiveCommanderAI(
  'Commander Theta',
  [0.6, 0.4, 0.5, 0.7], // Initial weights
  { provider: 'google', apiKey: process.env.GOOGLE_AI_API_KEY }
);

// After match
commander.adjustAfterMatch(true, [0.8, 0.6, 0.5, 0.9]);

// Get tactical comment
const comment = await commander.getTacticalComment({
  currentState: 'Player expanding rapidly',
  playerActions: ['built_barracks', 'gathered_ore'],
  axisBalance: [0.7, 0.5, 0.4, 0.6]
});
// Returns: "AI prioritizes Knowledge — strategic bias recalibrated."
```

### Why It's Creative

- **Dynamic rivals**: AI evolves, not static difficulty presets
- **Personality-driven**: Each commander has distinct strategic voice
- **Learning system**: Improves based on player behavior

## 🗣️ 3. AI Voiceover & Sentiment Modulation

**File**: `AIVoiceController.ts`

### Features

- **Emotion-Based Voice Modulation**: Pitch, volume, speed adjust based on tone
- **Multiple Voice Profiles**: Narrator, Economist, Biologist, Ascendant, Engineer
- **ElevenLabs Integration**: High-quality text-to-speech
- **Dynamic Tone Shifting**: Voice adapts to game state (calm → panicked → triumphant)

### Usage

```typescript
import { AIVoiceController, VoiceTone } from './ai/creative';

const voice = new AIVoiceController({
  apiKey: process.env.ElevenLabs_API_key
});

// Set tone based on game state
if (biomass < 20) {
  voice.setTone(VoiceTone.Panicked);
}

// Speak with current tone
await voice.speak(
  "Biomass levels critical! Life support failing!",
  'biologist',
  VoiceTone.Panicked
);
```

### Why It's Creative

- **Emotionally reactive**: Voice reflects game state, not just static narration
- **Character differentiation**: Each advisor has distinct voice and tone
- **Immersive storytelling**: Players feel like they're debating with sentient systems

## 🎶 4. Adaptive AI Music Mixer

**File**: `AdaptiveMusicMixer.ts`

### Features

- **State-Based Music Styles**: Music morphs based on game metrics
- **Dynamic Stem Layering**: Adds/removes layers based on tension, chaos, equilibrium
- **Audio Effects**: Low-pass filtering, distortion, reverb based on state
- **Fuser Integration**: Real-time music generation and remixing

### Music Styles

| Game State | Music Style | Mood |
|------------|-------------|------|
| Equilibrium | Ambient minimalism | Calm, order |
| Energy Crisis | Electronic pulses | Tension |
| Biomass Growth | Organic synths | Flourishing life |
| Imbalance/Chaos | Dissonant strings, distorted bass | Collapse |

### Usage

```typescript
import { AdaptiveMusicMixer } from './ai/creative';

const mixer = new AdaptiveMusicMixer({
  provider: 'fuser',
  apiKey: process.env.FUSER_API_KEY
});

// Update based on game state
await mixer.updateState({
  equilibrium: 0.8,
  chaos: 0.2,
  tension: 0.3,
  energyCrisis: false,
  biomassGrowth: true,
  imbalance: false
});

// Music automatically transitions to "biomass_growth" style
```

### Why It's Creative

- **Living soundtrack**: Music reflects world state, not just combat
- **Emotional resonance**: Players feel the simulation's state through music
- **Procedural composition**: AI generates stems that blend seamlessly

## 📜 5. Dynamic Lore Engine

**File**: `LoreEngine.ts`

### Features

- **AI-Generated World Chronicles**: Each map seed gets unique backstory
- **Moral Memory Tracking**: Remembers player actions across runs
- **Dynamic Event Narratives**: Contextual micro-events that alter gameplay
- **Philosophical Reflections**: AI generates insights based on player choices

### Usage

```typescript
import { LoreEngine } from './ai/creative';

const lore = new LoreEngine({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY
});

// Generate world chronicle
const chronicle = await lore.generateWorldChronicle(
  12345,
  'crystalline_plains',
  'A mystical alien world with glowing structures'
);

// chronicle.lore contains:
// - Myth: "Legends speak of crystalline plains..."
// - Backstory: "Formed through cataclysmic events..."
// - Log: "Research log: Anomalous readings detected..."

// Record player action
lore.recordPlayerAction('player_123', 'destroyed_civilian_structure', 'negative');

// Generate moral reflection
const reflection = await lore.generateMoralReflection('player_123');
```

### Why It's Creative

- **Living world**: Lore rewrites itself based on player behavior
- **Moral consequences**: Actions remembered across sessions
- **Emergent narrative**: Stories emerge from gameplay, not scripts

## ⚙️ 6. Meta-AI: The Quaternion Core

**File**: `QuaternionCore.ts`

### Features

- **Balance Measurement**: Tracks all four Quaternion axes
- **Philosophy Detection**: Analyzes player approach (Materialist, Vitalist, etc.)
- **Sentiment Analysis**: Uses LLM to analyze play log
- **Judgment Monologues**: Generates unique closing statements

### Usage

```typescript
import { QuaternionCore } from './ai/creative';

const core = new QuaternionCore({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY
});

// Record actions
core.recordAction('built_reactor', 'energy', 0.2);
core.recordAction('harvested_biomass', 'life', 0.1);
core.recordAction('researched_tech', 'knowledge', 0.15);

// Evaluate endgame
const judgment = await core.evaluateEndgame(true);

// judgment contains:
// - verdict: "Perfect Harmony" or "Victory Through Imbalance"
// - philosophy: "Materialist", "Balanced", etc.
// - monologue: "You sought symmetry through control..."
// - recommendations: ["Focus on balancing all four axes..."]
```

### Why It's Creative

- **Moral mirror**: AI becomes storytelling conscience
- **Philosophical depth**: Judges not just victory, but method
- **Unique endings**: Each playthrough gets personalized judgment

## 🎮 Complete Integration

**File**: `AICreativeManager.ts`

The `AICreativeManager` orchestrates all systems:

```typescript
import { AICreativeManager } from './ai/creative';

const aiManager = new AICreativeManager({
  llm: { provider: 'google', apiKey: process.env.GOOGLE_AI_API_KEY },
  elevenLabs: { apiKey: process.env.ELEVENLABS_API_KEY },
  music: { provider: 'fuser', apiKey: process.env.FUSER_API_KEY }
});

// Generate world
const world = await aiManager.generateWorld({
  descriptor: "fractured neon wasteland",
  seed: 12345,
  width: 64,
  height: 64
});

// Create commander
const commander = aiManager.createCommander('Commander Theta');

// Update every game tick
await aiManager.updateGameState(gameState);

// Record actions
aiManager.recordPlayerAction('built_structure', 'matter', 0.1, 'neutral');

// Evaluate endgame
const judgment = await aiManager.evaluateEndgame(victory);
```

## 🏆 Chroma Awards Highlights

### Judge-Ready Features

1. **AI as Co-Creator**: Not just opponent, but world-builder, narrator, and judge
2. **Emergent Narrative**: Stories emerge from gameplay, not scripts
3. **Emotional Reactivity**: Voice, music, and lore adapt to player actions
4. **Moral Memory**: System remembers and reflects on player choices
5. **Philosophical Depth**: AI judges not just victory, but player philosophy

### Technical Innovation

- **Multi-Modal AI Integration**: LLM + TTS + Music + Procedural Generation
- **Real-Time Adaptation**: All systems respond to game state dynamically
- **Persistent Memory**: Moral memory and commander learning persist across sessions
- **Fallback Systems**: Works without API keys (graceful degradation)

### Creative Collaboration

- **Human Direction + Machine Creativity**: Designers guide, AI generates
- **Surprise & Delight**: AI generates unexpected but coherent content
- **Living World**: Simulation that responds and remembers

## 📊 Metrics to Track

For Chroma Awards submission, track:

- **World Generation**: Number of unique maps generated, prompt variety
- **Commander Learning**: Personality evolution over matches
- **Voice Narration**: Lines generated, tone variety
- **Music Adaptation**: Style transitions, state responsiveness
- **Lore Generation**: Unique chronicles per seed
- **Core Judgments**: Philosophy variety, monologue uniqueness

## 🔧 Configuration

All systems work with or without API keys:

```typescript
// Full AI features
const manager = new AICreativeManager({
  llm: { provider: 'google', apiKey: '...' },
  elevenLabs: { apiKey: '...' },
  music: { provider: 'fuser', apiKey: '...' }
});

// Fallback mode (no API keys)
const manager = new AICreativeManager({});
// Systems use fallback generation, still functional
```

## 🚀 Next Steps

1. **Visual Integration**: Connect world generation to map renderer
2. **Audio Playback**: Integrate voice and music with game audio system
3. **UI Integration**: Display lore, judgments, and commander comments
4. **Persistence**: Save moral memory and commander personalities
5. **Testing**: Validate AI outputs for coherence and variety

---

**"The AI becomes a storytelling conscience — not just a mechanic, but a moral mirror."**

