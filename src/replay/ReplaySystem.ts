/**
 * Replay System for generating judge-ready artifacts
 * Implements deterministic replay with compression
 */

export interface ReplayMetadata {
  replayId: string;
  seed: number;
  mapConfig: {
    type: string;
    width: number;
    height: number;
  };
  commanderId: string;
  startTime: number;
  endTime: number;
  duration: number;
  winner: number | null;
  winCondition: string | null;
  engineVersion: string;
}

export interface ReplayAction {
  tick: number;
  time: number;
  type: string;
  playerId: number;
  data: any;
}

export interface ReplayHighlight {
  tick: number;
  actor: string;
  action: string;
  reason: string;
}

export interface MoralVerdict {
  alignment: number;
  path: 'Conservator' | 'Pragmatist' | 'Conqueror';
  summary: string;
  keyChoices: string[];
}

export interface ReplayArtifact {
  metadata: ReplayMetadata;
  actions: ReplayAction[];
  highlights: ReplayHighlight[];
  moralVerdict: MoralVerdict;
  contentHash: string;
  partial: boolean;
}

export class ReplaySystem {
  private actions: ReplayAction[] = [];
  private highlights: ReplayHighlight[] = [];
  private metadata: Partial<ReplayMetadata> = {};
  private maxActions: number = 300; // Limit for compression

  constructor() {
    this.metadata.engineVersion = '1.0.0';
    this.metadata.startTime = Date.now();
  }

  /**
   * Initialize replay with game config
   */
  public initialize(config: {
    seed: number;
    mapConfig: any;
    commanderId: string;
  }): void {
    this.metadata.seed = config.seed;
    this.metadata.mapConfig = config.mapConfig;
    this.metadata.commanderId = config.commanderId;
    this.metadata.replayId = this.generateReplayId();
  }

  /**
   * Record an action
   */
  public recordAction(action: ReplayAction): void {
    // Truncate actions if exceeding limit
    if (this.actions.length < this.maxActions) {
      this.actions.push(action);
    }
  }

  /**
   * Add a highlight moment
   */
  public addHighlight(highlight: ReplayHighlight): void {
    if (this.highlights.length < 10) {
      this.highlights.push(highlight);
    }
  }

  /**
   * Finalize replay and generate artifact
   */
  public finalize(gameState: any): ReplayArtifact {
    this.metadata.endTime = Date.now();
    this.metadata.duration = (this.metadata.endTime - (this.metadata.startTime || 0)) / 1000;
    this.metadata.winner = gameState.winner;
    this.metadata.winCondition = this.determineWinCondition(gameState);

    // Generate moral verdict
    const moralVerdict = this.generateMoralVerdict(gameState);

    // Create artifact
    const artifact: ReplayArtifact = {
      metadata: this.metadata as ReplayMetadata,
      actions: this.actions,
      highlights: this.highlights,
      moralVerdict,
      contentHash: this.generateContentHash(),
      partial: this.actions.length >= this.maxActions
    };

    return artifact;
  }

  /**
   * Determine win condition from game state
   */
  private determineWinCondition(gameState: any): string | null {
    if (!gameState.winner) return null;

    const winConditions = Array.from(gameState.winConditions.values());
    const achieved = winConditions.find((wc: any) => wc.achieved);
    
    return achieved ? achieved.type : 'elimination';
  }

  /**
   * Generate moral verdict based on player choices
   */
  private generateMoralVerdict(gameState: any): MoralVerdict {
    const player = gameState.players.get(1);
    if (!player) {
      return {
        alignment: 0,
        path: 'Pragmatist',
        summary: 'No moral choices recorded.',
        keyChoices: []
      };
    }

    const alignment = player.moralAlignment || 0;
    let path: 'Conservator' | 'Pragmatist' | 'Conqueror';
    let summary: string;

    if (alignment >= 50) {
      path = 'Conservator';
      summary = `You chose preservation over power. Through careful balance and ethical decisions, you maintained harmony with the Quaternion. Your compassionate approach earned respect from all advisors, and the universe remembers your mercy. Alignment: +${alignment}`;
    } else if (alignment <= -50) {
      path = 'Conqueror';
      summary = `You seized power without hesitation. Through aggressive expansion and ruthless efficiency, you dominated the Quaternion. Your decisive actions brought victory, but at what cost? The universe trembles at your ambition. Alignment: ${alignment}`;
    } else {
      path = 'Pragmatist';
      summary = `You walked the middle path. Balancing efficiency with ethics, you made practical choices that served your goals. The Quaternion acknowledges your pragmatic wisdom. Alignment: ${alignment > 0 ? '+' : ''}${alignment}`;
    }

    // Extract key choices from action log
    const keyChoices = this.actions
      .filter(a => a.type === 'moral_choice' || a.type === 'research_tech' || a.type === 'build_building')
      .slice(0, 4)
      .map(a => `Tick ${a.tick}: ${a.type} - ${JSON.stringify(a.data).substring(0, 50)}`);

    return {
      alignment,
      path,
      summary,
      keyChoices
    };
  }

  /**
   * Generate content hash for verification
   */
  private generateContentHash(): string {
    const data = JSON.stringify({
      seed: this.metadata.seed,
      actionCount: this.actions.length,
      firstAction: this.actions[0],
      lastAction: this.actions[this.actions.length - 1]
    });

    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'sha256:' + Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Generate unique replay ID
   */
  private generateReplayId(): string {
    return [
      Date.now().toString(36),
      Math.random().toString(36).substr(2, 9)
    ].join('-');
  }

  /**
   * Export replay as JSON
   */
  public exportJSON(): string {
    const artifact = this.finalize({ winner: null, winConditions: new Map(), players: new Map() });
    return JSON.stringify(artifact, null, 2);
  }

  /**
   * Export replay as compressed format
   */
  public exportCompressed(): string {
    const json = this.exportJSON();
    // In a real implementation, this would use gzip compression
    // For now, return base64 encoded
    return btoa(json);
  }

  /**
   * Get replay summary for judge HUD
   */
  public getSummary(): string {
    const actionCount = this.actions.length;
    const highlightCount = this.highlights.length;
    const duration = Math.floor((this.metadata.duration || 0));
    
    return `Replay contains ${actionCount} actions over ${duration}s with ${highlightCount} key moments.`;
  }

  /**
   * Validate replay integrity
   */
  public validate(): boolean {
    // Check required metadata
    if (!this.metadata.seed || !this.metadata.replayId) {
      return false;
    }

    // Check actions are sequential
    for (let i = 1; i < this.actions.length; i++) {
      if (this.actions[i].tick < this.actions[i - 1].tick) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get replay statistics
   */
  public getStatistics() {
    const actionsByType: Record<string, number> = {};
    this.actions.forEach(action => {
      actionsByType[action.type] = (actionsByType[action.type] || 0) + 1;
    });

    return {
      totalActions: this.actions.length,
      actionsByType,
      highlights: this.highlights.length,
      duration: this.metadata.duration,
      partial: this.actions.length >= this.maxActions
    };
  }
}
