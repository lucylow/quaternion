/**
 * Data Logging System for Judge Transparency
 * Logs all AI calls and game events for Chroma Awards submission
 */

export interface AICallLog {
  timestamp: string;
  system: string;
  prompt?: string;
  input?: any;
  output?: any;
  latency_ms: number;
  success: boolean;
  error?: string;
}

export interface GameMatchLog {
  match_id: string;
  seed: number;
  generated_map_theme?: string;
  commander_personalities?: string[];
  ai_calls_made: AICallLog[];
  events_triggered: Array<{
    id: string;
    type: string;
    narrative: string;
    timestamp: number;
  }>;
  player_win: boolean;
  match_duration_min: number;
  player_actions: number;
  ai_decisions: number;
}

export class DataLogger {
  private matchLog: GameMatchLog | null = null;
  private aiCalls: AICallLog[] = [];
  private events: Array<{
    id: string;
    type: string;
    narrative: string;
    timestamp: number;
  }> = [];

  /**
   * Start logging a new match
   */
  startMatch(seed: number, mapTheme?: string, commanders?: string[]): string {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.matchLog = {
      match_id: matchId,
      seed,
      generated_map_theme: mapTheme,
      commander_personalities: commanders,
      ai_calls_made: [],
      events_triggered: [],
      player_win: false,
      match_duration_min: 0,
      player_actions: 0,
      ai_decisions: 0
    };

    this.aiCalls = [];
    this.events = [];

    return matchId;
  }

  /**
   * Log an AI call
   */
  logAICall(
    system: string,
    input?: any,
    output?: any,
    latency_ms: number = 0,
    success: boolean = true,
    error?: string
  ): void {
    const log: AICallLog = {
      timestamp: new Date().toISOString(),
      system,
      input: this.sanitizeForLogging(input),
      output: this.sanitizeForLogging(output),
      latency_ms,
      success,
      error
    };

    this.aiCalls.push(log);

    if (this.matchLog) {
      this.matchLog.ai_calls_made.push(log);
    }
  }

  /**
   * Log an event
   */
  logEvent(
    id: string,
    type: string,
    narrative: string
  ): void {
    const event = {
      id,
      type,
      narrative,
      timestamp: Date.now()
    };

    this.events.push(event);

    if (this.matchLog) {
      this.matchLog.events_triggered.push(event);
    }
  }

  /**
   * Log player action
   */
  logPlayerAction(): void {
    if (this.matchLog) {
      this.matchLog.player_actions++;
    }
  }

  /**
   * Log AI decision
   */
  logAIDecision(): void {
    if (this.matchLog) {
      this.matchLog.ai_decisions++;
    }
  }

  /**
   * End match and finalize log
   */
  endMatch(playerWin: boolean, durationSeconds: number): GameMatchLog | null {
    if (!this.matchLog) return null;

    this.matchLog.player_win = playerWin;
    this.matchLog.match_duration_min = durationSeconds / 60;

    const finalLog = { ...this.matchLog };
    
    // Reset for next match
    this.matchLog = null;
    this.aiCalls = [];
    this.events = [];

    return finalLog;
  }

  /**
   * Get current match log
   */
  getMatchLog(): GameMatchLog | null {
    return this.matchLog ? { ...this.matchLog } : null;
  }

  /**
   * Export match log as JSON
   */
  exportMatchLog(): string {
    if (!this.matchLog) return '';
    return JSON.stringify(this.matchLog, null, 2);
  }

  /**
   * Download match log as file
   */
  downloadMatchLog(filename?: string): void {
    if (!this.matchLog) return;

    const json = this.exportMatchLog();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `quaternion_match_${this.matchLog.match_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get AI call statistics
   */
  getAIStats(): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageLatency: number;
    callsBySystem: Record<string, number>;
  } {
    const stats = {
      totalCalls: this.aiCalls.length,
      successfulCalls: 0,
      failedCalls: 0,
      averageLatency: 0,
      callsBySystem: {} as Record<string, number>
    };

    let totalLatency = 0;

    this.aiCalls.forEach(call => {
      if (call.success) {
        stats.successfulCalls++;
      } else {
        stats.failedCalls++;
      }

      totalLatency += call.latency_ms;
      stats.callsBySystem[call.system] = (stats.callsBySystem[call.system] || 0) + 1;
    });

    if (this.aiCalls.length > 0) {
      stats.averageLatency = totalLatency / this.aiCalls.length;
    }

    return stats;
  }

  /**
   * Sanitize data for logging (remove sensitive info, limit size)
   */
  private sanitizeForLogging(data: any): any {
    if (!data) return data;

    // Limit string length
    if (typeof data === 'string') {
      return data.length > 500 ? data.substring(0, 500) + '...' : data;
    }

    // Limit object depth
    if (typeof data === 'object') {
      const sanitized: any = {};
      let count = 0;
      for (const key in data) {
        if (count++ > 20) break; // Limit to 20 properties
        sanitized[key] = this.sanitizeForLogging(data[key]);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.matchLog = null;
    this.aiCalls = [];
    this.events = [];
  }
}

// Singleton instance
export const dataLogger = new DataLogger();


