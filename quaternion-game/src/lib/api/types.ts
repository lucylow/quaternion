/**
 * API Type Definitions
 * Type-safe interfaces for all API requests and responses
 */

// Game API Types
export interface CreateGameRequest {
  mapWidth?: number;
  mapHeight?: number;
  seed?: number;
  aiDifficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  mapType?: string;
  commanderId?: string;
}

export interface GameState {
  id: string;
  tick: number;
  isRunning: boolean;
  players: Array<{
    id: number;
    resources: {
      ore?: number;
      energy?: number;
      biomass?: number;
      matter?: number;
      life?: number;
      knowledge?: number;
    };
    units: any[];
    buildings: any[];
    population: {
      current: number;
      max: number;
    };
  }>;
  map: any;
  seed: number;
  gameTime: number;
  commanderId?: string;
}

export interface CreateGameResponse {
  success: boolean;
  gameId: string;
  state: GameState;
  error?: string;
}

export interface GameStateResponse {
  success: boolean;
  state: GameState;
  error?: string;
}

export interface GameCommandResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Move Command
export interface MoveCommandRequest {
  unitIds: string[];
  x: number;
  y: number;
}

// Attack Command
export interface AttackCommandRequest {
  unitIds: string[];
  targetId: string;
}

// Gather Command
export interface GatherCommandRequest {
  unitIds: string[];
  resourceId: string;
}

// Build Unit Command
export interface BuildUnitCommandRequest {
  buildingId: string;
  unitType: string;
}

// Build Building Command
export interface BuildBuildingCommandRequest {
  playerId: number;
  buildingType: string;
  x: number;
  y: number;
}

// Generic Command Request
export interface GenericCommandRequest {
  type: string;
  [key: string]: any;
}

// API Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// HTTP Client Types
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

export interface ResponseWrapper<T> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

