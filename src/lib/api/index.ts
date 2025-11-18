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

// Art Generation API
export {
  artGenerationService,
  ImagineArtService,
  DreaminaService,
  ArtGenerationService,
} from './artGeneration';
export type {
  ArtGenerationRequest,
  ArtGenerationResponse,
  TextureGenerationRequest,
  BatchArtGenerationRequest,
  BatchArtGenerationResponse,
} from './artGeneration';

// Narrative Generation API
export { narrativeApi, default as defaultNarrativeApi } from './narrativeApi';
export type {
  GenerateNarrativeRequest,
  GenerateNarrativeResponse,
  GenerateBattleIntroRequest,
  GenerateBattleIntroResponse,
} from './narrativeApi';

