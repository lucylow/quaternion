// src/lib/ai/agent.ts
/**
 * Combined AI agent that uses utility-based decisions with LLM fallback
 * and personalization via embeddings.
 */
import { computeUtilities, pickBestAction, type StateSnapshot } from './utilityAgent.js';
import { getLLMSuggestion } from './llm.js';
import { findSimilar } from './embeddings.js';

export async function decide(state: StateSnapshot, playerId: string) {
  // fast path
  const cands = computeUtilities(state);
  const greedy = pickBestAction(cands);

  // check replays to personalize
  let styleAdvice = null;
  try {
    const similar = await findSimilar(JSON.stringify({ playerId, state }), 3);
    if (similar && Array.isArray(similar) && similar.length > 0) {
      // incorporate metadata hints (e.g. "rush wins", "turtling loses")
      const texts = similar.map((s: any) => JSON.stringify(s.metadata || {})).join('\n');
      styleAdvice = texts;
    }
  } catch (err) {
    console.warn('Embedding lookup failed:', err);
    // Continue without personalization
  }

  // conditionally call LLM
  const uncertain = cands.length > 1 && (cands[0]?.score - cands[1]?.score) < (cands[0]?.score * 0.05);
  if (uncertain) {
    const summary = `State: ${JSON.stringify(state)}\nSimilarLogs:\n${styleAdvice || 'none'}`;
    try {
      const plan = await getLLMSuggestion(summary, { temperature: 0.0, maxTokens: 200 });
      const mapped = mapLLMToAction(plan.recommendedAction, cands);
      return { action: mapped.action, rationale: plan.rationale || mapped.reason, source: 'llm' };
    } catch (err) {
      console.warn('LLM call failed:', err);
      // Fall back to utility
    }
  }

  return { action: greedy.action, rationale: greedy.reason, source: 'utility' };
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

