import { SeededRandom } from '../lib/SeededRandom';

/**
 * Dynamic Weather Zones and Environmental Effects System
 * Creates areas that periodically affect unit capabilities
 */

export type WeatherType = 
  | 'quantum_storm' 
  | 'energy_surge' 
  | 'gravity_well' 
  | 'temporal_distortion'
  | 'neural_interference'
  | 'void_zone'
  | 'resource_flux'
  | 'clear';

export interface WeatherZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: WeatherType;
  intensity: number; // 0-1
  duration: number; // in seconds, -1 for permanent
  active: boolean;
  effects: WeatherEffects;
  visualEffect?: string;
}

export interface WeatherEffects {
  movementSpeed?: number; // Multiplier
  attackDamage?: number; // Multiplier
  visionRange?: number; // Multiplier
  energyConsumption?: number; // Multiplier
  specialEffects?: string[];
}

export interface EnvironmentalConfig {
  seed: number;
  mapWidth: number;
  mapHeight: number;
  zoneCount?: number;
  dynamicWeather?: boolean;
}

export class EnvironmentalEffectsSystem {
  private rng: SeededRandom;
  private zones: WeatherZone[] = [];
  private config: EnvironmentalConfig;
  private time: number = 0;

  constructor(config: EnvironmentalConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);
    this.initializeZones();
  }

  /**
   * Initialize weather zones on the map
   */
  private initializeZones(): void {
    const zoneCount = this.config.zoneCount || this.rng.nextInt(3, 6);
    
    for (let i = 0; i < zoneCount; i++) {
      const zone = this.generateWeatherZone(i);
      this.zones.push(zone);
    }
  }

  /**
   * Generate a weather zone
   */
  private generateWeatherZone(index: number): WeatherZone {
    const weatherTypes: WeatherType[] = [
      'quantum_storm',
      'energy_surge',
      'gravity_well',
      'temporal_distortion',
      'neural_interference',
      'void_zone',
      'resource_flux'
    ];

    const type = this.rng.choice(weatherTypes);
    const intensity = this.rng.nextFloat(0.5, 1.0);
    const radius = this.rng.nextFloat(80, 200);
    
    // Position zones away from edges
    const x = this.rng.nextFloat(
      this.config.mapWidth * 0.15,
      this.config.mapWidth * 0.85
    );
    const y = this.rng.nextFloat(
      this.config.mapHeight * 0.15,
      this.config.mapHeight * 0.85
    );

    const effects = this.getWeatherEffects(type, intensity);
    const duration = this.config.dynamicWeather 
      ? this.rng.nextFloat(30, 120) // 30-120 seconds
      : -1; // Permanent

    return {
      id: `weather_zone_${index}`,
      x,
      y,
      radius,
      type,
      intensity,
      duration,
      active: true,
      effects,
      visualEffect: this.getVisualEffect(type)
    };
  }

  /**
   * Get effects for weather type
   */
  private getWeatherEffects(type: WeatherType, intensity: number): WeatherEffects {
    const baseEffects: Record<WeatherType, WeatherEffects> = {
      quantum_storm: {
        movementSpeed: 0.7, // 30% slower
        visionRange: 0.6, // 40% reduced vision
        specialEffects: ['teleport_chance', 'unpredictable_movement']
      },
      energy_surge: {
        attackDamage: 1.3, // 30% more damage
        energyConsumption: 0.5, // 50% less energy cost
        specialEffects: ['overcharge_available']
      },
      gravity_well: {
        movementSpeed: 0.5, // 50% slower
        attackDamage: 0.9, // 10% less damage
        specialEffects: ['pull_effect']
      },
      temporal_distortion: {
        movementSpeed: 1.5, // 50% faster
        attackDamage: 0.8, // 20% less damage
        specialEffects: ['time_dilation', 'cooldown_reduction']
      },
      neural_interference: {
        visionRange: 0.4, // 60% reduced vision
        attackDamage: 0.85, // 15% less damage
        specialEffects: ['ability_disruption', 'confusion']
      },
      void_zone: {
        movementSpeed: 0.6,
        attackDamage: 0.7, // 30% less damage
        specialEffects: ['damage_over_time', 'resource_drain']
      },
      resource_flux: {
        specialEffects: ['resource_generation', 'unstable_resources']
      },
      clear: {}
    };

    const base = baseEffects[type] || {};
    
    // Apply intensity scaling
    const scaled: WeatherEffects = {};
    if (base.movementSpeed) {
      scaled.movementSpeed = 1 + (base.movementSpeed - 1) * intensity;
    }
    if (base.attackDamage) {
      scaled.attackDamage = 1 + (base.attackDamage - 1) * intensity;
    }
    if (base.visionRange) {
      scaled.visionRange = 1 + (base.visionRange - 1) * intensity;
    }
    if (base.energyConsumption) {
      scaled.energyConsumption = 1 + (base.energyConsumption - 1) * intensity;
    }
    scaled.specialEffects = base.specialEffects;

    return scaled;
  }

  /**
   * Get visual effect description
   */
  private getVisualEffect(type: WeatherType): string {
    const effects: Record<WeatherType, string> = {
      quantum_storm: 'swirling quantum particles, phase distortions',
      energy_surge: 'bright energy waves, electrical discharges',
      gravity_well: 'distorted space, light bending',
      temporal_distortion: 'time ripples, temporal anomalies',
      neural_interference: 'neural static, mind-warping visuals',
      void_zone: 'dark void, matter decay',
      resource_flux: 'resource particles, unstable energy',
      clear: 'normal conditions'
    };

    return effects[type] || 'normal conditions';
  }

  /**
   * Update weather zones (for dynamic weather)
   */
  public update(deltaTime: number): void {
    if (!this.config.dynamicWeather) return;

    this.time += deltaTime;

    // Update zone durations
    this.zones.forEach(zone => {
      if (zone.duration > 0) {
        zone.duration -= deltaTime;
        if (zone.duration <= 0) {
          // Zone expires, regenerate it
          this.regenerateZone(zone);
        }
      }
    });

    // Randomly spawn new zones (low chance)
    if (this.rng.next() < 0.001) { // 0.1% chance per update
      const newZone = this.generateWeatherZone(this.zones.length);
      this.zones.push(newZone);
    }
  }

  /**
   * Regenerate an expired zone
   */
  private regenerateZone(zone: WeatherZone): void {
    const weatherTypes: WeatherType[] = [
      'quantum_storm',
      'energy_surge',
      'gravity_well',
      'temporal_distortion',
      'neural_interference',
      'void_zone',
      'resource_flux'
    ];

    const newType = this.rng.choice(weatherTypes);
    const intensity = this.rng.nextFloat(0.5, 1.0);
    const duration = this.rng.nextFloat(30, 120);

    zone.type = newType;
    zone.intensity = intensity;
    zone.duration = duration;
    zone.effects = this.getWeatherEffects(newType, intensity);
    zone.visualEffect = this.getVisualEffect(newType);
    zone.active = true;
  }

  /**
   * Get weather effects at a specific position
   */
  public getEffectsAt(x: number, y: number): WeatherEffects {
    const combinedEffects: WeatherEffects = {};
    let effectCount = 0;

    for (const zone of this.zones) {
      if (!zone.active) continue;

      const dx = x - zone.x;
      const dy = y - zone.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= zone.radius) {
        // Calculate effect strength based on distance from center
        const distanceFactor = 1 - (distance / zone.radius);
        const effectStrength = zone.intensity * distanceFactor;

        // Combine effects
        if (zone.effects.movementSpeed) {
          const current = combinedEffects.movementSpeed || 1;
          combinedEffects.movementSpeed = current * 
            (1 + (zone.effects.movementSpeed - 1) * effectStrength);
        }

        if (zone.effects.attackDamage) {
          const current = combinedEffects.attackDamage || 1;
          combinedEffects.attackDamage = current * 
            (1 + (zone.effects.attackDamage - 1) * effectStrength);
        }

        if (zone.effects.visionRange) {
          const current = combinedEffects.visionRange || 1;
          combinedEffects.visionRange = current * 
            (1 + (zone.effects.visionRange - 1) * effectStrength);
        }

        if (zone.effects.energyConsumption) {
          const current = combinedEffects.energyConsumption || 1;
          combinedEffects.energyConsumption = current * 
            (1 + (zone.effects.energyConsumption - 1) * effectStrength);
        }

        // Collect special effects
        if (zone.effects.specialEffects) {
          if (!combinedEffects.specialEffects) {
            combinedEffects.specialEffects = [];
          }
          combinedEffects.specialEffects.push(...zone.effects.specialEffects);
        }

        effectCount++;
      }
    }

    return combinedEffects;
  }

  /**
   * Get all active weather zones
   */
  public getActiveZones(): WeatherZone[] {
    return this.zones.filter(z => z.active);
  }

  /**
   * Get weather zone at position
   */
  public getZoneAt(x: number, y: number): WeatherZone | null {
    for (const zone of this.zones) {
      if (!zone.active) continue;

      const dx = x - zone.x;
      const dy = y - zone.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= zone.radius) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Add a temporary weather zone
   */
  public addTemporaryZone(
    x: number,
    y: number,
    type: WeatherType,
    radius: number,
    duration: number,
    intensity: number = 1.0
  ): WeatherZone {
    const zone: WeatherZone = {
      id: `temp_weather_${Date.now()}`,
      x,
      y,
      radius,
      type,
      intensity,
      duration,
      active: true,
      effects: this.getWeatherEffects(type, intensity),
      visualEffect: this.getVisualEffect(type)
    };

    this.zones.push(zone);
    return zone;
  }

  /**
   * Remove a weather zone
   */
  public removeZone(zoneId: string): boolean {
    const index = this.zones.findIndex(z => z.id === zoneId);
    if (index !== -1) {
      this.zones.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get weather forecast for a position (predictive)
   */
  public getForecast(x: number, y: number, timeAhead: number = 10): WeatherEffects {
    // For now, return current effects
    // In a more advanced system, this could predict zone movements
    return this.getEffectsAt(x, y);
  }
}


