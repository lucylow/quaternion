# Lovable Routes Guide

This file helps Lovable discover and organize all your routes for easier editing.

## Available Routes

All routes are defined in `src/routes/index.tsx` and used in `src/App.tsx`.

### Main Routes

- **/** - Home page (`src/pages/Index.tsx`)
- **/game** - Game page (`src/pages/Game.tsx`)
- **/lobby** - Lobby page (`src/pages/Lobby.tsx`)
- **/quaternion** - Quaternion Game (`src/pages/QuaternionGame.tsx`)

### Information Pages

- **/about** - About page (`src/pages/About.tsx`)
- **/how-to-play** - How to Play (`src/pages/HowToPlay.tsx`)
- **/ai-features** - AI Features (`src/pages/AIFeatures.tsx`)

### Game Features

- **/commanders** - Commanders page (`src/pages/Commanders.tsx`)
- **/tech-tree** - Tech Tree (`src/pages/TechTree.tsx`)
- **/replays** - Replays (`src/pages/Replays.tsx`)
- **/map-generator** - Map Generator (`src/pages/MapGenerator.tsx`)

### Shop & Monetization

- **/shop** - Cosmetic Shop (`src/pages/CosmeticShop.tsx`)
- **/checkout** - Checkout (`src/pages/Checkout.tsx`)
- **/battle-pass** - Battle Pass (`src/pages/BattlePass.tsx`)

### Error Handling

- ***** - Not Found page (`src/pages/NotFound.tsx`)

## Editing Pages in Lovable

To edit a specific page in Lovable:

1. Open the file explorer
2. Navigate to `src/pages/`
3. Click on any `.tsx` file to edit it
4. Or use the route configuration in `src/routes/index.tsx` to see all routes

## Route Configuration

The `src/routes/index.tsx` file exports:
- Direct imports for Lovable's file explorer
- Lazy-loaded versions for performance
- Route metadata for documentation

This structure helps Lovable:
- Discover all your pages
- Show them in the file explorer
- Make them easily editable
- Understand the routing structure

