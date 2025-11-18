// src/lib/ai/llm.ts
/**
 * LLM wrapper that uses OpenAI-style API via server-side fetch.
 * Keep it minimal & robust.
 */

type LLMOptions = { temperature?: number; maxTokens?: number; model?: string };

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function getLLMSuggestion(summary: string, opts: LLMOptions = {}) {
  const model = opts.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const temperature = opts.temperature ?? 0.0;
  const maxTokens = opts.maxTokens ?? 200;

  const prompt = [
    { role: 'system', content: 'You are a tactical assistant for a real-time strategy AI. Provide a single recommended action and a short rationale. Return JSON with {recommendedAction, rationale}.' },
    { role: 'user', content: `STATE_SUMMARY:\n${summary}\n\nFormat: JSON. Keep concise.` }
  ];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, returning fallback');
    return { recommendedAction: 'noop', rationale: 'LLM not configured' };
  }

  const resp = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: prompt,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`LLM error: ${resp.status} ${txt}`);
  }

  const j = await resp.json();
  const content = j?.choices?.[0]?.message?.content ?? '{}';
  // safe parse:
  try {
    return JSON.parse(content);
  } catch {
    // fallback: attempt to extract JSON blob in text
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    return { recommendedAction: null, rationale: content };
  }
}

