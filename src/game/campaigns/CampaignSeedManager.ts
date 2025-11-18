/**
 * Campaign Seed Manager
 * Manages pre-baked seeds for judge demos and campaign replays
 */

import { safeStringify } from '@/utils/safeJSON';

export interface CampaignSeed {
  id: string;
  map: string;
  mapSeed: number;
  startResources: number;
  playerFaction: string;
  bioSeedHealth?: number;
  hostileDensity: number;
  recommendedStrategy: string;
  presetEvents: string[];
  notes: string;
}

export class CampaignSeedManager {
  private seeds: Map<string, CampaignSeed> = new Map();

  constructor() {
    this.initializeSeeds();
  }

  /**
   * Initialize pre-baked seeds
   */
  private initializeSeeds() {
    const archiveSeeds: CampaignSeed[] = [
      {
        id: 'seed-archive-001',
        map: 'CrystalValley',
        mapSeed: 913027,
        startResources: 80,
        playerFaction: 'Nomad-Guild',
        bioSeedHealth: 85,
        hostileDensity: 0.25,
        recommendedStrategy: 'Conserve for long-term buffs; avoid immediate harvest',
        presetEvents: ['scout_find:north_vault'],
        notes: 'Demo: Ethical choice visible in 10–12 minute run.'
      },
      {
        id: 'seed-archive-002',
        map: 'IronRidge',
        mapSeed: 913043,
        startResources: 30,
        playerFaction: 'Forge-Consortium',
        bioSeedHealth: 60,
        hostileDensity: 0.4,
        recommendedStrategy: 'High pressure; harvesting yields tactical advantage but spawns hazards',
        presetEvents: ['trader_offer:quick_tech'],
        notes: 'Demo: Short-term harvesting tradeoff; good for contested choice telemetry.'
      },
      {
        id: 'seed-archive-003',
        map: 'SiltMarsh',
        mapSeed: 913128,
        startResources: 50,
        playerFaction: 'Riverhold',
        bioSeedHealth: 40,
        hostileDensity: 0.2,
        recommendedStrategy: 'Fragile bio-seed; preserve to avoid acid bloom',
        presetEvents: ['bio_seed_sigh'],
        notes: 'Demo: environmental event triggered if harvested; useful for audio demonstration.'
      },
      {
        id: 'seed-archive-004',
        map: 'GlassHollows',
        mapSeed: 913200,
        startResources: 120,
        playerFaction: 'Skyward',
        bioSeedHealth: 95,
        hostileDensity: 0.15,
        recommendedStrategy: 'Resource-rich; opportunity to experiment with BioConserve tech',
        presetEvents: ['artifact_discovered:glass_orb'],
        notes: 'Demo: rich choices, artifact ties into lore journal; great for narrative epilogue.'
      },
      {
        id: 'seed-archive-005',
        map: 'Scarfield',
        mapSeed: 913400,
        startResources: 20,
        playerFaction: 'Outriders',
        bioSeedHealth: 20,
        hostileDensity: 0.6,
        recommendedStrategy: 'Hard mode; encourages risky harvests and reveals moral consequences',
        presetEvents: ['storm_trigger:acid_bloom'],
        notes: 'Judge challenge: intended to highlight mechanical vs narrative tension under stress.'
      }
    ];

    archiveSeeds.forEach(seed => {
      this.seeds.set(seed.id, seed);
    });
  }

  /**
   * Get seed by ID
   */
  getSeed(id: string): CampaignSeed | undefined {
    return this.seeds.get(id);
  }

  /**
   * Get all seeds for a campaign
   */
  getSeedsForCampaign(campaignId: string): CampaignSeed[] {
    return Array.from(this.seeds.values()).filter(
      seed => seed.id.startsWith(`seed-${campaignId}`)
    );
  }

  /**
   * Get all seeds
   */
  getAllSeeds(): CampaignSeed[] {
    return Array.from(this.seeds.values());
  }

  /**
   * Register a new seed
   */
  registerSeed(seed: CampaignSeed): void {
    this.seeds.set(seed.id, seed);
  }

  /**
   * Export seeds as JSON
   */
  exportSeeds(): string {
    return JSON.stringify(Array.from(this.seeds.values()), null, 2);
  }

  /**
   * Import seeds from JSON
   */
  importSeeds(json: string): void {
    try {
      const seeds: CampaignSeed[] = JSON.parse(json);
      seeds.forEach(seed => this.registerSeed(seed));
    } catch (error) {
      console.error('Failed to import seeds:', error);
    }
  }
}


