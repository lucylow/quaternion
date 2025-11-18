/**
 * Unit Personality & Quirk System
 * Units develop quirks and personality after surviving battles
 */

export interface UnitQuirk {
  id: string;
  name: string;
  description: string;
  type: 'aggressive' | 'defensive' | 'skittish' | 'veteran' | 'lucky' | 'clumsy';
  statModifier: {
    attackSpeed?: number; // multiplier
    damage?: number; // multiplier
    health?: number; // multiplier
    speed?: number; // multiplier
    accuracy?: number; // multiplier
  };
  voiceLines: string[];
  triggerChance: number; // 0-1, chance to trigger per second
  icon: string;
}

export interface UnitWithQuirks {
  id: string;
  unitType: string;
  battleCount: number;
  timesRetreated: number;
  damageDealt: number;
  damageTaken: number;
  health: number;
  maxHealth: number;
  quirks: UnitQuirk[];
  nickname?: string;
}

export class UnitQuirkSystem {
  private quirkLibrary: Map<string, UnitQuirk[]>;
  private unitsWithQuirks: Map<string, UnitWithQuirks>;

  constructor() {
    this.quirkLibrary = new Map();
    this.unitsWithQuirks = new Map();
    this.initializeQuirkLibrary();
  }

  private initializeQuirkLibrary(): void {
    // Define quirks for different unit types
    const allQuirks: UnitQuirk[] = [
      {
        id: 'aggressive_veteran',
        name: 'Battle-Hardened',
        description: 'Faster reload, more aggressive',
        type: 'aggressive',
        statModifier: {
          attackSpeed: 1.2,
          damage: 1.1
        },
        voiceLines: [
          'I live for the fight!',
          'Bring them on!',
          'This is what I was made for!'
        ],
        triggerChance: 0.1,
        icon: '⚔️'
      },
      {
        id: 'defensive_veteran',
        name: 'Tank',
        description: 'Takes less damage, slower movement',
        type: 'defensive',
        statModifier: {
          health: 1.3,
          speed: 0.9
        },
        voiceLines: [
          'I can take it!',
          'Standing strong!',
          'They can\'t break through!'
        ],
        triggerChance: 0.08,
        icon: '🛡️'
      },
      {
        id: 'skittish',
        name: 'Nervous',
        description: 'Faster movement, lower accuracy',
        type: 'skittish',
        statModifier: {
          speed: 1.3,
          accuracy: 0.8
        },
        voiceLines: [
          'I don\'t like this...',
          'Too close!',
          'Retreating!'
        ],
        triggerChance: 0.15,
        icon: '😰'
      },
      {
        id: 'veteran_commander',
        name: 'Veteran',
        description: 'Last stand ability when low on health',
        type: 'veteran',
        statModifier: {
          damage: 1.5 // When health < 30%
        },
        voiceLines: [
          'Not going down without a fight!',
          'I\'ve seen worse!',
          'Last stand!'
        ],
        triggerChance: 0.05,
        icon: '⭐'
      },
      {
        id: 'lucky',
        name: 'Lucky',
        description: 'Occasional critical hits',
        type: 'lucky',
        statModifier: {
          damage: 1.5 // Random crits
        },
        voiceLines: [
          'Lucky shot!',
          'That was close!',
          'Fortune favors me!'
        ],
        triggerChance: 0.2,
        icon: '🍀'
      },
      {
        id: 'clumsy',
        name: 'Clumsy',
        description: 'Occasional friendly fire, slower pathing',
        type: 'clumsy',
        statModifier: {
          speed: 0.85,
          accuracy: 0.7
        },
        voiceLines: [
          'Oops!',
          'My bad!',
          'Sorry about that!'
        ],
        triggerChance: 0.12,
        icon: '🤦'
      }
    ];

    // Assign quirks to unit types
    this.quirkLibrary.set('soldier', [
      allQuirks[0], // aggressive_veteran
      allQuirks[1], // defensive_veteran
      allQuirks[3], // veteran_commander
      allQuirks[4]  // lucky
    ]);

    this.quirkLibrary.set('worker', [
      allQuirks[2], // skittish
      allQuirks[4], // lucky
      allQuirks[5]  // clumsy
    ]);

    this.quirkLibrary.set('heavy', [
      allQuirks[1], // defensive_veteran
      allQuirks[3]  // veteran_commander
    ]);

    this.quirkLibrary.set('scout', [
      allQuirks[2], // skittish
      allQuirks[4]  // lucky
    ]);
  }

  /**
   * Register a unit for quirk tracking
   */
  registerUnit(unitId: string, unitType: string): void {
    if (!this.unitsWithQuirks.has(unitId)) {
      this.unitsWithQuirks.set(unitId, {
        id: unitId,
        unitType,
        battleCount: 0,
        timesRetreated: 0,
        damageDealt: 0,
        damageTaken: 0,
        health: 100,
        maxHealth: 100,
        quirks: []
      });
    }
  }

  /**
   * Update unit stats after battle
   */
  updateUnitStats(
    unitId: string,
    stats: {
      damageDealt?: number;
      damageTaken?: number;
      retreated?: boolean;
      survived?: boolean;
    }
  ): void {
    const unit = this.unitsWithQuirks.get(unitId);
    if (!unit) return;

    if (stats.damageDealt !== undefined) {
      unit.damageDealt += stats.damageDealt;
    }
    if (stats.damageTaken !== undefined) {
      unit.damageTaken += stats.damageTaken;
    }
    if (stats.retreated) {
      unit.timesRetreated++;
    }
    if (stats.survived) {
      unit.battleCount++;
    }

    // Check if unit should gain a quirk
    if (unit.battleCount >= 5 && unit.quirks.length === 0) {
      this.tryGenerateQuirk(unit);
    }
  }

  /**
   * Try to generate a quirk for a unit
   */
  private tryGenerateQuirk(unit: UnitWithQuirks): void {
    const availableQuirks = this.quirkLibrary.get(unit.unitType) || [];
    if (availableQuirks.length === 0) return;

    // Calculate quirk chance based on performance
    const quirkChance = this.calculateQuirkChance(unit);
    if (Math.random() > quirkChance) return;

    // Select weighted quirk
    const quirk = this.selectWeightedQuirk(availableQuirks, unit);
    if (quirk) {
      unit.quirks.push({ ...quirk }); // Clone quirk
    }
  }

  private calculateQuirkChance(unit: UnitWithQuirks): number {
    let baseChance = 0.1;
    
    // More battles = higher chance
    baseChance += unit.battleCount * 0.02;
    
    // Better survival rate = higher chance
    const survivalBonus = (unit.health / unit.maxHealth) * 0.1;
    baseChance += survivalBonus;

    return Math.min(0.8, baseChance);
  }

  private selectWeightedQuirk(availableQuirks: UnitQuirk[], unit: UnitWithQuirks): UnitQuirk | null {
    if (availableQuirks.length === 0) return null;

    // Weight quirks by unit performance
    const weights = availableQuirks.map(quirk => {
      let weight = 1.0;

      switch (quirk.type) {
        case 'aggressive':
          weight *= (unit.damageDealt / Math.max(unit.damageTaken, 1)) * 0.5;
          break;
        case 'defensive':
          weight *= (unit.damageTaken / Math.max(unit.damageDealt, 1)) * 0.5;
          break;
        case 'skittish':
          weight *= unit.timesRetreated * 0.2;
          break;
        case 'veteran':
          weight *= unit.battleCount * 0.1;
          break;
      }

      return Math.max(0.1, weight);
    });

    // Select based on weights
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < availableQuirks.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return availableQuirks[i];
      }
    }

    return availableQuirks[0];
  }

  /**
   * Get quirks for a unit
   */
  getUnitQuirks(unitId: string): UnitQuirk[] {
    const unit = this.unitsWithQuirks.get(unitId);
    return unit?.quirks || [];
  }

  /**
   * Apply quirk effects to unit stats
   */
  applyQuirkEffects(unitId: string, baseStats: {
    attackSpeed: number;
    damage: number;
    health: number;
    speed: number;
    accuracy: number;
  }): {
    attackSpeed: number;
    damage: number;
    health: number;
    speed: number;
    accuracy: number;
  } {
    const unit = this.unitsWithQuirks.get(unitId);
    if (!unit || unit.quirks.length === 0) {
      return baseStats;
    }

    const modifiedStats = { ...baseStats };

    unit.quirks.forEach(quirk => {
      if (quirk.statModifier.attackSpeed) {
        modifiedStats.attackSpeed *= quirk.statModifier.attackSpeed;
      }
      if (quirk.statModifier.damage) {
        modifiedStats.damage *= quirk.statModifier.damage;
      }
      if (quirk.statModifier.health) {
        modifiedStats.health *= quirk.statModifier.health;
      }
      if (quirk.statModifier.speed) {
        modifiedStats.speed *= quirk.statModifier.speed;
      }
      if (quirk.statModifier.accuracy) {
        modifiedStats.accuracy *= quirk.statModifier.accuracy;
      }
    });

    return modifiedStats;
  }

  /**
   * Check if quirk should trigger (for voice lines, etc.)
   */
  checkQuirkTrigger(unitId: string, deltaTime: number): string | null {
    const unit = this.unitsWithQuirks.get(unitId);
    if (!unit || unit.quirks.length === 0) return null;

    // Check each quirk
    for (const quirk of unit.quirks) {
      if (Math.random() < quirk.triggerChance * deltaTime) {
        const voiceLine = quirk.voiceLines[
          Math.floor(Math.random() * quirk.voiceLines.length)
        ];
        return voiceLine;
      }
    }

    return null;
  }

  /**
   * Set unit nickname
   */
  setUnitNickname(unitId: string, nickname: string): void {
    const unit = this.unitsWithQuirks.get(unitId);
    if (unit) {
      unit.nickname = nickname;
    }
  }

  /**
   * Get unit with quirks
   */
  getUnit(unitId: string): UnitWithQuirks | null {
    return this.unitsWithQuirks.get(unitId) || null;
  }
}

