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
    text: 'The earth shudders; fungus withers. Dr. Mara whispers, "We took its breath." The archive stands empty, and the silence weighs heavier than any resource we gained. In the depths, something that had slept for eons finally stopped dreaming. We filled our crates with ore and left with hollow hands.'
  },
  {
    id: 'archive-preserve',
    campaignId: 'archive',
    choices: ['preserve'],
    tone: 'hopeful',
    text: 'Tiny green filaments push through the ruin; a whisper of tomorrow. The Bio-Seed remembers our care, and the land begins to heal. In the quiet dark, life stirs again. We chose patience over plunder, and the future unfurls like a slow-blooming flower.'
  },
  {
    id: 'archive-harvest-extended',
    campaignId: 'archive',
    choices: ['harvest'],
    tone: 'somber',
    text: 'The machines hummed with stolen life. We extracted what we needed, and the archive fell silent—a tomb we had emptied ourselves. Years later, when the last resource ran dry, we looked back and understood: we had traded tomorrow for today, and tomorrow never came.'
  },
  {
    id: 'archive-preserve-extended',
    campaignId: 'archive',
    choices: ['preserve'],
    tone: 'hopeful',
    text: 'We sealed the chamber and walked away, leaving the Bio-Seed to its slow awakening. Generations passed. When our descendants returned, they found not an empty vault, but a garden—a living testament to the choice we made. The land had remembered our mercy, and it repaid us a thousandfold.'
  },
  {
    id: 'archive-mixed',
    campaignId: 'archive',
    choices: ['harvest', 'preserve'],
    tone: 'mixed',
    text: 'We took what we needed to survive, then sealed what remained. A compromise carved from necessity. The archive stands divided—one half hollowed, one half healing. The land remembers both our hunger and our restraint. Perhaps that balance is enough.'
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


