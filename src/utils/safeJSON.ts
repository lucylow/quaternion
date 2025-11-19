/**
 * Safe JSON Serialization Utilities
 * Handles circular references and Phaser objects
 */

export function safeStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (key, value) => {
    // Skip private properties (starting with _)
    if (typeof key === 'string' && key.startsWith('_')) {
      return undefined;
    }
    
    // Skip Phaser-specific properties
    if (key === 'scene' || key === 'game' || key === 'sys' || 
        key === 'context' || key === 'parent' || key === 'displayList') {
      return undefined;
    }
    
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    
    // Skip functions
    if (typeof value === 'function') {
      return undefined;
    }
    
    // Skip DOM elements
    if (value instanceof HTMLElement || value instanceof Node) {
      return '[HTMLElement]';
    }
    
    // Skip Phaser objects
    if (value && value.constructor) {
      const name = value.constructor.name;
      if (name.startsWith('Phaser') || name === 'Scene' || 
          name === 'Game' || name === 'Sprite' || name === 'Camera') {
        return `[${name}]`;
      }
    }
    
    return value;
  }, space);
}

export function safeParse<T = any>(jsonString: string, fallback?: T): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback !== undefined ? fallback : null;
  }
}

export function extractSerializableGameState(gameState: any): any {
  if (!gameState) return null;
  
  return {
    players: gameState.players ? 
      Array.from(gameState.players.entries()).map(([id, player]: [any, any]) => ({
        id,
        resources: player.resources,
        units: player.units?.length || 0,
        buildings: player.buildings?.length || 0,
        researchedTechs: player.researchedTechs ? 
          Array.from(player.researchedTechs) : [],
        moralAlignment: player.moralAlignment
      })) : [],
    gameTime: gameState.gameTime,
    isPaused: gameState.isPaused
  };
}

export function extractResourceSnapshot(resources: any): any {
  if (!resources) return {};
  
  return {
    ore: resources.ore || 0,
    energy: resources.energy || 0,
    biomass: resources.biomass || 0,
    data: resources.data || 0
  };
}