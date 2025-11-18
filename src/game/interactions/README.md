# Quaternion Interaction Effects System

This system provides thematically consistent visual and audio feedback for all game interactions, emphasizing the mathematical/quantum theme through quaternion rotations, axis-specific effects, and mathematical visualizations.

## Features

### 1. Quaternion Rotation Visualizations
- **4D Quaternion Representation**: Shows rotating circles representing w, x, y, z components
- **Axis-Specific Colors**: Each axis (Matter, Energy, Life, Knowledge) has unique visual identity
- **Continuous Rotation**: Smooth animations that reinforce the mathematical theme

### 2. Quantum Trail Effects
- **Unit Movement Trails**: Fading particle trails that follow units
- **Axis-Specific Particles**: Different particle styles for each resource axis
- **Blend Modes**: Additive blending for glowing quantum effects

### 3. Resource Gathering Effects
- **Mathematical Transformations**: Visual representations of resource extraction
- **Spiral Patterns**: Quaternion rotation-inspired spirals
- **Progress Indicators**: Visual feedback showing gathering progress

### 4. Selection Highlights
- **Quaternion Component Indicators**: Shows w, x, y, z components around selected units
- **Rotating Rings**: Continuous rotation with pulsing effects
- **Axis-Themed Colors**: Colors match the unit's resource axis

### 5. Command Execution Effects
- **Move Commands**: Arrow with quaternion rotation
- **Attack Commands**: Crosshair with energy effects
- **Patrol Commands**: Circular path indicators
- **Special Abilities**: Star patterns with quaternion components

## Usage

```typescript
import { QuaternionInteractionEffects } from '@/game/interactions/QuaternionInteractionEffects';

// Initialize in Phaser scene
const interactionEffects = new QuaternionInteractionEffects(scene);

// Create selection highlight
const highlight = interactionEffects.createSelectionHighlight(unit, 'matter');

// Create quantum trail for movement
const trail = interactionEffects.createQuantumTrail(unit, 'energy');

// Create resource gathering effect
interactionEffects.createResourceGatherEffect({
  position: { x: 100, y: 100 },
  axis: 'matter',
  intensity: 1.0
});

// Create command effect
interactionEffects.createCommandEffect(
  { x: 200, y: 200 },
  'move',
  'matter'
);

// Cleanup when done
interactionEffects.cleanup();
```

## Integration with UI Components

The UI components (`CommandPanel`, `UnitPanel`) now include:
- **Quaternion rotation backgrounds**: Subtle rotating gradients
- **Axis-specific theming**: Colors match the selected unit's axis
- **Mathematical terminology**: "Quantum Integrity" instead of "Health", "Quaternion Transformations" instead of "Abilities"
- **Enhanced hover states**: Glow effects and scale animations
- **Active state indicators**: Rotation icons when commands are executed

## Thematic Consistency

All interactions now reinforce the quaternion theme:
- **Mathematical Language**: Terms like "Quaternion state", "Q(w,x,y,z)", "Quantum Integrity"
- **Visual Motifs**: Rotating circles, spirals, 4-component indicators
- **Color Consistency**: Axis-specific colors throughout
- **Animation Style**: Smooth rotations and pulsing effects

## Performance

- Effects are automatically cleaned up after their duration
- Particle systems use efficient Phaser emitters
- Graphics objects are pooled and reused where possible
- All effects are depth-sorted for proper rendering

