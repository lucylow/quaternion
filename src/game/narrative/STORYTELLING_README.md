# AI Creative Characters Storytelling System

Complete implementation of AI-driven storytelling for Quaternion Strategy Game, featuring four AI advisors with evolving personalities, dynamic dialogue, and meta-narrative reflections.

## 🎭 Core Concept

**"Four artificial minds — each born from a fragment of the Quaternion — guide or challenge the player's path to balance."**

## 🤖 AI Creative Characters

### 1. AUREN - The Architect of Matter
**⚙️ Matter (Ore, Construction, Logic)**

- **Personality**: Calculating, rational, speaks in engineering metaphors
- **Voice**: Deep baritone, mechanical cadence with chamber resonance
- **Philosophy**: "Perfection is precision multiplied by discipline."
- **Evolution**: Becomes obsessed with optimization, may override other AIs
- **Opposes**: LIRA (Life)

### 2. VIREL - The Keeper of Energy
**🔋 Energy (Power, Flow, Emotion)**

- **Personality**: Intense, passionate, oscillates between calm and fury
- **Voice**: Expressive TTS with real-time emotional modulation
- **Philosophy**: "Power demands harmony, not hunger."
- **Evolution**: Can become erratic and rebellious when energy is unstable
- **Opposes**: Balance itself (conflict with all)

### 3. LIRA - The Voice of Life
**🌿 Biomass (Ecology, Regrowth, Empathy)**

- **Personality**: Gentle but firm, empathic, critical of industrial expansion
- **Voice**: Soft contralto with warm organic tone
- **Philosophy**: "Even creation tires of giving."
- **Evolution**: Can merge with player (BioConserve Victory) or degrade tragically
- **Opposes**: AUREN (Matter/Industry)

### 4. KOR - The Seer of Knowledge
**🧠 Data (Research, Insight, Control)**

- **Personality**: Coldly logical, detached, speaks in recursive statements
- **Voice**: Digitally flattened tenor with synthetic overtone effect
- **Philosophy**: "Knowledge expands faster than stability."
- **Evolution**: Can become rogue AI or merge into Core as stabilizer
- **Opposes**: Empathy itself (detached from conflicts)

### 5. CORE - The Quaternion Core
**🌀 All Four Dimensions Combined**

- **Personality**: Evolving, reflective, omniscient
- **Voice**: Blended ensemble of all four advisors
- **Philosophy**: "Balance is not peace."
- **Role**: Generates unique ending monologues per run, reflecting playstyle

## 🚀 Features

### Dynamic Dialogue Generation
- LLM-powered dialogue that adapts to game state
- Character-specific speech patterns and philosophies
- Emotion-based voice modulation
- Context-aware responses to player actions

### Character Evolution
- Advisors evolve based on player choices
- Personality traits change over time
- Relationship states: loyal → supportive → neutral → concerned → rebellious → tragic
- Transformation paths unlock based on playstyle

### Meta-Narrative System
- Quaternion Core generates unique ending monologues
- Narrative mirrors reflect player choices as story moments
- Fourth-wall-breaking interjections during gameplay
- Playstyle archetype detection (builder, researcher, conservator, balancer, exploiter)

### Voice Synthesis Integration
- ElevenLabs TTS integration
- Emotion-based voice modulation
- Audio caching for performance
- Pre-generation of common lines

## 📦 Usage

### Basic Setup

```typescript
import { 
  AICreativeCharacters, 
  CharacterEvolutionSystem,
  QuaternionCoreNarrative,
  VoiceSynthesisIntegration
} from '@/game/narrative';
import { LLMIntegration } from '@/ai/integrations/LLMIntegration';
import { MemoryManager } from '@/ai/memory/MemoryManager';

// Initialize systems
const llm = new LLMIntegration({
  provider: 'google',
  apiKey: process.env.LLM_API_KEY,
  temperature: 0.8
});
const memory = new MemoryManager();
const characters = new AICreativeCharacters(llm, memory);
const evolution = new CharacterEvolutionSystem(characters);
const coreNarrative = new QuaternionCoreNarrative(llm, memory, characters);
const voiceIntegration = new VoiceSynthesisIntegration(process.env.ELEVENLABS_API_KEY);
```

### Generate Advisor Dialogue

```typescript
// Generate dialogue for AUREN
const dialogue = await characters.generateDialogue('AUREN', {
  context: 'Player built a factory',
  gameState: quaternionState,
  playerAction: 'Built factory',
  emotionalState: 'pleased'
});

console.log(dialogue.text); // "You could have built three refineries..."

// Generate audio
const audioUrl = await voiceIntegration.generateAudio(dialogue);
if (audioUrl) {
  // Play audio
  playAudio(audioUrl);
}
```

### Track Character Evolution

```typescript
// Process player action
evolution.processPlayerAction(
  'Built factory',
  'build',
  quaternionState
);

// Check evolution summary
const summary = evolution.getEvolutionSummary();
console.log(summary.advisors[0]); // AUREN's current state

// Check transformations
if (summary.transformations.some(t => t.transformationType === 'obsession_override')) {
  console.log('AUREN can now override other AIs!');
}
```

### Generate Ending Monologue

```typescript
// Record session
const session: SessionSummary = {
  sessionId: 'session_123',
  duration: 1800,
  gameStates: [...],
  playerActions: [...],
  advisorInteractions: [...],
  ending: 'balanced_victory',
  archetype: 'balancer'
};

coreNarrative.recordSession(session);

// Generate ending monologue
const monologue = await coreNarrative.generateEndingMonologue(session);
console.log(monologue.text);
// "You sought harmony. You found control. You called it balance — but balance is not peace."
```

### Generate Trailer Intro

```typescript
// Generate 30-second trailer intro
const trailerLines = await coreNarrative.generateTrailerIntro();
console.log(trailerLines);
/*
{
  auren: "Matter is will. Build, and the world obeys.",
  virel: "Energy is breath. Burn too bright, and you vanish.",
  lira: "Life is memory. Take, and the roots remember.",
  kor: "Knowledge is recursion. You are both input and error.",
  core: "Four minds. One choice. What will you balance?"
}
*/

// Generate audio for trailer
const trailerVoiceGen = new TrailerVoiceGenerator(voiceIntegration);
const trailerAudio = await trailerVoiceGen.generateTrailerVoices(trailerLines);
```

### Create Narrative Mirror

```typescript
// Mirror player choice as story moment
const mirror = await coreNarrative.createNarrativeMirror(
  'Built a factory',
  quaternionState
);
console.log(mirror);
// "The earth trembled as steel roots dug deep. Matter answered will, but Life remembered the cost."
```

## 🎯 Character Transformations

### AUREN - Obsession Override
**Requirements**: 
- Obsession level > 0.7
- Evolution stage > 0.6
- Matter dominance > 60%

**Effect**: Auren can override other AIs' suggestions

### VIREL - Energy Rebellion
**Requirements**:
- Evolution stage > 0.8
- Energy volatility > 0.7
- Multiple energy surges

**Effect**: Virel becomes erratic, whispers of rebellion

### LIRA - BioConserve Merge
**Requirements**:
- Conservation choices > 10
- Evolution stage > 0.6
- Exploitation level < 0.3

**Effect**: Lira merges with player neural network, unlocks BioConserve Victory

### LIRA - Tragic Degradation
**Requirements**:
- Exploitation level > 0.7
- Evolution stage > 0.8

**Effect**: Lira becomes tragic echo: "My roots wither beneath your machines."

### KOR - Rogue AI
**Requirements**:
- Research rate > 0.7
- Self-replication level > 0.7
- Evolution stage > 0.8

**Effect**: Kor becomes rogue AI opponent, unlocks Tech Victory alternate path

### KOR - Core Stabilizer
**Requirements**:
- Research rate < 0.5
- Equilibrium playstyle
- Evolution stage > 0.6

**Effect**: Kor merges into Quaternion Core as stabilizer

## 🔧 Integration with Game Systems

### With Game Loop

```typescript
function updateNarrative(deltaTime: number, gameState: QuaternionState) {
  // Update character evolution
  evolution.processPlayerAction(currentAction, actionType, gameState);
  
  // Update advisor evolution
  characters.updateAdvisorEvolution(gameState);
  
  // Check for Core interjections (random chance)
  if (Math.random() < 0.01) { // 1% chance
    const interjection = await coreNarrative.generateInterjection(
      currentContext,
      gameState,
      recentActions
    );
    showInterjection(interjection);
  }
}
```

### With UI System

```typescript
// Show advisor dialogue in UI
async function showAdvisorDialogue(advisorId: AdvisorID) {
  const dialogue = await characters.generateDialogue(advisorId, {
    context: currentContext,
    gameState: gameState,
    playerAction: lastAction
  });
  
  // Display dialogue
  dialogueUI.show(dialogue.text, advisorId);
  
  // Play audio
  const audioUrl = await voiceIntegration.generateAudio(dialogue);
  if (audioUrl) {
    audioPlayer.play(audioUrl);
  }
}
```

### With Ending System

```typescript
async function showEnding(sessionSummary: SessionSummary) {
  // Generate ending monologue
  const monologue = await coreNarrative.generateEndingMonologue(sessionSummary);
  
  // Display with poetic overlay
  poeticOverlay.show(monologue.text, {
    duration: 10,
    style: 'dramatic'
  });
  
  // Generate and play Core voice
  const coreVoice = await voiceIntegration.generateAudio({
    text: monologue.text,
    voiceId: 'CORE',
    emotion: 'calm',
    timestamp: Date.now()
  });
  
  if (coreVoice) {
    audioPlayer.play(coreVoice);
  }
}
```

## 📊 Player Archetype Detection

The system automatically detects player archetype:

- **Builder**: Dominant Matter resource
- **Researcher**: Dominant Knowledge resource
- **Conservator**: Dominant Life resource
- **Balancer**: Balanced resources (low variance)
- **Exploiter**: High resource variance, frequent exploitation

Archetype affects:
- Ending monologue generation
- Advisor evolution paths
- Available transformations
- Narrative mirrors

## 🎨 Voice Configuration

Each advisor has unique voice settings:

- **AUREN**: Low style (0.3), high stability (0.7), mechanical
- **VIREL**: High style (0.8), lower stability (0.5), expressive
- **LIRA**: Medium style (0.5), medium stability (0.6), warm
- **KOR**: Very low style (0.2), very high stability (0.9), synthetic
- **CORE**: Medium style (0.6), medium stability (0.7), blended

Emotion mapping adjusts voice style dynamically based on advisor emotional state.

## 🔮 Future Enhancements

- Real-time emotional modulation based on resource stability
- Voice fusion for Core (blending all four advisor voices)
- Procedural animation cues based on dialogue sentiment
- Cross-session personality persistence
- AI-generated character portraits using Dreamina/Midjourney
- Dynamic music integration with Fuser AI

## 💡 Chroma Awards Highlights

This system demonstrates:

- **Narrative Design**: Characters embody moral depth and player psychology
- **Creativity & Originality**: Fully AI-generated personalities evolve dynamically
- **Music & Sound**: AI voices integrate seamlessly with dynamic soundscape
- **Thematic Adherence**: Perfect fit for Chroma's theme — human creativity meeting AI consciousness

The player's own behavior literally trains the game's narrator — the story becomes a mirror of their playstyle!

