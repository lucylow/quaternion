/**
 * Dialogue Configuration
 * Defines dialogue lines with lip-sync viseme data
 */

import { DialogueLine } from './AudioEngine';
import { COMMANDERS } from '@/data/quaternionData';

/**
 * Sample dialogue lines with viseme timing
 * In production, these would be generated from phoneme analysis or DAW exports
 */
export const DIALOGUE_LINES: Record<string, DialogueLine[]> = {
  AUREN: [
    {
      id: 'auren_intro',
      url: '/assets/dialogue/auren/intro.wav',
      text: 'The machine remembers. Every cycle, every choice.',
      speaker: 'Auren',
      visemes: [
        { time: 0.0, viseme: 'rest' },
        { time: 0.1, viseme: 'aa' },
        { time: 0.3, viseme: 'mm' },
        { time: 0.5, viseme: 'ee' },
        { time: 0.7, viseme: 'oh' },
        { time: 0.9, viseme: 'rest' }
      ]
    },
    {
      id: 'auren_warning',
      url: '/assets/dialogue/auren/warning.wav',
      text: 'Instability rising. Structural integrity compromised.',
      speaker: 'Auren',
      visemes: [
        { time: 0.0, viseme: 'rest' },
        { time: 0.1, viseme: 'ee' },
        { time: 0.3, viseme: 'aa' },
        { time: 0.5, viseme: 'mm' },
        { time: 0.7, viseme: 'oh' },
        { time: 0.9, viseme: 'rest' }
      ]
    }
  ],
  LIRA: [
    {
      id: 'lira_intro',
      url: '/assets/dialogue/lira/intro.wav',
      text: 'Life finds a way. Even here, in the void.',
      speaker: 'Lira',
      visemes: [
        { time: 0.0, viseme: 'rest' },
        { time: 0.1, viseme: 'aa' },
        { time: 0.3, viseme: 'ff' },
        { time: 0.5, viseme: 'ee' },
        { time: 0.7, viseme: 'oh' },
        { time: 0.9, viseme: 'rest' }
      ]
    },
    {
      id: 'lira_concern',
      url: '/assets/dialogue/lira/concern.wav',
      text: 'The biomes cry out. Can you hear them?',
      speaker: 'Lira',
      visemes: [
        { time: 0.0, viseme: 'rest' },
        { time: 0.1, viseme: 'aa' },
        { time: 0.3, viseme: 'mm' },
        { time: 0.5, viseme: 'ee' },
        { time: 0.7, viseme: 'oh' },
        { time: 0.9, viseme: 'rest' }
      ]
    }
  ],
  VIREL: [
    {
      id: 'virel_intro',
      url: '/assets/dialogue/virel/intro.wav',
      text: 'Power calls to power. Will you answer?',
      speaker: 'Virel',
      visemes: [
        { time: 0.0, viseme: 'rest' },
        { time: 0.1, viseme: 'oh' },
        { time: 0.3, viseme: 'aa' },
        { time: 0.5, viseme: 'ee' },
        { time: 0.7, viseme: 'rest' }
      ]
    },
    {
      id: 'virel_excitement',
      url: '/assets/dialogue/virel/excitement.wav',
      text: 'The storm builds. Let it rage!',
      speaker: 'Virel',
      visemes: [
        { time: 0.0, viseme: 'rest' },
        { time: 0.1, viseme: 'aa' },
        { time: 0.3, viseme: 'mm' },
        { time: 0.5, viseme: 'ee' },
        { time: 0.7, viseme: 'rest' }
      ]
    }
  ],
  KOR: [
    {
      id: 'kor_intro',
      url: '/assets/dialogue/kor/intro.wav',
      text: 'Data flows. Patterns emerge. Questions remain.',
      speaker: 'Kor',
      visemes: [
        { time: 0.0, viseme: 'rest' },
        { time: 0.1, viseme: 'aa' },
        { time: 0.3, viseme: 'ee' },
        { time: 0.5, viseme: 'mm' },
        { time: 0.7, viseme: 'oh' },
        { time: 0.9, viseme: 'rest' }
      ]
    },
    {
      id: 'kor_observation',
      url: '/assets/dialogue/kor/observation.wav',
      text: 'Interesting. The equations shift. Reality responds.',
      speaker: 'Kor',
      visemes: [
        { time: 0.0, viseme: 'rest' },
        { time: 0.1, viseme: 'ee' },
        { time: 0.3, viseme: 'aa' },
        { time: 0.5, viseme: 'mm' },
        { time: 0.7, viseme: 'oh' },
        { time: 0.9, viseme: 'rest' }
      ]
    }
  ]
};

/**
 * Get dialogue line by ID
 */
export function getDialogueLine(commanderId: string, lineId: string): DialogueLine | undefined {
  const lines = DIALOGUE_LINES[commanderId];
  if (!lines) return undefined;
  return lines.find(l => l.id === lineId);
}

/**
 * Get random dialogue line for commander
 */
export function getRandomDialogue(commanderId: string): DialogueLine | undefined {
  const lines = DIALOGUE_LINES[commanderId];
  if (!lines || lines.length === 0) return undefined;
  return lines[Math.floor(Math.random() * lines.length)];
}

