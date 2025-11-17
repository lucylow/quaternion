/**
 * Game API Client
 * Type-safe methods for interacting with the game backend
 */

import { apiClient } from './client';
import type {
  CreateGameRequest,
  CreateGameResponse,
  GameStateResponse,
  GameCommandResponse,
  MoveCommandRequest,
  AttackCommandRequest,
  GatherCommandRequest,
  BuildUnitCommandRequest,
  BuildBuildingCommandRequest,
  GenericCommandRequest,
  GameState,
} from './types';

class GameApi {
  /**
   * Create a new game
   */
  async createGame(request: CreateGameRequest = {}): Promise<CreateGameResponse> {
    const response = await apiClient.post<CreateGameResponse>('/game/create', request);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create game');
    }
    
    return response.data;
  }

  /**
   * Start a game
   */
  async startGame(gameId: string): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/game/${gameId}/start`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to start game');
    }
    
    return response.data;
  }

  /**
   * Stop a game
   */
  async stopGame(gameId: string): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/game/${gameId}/stop`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to stop game');
    }
    
    return response.data;
  }

  /**
   * Get current game state
   */
  async getGameState(gameId: string, playerId?: number): Promise<GameState> {
    const params = playerId ? `?playerId=${playerId}` : '';
    const response = await apiClient.get<GameStateResponse>(`/game/${gameId}/state${params}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get game state');
    }
    
    return response.data.state;
  }

  /**
   * Get map data
   */
  async getMap(gameId: string): Promise<any> {
    const response = await apiClient.get<{ success: boolean; map: any; error?: string }>(
      `/game/${gameId}/map`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get map');
    }
    
    return response.data.map;
  }

  /**
   * Move units
   */
  async moveUnits(gameId: string, command: MoveCommandRequest): Promise<GameCommandResponse> {
    const response = await apiClient.post<GameCommandResponse>(
      `/game/${gameId}/move`,
      command
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to move units');
    }
    
    return response.data;
  }

  /**
   * Attack target
   */
  async attackTarget(gameId: string, command: AttackCommandRequest): Promise<GameCommandResponse> {
    const response = await apiClient.post<GameCommandResponse>(
      `/game/${gameId}/attack`,
      command
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to attack');
    }
    
    return response.data;
  }

  /**
   * Gather resources
   */
  async gatherResources(gameId: string, command: GatherCommandRequest): Promise<GameCommandResponse> {
    const response = await apiClient.post<GameCommandResponse>(
      `/game/${gameId}/gather`,
      command
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to gather resources');
    }
    
    return response.data;
  }

  /**
   * Build unit
   */
  async buildUnit(gameId: string, command: BuildUnitCommandRequest): Promise<GameCommandResponse> {
    const response = await apiClient.post<GameCommandResponse>(
      `/game/${gameId}/build-unit`,
      command
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to build unit');
    }
    
    return response.data;
  }

  /**
   * Build building
   */
  async buildBuilding(
    gameId: string,
    command: BuildBuildingCommandRequest
  ): Promise<GameCommandResponse> {
    const response = await apiClient.post<GameCommandResponse>(
      `/game/${gameId}/build-building`,
      command
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to build building');
    }
    
    return response.data;
  }

  /**
   * Send generic command
   */
  async sendCommand(gameId: string, command: GenericCommandRequest): Promise<GameCommandResponse> {
    const response = await apiClient.post<GameCommandResponse>(
      `/game/${gameId}/command`,
      command
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to send command');
    }
    
    return response.data;
  }

  /**
   * Delete game
   */
  async deleteGame(gameId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string; error?: string }>(
      `/game/${gameId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete game');
    }
    
    return response.data;
  }

  /**
   * List all games
   */
  async listGames(): Promise<Array<{ id: string; tick: number; isRunning: boolean; playerCount: number }>> {
    const response = await apiClient.get<{
      success: boolean;
      games: Array<{ id: string; tick: number; isRunning: boolean; playerCount: number }>;
    }>('/games');
    
    if (!response.data.success) {
      throw new Error('Failed to list games');
    }
    
    return response.data.games;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    const response = await apiClient.get<{ status: string; timestamp: number }>('/health');
    return response.data;
  }
}

// Export singleton instance
export const gameApi = new GameApi();
export default gameApi;

