# Campaign System Implementation

## Overview

The Quaternion campaign system integrates rich narrative storytelling with strategic gameplay, using LLM-generated events, voice lines, and player choices to create meaningful emotional experiences.

## What Was Implemented

### 1. Core Campaign System (`src/game/campaigns/`)

- **CampaignSystem.ts**: Main campaign manager with 3-act structure, choice tracking, and state management
- **NarrativeEventSystem.ts**: LLM integration for generating dynamic narrative events
- **VoiceLineManager.ts**: SSML voice line management with TTS integration
- **CampaignSeedManager.ts**: Pre-baked seed management for judge demos
- **EpilogueData.ts**: Pre-written and dynamic epilogue generation

### 2. LLM Prompt Templates (`src/ai/promptTemplates.js`)

- **NARRATIVE_MICRO_EVENT**: Generates compact narrative events (≤25 words)
- **EPILOGUE_GENERATOR**: Creates campaign ending epilogues (25-40 words)
- **CHARACTER_DIALOGUE**: Generates character dialogue (≤20 words)
- **FACTION_EDICT**: Produces faction doctrine based on reputation

### 3. UI Components (`src/components/campaigns/`)

- **CampaignSelector.tsx**: Campaign selection interface
- **NarrativeEventDisplay.tsx**: HUD display for narrative events
- **EpilogueDisplay.tsx**: Campaign ending epilogue screen

### 4. Data Files (`src/fixtures/`)

- **campaign_seeds.json**: 5 pre-baked seeds for The Archive campaign
- **narrative_examples.json**: 12 example narrative events with outputs

## Campaign: The Archive

### Structure

**Act I - Descent (0-3 minutes)**
- Breach the archive gate
- Discover the Bio-Seed
- Initial resource assessment

**Act II - Consequence (3-8 minutes)**
- **Choice Point**: Harvest Now vs Preserve
  - Harvest: +60 resources, -25 bio-seed health, guilt tag
  - Preserve: +12 bio-seed health, +20% long-term yield, hope tag
- Face environmental consequences
- NPC reactions (Dr. Mara, Commander Lian)

**Act III - Reckoning (8-12 minutes)**
- Final outcome based on choices
- Epilogue generation
- Scoreboard with ecological state

### Characters

- **Dr. Mara Kest**: Biologist, ethical, pleading voice
- **Commander Lian**: Pragmatic commander, authoritative voice
- **Patch**: Wry drone, humorous voice

### Voice Lines

6 SSML-ready voice lines:
- Lian: "Hold the chokepoint — buy us time."
- Lian: "We move when I say we move."
- Mara: "Please — listen. It remembers more than we do."
- Mara: "There must be another way."
- Patch: "Alarms: loud. Morale: quieter than you, commander."
- Patch: "Scanning... nothing helpful. Sending passive judgement."

### Epilogues

3 pre-written epilogues:
- **Overclock-only**: Somber tone, exploitation consequences
- **BioConserve-only**: Hopeful tone, conservation benefits
- **Mixed**: Balanced tone, redemption arc

## LLM Integration

### Prompt Structure

All prompts follow this pattern:
```
SYSTEM: [Role and constraints]
INPUT: [Game state JSON]
OUTPUT: [JSON schema]
```

### Safety Features

- Style-locked outputs (no graphic content)
- Max word limits enforced
- JSON schema validation
- Deterministic caching (same seed = same output)
- Fallback events for failures

### Example LLM Call

```typescript
const event = await narrativeSystem.generateEvent({
  campaign: 'archive',
  trigger: 'harvest_attempt',
  seed: 913027,
  bioSeedHealth: 85,
  playerResources: 80
});

// Returns:
{
  event: "Bio-Seed Stir",
  flavor: "A low hum rises beneath your boots; the ground answers your greed.",
  effect: { wildlifeAggression: 0.15, localYieldBoost: 0.30 },
  narrativeTag: "unease"
}
```

## Judge Demo Seeds

5 pre-baked seeds for consistent judge experiences:

1. **seed-archive-001**: Ethical choice demo (10-12 min)
2. **seed-archive-002**: High pressure tradeoff
3. **seed-archive-003**: Environmental event trigger
4. **seed-archive-004**: Resource-rich experimentation
5. **seed-archive-005**: Hard mode challenge

## Integration Points

### With Game State

```typescript
// In QuaternionGameState
const campaignSystem = new CampaignSystem();
const state = campaignSystem.startCampaign('archive', seed);

// Check for triggers
const beat = campaignSystem.getCurrentBeat();
if (beat?.trigger === 'harvest_or_preserve') {
  // Show choice UI
}
```

### With UI

```tsx
// In game component
<NarrativeEventDisplay 
  event={narrativeEvent}
  autoDismiss={5000}
/>
```

### With TTS

```typescript
const voiceManager = new VoiceLineManager();
await voiceManager.playVoiceLine('mara_warning');
```

## Telemetry & Judge Metrics

Tracked for judges:
- Choice distribution (% harvest vs preserve)
- Average time-to-choice
- Emotional survey scores
- Unique LLM vignettes generated
- Replay rate after narrative events
- Prompt hash for reproducibility

## Future Campaigns

Ready to implement:
- **Echoes of the Seed**: Persistent faction memory across runs
- **The Merchant's Dilemma**: Resource allocation ethics
- **Symbiosis or Overclock**: Tech tree moral choices
- **The Long Watch**: Character-driven endurance campaign
- **The Market of Echoes**: Procedural social trading

## Usage Example

```typescript
// 1. Initialize systems
const campaignSystem = new CampaignSystem();
const narrativeSystem = new NarrativeEventSystem({ provider: 'google' });
const voiceManager = new VoiceLineManager();

// 2. Start campaign
const state = campaignSystem.startCampaign('archive', 913027);

// 3. Trigger event
const event = await narrativeSystem.generateEvent({
  campaign: 'archive',
  trigger: 'harvest_attempt',
  seed: state.seed,
  bioSeedHealth: state.bioSeedHealth
});

// 4. Play voice line
await voiceManager.playVoiceLine('mara_warning');

// 5. Show event in UI
showNarrativeEvent(event);

// 6. Player makes choice
campaignSystem.makeChoice('harvest_or_preserve', 'harvest');

// 7. Generate epilogue
const epilogue = await narrativeSystem.generateEpilogue(
  'archive',
  campaignSystem.getCurrentState()!.choices,
  campaignSystem.getCurrentState()!
);
```

## Files Created

- `src/game/campaigns/CampaignSystem.ts`
- `src/game/campaigns/NarrativeEventSystem.ts`
- `src/game/campaigns/VoiceLineManager.ts`
- `src/game/campaigns/CampaignSeedManager.ts`
- `src/game/campaigns/EpilogueData.ts`
- `src/game/campaigns/index.ts`
- `src/components/campaigns/CampaignSelector.tsx`
- `src/components/campaigns/NarrativeEventDisplay.tsx`
- `src/components/campaigns/EpilogueDisplay.tsx`
- `src/fixtures/campaign_seeds.json`
- `src/fixtures/narrative_examples.json`
- `src/ai/promptTemplates.js` (updated)

## Next Steps

1. Integrate with Lobby UI to show campaign selection
2. Connect to game loop for trigger detection
3. Add more campaigns (Echoes, Merchant, etc.)
4. Implement persistent memory system for multi-run campaigns
5. Add telemetry logging for judge metrics

