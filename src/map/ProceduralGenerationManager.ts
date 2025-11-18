import { EnhancedProceduralGenerator, GeneratedMap, EnhancedMapConfig } from './EnhancedProceduralGenerator';
import { EnvironmentalEffectsSystem, EnvironmentalConfig } from './EnvironmentalEffects';
import { ProceduralUnitGenerator, ProceduralUnit, FactionTheme } from '../units/ProceduralUnitGenerator';
import { EnhancedCommanderPersonality, CommanderPersonality } from '../ai/EnhancedCommanderPersonality';
import { SeededRandom } from '../lib/SeededRandom';

/**
 * Procedural Generation Manager
 * Orchestrates all procedural generation systems
 */

export interface ProceduralGameConfig {
  seed: number;
  mapWidth: number;
  mapHeight: number;
  mapPersonality?: 'aggressive' | 'defensive' | 'economic' | 'puzzle';
  biome?: 'volcanic' | 'crystalline' | 'organic' | 'mechanical' | 'quantum' | 'void';
  faction?: FactionTheme;
  commanderArchetype?: 'aggressor' | 'architect' | 'nomad' | 'tactician' | 'harvester' | 'wildcard' | 'balanced';
  difficulty?: 'easy' | 'medium' | 'hard';
  dynamicWeather?: boolean;
}

export interface ProceduralGamePackage {
  map: GeneratedMap;
  environmentalSystem: EnvironmentalEffectsSystem;
  units: ProceduralUnit[];
  commander: CommanderPersonality;
  seed: number;
  metadata: {
    generationTime: number;
    strategicDNA: GeneratedMap['strategicDNA'];
    faction: FactionTheme;
  };
}

export class ProceduralGenerationManager {
  private rng: SeededRandom;

  constructor() {
    this.rng = new SeededRandom(Date.now());
  }

  /**
   * Generate a complete procedural game package
   */
  public generateGamePackage(config: ProceduralGameConfig): ProceduralGamePackage {
    const startTime = Date.now();
    const seed = config.seed || Date.now();

    // 1. Generate map
    const mapConfig: EnhancedMapConfig = {
      width: config.mapWidth,
      height: config.mapHeight,
      seed,
      personality: config.mapPersonality,
      biome: config.biome,
      difficulty: config.difficulty
    };

    const mapGenerator = new EnhancedProceduralGenerator(mapConfig);
    const map = mapGenerator.generate();

    // 2. Generate environmental effects
    const envConfig: EnvironmentalConfig = {
      seed,
      mapWidth: config.mapWidth,
      mapHeight: config.mapHeight,
      dynamicWeather: config.dynamicWeather !== false
    };

    const environmentalSystem = new EnvironmentalEffectsSystem(envConfig);

    // 3. Generate units for faction
    const faction = config.faction || this.determineFactionFromBiome(map.biome);
    const unitGenerator = new ProceduralUnitGenerator(seed);
    const units = unitGenerator.generateFaction(faction, 8);

    // 4. Generate AI commander
    const commanderGenerator = new EnhancedCommanderPersonality(
      seed,
      config.commanderArchetype
    );
    const commander = commanderGenerator.getPersonality();

    const generationTime = Date.now() - startTime;

    return {
      map,
      environmentalSystem,
      units,
      commander,
      seed,
      metadata: {
        generationTime,
        strategicDNA: map.strategicDNA,
        faction
      }
    };
  }

  /**
   * Determine faction from biome
   */
  private determineFactionFromBiome(
    biome: 'volcanic' | 'crystalline' | 'organic' | 'mechanical' | 'quantum' | 'void'
  ): FactionTheme {
    const biomeToFaction: Record<string, FactionTheme> = {
      volcanic: 'energy',
      crystalline: 'quantum',
      organic: 'biological',
      mechanical: 'mechanical',
      quantum: 'quantum',
      void: 'entropy'
    };

    return biomeToFaction[biome] || 'mechanical';
  }

  /**
   * Pre-generate content pools for performance
   */
  public preGenerateContentPools(
    seed: number,
    poolSizes: {
      unitVariations?: number;
      terrainTemplates?: number;
      commanderProfiles?: number;
    } = {}
  ): {
    unitPool: ProceduralUnit[];
    terrainTemplates: GeneratedMap[];
    commanderProfiles: CommanderPersonality[];
  } {
    const { 
      unitVariations = 50,
      terrainTemplates = 20,
      commanderProfiles = 12
    } = poolSizes;

    const rng = new SeededRandom(seed);
    const unitPool: ProceduralUnit[] = [];
    const terrainTemplatesList: GeneratedMap[] = [];
    const commanderProfilesList: CommanderPersonality[] = [];

    // Generate unit variations
    const factions: FactionTheme[] = [
      'quantum', 'biological', 'mechanical', 'energy',
      'neural', 'chrono', 'entropy'
    ];
    const roles: Array<'assault' | 'support' | 'siege' | 'scout' | 'defense' | 'utility'> = [
      'assault', 'support', 'siege', 'scout', 'defense', 'utility'
    ];

    for (let i = 0; i < unitVariations; i++) {
      const faction = rng.choice(factions);
      const role = rng.choice(roles);
      const generator = new ProceduralUnitGenerator(seed + i);
      unitPool.push(generator.generateUnit(faction, role));
    }

    // Generate terrain templates
    const personalities: Array<'aggressive' | 'defensive' | 'economic' | 'puzzle'> = [
      'aggressive', 'defensive', 'economic', 'puzzle'
    ];
    const biomes: Array<'volcanic' | 'crystalline' | 'organic' | 'mechanical' | 'quantum' | 'void'> = [
      'volcanic', 'crystalline', 'organic', 'mechanical', 'quantum', 'void'
    ];

    for (let i = 0; i < terrainTemplates; i++) {
      const personality = rng.choice(personalities);
      const biome = rng.choice(biomes);
      const config: EnhancedMapConfig = {
        width: 1000,
        height: 1000,
        seed: seed + i * 1000,
        personality,
        biome
      };
      const generator = new EnhancedProceduralGenerator(config);
      terrainTemplatesList.push(generator.generate());
    }

    // Generate commander profiles
    const archetypes: Array<'aggressor' | 'architect' | 'nomad' | 'tactician' | 'harvester' | 'wildcard' | 'balanced'> = [
      'aggressor', 'architect', 'nomad', 'tactician', 'harvester', 'wildcard', 'balanced'
    ];

    for (let i = 0; i < commanderProfiles; i++) {
      const archetype = rng.choice(archetypes);
      const generator = new EnhancedCommanderPersonality(seed + i * 100, archetype);
      commanderProfilesList.push(generator.getPersonality());
    }

    return {
      unitPool,
      terrainTemplates: terrainTemplatesList,
      commanderProfiles: commanderProfilesList
    };
  }

  /**
   * Combine pre-generated elements for runtime generation
   */
  public combinePreGeneratedElements(
    baseTemplate: GeneratedMap,
    unitPool: ProceduralUnit[],
    commanderProfile: CommanderPersonality,
    sessionSeed: number
  ): ProceduralGamePackage {
    const rng = new SeededRandom(sessionSeed);

    // Select units from pool
    const selectedUnits = rng.shuffle([...unitPool]).slice(0, 8);

    // Create environmental system
    const envConfig: EnvironmentalConfig = {
      seed: sessionSeed,
      mapWidth: baseTemplate.width,
      mapHeight: baseTemplate.height,
      dynamicWeather: true
    };
    const environmentalSystem = new EnvironmentalEffectsSystem(envConfig);

    // Use provided commander or create variation
    const commander = commanderProfile;

    return {
      map: baseTemplate,
      environmentalSystem,
      units: selectedUnits,
      commander,
      seed: sessionSeed,
      metadata: {
        generationTime: 0,
        strategicDNA: baseTemplate.strategicDNA,
        faction: selectedUnits[0]?.faction || 'mechanical'
      }
    };
  }

  /**
   * Get generation statistics
   */
  public getGenerationStats(package: ProceduralGamePackage): {
    mapComplexity: number;
    unitDiversity: number;
    commanderPersonality: string;
    strategicValue: number;
  } {
    const mapComplexity = 
      package.map.strategicPoints.length * 0.1 +
      package.map.terrainFeatures.length * 0.05 +
      package.map.nodes.length * 0.02;

    const unitDiversity = new Set(package.units.map(u => u.faction)).size;

    const strategicValue = 
      package.map.strategicDNA.openness * 0.25 +
      package.map.strategicDNA.defensiveness * 0.25 +
      package.map.strategicDNA.economicValue * 0.25 +
      package.map.strategicDNA.complexity * 0.25;

    return {
      mapComplexity,
      unitDiversity,
      commanderPersonality: package.commander.name,
      strategicValue
    };
  }
}


