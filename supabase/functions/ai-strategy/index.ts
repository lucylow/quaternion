import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameState {
  ore: number;
  energy: number;
  biomass?: number;
  units: Record<string, number>;
  enemyVisible: Record<string, number>;
  mapFeatures: string[];
  tick: number;
  commanderId: string;
}

interface StrategyDecision {
  order: 'build' | 'attack' | 'tech' | 'defend' | 'expand';
  target?: string;
  unitQty?: number;
  reason: string;
  confidence: number;
  fallback?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameState, agentType = 'commander' }: { gameState: GameState; agentType?: string } = await req.json();

    if (!gameState) {
      throw new Error('gameState is required');
    }

    console.log(`AI Strategy request for ${agentType}:`, JSON.stringify(gameState));

    // Deterministic fallback decision
    const fallbackDecision = generateFallbackDecision(gameState);

    // Only use LLM for commander-level decisions to save resources
    if (agentType === 'commander' && shouldUseLLM(gameState)) {
      try {
        const llmDecision = await getLLMDecision(gameState);
        
        // Validate LLM decision
        if (validateDecision(llmDecision, gameState)) {
          console.log('LLM decision validated:', llmDecision);
          return new Response(
            JSON.stringify(llmDecision),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.warn('LLM decision failed validation, using fallback');
        }
      } catch (llmError) {
        console.error('LLM error, using fallback:', llmError);
      }
    }

    // Return deterministic fallback
    return new Response(
      JSON.stringify(fallbackDecision),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Strategy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function shouldUseLLM(gameState: GameState): boolean {
  // Use LLM for strategic decisions, not every tick
  // Only call LLM every 50 ticks or when resources are abundant
  return gameState.tick % 50 === 0 || 
         (gameState.ore > 500 && gameState.energy > 100);
}

async function getLLMDecision(gameState: GameState): Promise<StrategyDecision> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const systemPrompt = `You are a tactical RTS AI commander. Analyze the game state and provide ONE strategic order.
Return ONLY valid JSON with this exact structure:
{
  "order": "build" | "attack" | "tech" | "defend" | "expand",
  "target": "optional target id",
  "unitQty": number (if building units),
  "reason": "brief 10-word explanation",
  "confidence": 0.0-1.0
}`;

  const userPrompt = `Game State:
Resources: ${gameState.ore} ore, ${gameState.energy} energy${gameState.biomass ? `, ${gameState.biomass} biomass` : ''}
Our Units: ${JSON.stringify(gameState.units)}
Enemy Visible: ${JSON.stringify(gameState.enemyVisible)}
Map Features: ${gameState.mapFeatures.join(', ')}
Tick: ${gameState.tick}

Provide strategic decision:`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    if (response.status === 402) {
      throw new Error('Payment required');
    }
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in LLM response');
  }

  // Try to extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in LLM response');
  }

  const decision = JSON.parse(jsonMatch[0]);
  decision.fallback = false;
  
  return decision;
}

function validateDecision(decision: StrategyDecision, gameState: GameState): boolean {
  // Validate decision is within game constraints
  if (!decision.order || !['build', 'attack', 'tech', 'defend', 'expand'].includes(decision.order)) {
    return false;
  }

  // Check if we have resources for build orders
  if (decision.order === 'build' && decision.unitQty) {
    const estimatedCost = decision.unitQty * 50; // rough estimate
    if (gameState.ore < estimatedCost) {
      return false;
    }
  }

  // Check confidence threshold
  if (decision.confidence < 0.3) {
    return false;
  }

  return true;
}

function generateFallbackDecision(gameState: GameState): StrategyDecision {
  // Deterministic utility-based decision making
  const scores = {
    build: 0,
    attack: 0,
    tech: 0,
    defend: 0,
    expand: 0,
  };

  const totalEnemyUnits = Object.values(gameState.enemyVisible).reduce((a, b) => a + b, 0);
  const totalOurUnits = Object.values(gameState.units).reduce((a, b) => a + b, 0);

  // Build score - higher if we have resources and few units
  if (gameState.ore > 200 && totalOurUnits < 10) {
    scores.build = 0.8;
  }

  // Attack score - higher if we outnumber enemy
  if (totalOurUnits > totalEnemyUnits * 1.5 && totalEnemyUnits > 0) {
    scores.attack = 0.9;
  }

  // Defend score - higher if enemy outnumbers us
  if (totalEnemyUnits > totalOurUnits && totalEnemyUnits > 0) {
    scores.defend = 0.85;
  }

  // Tech score - higher in mid-game with resources
  if (gameState.tick > 100 && gameState.ore > 300 && gameState.energy > 80) {
    scores.tech = 0.7;
  }

  // Expand score - higher early game with low resources
  if (gameState.tick < 200 && gameState.ore < 150) {
    scores.expand = 0.75;
  }

  // Find best action
  const bestAction = Object.entries(scores).reduce((best, [action, score]) => 
    score > best.score ? { action, score } : best,
    { action: 'build', score: 0 }
  );

  const reasons: Record<string, string> = {
    build: 'Need more units, resources available',
    attack: 'Outnumber enemy, strike now',
    tech: 'Strong economy, research advantage',
    defend: 'Enemy threat detected, fortify position',
    expand: 'Secure resources, establish presence',
  };

  return {
    order: bestAction.action as StrategyDecision['order'],
    reason: reasons[bestAction.action],
    confidence: bestAction.score,
    unitQty: bestAction.action === 'build' ? Math.min(Math.floor(gameState.ore / 50), 5) : undefined,
    fallback: true,
  };
}
