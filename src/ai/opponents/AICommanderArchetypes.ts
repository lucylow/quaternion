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
        ],
      },
      preferredStrategies: [
        "turtle_defense",
        "methodical_expansion",
        "defensive_build",
      ],
      counterStrategies: [
        "surprise_attacks",
        "unconventional_tactics",
        "early_pressure",
      ],
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
        ],
      },
      preferredStrategies: [
        "mirror_strategy",
        "adaptive_response",
        "counter_build",
      ],
      counterStrategies: [
        "completely_novel_approach",
        "random_strategy",
        "unpredictable_tactics",
      ],
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
        ],
      },
      preferredStrategies: [
        "tactical_positioning",
        "flanking",
        "strategic_timing",
      ],
      counterStrategies: ["brute_force", "overwhelming_numbers", "simple_rush"],
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
        ],
      },
      preferredStrategies: [
        "economic_boom",
        "resource_focus",
        "late_game_power",
      ],
      counterStrategies: [
        "early_aggression",
        "military_rush",
        "resource_denial",
      ],
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
        ],
      },
      preferredStrategies: [
        "chaotic_tactics",
        "unpredictable_moves",
        "surprise_attacks",
      ],
      counterStrategies: [
        "consistent_strategy",
        "defensive_turtle",
        "methodical_approach",
      ],
    },
  };

  /**
   * Create a commander profile from archetype
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
   * Clamp value
   */
  private static clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
