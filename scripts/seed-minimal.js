/**
 * Minimal Database Seeding Script for Quaternion Game
 * 
 * This script creates a minimal test setup to trigger Edge Functions:
 * - One test game
 * - One commander personality
 * - Initial strategic intents
 * - Optional placeholder AI logs/metrics
 * 
 * Usage:
 *   node scripts/seed-minimal.js
 * 
 * Environment Variables Required:
 *   SUPABASE_URL or VITE_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (for backend operations)
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

async function seedMinimal() {
  console.log('🌱 Starting minimal database seeding...\n');

  try {
    // 1. Create a test game
    console.log('📦 Creating test game...');
    const testGame = {
      status: 'active',
      map_seed: Math.floor(Math.random() * 1000000),
      map_width: 64,
      map_height: 64,
      tick: 10, // Start with some progress
    };

    const { data: insertedGame, error: gameError } = await supabase
      .from('games')
      .insert(testGame)
      .select()
      .single();

    if (gameError) {
      throw new Error(`Failed to insert game: ${gameError.message}`);
    }

    console.log(`✅ Created test game: ${insertedGame.id} (status: ${insertedGame.status})\n`);

    // 2. Create a commander personality
    console.log('👤 Creating commander personality...');
    const testCommander = commandersConfig.commanders[0]; // Use first commander from config
    const traits = mapCommanderTraits(testCommander);

    const commanderData = {
      game_id: insertedGame.id,
      player_id: 1,
      archetype: getArchetype(testCommander.id),
      name: testCommander.name,
      ...traits,
    };

    const { data: insertedCommander, error: commanderError } = await supabase
      .from('commander_personalities')
      .insert(commanderData)
      .select()
      .single();

    if (commanderError) {
      throw new Error(`Failed to insert commander: ${commanderError.message}`);
    }

    console.log(`✅ Created commander: ${insertedCommander.name} (${insertedCommander.archetype})\n`);

    // 3. Create initial strategic intents
    console.log('🎯 Creating strategic intents...');
    const strategicIntents = [
      {
        game_id: insertedGame.id,
        commander_id: insertedCommander.id,
        tick: 0,
        intent: 'aggressive',
        confidence: 0.7,
        priority_defense: 0.3,
        priority_offense: 0.8,
        priority_economy: 0.4,
        priority_expansion: 0.5,
        priority_technology: 0.3,
      },
      {
        game_id: insertedGame.id,
        commander_id: insertedCommander.id,
        tick: 5,
        intent: 'adaptive',
        confidence: 0.6,
        priority_defense: 0.5,
        priority_offense: 0.5,
        priority_economy: 0.5,
        priority_expansion: 0.5,
        priority_technology: 0.5,
      },
      {
        game_id: insertedGame.id,
        commander_id: insertedCommander.id,
        tick: 10,
        intent: 'expansionist',
        confidence: 0.75,
        priority_defense: 0.4,
        priority_offense: 0.4,
        priority_economy: 0.7,
        priority_expansion: 0.8,
        priority_technology: 0.4,
      },
    ];

    const { data: insertedIntents, error: intentsError } = await supabase
      .from('strategic_intents')
      .insert(strategicIntents)
      .select();

    if (intentsError) {
      throw new Error(`Failed to insert strategic intents: ${intentsError.message}`);
    }

    console.log(`✅ Created ${insertedIntents.length} strategic intents\n`);

    // 4. Optional: Create placeholder AI decision logs
    console.log('📊 Creating placeholder AI decision logs...');
    const decisionLogs = [
      {
        game_id: insertedGame.id,
        commander_id: insertedCommander.id,
        tick: 5,
        decision_type: 'build',
        current_intent: 'aggressive',
        utility_score: 0.65,
        chosen: true,
        resources: 250,
        military_strength: 15.5,
        enemy_military_strength: 12.0,
        threat_level: 0.4,
        reasoning: 'Initial setup: Building infrastructure to support aggressive expansion strategy.',
        target_position: { x: 32, y: 32 },
        target_entity_id: 'base_1',
      },
      {
        game_id: insertedGame.id,
        commander_id: insertedCommander.id,
        tick: 10,
        decision_type: 'expand',
        current_intent: 'expansionist',
        utility_score: 0.72,
        chosen: true,
        resources: 450,
        military_strength: 25.0,
        enemy_military_strength: 20.0,
        threat_level: 0.3,
        reasoning: 'Expanding territory to secure additional resource nodes.',
        target_position: { x: 40, y: 35 },
        target_entity_id: 'outpost_1',
      },
    ];

    const { data: insertedLogs, error: logsError } = await supabase
      .from('ai_decision_logs')
      .insert(decisionLogs)
      .select();

    if (logsError) {
      throw new Error(`Failed to insert decision logs: ${logsError.message}`);
    }

    console.log(`✅ Created ${insertedLogs.length} AI decision logs\n`);

    // 5. Optional: Create placeholder AI metrics
    console.log('📈 Creating placeholder AI metrics...');
    const aiMetrics = [
      {
        game_id: insertedGame.id.toString(),
        metric_type: 'decision_latency_avg',
        metric_value: 450.5,
        metadata: { game_status: insertedGame.status, total_ticks: insertedGame.tick },
      },
      {
        game_id: insertedGame.id.toString(),
        metric_type: 'cache_hit_rate',
        metric_value: 0.35,
        metadata: { game_status: insertedGame.status, total_ticks: insertedGame.tick },
      },
      {
        game_id: insertedGame.id.toString(),
        metric_type: 'tokens_per_decision',
        metric_value: 350,
        metadata: { game_status: insertedGame.status, total_ticks: insertedGame.tick },
      },
    ];

    const { data: insertedMetrics, error: metricsError } = await supabase
      .from('ai_metrics')
      .insert(aiMetrics)
      .select();

    if (metricsError) {
      throw new Error(`Failed to insert AI metrics: ${metricsError.message}`);
    }

    console.log(`✅ Created ${insertedMetrics.length} AI metrics\n`);

    // Summary
    console.log('✨ Minimal database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Game ID: ${insertedGame.id}`);
    console.log(`   Game Status: ${insertedGame.status}`);
    console.log(`   Commander: ${insertedCommander.name} (${insertedCommander.archetype})`);
    console.log(`   Strategic Intents: ${insertedIntents.length}`);
    console.log(`   AI Decision Logs: ${insertedLogs.length}`);
    console.log(`   AI Metrics: ${insertedMetrics.length}\n`);
    console.log('🚀 Next steps:');
    console.log('   1. Start your server: npm start');
    console.log('   2. Play the test game via API or UI');
    console.log('   3. Watch Edge Functions (ai-strategy, replay-handler) get triggered');
    console.log('   4. Check database tables and Edge Functions dashboard for activity\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seeding script
seedMinimal();


