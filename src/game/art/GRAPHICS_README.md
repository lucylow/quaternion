# 🎨 Neo-Biotech Planet Graphics System

## Overview

The Neo-Biotech Planet graphics system implements the "Neo-Biotech Planet" visual identity for Quaternion, featuring bioluminescent terrain, dynamic lighting, faction color shifts, and cinematic effects. This system makes the world feel alive and responsive to player actions.

## 🎯 Visual Identity

**Tagline:** "A living world half reborn, half corrupted. Every tile breathes, pulses, and reacts."

**Style:** Biotech + neon sci-fantasy fusion. Imagine Hades meets The Matrix with organic glowing veins through shattered terrain.

**Palette:**
- **Quaternion (Biotech)**: Deep Teal `#0F3A3A`, Chroma Neon `#7DF9B6`
- **Corp (Industrial)**: Reactor Gold `#FFD36B`, Soft Pink `#FF7BA9`
- **Neutral**: Slate `#263238`

## 🧩 Core Systems

### 1. NeoBiotechGraphics

The main graphics orchestrator that manages:
- **Faction Colors**: Quaternion (teal/neon) vs Corp (gold/pink)
- **Bioluminescent Veins**: Animated terrain veins that pulse with faction control
- **World Pulse System**: Particle effects that respond to world instability
- **Ambient Lighting**: Dynamic overlay that shifts with world state
- **Cinematic Effects**: Ultimate ability camera effects with lens flares

**Key Features:**
- Terrain veins pulse and flow based on faction control
- Colors blend smoothly between Quaternion and Corp dominance
- Particle emission increases with world instability
- Ambient lighting creates emotional atmosphere

### 2. DynamicLightingController

Adapts lighting based on world stability:
- **Calm State** (stability > 0.7): Deep teal lighting
- **Tension State** (0.3 < stability < 0.7): Blended colors
- **Chaos State** (stability < 0.3): Soft pink lighting

**Features:**
- Smooth transitions between lighting states
- Camera tint effects for atmosphere
- Dramatic lighting shifts for events

### 3. VisualIntegration

Integrates all visual systems with game state:
- Calculates world stability from quaternion state
- Updates terrain veins based on faction control
- Manages lifecycle of visual effects
- Provides unified API for game systems

## 🚀 Usage

### Basic Setup

```typescript
import { VisualIntegration } from '@/game/art';

// In your Phaser scene
const visualIntegration = new VisualIntegration(scene);

// Update in game loop
function update(deltaTime: number) {
  visualIntegration.update(deltaTime, gameState);
}
```

### Adding Bioluminescent Veins to Terrain

```typescript
// Add veins to a terrain tile
visualIntegration.addTerrainVeins(
  tileX: number,
  tileY: number,
  tileSize: number,
  intensity: number = 1.0
);

// Remove veins when tile changes
visualIntegration.removeTerrainVeins(tileX, tileY);
```

### Triggering Cinematic Effects

```typescript
// Ultimate ability cinematic
visualIntegration.triggerUltimateEffect(
  { x: 500, y: 300 }, // Focus point
  2000, // Duration in ms
  () => console.log('Effect complete')
);
```

### Creating Holographic UI

```typescript
// Create holographic panel
const panel = visualIntegration.createHolographicPanel(
  100, // x
  100, // y
  300, // width
  200  // height
);

// Add glow pulse to UI element
const pulse = visualIntegration.createUIGlowPulse(
  uiElement, // Phaser image or container
  3.0 // Speed
);
```

### Dramatic Lighting Shifts

```typescript
// Trigger dramatic lighting change for events
visualIntegration.triggerDramaticLightingShift(
  0.2, // Target stability (chaos)
  1000, // Duration
  () => console.log('Lighting shift complete')
);
```

## 🎨 Visual Effects

### Bioluminescent Terrain Veins

- **Flow Animation**: Veins flow across tiles using sine wave patterns
- **Faction Blending**: Colors blend between Quaternion (teal) and Corp (gold)
- **Pulse Intensity**: Pulse speed increases with world instability
- **Glow Layers**: Multiple glow layers for depth

### World Pulse Particles

- **Bioluminescent Motes**: Small particles drift from terrain
- **Dynamic Emission**: Emission rate increases with instability
- **Color Blending**: Particle colors blend based on faction control

### Ambient Lighting

- **Overlay System**: Subtle color overlay on entire screen
- **Stability Response**: Lighting intensity reflects world state
- **Faction Blending**: Overlay color blends with faction control

### Cinematic Ultimate Effects

- **Camera Zoom**: Dramatic zoom to focus point
- **Lens Flare**: Radial flare effect at screen center
- **Color Pulse**: Pulsing colors during effect
- **Smooth Transitions**: Eased camera movements

## 🔧 Integration with Game State

The system automatically calculates visual state from quaternion game state:

```typescript
// World stability calculation
const stability = calculateFromQuaternionState(gameState);
// Lower variance = higher stability

// Faction blend calculation
const quaternionPower = |y| + |z|; // Life + Knowledge
const corpPower = |w| + |x|; // Matter + Energy
const factionBlend = corpPower / (quaternionPower + corpPower);
```

## 📊 Performance Considerations

- **Particle Limits**: Particle emission is capped to maintain performance
- **Update Frequency**: Terrain veins update at ~60fps (16ms intervals)
- **Graphics Caching**: Vein graphics are cached and reused
- **Cleanup**: All effects properly cleanup on scene destroy

## 🎬 Trailer-Ready Features

All systems are designed to create cinematic moments:

1. **Bioluminescent Terrain**: Makes maps look alive and expensive
2. **Dynamic Lighting**: Creates emotional rhythm (calm → tension → chaos)
3. **Faction Color Shifts**: Visual storytelling through color
4. **Cinematic Ultimates**: Trailer-worthy camera effects
5. **World Pulse**: Particles that respond to player actions

## 🔮 Future Enhancements

- Shader-based terrain rendering for better performance
- Post-processing effects (bloom, chromatic aberration)
- Procedural vein generation based on terrain type
- Advanced particle systems for different biomes
- Screen-space effects for UI holograms

## 📝 Example: Complete Integration

```typescript
import { VisualIntegration } from '@/game/art';
import type { QuaternionState } from '@/game/strategic/QuaternionState';

class GameScene extends Phaser.Scene {
  private visualIntegration!: VisualIntegration;
  private gameState!: QuaternionState;

  create() {
    // Initialize visual system
    this.visualIntegration = new VisualIntegration(this);
    
    // Add veins to key terrain tiles
    this.visualIntegration.addTerrainVeins(10, 10, 32, 1.0);
    this.visualIntegration.addTerrainVeins(15, 15, 32, 0.8);
    
    // Create holographic UI panels
    const resourcePanel = this.visualIntegration.createHolographicPanel(
      10, 10, 200, 100
    );
    
    // Add glow pulse to important UI
    const importantButton = this.add.image(100, 100, 'button');
    this.visualIntegration.createUIGlowPulse(importantButton, 2.0);
  }

  update(time: number, delta: number) {
    // Update visual systems with game state
    this.visualIntegration.update(delta, this.gameState);
  }

  onUltimateAbility(focusPoint: { x: number; y: number }) {
    // Trigger cinematic effect
    this.visualIntegration.triggerUltimateEffect(
      focusPoint,
      2000,
      () => console.log('Ultimate complete')
    );
  }

  onWorldEvent(instability: number) {
    // Dramatic lighting shift
    this.visualIntegration.triggerDramaticLightingShift(
      1 - instability, // Convert to stability
      1500
    );
  }

  destroy() {
    // Cleanup
    this.visualIntegration.cleanup();
  }
}
```

## 🎯 Design Goals Achieved

✅ **Living World**: Terrain pulses and reacts to player actions  
✅ **Emotional Rhythm**: Lighting creates calm → tension → chaos  
✅ **Visual Storytelling**: Faction colors tell the story  
✅ **Cinematic Moments**: Ultimate effects create trailer-worthy shots  
✅ **Performance**: Optimized for WebGL and mid-range hardware  
✅ **Accessibility**: High contrast, readable at all times  

The Neo-Biotech Planet graphics system transforms Quaternion into a visually stunning, emotionally engaging experience that judges will remember!

