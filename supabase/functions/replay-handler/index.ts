import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase credentials not configured, using in-memory storage');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface ReplayRequest {
  seed: number;
  mapConfig: any;
  commanderId: string;
  runtime?: {
    maxTicks?: number;
    maxDurationSec?: number;
  };
}

interface ReplayMetadata {
  replayId: string;
  seed: number;
  mapConfig: any;
  commanderId: string;
  startTime: string;
  endTime: string;
  durationSec: number;
  finalOutcome: 'victory' | 'defeat' | 'draw';
  summary: string;
  aiHighlights: Array<{
    t: number;
    actor: string;
    action: string;
    reason: string;
  }>;
  url?: string;
  partial: boolean;
}

// Generate deterministic replay data (seed-based)
function generateDemoReplay(seed: number, mapConfig: any, commanderId: string, runtime?: { maxTicks?: number; maxDurationSec?: number }): any {
  const startTime = new Date();
  const maxTicks = runtime?.maxTicks || 1000;
  const maxDurationSec = runtime?.maxDurationSec || 30;
  const durationSec = Math.min(925 + (seed % 300), maxDurationSec);
  const endTime = new Date(startTime.getTime() + durationSec * 1000);
  
  // Determine outcome based on seed and commander
  const outcomeSeed = seed + commanderId.length;
  const outcome = outcomeSeed % 3 === 0 ? 'victory' : outcomeSeed % 3 === 1 ? 'defeat' : 'draw';
  
  return {
    replayId: crypto.randomUUID(),
    seed,
    mapConfig,
    commanderId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationSec,
    finalOutcome: outcome,
    summary: generateJudgeSummary(seed, commanderId, outcome),
    aiHighlights: generateAIHighlights(seed, commanderId),
    actions: generateActionLog(seed, commanderId),
    stateDeltas: generateStateDeltas(seed),
    meta: {
      version: 'v1',
      engineCommit: Deno.env.get('GIT_COMMIT') || 'demo-deterministic',
      generatedBy: 'quaternion-replay-exporter-v1.0',
      nonDeterminism: null
    },
    partial: false
  };
}

function generateJudgeSummary(seed: number, commanderId: string, outcome: string): string {
  const commanderName = commanderId.toUpperCase();
  const strategies = [
    `Seed ${seed} produced a resource-rich map with strategic chokepoints. Commander ${commanderName} prioritized economic expansion, establishing ore extractors and energy reactors early. Mid-game saw decisive unit production, culminating in ${outcome} through superior resource management.`,
    `Seed ${seed} generated a tactical map favoring aggressive play. Commander ${commanderName} employed early infantry rushes, securing key positions before enemy fortification. The ${outcome} was achieved through superior unit positioning and timing.`,
    `Seed ${seed} created a balanced map with distributed resources. Commander ${commanderName} focused on technological advancement, researching quantum core and energy harnessing. The ${outcome} resulted from technological superiority and strategic unit composition.`,
    `Seed ${seed} featured a defensive map layout with natural barriers. Commander ${commanderName} built a strong defensive economy, prioritizing bio labs and data centers. The ${outcome} came through patient resource accumulation and overwhelming late-game force.`,
  ];
  return strategies[seed % strategies.length];
}

function generateAIHighlights(seed: number, commanderId: string) {
  const commanderName = commanderId.toUpperCase();
  const baseHighlights = [
    { t: 45, actor: commanderName, action: 'Quantum Core Construction', reason: 'Strategic placement near ore-rich zones enabled 20% resource efficiency boost' },
    { t: 120, actor: commanderName, action: 'Infantry Rush', reason: 'Coordinated attack wave exploited enemy defensive gap' },
    { t: 300, actor: commanderName, action: 'Energy Reactor Overclock', reason: 'Timely energy surge powered advanced unit production' },
    { t: 180, actor: commanderName, action: 'Artillery Positioning', reason: 'Long-range units secured map control advantage' },
    { t: 250, actor: commanderName, action: 'Tech Research', reason: 'Advanced research unlocked superior unit capabilities' }
  ];
  
  // Select 3 highlights based on seed, vary timing
  const selected = baseHighlights
    .map((h, i) => ({ ...h, t: h.t + (seed % 50) + (i * 20) }))
    .sort((a, b) => a.t - b.t)
    .slice(0, 3);
  
  return selected;
}

function generateActionLog(seed: number, commanderId: string) {
  const commanderName = commanderId.toUpperCase();
  const baseActions = [
    { t: 12, actor: 'player', type: 'RESOURCE_GATHER', payload: { type: 'ore', amount: 50 }, reason: 'early resource gathering' },
    { t: 45, actor: commanderName, type: 'TECH_RESEARCH', payload: { tech: 'quantum_core' }, reason: 'strategic tech advancement' },
    { t: 80, actor: commanderName, type: 'BUILDING_CONSTRUCT', payload: { type: 'ore_extractor', x: 500, y: 500 }, reason: 'expand resource production' },
    { t: 120, actor: commanderName, type: 'BUILDING_CONSTRUCT', payload: { type: 'energy_reactor', x: 550, y: 500 }, reason: 'increase energy generation' },
    { t: 180, actor: commanderName, type: 'UNIT_PRODUCE', payload: { unitType: 'infantry', quantity: 3 }, reason: 'build military force' },
    { t: 250, actor: commanderName, type: 'ATTACK', payload: { target: 'enemy_base', units: ['infantry'] }, reason: 'offensive push' },
  ];
  
  // Vary timing and add more actions based on seed
  return baseActions.map(a => ({
    ...a,
    t: a.t + (seed % 50)
  })).filter(a => a.t < 1000); // Limit to reasonable game length
}

function generateStateDeltas(seed: number) {
  return [
    {
      t: 100 + (seed % 50),
      description: 'Resource production established; ore extractors operational.',
      delta: { ore_production: 5, energy_production: 3 }
    },
    {
      t: 200 + (seed % 50),
      description: 'Military units produced; force composition balanced.',
      delta: { infantry_count: 3, artillery_count: 1 }
    },
    {
      t: 300 + (seed % 50),
      description: 'Tech research completed; advanced capabilities unlocked.',
      delta: { tech_researched: ['quantum_core'], resource_efficiency: 1.2 }
    }
  ];
}

// In-memory storage fallback (used if Supabase not configured)
const replayStore = new Map<string, any>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // POST /replay-handler/generate
    if (req.method === 'POST' && path.endsWith('/generate')) {
      let body: ReplayRequest;
      try {
        body = await req.json();
      } catch (parseError) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { seed, mapConfig, commanderId, runtime } = body;

      // Validate required fields
      if (seed === undefined || seed === null) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: seed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (typeof seed !== 'number' || seed < 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid seed: must be a non-negative number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!mapConfig || typeof mapConfig !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid field: mapConfig (must be an object)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!commanderId || typeof commanderId !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid field: commanderId (must be a string)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate runtime if provided
      if (runtime) {
        if (runtime.maxTicks !== undefined && (typeof runtime.maxTicks !== 'number' || runtime.maxTicks < 0)) {
          return new Response(
            JSON.stringify({ error: 'Invalid runtime.maxTicks: must be a non-negative number' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (runtime.maxDurationSec !== undefined && (typeof runtime.maxDurationSec !== 'number' || runtime.maxDurationSec < 0)) {
          return new Response(
            JSON.stringify({ error: 'Invalid runtime.maxDurationSec: must be a non-negative number' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log(`Generating replay for seed=${seed}, commander=${commanderId}`);

      // Generate deterministic replay
      const startTime = Date.now();
      const replay = generateDemoReplay(seed, mapConfig, commanderId, runtime);
      const duration = Date.now() - startTime;

      // Store replay
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          // Store in Supabase Storage
          const replayJson = JSON.stringify(replay, null, 2);
          const filename = `${replay.replayId}.json`;
          
          const { error: uploadError } = await supabase.storage
            .from('replays')
            .upload(filename, replayJson, {
              contentType: 'application/json',
              upsert: false
            });

          if (uploadError) {
            console.error('Failed to upload replay to storage:', uploadError);
            // Fallback to in-memory storage
            replayStore.set(replay.replayId, replay);
          } else {
            console.log(`Replay stored in Supabase Storage: ${filename}`);
          }
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // Fallback to in-memory storage
          replayStore.set(replay.replayId, replay);
        }
      } else {
        // Fallback to in-memory storage
        replayStore.set(replay.replayId, replay);
      }

      console.log(`Replay generated in ${duration}ms, size=${JSON.stringify(replay).length} bytes`);

      // Return metadata
      const metadata: ReplayMetadata = {
        replayId: replay.replayId,
        seed: replay.seed,
        mapConfig: replay.mapConfig,
        commanderId: replay.commanderId,
        startTime: replay.startTime,
        endTime: replay.endTime,
        durationSec: replay.durationSec,
        finalOutcome: replay.finalOutcome,
        summary: replay.summary,
        aiHighlights: replay.aiHighlights,
        url: `${url.origin}${url.pathname.replace('/generate', '')}/${replay.replayId}/download`,
        partial: replay.partial
      };

      return new Response(
        JSON.stringify(metadata),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /replay-handler/:replayId
    const replayIdMatch = path.match(/\/replay-handler\/([a-f0-9-]+)$/);
    if (req.method === 'GET' && replayIdMatch && !path.endsWith('/download')) {
      const replayId = replayIdMatch[1];
      
      // Try to load from Supabase Storage first
      const supabase = getSupabaseClient();
      let replay = null;
      
      if (supabase) {
        try {
          const { data, error } = await supabase.storage
            .from('replays')
            .download(`${replayId}.json`);
          
          if (!error && data) {
            const text = await data.text();
            replay = JSON.parse(text);
          }
        } catch (storageError) {
          console.error('Error loading from storage:', storageError);
        }
      }
      
      // Fallback to in-memory storage
      if (!replay) {
        replay = replayStore.get(replayId);
      }

      if (!replay) {
        return new Response(
          JSON.stringify({ error: 'Replay not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(replay),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /replay-handler/:replayId/download
    const downloadMatch = path.match(/\/replay-handler\/([a-f0-9-]+)\/download$/);
    if (req.method === 'GET' && downloadMatch) {
      const replayId = downloadMatch[1];
      
      // Try to load from Supabase Storage first
      const supabase = getSupabaseClient();
      let replay = null;
      
      if (supabase) {
        try {
          const { data, error } = await supabase.storage
            .from('replays')
            .download(`${replayId}.json`);
          
          if (!error && data) {
            const text = await data.text();
            replay = JSON.parse(text);
          }
        } catch (storageError) {
          console.error('Error loading from storage:', storageError);
        }
      }
      
      // Fallback to in-memory storage
      if (!replay) {
        replay = replayStore.get(replayId);
      }

      if (!replay) {
        return new Response(
          JSON.stringify({ error: 'Replay not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const replayJson = JSON.stringify(replay, null, 2);
      const filename = `replay-${replay.seed}-${replay.commanderId}.json`;

      return new Response(
        replayJson,
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': replayJson.length.toString()
          }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message, errorId: crypto.randomUUID() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
