/**
 * Multiplayer API Client
 * Type-safe methods for interacting with the multiplayer game backend
 */

import { apiClient } from './client';
import type {
  CreateMultiplayerGameRequest,
  CreateMultiplayerGameResponse,
  JoinMultiplayerGameRequest,
  JoinMultiplayerGameResponse,
  MultiplayerGameInfo,
  MultiplayerGameStateResponse,
  MatchmakeRequest,
  MatchmakeResponse,
} from './types';

class MultiplayerApi {
  /**
   * Create a new multiplayer game
   */
  async createGame(request: CreateMultiplayerGameRequest): Promise<CreateMultiplayerGameResponse> {
    const response = await apiClient.post<CreateMultiplayerGameResponse>(
      '/multiplayer/create',
      request
    );
    return response.data;
  }

  /**
   * Join an existing multiplayer game
   */
  async joinGame(request: JoinMultiplayerGameRequest): Promise<JoinMultiplayerGameResponse> {
    const response = await apiClient.post<JoinMultiplayerGameResponse>(
      '/multiplayer/join',
      request
    );
    return response.data;
  }

  /**
   * List available multiplayer games
   */
  async listGames(): Promise<MultiplayerGameInfo[]> {
    const response = await apiClient.get<MultiplayerGameInfo[]>('/multiplayer/games');
    return response.data;
  }

  /**
   * Get multiplayer game state
   */
  async getGameState(gameId: string): Promise<MultiplayerGameStateResponse> {
    const response = await apiClient.get<MultiplayerGameStateResponse>(
      `/multiplayer/game/${gameId}/state`
    );
    return response.data;
  }

  /**
   * Get multiplayer game replay
   */
  async getGameReplay(gameId: string): Promise<any> {
    const response = await apiClient.get<any>(`/multiplayer/game/${gameId}/replay`);
    return response.data;
  }

  /**
   * Matchmake for a game
   */
  async matchmake(request: MatchmakeRequest): Promise<MatchmakeResponse> {
    const response = await apiClient.post<MatchmakeResponse>(
      '/multiplayer/matchmake',
      request
    );
    return response.data;
  }
}

// Export singleton instance
export const multiplayerApi = new MultiplayerApi();
export default multiplayerApi;

