import { SeededRandom } from '../lib/SeededRandom';

/**
 * Procedural Unit Design System
 * Generates unit variations with faction themes and strategic roles
 */

export type FactionTheme = 'quantum' | 'biological' | 'mechanical' | 'energy' | 'neural' | 'chrono' | 'entropy';
export type StrategicRole = 'assault' | 'support' | 'siege' | 'scout' | 'defense' | 'utility';

export interface UnitAttributes {
  health: number;
  damage: number;
  speed: number;
  range: number;
  armor: number;
  shield?: number;
  specialAbilities?: string[];
}

export interface UnitCost {
  matter: number;
  energy: number;
  life?: number;
  knowledge?: number;
}

export interface ProceduralUnit {
  id: string;
  name: string;
  faction: FactionTheme;
  role: StrategicRole;
  attributes: UnitAttributes;
  cost: UnitCost;
  buildTime: number;
  description: string;
  visualStyle: string;
  specialMechanics?: Record<string, any>;
}

export interface UnitGenerationConfig {
  seed: number;
  faction?: FactionTheme;
  role?: StrategicRole;
  variationCount?: number;
  balancePreset?: 'aggressive' | 'defensive' | 'balanced';
}

export class ProceduralUnitGenerator {
  private rng: SeededRandom;
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.rng = new SeededRandom(seed);
  }

  /**
   * Generate a unit faction with multiple unit types
   */
  public generateFaction(
    theme: FactionTheme,
    unitCount: number = 8
  ): ProceduralUnit[] {
    const roles: StrategicRole[] = [
      'assault', 'support', 'siege', 'scout', 
      'defense', 'utility'
    ];
    
    const units: ProceduralUnit[] = [];
    
    // Ensure we have at least one of each core role
    const coreRoles: StrategicRole[] = ['assault', 'support', 'scout'];
    for (const role of coreRoles) {
      units.push(this.generateUnit(theme, role));
    }
    
    // Fill remaining slots with random roles
    for (let i = coreRoles.length; i < unitCount; i++) {
      const role = this.rng.choice(roles);
      units.push(this.generateUnit(theme, role));
    }
    
    return units;
  }

  /**
   * Generate a single unit
   */
  public generateUnit(
    faction: FactionTheme,
    role: StrategicRole
  ): ProceduralUnit {
    const baseAttributes = this.getBaseAttributes(role);
    const factionModifiers = this.getFactionModifiers(faction);
    const attributes = this.applyFactionModifiers(baseAttributes, factionModifiers);
    
    const name = this.generateUnitName(faction, role);
    const cost = this.calculateCost(attributes, role);
    const buildTime = this.calculateBuildTime(attributes, cost);
    const description = this.generateDescription(faction, role, attributes);
    const visualStyle = this.getVisualStyle(faction, role);
    const specialMechanics = this.generateSpecialMechanics(faction, role);

    return {
      id: `${faction}_${role}_${this.rng.nextInt(1000, 9999)}`,
      name,
      faction,
      role,
      attributes,
      cost,
      buildTime,
      description,
      visualStyle,
      specialMechanics
    };
  }

  /**
   * Get base attributes for a role
   */
  private getBaseAttributes(role: StrategicRole): UnitAttributes {
    const baseStats: Record<StrategicRole, UnitAttributes> = {
      assault: {
        health: 150,
        damage: 25,
        speed: 4.0,
        range: 5,
        armor: 5
      },
      support: {
        health: 100,
        damage: 10,
        speed: 3.5,
        range: 8,
        armor: 3,
        shield: 20
      },
      siege: {
        health: 200,
        damage: 50,
        speed: 1.5,
        range: 12,
        armor: 10
      },
      scout: {
        health: 80,
        damage: 8,
        speed: 8.0,
        range: 10,
        armor: 2
      },
      defense: {
        health: 300,
        damage: 15,
        speed: 1.0,
        range: 6,
        armor: 15
      },
      utility: {
        health: 120,
        damage: 5,
        speed: 3.0,
        range: 4,
        armor: 4
      }
    };

    const base = baseStats[role];
    
    // Add variation (±15%)
    const variation = 0.15;
    return {
      health: Math.round(base.health * (1 + this.rng.nextFloat(-variation, variation))),
      damage: Math.round(base.damage * (1 + this.rng.nextFloat(-variation, variation))),
      speed: base.speed * (1 + this.rng.nextFloat(-variation, variation)),
      range: Math.round(base.range * (1 + this.rng.nextFloat(-variation, variation))),
      armor: Math.round(base.armor * (1 + this.rng.nextFloat(-variation, variation))),
      shield: base.shield ? Math.round(base.shield * (1 + this.rng.nextFloat(-variation, variation))) : undefined
    };
  }

  /**
   * Get faction-specific modifiers
   */
  private getFactionModifiers(faction: FactionTheme): Partial<UnitAttributes> & {
    specialAbilities?: string[];
  } {
    const modifiers: Record<FactionTheme, Partial<UnitAttributes> & { specialAbilities?: string[] }> = {
      quantum: {
        speed: 1.2, // 20% faster
        specialAbilities: ['teleport', 'probability_attack']
      },
      biological: {
        health: 1.3, // 30% more health
        specialAbilities: ['regeneration', 'swarm_intelligence']
      },
      mechanical: {
        armor: 1.4, // 40% more armor
        specialAbilities: ['repair', 'modular_upgrade']
      },
      energy: {
        damage: 1.25, // 25% more damage
        specialAbilities: ['energy_shield', 'overcharge']
      },
      neural: {
        range: 1.3, // 30% more range
        specialAbilities: ['mind_control', 'adaptive_damage']
      },
      chrono: {
        speed: 1.15,
        specialAbilities: ['time_dilation', 'prediction']
      },
      entropy: {
        damage: 1.2,
        specialAbilities: ['decay', 'area_denial']
      }
    };

    return modifiers[faction] || {};
  }

  /**
   * Apply faction modifiers to base attributes
   */
  private applyFactionModifiers(
    base: UnitAttributes,
    modifiers: Partial<UnitAttributes> & { specialAbilities?: string[] }
  ): UnitAttributes {
    return {
      health: Math.round(base.health * (modifiers.health || 1)),
      damage: Math.round(base.damage * (modifiers.damage || 1)),
      speed: base.speed * (modifiers.speed || 1),
      range: Math.round(base.range * (modifiers.range || 1)),
      armor: Math.round(base.armor * (modifiers.armor || 1)),
      shield: modifiers.shield ? Math.round((base.shield || 0) * modifiers.shield) : base.shield,
      specialAbilities: modifiers.specialAbilities
    };
  }

  /**
   * Generate unit name based on faction and role
   */
  private generateUnitName(faction: FactionTheme, role: StrategicRole): string {
    const prefixes: Record<FactionTheme, string[]> = {
      quantum: ['Quantum', 'Phase', 'Nexus', 'Void', 'Fractal'],
      biological: ['Bio', 'Neural', 'Organic', 'Living', 'Evolved'],
      mechanical: ['Mech', 'Auto', 'Steel', 'Titan', 'Forge'],
      energy: ['Plasma', 'Arc', 'Volt', 'Energy', 'Power'],
      neural: ['Mind', 'Psy', 'Cortex', 'Synapse', 'Brain'],
      chrono: ['Time', 'Chrono', 'Temporal', 'Flow', 'Moment'],
      entropy: ['Decay', 'Void', 'Chaos', 'Rift', 'Null']
    };

    const suffixes: Record<StrategicRole, string[]> = {
      assault: ['Striker', 'Blade', 'Fury', 'Razor', 'Assault'],
      support: ['Aid', 'Guardian', 'Shield', 'Support', 'Aegis'],
      siege: ['Siege', 'Breaker', 'Cannon', 'Destroyer', 'Wrecker'],
      scout: ['Scout', 'Ranger', 'Pathfinder', 'Seeker', 'Probe'],
      defense: ['Wall', 'Bastion', 'Fortress', 'Shield', 'Guard'],
      utility: ['Worker', 'Builder', 'Tech', 'Utility', 'Core']
    };

    const prefix = this.rng.choice(prefixes[faction]);
    const suffix = this.rng.choice(suffixes[role]);
    
    return `${prefix} ${suffix}`;
  }

  /**
   * Calculate unit cost based on attributes
   */
  private calculateCost(attributes: UnitAttributes, role: StrategicRole): UnitCost {
    // Base cost calculation
    const healthCost = attributes.health * 0.5;
    const damageCost = attributes.damage * 2;
    const speedCost = attributes.speed * 10;
    const rangeCost = attributes.range * 3;
    const armorCost = attributes.armor * 4;
    const shieldCost = (attributes.shield || 0) * 2;

    const totalPower = healthCost + damageCost + speedCost + rangeCost + armorCost + shieldCost;
    
    // Role-based cost multipliers
    const roleMultipliers: Record<StrategicRole, number> = {
      assault: 1.0,
      support: 1.2,
      siege: 1.5,
      scout: 0.8,
      defense: 1.3,
      utility: 0.7
    };

    const adjustedPower = totalPower * roleMultipliers[role];
    
    // Distribute across resources
    const matter = Math.round(adjustedPower * 0.6);
    const energy = Math.round(adjustedPower * 0.3);
    const life = role === 'biological' ? Math.round(adjustedPower * 0.1) : undefined;
    const knowledge = attributes.specialAbilities && attributes.specialAbilities.length > 0 
      ? Math.round(adjustedPower * 0.1) 
      : undefined;

    return {
      matter: Math.max(50, matter),
      energy: Math.max(25, energy),
      ...(life && { life }),
      ...(knowledge && { knowledge })
    };
  }

  /**
   * Calculate build time based on attributes and cost
   */
  private calculateBuildTime(attributes: UnitAttributes, cost: UnitCost): number {
    const totalCost = cost.matter + cost.energy + (cost.life || 0) + (cost.knowledge || 0);
    const baseTime = totalCost * 0.3;
    
    // Adjust for complexity (special abilities, high stats)
    let complexityMultiplier = 1.0;
    if (attributes.specialAbilities && attributes.specialAbilities.length > 0) {
      complexityMultiplier += attributes.specialAbilities.length * 0.1;
    }
    if (attributes.health > 200) complexityMultiplier += 0.2;
    if (attributes.damage > 40) complexityMultiplier += 0.15;

    return Math.round(baseTime * complexityMultiplier);
  }

  /**
   * Generate unit description
   */
  private generateDescription(
    faction: FactionTheme,
    role: StrategicRole,
    attributes: UnitAttributes
  ): string {
    const factionDescriptions: Record<FactionTheme, string> = {
      quantum: 'A unit that manipulates quantum states',
      biological: 'An organic construct with adaptive capabilities',
      mechanical: 'A precision-engineered war machine',
      energy: 'A being of pure energy',
      neural: 'A networked intelligence unit',
      chrono: 'A unit that bends time itself',
      entropy: 'A unit that spreads decay and chaos'
    };

    const roleDescriptions: Record<StrategicRole, string> = {
      assault: 'designed for aggressive combat',
      support: 'provides battlefield assistance',
      siege: 'specialized in destroying fortifications',
      scout: 'excels at reconnaissance',
      defense: 'built to hold positions',
      utility: 'versatile support unit'
    };

    const abilityDesc = attributes.specialAbilities && attributes.specialAbilities.length > 0
      ? ` with ${attributes.specialAbilities.join(' and ')} abilities`
      : '';

    return `${factionDescriptions[faction]}, ${roleDescriptions[role]}${abilityDesc}.`;
  }

  /**
   * Get visual style description
   */
  private getVisualStyle(faction: FactionTheme, role: StrategicRole): string {
    const styles: Record<FactionTheme, string> = {
      quantum: 'ethereal, phase-shifting appearance',
      biological: 'organic, flowing forms',
      mechanical: 'angular, metallic construction',
      energy: 'glowing, plasma-based form',
      neural: 'neural network patterns, synaptic connections',
      chrono: 'time-distorted, temporal effects',
      entropy: 'decaying, void-touched appearance'
    };

    return styles[faction] || 'standard military design';
  }

  /**
   * Generate special mechanics for faction/role combination
   */
  private generateSpecialMechanics(
    faction: FactionTheme,
    role: StrategicRole
  ): Record<string, any> | undefined {
    const mechanics: Record<string, Record<string, any>> = {
      quantum: {
        teleport: {
          cooldown: 30,
          range: 10,
          description: 'Can teleport short distances'
        },
        probability_attack: {
          critChance: 0.15,
          description: 'Attacks have chance to deal double damage'
        }
      },
      biological: {
        regeneration: {
          rate: 2,
          description: 'Regenerates health over time'
        },
        swarm_intelligence: {
          nearbyBonus: 0.1,
          description: 'Gains bonuses when near other biological units'
        }
      },
      mechanical: {
        repair: {
          rate: 5,
          description: 'Can repair itself and nearby mechanical units'
        },
        modular_upgrade: {
          upgradeSlots: 2,
          description: 'Can be upgraded with modular components'
        }
      },
      energy: {
        energy_shield: {
          maxShield: 50,
          rechargeRate: 2,
          description: 'Has rechargeable energy shield'
        },
        overcharge: {
          damageMultiplier: 1.5,
          duration: 10,
          cooldown: 60,
          description: 'Can temporarily increase damage output'
        }
      },
      neural: {
        mind_control: {
          duration: 5,
          cooldown: 90,
          description: 'Can temporarily control enemy units'
        },
        adaptive_damage: {
          damageTypes: ['physical', 'energy', 'psychic'],
          description: 'Damage type adapts to target weaknesses'
        }
      },
      chrono: {
        time_dilation: {
          speedMultiplier: 1.5,
          duration: 8,
          cooldown: 45,
          description: 'Can temporarily move faster'
        },
        prediction: {
          dodgeChance: 0.2,
          description: 'Can predict and avoid incoming attacks'
        }
      },
      entropy: {
        decay: {
          damageOverTime: 5,
          duration: 10,
          description: 'Attacks cause ongoing decay damage'
        },
        area_denial: {
          radius: 5,
          damagePerSecond: 3,
          description: 'Creates dangerous zones that damage enemies'
        }
      }
    };

    const factionMechanics = mechanics[faction];
    if (!factionMechanics) return undefined;

    // Select mechanics based on role
    const selectedMechanics: Record<string, any> = {};
    const availableMechanics = Object.keys(factionMechanics);
    
    // Always include primary mechanic
    if (availableMechanics.length > 0) {
      const primary = availableMechanics[0];
      selectedMechanics[primary] = factionMechanics[primary];
    }

    // Add role-appropriate mechanics
    if (role === 'assault' && availableMechanics.length > 1) {
      const offensive = availableMechanics.find(m => 
        m.includes('attack') || m.includes('damage') || m.includes('overcharge')
      );
      if (offensive) selectedMechanics[offensive] = factionMechanics[offensive];
    }

    return Object.keys(selectedMechanics).length > 0 ? selectedMechanics : undefined;
  }

  /**
   * Balance unit attributes to ensure game balance
   */
  public balanceUnit(unit: ProceduralUnit, preset: 'aggressive' | 'defensive' | 'balanced' = 'balanced'): ProceduralUnit {
    const balanced = { ...unit };
    
    switch (preset) {
      case 'aggressive':
        balanced.attributes.damage = Math.round(balanced.attributes.damage * 1.1);
        balanced.attributes.speed = balanced.attributes.speed * 1.1;
        balanced.attributes.health = Math.round(balanced.attributes.health * 0.9);
        break;
      
      case 'defensive':
        balanced.attributes.health = Math.round(balanced.attributes.health * 1.1);
        balanced.attributes.armor = Math.round(balanced.attributes.armor * 1.1);
        balanced.attributes.damage = Math.round(balanced.attributes.damage * 0.9);
        break;
      
      case 'balanced':
        // Already balanced
        break;
    }

    // Recalculate cost after balancing
    balanced.cost = this.calculateCost(balanced.attributes, balanced.role);
    balanced.buildTime = this.calculateBuildTime(balanced.attributes, balanced.cost);

    return balanced;
  }

  /**
   * Generate multiple unit variations
   */
  public generateVariations(
    faction: FactionTheme,
    role: StrategicRole,
    count: number = 3
  ): ProceduralUnit[] {
    const variations: ProceduralUnit[] = [];
    
    for (let i = 0; i < count; i++) {
      // Use different seed for each variation
      const variationSeed = this.seed + i * 1000;
      const generator = new ProceduralUnitGenerator(variationSeed);
      variations.push(generator.generateUnit(faction, role));
    }
    
    return variations;
  }
}


