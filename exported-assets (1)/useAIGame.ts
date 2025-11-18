// hooks/useAIGame.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import AIGameService, { GameState, AIAnalytics, Unit, Building } from './aiGameService';
import type { CommanderArchetype } from '@/ai/opponents/AICommanderArchetypes';

export interface UseAIGameConfig {
  baseURL?: string;
  pollInterval?: number;
  autoStart?: boolean;
  analyticsPollInterval?: number;
}

export interface UseAIGameReturn {
  // State
  gameState: GameState | null;
  aiAnalytics: AIAnalytics | null;
  isLoading: boolean;
  error: Error | null;
  isGameActive: boolean;

  // Game controls
  initializeGame: (width?: number, height?: number, difficulty?: 'easy' | 'medium' | 'hard', commanderArchetype?: CommanderArchetype) => Promise<void>;
  startGame: () => Promise<void>;
  stopGame: () => Promise<void>;

  // Unit commands
  moveUnits: (unitIds: string[], x: number, y: number) => Promise<void>;
  attackUnit: (unitIds: string[], targetId: string) => Promise<void>;
  gatherResources: (unitIds: string[], resourceId: string) => Promise<void>;
  buildUnit: (buildingId: string, unitType: string) => Promise<void>;
  buildBuilding: (playerId: number, buildingType: string, x: number, y: number) => Promise<void>;

  // Utilities
  getGameId: () => string | null;
  setGameId: (gameId: string) => void;
}

export const useAIGame = (config: UseAIGameConfig = {}): UseAIGameReturn => {
  const { 
    baseURL = 'http://localhost:3000', 
    pollInterval = 100, 
    autoStart = false,
    analyticsPollInterval = 1000 
  } = config;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [aiAnalytics, setAiAnalytics] = useState<AIAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);

  const serviceRef = useRef<AIGameService | null>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new AIGameService(baseURL);
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.stopPolling();
      }
      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current);
      }
    };
  }, [baseURL]);

  const handleStateUpdate = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  // Poll for AI analytics periodically
  const pollAnalytics = useCallback(async () => {
    if (!serviceRef.current || !isGameActive) return;
    
    try {
      const analytics = await serviceRef.current.getAIAnalytics();
      setAiAnalytics(analytics);
    } catch (err) {
      // Silently fail analytics polling to avoid spam
      console.warn('Failed to poll AI analytics:', err);
    }
  }, [isGameActive]);

  // Set up analytics polling when game is active
  useEffect(() => {
    if (isGameActive) {
      // Poll immediately
      pollAnalytics();
      
      // Then poll periodically
      analyticsIntervalRef.current = setInterval(pollAnalytics, analyticsPollInterval);
    } else {
      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current);
        analyticsIntervalRef.current = null;
      }
    }

    return () => {
      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current);
      }
    };
  }, [isGameActive, pollAnalytics, analyticsPollInterval]);

  const initializeGame = useCallback(
    async (width = 64, height = 64, difficulty: 'easy' | 'medium' | 'hard' = 'medium', commanderArchetype?: CommanderArchetype) => {
      if (!serviceRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        const { gameId, state } = await serviceRef.current.createGame(width, height, difficulty, commanderArchetype);
        setGameState(state);
        setIsGameActive(true);

        // Start polling
        await serviceRef.current.pollGameState(handleStateUpdate, pollInterval);

        // Fetch initial analytics
        const analytics = await serviceRef.current.getAIAnalytics();
        setAiAnalytics(analytics);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [pollInterval, handleStateUpdate]
  );

  const startGame = useCallback(async () => {
    if (!serviceRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      await serviceRef.current.startGame();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopGame = useCallback(async () => {
    if (!serviceRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      await serviceRef.current.stopGame();
      serviceRef.current.stopPolling();
      setGameState(null);
      setAiAnalytics(null);
      setIsGameActive(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const moveUnits = useCallback(
    async (unitIds: string[], x: number, y: number) => {
      if (!serviceRef.current) return;
      try {
        await serviceRef.current.moveUnits(unitIds, x, y);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      }
    },
    []
  );

  const attackUnit = useCallback(
    async (unitIds: string[], targetId: string) => {
      if (!serviceRef.current) return;
      try {
        await serviceRef.current.attackUnit(unitIds, targetId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      }
    },
    []
  );

  const gatherResources = useCallback(
    async (unitIds: string[], resourceId: string) => {
      if (!serviceRef.current) return;
      try {
        await serviceRef.current.gatherResources(unitIds, resourceId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      }
    },
    []
  );

  const buildUnit = useCallback(
    async (buildingId: string, unitType: string) => {
      if (!serviceRef.current) return;
      try {
        await serviceRef.current.buildUnit(buildingId, unitType);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      }
    },
    []
  );

  const buildBuilding = useCallback(
    async (playerId: number, buildingType: string, x: number, y: number) => {
      if (!serviceRef.current) return;
      try {
        await serviceRef.current.buildBuilding(playerId, buildingType, x, y);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      }
    },
    []
  );

  const getGameId = useCallback(() => {
    return serviceRef.current?.getGameId() || null;
  }, []);

  const setGameId = useCallback((gameId: string) => {
    if (serviceRef.current) {
      serviceRef.current.setGameId(gameId);
    }
  }, []);

  // Fetch analytics periodically
  useEffect(() => {
    if (!isGameActive || !serviceRef.current) return;

    const analyticsInterval = setInterval(async () => {
      try {
        const analytics = await serviceRef.current!.getAIAnalytics();
        setAiAnalytics(analytics);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      }
    }, 1000);

    return () => clearInterval(analyticsInterval);
  }, [isGameActive]);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart && !isGameActive && !isLoading) {
      initializeGame();
    }
  }, [autoStart, isGameActive, isLoading, initializeGame]);

  return {
    gameState,
    aiAnalytics,
    isLoading,
    error,
    isGameActive,
    initializeGame,
    startGame,
    stopGame,
    moveUnits,
    attackUnit,
    gatherResources,
    buildUnit,
    buildBuilding,
    getGameId,
    setGameId,
  };
};

// Hook for managing AI configuration and strategy
export interface AIStrategyConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  aggressiveness: number;
  defensiveness: number;
  expansionRate: number;
}

export const useAIStrategy = (initialConfig?: AIStrategyConfig) => {
  const [config, setConfig] = useState<AIStrategyConfig>(
    initialConfig || {
      difficulty: 'medium',
      aggressiveness: 50,
      defensiveness: 50,
      expansionRate: 50,
    }
  );

  const updateDifficulty = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    setConfig(prev => {
      const difficultyMap: Record<string, Omit<AIStrategyConfig, 'difficulty'>> = {
        easy: { aggressiveness: 30, defensiveness: 70, expansionRate: 40 },
        medium: { aggressiveness: 50, defensiveness: 50, expansionRate: 50 },
        hard: { aggressiveness: 80, defensiveness: 40, expansionRate: 75 },
      };

      return {
        difficulty,
        ...difficultyMap[difficulty],
      };
    });
  }, []);

  const updateAggressiveness = useCallback((value: number) => {
    setConfig(prev => ({
      ...prev,
      aggressiveness: Math.max(0, Math.min(100, value)),
    }));
  }, []);

  const updateDefensiveness = useCallback((value: number) => {
    setConfig(prev => ({
      ...prev,
      defensiveness: Math.max(0, Math.min(100, value)),
    }));
  }, []);

  const updateExpansionRate = useCallback((value: number) => {
    setConfig(prev => ({
      ...prev,
      expansionRate: Math.max(0, Math.min(100, value)),
    }));
  }, []);

  const reset = useCallback(() => {
    setConfig({
      difficulty: 'medium',
      aggressiveness: 50,
      defensiveness: 50,
      expansionRate: 50,
    });
  }, []);

  return {
    config,
    updateDifficulty,
    updateAggressiveness,
    updateDefensiveness,
    updateExpansionRate,
    reset,
  };
};