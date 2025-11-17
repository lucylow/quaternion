/**
 * Database Seeding Script for Quaternion Game
 * 
 * This script populates the Supabase database with sample data for testing.
 * 
 * Usage:
 *   node scripts/seed-database.js
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (for backend operations)
 * 
 * Or set them in a .env file and use dotenv:
 *   npm install dotenv
 *   require('dotenv').config()
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load commander config
const commandersConfig = JSON.parse(
  readFileSync(join(__dirname, '../config/commanders.json'), 'utf-8')
);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Create a .env file or set these in your environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map commander traits from config to database schema
function mapCommanderTraits(commander) {
  const traits = commander.traits;
  return {
    aggressiveness: traits.aggressiveness,
    risk_tolerance: traits.riskTolerance,
    patience: traits.patience,
    cautiousness: 1 - traits.riskTolerance, // Inverse of risk tolerance
    innovation_drive: traits.innovationDrive,
    boldness: traits.aggressiveness * 0.7 + traits.riskTolerance * 0.3,
  };
}

// Map commander ID to archetype
function getArchetype(commanderId) {
  const archetypeMap = {
    'architect': 'architect',
    'aggressor': 'aggressor',
    'nomad': 'nomad',
    'tactician': 'balanced',
    'harvester': 'balanced',
    'wildcard': 'balanced',
  };
  return archetypeMap[commanderId] || 'balanced';
}

// Helper function to generate realistic game scenarios
function generateGameScenarios() {
  const now = Date.now();
  const games = [];
  
  // Generate 25+ games with varied scenarios
  const scenarios = [
    // Recent completed games (last 7 days)
    { status: 'completed', tick: 180, winner: 1, daysAgo: 1, mapSize: [64, 64] },
    { status: 'completed', tick: 220, winner: 2, daysAgo: 2, mapSize: [64, 64] },
    { status: 'completed', tick: 150, winner: 1, daysAgo: 3, mapSize: [64, 64] },
    { status: 'completed', tick: 300, winner: 2, daysAgo: 4, mapSize: [80, 80] },
    { status: 'completed', tick: 95, winner: 1, daysAgo: 5, mapSize: [64, 64] },
    { status: 'completed', tick: 250, winner: 1, daysAgo: 6, mapSize: [96, 96] },
    { status: 'completed', tick: 175, winner: 2, daysAgo: 7, mapSize: [64, 64] },
    
    // Older completed games (1-4 weeks ago)
    { status: 'completed', tick: 200, winner: 1, daysAgo: 10, mapSize: [64, 64] },
    { status: 'completed', tick: 160, winner: 2, daysAgo: 14, mapSize: [64, 64] },
    { status: 'completed', tick: 280, winner: 1, daysAgo: 18, mapSize: [80, 80] },
    { status: 'completed', tick: 120, winner: 2, daysAgo: 21, mapSize: [64, 64] },
    { status: 'completed', tick: 240, winner: 1, daysAgo: 25, mapSize: [96, 96] },
    { status: 'completed', tick: 190, winner: 2, daysAgo: 28, mapSize: [64, 64] },
    
    // Active games (various stages)
    { status: 'active', tick: 45, winner: null, daysAgo: 0, mapSize: [64, 64] },
    { status: 'active', tick: 120, winner: null, daysAgo: 0, mapSize: [64, 64] },
    { status: 'active', tick: 85, winner: null, daysAgo: 0, mapSize: [80, 80] },
    { status: 'active', tick: 200, winner: null, daysAgo: 0, mapSize: [64, 64] },
    { status: 'active', tick: 30, winner: null, daysAgo: 0, mapSize: [64, 64] },
    { status: 'active', tick: 160, winner: null, daysAgo: 0, mapSize: [96, 96] },
    
    // Waiting games
    { status: 'waiting', tick: 0, winner: null, daysAgo: 0, mapSize: [64, 64] },
    { status: 'waiting', tick: 0, winner: null, daysAgo: 0, mapSize: [80, 80] },
    { status: 'waiting', tick: 0, winner: null, daysAgo: 0, mapSize: [64, 64] },
    
    // Long games (epic battles)
    { status: 'completed', tick: 450, winner: 1, daysAgo: 2, mapSize: [96, 96] },
    { status: 'completed', tick: 380, winner: 2, daysAgo: 5, mapSize: [80, 80] },
    
    // Quick games (rushed strategies)
    { status: 'completed', tick: 60, winner: 1, daysAgo: 1, mapSize: [64, 64] },
    { status: 'completed', tick: 75, winner: 2, daysAgo: 3, mapSize: [64, 64] },
  ];
  
  scenarios.forEach((scenario, index) => {
    const completedAt = scenario.status === 'completed' 
      ? new Date(now - scenario.daysAgo * 86400000).toISOString()
      : null;
    
    games.push({
      status: scenario.status,
      map_seed: 10000 + index * 1234 + Math.floor(Math.random() * 1000),
      map_width: scenario.mapSize[0],
      map_height: scenario.mapSize[1],
      tick: scenario.tick,
      winner_player_id: scenario.winner,
      completed_at: completedAt,
    });
  });
  
  return games;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create sample games
    console.log('📦 Creating sample games...');
    const games = generateGameScenarios();

    const { data: insertedGames, error: gamesError } = await supabase
      .from('games')
      .insert(games)
      .select();

    if (gamesError) {
      throw new Error(`Failed to insert games: ${gamesError.message}`);
    }

    console.log(`✅ Created ${insertedGames.length} games\n`);

    // 2. Create commander personalities for each game
    console.log('👤 Creating commander personalities...');
    const commanderPersonalities = [];
    
    // Use all commanders and create varied matchups
    const allCommanders = commandersConfig.commanders;
    
    for (let i = 0; i < insertedGames.length; i++) {
      const game = insertedGames[i];
      
      // Create varied commander matchups
      const commander1Index = i % allCommanders.length;
      const commander2Index = (i + Math.floor(i / allCommanders.length)) % allCommanders.length;
      
      const commander1 = allCommanders[commander1Index];
      const commander2 = allCommanders[commander2Index];
      
      // Player 1
      const traits1 = mapCommanderTraits(commander1);
      commanderPersonalities.push({
        game_id: game.id,
        player_id: 1,
        archetype: getArchetype(commander1.id),
        name: commander1.name,
        ...traits1,
      });
      
      // Player 2
      const traits2 = mapCommanderTraits(commander2);
      commanderPersonalities.push({
        game_id: game.id,
        player_id: 2,
        archetype: getArchetype(commander2.id),
        name: commander2.name,
        ...traits2,
      });
    }

    const { data: insertedCommanders, error: commandersError } = await supabase
      .from('commander_personalities')
      .insert(commanderPersonalities)
      .select();

    if (commandersError) {
      throw new Error(`Failed to insert commanders: ${commandersError.message}`);
    }

    console.log(`✅ Created ${insertedCommanders.length} commander personalities\n`);

    // 3. Create strategic intents
    console.log('🎯 Creating strategic intents...');
    const strategicIntents = [];

    for (const game of insertedGames) {
      if (game.status === 'waiting') continue; // Skip waiting games
      
      const gameCommanders = insertedCommanders.filter(c => c.game_id === game.id);
      
      for (const commander of gameCommanders) {
        // Create more frequent intents (every 10-15 ticks)
        const intentInterval = 12;
        const ticks = [];
        for (let t = 0; t <= game.tick; t += intentInterval) {
          ticks.push(t);
        }
        
        // Add some strategic transitions
        const allIntentTypes = ['aggressive', 'defensive', 'expansionist', 'adaptive', 'evasive'];
        let currentIntent = allIntentTypes[Math.floor(Math.random() * allIntentTypes.length)];
        
        for (let i = 0; i < ticks.length; i++) {
          const tick = ticks[i];
          
          // Strategic transitions based on game progress
          if (i > 0 && Math.random() < 0.3) {
            // 30% chance to change strategy
            const availableIntents = allIntentTypes.filter(t => t !== currentIntent);
            currentIntent = availableIntents[Math.floor(Math.random() * availableIntents.length)];
          }
          
          // Confidence varies based on game stage
          const gameProgress = tick / game.tick;
          const confidence = 0.4 + gameProgress * 0.4 + Math.random() * 0.2;
          
          // Calculate priorities based on intent type and commander archetype
          let priorities = {
            priority_defense: 0.5,
            priority_offense: 0.5,
            priority_economy: 0.5,
            priority_expansion: 0.5,
            priority_technology: 0.5,
          };

          switch (currentIntent) {
            case 'aggressive':
              priorities.priority_offense = 0.75 + Math.random() * 0.15;
              priorities.priority_defense = 0.2 + Math.random() * 0.2;
              priorities.priority_economy = 0.3 + Math.random() * 0.2;
              break;
            case 'defensive':
              priorities.priority_defense = 0.75 + Math.random() * 0.15;
              priorities.priority_offense = 0.2 + Math.random() * 0.2;
              priorities.priority_economy = 0.4 + Math.random() * 0.2;
              break;
            case 'expansionist':
              priorities.priority_expansion = 0.75 + Math.random() * 0.15;
              priorities.priority_economy = 0.6 + Math.random() * 0.2;
              priorities.priority_offense = 0.3 + Math.random() * 0.2;
              break;
            case 'adaptive':
              // Balanced but slightly varied
              priorities.priority_offense = 0.4 + Math.random() * 0.3;
              priorities.priority_defense = 0.4 + Math.random() * 0.3;
              priorities.priority_economy = 0.4 + Math.random() * 0.3;
              break;
            case 'evasive':
              priorities.priority_defense = 0.6 + Math.random() * 0.2;
              priorities.priority_expansion = 0.5 + Math.random() * 0.2;
              priorities.priority_offense = 0.2 + Math.random() * 0.2;
              break;
          }

          strategicIntents.push({
            game_id: game.id,
            commander_id: commander.id,
            tick,
            intent: currentIntent,
            confidence: Math.min(1.0, confidence),
            ...priorities,
          });
        }
      }
    }

    const { data: insertedIntents, error: intentsError } = await supabase
      .from('strategic_intents')
      .insert(strategicIntents)
      .select();

    if (intentsError) {
      throw new Error(`Failed to insert strategic intents: ${intentsError.message}`);
    }

    console.log(`✅ Created ${insertedIntents.length} strategic intents\n`);

    // 4. Create AI decision logs
    console.log('📊 Creating AI decision logs...');
    const decisionLogs = [];

    for (const game of insertedGames) {
      if (game.status === 'waiting') continue;
      
      const gameCommanders = insertedCommanders.filter(c => c.game_id === game.id);
      const allDecisionTypes = ['attack', 'defend', 'build', 'scout', 'research', 'retreat', 'expand'];
      const allIntentTypes = ['aggressive', 'defensive', 'expansionist', 'adaptive', 'evasive'];
      
      // Create decision logs more frequently (every 2-3 ticks)
      const decisionInterval = 2.5;
      const ticks = [];
      for (let t = 0; t <= game.tick; t += decisionInterval) {
        ticks.push(Math.floor(t));
      }
      
      for (const commander of gameCommanders) {
        // Get commander's archetype to influence decisions
        const archetype = commander.archetype;
        let resources = 200;
        let militaryStrength = 10;
        let enemyMilitaryStrength = 10;
        
        for (const tick of ticks) {
          if (tick > game.tick) break;
          
          // Simulate resource and military growth over time
          const gameProgress = tick / Math.max(game.tick, 1);
          resources = Math.min(5000, 200 + gameProgress * 2000 + Math.random() * 500);
          militaryStrength = Math.min(200, 10 + gameProgress * 150 + Math.random() * 30);
          enemyMilitaryStrength = Math.min(200, 10 + gameProgress * 150 + Math.random() * 30);
          
          // Decision type influenced by archetype and game state
          let decisionType;
          const decisionWeights = {
            'aggressor': { attack: 0.4, build: 0.2, expand: 0.15, scout: 0.1, research: 0.1, defend: 0.05 },
            'architect': { build: 0.35, research: 0.25, defend: 0.2, expand: 0.1, scout: 0.05, attack: 0.05 },
            'nomad': { expand: 0.3, scout: 0.25, build: 0.2, research: 0.15, attack: 0.05, defend: 0.05 },
            'balanced': { build: 0.2, attack: 0.2, defend: 0.2, expand: 0.15, research: 0.15, scout: 0.1 },
          };
          
          const weights = decisionWeights[archetype] || decisionWeights['balanced'];
          const rand = Math.random();
          let cumulative = 0;
          for (const [type, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (rand <= cumulative) {
              decisionType = type;
              break;
            }
          }
          
          // Adjust based on threat level
          const threatLevel = enemyMilitaryStrength / (militaryStrength + 1);
          if (threatLevel > 1.5 && Math.random() < 0.3) {
            decisionType = 'retreat';
          } else if (threatLevel > 1.2 && decisionType === 'attack') {
            decisionType = 'defend';
          }
          
          const intentType = allIntentTypes[Math.floor(Math.random() * allIntentTypes.length)];
          const utilityScore = 0.2 + Math.random() * 0.7;
          const chosen = Math.random() > 0.25; // 75% chosen
          
          // More detailed reasoning
          const reasoningTemplates = {
            attack: `Aggressive push at tick ${tick}. Military advantage: ${militaryStrength.toFixed(1)} vs ${enemyMilitaryStrength.toFixed(1)}. Resources: ${Math.floor(resources)}.`,
            defend: `Defensive positioning due to enemy threat level ${threatLevel.toFixed(2)}. Building up forces before counter-attack.`,
            build: `Economic expansion. Current resources: ${Math.floor(resources)}. Building infrastructure to support ${archetype} strategy.`,
            scout: `Reconnaissance mission to gather intelligence on enemy positions and resource nodes.`,
            research: `Technology investment for long-term strategic advantage. Current tech level: ${Math.floor(gameProgress * 5)}.`,
            retreat: `Tactical withdrawal. Enemy strength ${enemyMilitaryStrength.toFixed(1)} exceeds ours ${militaryStrength.toFixed(1)}.`,
            expand: `Territorial expansion to secure additional resource nodes and strategic positions.`,
          };
          
          decisionLogs.push({
            game_id: game.id,
            commander_id: commander.id,
            tick,
            decision_type: decisionType,
            current_intent: intentType,
            utility_score: utilityScore,
            chosen: chosen,
            resources: Math.floor(resources),
            military_strength: militaryStrength,
            enemy_military_strength: enemyMilitaryStrength,
            threat_level: Math.min(1.0, threatLevel),
            reasoning: reasoningTemplates[decisionType] || `Strategic decision: ${decisionType}`,
            target_position: { 
              x: Math.floor(Math.random() * game.map_width), 
              y: Math.floor(Math.random() * game.map_height) 
            },
            target_entity_id: `entity_${tick}_${Math.floor(Math.random() * 20)}`,
          });
        }
      }
    }

    const { data: insertedLogs, error: logsError } = await supabase
      .from('ai_decision_logs')
      .insert(decisionLogs)
      .select();

    if (logsError) {
      throw new Error(`Failed to insert decision logs: ${logsError.message}`);
    }

    console.log(`✅ Created ${insertedLogs.length} AI decision logs\n`);

    // 5. Create AI decisions (from ai_decisions table)
    console.log('🤖 Creating AI decisions...');
    const aiDecisions = [];

    const actionTypes = ['build', 'attack', 'move', 'gather', 'research', 'scout'];
    const buildingTypes = ['base', 'barracks', 'factory', 'airfield', 'refinery'];
    const unitTypes = ['worker', 'soldier', 'tank', 'air_unit'];

    for (const game of insertedGames) {
      if (game.status === 'waiting') continue;
      
      const gameCommanders = insertedCommanders.filter(c => c.game_id === game.id);
      // Create decisions every 5-8 ticks
      const decisionInterval = 6;
      const ticks = [];
      for (let t = 0; t <= game.tick; t += decisionInterval) {
        ticks.push(Math.floor(t));
      }
      
      for (const commander of gameCommanders) {
        let resources = 200;
        let military = 10;
        
        for (const tick of ticks) {
          if (tick > game.tick) break;
          
          const gameProgress = tick / Math.max(game.tick, 1);
          resources = Math.min(5000, 200 + gameProgress * 2000 + Math.random() * 500);
          military = Math.min(200, 10 + gameProgress * 150 + Math.random() * 30);
          
          const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
          let actionTaken = {};
          
          switch (actionType) {
            case 'build':
              actionTaken = {
                type: 'build',
                position: { x: Math.floor(Math.random() * game.map_width), y: Math.floor(Math.random() * game.map_height) },
                building: buildingTypes[Math.floor(Math.random() * buildingTypes.length)],
              };
              break;
            case 'attack':
              actionTaken = {
                type: 'attack',
                target: { x: Math.floor(Math.random() * game.map_width), y: Math.floor(Math.random() * game.map_height) },
                units: Math.floor(Math.random() * 10) + 1,
              };
              break;
            case 'move':
              actionTaken = {
                type: 'move',
                from: { x: Math.floor(Math.random() * game.map_width), y: Math.floor(Math.random() * game.map_height) },
                to: { x: Math.floor(Math.random() * game.map_width), y: Math.floor(Math.random() * game.map_height) },
                units: Math.floor(Math.random() * 5) + 1,
              };
              break;
            case 'gather':
              actionTaken = {
                type: 'gather',
                resource_node: { x: Math.floor(Math.random() * game.map_width), y: Math.floor(Math.random() * game.map_height) },
                workers: Math.floor(Math.random() * 5) + 1,
              };
              break;
            case 'research':
              actionTaken = {
                type: 'research',
                technology: `tech_${Math.floor(Math.random() * 5) + 1}`,
                building: buildingTypes[Math.floor(Math.random() * buildingTypes.length)],
              };
              break;
            case 'scout':
              actionTaken = {
                type: 'scout',
                target: { x: Math.floor(Math.random() * game.map_width), y: Math.floor(Math.random() * game.map_height) },
                units: Math.floor(Math.random() * 3) + 1,
              };
              break;
          }
          
          const prompt = `Game state at tick ${tick}:
- Resources: ${Math.floor(resources)} minerals
- Military strength: ${military.toFixed(1)}
- Map size: ${game.map_width}x${game.map_height}
- Commander: ${commander.name} (${commander.archetype})
- Game progress: ${(gameProgress * 100).toFixed(1)}%`;

          const modelResponse = {
            reasoning: `Based on current game state, ${actionType} is the optimal action.`,
            confidence: 0.6 + Math.random() * 0.3,
            action: actionTaken,
          };
          
          // Latency varies based on action complexity
          const baseLatency = actionType === 'research' ? 500 : 200;
          const decisionLatency = baseLatency + Math.random() * 1500;
          
          // Token usage varies
          const tokensUsed = 150 + Math.floor(Math.random() * 850);
          
          aiDecisions.push({
            game_id: game.id,
            tick,
            player_id: commander.player_id,
            commander_id: commander.id,
            prompt_hash: `hash_${tick}_${commander.id}_${Math.floor(Math.random() * 10000)}`,
            prompt: prompt,
            model_response: JSON.stringify(modelResponse),
            action_taken: actionTaken,
            decision_latency_ms: Math.floor(decisionLatency),
            tokens_used: tokensUsed,
            cache_hit: Math.random() > 0.65, // 35% cache hit rate
            fallback_used: Math.random() > 0.92, // 8% fallback rate
          });
        }
      }
    }

    const { data: insertedAiDecisions, error: aiDecisionsError } = await supabase
      .from('ai_decisions')
      .insert(aiDecisions)
      .select();

    if (aiDecisionsError) {
      throw new Error(`Failed to insert AI decisions: ${aiDecisionsError.message}`);
    }

    console.log(`✅ Created ${insertedAiDecisions.length} AI decisions\n`);

    // 6. Create AI metrics
    console.log('📈 Creating AI metrics...');
    const aiMetrics = [];

    const metricTypes = [
      'decision_latency_avg',
      'decision_latency_p95',
      'decision_latency_p99',
      'cache_hit_rate',
      'tokens_per_decision',
      'total_tokens_used',
      'win_rate',
      'resource_efficiency',
      'military_efficiency',
      'build_order_efficiency',
      'scouting_efficiency',
      'combat_efficiency',
      'economy_growth_rate',
      'military_growth_rate',
      'decision_accuracy',
      'strategic_consistency',
      'response_time_variance',
      'fallback_usage_rate',
    ];

    for (const game of insertedGames) {
      if (game.status === 'waiting') continue;
      
      const gameCommanders = insertedCommanders.filter(c => c.game_id === game.id);
      const gameProgress = game.tick / 200; // Normalize to typical game length
      
      // Per-game metrics
      for (const metricType of metricTypes) {
        let metricValue;
        let metadata = { 
          game_status: game.status,
          total_ticks: game.tick,
          map_size: `${game.map_width}x${game.map_height}`,
        };
        
        switch (metricType) {
          case 'decision_latency_avg':
            metricValue = 300 + Math.random() * 1200;
            metadata.unit = 'ms';
            break;
          case 'decision_latency_p95':
            metricValue = 800 + Math.random() * 1500;
            metadata.unit = 'ms';
            break;
          case 'decision_latency_p99':
            metricValue = 1500 + Math.random() * 2000;
            metadata.unit = 'ms';
            break;
          case 'cache_hit_rate':
            metricValue = 0.25 + Math.random() * 0.4;
            metadata.unit = 'ratio';
            break;
          case 'tokens_per_decision':
            metricValue = 200 + Math.random() * 600;
            metadata.unit = 'tokens';
            break;
          case 'total_tokens_used':
            metricValue = (200 + Math.random() * 600) * (game.tick / 6);
            metadata.unit = 'tokens';
            break;
          case 'win_rate':
            metricValue = game.winner_player_id ? 1.0 : 0.5 + Math.random() * 0.3;
            metadata.unit = 'ratio';
            break;
          case 'resource_efficiency':
            metricValue = 0.6 + Math.random() * 0.3;
            metadata.unit = 'ratio';
            break;
          case 'military_efficiency':
            metricValue = 0.5 + Math.random() * 0.4;
            metadata.unit = 'ratio';
            break;
          case 'build_order_efficiency':
            metricValue = 0.55 + Math.random() * 0.35;
            metadata.unit = 'ratio';
            break;
          case 'scouting_efficiency':
            metricValue = 0.4 + Math.random() * 0.4;
            metadata.unit = 'ratio';
            break;
          case 'combat_efficiency':
            metricValue = 0.5 + Math.random() * 0.4;
            metadata.unit = 'ratio';
            break;
          case 'economy_growth_rate':
            metricValue = 0.02 + Math.random() * 0.05;
            metadata.unit = 'per_tick';
            break;
          case 'military_growth_rate':
            metricValue = 0.015 + Math.random() * 0.04;
            metadata.unit = 'per_tick';
            break;
          case 'decision_accuracy':
            metricValue = 0.65 + Math.random() * 0.25;
            metadata.unit = 'ratio';
            break;
          case 'strategic_consistency':
            metricValue = 0.6 + Math.random() * 0.3;
            metadata.unit = 'ratio';
            break;
          case 'response_time_variance':
            metricValue = 200 + Math.random() * 400;
            metadata.unit = 'ms';
            break;
          case 'fallback_usage_rate':
            metricValue = 0.05 + Math.random() * 0.1;
            metadata.unit = 'ratio';
            break;
          default:
            metricValue = Math.random();
        }

        aiMetrics.push({
          game_id: game.id,
          metric_type: metricType,
          metric_value: metricValue,
          metadata: metadata,
        });
      }
      
      // Per-commander metrics
      for (const commander of gameCommanders) {
        const commanderMetrics = [
          'commander_decision_count',
          'commander_avg_utility_score',
          'commander_strategy_adherence',
        ];
        
        for (const metricType of commanderMetrics) {
          let metricValue;
          switch (metricType) {
            case 'commander_decision_count':
              metricValue = Math.floor(game.tick / 6);
              break;
            case 'commander_avg_utility_score':
              metricValue = 0.5 + Math.random() * 0.4;
              break;
            case 'commander_strategy_adherence':
              metricValue = 0.6 + Math.random() * 0.3;
              break;
          }
          
          aiMetrics.push({
            game_id: game.id,
            metric_type: metricType,
            metric_value: metricValue,
            metadata: {
              commander_id: commander.id,
              commander_name: commander.name,
              commander_archetype: commander.archetype,
            },
          });
        }
      }
    }

    const { data: insertedMetrics, error: metricsError } = await supabase
      .from('ai_metrics')
      .insert(aiMetrics)
      .select();

    if (metricsError) {
      throw new Error(`Failed to insert AI metrics: ${metricsError.message}`);
    }

    console.log(`✅ Created ${insertedMetrics.length} AI metrics\n`);

    // 7. Create game snapshots
    console.log('💾 Creating game snapshots...');
    const gameSnapshots = [];

    for (const game of insertedGames) {
      if (game.status === 'waiting') continue;
      
      // Create snapshots at key intervals
      const snapshotTicks = [0, 25, 50, 75, 100, 125, 150, 175, 200].filter(t => t <= game.tick);
      
      for (const tick of snapshotTicks) {
        gameSnapshots.push({
          game_id: game.id,
          tick,
          state: {
            tick,
            players: [
              {
                id: 1,
                resources: Math.floor(Math.random() * 1000) + 100,
                units: Math.floor(Math.random() * 20) + 5,
                buildings: Math.floor(Math.random() * 10) + 2,
              },
              {
                id: 2,
                resources: Math.floor(Math.random() * 1000) + 100,
                units: Math.floor(Math.random() * 20) + 5,
                buildings: Math.floor(Math.random() * 10) + 2,
              },
            ],
            map: {
              width: game.map_width,
              height: game.map_height,
              seed: game.map_seed,
            },
          },
        });
      }
    }

    const { data: insertedSnapshots, error: snapshotsError } = await supabase
      .from('game_snapshots')
      .insert(gameSnapshots)
      .select();

    if (snapshotsError) {
      throw new Error(`Failed to insert game snapshots: ${snapshotsError.message}`);
    }

    console.log(`✅ Created ${insertedSnapshots.length} game snapshots\n`);

    // Summary
    console.log('✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Games: ${insertedGames.length}`);
    console.log(`   Commander Personalities: ${insertedCommanders.length}`);
    console.log(`   Strategic Intents: ${insertedIntents.length}`);
    console.log(`   AI Decision Logs: ${insertedLogs.length}`);
    console.log(`   AI Decisions: ${insertedAiDecisions.length}`);
    console.log(`   AI Metrics: ${insertedMetrics.length}`);
    console.log(`   Game Snapshots: ${insertedSnapshots.length}\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seeding script
seedDatabase();

