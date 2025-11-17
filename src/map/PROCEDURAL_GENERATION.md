# 🎲 Procedural Generation System

## Overview

The enhanced procedural generation system for "Quaternion: Neural Frontier" provides AI-powered content generation with strategic depth, personality-driven AI commanders, and dynamic environmental effects.

## Features

### 1. Enhanced Terrain Generation

**Strategic Features:**
- **Chokepoints**: Natural bottlenecks that affect unit movement
- **Elevation**: Height variations providing tactical advantages
- **Resource Veins**: Procedural mineral deposits influencing base placement
- **Quantum Fractures**: Areas affecting unit movement unpredictably

**Terrain Personalities:**
- **Aggressive Maps**: Open spaces favoring rush strategies
- **Defensive Maps**: Natural choke points and fortified positions
- **Economic Maps**: Rich resources but vulnerable expansion points
- **Puzzle Maps**: Require specific unit combinations to progress

**Biomes:**
- Volcanic, Crystalline, Organic, Mechanical, Quantum, Void

### 2. AI Commander Personality Engine

**Features:**
- Dynamic trait generation based on archetype
- Learning algorithms that remember player strategies
- Personality evolution based on battle outcomes
- Counter-strategy development

**Archetypes:**
- Aggressor, Architect, Nomad, Tactician, Harvester, Wildcard, Balanced

**Traits:**
- Aggression, Adaptability, Risk Tolerance, Strategic Focus, Patience, Exploration Drive, Innovation Drive, Micro Focus

### 3. Procedural Unit Design

**Faction Themes:**
- Quantum, Biological, Mechanical, Energy, Neural, Chrono, Entropy

**Strategic Roles:**
- Assault, Support, Siege, Scout, Defense, Utility

**Features:**
- Faction-specific modifiers and abilities
- Balanced stat generation
- Special mechanics per faction/role combination

### 4. Dynamic Environmental Effects

**Weather Types:**
- Quantum Storm, Energy Surge, Gravity Well, Temporal Distortion, Neural Interference, Void Zone, Resource Flux

**Effects:**
- Movement speed modifiers
- Attack damage modifiers
- Vision range modifiers
- Energy consumption modifiers
- Special effects (teleport, regeneration, etc.)

## Usage

### Basic Generation

```typescript
import { ProceduralGenerationManager } from './ProceduralGenerationManager';

const manager = new ProceduralGenerationManager();

const gamePackage = manager.generateGamePackage({
  seed: 12345,
  mapWidth: 1000,
  mapHeight: 1000,
  mapPersonality: 'aggressive',
  biome: 'quantum',
  faction: 'quantum',
  commanderArchetype: 'aggressor',
  difficulty: 'medium',
  dynamicWeather: true
});

// Access generated content
const map = gamePackage.map;
const units = gamePackage.units;
const commander = gamePackage.commander;
const environmentalSystem = gamePackage.environmentalSystem;
```

### Pre-generation for Performance

```typescript
// Pre-generate content pools during loading
const pools = manager.preGenerateContentPools(seed, {
  unitVariations: 50,
  terrainTemplates: 20,
  commanderProfiles: 12
});

// Combine at runtime for unique combinations
const gamePackage = manager.combinePreGeneratedElements(
  pools.terrainTemplates[0],
  pools.unitPool,
  pools.commanderProfiles[0],
  sessionSeed
);
```

### Using Enhanced Map Generator

```typescript
import { EnhancedProceduralGenerator } from './EnhancedProceduralGenerator';

const generator = new EnhancedProceduralGenerator({
  width: 1000,
  height: 1000,
  seed: 12345,
  personality: 'defensive',
  biome: 'crystalline',
  strategicChokepoints: 4,
  resourceDensity: 0.7
});

const map = generator.generate();

// Access strategic features
const chokepoints = map.strategicPoints.filter(p => p.type === 'chokepoint');
const strategicDNA = map.strategicDNA;
```

### Using Commander Personality

```typescript
import { EnhancedCommanderPersonality } from '../ai/EnhancedCommanderPersonality';

const commander = new EnhancedCommanderPersonality(
  12345,
  'tactician',
  'Custom Name'
);

// Make decisions
const decision = commander.makeDecision({
  resourceAdvantage: 0.2,
  militaryAdvantage: -0.1,
  techAdvantage: 0.3,
  territoryControl: 0.6,
  gamePhase: 'mid',
  threatLevel: 0.4
});

// Learn from outcomes
commander.learnFromOutcome(true, 'rush', 'defensive_turtle');
```

### Using Unit Generator

```typescript
import { ProceduralUnitGenerator } from '../units/ProceduralUnitGenerator';

const generator = new ProceduralUnitGenerator(12345);

// Generate a faction
const units = generator.generateFaction('quantum', 8);

// Generate specific unit
const unit = generator.generateUnit('quantum', 'assault');

// Generate variations
const variations = generator.generateVariations('quantum', 'assault', 3);
```

### Using Environmental Effects

```typescript
import { EnvironmentalEffectsSystem } from './EnvironmentalEffects';

const envSystem = new EnvironmentalEffectsSystem({
  seed: 12345,
  mapWidth: 1000,
  mapHeight: 1000,
  dynamicWeather: true
});

// Update system
envSystem.update(deltaTime);

// Get effects at position
const effects = envSystem.getEffectsAt(x, y);

// Access active zones
const zones = envSystem.getActiveZones();
```

## Strategic DNA

Each generated map has strategic DNA metrics:

- **Openness** (0-1): Affects rush strategies
- **Defensiveness** (0-1): Natural choke points
- **Economic Value** (0-1): Resource richness
- **Complexity** (0-1): Puzzle-like elements

## Performance Optimization

1. **Pre-generation**: Generate content pools during loading
2. **Runtime Combination**: Combine pre-generated elements for unique experiences
3. **Caching**: Store generated content for session persistence
4. **Lazy Loading**: Generate environmental effects on-demand

## Integration with Game State

The procedural generation system integrates with:

- `QuaternionGameState`: Main game state
- `AIController`: AI decision making
- `Unit`: Unit entities
- `Building`: Building placement

## Future Enhancements

- Real-time AI content generation via cloud APIs
- Voice synthesis integration (ElevenLabs)
- Dynamic music system (Fuser)
- Narrative generation (SAGA)
- Cinematic generation (LTX Studio)

