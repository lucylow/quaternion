/**
 * React Hook for Game API
 * Provides convenient hooks for game API interactions with state management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { gameApi } from '@/lib/api';
import type { CreateGameRequest, GameState } from '@/lib/api/types';

interface UseGameApiState {
  gameId: string | null;
  gameState: GameState | null;
  loading: boolean;
  error: string | null;
  isRunning: boolean;
}

interface UseGameApiReturn extends UseGameApiState {
  createGame: (request?: CreateGameRequest) => Promise<void>;
  startGame: () => Promise<void>;
  stopGame: () => Promise<void>;
  deleteGame: () => Promise<void>;
  refreshState: () => Promise<void>;
  moveUnits: (unitIds: string[], x: number, y: number) => Promise<void>;
  attackTarget: (unitIds: string[], targetId: string) => Promise<void>;
  gatherResources: (unitIds: string[], resourceId: string) => Promise<void>;
  buildUnit: (buildingId: string, unitType: string) => Promise<void>;
  buildBuilding: (playerId: number, buildingType: string, x: number, y: number) => Promise<void>;
  clearError: () => void;
}

export function useGameApi(
  autoPoll: boolean = true,
  pollInterval: number = 200
): UseGameApiReturn {
  const [state, setState] = useState<UseGameApiState>({
    gameId: null,
    gameState: null,
    loading: false,
    error: null,
    isRunning: false,
  });

  const pollIntervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start polling game state
   */
  const startPolling = useCallback(() => {
    if (!state.gameId || !autoPoll || state.isRunning) return;

    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Start polling
    pollIntervalRef.current = window.setInterval(async () => {
      if (!state.gameId) return;

      try {
        const gameState = await gameApi.getGameState(state.gameId);
        setState(prev => ({
          ...prev,
          gameState,
          isRunning: gameState.isRunning,
        }));
      } catch (error) {
        // Only log error, don't update state to avoid flickering
        console.error('Polling error:', error);
      }
    }, pollInterval);
  }, [state.gameId, autoPoll, state.isRunning, pollInterval]);

  /**
   * Stop polling game state
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Update polling when game state changes
   */
  useEffect(() => {
    if (state.isRunning && autoPoll) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [state.isRunning, autoPoll, startPolling, stopPolling]);

  /**
   * Create a new game
   */
  const createGame = useCallback(async (request?: CreateGameRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await gameApi.createGame(request);
      setState(prev => ({
        ...prev,
        gameId: response.gameId,
        gameState: response.state,
        loading: false,
        isRunning: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to create game',
      }));
      throw error;
    }
  }, []);

  /**
   * Start the game
   */
  const startGame = useCallback(async () => {
    if (!state.gameId) {
      throw new Error('No game ID available');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await gameApi.startGame(state.gameId);
      setState(prev => ({
        ...prev,
        gameState: response.state,
        loading: false,
        isRunning: true,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to start game',
      }));
      throw error;
    }
  }, [state.gameId]);

  /**
   * Stop the game
   */
  const stopGame = useCallback(async () => {
    if (!state.gameId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await gameApi.stopGame(state.gameId);
      setState(prev => ({
        ...prev,
        gameState: response.state,
        loading: false,
        isRunning: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to stop game',
      }));
      throw error;
    }
  }, [state.gameId]);

  /**
   * Delete the game
   */
  const deleteGame = useCallback(async () => {
    if (!state.gameId) return;

    stopPolling();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await gameApi.deleteGame(state.gameId);
      setState({
        gameId: null,
        gameState: null,
        loading: false,
        error: null,
        isRunning: false,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to delete game',
      }));
      throw error;
    }
  }, [state.gameId, stopPolling]);

  /**
   * Refresh game state manually
   */
  const refreshState = useCallback(async () => {
    if (!state.gameId) return;

    try {
      const gameState = await gameApi.getGameState(state.gameId);
      setState(prev => ({
        ...prev,
        gameState,
        isRunning: gameState.isRunning,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to refresh game state',
      }));
    }
  }, [state.gameId]);

  /**
   * Move units
   */
  const moveUnits = useCallback(
    async (unitIds: string[], x: number, y: number) => {
      if (!state.gameId) {
        throw new Error('No game ID available');
      }

      try {
        await gameApi.moveUnits(state.gameId, { unitIds, x, y });
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to move units',
        }));
        throw error;
      }
    },
    [state.gameId]
  );

  /**
   * Attack target
   */
  const attackTarget = useCallback(
    async (unitIds: string[], targetId: string) => {
      if (!state.gameId) {
        throw new Error('No game ID available');
      }

      try {
        await gameApi.attackTarget(state.gameId, { unitIds, targetId });
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to attack',
        }));
        throw error;
      }
    },
    [state.gameId]
  );

  /**
   * Gather resources
   */
  const gatherResources = useCallback(
    async (unitIds: string[], resourceId: string) => {
      if (!state.gameId) {
        throw new Error('No game ID available');
      }

      try {
        await gameApi.gatherResources(state.gameId, { unitIds, resourceId });
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to gather resources',
        }));
        throw error;
      }
    },
    [state.gameId]
  );

  /**
   * Build unit
   */
  const buildUnit = useCallback(
    async (buildingId: string, unitType: string) => {
      if (!state.gameId) {
        throw new Error('No game ID available');
      }

      try {
        await gameApi.buildUnit(state.gameId, { buildingId, unitType });
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to build unit',
        }));
        throw error;
      }
    },
    [state.gameId]
  );

  /**
   * Build building
   */
  const buildBuilding = useCallback(
    async (playerId: number, buildingType: string, x: number, y: number) => {
      if (!state.gameId) {
        throw new Error('No game ID available');
      }

      try {
        await gameApi.buildBuilding(state.gameId, { playerId, buildingType, x, y });
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to build building',
        }));
        throw error;
      }
    },
    [state.gameId]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    createGame,
    startGame,
    stopGame,
    deleteGame,
    refreshState,
    moveUnits,
    attackTarget,
    gatherResources,
    buildUnit,
    buildBuilding,
    clearError,
  };
}

