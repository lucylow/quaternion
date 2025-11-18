# Commander Narrative System

A comprehensive system for generating war strategy storytelling narratives specific to each commander's traits and personality.

## Overview

The Commander Narrative System creates unique, personality-driven narratives for each commander type based on their strategic traits. Each commander has distinct voice, tone, and strategic approach that shapes their storytelling.

## Commanders

### The Architect
- **Traits**: Low aggression (0.25), Low risk tolerance (0.2), High patience (0.95), High micro-focus (0.7)
- **Personality**: Methodical, patient, detail-oriented
- **Strategy**: Build infrastructure first, focus on economic and technological superiority
- **Tone**: Methodical, calculated
- **Example Voice**: "A fortress built in haste is a fortress built to fall. We build for eternity."

### The Aggressor
- **Traits**: High aggression (0.95), High risk tolerance (0.85), Low patience (0.25)
- **Personality**: Aggressive, impatient, risk-taking
- **Strategy**: Rush tactics, early pressure, overwhelming force
- **Tone**: Aggressive, urgent
- **Example Voice**: "Every moment we wait is a moment they prepare. Attack now!"

### The Nomad
- **Traits**: Balanced aggression (0.55), High exploration (0.85), High innovation (0.8)
- **Personality**: Exploratory, innovative, mobile
- **Strategy**: Map control, resource diversity, guerrilla tactics
- **Tone**: Exploratory, adaptive
- **Example Voice**: "The world is vast. Those who stay in one place are already defeated."

### The Tactician
- **Traits**: Balanced aggression (0.6), Medium risk tolerance (0.45), High micro-focus (0.8)
- **Personality**: Calculated, precise, micro-focused
- **Strategy**: Information warfare, superior positioning, tactical precision
- **Tone**: Calculated, analytical
- **Example Voice**: "Victory is not about strength—it's about knowing exactly when and where to apply it."

### The Harvester
- **Traits**: Low aggression (0.2), Low risk tolerance (0.3), High patience (0.9)
- **Personality**: Patient, economic, defensive
- **Strategy**: Economic dominance, defensive play, late-game superiority
- **Tone**: Patient, methodical
- **Example Voice**: "Let them fight. We build. When they are exhausted, we will be unstoppable."

### The Wildcard
- **Traits**: High aggression (0.7), Very high risk tolerance (0.9), High exploration (0.95), High innovation (0.95)
- **Personality**: Chaotic, innovative, unpredictable
- **Strategy**: Unconventional tactics, high-risk plays, constant adaptation
- **Tone**: Chaotic, unpredictable
- **Example Voice**: "Predictability is death. Let's see what happens when we break all the rules."

## Usage

### Basic Usage

```typescript
import { CommanderNarrativeSystem } from './game/campaigns/CommanderNarrativeSystem';
import { NarrativeEventSystem } from './game/campaigns/NarrativeEventSystem';

// Initialize the system
const llmConfig = {
  provider: 'google',
  apiKey: 'your-api-key',
  temperature: 0.8,
  maxTokens: 300
};

const narrativeSystem = new CommanderNarrativeSystem(llmConfig);

// Generate a narrative for a commander
const narrative = await narrativeSystem.generateNarrative({
  commanderId: 'aggressor',
  commanderName: 'The Aggressor',
  traits: {
    aggressiveness: 0.95,
    riskTolerance: 0.85,
    patience: 0.25,
    explorationDrive: 0.3,
    innovationDrive: 0.4,
    microFocus: 0.6
  },
  situation: 'early_game',
  gameState: {
    resources: { ore: 100, energy: 50 },
    units: 5,
    buildings: 2,
    enemyThreat: 0.3,
    time: 2
  },
  seed: 12345
});

console.log(narrative.title); // "Rush to War"
console.log(narrative.narrative); // The narrative text
console.log(narrative.commanderVoice); // "Every moment we wait..."
console.log(narrative.strategicInsight); // Strategic reasoning
```

### Integration with NarrativeEventSystem

```typescript
const eventSystem = new NarrativeEventSystem(llmConfig);

// Generate commander-specific narrative event
const event = await eventSystem.generateCommanderNarrative({
  commanderId: 'tactician',
  commanderName: 'The Tactician',
  traits: { /* ... */ },
  situation: 'battle',
  gameState: { /* ... */ }
});

// Use the event in your game
displayNarrativeEvent(event);
```

### Using Voice Lines

```typescript
import { VoiceLineManager } from './game/campaigns/VoiceLineManager';

const voiceManager = new VoiceLineManager(ttsConfig);

// Get commander voice line
const voiceLine = voiceManager.getCommanderVoiceLine('aggressor', 'battle');
if (voiceLine) {
  await voiceManager.playVoiceLine(voiceLine.id);
}
```

## Situations

The system supports various game situations:

- `early_game`: Opening strategy and initial decisions
- `mid_game`: Mid-game transitions and strategic shifts
- `late_game`: End-game scenarios and final pushes
- `battle`: Active combat situations
- `resource_discovery`: Finding new resources or opportunities
- `defense`: Defensive scenarios
- `victory`: Post-victory narratives
- `defeat`: Post-defeat narratives

## Narrative Structure

Each narrative includes:

1. **Title**: Brief 3-6 word title capturing the moment
2. **Narrative**: 2-3 sentences (40-60 words) describing the commander's approach
3. **Strategic Insight**: 1 sentence (15-25 words) explaining the reasoning
4. **Commander Voice**: Direct quote (10-20 words) showing personality
5. **Tone**: Methodical, aggressive, exploratory, calculated, patient, or chaotic
6. **Narrative Tag**: Situation identifier for tracking

## Caching

Narratives are cached based on:
- Commander ID
- Situation
- Game state (resources, units, buildings, etc.)
- Seed

This ensures consistent narratives for the same scenario while allowing variation with different seeds.

## Fallback System

If LLM generation fails, the system uses rich fallback narratives for each commander and situation combination. These fallbacks capture the essence of each commander's personality and strategy.

## Voice Integration

Each commander has voice lines for different situations:
- Early game strategies
- Battle commands
- Resource management
- Victory/defeat reactions
- Special situations (discovery, analysis, etc.)

Voice lines use SSML formatting and integrate with ElevenLabs TTS for audio generation.

## Extending the System

### Adding New Commanders

1. Add commander to `config/commanders.json`
2. Add fallback narratives in `CommanderNarrativeSystem.ts`
3. Add voice lines in `VoiceLineManager.ts`
4. Update voice mapping if needed

### Adding New Situations

1. Add situation-specific fallback narratives
2. Add voice lines for the situation
3. Update situation descriptions in the prompt builder

## Examples

### Architect Early Game
```
Title: "Foundation First"
Narrative: "The Architect surveys the terrain with methodical precision. Every structure is planned, every resource node calculated. Patience is the foundation of victory—build the infrastructure, and the war will follow."
Voice: "A fortress built in haste is a fortress built to fall. We build for eternity."
```

### Aggressor Battle
```
Title: "Overwhelming Force"
Narrative: "The Aggressor leads from the front, units surging forward in relentless waves. Tactics are for the cautious—victory belongs to those who strike without hesitation."
Voice: "Push forward! Break their lines! Victory or death!"
```

### Wildcard Innovation
```
Title: "Chaos Theory"
Narrative: "The Wildcard experiments, innovates, breaks conventions. No strategy is sacred, no approach too risky. Innovation comes from embracing the unpredictable."
Voice: "Conventional wisdom is for conventional losers. Let's try something impossible."
```

## Integration Points

- **Campaign System**: Use in campaign narratives
- **AI System**: Enhance AI commander personalities
- **Tutorial System**: Teach players about different strategies
- **Replay System**: Add narrative context to replays
- **Achievement System**: Track commander-specific achievements

