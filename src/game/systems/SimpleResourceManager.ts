/**
 * Simple Resource Manager
 * Handles basic resource generation for players
 */

export interface PlayerResources {
  matter: number;
  energy: number;
  life: number;
  knowledge: number;
}

export interface Player {
  id: number;
  name: string;
  position: { x: number; y: number };
  resources: PlayerResources;
  supply: { current: number; max: number };
  units: string[];
  buildings: string[];
  technologies: string[];
  eliminated: boolean;
  score: number;
}

export class SimpleResourceManager {
  private productionRates: {
    worker: { matter: number; energy: number; life: number; knowledge: number };
    refinery: { matter: number; energy: number; life: number; knowledge: number };
  };

  constructor() {
    this.productionRates = {
      worker: { matter: 2, energy: 0, life: 0, knowledge: 0 },
      refinery: { matter: 5, energy: 3, life: 0, knowledge: 0 }
    };
  }

  update(players: Player[]): void {
    players.forEach(player => {
      // Simple resource generation
      player.resources.matter += 2;
      player.resources.energy += 1;
      player.resources.life += 0.5;
      player.resources.knowledge += 0.2;

      // Cap resources
      player.resources.matter = Math.min(player.resources.matter, 5000);
      player.resources.energy = Math.min(player.resources.energy, 5000);
      player.resources.life = Math.min(player.resources.life, 5000);
      player.resources.knowledge = Math.min(player.resources.knowledge, 5000);
    });
  }
}

