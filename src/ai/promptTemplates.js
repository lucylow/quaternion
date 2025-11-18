/**
 * Build strategic decision prompt from game state
 */
export function buildStrategyPrompt(gameState, playerId) {
  const player = gameState.players[playerId];
  const myUnits = gameState.units.filter(u => u.playerId === playerId);
  const myBuildings = gameState.buildings.filter(b => b.playerId === playerId);
  const enemyUnits = gameState.units.filter(u => u.playerId !== playerId);
  const enemyBuildings = gameState.buildings.filter(b => b.playerId !== playerId);

  const summary = {
    tick: gameState.tick,
    resources: {
      minerals: player.minerals,
      gas: player.gas
    },
    army: {
      workers: myUnits.filter(u => u.type === 'worker').length,
      soldiers: myUnits.filter(u => u.type === 'soldier').length,
      tanks: myUnits.filter(u => u.type === 'tank').length,
      total: myUnits.length
    },
    buildings: {
      bases: myBuildings.filter(b => b.type === 'base').length,
      barracks: myBuildings.filter(b => b.type === 'barracks').length,
      factories: myBuildings.filter(b => b.type === 'factory').length,
      total: myBuildings.length
    },
    enemies: {
      units: enemyUnits.length,
      buildings: enemyBuildings.length,
      nearestThreat: findNearestThreat(myBuildings[0], enemyUnits)
    }
  };

  return `GAME STATE (Tick ${summary.tick}):
Resources: ${summary.resources.minerals} minerals, ${summary.resources.gas} gas
Army: ${summary.army.workers} workers, ${summary.army.soldiers} soldiers, ${summary.army.tanks} tanks
Buildings: ${summary.buildings.bases} bases, ${summary.buildings.barracks} barracks, ${summary.buildings.factories} factories
Enemy: ${summary.enemies.units} units, ${summary.enemies.buildings} buildings
Threat distance: ${summary.enemies.nearestThreat}

Recommend ONE high-level strategic action. Consider:
- Economy: Build workers if < 12
- Military: Build soldiers (100 minerals) or tanks (150 minerals, 100 gas)
- Expansion: Build new base if resources > 400
- Defense: Focus defense if enemy units nearby
- Attack: Launch attack if army size > 5`;
}

function findNearestThreat(base, enemyUnits) {
  if (!base || enemyUnits.length === 0) return 'none';
  const nearest = enemyUnits.reduce((min, u) => {
    const dist = Math.hypot(u.x - base.x, u.y - base.y);
    return dist < min ? dist : min;
  }, Infinity);
  return nearest === Infinity ? 'none' : Math.round(nearest);
}

/**
 * Narrative Micro Event Generator
 * Generates compact narrative events for campaign system
 */
export const NARRATIVE_MICRO_EVENT = {
  system: `You are a concise in-game event generator. Input: {state}. Output JSON only:
{"event":"", "flavor":"", "effect":{}}.
Flavor max 25 words.
No graphic descriptions. Keep tone somber/poetic.`,

  buildPrompt: (input) => {
    return `${NARRATIVE_MICRO_EVENT.system}

INPUT:
${JSON.stringify(input, null, 2)}

OUTPUT:`
  }
};

/**
 * Epilogue Generator
 * Generates campaign ending epilogues based on player choices
 */
export const EPILOGUE_GENERATOR = {
  system: `You are a concise game epilogue writer. Given player choices and outcomes, produce a 25-40 word epilogue.
Tone should match the moral axis: somber for exploitation, hopeful for conservation, mixed for balanced.
Output JSON: {"epilogue": "text", "tone": "somber|hopeful|mixed"}`,

  buildPrompt: (choices, outcomes) => {
    return `${EPILOGUE_GENERATOR.system}

CHOICES: ${JSON.stringify(choices)}
OUTCOMES: ${JSON.stringify(outcomes)}

OUTPUT:`
  }
};

/**
 * Character Dialogue Generator
 * Generates character dialogue based on context
 */
export const CHARACTER_DIALOGUE = {
  system: `You are a game dialogue writer. Generate 1-2 sentence character dialogue (max 20 words) that:
- Matches the character's personality
- Responds to the current situation
- Feels natural and immersive`,

  buildPrompt: (character, context) => {
    return `${CHARACTER_DIALOGUE.system}

CHARACTER: ${character.name} - ${character.personality}
CONTEXT: ${JSON.stringify(context)}

OUTPUT:`
  }
};

/**
 * Faction Edict Generator
 * Generates faction doctrine based on reputation
 */
export const FACTION_EDICT = {
  system: `Given faction reputation scores, produce a 1-2 sentence faction edict explaining strategy and attitude toward the player.
Keep it concise (max 30 words).`,

  buildPrompt: (factionReputation) => {
    return `${FACTION_EDICT.system}

REPUTATION: ${JSON.stringify(factionReputation)}

OUTPUT:`
  }
};

/**
 * Commander Narrative Generator
 * Generates war strategy narratives specific to commander traits
 */
export const COMMANDER_NARRATIVE = {
  system: `You are a war strategy storyteller crafting narratives for commanders in a real-time strategy game.

Generate narratives that:
1. Reflect the commander's unique personality and strategic approach
2. Describe their decision-making process and tactical thinking
3. Show how their traits influence their strategy
4. Include a direct quote from the commander (their voice)
5. Provide strategic insight into their approach

Output JSON:
{
  "title": "Brief narrative title (3-6 words)",
  "narrative": "2-3 sentences describing the commander's strategic approach (40-60 words). Use vivid, military-strategic language.",
  "strategicInsight": "1 sentence explaining the strategic reasoning (15-25 words)",
  "commanderVoice": "Direct quote from the commander showing their personality (10-20 words)",
  "tone": "methodical|aggressive|exploratory|calculated|patient|chaotic",
  "narrativeTag": "situation tag"
}`,

  buildPrompt: (commander, situation, gameState) => {
    return `${COMMANDER_NARRATIVE.system}

COMMANDER: ${commander.name}
PERSONALITY: ${commander.personality}
SITUATION: ${situation}
GAME_STATE: ${JSON.stringify(gameState || {})}

OUTPUT:`
  }
};
