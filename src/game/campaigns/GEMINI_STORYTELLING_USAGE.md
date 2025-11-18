# Gemini Campaign Storytelling - Usage Guide

## Overview

The Gemini Campaign Storytelling system provides comprehensive AI-powered narrative generation for campaign mode using Google Gemini AI. It generates dynamic events, character dialogue, chapter summaries, epilogues, world lore, and environmental descriptions.

## Setup

### 1. Initialize the System

```typescript
import { CampaignSystem } from './CampaignSystem';
import { CampaignStorytellingIntegration } from './CampaignStorytellingIntegration';
import { GeminiCampaignStorytelling } from './GeminiCampaignStorytelling';

// Create campaign system
const campaignSystem = new CampaignSystem();

// Create storytelling integration with API key
const storytellingIntegration = new CampaignStorytellingIntegration(
  campaignSystem,
  import.meta.env.VITE_Gemini_AI_API_key // Your API key
);

// Connect storytelling to campaign system
const enhancedCampaignSystem = new CampaignSystem(
  undefined, // narrativeManager (optional)
  undefined, // emotionalBeats (optional)
  storytellingIntegration // storytelling integration
);
```

### 2. Start a Campaign

```typescript
// Start a campaign
const state = await campaignSystem.startCampaign('archive', 913027);

// Generate world lore for the campaign
const lore = await storytellingIntegration.generateCampaignLore();
console.log('Campaign Setting:', lore.setting);
console.log('History:', lore.history);
console.log('Factions:', lore.factions);
console.log('Mysteries:', lore.mysteries);
console.log('Themes:', lore.themes);
```

## Usage Examples

### Generate Narrative Events

```typescript
// Trigger a narrative event during gameplay
const event = await campaignSystem.triggerEvent('bio_seed_found');

if (event) {
  console.log('Event:', event.event);
  console.log('Flavor Text:', event.flavor);
  console.log('Effects:', event.effect);
  console.log('Narrative Tag:', event.narrativeTag);
}
```

### Generate Character Dialogue

```typescript
// Generate dialogue for a character in a specific situation
const dialogue = await storytellingIntegration.generateCharacterDialogue(
  'mara', // character ID
  'The player is about to harvest the Bio-Seed. Dr. Mara tries to stop them.'
);

console.log('Dialogue lines:', dialogue);
// Output: ["Please, wait. It remembers more than we do.", "Every extraction is a wound that never heals."]
```

### Generate Environmental Narrative

```typescript
// Generate environmental description for a location/action
const envNarrative = await storytellingIntegration.generateEnvironmentalNarrative(
  'The Archive - Deep Chamber',
  'approaching the Bio-Seed'
);

console.log(envNarrative);
// Output: "The air grows thick with ancient pollen. Bioluminescent roots pulse in rhythm with your heartbeat, casting shifting shadows across crystalline walls."
```

### Generate Chapter Summary

```typescript
// After completing an act, generate a chapter summary
const summary = await storytellingIntegration.generateChapterSummary(0); // Act 0

console.log(summary);
// Output:
// **Chapter 1: Descent**
// 
// The journey begins as you breach the archive gates...
// 
// The emotional arc builds tension as choices loom...
```

### Generate Campaign Epilogue

```typescript
// When campaign completes, generate epilogue
const epilogue = await storytellingIntegration.generateCampaignEpilogue();

console.log(epilogue);
// Output:
// # The Price of Choices
// 
// [Opening paragraph]
// 
// [Body paragraphs]
// 
// ## Character Fates
// 
// **Dr. Mara Kest**: [Fate based on player choices]
// 
// ## World State
// 
// [World state description]
// 
// ## Your Legacy
// 
// [Player legacy description]
// 
// [Closing lines]
```

## Advanced Usage

### Direct Access to Storytelling System

```typescript
// Get direct access to the storytelling system
const storytelling = new GeminiCampaignStorytelling(apiKey);

// Build custom context
const context: StorytellingContext = {
  campaignId: 'archive',
  campaignName: 'The Archive',
  actIndex: 1,
  actName: 'Consequence',
  beatIndex: 0,
  time: 240,
  seed: 913027,
  playerChoices: new Map([['harvest_or_preserve', 'harvest']]),
  narrativeTags: new Set(['greed']),
  resources: { ore: 140, energy: 40, biomass: 0, data: 10 },
  bioSeedHealth: 60,
  playerReputation: 0.25,
  characters: campaign.characters,
  previousEvents: [],
  emotionalTone: 'melancholic',
  worldState: {
    tension: 0.7,
    instability: 0.5,
    discoveredSecrets: []
  }
};

// Generate narrative event with custom context
const narrative = await storytelling.generateNarrativeEvent(context);

console.log('Event:', narrative.event);
console.log('Description:', narrative.description);
console.log('Flavor:', narrative.flavor);
console.log('Dialogue:', narrative.dialogue);
console.log('Consequences:', narrative.consequences);
```

### Caching

The system automatically caches generated content based on:
- Campaign ID
- Act index
- Beat index
- Seed value
- Character ID and situation
- Location and action

To clear cache (useful for testing):

```typescript
storytellingIntegration.clearCache();
```

## Integration with Game Loop

```typescript
// In your game loop
async function updateCampaign(deltaTime: number) {
  const state = campaignSystem.getCurrentState();
  if (!state) return;

  // Update time
  state.time += deltaTime;

  // Check for narrative triggers
  const currentBeat = campaignSystem.getCurrentBeat();
  if (currentBeat && shouldTriggerBeat(currentBeat, state)) {
    const event = await campaignSystem.triggerEvent(currentBeat.trigger);
    
    if (event) {
      // Display event to player
      displayNarrativeEvent(event);
      
      // Play character dialogue if available
      if (event.dialogue) {
        for (const dialogue of event.dialogue) {
          await playCharacterDialogue(dialogue);
        }
      }
      
      // Apply consequences
      applyNarrativeConsequences(event.effect);
    }
  }
}

function shouldTriggerBeat(beat: CampaignBeat, state: CampaignState): boolean {
  // Your trigger logic here
  // e.g., time-based, resource-based, choice-based
  return state.time >= beat.triggerTime || state.resources.ore >= 100;
}
```

## Error Handling

The system includes comprehensive fallback mechanisms:

1. **API Failures**: Falls back to pre-written narrative templates
2. **Parsing Errors**: Uses default values and logs warnings
3. **Missing Context**: Provides sensible defaults

```typescript
try {
  const event = await campaignSystem.triggerEvent('bio_seed_found');
} catch (error) {
  console.error('Narrative generation failed:', error);
  // System will use fallback automatically
}
```

## Configuration

### Temperature Settings

The storytelling system uses `temperature: 0.8` for creative narrative generation. You can adjust this:

```typescript
const storytelling = new GeminiCampaignStorytelling(apiKey);
// Temperature is set in LLMIntegration constructor
// Modify in GeminiCampaignStorytelling.ts if needed
```

### Token Limits

Default `maxTokens: 1000` for narrative generation. Adjust based on your needs:

```typescript
// In GeminiCampaignStorytelling.ts constructor
this.llm = new LLMIntegration({
  // ...
  maxTokens: 1500, // Increase for longer narratives
});
```

## Best Practices

1. **Pre-generate Lore**: Generate world lore at campaign start for consistency
2. **Cache Management**: Clear cache between different campaign runs
3. **Error Handling**: Always handle async narrative generation with try-catch
4. **Player Feedback**: Show loading states during narrative generation
5. **Fallback Content**: Ensure fallback content is engaging even if AI fails

## Project Information

- **Project Name**: quaternion
- **Project Number**: 831495637358
- **API Model**: gemini-2.0-flash-exp
- **Provider**: Google AI (Gemini)

## Troubleshooting

### API Key Issues
- Ensure `VITE_Gemini_AI_API_key` is set in environment variables
- Check that API key has proper permissions
- Verify project number matches your Google Cloud project

### Generation Failures
- Check browser console for detailed error messages
- Verify network connectivity
- Check API quota limits
- System will automatically use fallbacks

### Parsing Errors
- Ensure responses are valid JSON
- Check that prompts are generating expected format
- Review fallback content if parsing consistently fails

