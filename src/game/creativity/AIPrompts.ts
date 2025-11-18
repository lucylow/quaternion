/**
 * Ready-to-Use AI Prompts
 * Copy-paste prompts for generating judge-ready content
 */

export const AIPrompts = {
  /**
   * Character flavor lines (LLM)
   */
  characterFlavor: {
    mara: `SYSTEM: You are a concise sci-fi character writer. Output 4 one-line voiced lines for Dr. Mara (empathetic biologist) reacting to 'player harvests Bio-Seed'—each line 6–10 words.`,
    
    patch: `SYSTEM: You are a concise sci-fi character writer. Output 4 one-line voiced lines for Patch (wry drone) reacting to 'player conserves Bio-Seed'—each line 6–10 words.`,
    
    lian: `SYSTEM: You are a concise sci-fi character writer. Output 4 one-line voiced lines for Commander Lian (pragmatic military leader) reacting to 'player chooses Reactor Overclock'—each line 6–10 words.`
  },

  /**
   * Event flavor (LLM → JSON)
   */
  narrativeEvent: `SYSTEM: Produce one narrative event JSON for when 'Reactor Overclock' is researched.

OUTPUT: {
  "title": "event title",
  "flavor": "one-sentence description",
  "mechanic": {
    "energyMultiplier": 1.5,
    "sideEffect": "description"
  }
}`,

  /**
   * Visual concept prompts (OpenArt/DALL-E)
   */
  visualConcepts: {
    ui: `Biotic cathedral UI: luminous Bio-Seed under glass, fungal veins, warm teal and amber lights, cinematic, high detail, 3/4 angle, concept art, holographic interface elements`,
    
    kaiju: `Massive Zerg-inspired Kaiju monster, the Zyrithon, in VR perspective, destroying structures, bioluminescent veins, dark teal and neon green, cinematic, high detail, dramatic lighting`,
    
    tileHeatmap: `Strategic tile heatmap: glowing terrain with faction control visualization, teal vs orange zones, pulsing bioluminescent veins, top-down view, game UI style, high contrast`
  },

  /**
   * Music stem requests (Fuser/Google)
   */
  musicStems: {
    conserve: `Create a 90s ambient+synth stem in three parts: (0–30) slow organ + field recordings; (30–60) rising tension with percussive clicks; (60–90) triumphant synth motif. Export stems: organ, percussion, field. Mood: organic, hopeful, bioluminescent.`,
    
    exploit: `Create an industrial synth stem in three parts: (0–30) mechanical rhythms + metallic textures; (30–60) building intensity with harsh synths; (60–90) aggressive electronic climax. Export stems: rhythm, synth, texture. Mood: cold, aggressive, technological.`,
    
    neutral: `Create a balanced ambient stem in three parts: (0–30) atmospheric pads + subtle textures; (30–60) moderate tension with layered elements; (60–90) resolved harmony. Export stems: pad, texture, harmony. Mood: balanced, contemplative, neutral.`
  },

  /**
   * Advisor LLM prompt (short)
   */
  advisorRecommendation: `SYSTEM: You're a succinct tactical advisor. Given state JSON, return one recommended action and 8-word reason. Output JSON only.

INPUT: {
  "resources": {"matter": 50, "energy": 30, "life": 40, "knowledge": 20},
  "enemyThreat": 0.6,
  "terrainAdvantage": 0.4
}

OUTPUT: {
  "action": "recommended action",
  "reason": "8 word explanation"
}`,

  /**
   * Mystery event generation
   */
  mysteryEvent: `SYSTEM: Generate a mystery event for an open-world strategy game.

Context: Player discovers an abandoned research facility.

Output JSON:
{
  "mysteryType": "scientific_experiment|missing_persons|faction_conflict|supernatural_event",
  "title": "Mystery title",
  "description": "Brief description",
  "clues": [
    {"description": "clue 1", "location": "where found"},
    {"description": "clue 2", "location": "where found"},
    {"description": "clue 3", "location": "where found"}
  ],
  "solution": "What happened",
  "reward": "Reward description"
}`,

  /**
   * Alternate ending generation
   */
  alternateEnding: `SYSTEM: Generate an alternate ending for a strategy game based on player choices.

Player Choices: [list of major choices]
Moral Alignment: good|evil|neutral
Final State: [game state summary]

Output JSON:
{
  "title": "Ending title",
  "description": "2-3 sentence ending description",
  "consequences": ["consequence 1", "consequence 2", "consequence 3"],
  "tone": "hopeful|somber|triumphant|melancholic"
}`
};

/**
 * Get prompt by key
 */
export function getPrompt(category: keyof typeof AIPrompts, key?: string): string {
  if (key && category in AIPrompts) {
    const categoryPrompts = AIPrompts[category] as any;
    if (typeof categoryPrompts === 'object' && key in categoryPrompts) {
      return categoryPrompts[key];
    }
  }
  
  if (category in AIPrompts && typeof AIPrompts[category] === 'string') {
    return AIPrompts[category] as string;
  }
  
  return '';
}

