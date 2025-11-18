import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getConfig, getSecrets } from '../_shared/config.ts';
import { getSupabaseClient, executeQuery } from '../_shared/database.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameState {
  ore: number;
  energy: number;
  biomass?: number;
  data?: number;
  units: Record<string, number>;
  buildings?: Record<string, number>;
  enemyVisible: Record<string, number>;
  enemyBuildings?: Record<string, number>;
  mapFeatures: string[];
  tick: number;
  commanderId: string;
  researchedTech?: string[];
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
    let requestBody: { gameState: GameState; agentType?: string };
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { gameState, agentType = 'commander' } = requestBody;

    // Validate request
    if (!gameState) {
      return new Response(
        JSON.stringify({ error: 'gameState is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate gameState structure
    if (typeof gameState.ore !== 'number' || typeof gameState.energy !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid gameState: ore and energy must be numbers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!gameState.units || typeof gameState.units !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid gameState: units must be an object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof gameState.tick !== 'number' || gameState.tick < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid gameState: tick must be a non-negative number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = getConfig();
    console.log(`AI Strategy request for ${agentType} at tick ${gameState.tick}`);

    // Deterministic fallback decision
    const fallbackDecision = generateFallbackDecision(gameState);

    // Only use LLM for commander-level decisions to save resources
    let decision = fallbackDecision;
    let usedLLM = false;

    if (agentType === 'commander' && shouldUseLLM(gameState) && config.features.enableLLM) {
      try {
        const llmDecision = await getLLMDecision(gameState);
        
        // Validate LLM decision
        if (validateDecision(llmDecision, gameState)) {
          console.log('LLM decision validated:', llmDecision);
          decision = llmDecision;
          usedLLM = true;
        } else {
          console.warn('LLM decision failed validation, using fallback');
        }
      } catch (llmError) {
        console.error('LLM error, using fallback:', llmError);
      }
    }

    // Log decision to database if available
    if (config.features.enableDatabase) {
      try {
        await logDecisionToDatabase(gameState, decision, usedLLM, agentType);
      } catch (dbError) {
        console.warn('Failed to log decision to database:', dbError);
        // Don't fail the request if logging fails
      }
    }

    return new Response(
      JSON.stringify(decision),
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
  // Also use LLM for major decisions (tech research, expansion)
  const isMajorDecision = gameState.tick % 100 === 0;
  const hasAbundantResources = gameState.ore > 500 && gameState.energy > 200;
  const hasTechResources = gameState.data !== undefined && gameState.data > 50;
  
  return isMajorDecision || hasAbundantResources || hasTechResources;
}

async function getLLMDecision(gameState: GameState): Promise<StrategyDecision> {
  const secrets = getSecrets();
  
  // This function should only be called when enableLLM is true (which requires the API key)
  // But add a safety check anyway
  if (!secrets.lovableApiKey) {
    throw new Error('LOVABLE_API_KEY not configured. Please set it in Lovable Cloud secrets or Supabase Edge Function environment variables.');
  }

  const systemPrompt = `You are a tactical RTS AI commander in Quaternion. Analyze the game state and provide ONE strategic order.
Available unit types: worker, infantry, artillery
Available buildings: ore_extractor, energy_reactor, bio_lab, data_center, barracks, factory
Available tech branches: matter, energy, life, knowledge

Return ONLY valid JSON with this exact structure:
{
  "order": "build" | "attack" | "tech" | "defend" | "expand",
  "target": "optional target id or unit/building type",
  "unitQty": number (if building units),
  "reason": "brief 10-word explanation",
  "confidence": 0.0-1.0
}`;

  const resources = [
    `${gameState.ore} ore`,
    `${gameState.energy} energy`,
    gameState.biomass !== undefined ? `${gameState.biomass} biomass` : null,
    gameState.data !== undefined ? `${gameState.data} data` : null
  ].filter(Boolean).join(', ');

  const userPrompt = `Game State:
Resources: ${resources}
Our Units: ${JSON.stringify(gameState.units)}
Our Buildings: ${JSON.stringify(gameState.buildings || {})}
Enemy Visible Units: ${JSON.stringify(gameState.enemyVisible)}
Enemy Buildings: ${JSON.stringify(gameState.enemyBuildings || {})}
Researched Tech: ${(gameState.researchedTech || []).join(', ') || 'none'}
Map Features: ${gameState.mapFeatures.join(', ')}
Tick: ${gameState.tick}
Commander: ${gameState.commanderId}

Provide strategic decision:`;

  const apiUrl = secrets.lovableApiUrl || 'https://ai.gateway.lovable.dev/v1/chat/completions';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secrets.lovableApiKey}`,
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
    // Unit costs: worker=50 ore, infantry=75 ore+25 energy, artillery=150 ore+75 energy
    const estimatedCost = decision.unitQty * 75; // conservative estimate
    if (gameState.ore < estimatedCost) {
      return false;
    }
  }

  // Check tech research requirements
  if (decision.order === 'tech') {
    // Tech typically requires data resource
    if (gameState.data !== undefined && gameState.data < 50) {
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
  const totalOurBuildings = Object.values(gameState.buildings || {}).reduce((a, b) => a + b, 0);
  const totalEnemyBuildings = Object.values(gameState.enemyBuildings || {}).reduce((a, b) => a + b, 0);

  // Build score - higher if we have resources and few units
  if (gameState.ore > 200 && totalOurUnits < 15) {
    scores.build = 0.8;
  }
  // Also build if we have energy but need more production
  if (gameState.energy > 100 && totalOurBuildings < 5) {
    scores.build = Math.max(scores.build, 0.7);
  }

  // Attack score - higher if we outnumber enemy
  if (totalOurUnits > totalEnemyUnits * 1.5 && totalEnemyUnits > 0) {
    scores.attack = 0.9;
  }
  // Attack if we have artillery advantage
  if ((gameState.units.artillery || 0) > (gameState.enemyVisible.artillery || 0) && totalEnemyUnits > 0) {
    scores.attack = Math.max(scores.attack, 0.85);
  }

  // Defend score - higher if enemy outnumbers us
  if (totalEnemyUnits > totalOurUnits && totalEnemyUnits > 0) {
    scores.defend = 0.85;
  }
  // Defend if enemy has more buildings (economic advantage)
  if (totalEnemyBuildings > totalOurBuildings && totalEnemyBuildings > 0) {
    scores.defend = Math.max(scores.defend, 0.75);
  }

  // Tech score - higher in mid-game with resources
  if (gameState.tick > 100 && gameState.ore > 300 && gameState.energy > 100) {
    scores.tech = 0.7;
  }
  // Tech if we have data resource available
  if (gameState.data !== undefined && gameState.data > 50 && gameState.tick > 50) {
    scores.tech = Math.max(scores.tech, 0.75);
  }

  // Expand score - higher early game with low resources
  if (gameState.tick < 200 && gameState.ore < 150) {
    scores.expand = 0.75;
  }
  // Expand if we need more resource production
  if (totalOurBuildings < 3 && gameState.ore > 100) {
    scores.expand = Math.max(scores.expand, 0.7);
  }

  // Commander-specific adjustments
  const commanderId = gameState.commanderId?.toLowerCase() || '';
  if (commanderId.includes('auren') || commanderId.includes('matter')) {
    scores.build = scores.build * 1.2;
    scores.expand = scores.expand * 1.1;
  } else if (commanderId.includes('virel') || commanderId.includes('energy')) {
    scores.attack = scores.attack * 1.2;
    scores.expand = scores.expand * 1.1;
  } else if (commanderId.includes('lira') || commanderId.includes('life')) {
    scores.defend = scores.defend * 1.2;
    scores.build = scores.build * 1.1;
  } else if (commanderId.includes('kor') || commanderId.includes('knowledge')) {
    scores.tech = scores.tech * 1.3;
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

  // Calculate unit quantity based on resources
  let unitQty: number | undefined = undefined;
  if (bestAction.action === 'build') {
    if (gameState.ore >= 150 && gameState.energy >= 75) {
      unitQty = Math.min(Math.floor(gameState.ore / 150), 3); // Can build artillery
    } else if (gameState.ore >= 75 && gameState.energy >= 25) {
      unitQty = Math.min(Math.floor(gameState.ore / 75), 5); // Can build infantry
    } else {
      unitQty = Math.min(Math.floor(gameState.ore / 50), 5); // Can build workers
    }
  }

  return {
    order: bestAction.action as StrategyDecision['order'],
    reason: reasons[bestAction.action],
    confidence: Math.min(bestAction.score, 1.0),
    unitQty,
    fallback: true,
  };
}

/**
 * Log AI decision to database for analytics and learning
 */
async function logDecisionToDatabase(
  gameState: GameState,
  decision: StrategyDecision,
  usedLLM: boolean,
  agentType: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  try {
    // Try to insert into ai_decisions table if it exists
    const { error } = await executeQuery(() =>
      supabase.from('ai_decisions').insert({
        commander_id: gameState.commanderId,
        agent_type: agentType,
        tick: gameState.tick,
        order: decision.order,
        target: decision.target || null,
        unit_qty: decision.unitQty || null,
        reason: decision.reason,
        confidence: decision.confidence,
        used_llm: usedLLM,
        fallback: decision.fallback || false,
        game_state: {
          ore: gameState.ore,
          energy: gameState.energy,
          biomass: gameState.biomass,
          data: gameState.data,
          units: gameState.units,
          buildings: gameState.buildings,
          enemy_visible: gameState.enemyVisible,
          enemy_buildings: gameState.enemyBuildings,
          researched_tech: gameState.researchedTech,
        },
        created_at: new Date().toISOString(),
      })
    );

    if (error) {
      // Table might not exist, that's okay
      if (error.code !== 'PGRST116' && error.code !== '42P01') {
        console.warn('Failed to log decision:', error);
      }
    }
  } catch (error) {
    // Silently fail - logging is optional
    console.warn('Decision logging error:', error);
  }
}
