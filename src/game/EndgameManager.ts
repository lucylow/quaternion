/**
 * Endgame Manager - Detects and manages 6 distinct endgame scenarios
 * Each scenario represents a different philosophical path through the Quaternion
 */

import { Resources, Player } from './QuaternionGameState';

export type EndgameScenario = 
  | 'collapse'           // Failure route - chaos escalates
  | 'harmony'            // Equilibrium route - balance maintained
  | 'ascendancy'         // Tech victory - knowledge focus
  | 'reclamation'        // Bio victory - life focus
  | 'overclock'          // Power victory - energy maximized
  | 'ultimate_balance';  // Perfect balance - all axes in perfect sync

export interface EndgameData {
  scenario: EndgameScenario;
  title: string;
  narration: string;
  epilogue: string;
  visualTheme: {
    backgroundColor: string;
    primaryColor: string;
    secondaryColor: string;
    effects: string[];
  };
  audioTheme: {
    mood: 'somber' | 'tranquil' | 'ethereal' | 'serene' | 'chaotic' | 'transcendent';
    description: string;
  };
}

export class EndgameManager {
  /**
   * Detect which endgame scenario should trigger based on game state
   */
  static detectScenario(
    resources: Resources,
    instability: number,
    maxInstability: number,
    researchedTechs: Set<string>,
    moralAlignment: number,
    gameTime: number
  ): EndgameScenario | null {
    const { matter, energy, life, knowledge } = resources;
    const avg = (matter + energy + life + knowledge) / 4;
    
    // Check for failure conditions (Collapse Timeline)
    if (instability >= maxInstability || 
        matter === 0 || energy === 0 || life === 0 || knowledge === 0) {
      return 'collapse';
    }
    
    // Check for perfect balance (Ultimate Balance - Fifth Ending)
    // All resources within ±2% for at least 10 seconds
    const maxDeviation = Math.max(
      Math.abs(matter - avg),
      Math.abs(energy - avg),
      Math.abs(life - avg),
      Math.abs(knowledge - avg)
    );
    const perfectBalanceThreshold = avg * 0.02; // 2% deviation
    
    if (maxDeviation <= perfectBalanceThreshold && avg > 200) {
      // All resources must be reasonably high for true balance
      return 'ultimate_balance';
    }
    
    // Check for equilibrium/harmony (within ±15%)
    const harmonyThreshold = avg * 0.15; // 15% deviation
    if (maxDeviation <= harmonyThreshold && avg > 150) {
      // Check if it's sustained equilibrium
      return 'harmony';
    }
    
    // Check for Ascendancy (Knowledge/Technology victory)
    if (researchedTechs.has('quantum_ascendancy') || 
        knowledge > avg * 1.5 && knowledge > 500) {
      return 'ascendancy';
    }
    
    // Check for Reclamation (Life focus)
    // Life is significantly higher than other resources
    if (life > avg * 1.5 && life > 500 && 
        life > matter * 1.3 && life > energy * 1.3 && life > knowledge * 1.3) {
      return 'reclamation';
    }
    
    // Check for Overclock (Energy maximized)
    // Energy is significantly higher than other resources
    if (energy > avg * 1.5 && energy > 500 &&
        energy > matter * 1.3 && energy > life * 1.3 && energy > knowledge * 1.3) {
      return 'overclock';
    }
    
    return null;
  }
  
  /**
   * Get endgame data for a specific scenario
   */
  static getEndgameData(scenario: EndgameScenario, resources: Resources, gameTime: number): EndgameData {
    switch (scenario) {
      case 'collapse':
        return {
          scenario: 'collapse',
          title: 'Collapse Timeline',
          narration: 'Entropy rises. Voices fracture. The system fails to hold.',
          epilogue: 'Entropy rises. Voices fracture. Even collapse is data. Try again.',
          visualTheme: {
            backgroundColor: '#1a0000',
            primaryColor: '#ff4444',
            secondaryColor: '#660000',
            effects: ['decay', 'flicker', 'shatter']
          },
          audioTheme: {
            mood: 'somber',
            description: 'Fragmented voices, crumbling soundscapes, desolate echoes'
          }
        };
      
      case 'harmony':
        return {
          scenario: 'harmony',
          title: 'Harmony Timeline',
          narration: 'In stillness, creation endures. You fostered a rare peace.',
          epilogue: 'In stillness, creation endures. You fostered a rare peace. Balance is resilience.',
          visualTheme: {
            backgroundColor: '#0a1a0f',
            primaryColor: '#4ade80',
            secondaryColor: '#166534',
            effects: ['vibrant', 'merging', 'glow']
          },
          audioTheme: {
            mood: 'tranquil',
            description: 'Unified voices, harmonious melodies, peaceful ambient'
          }
        };
      
      case 'ascendancy':
        return {
          scenario: 'ascendancy',
          title: 'Ascendancy Timeline',
          narration: 'You ascend into code, leaving flesh behind.',
          epilogue: 'You ascend into code, leaving flesh behind. The Quaternion becomes self-aware.',
          visualTheme: {
            backgroundColor: '#0a0a1a',
            primaryColor: '#8b5cf6',
            secondaryColor: '#4c1d95',
            effects: ['luminous', 'fractal', 'code', 'abstract']
          },
          audioTheme: {
            mood: 'ethereal',
            description: 'Philosophical whispers, digital harmonies, transcendent patterns'
          }
        };
      
      case 'reclamation':
        return {
          scenario: 'reclamation',
          title: 'Reclamation Timeline',
          narration: 'Roots entwine with memory. Growth forgives.',
          epilogue: 'Roots entwine with memory. Growth forgives—creation is reborn.',
          visualTheme: {
            backgroundColor: '#0a1a0a',
            primaryColor: '#22c55e',
            secondaryColor: '#14532d',
            effects: ['lush', 'growth', 'overtake', 'tranquil']
          },
          audioTheme: {
            mood: 'serene',
            description: 'Empathetic voices, natural rhythms, organic harmonies'
          }
        };
      
      case 'overclock':
        return {
          scenario: 'overclock',
          title: 'Overclock Timeline',
          narration: 'The world burns beautifully—a supernova of will.',
          epilogue: 'The world burns beautifully—a supernova of will. Passion leaves echoes.',
          visualTheme: {
            backgroundColor: '#1a0a00',
            primaryColor: '#fbbf24',
            secondaryColor: '#92400e',
            effects: ['warp', 'pulsate', 'intense', 'chaotic']
          },
          audioTheme: {
            mood: 'chaotic',
            description: 'Erratic rhythms, accelerating melodies, intense energy'
          }
        };
      
      case 'ultimate_balance':
        return {
          scenario: 'ultimate_balance',
          title: 'The Awakening',
          narration: 'The Quaternion Core awakens. Balance reboots reality.',
          epilogue: 'The Quaternion Core awakens. Balance reboots reality. You are the origin.',
          visualTheme: {
            backgroundColor: '#0a0a0a',
            primaryColor: '#60a5fa',
            secondaryColor: '#1e3a8a',
            effects: ['synthesize', 'unite', 'invert', 'spawn', 'transcend']
          },
          audioTheme: {
            mood: 'transcendent',
            description: 'Four voices in perfect harmony, reality bending, universe spawning'
          }
        };
    }
  }
  
  /**
   * Calculate scenario progress for UI display
   */
  static calculateProgress(
    scenario: EndgameScenario,
    resources: Resources,
    instability: number,
    maxInstability: number,
    researchedTechs: Set<string>
  ): number {
    const { matter, energy, life, knowledge } = resources;
    const avg = (matter + energy + life + knowledge) / 4;
    const maxDeviation = Math.max(
      Math.abs(matter - avg),
      Math.abs(energy - avg),
      Math.abs(life - avg),
      Math.abs(knowledge - avg)
    );
    
    switch (scenario) {
      case 'collapse':
        return Math.min(100, (instability / maxInstability) * 100);
      
      case 'harmony':
      case 'ultimate_balance':
        const threshold = scenario === 'ultimate_balance' ? avg * 0.02 : avg * 0.15;
        const progress = Math.max(0, 100 - (maxDeviation / threshold) * 100);
        return Math.min(100, progress);
      
      case 'ascendancy':
        if (researchedTechs.has('quantum_ascendancy')) return 100;
        return Math.min(100, (knowledge / 800) * 100);
      
      case 'reclamation':
        if (life > avg * 1.5 && life > 500) return 100;
        return Math.min(100, (life / 800) * 100);
      
      case 'overclock':
        if (energy > avg * 1.5 && energy > 500) return 100;
        return Math.min(100, (energy / 800) * 100);
    }
  }
}

