/**
 * React Hook for Narrative Generation
 * Provides easy access to narrative generation with React Query integration
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { narrativeApi } from '../lib/api/narrativeApi';
import type { CommanderProfile } from '../ai/opponents/AICommanderArchetypes';
import type { 
  NarrativeContext, 
  CommanderNarrative, 
  BattleIntro 
} from '../services/NarrativeGenerationService';

export interface UseNarrativeGenerationOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
}

/**
 * Hook for generating battle intros
 */
export function useBattleIntro(options: UseNarrativeGenerationOptions = {}) {
  return useMutation({
    mutationFn: async (params: {
      commanderProfile: CommanderProfile;
      opponentProfile: CommanderProfile;
      mapTheme?: string;
    }) => {
      return narrativeApi.generateBattleIntro(params);
    },
    onError: (error) => {
      console.error('Failed to generate battle intro:', error);
    },
  });
}

/**
 * Hook for generating dialogue
 */
export function useDialogueGeneration(options: UseNarrativeGenerationOptions = {}) {
  return useMutation({
    mutationFn: async (params: {
      commanderProfile: CommanderProfile;
      context?: Partial<NarrativeContext>;
    }) => {
      return narrativeApi.generateDialogue(params.commanderProfile, params.context);
    },
    onError: (error) => {
      console.error('Failed to generate dialogue:', error);
    },
  });
}

/**
 * Hook for generating taunts
 */
export function useTauntGeneration(options: UseNarrativeGenerationOptions = {}) {
  return useMutation({
    mutationFn: async (params: {
      commanderProfile: CommanderProfile;
      context?: Partial<NarrativeContext>;
    }) => {
      return narrativeApi.generateTaunt(params.commanderProfile, params.context);
    },
    onError: (error) => {
      console.error('Failed to generate taunt:', error);
    },
  });
}

/**
 * Hook for generating strategy comments
 */
export function useStrategyComment(options: UseNarrativeGenerationOptions = {}) {
  return useMutation({
    mutationFn: async (params: {
      commanderProfile: CommanderProfile;
      strategy: string;
      gameState?: NarrativeContext['gameState'];
    }) => {
      return narrativeApi.generateStrategyComment(
        params.commanderProfile,
        params.strategy,
        params.gameState
      );
    },
    onError: (error) => {
      console.error('Failed to generate strategy comment:', error);
    },
  });
}

/**
 * Hook for generating battle outcomes
 */
export function useBattleOutcome(options: UseNarrativeGenerationOptions = {}) {
  return useMutation({
    mutationFn: async (params: {
      commanderProfile: CommanderProfile;
      outcome: 'victory' | 'defeat';
      opponentProfile?: CommanderProfile;
    }) => {
      return narrativeApi.generateBattleOutcome(
        params.commanderProfile,
        params.outcome,
        params.opponentProfile
      );
    },
    onError: (error) => {
      console.error('Failed to generate battle outcome:', error);
    },
  });
}

/**
 * Hook for general narrative generation
 */
export function useNarrativeGeneration(options: UseNarrativeGenerationOptions = {}) {
  return useMutation({
    mutationFn: async (params: {
      commanderProfile: CommanderProfile;
      context?: Partial<NarrativeContext>;
      narrativeType?: CommanderNarrative['type'];
      options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
      };
    }) => {
      return narrativeApi.generateNarrative({
        commanderProfile: params.commanderProfile,
        context: params.context as NarrativeContext,
        narrativeType: params.narrativeType,
        options: params.options
      });
    },
    onError: (error) => {
      console.error('Failed to generate narrative:', error);
    },
  });
}

