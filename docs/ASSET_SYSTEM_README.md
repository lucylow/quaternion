# Asset Management System - Implementation Guide

This document describes the comprehensive asset management and rendering system that leverages your game's visual assets.

## Overview

The new system includes:
- **AssetManager**: Comprehensive asset loading system for monsters, countries, UI, and mobile assets
- **EnhancedMapRenderer**: Improved visual map system with country-specific theming
- **ResponsiveMobileUI**: Mobile-optimized interface with touch controls
- **UnifiedGameScene**: Integration scene that brings all systems together

## File Structure

```
src/frontend/
├── managers/
│   └── AssetManager.ts          # Asset loading and management
├── renderers/
│   └── EnhancedMapRenderer.ts   # Enhanced map rendering with theming
├── ui/
│   └── ResponsiveMobileUI.ts    # Mobile-responsive UI system
├── scenes/
│   └── UnifiedGameScene.ts      # Main game scene integration
└── config.ts                     # Game configuration
```

## Asset Paths

The system expects assets in the following locations:

- **Monsters**: `/assets/monsters/*.webp`
- **Countries**: `/assets/countries/*.webp`
- **UI**: `/assets/images/*` (optional, loaded on-demand)
- **Mobile**: `/assets/mobile-mockups/*.webp` (optional, UI created programmatically)

## Usage

### Basic Setup

```typescript
import { initializeGame } from './frontend/config';

// Initialize the game
const game = initializeGame();
```

### Using AssetManager Directly

```typescript
import { AssetManager } from './frontend/managers/AssetManager';

const assetManager = new AssetManager(scene);
await assetManager.loadAllAssets();

// Create a monster
const monster = assetManager.createMonster(
  scene,
  'monster-celestial-1',
  x,
  y,
  { scale: 1.5, physics: true }
);
```

### Using EnhancedMapRenderer

```typescript
import { EnhancedMapRenderer } from './frontend/renderers/EnhancedMapRenderer';

const mapRenderer = new EnhancedMapRenderer(
  scene,
  width,
  height,
  'country-dubai'
);
await mapRenderer.initializeMap();
```

### Using ResponsiveMobileUI

```typescript
import { ResponsiveMobileUI } from './frontend/ui/ResponsiveMobileUI';

const mobileUI = new ResponsiveMobileUI(scene);
mobileUI.setupResponsiveUI();
```

## Features

### Asset Management
- ✅ Automatic asset loading from directories
- ✅ Texture caching for performance
- ✅ Memory management and cleanup
- ✅ Support for monster stats and country metadata (JSON)

### Enhanced Map Rendering
- ✅ Country-specific color palettes
- ✅ Parallax background layers
- ✅ Dynamic weather effects (configurable)
- ✅ Tile-based terrain with visual details
- ✅ Grid overlay system
- ✅ Tile highlighting and path drawing

### Mobile UI
- ✅ Automatic device detection
- ✅ Touch joystick controls
- ✅ Mobile action buttons
- ✅ Responsive scaling
- ✅ Mobile-optimized HUD
- ✅ Touch-optimized tooltips

### Integration
- ✅ Unified game scene
- ✅ Event-driven architecture
- ✅ Seamless mobile/desktop support
- ✅ Input abstraction layer

## Configuration

### Monster Assets

Monster assets are loaded from `/assets/monsters/`. The system supports:
- Image files (`.webp`, `.png`)
- Optional stats JSON files (`stats.json`)
- Optional animation JSON files (`animations.json`)

### Country Assets

Country assets are loaded from `/assets/countries/`. The system supports:
- Background images
- Optional metadata JSON files (`metadata.json`)
- Parallax layer images

### Mobile Assets

Mobile UI is created programmatically, but can also load mockup images from `/assets/mobile-mockups/` for reference.

## Events

The system emits various events:

- `joystick_move`: When mobile joystick is moved
- `button_attack_pressed`: Attack button pressed
- `button_build_pressed`: Build button pressed
- `command:move`: Move command issued
- `command:select`: Select command issued
- `ui:open_build_menu`: Open build menu
- `ui:attack_mode`: Enter attack mode

## Performance

- Asset caching reduces memory usage
- Texture pooling for sprites
- Efficient rendering pipeline
- Lazy loading for optional assets

## Future Enhancements

- Sprite sheet support for monsters
- Animation system integration
- Particle system for weather effects
- Advanced lighting system
- Asset preloading strategies

## Notes

- The system gracefully handles missing assets
- All paths are relative to the public directory
- TypeScript types are fully defined
- Error handling is comprehensive


