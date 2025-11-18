// src/routes/index.tsx
// This file helps Lovable discover all your routes

import { lazy } from "react";

// Import all pages - this helps Lovable's file explorer find them
export { default as Index } from "../pages/Index";
export { default as Game } from "../pages/Game";
export { default as QuaternionGame } from "../pages/QuaternionGame";
export { default as Lobby } from "../pages/Lobby";
export { default as About } from "../pages/About";
export { default as Commanders } from "../pages/Commanders";
export { default as HowToPlay } from "../pages/HowToPlay";
export { default as AIFeatures } from "../pages/AIFeatures";
export { default as Replays } from "../pages/Replays";
export { default as TechTree } from "../pages/TechTree";
export { default as MapGenerator } from "../pages/MapGenerator";
export { default as CosmeticShop } from "../pages/CosmeticShop";
export { default as Checkout } from "../pages/Checkout";
export { default as BattlePass } from "../pages/BattlePass";
export { default as SimpleGame } from "../pages/SimpleGame";
export { default as NotFound } from "../pages/NotFound";

// Lazy loaded versions for App.tsx
// These are used in App.tsx for code splitting and better performance
export const LazyGame = lazy(() => import("../pages/Game"));
export const LazyQuaternionGame = lazy(() => import("../pages/QuaternionGame"));
export const LazyLobby = lazy(() => import("../pages/Lobby"));
export const LazyAbout = lazy(() => import("../pages/About"));
export const LazyCommanders = lazy(() => import("../pages/Commanders"));
export const LazyHowToPlay = lazy(() => import("../pages/HowToPlay"));
export const LazyAIFeatures = lazy(() => import("../pages/AIFeatures"));
export const LazyReplays = lazy(() => import("../pages/Replays"));
export const LazyTechTree = lazy(() => import("../pages/TechTree"));
export const LazyMapGenerator = lazy(() => import("../pages/MapGenerator"));
export const LazyCosmeticShop = lazy(() => import("../pages/CosmeticShop"));
export const LazyCheckout = lazy(() => import("../pages/Checkout"));
export const LazyBattlePass = lazy(() => import("../pages/BattlePass"));
export const LazySimpleGame = lazy(() => import("../pages/SimpleGame"));
export const LazyNotFound = lazy(() => import("../pages/NotFound"));

// Route configuration for Lovable
export const routes = [
  { path: "/", name: "Home", component: "Index" },
  { path: "/game", name: "Game", component: "QuaternionGame" },
  { path: "/game/neural-frontier", name: "Neural Frontier", component: "QuaternionGame" },
  { path: "/lobby", name: "Lobby", component: "Lobby" },
  { path: "/quaternion", name: "Quaternion Game (Redirect)", component: "QuaternionGame" }, // Deprecated: redirects to /game
  { path: "/about", name: "About", component: "About" },
  { path: "/commanders", name: "Commanders", component: "Commanders" },
  { path: "/how-to-play", name: "How to Play", component: "HowToPlay" },
  { path: "/ai-features", name: "AI Features", component: "AIFeatures" },
  { path: "/replays", name: "Replays", component: "Replays" },
  { path: "/tech-tree", name: "Tech Tree", component: "TechTree" },
  { path: "/map-generator", name: "Map Generator", component: "MapGenerator" },
  { path: "/shop", name: "Cosmetic Shop", component: "CosmeticShop" },
  { path: "/checkout", name: "Checkout", component: "Checkout" },
  { path: "/battle-pass", name: "Battle Pass", component: "BattlePass" },
  { path: "/simple-game", name: "Simple Game", component: "SimpleGame" },
];

/**
 * All lazy-loaded components for Lovable discovery
 * This ensures all dynamically imported modules are discoverable
 */
export const lazyComponents = {
  LazyGame,
  LazyQuaternionGame,
  LazyLobby,
  LazyAbout,
  LazyCommanders,
  LazyHowToPlay,
  LazyAIFeatures,
  LazyReplays,
  LazyTechTree,
  LazyMapGenerator,
  LazyCosmeticShop,
  LazyCheckout,
  LazyBattlePass,
  LazySimpleGame,
  LazyNotFound,
};

/**
 * Preload all lazy-loaded modules
 * This function ensures all dynamically imported modules are downloaded
 * Useful for ensuring Lovable can discover and analyze all routes
 */
export async function preloadAllLazyModules(): Promise<void> {
  const imports = [
    import("../pages/Game"),
    import("../pages/QuaternionGame"),
    import("../pages/Lobby"),
    import("../pages/About"),
    import("../pages/Commanders"),
    import("../pages/HowToPlay"),
    import("../pages/AIFeatures"),
    import("../pages/Replays"),
    import("../pages/TechTree"),
    import("../pages/MapGenerator"),
    import("../pages/CosmeticShop"),
    import("../pages/Checkout"),
    import("../pages/BattlePass"),
    import("../pages/SimpleGame"),
    import("../pages/NotFound"),
  ];

  await Promise.all(imports);
}

/**
 * All dynamic import paths for Lovable discovery
 * This array helps Lovable find all dynamically imported modules
 */
export const dynamicImportPaths = [
  "../pages/Game",
  "../pages/QuaternionGame",
  "../pages/Lobby",
  "../pages/About",
  "../pages/Commanders",
  "../pages/HowToPlay",
  "../pages/AIFeatures",
  "../pages/Replays",
  "../pages/TechTree",
  "../pages/MapGenerator",
  "../pages/CosmeticShop",
  "../pages/Checkout",
  "../pages/BattlePass",
  "../pages/SimpleGame",
  "../pages/NotFound",
] as const;

