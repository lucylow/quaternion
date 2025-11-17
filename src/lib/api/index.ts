/**
 * API Module Exports
 * Central export point for all API-related functionality
 */

export { apiClient, default as defaultClient } from './client';
export { gameApi, default as defaultGameApi } from './gameApi';
export { API_CONFIG } from './config';
export type {
  CreateGameRequest,
  CreateGameResponse,
  GameState,
  GameStateResponse,
  GameCommandResponse,
  MoveCommandRequest,
  AttackCommandRequest,
  GatherCommandRequest,
  BuildUnitCommandRequest,
  BuildBuildingCommandRequest,
  GenericCommandRequest,
  ApiError,
  RequestConfig,
  ResponseWrapper,
} from './types';

