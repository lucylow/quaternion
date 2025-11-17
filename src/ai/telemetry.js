import { supabase } from '../integrations/supabase/client';

/**
 * Log AI decision with full telemetry
 */
export async function logAIDecision({
  gameId,
  tick,
  playerId,
  commanderId,
  promptHash,
  prompt,
  modelResponse,
  actionTaken,
  decisionLatencyMs,
  tokensUsed,
  cacheHit,
  fallbackUsed
}) {
  try {
    const { error } = await supabase
      .from('ai_decisions')
      .insert({
        game_id: gameId,
        tick,
        player_id: playerId,
        commander_id: commanderId,
        prompt_hash: promptHash,
        prompt,
        model_response: modelResponse,
        action_taken: actionTaken,
        decision_latency_ms: decisionLatencyMs,
        tokens_used: tokensUsed,
        cache_hit: cacheHit,
        fallback_used: fallbackUsed
      });

    if (error) {
      console.error('Failed to log AI decision:', error);
    }
  } catch (err) {
    console.error('Telemetry error:', err);
  }
}

/**
 * Record performance metric
 */
export async function recordMetric({ gameId, metricType, metricValue, metadata }) {
  try {
    const { error } = await supabase
      .from('ai_metrics')
      .insert({
        game_id: gameId,
        metric_type: metricType,
        metric_value: metricValue,
        metadata
      });

    if (error) {
      console.error('Failed to record metric:', error);
    }
  } catch (err) {
    console.error('Metric recording error:', err);
  }
}

/**
 * Batch metrics recording for efficiency
 */
export class MetricsCollector {
  constructor(gameId) {
    this.gameId = gameId;
    this.buffer = [];
    this.flushInterval = 30000; // 30s
    this.maxBufferSize = 100;
    this.startAutoFlush();
  }

  record(metricType, metricValue, metadata = {}) {
    this.buffer.push({
      game_id: this.gameId,
      metric_type: metricType,
      metric_value: metricValue,
      metadata
    });

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      const { error } = await supabase
        .from('ai_metrics')
        .insert(batch);

      if (error) {
        console.error('Failed to flush metrics:', error);
        // Re-add to buffer on failure
        this.buffer.unshift(...batch);
      }
    } catch (err) {
      console.error('Metrics flush error:', err);
      this.buffer.unshift(...batch);
    }
  }

  startAutoFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}
