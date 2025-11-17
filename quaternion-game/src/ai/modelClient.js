import { supabase } from '../integrations/supabase/client';

/**
 * Call Lovable AI via edge function for strategic decisions
 */
export async function generateStrategy({ prompt, temperature = 0.6, maxTokens = 256 }) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-strategy', {
      body: { prompt, temperature, maxTokens }
    });

    if (error) throw error;
    
    return {
      text: data.text,
      usage: data.usage,
      cached: false
    };
  } catch (err) {
    console.warn('Model client error:', err.message);
    throw err;
  }
}

/**
 * Parse JSON response safely
 */
export function safeParseJSON(text) {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    return JSON.parse(jsonStr.trim());
  } catch {
    return null;
  }
}
