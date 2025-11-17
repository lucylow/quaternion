# Lovable Setup Guide

## Problem
Lovable only shows "/" in the file explorer, but you want to edit individual pages.

## Solution
I've reorganized the routes to make them more discoverable in Lovable.

## How to Access Pages in Lovable

### Method 1: File Explorer
1. Open the file explorer sidebar in Lovable
2. Navigate to `src/pages/` directory
3. You'll see all your page files:
   - `Index.tsx` → Route: `/`
   - `Game.tsx` → Route: `/game`
   - `Lobby.tsx` → Route: `/lobby`
   - `QuaternionGame.tsx` → Route: `/quaternion`
   - `About.tsx` → Route: `/about`
   - `Commanders.tsx` → Route: `/commanders`
   - `HowToPlay.tsx` → Route: `/how-to-play`
   - `AIFeatures.tsx` → Route: `/ai-features`
   - `Replays.tsx` → Route: `/replays`
   - `TechTree.tsx` → Route: `/tech-tree`
   - `MapGenerator.tsx` → Route: `/map-generator`
   - `CosmeticShop.tsx` → Route: `/shop`
   - `Checkout.tsx` → Route: `/checkout`
   - `BattlePass.tsx` → Route: `/battle-pass`
   - `NotFound.tsx` → Route: `*` (catch-all)

### Method 2: Routes Index
1. Open `src/routes/index.tsx`
2. This file lists all routes and their corresponding pages
3. Click on any import to jump to that page file

### Method 3: Search
1. Use Lovable's search (Cmd/Ctrl + P)
2. Type the page name (e.g., "Game", "Lobby", "About")
3. Select the file from results

## What Changed

1. **Created `src/routes/index.tsx`**
   - Centralized route exports
   - Makes all pages discoverable
   - Includes route metadata

2. **Updated `src/App.tsx`**
   - Now imports from `./routes` instead of inline lazy imports
   - Cleaner and more maintainable
   - Easier for Lovable to parse

## Tips for Lovable

- **File Explorer**: Always check `src/pages/` for all your pages
- **Quick Navigation**: Use `src/routes/index.tsx` as a route index
- **Search**: Use Cmd/Ctrl + P to quickly find any page
- **Route Comments**: Each page file can have a comment at the top indicating its route

## File Structure

```
src/
├── App.tsx              # Main app with router
├── routes/
│   └── index.tsx       # Route exports (helps Lovable discover pages)
└── pages/
    ├── Index.tsx        # Route: /
    ├── Game.tsx         # Route: /game
    ├── Lobby.tsx        # Route: /lobby
    ├── QuaternionGame.tsx # Route: /quaternion
    └── ... (all other pages)
```

## Still Having Issues?

If Lovable still doesn't show individual pages:

1. **Refresh Lovable**: Sometimes a refresh helps
2. **Check File Explorer**: Make sure the sidebar is expanded
3. **Use Search**: Cmd/Ctrl + P works reliably
4. **Direct Navigation**: Type the file path in Lovable's file navigator

The routes are now properly organized and should be discoverable in Lovable's interface!

