/**
 * API Module Exports
 * Central export point for all API-related functionality
 */

export { apiClient, default as defaultClient } from './client';
export { gameApi, default as defaultGameApi } from './gameApi';
export { replayApi, default as defaultReplayApi } from './replayApi';
export { roomsApi, default as defaultRoomsApi } from './roomsApi';
export { multiplayerApi, default as defaultMultiplayerApi } from './multiplayerApi';
export { monetizationApi, default as defaultMonetizationApi } from './monetizationApi';
export { ttsApi, default as defaultTtsApi } from './ttsApi';
export { API_CONFIG } from './config';
export type {
  // Game API Types
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
  // Replay API Types
  GenerateReplayRequest,
  ReplayMetadata,
  ReplayResponse,
  // Rooms API Types
  Room,
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  ListRoomsResponse,
  LeaveRoomRequest,
  StartRoomRequest,
  // Multiplayer API Types
  CreateMultiplayerGameRequest,
  CreateMultiplayerGameResponse,
  JoinMultiplayerGameRequest,
  JoinMultiplayerGameResponse,
  MultiplayerGameInfo,
  MultiplayerGameStateResponse,
  MatchmakeRequest,
  MatchmakeResponse,
  // Monetization API Types
  Cosmetic,
  CosmeticsResponse,
  PurchaseCosmeticRequest,
  PurchaseCosmeticResponse,
  ConfirmCosmeticPurchaseRequest,
  ConfirmCosmeticPurchaseResponse,
  BattlePass,
  BattlePassesResponse,
  PurchaseBattlePassRequest,
  PurchaseBattlePassResponse,
  ActivateBattlePassRequest,
  ActivateBattlePassResponse,
  BattlePassProgress,
  BattlePassProgressResponse,
  SeasonalPassPurchaseRequest,
  SeasonalPassPurchaseResponse,
  SeasonalPassActivateRequest,
  SeasonalPassActivateResponse,
  CoachingOption,
  CoachingOptionsResponse,
  BookCoachingRequest,
  BookCoachingResponse,
  ConfirmCoachingBookingRequest,
  ConfirmCoachingBookingResponse,
  Tournament,
  TournamentsResponse,
  EnterTournamentRequest,
  EnterTournamentResponse,
  ConfirmTournamentEntryRequest,
  ConfirmTournamentEntryResponse,
  SubscriptionStatusResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  InitCustomerRequest,
  InitCustomerResponse,
  // TTS API Types
  TTSRequest,
  TTSResponse,
  // Common Types
  ApiError,
  RequestConfig,
  ResponseWrapper,
} from './types';

