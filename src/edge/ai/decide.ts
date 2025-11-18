// src/edge/ai/decide.ts
import { PrismaClient } from '@prisma/client';
import { getLLMSuggestion } from '../../lib/ai/llm.js';
import { computeUtilities, pickBestAction } from '../../lib/ai/utilityAgent.js';

const prisma = new PrismaClient();

/**
 * POST body:
 * {
 *   gameId: string,
 *   playerId: string,
 *   state: { ... } // compact snapshot (units, resources, threats)
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, playerId, state } = body;
    if (!playerId || !state) {
      return new Response(JSON.stringify({ error: 'missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1) Rule-based utility step (fast, deterministic)
    const candidates = computeUtilities(state); // returns array [{action,score,meta}]
    const greedy = pickBestAction(candidates);

    // 2) Optionally call LLM for high-level plan if ambiguous
    // Use heuristics: only call LLM if top scores are within 5% or flagged by server
    const topScore = candidates[0]?.score ?? 0;
    const secondScore = candidates[1]?.score ?? 0;
    const needPlan = (topScore - secondScore) < (topScore * 0.05);

    let llmPlan = null;
    if (needPlan) {
      // compact prompt: include key state summary to limit token usage
      const summary = summarizeStateForLLM(state);
      llmPlan = await getLLMSuggestion(summary, { temperature: 0.0, maxTokens: 200 });
      // llmPlan expected shape: { recommendedAction: "...", rationale: "..." }
    }

    // choose final action
    const final = llmPlan?.recommendedAction ? mapLLMToAction(llmPlan.recommendedAction, candidates) : greedy;

    // log short decision for analytics
    await prisma.$executeRawUnsafe(
      `INSERT INTO ai_decisions(game_id, player_id, action, created_at, meta) VALUES($1, $2, $3, now(), $4)`,
      gameId || 'unknown',
      playerId,
      final.action,
      JSON.stringify({ source: llmPlan ? 'llm' : 'utility' })
    );

    return new Response(JSON.stringify({ action: final.action, rationale: final.meta || llmPlan?.rationale || '' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}

function summarizeStateForLLM(state: any): string {
  // Compact summary for LLM
  return JSON.stringify({
    resources: state.resources,
    unitCount: state.units?.length || 0,
    enemyCount: state.enemies?.length || 0,
    enemyStrength: state.enemyStrength,
    playerStrength: state.playerStrength,
    mapControl: state.mapControl
  });
}

function mapLLMToAction(llmActionString: string, candidates: any[]): any {
  // naive mapping: find candidate containing keywords
  const lc = llmActionString?.toLowerCase?.() ?? '';
  for (const c of candidates) {
    if (lc.includes(c.action)) return c;
  }
  // fallback
  return candidates[0] ?? { action: 'noop', score: 0 };
}

