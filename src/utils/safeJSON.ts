/**
 * Safe JSON Serialization Utilities
 * Handles circular references and Phaser objects
 */

/**
 * Safely stringify objects with circular references
 */
export function safeStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (key, value) => {
    // Skip Phaser-specific properties that cause circular references
    if (key === 'scene' || key === 'game' || key === 'sys' || 
        key === '_events' || key === 'context' || key === 'parent' ||
        key === 'displayList' || key === 'updateList' || key === 'cameras') {
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
    
    // Skip Phaser objects by checking constructor name
    if (value && value.constructor) {
      const constructorName = value.constructor.name;
      if (constructorName.startsWith('Phaser') || 
          constructorName === 'Scene' || 
          constructorName === 'Game' ||
          constructorName === 'Sprite' ||
          constructorName === 'Camera') {
        return `[${constructorName}]`;
      }
    }
    
    return value;
  }, space);
}

/**
 * Safely parse JSON with error handling
 */
export function safeParse<T = any>(jsonString: string, fallback?: T): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback !== undefined ? fallback : null;
  }
}

/**
 * Extract only serializable data from game state
 */
export function extractSerializableGameState(gameState: any): any {
  if (!gameState) return null;
  
  return {
    players: gameState.players ? Array.from(gameState.players.entries()).map(([id, player]: [any, any]) => ({
      id,
      resources: player.resources,
      units: player.units?.length || 0,
      buildings: player.buildings?.length || 0,
      researchedTechs: player.researchedTechs ? Array.from(player.researchedTechs) : [],
      moralAlignment: player.moralAlignment
    })) : [],
    gameTime: gameState.gameTime,
    isPaused: gameState.isPaused,
    // Add other safe properties as needed
  };
}

/**
 * Create a safe snapshot of resources
 */
export function extractResourceSnapshot(resources: any): any {
  if (!resources) return {};
  
  return {
    ore: resources.ore || 0,
    energy: resources.energy || 0,
    biomass: resources.biomass || 0,
    data: resources.data || 0
  };
}

