# Narrative Generation System

A comprehensive narrative generation system using Google AI Studio (Gemini API) to create dynamic, commander-specific narratives for the Quaternion game.

## Overview

The narrative generation system provides:
- **Commander-specific narratives** based on AI archetypes (The Innovator, The Butcher, The Spider, etc.)
- **Battle intros** that set the scene for epic conflicts
- **Dynamic dialogue** that responds to game state
- **Strategy commentary** that reflects commander personalities
- **Victory/defeat narratives** that match commander voices

## Architecture

### Components

1. **NarrativeGenerationService** (`src/services/NarrativeGenerationService.ts`)
   - Frontend service using LLMIntegration for direct API calls
   - Caching for performance
   - Fallback narratives when API fails

2. **Backend API** (`server/src/narrative.ts`)
   - Secure endpoint for Gemini API calls
   - Keeps API keys server-side
   - `/api/narrative/generate` - General narrative generation
   - `/api/narrative/battle-intro` - Battle intro generation

3. **API Client** (`src/lib/api/narrativeApi.ts`)
   - Type-safe client for narrative endpoints
   - Convenient methods for common use cases

4. **React Hooks** (`src/hooks/useNarrativeGeneration.ts`)
   - React Query integration
   - Easy-to-use hooks for components
   - Automatic loading/error states

## Setup

### Environment Variables

**Frontend** (`.env` or `.env.local`):
```bash
VITE_GEMINI_AI_API_KEY=your_api_key_here
# OR
VITE_GOOGLE_AI_API_KEY=your_api_key_here
```

**Backend** (`server/.env`):
```bash
GEMINI_AI_API_KEY=your_api_key_here
# OR
GOOGLE_AI_API_KEY=your_api_key_here
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" or go to API Keys section
4. Create a new API key
5. Copy the key to your environment variables

## Usage

### Using the Frontend Service Directly

```typescript
import { NarrativeGenerationService } from '../services/NarrativeGenerationService';
import { AICommanderArchetypes } from '../ai/opponents/AICommanderArchetypes';

// Create service instance
const narrativeService = new NarrativeGenerationService({
  provider: 'google',
  apiKey: 'your-key', // or use env var
  temperature: 0.8,
  maxTokens: 500
});

// Create commander profile
const commander = AICommanderArchetypes.createCommander('THE_INNOVATOR', Date.now());

// Generate battle intro
const battleIntro = await narrativeService.generateBattleIntro(
  commander,
  opponentCommander,
  'desolate wasteland'
);
console.log(battleIntro.title, battleIntro.commanderIntro);

// Generate dialogue
const dialogue = await narrativeService.generateDialogue({
  commanderProfile: commander,
  gamePhase: 'mid',
  gameState: {
    militaryAdvantage: 0.5,
    resourceAdvantage: -0.2
  }
});
console.log(dialogue.text);
```

### Using React Hooks

```tsx
import { useBattleIntro, useDialogueGeneration } from '../hooks/useNarrativeGeneration';
import { AICommanderArchetypes } from '../ai/opponents/AICommanderArchetypes';

function MyComponent() {
  const battleIntroMutation = useBattleIntro();
  const dialogueMutation = useDialogueGeneration();

  const handleGenerate = async () => {
    const commander = AICommanderArchetypes.createCommander('THE_BUTCHER', Date.now());
    const opponent = AICommanderArchetypes.createCommander('THE_SPIDER', Date.now() + 1);

    // Generate battle intro
    const intro = await battleIntroMutation.mutateAsync({
      commanderProfile: commander,
      opponentProfile: opponent,
      mapTheme: 'volcanic wasteland'
    });

    // Generate dialogue
    const dialogue = await dialogueMutation.mutateAsync({
      commanderProfile: commander,
      context: {
        gamePhase: 'early',
        gameState: { unitCount: 10 }
      }
    });

    console.log(intro, dialogue);
  };

  return (
    <button onClick={handleGenerate} disabled={battleIntroMutation.isPending}>
      {battleIntroMutation.isPending ? 'Generating...' : 'Generate Narrative'}
    </button>
  );
}
```

### Using the API Client

```typescript
import { narrativeApi } from '../lib/api/narrativeApi';
import { AICommanderArchetypes } from '../ai/opponents/AICommanderArchetypes';

const commander = AICommanderArchetypes.createCommander('THE_MIRROR', Date.now());

// Generate battle intro via API
const battleIntro = await narrativeApi.generateBattleIntro({
  commanderProfile: commander,
  opponentProfile: opponent,
  mapTheme: 'ancient ruins'
});

// Generate dialogue via API
const dialogue = await narrativeApi.generateDialogue(commander, {
  gamePhase: 'late',
  gameState: { militaryAdvantage: 0.8 }
});

// Generate taunt
const taunt = await narrativeApi.generateTaunt(commander, {
  gameState: { militaryAdvantage: 0.7 }
});
```

## Commander Archetypes

The system works with all commander archetypes:

- **THE_INNOVATOR** - Calm, analytical, favors tech rushes
- **THE_BUTCHER** - Aggressive, intense, constant attacks
- **THE_SPIDER** - Patient, calculating, methodical expansion
- **THE_MIRROR** - Adaptive, mocking, copies player strategies
- **THE_TACTICIAN** - Analytical, strategic, balanced approach
- **THE_ECONOMIST** - Calm, economic focus, late game power
- **THE_WILDCARD** - Chaotic, unpredictable, erratic

Each archetype generates narratives that match their personality, voice tone, and speech patterns.

## Narrative Types

1. **intro** - Battle introductions
2. **dialogue** - Situational dialogue
3. **event** - Game event narratives
4. **victory** - Victory declarations
5. **defeat** - Defeat acknowledgments
6. **taunt** - Taunts based on advantage
7. **strategy_comment** - Strategic commentary

## Caching

The frontend service includes intelligent caching:
- Cache duration: 5 minutes
- Cache key based on commander archetype, context, and narrative type
- Automatic cache expiry

## Error Handling

The system includes robust error handling:
- Fallback narratives when API fails
- Graceful degradation
- Detailed error logging
- User-friendly error messages

## Example Component

See `src/components/NarrativeExample.tsx` for a complete example component demonstrating all features.

## API Endpoints

### POST `/api/narrative/generate`

Generate a narrative based on commander profile and context.

**Request:**
```json
{
  "commanderProfile": { /* CommanderProfile */ },
  "context": { /* NarrativeContext (optional) */ },
  "narrativeType": "dialogue",
  "options": {
    "model": "gemini-2.0-flash-exp",
    "temperature": 0.8,
    "maxTokens": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "narrative": {
    "type": "dialogue",
    "text": "Our forces are strong. Press the advantage.",
    "tone": "aggressive_intense",
    "timing": "mid_game"
  },
  "metadata": {
    "archetype": "THE_BUTCHER",
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/narrative/battle-intro`

Generate a battle intro for two commanders.

**Request:**
```json
{
  "commanderProfile": { /* CommanderProfile */ },
  "opponentProfile": { /* CommanderProfile */ },
  "mapTheme": "desolate wasteland"
}
```

**Response:**
```json
{
  "success": true,
  "battleIntro": {
    "title": "Innovation vs Aggression",
    "description": "Two legendary commanders prepare for battle...",
    "commanderIntro": "Innovation is the key to victory.",
    "battlefieldDescription": "The desolate wasteland awaits..."
  }
}
```

## Best Practices

1. **Use backend endpoint** for production (keeps API keys secure)
2. **Cache results** when possible to reduce API calls
3. **Provide context** for better narrative quality
4. **Handle errors gracefully** with fallback narratives
5. **Monitor API usage** to avoid rate limits

## Troubleshooting

### API Key Not Found
- Ensure environment variables are set correctly
- Check `.env` file is in the correct location
- Restart dev server after adding env vars

### Rate Limits
- The system includes caching to reduce API calls
- Consider implementing request queuing for high volume
- Monitor Google AI Studio dashboard for usage

### Generation Failures
- Check API key is valid and has quota
- Verify network connectivity
- Check console for detailed error messages
- Fallback narratives will be used automatically

## Future Enhancements

- Multi-turn conversation generation
- Narrative branching based on player choices
- Voice synthesis integration
- Narrative analytics and optimization
- Support for additional LLM providers

