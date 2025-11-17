/**
 * LLM Safety & Validation System
 * Ensures LLM-generated decisions are safe, valid, and game-balanced
 */

import { AgentAction, GameStateSnapshot } from './AgentBase';

export enum ValidationType {
  RESOURCE_CHECK = 'resource_check',
  TIMING_CHECK = 'timing_check',
  STRATEGIC_SOUNDNESS = 'strategic_soundness',
  GAME_RULES = 'game_rules'
}

export interface ValidationRule {
  ruleName: string;
  type: ValidationType;
  parameter?: string;
  threshold?: number;
  errorMessage: string;
}

export interface LLMResponse {
  isValid: boolean;
  confidence: number;
  proposedActions: AgentAction[];
  overallStrategy: string;
  reasoning: string;
  validationErrors: string[];
  wasFallback?: boolean;
  fallbackReason?: string;
  rawResponse?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export class LLMSafetyManager {
  private validationRules: ValidationRule[] = [];
  private responseCache: Map<string, LLMResponse> = new Map();
  private enableCaching: boolean = true;
  private maxCacheSize: number = 1000;
  private confidenceThreshold: number = 0.7;

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * Get validated LLM response with safety checks
   */
  public getValidatedResponse(
    prompt: string,
    currentState: GameStateSnapshot,
    rawResponse: string
  ): LLMResponse {
    const stateHash = this.generateStateHash(currentState);

    // Check cache first
    if (this.enableCaching && this.responseCache.has(stateHash)) {
      const cached = this.responseCache.get(stateHash)!;
      return { ...cached, wasFallback: false };
    }

    // Parse and validate
    const parsedResponse = this.parseAndValidateResponse(rawResponse, currentState);

    // Cache if valid
    if (parsedResponse.isValid && this.enableCaching) {
      this.cacheResponse(stateHash, parsedResponse);
    }

    return parsedResponse;
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    this.validationRules = [
      {
        ruleName: 'Resource Availability',
        type: ValidationType.RESOURCE_CHECK,
        errorMessage: 'Insufficient resources for proposed action'
      },
      {
        ruleName: 'Action Timing',
        type: ValidationType.TIMING_CHECK,
        errorMessage: 'Action timing is invalid'
      },
      {
        ruleName: 'Strategic Soundness',
        type: ValidationType.STRATEGIC_SOUNDNESS,
        threshold: this.confidenceThreshold,
        errorMessage: 'Strategically unsound proposal'
      },
      {
        ruleName: 'Game Rules Compliance',
        type: ValidationType.GAME_RULES,
        errorMessage: 'Action violates game rules'
      }
    ];
  }

  /**
   * Parse and validate LLM response
   */
  private parseAndValidateResponse(
    rawResponse: string,
    currentState: GameStateSnapshot
  ): LLMResponse {
    const response: LLMResponse = {
      isValid: true,
      confidence: 0.5,
      proposedActions: [],
      overallStrategy: '',
      reasoning: '',
      validationErrors: [],
      rawResponse
    };

    try {
      // Parse JSON response
      const parsed = this.safeParseJSON(rawResponse);
      
      if (!parsed) {
        response.isValid = false;
        response.validationErrors.push('Failed to parse JSON response');
        return this.getFallbackResponse(currentState, response.validationErrors);
      }

      // Extract actions
      if (parsed.actions && Array.isArray(parsed.actions)) {
        response.proposedActions = parsed.actions.map((a: any) => this.normalizeAction(a));
      } else if (parsed.proposedActions) {
        response.proposedActions = parsed.proposedActions.map((a: any) => this.normalizeAction(a));
      }

      response.overallStrategy = parsed.strategy || parsed.overallStrategy || '';
      response.reasoning = parsed.reasoning || parsed.explanation || '';
      response.confidence = parsed.confidence || 0.5;

      // Apply all validation rules
      for (const rule of this.validationRules) {
        const result = this.validateRule(rule, response, currentState);
        if (!result.isValid) {
          response.isValid = false;
          response.validationErrors.push(result.errorMessage || rule.errorMessage);
          response.confidence = 0.0;
        }
      }

      // If validation failed, get fallback
      if (!response.isValid) {
        return this.getFallbackResponse(currentState, response.validationErrors);
      }
    } catch (error: any) {
      response.isValid = false;
      response.validationErrors.push(`Parse error: ${error.message}`);
      return this.getFallbackResponse(currentState, response.validationErrors);
    }

    return response;
  }

  /**
   * Validate a specific rule
   */
  private validateRule(
    rule: ValidationRule,
    response: LLMResponse,
    state: GameStateSnapshot
  ): ValidationResult {
    switch (rule.type) {
      case ValidationType.RESOURCE_CHECK:
        return this.validateResources(response, state);
      case ValidationType.TIMING_CHECK:
        return this.validateTiming(response, state);
      case ValidationType.STRATEGIC_SOUNDNESS:
        return this.validateStrategicSoundness(response, state, rule.threshold || 0.7);
      case ValidationType.GAME_RULES:
        return this.validateGameRules(response, state);
      default:
        return { isValid: true };
    }
  }

  /**
   * Validate resource availability
   */
  private validateResources(response: LLMResponse, state: GameStateSnapshot): ValidationResult {
    for (const action of response.proposedActions) {
      if (action.requiredResources) {
        const req = action.requiredResources;
        if (state.resources.ore < req.ore ||
            state.resources.energy < req.energy ||
            state.resources.biomass < req.biomass ||
            state.resources.data < req.data) {
          return {
            isValid: false,
            errorMessage: `Insufficient resources for ${action.type}. ` +
                         `Required: O${req.ore} E${req.energy} B${req.biomass} D${req.data}, ` +
                         `Available: O${state.resources.ore} E${state.resources.energy} ` +
                         `B${state.resources.biomass} D${state.resources.data}`
          };
        }
      }
    }
    return { isValid: true };
  }

  /**
   * Validate action timing
   */
  private validateTiming(response: LLMResponse, state: GameStateSnapshot): ValidationResult {
    // Check if actions are reasonable for current game state
    // For example, don't allow expansion if under heavy attack
    if (state.threatAssessment.immediate > 0.8) {
      const hasExpansion = response.proposedActions.some(a => a.type === 'expand');
      if (hasExpansion) {
        return {
          isValid: false,
          errorMessage: 'Expansion not recommended under heavy threat'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate strategic soundness
   */
  private validateStrategicSoundness(
    response: LLMResponse,
    state: GameStateSnapshot,
    threshold: number
  ): ValidationResult {
    const strategicScore = this.evaluateStrategicSoundness(response, state);

    if (strategicScore < threshold) {
      return {
        isValid: false,
        errorMessage: `Strategically unsound proposal. Score: ${strategicScore.toFixed(2)} (threshold: ${threshold})`
      };
    }

    return { isValid: true };
  }

  /**
   * Evaluate strategic soundness of response
   */
  private evaluateStrategicSoundness(response: LLMResponse, state: GameStateSnapshot): number {
    let score = 0.5;

    // Check if actions align with current game state
    const hasMilitaryActions = response.proposedActions.some(a => 
      a.type === 'attack' || a.type === 'train' && a.unitType === 'soldier'
    );
    const hasEconomicActions = response.proposedActions.some(a => 
      a.type === 'expand' || a.type === 'build' || a.type === 'train' && a.unitType === 'worker'
    );

    // High threat should prioritize military
    if (state.threatAssessment.immediate > 0.7 && hasMilitaryActions) {
      score += 0.2;
    } else if (state.threatAssessment.immediate > 0.7 && !hasMilitaryActions) {
      score -= 0.2;
    }

    // Low resources should prioritize economy
    if (state.resources.total < 200 && hasEconomicActions) {
      score += 0.2;
    } else if (state.resources.total < 200 && !hasEconomicActions) {
      score -= 0.1;
    }

    // Check action count (too many actions might be unrealistic)
    if (response.proposedActions.length > 5) {
      score -= 0.1;
    }

    // Check confidence
    score = score * 0.7 + response.confidence * 0.3;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Validate game rules
   */
  private validateGameRules(response: LLMResponse, state: GameStateSnapshot): ValidationResult {
    // Check for invalid action types
    const validActionTypes = ['build', 'research', 'attack', 'expand', 'defend', 'scout', 'gather', 'train'];
    for (const action of response.proposedActions) {
      if (!validActionTypes.includes(action.type)) {
        return {
          isValid: false,
          errorMessage: `Invalid action type: ${action.type}`
        };
      }
    }

    // Check for impossible actions (e.g., research when already researching)
    if (state.techProgress.currentResearch !== null) {
      const hasResearchAction = response.proposedActions.some(a => a.type === 'research');
      if (hasResearchAction) {
        return {
          isValid: false,
          errorMessage: 'Cannot start new research while research is in progress'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get fallback response when LLM validation fails
   */
  private getFallbackResponse(
    state: GameStateSnapshot,
    errors: string[]
  ): LLMResponse {
    console.warn(`LLM validation failed. Errors: ${errors.join(', ')}. Using fallback.`);

    // Simple rule-based fallback
    const fallbackActions: AgentAction[] = [];

    if (state.threatAssessment.immediate > 0.7) {
      // Defensive fallback
      fallbackActions.push({
        type: 'defend',
        priority: 0.8,
        reasoning: 'High enemy threat detected. Fortifying positions.',
        requiredResources: { ore: 0, energy: 0, biomass: 0, data: 0 }
      });
    } else if (state.resources.total > 1000) {
      // Expansion fallback
      fallbackActions.push({
        type: 'expand',
        priority: 0.6,
        reasoning: 'Resources available. Expanding territory.',
        requiredResources: { ore: 400, energy: 200, biomass: 0, data: 0 }
      });
    } else {
      // Economic fallback
      fallbackActions.push({
        type: 'train',
        unitType: 'worker',
        count: 2,
        priority: 0.5,
        reasoning: 'Building economy through worker production.',
        requiredResources: { ore: 100, energy: 50, biomass: 0, data: 0 }
      });
    }

    return {
      isValid: true,
      confidence: 0.9,
      proposedActions: fallbackActions,
      overallStrategy: 'Defensive consolidation',
      reasoning: 'Enemy forces pose significant threat. Prioritizing defense and resource conservation.',
      validationErrors: [],
      wasFallback: true,
      fallbackReason: errors.join('; ')
    };
  }

  /**
   * Safe JSON parsing
   */
  private safeParseJSON(text: string): any {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      return JSON.parse(jsonStr.trim());
    } catch {
      return null;
    }
  }

  /**
   * Normalize action format
   */
  private normalizeAction(action: any): AgentAction {
    return {
      type: action.type || 'build',
      target: action.target,
      position: action.position,
      unitType: action.unitType,
      buildingType: action.buildingType,
      techId: action.techId,
      count: action.count || 1,
      priority: action.priority || 0.5,
      reasoning: action.reasoning || action.explanation || '',
      requiredResources: action.requiredResources || {
        ore: 0,
        energy: 0,
        biomass: 0,
        data: 0
      }
    };
  }

  /**
   * Generate state hash for caching
   */
  private generateStateHash(state: GameStateSnapshot): string {
    // Simple hash based on key state values
    return `${state.tick}_${state.resources.total}_${state.threatAssessment.immediate.toFixed(2)}_${state.unitComposition.total}`;
  }

  /**
   * Cache response
   */
  private cacheResponse(hash: string, response: LLMResponse): void {
    if (this.responseCache.size >= this.maxCacheSize) {
      // Remove oldest entry (FIFO)
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
    this.responseCache.set(hash, response);
  }
}

/**
 * Heuristic Fallback System
 */
export class HeuristicFallback {
  public getHeuristicResponse(state: GameStateSnapshot): LLMResponse {
    // Simple rule-based fallback
    if (state.threatAssessment.immediate > 0.7) {
      return this.createDefensiveResponse(state);
    } else if (state.resources.total > 1000) {
      return this.createExpansionResponse(state);
    } else {
      return this.createEconomicResponse(state);
    }
  }

  private createDefensiveResponse(state: GameStateSnapshot): LLMResponse {
    return {
      isValid: true,
      confidence: 0.9,
      proposedActions: [{
        type: 'defend',
        priority: 0.8,
        reasoning: 'High enemy threat detected. Fortifying positions.',
        requiredResources: { ore: 0, energy: 0, biomass: 0, data: 0 }
      }],
      overallStrategy: 'Defensive consolidation',
      reasoning: 'Enemy forces pose significant threat. Prioritizing defense and resource conservation.',
      validationErrors: []
    };
  }

  private createExpansionResponse(state: GameStateSnapshot): LLMResponse {
    return {
      isValid: true,
      confidence: 0.8,
      proposedActions: [{
        type: 'expand',
        priority: 0.6,
        reasoning: 'Resources available. Expanding territory.',
        requiredResources: { ore: 400, energy: 200, biomass: 0, data: 0 }
      }],
      overallStrategy: 'Territorial expansion',
      reasoning: 'Sufficient resources available for expansion.',
      validationErrors: []
    };
  }

  private createEconomicResponse(state: GameStateSnapshot): LLMResponse {
    return {
      isValid: true,
      confidence: 0.8,
      proposedActions: [{
        type: 'train',
        unitType: 'worker',
        count: 2,
        priority: 0.5,
        reasoning: 'Building economy through worker production.',
        requiredResources: { ore: 100, energy: 50, biomass: 0, data: 0 }
      }],
      overallStrategy: 'Economic growth',
      reasoning: 'Focusing on economic development.',
      validationErrors: []
    };
  }
}

