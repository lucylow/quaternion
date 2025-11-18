/**
 * Music Configuration
 * Defines music stems and adaptive mixing rules
 */

import { MusicStem } from './AudioEngine';

export const MUSIC_STEMS: MusicStem[] = [
  {
    id: 'ambient_conserve',
    url: '/assets/music/stems/ambient_conserve.mp3',
    volume: 0.6,
    loop: true
  },
  {
    id: 'ambient_exploit',
    url: '/assets/music/stems/ambient_exploit.mp3',
    volume: 0.6,
    loop: true
  },
  {
    id: 'rhythm_light',
    url: '/assets/music/stems/rhythm_light.mp3',
    volume: 0.4,
    loop: true
  },
  {
    id: 'rhythm_heavy',
    url: '/assets/music/stems/rhythm_heavy.mp3',
    volume: 0.5,
    loop: true
  },
  {
    id: 'harmony_organic',
    url: '/assets/music/stems/harmony_organic.mp3',
    volume: 0.5,
    loop: true
  },
  {
    id: 'harmony_industrial',
    url: '/assets/music/stems/harmony_industrial.mp3',
    volume: 0.5,
    loop: true
  },
  {
    id: 'lead_motif',
    url: '/assets/music/stems/lead_motif.mp3',
    volume: 0.4,
    loop: true
  },
  {
    id: 'combat_accent',
    url: '/assets/music/stems/combat_accent.mp3',
    volume: 0.6,
    loop: true
  },
  {
    id: 'victory',
    url: '/assets/music/stems/victory.mp3',
    volume: 0.8,
    loop: false
  },
  {
    id: 'defeat',
    url: '/assets/music/stems/defeat.mp3',
    volume: 0.8,
    loop: false
  }
];

/**
 * Music state mapping
 */
export type MusicState = 'calm' | 'neutral' | 'tension' | 'combat' | 'victory' | 'defeat';

export const MUSIC_STATE_STEMS: Record<MusicState, string[]> = {
  calm: ['ambient_conserve', 'harmony_organic'],
  neutral: ['ambient_conserve', 'rhythm_light', 'harmony_organic'],
  tension: ['ambient_conserve', 'rhythm_light', 'lead_motif'],
  combat: ['ambient_exploit', 'rhythm_heavy', 'combat_accent'],
  victory: ['victory'],
  defeat: ['defeat']
};

/**
 * Get active stems for a given state
 */
export function getStemsForState(state: MusicState, morality: number): string[] {
  const baseStems = MUSIC_STATE_STEMS[state];
  
  // Adjust based on morality
  if (morality > 0.3) {
    // Conserve path - use organic harmony
    return baseStems.map(s => s === 'harmony_industrial' ? 'harmony_organic' : s);
  } else if (morality < -0.3) {
    // Exploit path - use industrial harmony
    return baseStems.map(s => s === 'harmony_organic' ? 'harmony_industrial' : s);
  }
  
  return baseStems;
}

