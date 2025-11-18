# AI Integration System - Quaternion

This directory contains the comprehensive AI integration system for Quaternion, designed for the Chroma Awards competition.

## Overview

The AI system integrates multiple AI tools to enhance gameplay:
- **LLM Integration** (Google AI Pro, Saga AI): Strategic content generation
- **ElevenLabs**: Voice narration and commander dialogue
- **Fuser**: Adaptive music generation
- **Procedural Generation**: AI-enhanced map generation
- **Commander AI**: Personality-driven opponent behavior
- **Dynamic Events**: Procedurally-generated world events

## Architecture

```
AIIntegrationManager (Central Coordinator)
├── LLMIntegration (Google AI Pro / Saga AI)
│   ├── Map Theme Generation
│   ├── Event Narratives
│   ├── Commander Personalities
│   └── Battle Intros
├── ElevenLabsIntegration
│   ├── Battle Narration
│   ├── Commander Dialogue
│   └── Voice Profiles
├── MusicIntegration (Fuser)
│   ├── Adaptive Music Stems
│   └── Dynamic Layering
├── ProceduralGenerationSystem
│   ├── AI-Enhanced Map Generation
│   └── Strategic Feature Placement
├── EnhancedCommanderSystem
│   ├── Personality-Driven Behavior Trees
│   └── Adaptive Strategy
└── DynamicEventSystem
    ├── Procedural Events
    └── AI-Generated Narratives
```

## Quick Start

### 1. Initialize AI Manager

```typescript
import { createDefaultAIManager } from './ai/AIIntegrationManager';

const aiManager = createDefaultAIManager();
```

### 2. Generate Procedural Map

```typescript
const mapResult = await aiManager.generateMap(
  12345,  // seed
  40,     // width
  30,     // height
  'crystalline_plains' // map type
);

console.log('Map theme:', mapResult.theme.description);
console.log('Strategic personality:', mapResult.metadata.strategicPersonality);
```

### 3. Create AI Commander

```typescript
const commander = await aiManager.createCommander(
  'the_architect', // archetype
  12345,           // seed
  'hard'           // difficulty
);

console.log('Commander:', commander.personality.name);
console.log('Traits:', commander.personality.traits);
```

### 4. Generate Battle Narration

```typescript
const intro = await aiManager.generateBattleIntro(
  mapResult.theme.description,
  'The Architect',
  'The Aggressor'
);

// Play audio if available
if (intro.audioUrl) {
  const audio = new Audio(intro.audioUrl);
  audio.play();
}
```

### 5. Update Dynamic Events

```typescript
// In game loop
const events = await aiManager.updateEvents(gameState, mapResult.theme.description);

events.forEach(event => {
  console.log('Event:', event.narrative.text);
  if (event.audioUrl) {
    // Play event narration
    new Audio(event.audioUrl).play();
  }
  // Apply event effects
  aiManager.eventSystem?.applyEventEffects(event, gameState);
});
```

### 6. Update Adaptive Music

```typescript
// Calculate tension/intensity from game state
const tension = calculateTension(gameState);
const intensity = calculateIntensity(gameState);
const mood = determineMood(gameState);

aiManager.updateMusic({ tension, intensity, mood });
```

### 7. Logging for Judges

```typescript
// Start match
const matchId = aiManager.startMatch(
  mapResult.map.seed,
  mapResult.theme.description,
  ['The Architect', 'The Aggressor']
);

// During match
aiManager.dataLogger.logPlayerAction();
aiManager.dataLogger.logAIDecision();

// End match
const matchLog = aiManager.endMatch(playerWon, durationSeconds);

// Export for judges
aiManager.downloadMatchLog('chroma_awards_match.json');
```

## Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# LLM Provider (google, saga, or openai)
LLM_PROVIDER=google

# Google AI Pro API Key
GOOGLE_AI_API_KEY=your_key_here

# Saga AI API Key (alternative)
SAGA_AI_API_KEY=your_key_here

# ElevenLabs API Key
ELEVENLABS_API_KEY=your_key_here

# Fuser API Key
FUSER_API_KEY=your_key_here
```

### Custom Configuration

```typescript
import { AIIntegrationManager } from './ai/AIIntegrationManager';

const aiManager = new AIIntegrationManager({
  llm: {
    provider: 'google',
    apiKey: 'your_key'
  },
  elevenLabs: {
    apiKey: 'your_key'
  },
  music: {
    provider: 'fuser',
    apiKey: 'your_key'
  },
  enabled: {
    proceduralGeneration: true,
    commanderAI: true,
    voiceNarration: true,
    adaptiveMusic: true,
    dynamicEvents: true
  }
});
```

## Integration with Existing Game

### In QuaternionGame.tsx

```typescript
import { createDefaultAIManager } from './ai/AIIntegrationManager';

// Initialize in component
const [aiManager] = useState(() => createDefaultAIManager());

// Generate map on game start
useEffect(() => {
  const initializeGame = async () => {
    const mapResult = await aiManager.generateMap(
      gameSeed,
      mapConfig.width,
      mapConfig.height,
      mapConfig.type
    );

    // Use mapResult.map for game map
    // Use mapResult.theme for narration
  };

  initializeGame();
}, [gameSeed]);

// Update events in game loop
useEffect(() => {
  const interval = setInterval(async () => {
    const events = await aiManager.updateEvents(gameState, mapTheme);
    // Handle events
  }, 5000); // Every 5 seconds

  return () => clearInterval(interval);
}, [gameState]);
```

## API Reference

### AIIntegrationManager

- `generateMap(seed, width, height, mapType)`: Generate procedural map
- `createCommander(archetype, seed, difficulty)`: Create AI commander
- `generateBattleNarration(text, voiceType, commanderName)`: Generate voice
- `generateBattleIntro(mapTheme, commander1, commander2)`: Generate intro
- `updateEvents(gameState, mapTheme)`: Update dynamic events
- `updateMusic(state)`: Update adaptive music
- `startMatch(seed, mapTheme, commanders)`: Start match logging
- `endMatch(playerWin, durationSeconds)`: End match logging
- `getMatchLog()`: Get current match log
- `exportMatchLog()`: Export log as JSON
- `downloadMatchLog(filename)`: Download log file
- `getAIStats()`: Get AI usage statistics

## Chroma Awards Features

### Judge Transparency

All AI calls are logged with:
- Timestamp
- System used
- Input/output
- Latency
- Success/failure

Match logs include:
- All AI-generated content
- Event history
- Commander personalities
- Map themes

### AI Tools Used

- **ElevenLabs**: Voice narration and commander dialogue
- **Google AI Pro (Gemini)**: Strategic content generation
- **Saga AI**: Narrative generation
- **Fuser**: Adaptive music
- **Luma AI**: 3D terrain generation (integration points ready)

### Fallback Systems

All AI systems have deterministic fallbacks:
- If LLM fails → Use handcrafted templates
- If ElevenLabs fails → Use text-only narration
- If music fails → Use placeholder audio
- If generation fails → Use validated default content

## Performance Optimization

### Caching

- Map themes are cached by seed
- Commander personalities are cached by archetype
- Voice lines are cached by text
- Music stems are pre-generated

### Rate Limiting

- LLM calls: Max 1 per 5 seconds
- ElevenLabs: Pre-generate at game start
- Music: Pre-generate stems, layer dynamically

### Lazy Loading

- AI systems initialize on first use
- Assets load in background
- Fallbacks available immediately

## Testing

### Without API Keys

All systems work with fallbacks when API keys are not configured:

```typescript
// Works without API keys - uses fallbacks
const aiManager = createDefaultAIManager();
const map = await aiManager.generateMap(12345, 40, 30, 'crystalline_plains');
```

### With API Keys

Set environment variables to enable full AI features.

## Troubleshooting

### API Errors

- Check API keys are set correctly
- Verify API quotas/limits
- Check network connectivity
- Review error logs in DataLogger

### Performance Issues

- Enable caching (default)
- Pre-generate content at game start
- Use fallbacks for non-critical features
- Monitor AI stats with `getAIStats()`

### Missing Features

- Check `enabled` flags in config
- Verify API keys are set
- Check browser console for errors
- Review integration points in game code

## Next Steps

1. **Set up API keys** from Chroma Awards sponsors
2. **Integrate into game loop** (see example above)
3. **Pre-generate assets** at game start
4. **Test with fallbacks** first, then enable AI
5. **Export match logs** for judge review

## Support

For issues or questions:
- Check DataLogger for error details
- Review AI stats with `getAIStats()`
- Test with fallbacks first
- Check browser console for errors


