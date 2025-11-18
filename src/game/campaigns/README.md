# Campaign System

A comprehensive narrative campaign system for Quaternion that integrates LLM-generated events, voice lines, and player choices to create meaningful storytelling experiences.

## Features

- **Multiple Campaigns**: Pre-configured campaigns with 3-act structures
- **LLM Integration**: Dynamic narrative event generation using AI
- **Voice Lines**: SSML-ready voice lines with TTS integration
- **Choice System**: Player choices affect narrative outcomes
- **Epilogue Generation**: Dynamic or pre-written epilogues based on choices
- **Seed Management**: Pre-baked seeds for judge demos and replays

## Architecture

### Core Systems

1. **CampaignSystem** (`CampaignSystem.ts`)
   - Manages campaign state and progression
   - Handles player choices and their effects
   - Tracks narrative tags and resources

2. **NarrativeEventSystem** (`NarrativeEventSystem.ts`)
   - Generates narrative events using LLM
   - Caches events for reproducibility
   - Provides fallback events

3. **VoiceLineManager** (`VoiceLineManager.ts`)
   - Manages SSML voice lines
   - Integrates with ElevenLabs TTS
   - Pre-generates and caches audio

4. **CampaignSeedManager** (`CampaignSeedManager.ts`)
   - Manages pre-baked seeds
   - Provides judge demo scenarios
   - Exports/imports seed data

## Campaigns

### The Archive

**Duration**: 10-12 minutes (demo), 30-50 minutes (full)

**Premise**: An ancient archive contains sleeping Bio-Seeds. Players must choose between harvesting for immediate resources or preserving for long-term benefits.

**Acts**:
1. **Descent** (0-3m): Breach the archive, discover the Bio-Seed
2. **Consequence** (3-8m): Make the choice, face consequences
3. **Reckoning** (8-12m): Face the outcome, see the epilogue

**Characters**:
- Dr. Mara Kest (Biologist) - Ethical, pleading
- Commander Lian (Commander) - Pragmatic, cold
- Patch (Drone) - Wry, humorous

**Choices**:
- **Harvest Now**: +60 resources, -25 bio-seed health, guilt narrative tag
- **Preserve**: +12 bio-seed health, +20% long-term yield, hope narrative tag

## Usage

### Starting a Campaign

```typescript
import { CampaignSystem } from './game/campaigns/CampaignSystem';

const campaignSystem = new CampaignSystem();
const state = campaignSystem.startCampaign('archive', 913027);
```

### Generating Narrative Events

```typescript
import { NarrativeEventSystem } from './game/campaigns/NarrativeEventSystem';

const narrativeSystem = new NarrativeEventSystem({
  provider: 'google',
  apiKey: process.env.GOOGLE_AI_API_KEY
});

const event = await narrativeSystem.generateEvent({
  campaign: 'archive',
  trigger: 'harvest_attempt',
  seed: 913027,
  bioSeedHealth: 85,
  playerResources: 80
});
```

### Playing Voice Lines

```typescript
import { VoiceLineManager } from './game/campaigns/VoiceLineManager';

const voiceManager = new VoiceLineManager({
  apiKey: process.env.ElevenLabs_API_key
});

await voiceManager.playVoiceLine('mara_warning');
```

### Getting Epilogue

```typescript
import { getEpilogue } from './game/campaigns/EpilogueData';

const epilogue = getEpilogue('archive', ['harvest']);
// Returns: "The earth shudders; fungus withers..."
```

## LLM Prompts

The system uses structured prompts for consistent output:

### Narrative Micro Event

```javascript
SYSTEM: You are a concise in-game event generator...
INPUT: {campaign, trigger, seed, bioSeedHealth, ...}
OUTPUT: {event, flavor, effect}
```

### Epilogue Generator

```javascript
SYSTEM: You are a concise game epilogue writer...
INPUT: {choices, outcomes}
OUTPUT: {epilogue, tone}
```

## Voice Lines

Voice lines are stored with SSML formatting:

```xml
<speak>
  <voice name="Mara">
    <prosody rate="0.92">Please — listen. It remembers more than we do.</prosody>
    <break time="250ms"/>
  </voice>
</speak>
```

## Seeds

Pre-baked seeds are available in `src/fixtures/campaign_seeds.json`:

- `seed-archive-001`: Ethical choice demo (10-12 min)
- `seed-archive-002`: High pressure tradeoff
- `seed-archive-003`: Environmental event trigger
- `seed-archive-004`: Resource-rich experimentation
- `seed-archive-005`: Hard mode challenge

## Integration

### With Game State

```typescript
// In game loop
const beat = campaignSystem.getCurrentBeat();
if (beat?.trigger === 'harvest_or_preserve') {
  // Show choice UI
  showChoiceDialog(beat.choices);
}
```

### With UI Components

```tsx
import { NarrativeEventDisplay } from '@/components/campaigns/NarrativeEventDisplay';

<NarrativeEventDisplay 
  event={narrativeEvent}
  autoDismiss={5000}
  onDismiss={() => setEvent(null)}
/>
```

## Telemetry

All LLM events are logged with:
- `promptHash`: Deterministic hash of prompt
- `modelVersion`: LLM model used
- `latencyMs`: Generation time
- `event`: Event data
- `replayId`: For judge review

## Safety & Guardrails

- Style-locked outputs (no graphic violence)
- Max flavor text length (25 words)
- Deterministic caching (same seed = same output)
- Fallback events for LLM failures
- JSON schema validation

## Future Campaigns

Additional campaigns can be added:
- Echoes of the Seed (persistent memory)
- The Merchant's Dilemma (resource ethics)
- Symbiosis or Overclock (tech choices)
- The Long Watch (character-driven)
- The Market of Echoes (procedural social)

## Judge Metrics

Tracked metrics for judges:
- Choice distribution (% harvest vs preserve)
- Average time-to-choice
- Emotional survey scores
- Unique LLM vignettes generated
- Replay rate after narrative events

