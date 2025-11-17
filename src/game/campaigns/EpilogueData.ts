/**
 * Epilogue Data
 * Pre-written epilogues for different campaign outcomes
 */

export interface EpilogueData {
  id: string;
  campaignId: string;
  choices: string[];
  tone: 'somber' | 'hopeful' | 'mixed';
  text: string;
}

export const EPILOGUE_DATA: EpilogueData[] = [
  {
    id: 'overclock-only',
    campaignId: 'symbiosis',
    choices: ['overclock'],
    tone: 'somber',
    text: 'Cities rose like glass, humming with stolen nights. We had power enough to forget the river\'s taste. In exchange, the quiet corners remembered the names of the lost.'
  },
  {
    id: 'bioconserve-only',
    campaignId: 'symbiosis',
    choices: ['bioconserve'],
    tone: 'hopeful',
    text: 'Green light stitched the ruins back together. The land taught us patience; the people learned to wait. We traded speed for seeds, and the future hummed soft and alive.'
  },
  {
    id: 'mixed',
    campaignId: 'symbiosis',
    choices: ['overclock', 'bioconserve'],
    tone: 'mixed',
    text: 'We burned bright to survive, then learned to plant again. Steel met sap; scars healed into scaffolds. The world remembered both our hunger — and our attempt to make amends.'
  },
  {
    id: 'archive-harvest',
    campaignId: 'archive',
    choices: ['harvest'],
    tone: 'somber',
    text: 'The earth shudders; fungus withers. Dr. Mara whispers, "We took its breath." The archive stands empty, and the silence weighs heavier than any resource we gained.'
  },
  {
    id: 'archive-preserve',
    campaignId: 'archive',
    choices: ['preserve'],
    tone: 'hopeful',
    text: 'Tiny green filaments push through the ruin; a whisper of tomorrow. The Bio-Seed remembers our care, and the land begins to heal.'
  }
];

/**
 * Get epilogue by campaign and choices
 */
export function getEpilogue(campaignId: string, choices: string[]): EpilogueData | null {
  // Find exact match first
  let match = EPILOGUE_DATA.find(
    ep => ep.campaignId === campaignId && 
    ep.choices.length === choices.length &&
    ep.choices.every(c => choices.includes(c))
  );

  // Find partial match
  if (!match) {
    match = EPILOGUE_DATA.find(
      ep => ep.campaignId === campaignId && 
      ep.choices.some(c => choices.includes(c))
    );
  }

  // Find by campaign only
  if (!match) {
    match = EPILOGUE_DATA.find(ep => ep.campaignId === campaignId);
  }

  return match || null;
}

