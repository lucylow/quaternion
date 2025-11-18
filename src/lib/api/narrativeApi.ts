/**
 * Narrative API Client
 * Type-safe methods for narrative generation via Gemini API
 */

import { apiClient } from './client';
import type { CommanderProfile, CommanderArchetype } from '../../ai/opponents/AICommanderArchetypes';
import type { 
  NarrativeContext, 
  CommanderNarrative, 
  BattleIntro 
} from '../../services/NarrativeGenerationService';

export interface GenerateNarrativeRequest {
  commanderProfile: CommanderProfile;
  context?: NarrativeContext;
  narrativeType?: CommanderNarrative['type'];
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface GenerateNarrativeResponse {
  success: boolean;
  narrative: CommanderNarrative;
  metadata: {
    archetype: CommanderArchetype;
    generatedAt: string;
  };
  error?: string;
}

export interface GenerateBattleIntroRequest {
  commanderProfile: CommanderProfile;
  opponentProfile: CommanderProfile;
  mapTheme?: string;
}

export interface GenerateBattleIntroResponse {
  success: boolean;
  battleIntro: BattleIntro;
  metadata: {
    generatedAt: string;
  };
  error?: string;
}

class NarrativeApi {
  /**
   * Generate narrative using backend Gemini API
   */
  async generateNarrative(request: GenerateNarrativeRequest): Promise<CommanderNarrative> {
    const response = await apiClient.post<GenerateNarrativeResponse>(
      '/narrative/generate',
      request
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate narrative');
    }
    
    return response.data.narrative;
  }

  /**
   * Generate battle intro
   */
  async generateBattleIntro(request: GenerateBattleIntroRequest): Promise<BattleIntro> {
    const response = await apiClient.post<GenerateBattleIntroResponse>(
      '/narrative/battle-intro',
      request
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate battle intro');
    }
    
    return response.data.battleIntro;
  }

  /**
   * Generate dialogue
   */
  async generateDialogue(
    commanderProfile: CommanderProfile,
    context?: Partial<NarrativeContext>
  ): Promise<CommanderNarrative> {
    return this.generateNarrative({
      commanderProfile,
      context: context as NarrativeContext,
      narrativeType: 'dialogue'
    });
  }

  /**
   * Generate taunt
   */
  async generateTaunt(
    commanderProfile: CommanderProfile,
    context?: Partial<NarrativeContext>
  ): Promise<CommanderNarrative> {
    return this.generateNarrative({
      commanderProfile,
      context: context as NarrativeContext,
      narrativeType: 'taunt'
    });
  }

  /**
   * Generate strategy comment
   */
  async generateStrategyComment(
    commanderProfile: CommanderProfile,
    strategy: string,
    gameState?: NarrativeContext['gameState']
  ): Promise<CommanderNarrative> {
    return this.generateNarrative({
      commanderProfile,
      context: {
        commanderProfile,
        recentAction: strategy,
        gameState
      } as NarrativeContext,
      narrativeType: 'strategy_comment'
    });
  }

  /**
   * Generate victory/defeat narrative
   */
  async generateBattleOutcome(
    commanderProfile: CommanderProfile,
    outcome: 'victory' | 'defeat',
    opponentProfile?: CommanderProfile
  ): Promise<CommanderNarrative> {
    return this.generateNarrative({
      commanderProfile,
      context: {
        commanderProfile,
        opponentProfile
      } as NarrativeContext,
      narrativeType: outcome
    });
  }
}

// Export singleton instance
export const narrativeApi = new NarrativeApi();
export default narrativeApi;

