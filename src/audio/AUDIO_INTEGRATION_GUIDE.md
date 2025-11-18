# Audio System Integration Guide

## Overview

Quaternion now features a comprehensive Web Audio API-based audio system with:
- **Adaptive Music**: Stems that respond to game state (intensity, morality, instability)
- **Dialogue System**: Voice lines with lip-sync viseme support
- **SFX Management**: Categorized sound effects with pitch/volume variation
- **Automatic Ducking**: Music automatically ducks when dialogue plays
- **Performance Optimized**: Efficient buffer management and preloading

## Architecture

### Core Components

1. **AudioEngine** (`AudioEngine.ts`)
   - Low-level Web Audio API wrapper
   - Handles buffer loading, playback, mixing
   - Provides ducking, crossfading, and stem management

2. **AudioManager** (`AudioManager.ts`)
   - High-level game interface
   - Provides helper methods for common audio tasks
   - Manages game state → audio state mapping

3. **AudioSystemIntegration** (`AudioSystemIntegration.ts`)
   - Integration layer for game code
   - Provides simple functions: `playSFX()`, `playUISound()`, etc.
   - Handles initialization and state updates

## Usage

### Basic Setup

The audio system is automatically initialized when the game starts:

```typescript
// Already integrated in QuaternionGame.tsx
import { initializeAudio } from '@/audio/audioInit';
initializeAudio().catch(err => console.warn('Audio init deferred:', err));
```

### Playing Sounds

```typescript
import { playSFX, playUISound, playResourceSound, playCombatSound } from '@/audio/AudioSystemIntegration';

// UI sounds
playUISound('click');
playUISound('hover');
playUISound('select');

// Resource collection
playResourceSound('ore');
playResourceSound('energy');
playResourceSound('biomass');
playResourceSound('data');

// Combat
playCombatSound('attack');
playCombatSound('hit');
playCombatSound('explosion');
```

### Adaptive Music

The music automatically adapts to game state. Just update the game state:

```typescript
import { updateGameAudio } from '@/audio/AudioSystemIntegration';

// In your game loop:
updateGameAudio({
  intensity: 0.8,      // 0 = calm, 1 = combat
  morality: -0.5,     // -1 = exploit, 1 = conserve
  instability: 120    // 0-200
});
```

The system will:
- Fade in/out stems based on intensity
- Switch harmony timbre based on morality (organic vs industrial)
- Adjust rhythm layers for combat

### Dialogue with Lip-Sync

```typescript
import { playCommanderDialogue } from '@/audio/AudioSystemIntegration';

// Play dialogue with lip-sync callback
await playCommanderDialogue('AUREN', 'The machine remembers.', (viseme, time) => {
  // Update character lip animation
  animateLips(viseme, time);
});
```

## Configuration

### Music Stems

Edit `src/audio/musicConfig.ts` to add/modify music stems:

```typescript
export const MUSIC_STEMS: MusicStem[] = [
  {
    id: 'ambient_conserve',
    url: '/assets/music/stems/ambient_conserve.mp3',
    volume: 0.6,
    loop: true
  },
  // ... more stems
];
```

### SFX Configuration

Edit `src/audio/sfxConfig.ts` to add/modify sound effects:

```typescript
export const SFX_CONFIG: Record<string, SFXConfig> = {
  ui_click: {
    path: '/assets/sfx/ui/click.wav',
    volume: 0.6,
    category: 'ui'
  },
  // ... more SFX
};
```

### Dialogue Lines

Edit `src/audio/dialogueConfig.ts` to add dialogue with viseme timing:

```typescript
export const DIALOGUE_LINES: Record<string, DialogueLine[]> = {
  AUREN: [
    {
      id: 'auren_intro',
      url: '/assets/dialogue/auren/intro.wav',
      text: 'The machine remembers.',
      speaker: 'Auren',
      visemes: [
        { time: 0.0, viseme: 'rest' },
        { time: 0.1, viseme: 'aa' },
        // ... more visemes
      ]
    }
  ]
};
```

## Asset Requirements

### Music Stems

Place music stems in `/public/assets/music/stems/`:
- `ambient_conserve.mp3` - Organic ambient bed
- `ambient_exploit.mp3` - Industrial ambient bed
- `rhythm_light.mp3` - Light percussion
- `rhythm_heavy.mp3` - Heavy percussion
- `harmony_organic.mp3` - Organic harmony pad
- `harmony_industrial.mp3` - Industrial harmony pad
- `lead_motif.mp3` - Melodic lead
- `combat_accent.mp3` - Combat accents
- `victory.mp3` - Victory cue
- `defeat.mp3` - Defeat cue

**Format**: OGG Vorbis or MP3, 48kHz, loopable

### SFX

Place SFX in `/public/assets/sfx/`:
- `ui/` - UI sounds (click, hover, select, error, success)
- `resources/` - Resource collection sounds
- `combat/` - Combat sounds (attack, hit, explosion, defense)
- `environment/` - Environmental sounds (wind, lava, creak, rumble)
- `narrative/` - Narrative/Kaiju sounds

**Format**: WAV or OGG, 48kHz, short clips (1-3s)

### Dialogue

Place dialogue in `/public/assets/dialogue/`:
- `auren/` - Auren voice lines
- `lira/` - Lira voice lines
- `virel/` - Virel voice lines
- `kor/` - Kor voice lines

**Format**: WAV, 48kHz, normalized to -16 LUFS

## Mixing Guidelines

### Volume Levels

- **Master**: 0.9 (headroom)
- **Music**: 0.7 (sits behind dialogue)
- **SFX**: 1.0 (full volume)
- **Dialogue**: 1.0 (full volume, music ducks to 0.25)

### Ducking

Music automatically ducks to 25% volume when dialogue plays, then returns to normal after dialogue ends.

### Compression

Master bus uses a compressor:
- Threshold: -24 dB
- Ratio: 12:1
- Attack: 3ms
- Release: 250ms

## Performance

### Preloading

Essential SFX are preloaded at startup:
- UI sounds
- Resource collection sounds

Remaining SFX preload in background (non-blocking).

### Buffer Management

- Buffers are cached after first load
- Unused buffers can be cleared if memory is tight
- Music stems stay loaded during gameplay

## Testing Checklist

- [ ] Music plays on game start
- [ ] Music adapts to intensity changes
- [ ] Music switches timbre based on morality
- [ ] SFX play on UI interactions
- [ ] Resource sounds play on collection
- [ ] Combat sounds play during combat
- [ ] Dialogue plays with lip-sync
- [ ] Music ducks during dialogue
- [ ] No audio clipping at peak moments
- [ ] Mobile autoplay works (requires user interaction)

## Troubleshooting

### No Audio Playing

1. Check browser autoplay policy - audio requires user interaction
2. Verify audio files exist at specified paths
3. Check browser console for loading errors
4. Ensure AudioContext is not suspended

### Music Not Adapting

1. Verify `updateGameAudio()` is called in game loop
2. Check intensity/morality values are in correct ranges
3. Verify music stems are loaded

### Dialogue Not Syncing

1. Check viseme timings in dialogue config
2. Verify viseme callback is provided
3. Check dialogue buffer loaded successfully

## Next Steps

1. Generate music stems using Fuser AI or similar
2. Record/generate dialogue with ElevenLabs
3. Create SFX using audio generators or foley
4. Add more dialogue lines with proper viseme timing
5. Fine-tune mixing levels based on testing

