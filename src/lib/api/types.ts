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

// Replay API Types
export interface GenerateReplayRequest {
  seed: number;
  mapConfig: {
    type?: string;
    width?: number;
    height?: number;
    resourceDensity?: string;
  };
  commanderId: string;
  mode?: 'fast' | 'full';
}

export interface ReplayMetadata {
  replayId: string;
  url?: string;
  summary?: string;
  aiHighlights?: Array<{
    t: number;
    actor: string;
    action: string;
    reason: string;
  }>;
  partial?: boolean;
}

export interface ReplayResponse {
  replayId: string;
  url?: string;
  summary?: string;
  aiHighlights?: Array<{
    t: number;
    actor: string;
    action: string;
    reason: string;
  }>;
  partial?: boolean;
  message?: string;
  errorId?: string;
}

// Rooms API Types
export interface Room {
  id: string;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'in-progress';
  mapType: string;
  mapWidth?: number;
  mapHeight?: number;
  cooperativeMode?: boolean;
  seed?: number;
  difficulty?: string;
  createdAt: string;
  playersList?: Array<{
    id: string;
    commanderId: string;
    quaternionAxis?: string | null;
    joinedAt: string;
    isHost: boolean;
  }>;
  assignedAxes?: Record<string, string>;
}

export interface CreateRoomRequest {
  name: string;
  mapType: string;
  mapWidth?: number;
  mapHeight?: number;
  commanderId?: string;
  cooperativeMode?: boolean;
  quaternionAxis?: string;
  seed?: number;
  difficulty?: string;
}

export interface CreateRoomResponse {
  roomId: string;
  playerId: string;
  room: Room;
}

export interface JoinRoomRequest {
  commanderId?: string;
  quaternionAxis?: string;
  playerId?: string;
}

export interface JoinRoomResponse {
  roomId: string;
  playerId: string;
  room: Room;
}

export interface ListRoomsResponse {
  rooms: Room[];
}

export interface LeaveRoomRequest {
  playerId: string;
}

export interface StartRoomRequest {
  playerId: string;
}

// Multiplayer API Types
export interface CreateMultiplayerGameRequest {
  playerId: string;
  gameType: 'pvp' | 'pve' | 'ffa';
  mapSize?: number;
  difficulty?: string;
}

export interface CreateMultiplayerGameResponse {
  gameId: string;
  status: string;
  joinCode: string;
}

export interface JoinMultiplayerGameRequest {
  playerId: string;
  gameId: string;
}

export interface JoinMultiplayerGameResponse {
  gameId: string;
  status: string;
  playerSlot: number;
}

export interface MultiplayerGameInfo {
  gameId: string;
  gameType: string;
  playersCount: number;
  maxPlayers: number;
  difficulty?: string;
  mapSize?: number;
}

export interface MultiplayerGameStateResponse {
  gameState: any;
  players: Array<{
    playerId: string;
    slot: number;
    resources: any;
    supply: number;
  }>;
}

export interface MatchmakeRequest {
  playerId: string;
  gameType: 'pvp' | 'pve' | 'ffa';
  difficulty?: string;
}

export interface MatchmakeResponse {
  gameId?: string;
  status: 'matched' | 'queued';
  message?: string;
  queuePosition?: number;
}

// Monetization API Types
export interface Cosmetic {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rarity: string;
  preview: string;
  image?: string;
  tags?: string[];
}

export interface CosmeticsResponse {
  cosmetics: Cosmetic[];
}

export interface PurchaseCosmeticRequest {
  playerId: string;
  cosmeticId: string;
}

export interface PurchaseCosmeticResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  cosmeticId: string;
}

export interface ConfirmCosmeticPurchaseRequest {
  playerId: string;
  paymentIntentId: string;
}

export interface ConfirmCosmeticPurchaseResponse {
  success: boolean;
  cosmetic: string;
  message: string;
  transactionId: string;
}

export interface BattlePass {
  id: string;
  name: string;
  price: number;
  duration: string;
  rewards: number;
  description: string;
  benefits: string[];
}

export interface BattlePassesResponse {
  battlePasses: BattlePass[];
}

export interface PurchaseBattlePassRequest {
  playerId: string;
  passType: string;
}

export interface PurchaseBattlePassResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  passType: string;
}

export interface ActivateBattlePassRequest {
  playerId: string;
  paymentIntentId: string;
  passType: string;
}

export interface ActivateBattlePassResponse {
  success: boolean;
  passType: string;
  activatedAt: string;
  expiresAt: string;
  rewards: number;
  message: string;
}

export interface BattlePassProgress {
  passType: string;
  progress: number;
  totalRewards: number;
  rewards: Array<{
    id: string;
    level: number;
    reward_type: string;
    reward_id: string;
    claimed: boolean;
    claimed_at?: string;
  }>;
  expiresAt: string;
}

export interface BattlePassProgressResponse {
  progress: BattlePassProgress | null;
}

export interface SeasonalPassPurchaseRequest {
  playerId: string;
  season: string;
}

export interface SeasonalPassPurchaseResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  season: string;
}

export interface SeasonalPassActivateRequest {
  playerId: string;
  paymentIntentId: string;
  season: string;
}

export interface SeasonalPassActivateResponse {
  success: boolean;
  season: string;
  nftBadge: {
    contractAddress: string;
    tokenId: string;
    metadata: any;
  };
  message: string;
}

export interface CoachingOption {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  includes: string[];
}

export interface CoachingOptionsResponse {
  coachingOptions: CoachingOption[];
}

export interface BookCoachingRequest {
  playerId: string;
  coachingPackage: string;
  preferredTime?: string;
}

export interface BookCoachingResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  coachingPackage: string;
  preferredTime?: string;
}

export interface ConfirmCoachingBookingRequest {
  playerId: string;
  paymentIntentId: string;
  coachingPackage: string;
  preferredTime?: string;
}

export interface ConfirmCoachingBookingResponse {
  success: boolean;
  bookingId: string;
  coachId: string;
  scheduledTime: string;
  joinUrl: string;
  message: string;
}

export interface Tournament {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  participants: number;
  schedule: string;
  tier: string;
  rewards: Array<{
    place: number;
    prize: number;
  }>;
}

export interface TournamentsResponse {
  tournaments: Tournament[];
}

export interface EnterTournamentRequest {
  playerId: string;
  tournamentId: string;
}

export interface EnterTournamentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  tournamentId: string;
}

export interface ConfirmTournamentEntryRequest {
  playerId: string;
  paymentIntentId: string;
  tournamentId: string;
}

export interface ConfirmTournamentEntryResponse {
  success: boolean;
  tournamentId: string;
  registrationId: string;
  bracket: any;
  startTime: string;
  message: string;
}

export interface SubscriptionStatusResponse {
  customerId: string;
  email: string;
  activeSubscriptions: any[];
  pastInvoices: any[];
}

export interface CancelSubscriptionRequest {
  subscriptionId: string;
  playerId: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  subscriptionId: string;
  status: string;
  cancelledAt: string;
}

export interface InitCustomerRequest {
  playerId: string;
  email: string;
  username: string;
}

export interface InitCustomerResponse {
  success: boolean;
  stripeCustomerId: string;
  message: string;
}

// TTS API Types
export interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  pitch?: number;
}

export interface TTSResponse {
  audioUrl: string;
  duration?: number;
}

