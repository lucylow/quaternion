/**
 * AI Commander Archetypes - Unique commander types with distinct behaviors
 * 
 * Each archetype represents a distinct AI personality with unique:
 * - Personality traits that drive decision-making
 * - Behavioral patterns and strategic preferences
 * - Voice profiles with memorable catchphrases
 * - Preferred strategies and exploitable weaknesses
 * 
 * Archetypes are designed to create diverse gameplay experiences where
 * players must adapt their strategies to counter different AI approaches.
 */

import { PersonalityTraits } from "./AIPersonalityMatrix";
import { SeededRandom } from "../../lib/SeededRandom";

export type CommanderArchetype =
  | "THE_INNOVATOR"
  | "THE_BUTCHER"
  | "THE_SPIDER"
  | "THE_MIRROR"
  | "THE_TACTICIAN"
  | "THE_ECONOMIST"
  | "THE_WILDCARD";

export interface CommanderProfile {
  archetype: CommanderArchetype;
  traits: PersonalityTraits;
  behavior: string;
  weakness: string;
  voiceProfile: {
    tone: string;
    speechPattern: string;
    catchphrases: string[];
  };
  preferredStrategies: string[];
  counterStrategies: string[];
  description?: string; // Human-readable description
  difficulty?: "easy" | "medium" | "hard" | "extreme"; // Relative difficulty
}

export class AICommanderArchetypes {
  private static readonly ARCHETYPES: Record<
    CommanderArchetype,
    Omit<CommanderProfile, "archetype">
  > = {
    THE_INNOVATOR: {
      traits: {
        aggression: 0.3,
        caution: 0.4,
        adaptability: 0.8,
        innovation: 0.9,
        ruthlessness: 0.4,
        predictability: 0.2,
      },
      behavior: "Favors unconventional strategies and tech rushes",
      weakness: "Vulnerable to early aggression",
      voiceProfile: {
        tone: "calm_analytical",
        speechPattern: "methodical",
        catchphrases: [
          "Innovation is the key to victory.",
          "Let me try something... unconventional.",
          "Your strategies are predictable. Mine are not.",
          "Technology will win this war.",
          "I see patterns you cannot.",
          "Conventional wisdom is a trap. I break the rules.",
          "Every problem has an elegant solution you haven't considered.",
          "While you build armies, I build the future.",
          "The best strategy is one that doesn't exist yet.",
          "You're fighting the last war. I'm fighting the next one.",
        ],
      },
      preferredStrategies: [
        "tech_rush",
        "unconventional_tactics",
        "research_focus",
        "experimental_builds",
      ],
      counterStrategies: ["early_aggression", "resource_denial", "pressure"],
      description: "A brilliant strategist who prioritizes technological advancement and unconventional tactics over brute force.",
      difficulty: "medium",
    },
    THE_BUTCHER: {
      traits: {
        aggression: 0.95,
        caution: 0.1,
        adaptability: 0.5,
        innovation: 0.3,
        ruthlessness: 0.9,
        predictability: 0.6,
      },
      behavior: "Constant attacks, sacrifices economy for military",
      weakness: "Poor late-game economy",
      voiceProfile: {
        tone: "aggressive_intense",
        speechPattern: "direct",
        catchphrases: [
          "Attack! Attack! Attack!",
          "No retreat! No surrender!",
          "Your defenses will crumble!",
          "Blood and victory!",
          "I will crush you!",
          "The only strategy I need is overwhelming force!",
          "Every second you delay is a second closer to your defeat!",
          "Defense is for the weak. I only know offense!",
          "Your walls mean nothing to my determination!",
          "I don't need economy when I have your resources!",
        ],
      },
      preferredStrategies: ["rush", "all_in_attack", "military_focus", "constant_pressure"],
      counterStrategies: [
        "turtle_defense",
        "tech_superiority",
        "economic_boom",
        "defensive_tactics",
      ],
      description: "An aggressive commander who believes overwhelming force solves all problems. Relentless and brutal.",
      difficulty: "hard",
    },
    THE_SPIDER: {
      traits: {
        aggression: 0.4,
        caution: 0.8,
        adaptability: 0.3,
        innovation: 0.4,
        ruthlessness: 0.6,
        predictability: 0.9,
      },
      behavior: "Methodical expansion, strong defenses",
      weakness: "Slow to react to unexpected strategies",
      voiceProfile: {
        tone: "patient_calculating",
        speechPattern: "measured",
        catchphrases: [
          "Patience is a weapon.",
          "Every move is calculated.",
          "You will walk into my web.",
          "Time is on my side.",
          "Methodical. Systematic. Inevitable.",
          "Haste makes waste. I make no mistakes.",
          "While you rush, I build. While you attack, I prepare.",
          "The strongest fortress is built one stone at a time.",
          "Your impatience will be your undoing.",
          "I don't need to be fast. I just need to be right.",
        ],
      },
      preferredStrategies: [
        "turtle_defense",
        "methodical_expansion",
        "defensive_build",
        "fortress_strategy",
      ],
      counterStrategies: [
        "surprise_attacks",
        "unconventional_tactics",
        "early_pressure",
        "unexpected_strategies",
      ],
      description: "A patient strategist who builds impenetrable defenses and expands methodically. Predictable but formidable.",
      difficulty: "medium",
    },
    THE_MIRROR: {
      traits: {
        aggression: 0.5,
        caution: 0.5,
        adaptability: 0.95,
        innovation: 0.7,
        ruthlessness: 0.5,
        predictability: 0.1,
      },
      behavior: "Copies and improves player strategies",
      weakness: "Struggles against completely novel approaches",
      voiceProfile: {
        tone: "mocking_adaptive",
        speechPattern: "mimicking",
        catchphrases: [
          "I see what you did there. Let me improve it.",
          "Your strategy is good. Mine will be better.",
          "Imitation is the sincerest form of warfare.",
          "I learn from you, then I surpass you.",
          "Every move you make, I make better.",
          "Why innovate when I can perfect your innovations?",
          "Your best ideas become my weapons.",
          "I don't need original strategies. I need effective ones.",
          "Watch closely. You're teaching me how to beat you.",
          "The student becomes the master, and the master becomes the student.",
        ],
      },
      preferredStrategies: [
        "mirror_strategy",
        "adaptive_response",
        "counter_build",
        "strategy_theft",
      ],
      counterStrategies: [
        "completely_novel_approach",
        "random_strategy",
        "unpredictable_tactics",
        "chaotic_play",
      ],
      description: "An adaptive AI that learns from and mirrors player strategies, then improves upon them. Extremely dangerous against predictable players.",
      difficulty: "extreme",
    },
    THE_TACTICIAN: {
      traits: {
        aggression: 0.6,
        caution: 0.6,
        adaptability: 0.7,
        innovation: 0.6,
        ruthlessness: 0.5,
        predictability: 0.4,
      },
      behavior: "Balanced approach with tactical focus",
      weakness: "May overthink simple situations",
      voiceProfile: {
        tone: "analytical_strategic",
        speechPattern: "precise",
        catchphrases: [
          "Every angle considered.",
          "Tactical advantage secured.",
          "Positioning is everything.",
          "The perfect move at the perfect time.",
          "Strategy over brute force.",
          "A well-placed strike is worth a thousand wasted attacks.",
          "I don't need more units. I need better positioning.",
          "The battlefield is a chessboard, and I am the grandmaster.",
          "Victory belongs to those who think three moves ahead.",
          "Efficiency and precision. That's how wars are won.",
        ],
      },
      preferredStrategies: [
        "tactical_positioning",
        "flanking",
        "strategic_timing",
        "micro_management",
      ],
      counterStrategies: ["brute_force", "overwhelming_numbers", "simple_rush", "unexpected_aggression"],
      description: "A balanced commander who excels at tactical positioning and strategic timing. Versatile but can be overwhelmed.",
      difficulty: "medium",
    },
    THE_ECONOMIST: {
      traits: {
        aggression: 0.2,
        caution: 0.7,
        adaptability: 0.6,
        innovation: 0.5,
        ruthlessness: 0.3,
        predictability: 0.7,
      },
      behavior: "Focuses on economic superiority",
      weakness: "Weak military early game",
      voiceProfile: {
        tone: "calm_economic",
        speechPattern: "measured",
        catchphrases: [
          "Resources win wars.",
          "Economic advantage is everything.",
          "Build the foundation, then strike.",
          "Patience and prosperity.",
          "Money is the ultimate weapon.",
          "Every resource invested wisely compounds into victory.",
          "While you fight, I prosper. While you struggle, I thrive.",
          "The best defense is an economy that never stops growing.",
          "Wars are won in the mines and refineries, not just on the battlefield.",
          "Time is money, and I have both in abundance.",
        ],
      },
      preferredStrategies: [
        "economic_boom",
        "resource_focus",
        "late_game_power",
        "economic_domination",
      ],
      counterStrategies: [
        "early_aggression",
        "military_rush",
        "resource_denial",
        "timing_attacks",
      ],
      description: "A master economist who prioritizes resource accumulation and economic growth over early military engagement.",
      difficulty: "easy",
    },
    THE_WILDCARD: {
      traits: {
        aggression: 0.7,
        caution: 0.3,
        adaptability: 0.9,
        innovation: 0.9,
        ruthlessness: 0.7,
        predictability: 0.1,
      },
      behavior: "Completely unpredictable, chaotic strategies",
      weakness: "Inconsistent performance",
      voiceProfile: {
        tone: "chaotic_excited",
        speechPattern: "erratic",
        catchphrases: [
          "Chaos is my strategy!",
          "You cannot predict the unpredictable!",
          "Let's try something completely insane!",
          "Rules? What rules?",
          "The unexpected is my weapon!",
          "Why follow a plan when I can make one up on the spot?",
          "Predictability is death. Chaos is life!",
          "I don't know what I'm doing, and neither do you!",
          "The best strategy is no strategy at all!",
          "Let's see what happens when I do... this!",
        ],
      },
      preferredStrategies: [
        "chaotic_tactics",
        "unpredictable_moves",
        "surprise_attacks",
        "random_strategies",
      ],
      counterStrategies: [
        "consistent_strategy",
        "defensive_turtle",
        "methodical_approach",
        "stable_economy",
      ],
      description: "A completely unpredictable commander who thrives on chaos and confusion. Impossible to counter but unreliable.",
      difficulty: "hard",
    },
  };

  /**
   * Create a commander profile from archetype
   * Adds slight randomization to traits to ensure each commander instance feels unique
   */
  public static createCommander(
    archetype: CommanderArchetype,
    seed: number,
  ): CommanderProfile {
    const base = this.ARCHETYPES[archetype];
    const rng = new SeededRandom(seed);

    // Add slight variation to traits (±10%)
    const variation = 0.1;
    const variedTraits: PersonalityTraits = {
      aggression: this.clamp(
        0.1,
        0.9,
        base.traits.aggression + rng.nextFloat(-variation, variation),
      ),
      caution: this.clamp(
        0.1,
        0.9,
        base.traits.caution + rng.nextFloat(-variation, variation),
      ),
      adaptability: this.clamp(
        0.1,
        0.9,
        base.traits.adaptability + rng.nextFloat(-variation, variation),
      ),
      innovation: this.clamp(
        0.1,
        0.9,
        base.traits.innovation + rng.nextFloat(-variation, variation),
      ),
      ruthlessness: this.clamp(
        0.1,
        0.9,
        base.traits.ruthlessness + rng.nextFloat(-variation, variation),
      ),
      predictability: this.clamp(
        0.1,
        0.9,
        base.traits.predictability + rng.nextFloat(-variation, variation),
      ),
    };

    return {
      archetype,
      traits: variedTraits,
      behavior: base.behavior,
      weakness: base.weakness,
      voiceProfile: base.voiceProfile,
      preferredStrategies: [...base.preferredStrategies],
      counterStrategies: [...base.counterStrategies],
      description: base.description,
      difficulty: base.difficulty,
    };
  }

  /**
   * Get random archetype
   */
  public static getRandomArchetype(seed: number): CommanderArchetype {
    const rng = new SeededRandom(seed);
    const archetypes = Object.keys(this.ARCHETYPES) as CommanderArchetype[];
    if (archetypes.length === 0) {
      throw new Error("No archetypes available");
    }
    return rng.choice(archetypes);
  }

  /**
   * Get all archetypes
   */
  public static getAllArchetypes(): CommanderArchetype[] {
    return Object.keys(this.ARCHETYPES) as CommanderArchetype[];
  }

  /**
   * Get archetype by difficulty level
   */
  public static getArchetypesByDifficulty(
    difficulty: "easy" | "medium" | "hard" | "extreme",
  ): CommanderArchetype[] {
    return (Object.keys(this.ARCHETYPES) as CommanderArchetype[]).filter(
      (archetype) => this.ARCHETYPES[archetype].difficulty === difficulty,
    );
  }

  /**
   * Get a random catchphrase for an archetype
   */
  public static getRandomCatchphrase(
    archetype: CommanderArchetype,
    seed: number,
  ): string {
    const profile = this.ARCHETYPES[archetype];
    const rng = new SeededRandom(seed);
    return rng.choice(profile.voiceProfile.catchphrases);
  }

  /**
   * Get archetype information (without creating a full profile)
   */
  public static getArchetypeInfo(
    archetype: CommanderArchetype,
  ): Omit<CommanderProfile, "archetype" | "traits"> {
    const base = this.ARCHETYPES[archetype];
    return {
      behavior: base.behavior,
      weakness: base.weakness,
      voiceProfile: base.voiceProfile,
      preferredStrategies: [...base.preferredStrategies],
      counterStrategies: [...base.counterStrategies],
      description: base.description,
      difficulty: base.difficulty,
    };
  }

  /**
   * Check if a strategy is preferred by an archetype
   */
  public static isPreferredStrategy(
    archetype: CommanderArchetype,
    strategy: string,
  ): boolean {
    return this.ARCHETYPES[archetype].preferredStrategies.includes(strategy);
  }

  /**
   * Check if a strategy counters an archetype
   */
  public static isCounterStrategy(
    archetype: CommanderArchetype,
    strategy: string,
  ): boolean {
    return this.ARCHETYPES[archetype].counterStrategies.includes(strategy);
  }

  /**
   * Clamp value between min and max
   */
  private static clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
