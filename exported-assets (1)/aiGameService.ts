// services/aiGameService.ts
import axios, { AxiosInstance } from 'axios';

export interface GameState {
  gameId: string;
  tick: number;
  players: PlayerState[];
  units: Unit[];
  buildings: Building[];
  resources: ResourceNode[];
  map: MapData;
}

export interface PlayerState {
  playerId: number;
  minerals: number;
  gas: number;
  supplyUsed: number;
  supplyMax: number;
  units: string[];
  buildings: string[];
}

export interface Unit {
  id: string;
  type: 'worker' | 'soldier' | 'tank' | 'air';
  playerId: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  status: 'idle' | 'moving' | 'attacking' | 'gathering';
}

export interface Building {
  id: string;
  type: 'base' | 'barracks' | 'factory' | 'airfield' | 'refinery';
  playerId: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  progress: number;
}

export interface ResourceNode {
  id: string;
  type: 'mineral' | 'gas';
  x: number;
  y: number;
  amount: number;
}

export interface MapData {
  width: number;
  height: number;
  seed: number;
  terrain: number[][];
}

export interface AIDecision {
  type: 'build' | 'move' | 'attack' | 'gather' | 'expand' | 'defend';
  action: string;
  priority?: number;
  target?: string;
  position?: { x: number; y: number };
  unitIds?: string[];
  confidence: number;
  reasoning: string;
  deception?: {
    tactic: string;
    plan: any;
  };
  emotionalTrigger?: {
    emotion: string;
    taunt: string;
  };
  quirkApplied?: any;
}

export interface AIAnalytics {
  decisions: AIDecision[];
  threatLevel: number;
  strategyPhase: 'early' | 'mid' | 'late';
  resourceEfficiency: number;
  militaryStrength: number;
  commanderProfile?: {
    archetype: string;
    description: string;
    difficulty: string;
    traits: {
      aggression: number;
      caution: number;
      adaptability: number;
      innovation: number;
      ruthlessness: number;
      predictability: number;
    };
    behavior: string;
    weakness: string;
  };
}

export interface CommanderProfile {
  archetype: string;
  description?: string;
  difficulty?: string;
  traits: {
    aggression: number;
    caution: number;
    adaptability: number;
    innovation: number;
    ruthlessness: number;
    predictability: number;
  };
  behavior: string;
  weakness: string;
}

export class AIGameService {
  private client: AxiosInstance;
  private baseURL: string;
  private gameId: string | null = null;
  private aiController: AbortController | null = null;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new game session with optional commander archetype
   */
  async createGame(
    mapWidth: number = 64, 
    mapHeight: number = 64, 
    aiDifficulty: 'easy' | 'medium' | 'hard' = 'medium',
    commanderArchetype?: string
  ): Promise<{ gameId: string; state: GameState }> {
    try {
      const response = await this.client.post('/api/game/create', {
        mapWidth,
        mapHeight,
        seed: Math.floor(Math.random() * 1000000),
        aiDifficulty,
        commanderArchetype,
      });

      this.gameId = response.data.gameId;
      return response.data;
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  }

  /**
   * Start the game
   */
  async startGame(): Promise<void> {
    if (!this.gameId) throw new Error('No active game');

    try {
      await this.client.post(`/api/game/${this.gameId}/start`);
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  }

  /**
   * Get current game state
   */
  async getGameState(playerId: number = 1): Promise<GameState> {
    if (!this.gameId) throw new Error('No active game');

    try {
      const response = await this.client.get(`/api/game/${this.gameId}/state`, {
        params: { playerId },
      });

      return response.data.state;
    } catch (error) {
      console.error('Failed to get game state:', error);
      throw error;
    }
  }

  /**
   * Get map data
   */
  async getMapData(): Promise<MapData> {
    if (!this.gameId) throw new Error('No active game');

    try {
      const response = await this.client.get(`/api/game/${this.gameId}/map`);
      return response.data;
    } catch (error) {
      console.error('Failed to get map data:', error);
      throw error;
    }
  }

  /**
   * Move units to a position
   */
  async moveUnits(unitIds: string[], x: number, y: number): Promise<void> {
    if (!this.gameId) throw new Error('No active game');

    try {
      await this.client.post(`/api/game/${this.gameId}/move`, {
        unitIds,
        x,
        y,
      });
    } catch (error) {
      console.error('Failed to move units:', error);
      throw error;
    }
  }

  /**
   * Attack a target
   */
  async attackUnit(unitIds: string[], targetId: string): Promise<void> {
    if (!this.gameId) throw new Error('No active game');

    try {
      await this.client.post(`/api/game/${this.gameId}/attack`, {
        unitIds,
        targetId,
      });
    } catch (error) {
      console.error('Failed to attack:', error);
      throw error;
    }
  }

  /**
   * Gather resources
   */
  async gatherResources(unitIds: string[], resourceId: string): Promise<void> {
    if (!this.gameId) throw new Error('No active game');

    try {
      await this.client.post(`/api/game/${this.gameId}/gather`, {
        unitIds,
        resourceId,
      });
    } catch (error) {
      console.error('Failed to gather resources:', error);
      throw error;
    }
  }

  /**
   * Build a unit
   */
  async buildUnit(buildingId: string, unitType: string): Promise<void> {
    if (!this.gameId) throw new Error('No active game');

    try {
      await this.client.post(`/api/game/${this.gameId}/build-unit`, {
        buildingId,
        unitType,
      });
    } catch (error) {
      console.error('Failed to build unit:', error);
      throw error;
    }
  }

  /**
   * Build a building
   */
  async buildBuilding(playerId: number, buildingType: string, x: number, y: number): Promise<void> {
    if (!this.gameId) throw new Error('No active game');

    try {
      await this.client.post(`/api/game/${this.gameId}/build-building`, {
        playerId,
        buildingType,
        x,
        y,
      });
    } catch (error) {
      console.error('Failed to build building:', error);
      throw error;
    }
  }

  /**
   * Poll game state continuously
   */
  async pollGameState(callback: (state: GameState) => void, interval: number = 100): Promise<void> {
    this.aiController = new AbortController();

    const poll = async () => {
      try {
        if (this.gameId) {
          const state = await this.getGameState();
          callback(state);
        }

        if (!this.aiController?.signal.aborted) {
          setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (!this.aiController?.signal.aborted) {
          setTimeout(poll, interval * 2); // Exponential backoff
        }
      }
    };

    poll();
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    this.aiController?.abort();
  }

  /**
   * Get AI analytics for current game state, including commander profile and decisions
   */
  async getAIAnalytics(): Promise<AIAnalytics> {
    if (!this.gameId) throw new Error('No active game');

    try {
      // Try to get enhanced analytics from backend
      try {
        const response = await this.client.get(`/api/game/${this.gameId}/ai/analytics`);
        return response.data;
      } catch (apiError) {
        // Fallback to calculated analytics if endpoint doesn't exist
        console.warn('Enhanced AI analytics endpoint not available, using fallback');
      }

      const state = await this.getGameState();
      const playerState = state.players[1]; // AI is player 2

      // Calculate threat level based on AI military units
      const aiUnits = state.units.filter(u => u.playerId === 2);
      const aiBuildings = state.buildings.filter(b => b.playerId === 2);
      const playerUnits = state.units.filter(u => u.playerId === 1);
      const playerBuildings = state.buildings.filter(b => b.playerId === 1);

      const militaryUnits = aiUnits.filter(u => u.type !== 'worker').length;
      const playerMilitaryUnits = playerUnits.filter(u => u.type !== 'worker').length;
      
      // More accurate threat calculation
      const unitRatio = playerMilitaryUnits > 0 ? militaryUnits / playerMilitaryUnits : militaryUnits;
      const buildingRatio = playerBuildings.length > 0 ? aiBuildings.length / playerBuildings.length : aiBuildings.length;
      const threatLevel = Math.min(1, (unitRatio * 0.7 + buildingRatio * 0.3));

      // Try to get AI decisions from backend
      let decisions: AIDecision[] = [];
      try {
        const decisionsResponse = await this.client.get(`/api/game/${this.gameId}/ai/decisions`);
        decisions = decisionsResponse.data.decisions || [];
      } catch (decisionsError) {
        // Fallback: create mock decisions based on game state
        decisions = this.generateMockDecisions(state, aiUnits);
      }

      // Try to get commander profile
      let commanderProfile: CommanderProfile | undefined;
      try {
        const profileResponse = await this.client.get(`/api/game/${this.gameId}/ai/commander`);
        commanderProfile = profileResponse.data;
      } catch (profileError) {
        // Profile not available, will be undefined
      }

      return {
        decisions,
        threatLevel,
        strategyPhase: this.getStrategyPhase(state.tick),
        resourceEfficiency: (playerState.minerals + playerState.gas) / Math.max(1, state.tick),
        militaryStrength: (militaryUnits / Math.max(1, aiUnits.length)) * 100,
        commanderProfile,
      };
    } catch (error) {
      console.error('Failed to get AI analytics:', error);
      throw error;
    }
  }

  /**
   * Generate mock decisions based on game state (fallback)
   */
  private generateMockDecisions(state: GameState, aiUnits: Unit[]): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    // Analyze AI behavior and create decisions
    const militaryUnits = aiUnits.filter(u => u.type !== 'worker');
    const workers = aiUnits.filter(u => u.type === 'worker');

    if (militaryUnits.length > 0) {
      decisions.push({
        type: 'attack',
        action: `Deploy ${militaryUnits.length} military units`,
        confidence: 0.75,
        reasoning: 'Military units ready for engagement',
        unitIds: militaryUnits.map(u => u.id),
      });
    }

    if (workers.length > 0) {
      decisions.push({
        type: 'gather',
        action: `Assign ${workers.length} workers to resource gathering`,
        confidence: 0.85,
        reasoning: 'Optimizing resource collection',
        unitIds: workers.map(u => u.id),
      });
    }

    return decisions;
  }

  /**
   * Get AI commander profile
   */
  async getCommanderProfile(): Promise<CommanderProfile | null> {
    if (!this.gameId) throw new Error('No active game');

    try {
      const response = await this.client.get(`/api/game/${this.gameId}/ai/commander`);
      return response.data;
    } catch (error) {
      console.warn('Failed to get commander profile:', error);
      return null;
    }
  }

  /**
   * Get recent AI decisions
   */
  async getAIDecisions(limit: number = 10): Promise<AIDecision[]> {
    if (!this.gameId) throw new Error('No active game');

    try {
      const response = await this.client.get(`/api/game/${this.gameId}/ai/decisions`, {
        params: { limit },
      });
      return response.data.decisions || [];
    } catch (error) {
      console.warn('Failed to get AI decisions:', error);
      return [];
    }
  }

  /**
   * Determine AI strategy phase based on game tick
   */
  private getStrategyPhase(tick: number): 'early' | 'mid' | 'late' {
    if (tick < 300) return 'early';
    if (tick < 900) return 'mid';
    return 'late';
  }

  /**
   * Stop game session
   */
  async stopGame(): Promise<void> {
    if (!this.gameId) throw new Error('No active game');

    try {
      await this.client.post(`/api/game/${this.gameId}/stop`);
      this.gameId = null;
    } catch (error) {
      console.error('Failed to stop game:', error);
      throw error;
    }
  }

  /**
   * Set current game ID (for joining existing games)
   */
  setGameId(gameId: string): void {
    this.gameId = gameId;
  }

  /**
   * Get current game ID
   */
  getGameId(): string | null {
    return this.gameId;
  }
}

export default AIGameService;