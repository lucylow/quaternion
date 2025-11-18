# 🎧 Audio & Dialog System

## Overview

Comprehensive audio system for Quaternion featuring advisor dialog, adaptive music, voice effects, and TTS integration. The system creates an immersive audio experience that responds dynamically to game state.

## 🎭 Advisor Personalities

### Auren - The Architect (Matter)
- **Tone**: Blunt, efficient, slightly metallic cadence
- **Voice Effect**: Metallic echo (80ms delay, 30% feedback)
- **Style**: Engineer + General
- **Example**: "Deploy nodes. Build fast. Perfection favors the prepared."

### Virel - The Keeper (Energy)
- **Tone**: Passionate, volatile, quicker pacing
- **Voice Effect**: Slight distortion/saturation during intensity
- **Style**: Dynamic, emotional, voice cracks when angry
- **Example**: "Energy flows through the field — harness it before it consumes you."

### Lira - The Voice (Life)
- **Tone**: Warm, empathetic, breathy
- **Voice Effect**: Low-pass filter (6kHz) + gentle reverb
- **Style**: Soft but firm, like wind through leaves
- **Example**: "Tread gently. Life remembers every footprint."

### Kor - The Seer (Knowledge)
- **Tone**: Clipped, analytical, monotone
- **Voice Effect**: Vocoder/bitcrush + slight echo
- **Style**: Speaks in probabilities
- **Example**: "Probability favors action. Run the calculus and proceed."

### Core - The Meta-AI
- **Tone**: Layered/blended voice, slow, resonant
- **Voice Effect**: Longer echo (150ms) + more reverb (40%)
- **Style**: Reflective, omniscient gravitas
- **Example**: "Four vectors converge. One choice becomes destiny."

## 🎯 Dialog Events

The system supports these dialog triggers:

- `game_start` - Mission begins
- `mission_brief` - New objective
- `enemy_spotted` - Contact detected
- `resource_low` - Resources critical
- `resource_secured` - Resources acquired
- `unit_under_attack` - Unit taking damage
- `unit_killed` - Unit destroyed
- `ultimate_ready` - Ultimate ability available
- `ultimate_fired` - Ultimate ability used
- `tech_complete` - Research finished
- `environmental_hazard` - Lava quake, storm, etc.
- `health_critical` - Commander health low
- `victory` - Mission success
- `defeat` - Mission failure
- `flavor_ambient` - Random flavor lines
- `taunt` - Opponent taunts

## 🚀 Usage

### Basic Setup

```typescript
import { AdvisorDialogSystem, DialogEventManager, AdaptiveMusicSystem } from '@/audio';
import AudioManager from '@/audio/AudioManager';

// Initialize audio
await AudioManager.instance().init();

// Create dialog system
const dialogSystem = new AdvisorDialogSystem({
  enableTTS: true,
  enableSubtitles: true,
  voiceDucking: true,
  cacheAudio: true
});

// Create event manager
const eventManager = new DialogEventManager(dialogSystem);

// Create adaptive music
const musicSystem = new AdaptiveMusicSystem();
await musicSystem.initializeStems([
  { id: 'ambient', url: '/audio/music/ambient.ogg' },
  { id: 'tension', url: '/audio/music/tension.ogg' },
  { id: 'rhythm', url: '/audio/music/rhythm.ogg' },
  { id: 'triumph', url: '/audio/music/triumph.ogg' }
]);
```

### Playing Dialog

```typescript
// Play dialog for an event
await dialogSystem.playDialogForEvent('enemy_spotted', 'Auren');

// Play specific line
await dialogSystem.playDialogLine('auren_enemy_spotted');

// Queue event (with cooldown management)
eventManager.queueEvent({ type: 'resource_low' });
```

### Event Integration

```typescript
// Game start
eventManager.onGameStart();

// Victory sequence
eventManager.onVictory(); // Plays all advisor victory lines + Core

// Enemy spotted
eventManager.onEnemySpotted({ x: 100, y: 200 });

// Unit killed
eventManager.onUnitKilled();

// Ultimate ready
eventManager.onUltimateReady('Virel');
```

### Adaptive Music

```typescript
// Update music from game state
musicSystem.updateFromGameState(gameState);

// Trigger dramatic shift
musicSystem.triggerDramaticShift(0.8, 2000); // High entropy, 2s transition

// Get current state
const state = musicSystem.getCurrentState();
console.log(`Entropy: ${state.entropy}, Tension: ${state.tension}`);
```

## 🎵 Music System

### Stem-Based Architecture

The music system uses four stems that crossfade based on game state:

- **Ambient**: Calm, background atmosphere
- **Tension**: Builds during chaos/imbalance
- **Rhythm**: Increases with player control
- **Triumph**: Plays during high control/victory

### State-Based Mixing

Music automatically adjusts based on:

- **Entropy**: Chaos level (0-1) - higher = more tension
- **Control**: Player control percentage (0-1) - higher = more rhythm/triumph
- **Tension**: Overall tension (0-1)
- **Faction Balance**: Quaternion (0) vs Corp (1) - affects tone

### Example Music States

```typescript
// Calm state (balanced)
{
  ambient: 0.8,
  tension: 0.1,
  rhythm: 0.5,
  triumph: 0.1
}

// Chaos state (imbalanced)
{
  ambient: 0.2,
  tension: 0.8,
  rhythm: 0.3,
  triumph: 0.1
}

// Victory state (high control)
{
  ambient: 0.4,
  tension: 0.2,
  rhythm: 0.8,
  triumph: 0.6
}
```

## 🎤 Voice Effects

### Advisor-Specific Processing

Each advisor has unique audio processing:

- **Auren**: Metallic echo (80ms, 30% feedback)
- **Virel**: Distortion during intensity
- **Lira**: Low-pass filter (6kHz) + reverb
- **Kor**: Bitcrush + echo (vocoder effect)
- **Core**: Layered echo (150ms, 40% feedback)

### Emotion Mapping

Voice filters adapt to emotion:

- **Calm**: Soft echo, minimal distortion
- **Hopeful**: Brighter tone, moderate reverb
- **Angry**: Distortion, faster echo
- **Melancholy**: Long echo, low-pass
- **Neutral**: Balanced processing

## 📝 SSML Support

Dialog lines include SSML for prosody control:

```xml
<speak>
  <voice name="Virel">
    <prosody rate="fast" pitch="+1st">
      Reactor spike imminent — <break time="200ms"/>
      vent power or be consumed.
    </prosody>
  </voice>
</speak>
```

SSML features:
- `<prosody>` - Rate, pitch, volume
- `<break>` - Pauses
- `<emphasis>` - Stress levels
- `<voice>` - Voice selection

## 🎬 Integration Example

```typescript
import { AdvisorDialogSystem, DialogEventManager, AdaptiveMusicSystem } from '@/audio';
import type { QuaternionState } from '@/game/strategic/QuaternionState';

class GameScene {
  private dialogSystem: AdvisorDialogSystem;
  private eventManager: DialogEventManager;
  private musicSystem: AdaptiveMusicSystem;

  async create() {
    // Initialize systems
    this.dialogSystem = new AdvisorDialogSystem();
    this.eventManager = new DialogEventManager(this.dialogSystem);
    this.musicSystem = new AdaptiveMusicSystem();
    
    // Pre-generate common lines
    await this.dialogSystem.pregenerateAll();
    
    // Start music
    await this.musicSystem.initializeStems([...]);
    
    // Game start
    this.eventManager.onGameStart();
  }

  update(deltaTime: number, gameState: QuaternionState) {
    // Update music from game state
    this.musicSystem.updateFromGameState(gameState);
    
    // Check for events (handled automatically by event manager)
  }

  onEnemySpotted() {
    this.eventManager.onEnemySpotted();
  }

  onVictory() {
    this.eventManager.onVictory();
  }
}
```

## 🔧 Configuration

### Dialog System Options

```typescript
const dialogSystem = new AdvisorDialogSystem({
  enableTTS: true,        // Use TTS for dialog
  enableSubtitles: true,  // Show subtitles
  voiceDucking: true,     // Duck music when speaking
  cacheAudio: true        // Cache generated audio
});
```

### Event Cooldowns

Prevent dialog spam with cooldowns:

- `flavor_ambient`: 60s
- `resource_low`: 30s
- `enemy_spotted`: 10s
- `unit_killed`: 5s

## 📊 Performance

- **Pre-generation**: Common lines cached at startup
- **On-demand TTS**: Rare/emergent lines generated when needed
- **Audio Caching**: Generated audio cached to avoid re-generation
- **Voice Ducking**: Music automatically ducks during dialog
- **Event Queue**: Prevents overlapping dialog

## 🎯 Best Practices

1. **Pre-generate Critical Lines**: Game start, victory, defeat
2. **Use Event Manager**: Automatic cooldown and queue management
3. **Update Music Regularly**: Call `updateFromGameState` in game loop
4. **Show Subtitles**: Required for accessibility
5. **Handle Failures**: TTS failures fall back to subtitles only

## 🎨 Audio Design Philosophy

- **Emotional Rhythm**: Music adapts to create calm → tension → chaos
- **Character Voice**: Each advisor has distinct audio identity
- **Dynamic Response**: Audio reacts to player actions
- **Spatial Audio**: Unit voices panned, advisors centered
- **Silence as Tool**: Strategic pauses increase impact

The audio system transforms Quaternion into an emotionally engaging, cinematic experience where every sound tells a story!

