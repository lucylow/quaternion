# Narrative Design Implementation

## Overview

This document describes the complete narrative design system implemented for Quaternion based on the narrative design playbook. The system creates emotional impact, builds a convincing world, and creates characters players empathize with.

## Core Systems

### 1. Core Narrative Characters (`CoreNarrativeCharacters.ts`)

Three key characters that drive emotional connection:

- **Commander Lian Yao** - The Pragmatist: Player's in-game contact, calm and efficient
- **Dr. Mara Kest** - The Biologist: Scientist pleading for Bio-Seed conservation
- **Patch** - The Wry Drone: Comedic AI advisor providing tactical hints and comic relief

**Features:**
- 15 ready-to-use voice lines (5 per character) with SSML for ElevenLabs
- Character memory system that tracks player actions
- Dynamic relationship system based on player choices
- Emotional state tracking

**Usage:**
```typescript
import { CoreNarrativeCharactersManager } from '@/game/narrative/CoreNarrativeCharacters';

const characters = new CoreNarrativeCharactersManager();

// Get voice line
const voiceLine = characters.getVoiceLine('DR_MARA_KEST', 'First encounter with Bio-Seed');

// Record player action
characters.recordPlayerAction('harvest_bio_mass', 'Before harvesting Bio-Seed', 'greedy');
```

### 2. Dynamic Narrative Events (`DynamicNarrativeEvents.ts`)

LLM-driven procedural narrative vignettes that create emotional moments tied to gameplay.

**Features:**
- Generates contextual 1-2 sentence narrative events based on game state
- Tied to resource/tech/terrain choices
- Creates emotional impact (hopeful, melancholic, tense, triumphant, somber)
- Includes gameplay effects (buffs, debuffs, narrative consequences)

**Usage:**
```typescript
import { DynamicNarrativeEventGenerator } from '@/game/narrative/DynamicNarrativeEvents';

const generator = new DynamicNarrativeEventGenerator(llmConfig);

const event = await generator.generateEvent(
  {
    action: 'harvest_attempt',
    resourceChange: { type: 'biomass', threshold: 'depleted', delta: -50 }
  },
  gameState,
  'Player harvested biomass'
);
```

**LLM Prompt:**
The system uses a structured prompt that generates JSON with:
- Event name
- 1-2 sentence flavor text
- Gameplay effect (type, description, mechanical impact, duration)
- Emotional tone
- Character reactions (optional)

### 3. Narrative Consequences System (`NarrativeConsequencesSystem.ts`)

Ties gameplay choices (resource, tech, terrain) to narrative outcomes players can feel.

**Features:**
- Processes player choices and generates visual/audio/narrative consequences
- Tracks player alignment (-1 greedy to +1 humane)
- Manifests consequences as:
  - Visual effects (terrain degradation/flourishing)
  - Audio cues (Bio-Seed sounds, character reactions)
  - Narrative text (short evocative descriptions)
  - Character reactions (voice lines)
  - Mechanical impacts (buffs/debuffs)

**Usage:**
```typescript
import { NarrativeConsequencesManager } from '@/game/narrative/NarrativeConsequencesSystem';

const consequences = new NarrativeConsequencesManager(characters, eventGenerator);

const consequence = await consequences.processChoice({
  type: 'resource',
  action: 'harvest_bio_mass',
  value: { amount: 50, before: 70, after: 20 },
  gameState: currentGameState
});
```

### 4. 3-Act Demo Narrative Structure (`DemoNarrativeStructure.ts`)

Implements the narrative spine for a 3-15 minute demo arc.

**Act I: Arrival (0-3 min)**
- Setup: Arrive at contested tile, discover Bio-Seed, present initial choice

**Act II: Choice & Cost (3-10 min)**
- Conflict: Consequences manifest, moral friction escalates, terrain changes dynamically

**Act III: Outcome & Resonance (10-15 min)**
- Closure: Tactical result + narrative resonance, cinematic ending, replay hook

**Features:**
- Narrative beats at specific timestamps
- Act-specific objectives
- Transition events between acts
- Character dialogue triggers
- Dynamic events based on player path

**Usage:**
```typescript
import { DemoNarrativeDirector } from '@/game/narrative/DemoNarrativeStructure';

const director = new DemoNarrativeDirector(characters, eventGenerator, consequences);

// Update each frame
await director.update(gameState);

// Get current act
const currentAct = director.getCurrentAct();
```

### 5. Narrative Integration (`NarrativeIntegration.ts`)

Single entry point that coordinates all narrative systems.

**Features:**
- Unified API for all narrative functionality
- Singleton pattern for global access
- Configuration options for enabling/disabling features
- Export functions for voice lines and LLM prompts

**Usage:**
```typescript
import { getNarrativeIntegration } from '@/game/narrative/NarrativeIntegration';

const narrative = getNarrativeIntegration({
  enableDemoNarrative: true,
  enableDynamicEvents: true,
  enableVoiceLines: true
});

// Initialize with game state
await narrative.initialize(gameState);

// Process player choice
await narrative.processPlayerChoice({
  type: 'resource',
  action: 'harvest_bio_mass',
  value: { amount: 50 },
  gameState: currentGameState
});

// Update each frame
await narrative.update(currentGameState);

// Get narrative summary
const summary = narrative.getNarrativeSummary();
```

## Voice Lines

### ElevenLabs Integration

All voice lines include SSML for ElevenLabs voice generation:

```xml
<speak>
  <voice name="Mara">
    <emphasis level="strong">Don't wake it.</emphasis>
    <break time="300ms"/>
    If you wake it wrong, it will consume everything...
    <break time="400ms"/>
    but if you nurture it, it may teach us how to heal.
  </voice>
</speak>
```

**Character Voice IDs:**
- Lian Yao: `LIAN_VOICE_ID` (replace with actual ElevenLabs voice ID)
- Dr. Mara Kest: `MARA_VOICE_ID` (replace with actual ElevenLabs voice ID)
- Patch: `PATCH_VOICE_ID` (replace with actual ElevenLabs voice ID)

**Export all voice lines:**
```typescript
const voiceLines = narrative.exportVoiceLinesForElevenLabs();
// Returns: { lian: [...], mara: [...], patch: [...], totalCount: 15 }
```

## LLM Prompts

### Event Generation Prompt

The system uses this prompt structure for generating narrative events:

```
You are a narrative event generator for a sci-fi RTS game called Quaternion. 
Players must balance resource gathering with protecting an emergent lifeform (Bio-Seed).

Game State:
[Resources, Techs, Time, Alignment, Bio-Seed State, Recent Choices]

Trigger:
[Action, Resource Change, Tech Researched, Player Choice]

Generate a brief, evocative narrative event (1-2 sentences) that:
1. Creates emotional impact (make players feel something)
2. Reflects the consequence of player choices
3. Uses vivid, sensory language
4. Ties directly to the trigger and game state

Respond ONLY with valid JSON...
```

**Get prompts:**
```typescript
const prompts = narrative.getLLMPrompts();
// Returns: { eventGeneration, moralDilemma, characterReaction }
```

## Integration with Gameplay

### Resource Choices

When player harvests resources (especially biomass):
1. Trigger consequence system
2. Generate dynamic event
3. Update character relationships
4. Show visual/audio/narrative consequences
5. Update Bio-Seed state

### Tech Choices

When player researches tech:
1. Check if tech is "humane" (BioConserve) or "greedy" (Overclock)
2. Generate appropriate consequences
3. Character reactions (Mara for humane, Lian for pragmatic, Patch for greedy)
4. Update player alignment
5. Show mechanical and narrative effects

### Terrain Choices

When player captures/controls terrain:
1. Check for consequences (abandoning settlements, etc.)
2. Generate narrative event about cost
3. Character reactions (Lian for pragmatic cost, Mara for ecological cost)
4. Visual changes to terrain

## Narrative Flow

1. **Game Start**: Act I begins, characters introduce themselves
2. **First Choice**: Player chooses harvest vs conserve
3. **Consequences Manifest**: Visual, audio, narrative consequences appear
4. **Character Reactions**: Characters respond to choices
5. **Dynamic Events**: LLM generates contextual events based on state
6. **Act Transitions**: Move through 3-act structure
7. **Climax**: Bio-Seed fully responds to player choices
8. **Resolution**: Tactical result + narrative resonance
9. **Replay Hook**: Hint at different outcome possible

## Example Implementation

```typescript
// Initialize narrative system
const narrative = getNarrativeIntegration({
  enableDemoNarrative: true,
  enableDynamicEvents: true,
  enableVoiceLines: true,
  llmConfig: { provider: 'google', apiKey: process.env.LLM_API_KEY }
});

// In game loop
async function gameLoop(gameState) {
  // Update narrative
  await narrative.update(gameState);

  // When player makes choice
  if (playerHarvestedBiomass) {
    const consequence = await narrative.processPlayerChoice({
      type: 'resource',
      action: 'harvest_bio_mass',
      value: { amount: 50, before: 70, after: 20 },
      gameState
    });

    // Display consequences
    displayVisualEffect(consequence.consequences);
    playVoiceLine(consequence.consequences.find(c => c.type === 'character_reaction'));
    showNarrativeText(consequence.consequences.find(c => c.type === 'narrative'));
  }

  // Get current narrative state
  const summary = narrative.getNarrativeSummary();
  updateNarrativeUI(summary);
}
```

## Next Steps

1. **Integrate with Game State**: Connect narrative system to actual game state manager
2. **UI Integration**: Create UI components to display narrative events and character reactions
3. **Audio Integration**: Connect voice lines to audio playback system
4. **Visual Effects**: Implement visual consequences (terrain degradation/flourishing)
5. **Testing**: Test all narrative paths (humane, greedy, pragmatic)
6. **ElevenLabs Setup**: Replace placeholder voice IDs with actual ElevenLabs voice IDs
7. **LLM API Setup**: Configure LLM API keys for dynamic event generation

## Files Created

- `CoreNarrativeCharacters.ts` - Character system with voice lines
- `DynamicNarrativeEvents.ts` - LLM-driven event generation
- `NarrativeConsequencesSystem.ts` - Consequences tied to choices
- `DemoNarrativeStructure.ts` - 3-act demo structure
- `NarrativeIntegration.ts` - Unified integration module

## Summary

The narrative design system is now fully implemented and ready for integration with gameplay. It provides:

✅ 15 ready-to-use voice lines with SSML for ElevenLabs
✅ LLM-driven dynamic event generation
✅ Narrative consequences tied to gameplay choices
✅ 3-act demo narrative structure
✅ Character memory and relationship systems
✅ Player alignment tracking
✅ Complete integration module

The system is designed to make players feel, care, and remember the game through emotional impact, convincing world-building, and empathetic characters.

