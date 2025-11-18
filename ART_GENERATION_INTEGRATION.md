# Art Generation Integration Guide

## Overview

This guide explains how to use ImagineArt and Dreamina for generating art textures and concept images for the Quaternion game.

## Features

- **ImagineArt 1.0**: Hyper-realistic textures and images
- **Dreamina 3.1**: High-resolution concept art with exceptional detail
- **Unified API**: Single service interface for both providers
- **Asset Management**: Seamless integration with Phaser AssetManager
- **Caching**: Automatic caching of generated assets
- **Batch Generation**: Generate multiple assets in parallel

## Setup

### 1. Environment Variables

Add to your `.env` file:

```env
# Art Generation API Keys
IMAGINEART_API_KEY=your_imagineart_api_key
DREAMINA_API_KEY=your_dreamina_api_key
IMAGINEART_API_URL=https://api.imagine.art/v1
DREAMINA_API_URL=https://api.imagine.art/v1/dreamina

# Frontend API URLs (optional, defaults to /api/art)
VITE_IMAGINEART_API_URL=/api/art/imagineart
VITE_DREAMINA_API_URL=/api/art/dreamina
```

### 2. API Keys

Get your API keys from:
- [ImagineArt Platform](https://www.imagine.art)
- Contact your API provider for Dreamina access

**Note**: If API keys are not set, the system will return mock responses for development.

## Usage

### Basic Usage

```typescript
import { artGenerationService } from '@/lib/api';

// Generate a texture
const texture = await artGenerationService.generateTexture({
  prompt: 'steel mechanical texture, industrial',
  type: 'texture',
  gameEntity: 'monster',
  theme: 'matter',
  quality: 'high',
});

console.log('Generated texture URL:', texture.imageUrl);
```

### Generate Concept Art

```typescript
// Generate concept art using Dreamina
const concept = await artGenerationService.generateConcept({
  prompt: 'AI commander in futuristic armor',
  type: 'concept',
  gameEntity: 'commander',
  theme: 'knowledge',
  aspectRatio: '16:9',
  quality: 'ultra',
});
```

### Using ArtAssetManager with Phaser

```typescript
import { ArtAssetManager } from '@/frontend/managers/ArtAssetManager';
import { AssetManager } from '@/frontend/managers/AssetManager';

// In your Phaser scene
const assetManager = new AssetManager(scene);
const artAssetManager = new ArtAssetManager(scene, assetManager);

// Generate and load texture directly into Phaser
const texture = await artAssetManager.generateAndLoadTexture({
  prompt: 'monster creature texture',
  type: 'texture',
  gameEntity: 'monster',
  theme: 'life',
  quality: 'high',
});

// Use the texture in your game
const sprite = scene.add.sprite(100, 100, texture.key);
```

### Generate Commander Art

```typescript
// Generate art for a specific commander archetype
const commanderArt = await artAssetManager.generateCommanderArt(
  'THE_INNOVATOR',
  'knowledge' // theme
);
```

### Generate Monster Texture

```typescript
// Generate texture for a monster
const monsterTexture = await artAssetManager.generateMonsterTexture(
  'Dragon',
  'energy' // theme
);
```

### Generate Country Background

```typescript
// Generate background for a country/terrain
const background = await artAssetManager.generateCountryBackground(
  'Dubai',
  'desert'
);
```

### Batch Generation

```typescript
// Generate multiple assets at once
const requests = [
  {
    prompt: 'steel texture',
    type: 'texture' as const,
    gameEntity: 'monster',
    theme: 'matter' as const,
  },
  {
    prompt: 'fiery energy texture',
    type: 'texture' as const,
    gameEntity: 'monster',
    theme: 'energy' as const,
  },
  {
    prompt: 'organic life texture',
    type: 'texture' as const,
    gameEntity: 'monster',
    theme: 'life' as const,
  },
];

const results = await artGenerationService.generateBatch(requests, {
  parallel: true,
  maxConcurrent: 3,
});

console.log(`Generated ${results.results.length} assets`);
console.log(`Failed: ${results.failed.length}`);
console.log(`Total time: ${results.totalTime}ms`);
```

### Preload Assets for Entities

```typescript
// Preload art for multiple game entities
await artAssetManager.preloadAssetsForEntities([
  {
    type: 'commander',
    id: 'innovator-1',
    name: 'The Innovator',
    theme: 'knowledge',
  },
  {
    type: 'monster',
    id: 'dragon-1',
    name: 'Fire Dragon',
    theme: 'energy',
  },
  {
    type: 'country',
    id: 'dubai-1',
    name: 'Dubai',
    theme: undefined,
  },
]);
```

## API Reference

### ArtGenerationService

Main service for generating art assets.

#### Methods

- `generateTexture(request: TextureGenerationRequest)`: Generate texture using ImagineArt
- `generateConcept(request: TextureGenerationRequest)`: Generate concept art using Dreamina
- `generateArt(request: TextureGenerationRequest)`: Auto-select best service based on type
- `generateBatch(requests, options)`: Generate multiple assets
- `generateCommanderArt(archetype, theme)`: Generate commander concept art
- `generateMonsterTexture(monsterName, theme)`: Generate monster texture
- `generateCountryBackground(countryName, terrain)`: Generate country background
- `clearCache()`: Clear generation cache

### ArtAssetManager

Manages AI-generated assets and integrates with Phaser.

#### Methods

- `generateAndLoadTexture(request)`: Generate and load texture into Phaser
- `generateAsset(request)`: Generate asset and return metadata
- `generateCommanderArt(archetype, theme)`: Generate commander art
- `generateMonsterTexture(monsterName, theme)`: Generate monster texture
- `generateCountryBackground(countryName, terrain)`: Generate country background
- `generateBatchAssets(requests)`: Batch generate assets
- `getGeneratedAsset(cacheKey)`: Get cached asset
- `getAllGeneratedAssets()`: Get all generated assets
- `clearCache()`: Clear cache
- `preloadAssetsForEntities(entities)`: Preload assets for entities

## Request Types

### TextureGenerationRequest

```typescript
interface TextureGenerationRequest {
  prompt: string;                    // Required: Description of what to generate
  type?: 'texture' | 'concept' | 'sprite' | 'background';
  gameEntity?: string;                // e.g., 'monster', 'commander', 'country'
  entityId?: string;                  // Unique identifier for the entity
  theme?: 'matter' | 'energy' | 'life' | 'knowledge';
  style?: string;                     // Optional style modifier
  width?: number;                     // Image width in pixels
  height?: number;                    // Image height in pixels
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  quality?: 'standard' | 'high' | 'ultra';
  seed?: number;                      // Random seed for reproducibility
  negativePrompt?: string;            // What to avoid in generation
  numImages?: number;                 // Number of images to generate
}
```

## Game Themes

The system supports four quaternion themes:

- **Matter**: Steel blues, mechanical textures, angular geometry
- **Energy**: Fiery reds/oranges, dynamic particles, flowing effects
- **Life**: Earthy greens, organic shapes, bioluminescent glows
- **Knowledge**: Neon blues/purples, circuitry patterns, fractal visuals

## Integration Examples

### With Commander Archetypes

```typescript
import { AICommanderArchetypes } from '@/ai/opponents/AICommanderArchetypes';
import { artAssetManager } from '@/frontend/managers/ArtAssetManager';

// Generate art for each commander archetype
const archetypes = AICommanderArchetypes.getAllArchetypes();

for (const archetype of archetypes) {
  const art = await artAssetManager.generateCommanderArt(archetype, 'knowledge');
  console.log(`Generated art for ${archetype}:`, art.url);
}
```

### With AssetManager

```typescript
// Generate textures on-demand when loading monsters
const monsterTexture = await artAssetManager.generateAndLoadTexture({
  prompt: `${monsterName} monster texture`,
  type: 'texture',
  gameEntity: 'monster',
  theme: determineTheme(monsterType),
  quality: 'high',
});

// Use the texture
const monsterSprite = scene.add.sprite(x, y, monsterTexture.key);
```

## Caching

Generated assets are automatically cached to avoid redundant API calls. The cache key is based on:
- Prompt
- Type
- Game entity
- Theme
- Aspect ratio

To clear the cache:

```typescript
artGenerationService.clearCache();
artAssetManager.clearCache();
```

## Error Handling

```typescript
try {
  const texture = await artGenerationService.generateTexture({
    prompt: 'steel texture',
    type: 'texture',
  });
} catch (error) {
  console.error('Generation failed:', error.message);
  // Fallback to default texture
  const fallbackTexture = scene.textures.get('default-texture');
}
```

## Performance Tips

1. **Preload Assets**: Use `preloadAssetsForEntities()` to generate assets before they're needed
2. **Batch Generation**: Generate multiple assets in parallel using `generateBatch()`
3. **Caching**: The system automatically caches results - don't regenerate the same asset
4. **Quality Settings**: Use 'standard' quality for faster generation during development
5. **Mock Mode**: When API keys aren't set, the system uses mock responses for testing

## Backend API

The backend provides proxy endpoints at:
- `POST /api/art/imagineart` - Generate using ImagineArt
- `POST /api/art/dreamina` - Generate using Dreamina
- `GET /api/art/health` - Check service status

These endpoints handle API key management and provide a secure proxy to the art generation services.

## Troubleshooting

### API Keys Not Working

1. Verify API keys are set in `.env`
2. Check API key format (should be a string)
3. Verify API URLs are correct
4. Check backend logs for API errors

### Images Not Loading

1. Check CORS settings on image URLs
2. Verify image URLs are accessible
3. Check browser console for loading errors
4. Ensure Phaser scene is initialized before loading

### Slow Generation

1. Use lower quality settings for faster generation
2. Reduce image dimensions
3. Use batch generation with `maxConcurrent` limit
4. Consider preloading assets during game initialization

## Next Steps

1. Set up API keys in `.env`
2. Test with a simple texture generation
3. Integrate with your game entities
4. Preload assets for better performance
5. Customize prompts for your game's aesthetic

## Support

For issues or questions:
- Check the API documentation for ImagineArt/Dreamina
- Review backend logs for API errors
- Test with mock mode (no API keys) for development

