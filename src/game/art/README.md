# Quaternion Art System

Complete artistic implementation for Quaternion Strategy Game, featuring fourfold thematic palettes, procedural generation, visual effects, and AI-driven aesthetics.

## 🎨 Core Features

### Fourfold Thematic Visual Palette

Each Quaternion axis has distinct color schemes and visual motifs:

- **Matter**: Industrial steel blues and grays with mechanical textures
- **Energy**: Intense warm hues (fiery reds, electric oranges)
- **Life**: Earthy greens and browns with organic shapes
- **Knowledge**: Futuristic neon blues and purples with glowing circuitry

### Visual Effects System

- **Emissive Veins**: Flowing vein patterns on tiles
- **Flowing Lava**: Animated lava effects for energy-based terrain
- **Particle Effects**: Dynamic particles for each resource type
- **Dissolve/Corrupt**: Visual effects for state transitions
- **AI Thought Visualization**: L-system fractal patterns for AI cognition

### Procedural Generation

- **Flora Placement**: Poisson disk sampling for natural flora distribution
- **Biome-Based**: Flora adapts to biome types (desert, forest, plains, tech)
- **Seed-Based**: Deterministic generation for replayability

### UI Components

- **Poetic Overlay**: Typewriter effect with parallax for narrative text
- **Resource Pulse Indicators**: Animated resource displays with pulsing effects
- **AI Thought Visuals**: Canvas-based fractal visualizations

## 📦 Components

### ArtPalette.ts

Color palette system with RGB, hex, and Phaser color conversions.

```typescript
import { QuaternionArtPalette } from '@/game/art';

// Get palette by axis
const matterPalette = QuaternionArtPalette.getPalette('matter');

// Convert to Phaser color
const phaserColor = QuaternionArtPalette.toPhaserColor(matterPalette.base);

// Convert to hex
const hexColor = QuaternionArtPalette.toHex(matterPalette.accent);

// Convert to CSS rgba
const cssColor = QuaternionArtPalette.toRGBA(matterPalette.emissive);

// Blend palettes
const blended = QuaternionArtPalette.blendPalettes(
  QuaternionArtPalette.MATTER,
  QuaternionArtPalette.ENERGY,
  0.5 // 50% blend
);

// Get palette from resource dominance
const palette = QuaternionArtPalette.getPaletteFromResources({
  matter: 100,
  energy: 50,
  life: 30,
  knowledge: 20
});
```

### VisualEffects.ts

Phaser-based visual effects system.

```typescript
import { VisualEffects } from '@/game/art';
import type { Phaser } from 'phaser';

const effects = new VisualEffects(scene);

// Create emissive vein effect
const vein = effects.createVeinEffect(x, y, {
  intensity: 0.8,
  flowSpeed: 20,
  color: QuaternionArtPalette.toPhaserColor(palette.emissive),
  tileSize: 32
});

// Create lava effect
const lava = effects.createLavaEffect(x, y, width, height, 1.0);

// Spawn particle effect
const emitter = effects.spawnParticleEffect({
  position: { x: 100, y: 100 },
  type: 'energy',
  intensity: 0.8,
  duration: 2000
});

// Create AI thought visual
const thought = effects.createAIThoughtVisual(x, y, 'knowledge');

// Dissolve effect
effects.createDissolveEffect(sprite, 1000);
```

### ProceduralFlora.ts

Procedural flora placement using Poisson disk sampling.

```typescript
import { ProceduralFloraPlacer } from '@/game/art';

const placer = new ProceduralFloraPlacer(scene);

// Place flora by biome
const flora = placer.placeByBiome(
  0, 0,      // x, y
  640, 480,  // width, height
  'forest',  // biome
  12345      // seed
);

// Custom flora placement
const customFlora = placer.placeFlora(
  0, 0, 640, 480,
  {
    type: 'life',
    density: 0.1,
    minDistance: 30,
    scaleRange: [0.8, 1.5],
    rotationRange: [0, 360]
  },
  12345
);
```

### VisualIntegration.ts

Integration system connecting visuals with game state.

```typescript
import { VisualIntegration } from '@/game/art';

const integration = new VisualIntegration(scene, gameState);

// Update visuals based on game state
integration.updateVisuals({
  instability: 0.7,
  resources: {
    matter: 100,
    energy: 50,
    life: 30,
    knowledge: 20
  },
  dominance: 'matter',
  tension: 0.6
});

// Create tile vein effect
integration.createTileVeinEffect(
  tileX, tileY, tileSize,
  'matter',
  0.5 // instability
);

// Place flora
integration.placeFlora(x, y, width, height, 'forest', seed);

// Get current palette
const palette = integration.getCurrentPalette();
```

## 🎯 React Components

### PoeticOverlay

Displays AI-generated poetic text with typewriter and parallax effects.

```tsx
import { PoeticOverlay } from '@/components/art';

<PoeticOverlay
  text="The veins of Erethis settle for a breath..."
  duration={6}
  charDelay={0.03}
  style="ambient" // or "dramatic" or "subtle"
  onComplete={() => console.log('Poem finished')}
/>
```

### ResourcePulseIndicator

Animated resource indicators with pulsing effects.

```tsx
import { ResourcePulseIndicator, ResourcePulseGrid } from '@/components/art';

// Single indicator
<ResourcePulseIndicator
  resource="matter"
  value={100}
  maxValue={200}
  intensity={0.8}
  size="md"
  showValue={true}
/>

// Grid of all resources
<ResourcePulseGrid
  resources={{
    matter: 100,
    energy: 50,
    life: 30,
    knowledge: 20
  }}
  intensities={{
    matter: 0.8,
    energy: 0.5,
    life: 0.3,
    knowledge: 0.2
  }}
  maxValue={200}
/>
```

### AIThoughtVisual

L-system fractal visualization for AI cognition.

```tsx
import { AIThoughtVisual, AIThoughtBurst } from '@/components/art';

// Single visual
<AIThoughtVisual
  type="knowledge"
  intensity={0.8}
  size={100}
  animated={true}
/>

// Burst pattern
<AIThoughtBurst
  type="matter"
  intensity={1.0}
  count={5}
  spread={150}
/>
```

## 🎬 Integration Examples

### With Map Renderer

```typescript
import { VisualIntegration } from '@/game/art';
import { MapRenderer } from '@/frontend/renderers/MapRenderer';

class EnhancedMapRenderer {
  private visualIntegration: VisualIntegration;

  constructor(scene: Phaser.Scene) {
    this.visualIntegration = new VisualIntegration(scene);
  }

  renderMap() {
    // ... render base map ...

    // Add vein effects to resource tiles
    this.mapData.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile.hasResource) {
          this.visualIntegration.createTileVeinEffect(
            x, y, 32,
            tile.resourceType,
            this.gameState.instability
          );
        }
      });
    });

    // Place flora
    this.visualIntegration.placeFlora(
      0, 0,
      this.width * 32,
      this.height * 32,
      'forest',
      this.seed
    );
  }
}
```

### With Game State

```typescript
import { VisualIntegration } from '@/game/art';

// In game loop
function updateVisuals() {
  const instability = calculateInstability(gameState);
  const dominance = getDominantResource(gameState.resources);

  visualIntegration.updateVisuals({
    instability,
    resources: gameState.resources,
    dominance,
    tension: gameState.tension
  });
}

// Trigger particle effects on events
function onResourceEvent(type: string, intensity: number) {
  visualIntegration.visualEffects.spawnParticleEffect({
    position: { x: eventX, y: eventY },
    type: type as any,
    intensity,
    duration: 2000
  });
}
```

### With Narrative System

```typescript
import { PoeticOverlay } from '@/components/art';

// Show poetic overlay when narrative event occurs
function onNarrativeEvent(event: NarrativeEvent) {
  if (event.type === 'epilogue') {
    setPoeticText(event.text);
    setShowPoeticOverlay(true);
  }
}

// In component
{showPoeticOverlay && (
  <PoeticOverlay
    text={poeticText}
    duration={8}
    style="dramatic"
    onComplete={() => setShowPoeticOverlay(false)}
  />
)}
```

## 🎨 Color Reference

### Matter Palette
- Base: `#1E3B4F` (Steel blue)
- Accent: `#99B3CC` (Light steel)
- Emissive: `#6699E6` (Electric blue)

### Energy Palette
- Base: `#590D05` (Dark red)
- Accent: `#FF7305` (Orange)
- Emissive: `#FF990A` (Fire orange)

### Life Palette
- Base: `#0F4D1F` (Dark green)
- Accent: `#7AFA-A6` (Bioluminescent green)
- Emissive: `#4DFF80` (Glowing green)

### Knowledge Palette
- Base: `#08142E` (Deep blue)
- Accent: `#73A3FF` (Neon blue)
- Emissive: `#66B3FF` (Bright cyan)

## 🚀 Performance Tips

1. **Limit Active Effects**: Clean up effects when not needed
2. **Use Object Pooling**: Reuse particle emitters and graphics objects
3. **Reduce Canvas Operations**: Batch draw calls where possible
4. **LOD for Flora**: Reduce flora density at distance
5. **Conditional Rendering**: Only render effects in viewport

## 📚 Best Practices

1. **Palette Consistency**: Always use `QuaternionArtPalette` for colors
2. **Effect Cleanup**: Always cleanup effects when done
3. **Seed-Based Generation**: Use seeds for deterministic results
4. **Performance Monitoring**: Watch FPS when adding effects
5. **Responsive Design**: Adjust effect intensity based on device

## 🔧 Extending the System

### Adding New Effects

1. Add effect method to `VisualEffects` class
2. Create Phaser graphics/particles as needed
3. Use palette colors from `QuaternionArtPalette`
4. Add cleanup logic
5. Integrate with `VisualIntegration` if needed

### Adding New Palettes

1. Add palette to `QuaternionArtPalette` class
2. Define base, accent, dark, light, and emissive colors
3. Update `getPalette` method if needed

### Creating New Components

1. Create component in `src/components/art/`
2. Use `QuaternionArtPalette` for colors
3. Support theming via props
4. Add TypeScript types
5. Export from component index if needed

## 🎯 Future Enhancements

- WebGL shaders for advanced effects
- Procedural texture generation
- Dynamic lighting system
- Post-processing effects
- Advanced particle systems
- Style transfer for asset generation
- AI-assisted art generation pipeline

