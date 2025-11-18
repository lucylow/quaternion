# 🎙️ ElevenLabs Audio Integration Guide

## Overview

ElevenLabs audio features are now fully integrated into Quaternion, providing voice narration, commander dialogue, advisor voices, and dynamic audio for all game events.

## ✅ What's Integrated

### 1. **ElevenLabsAudioIntegration** (`src/audio/ElevenLabsAudioIntegration.ts`)

Core audio integration system that:
- Manages voice queue with priority system
- Handles voice profiles for different characters
- Integrates with accessibility system for subtitles
- Provides volume control and mute functionality
- Pre-generates voice lines for performance

### 2. **GameAudioIntegration** (`src/audio/GameAudioIntegration.ts`)

Game-specific audio integration that:
- Connects to game events
- Handles narrative events, commander dialogue, advisor voices
- Manages terrain events, victory/defeat narration
- Dispatches custom events for game integration

### 3. **React Hook** (`src/hooks/useGameAudio.ts`)

Easy-to-use React hook for components:
- Simple API for playing voice lines
- Status tracking (isPlaying, queueLength)
- Volume and mute controls

## 🎮 Usage Examples

### Basic Usage

```typescript
import { GameAudioIntegration } from '@/audio';

// Initialize
const audioIntegration = new GameAudioIntegration();

// Play narrator line
await audioIntegration.playNarrativeEvent('Welcome to Quaternion');

// Play commander dialogue
await audioIntegration.playCommanderDialogue(
  'The enemy approaches from the north!',
  'commander_theta'
);

// Play advisor voice
await audioIntegration.playAdvisorVoice(
  'Biomass levels are critical!',
  'biologist'
);
```

### React Component Usage

```typescript
import { useGameAudio } from '@/hooks/useGameAudio';

function GameComponent() {
  const {
    playNarrativeEvent,
    playCommanderDialogue,
    playAdvisorVoice,
    isPlaying,
    queueLength,
    setVolume,
    toggleMute
  } = useGameAudio();

  const handleGameStart = async () => {
    await playNarrativeEvent('The battle begins...');
  };

  return (
    <div>
      <button onClick={handleGameStart}>Start Game</button>
      {isPlaying && <p>Playing audio...</p>}
      {queueLength > 0 && <p>Queue: {queueLength}</p>}
      <button onClick={toggleMute}>Mute</button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        onChange={(e) => setVolume(parseFloat(e.target.value))}
      />
    </div>
  );
}
```

### Game Event Integration

```typescript
// Dispatch game events for automatic voice playback
import { GameAudioIntegration } from '@/audio';

const audioIntegration = new GameAudioIntegration();

// Narrative event
audioIntegration.dispatchGameEvent(
  'narrative',
  'The Chroma Cataclysm reshaped the world...'
);

// Commander dialogue
audioIntegration.dispatchGameEvent(
  'commander',
  'Attack the enemy base!',
  { commanderName: 'commander_theta' }
);

// Advisor voice
audioIntegration.dispatchGameEvent(
  'advisor',
  'Resource levels are low!',
  { advisorType: 'economist' }
);

// Terrain event
audioIntegration.dispatchGameEvent(
  'terrain',
  'The lava vents are erupting!'
);

// Victory/Defeat
audioIntegration.dispatchGameEvent(
  'victory',
  'Victory is yours!'
);
```

### Integration with Narrative System

```typescript
import { EnhancedNarrativeSystem } from '@/game/narrative';
import { GameAudioIntegration } from '@/audio';

// Initialize narrative system
const narrativeSystem = new EnhancedNarrativeSystem({
  llm: { provider: 'google', apiKey: process.env.GOOGLE_AI_API_KEY },
  elevenLabs: { apiKey: process.env.ElevenLabs_API_key },
  music: { provider: 'fuser', apiKey: process.env.FUSER_API_KEY }
});

// Initialize audio integration with narrative system
const audioIntegration = new GameAudioIntegration(narrativeSystem);

// Play narrative events
const events = await narrativeSystem.initializeGameNarrative(
  'lava_nexus',
  12345,
  'quaternion'
);

// Audio will automatically play when narrative events are triggered
for (const event of events) {
  await narrativeSystem.playNarrativeEvent(event);
  // Voice will automatically play via audio integration
}
```

## 🎯 Voice Profiles

### Available Voice Profiles

- **narrator**: Rachel (21m00Tcm4TlvDq8ikWAM) - Clear, professional
- **economist**: Bella (EXAVITQu4vr4xnSDxMaL) - Analytical, methodical
- **biologist**: Dorothy (ThT5KcBeYPX3keUQqHPh) - Calm, empathetic
- **ascendant**: Arnold (VR6AewLTigWG4xSOukaG) - Aggressive, energetic
- **engineer**: Adam (pNInz6obpgDQGcFmaJgB) - Precise, technical

### Faction Voices

- **quaternion**: Dorothy (calm, healing)
- **corp**: Arnold (aggressive, corporate)
- **remnants**: Bella (mysterious, adaptive)
- **ascendants**: Adam (transcendent, technical)

### Registering Custom Voices

```typescript
const audioIntegration = new ElevenLabsAudioIntegration();

audioIntegration.registerVoiceProfile(
  'custom_commander',
  'your_elevenlabs_voice_id'
);
```

## 🔊 Audio Controls

### Volume Control

```typescript
// Set volume (0.0 to 1.0)
audioIntegration.setVolume(0.8);

// Toggle mute
audioIntegration.toggleMute();
```

### Queue Management

```typescript
// Stop current voice
audioIntegration.stopCurrentVoice();

// Clear entire queue
audioIntegration.clearQueue();

// Check status
const isPlaying = audioIntegration.isPlaying();
const queueLength = audioIntegration.getQueueLength();
```

## 📝 Priority System

Voice events have three priority levels:

- **high**: Interrupts current playback (commander dialogue, critical events)
- **medium**: Queued normally (narrative events, advisor voices)
- **low**: Queued last (terrain events, ambient narration)

```typescript
await audioIntegration.playVoiceLine(
  'Critical alert!',
  'narrator',
  { priority: 'high' }
);
```

## 🎨 Integration Points

### Game Loop Integration

```typescript
// In your game loop
gameLoop.on('narrative_event', async (event) => {
  await audioIntegration.playNarrativeEvent(event.text);
});

gameLoop.on('commander_speak', async (dialogue) => {
  await audioIntegration.playCommanderDialogue(
    dialogue.text,
    dialogue.commanderName
  );
});

gameLoop.on('terrain_event', async (event) => {
  await audioIntegration.playTerrainEvent(event.description);
});
```

### UI Integration

```typescript
// Audio settings component
function AudioSettings() {
  const { setVolume, toggleMute, isPlaying } = useGameAudio();

  return (
    <div>
      <label>
        Volume:
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
      </label>
      <button onClick={toggleMute}>
        {isPlaying ? 'Mute' : 'Unmute'}
      </button>
    </div>
  );
}
```

## 🚀 Performance Optimization

### Pre-generating Voice Lines

```typescript
// Pre-generate common voice lines for better performance
await audioIntegration.pregenerateVoiceLines([
  { text: 'Welcome to Quaternion', voiceProfile: 'narrator' },
  { text: 'Victory is yours!', voiceProfile: 'narrator' },
  { text: 'Defeat...', voiceProfile: 'narrator' }
]);
```

## 🔧 Configuration

### Environment Variables

The integration automatically uses the Lovable cloud secret:
- `ElevenLabs_API_key` - Your ElevenLabs API key

### Voice Settings

Default voice settings:
- **Stability**: 0.6 (balanced)
- **Similarity Boost**: 0.75 (high quality)
- **Style**: 0.0 (neutral)
- **Speaker Boost**: true (enhanced clarity)

## 📊 Status Tracking

```typescript
const audioIntegration = new ElevenLabsAudioIntegration();

// Check if currently playing
const isPlaying = audioIntegration.isPlaying();

// Get queue length
const queueLength = audioIntegration.getQueueLength();
```

## 🎯 Best Practices

1. **Use Priority System**: Use 'high' priority for critical events, 'low' for ambient narration
2. **Pre-generate Common Lines**: Pre-generate frequently used voice lines
3. **Handle Errors**: Always provide error handlers for voice playback
4. **Respect User Preferences**: Check accessibility settings before playing audio
5. **Queue Management**: Clear queue when transitioning between game states

## 🐛 Troubleshooting

### Audio Not Playing

1. Check API key: Ensure `ElevenLabs_API_key` is set in Lovable cloud secrets
2. Check browser permissions: Ensure audio autoplay is allowed
3. Check console: Look for error messages
4. Check network: Ensure API calls are successful

### Subtitles Not Showing

1. Check accessibility settings: Ensure subtitles are enabled
2. Check subtitle config: Verify subtitle configuration

### Queue Not Processing

1. Check priority: Ensure high-priority items can interrupt
2. Check errors: Look for failed voice generation
3. Check queue: Verify items are being added correctly

---

**Status**: ✅ Fully integrated and ready to use

**API Key**: Uses `ElevenLabs_API_key` from Lovable cloud secrets

