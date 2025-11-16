import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Demo replay data (deterministic, seed-based)
function generateDemoReplay(seed: number, mapConfig: any, commanderId: string): any {
  const startTime = new Date();
  const durationSec = 925 + (seed % 300); // Vary duration based on seed
  const endTime = new Date(startTime.getTime() + durationSec * 1000);
  
  return {
    replayId: crypto.randomUUID(),
    seed,
    mapConfig,
    commanderId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationSec,
    finalOutcome: seed % 3 === 0 ? 'victory' : seed % 3 === 1 ? 'defeat' : 'draw',
    summary: generateJudgeSummary(seed, commanderId),
    aiHighlights: generateAIHighlights(seed, commanderId),
    actions: generateActionLog(seed),
    stateDeltas: generateStateDeltas(seed),
    meta: {
      version: 'v1',
      engineCommit: 'demo-deterministic',
      generatedBy: 'quaternion-replay-exporter-v0.3',
      nonDeterminism: null
    },
    partial: false
  };
}

function generateJudgeSummary(seed: number, commanderId: string): string {
  const strategies = [
    `Seed ${seed} produced a jagged island map with narrow chokepoints. The AI '${commanderId}' prioritized securing high ground and chokepoint control rather than rapid expansion. A decisive flank maneuver turned a stalemate into victory.`,
    `Seed ${seed} generated an archipelago layout favoring naval control. The AI '${commanderId}' employed aggressive expansion, sacrificing early defense for rapid territorial gain. Late-game consolidation proved decisive.`,
    `Seed ${seed} created a continental map with rich resource clusters. The AI '${commanderId}' balanced economic development with military readiness, using patient resource accumulation to build an overwhelming force.`,
  ];
  return strategies[seed % strategies.length];
}

function generateAIHighlights(seed: number, commanderId: string) {
  const highlights = [
    { t: 48, actor: commanderId, action: 'secure_high_ground', reason: 'Prioritize high ground for vision and defense' },
    { t: 210, actor: commanderId, action: 'feint_expansion', reason: 'Draw enemy forces from central chokepoint' },
    { t: 742, actor: commanderId, action: 'execute_flank', reason: 'Exploit exposed enemy rear after feint' }
  ];
  
  // Vary timing based on seed
  return highlights.map(h => ({
    ...h,
    t: h.t + (seed % 100)
  }));
}

function generateActionLog(seed: number) {
  const baseActions = [
    { t: 3, actor: 'player', type: 'place_unit', payload: { unitType: 'scout', position: { x: 31, y: 29 } }, reason: 'early map vision' },
    { t: 48, actor: 'AI#1', type: 'capture', payload: { tile: { x: 28, y: 33 }, value: 'high_ground' }, reason: 'secure high ground' },
    { t: 120, actor: 'AI#1', type: 'build', payload: { structure: 'watch_tower', position: { x: 28, y: 33 } }, reason: 'increase vision' },
  ];
  
  return baseActions.map(a => ({
    ...a,
    t: a.t + (seed % 50)
  }));
}

function generateStateDeltas(seed: number) {
  return [
    {
      t: 210 + (seed % 50),
      description: 'Left-flank pressure increased; central chokepoint contested.',
      delta: { enemy_infantry: 2, control_central: 'contested' }
    }
  ];
}

// In-memory storage for demo (production would use Supabase storage)
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
      const body: ReplayRequest = await req.json();
      const { seed, mapConfig, commanderId, runtime } = body;

      if (!seed || !mapConfig || !commanderId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: seed, mapConfig, commanderId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Generating replay for seed=${seed}, commander=${commanderId}`);

      // Generate deterministic replay
      const startTime = Date.now();
      const replay = generateDemoReplay(seed, mapConfig, commanderId);
      const duration = Date.now() - startTime;

      // Store in memory
      replayStore.set(replay.replayId, replay);

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
      const replay = replayStore.get(replayId);

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
      const replay = replayStore.get(replayId);

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
