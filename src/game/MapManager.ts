/**
 * Enhanced Map & Node Management System
 * Handles node capture, territory control, and resource generation
 */

import { ResourceType } from './ResourceManager';

export enum NodeType {
  ORE = 'ore',
  ENERGY = 'energy',
  BIOMASS = 'biomass',
  DATA = 'data',
  CENTRAL = 'central',
  SPECIAL = 'special'
}

export enum TerrainType {
  PLAINS = 'plains',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  SWAMP = 'swamp',
  CRYSTAL = 'crystal'
}

export enum Faction {
  PLAYER = 'player',
  ENEMY = 'enemy',
  NEUTRAL = 'neutral'
}

export interface MapNode {
  nodeId: string;
  nodeType: NodeType;
  gridPosition: { x: number; y: number };
  worldPosition: { x: number; y: number };
  controller: Faction;
  captureProgress: number; // 0-1
  contestingFactions: Faction[];
  resourceYield: number;
  isHidden: boolean;
  terrain: TerrainType;
  defenseBonus: number;
}

export class MapManager {
  private mapWidth: number;
  private mapHeight: number;
  private nodeSpacing: number;
  private mapGrid: Map<string, MapNode>; // gridPosition key -> node
  private allNodes: MapNode[];
  private controlledNodes: Map<Faction, MapNode[]>;
  private centralNodePosition: { x: number; y: number } | null = null;

  constructor(width: number = 9, height: number = 9, nodeSpacing: number = 2) {
    this.mapWidth = width;
    this.mapHeight = height;
    this.nodeSpacing = nodeSpacing;
    this.mapGrid = new Map();
    this.allNodes = [];
    this.controlledNodes = new Map();
    
    this.controlledNodes.set(Faction.PLAYER, []);
    this.controlledNodes.set(Faction.ENEMY, []);
    this.controlledNodes.set(Faction.NEUTRAL, []);
  }

  /**
   * Generate map with seed
   */
  public generateMap(seed: number): void {
    // Simple seeded random for deterministic generation
    const rng = this.seededRandom(seed);

    // Demo Scenario: Create specific layout (from spec)
    // MapSeed: 74219, Size: 9×9 tiles
    // Nodes: 5 (2 Ore, 1 Energy Reactor, 1 Biomass Swamp, 1 Data Vault hidden in Fog)
    this.createNode({ x: 2, y: 2 }, NodeType.ORE, Faction.NEUTRAL);
    this.createNode({ x: 6, y: 2 }, NodeType.ORE, Faction.NEUTRAL);
    this.createNode({ x: 2, y: 6 }, NodeType.ENERGY, Faction.NEUTRAL);
    this.createNode({ x: 6, y: 6 }, NodeType.BIOMASS, Faction.NEUTRAL);
    
    // Central node
    const centralNode = this.createNode({ x: 4, y: 4 }, NodeType.CENTRAL, Faction.NEUTRAL);
    this.centralNodePosition = { x: 4, y: 4 };

    // Hidden Data node (in Fog)
    const hiddenNode = this.createNode({ x: 0, y: 4 }, NodeType.DATA, Faction.NEUTRAL);
    hiddenNode.isHidden = true;
  }

  /**
   * Create a node
   */
  private createNode(
    gridPos: { x: number; y: number },
    type: NodeType,
    initialController: Faction
  ): MapNode {
    const nodeId = `${type}_${gridPos.x}_${gridPos.y}`;
    const worldPos = this.gridToWorldPosition(gridPos);

    const node: MapNode = {
      nodeId,
      nodeType: type,
      gridPosition: gridPos,
      worldPosition: worldPos,
      controller: initialController,
      captureProgress: 0,
      contestingFactions: [],
      resourceYield: this.getBaseYieldForType(type),
      isHidden: false,
      terrain: TerrainType.PLAINS,
      defenseBonus: 0
    };

    const gridKey = `${gridPos.x},${gridPos.y}`;
    this.mapGrid.set(gridKey, node);
    this.allNodes.push(node);
    this.controlledNodes.get(initialController)!.push(node);

    return node;
  }

  /**
   * Convert grid position to world position
   */
  private gridToWorldPosition(gridPos: { x: number; y: number }): { x: number; y: number } {
    const x = (gridPos.x - this.mapWidth / 2) * this.nodeSpacing;
    const y = (gridPos.y - this.mapHeight / 2) * this.nodeSpacing;
    return { x, y };
  }

  /**
   * Get base yield for node type (per 30s tick)
   */
  private getBaseYieldForType(type: NodeType): number {
    switch (type) {
      case NodeType.ORE:
        return 40; // Spec: 40 base per tick per captured Ore Node
      case NodeType.ENERGY:
        return 20; // Spec: 20 base per tick (reactor)
      case NodeType.BIOMASS:
        return 10; // Spec: 10 base per tick from swamp nodes
      case NodeType.DATA:
        return 5; // Spec: 5 base per tick from Research nodes
      case NodeType.CENTRAL:
        return 100; // Central node provides all resources
      default:
        return 0;
    }
  }

  /**
   * Start capturing a node
   */
  public startNodeCapture(nodeId: string, faction: Faction): boolean {
    const node = this.getNodeById(nodeId);
    if (!node) return false;

    if (!node.contestingFactions.includes(faction)) {
      node.contestingFactions.push(faction);
    }

    return true;
  }

  /**
   * Process node capture (called every tick)
   * Spec: 6s capture time (no contest), 12s (if contested)
   * At 60 ticks/sec: 6s = 360 ticks, 12s = 720 ticks
   */
  public processNodeCapture(nodeId: string, faction: Faction): boolean {
    const node = this.getNodeById(nodeId);
    if (!node) return false;

    // If already controlled by this faction, no need to capture
    if (node.controller === faction) {
      return false;
    }

    // If multiple factions contesting, progress stalls (12s capture time)
    if (node.contestingFactions.length > 1) {
      // Progress doesn't advance when contested
      return false;
    }

    // Only one faction contesting - normal capture
    if (node.contestingFactions.includes(faction)) {
      // Spec: 6s capture time (no contest) = 360 ticks at 60 ticks/sec
      // For simplicity, we'll use a rate that completes in 6 seconds
      // If contested, it would take 12 seconds (double the time)
      const isContested = node.controller !== Faction.NEUTRAL;
      const captureTimeSeconds = isContested ? 12 : 6;
      const captureTimeTicks = captureTimeSeconds * 60; // Assuming 60 ticks/sec
      const captureRate = 1.0 / captureTimeTicks;
      
      node.captureProgress += captureRate;

      if (node.captureProgress >= 1.0) {
        this.completeNodeCapture(nodeId, faction);
        return true;
      }
    }

    return false;
  }

  /**
   * Complete node capture
   */
  private completeNodeCapture(nodeId: string, newController: Faction): void {
    const node = this.getNodeById(nodeId);
    if (!node) return;

    // Remove from old controller
    const oldController = this.controlledNodes.get(node.controller);
    if (oldController) {
      const index = oldController.findIndex(n => n.nodeId === nodeId);
      if (index >= 0) {
        oldController.splice(index, 1);
      }
    }

    // Add to new controller
    node.controller = newController;
    node.captureProgress = 0;
    node.contestingFactions = [];
    this.controlledNodes.get(newController)!.push(node);
  }

  /**
   * Stop contesting a node
   */
  public stopNodeCapture(nodeId: string, faction: Faction): void {
    const node = this.getNodeById(nodeId);
    if (!node) return;

    const index = node.contestingFactions.indexOf(faction);
    if (index >= 0) {
      node.contestingFactions.splice(index, 1);
    }

    // Reset progress if no one is contesting
    if (node.contestingFactions.length === 0) {
      node.captureProgress = 0;
    }
  }

  /**
   * Check if central node is controlled by player
   */
  public isCentralNodeControlledByPlayer(): boolean {
    if (!this.centralNodePosition) return false;

    const gridKey = `${this.centralNodePosition.x},${this.centralNodePosition.y}`;
    const node = this.mapGrid.get(gridKey);
    return node !== undefined && node.controller === Faction.PLAYER;
  }

  /**
   * Get controlled nodes of a specific type
   */
  public getControlledNodesOfType(type: NodeType, faction: Faction = Faction.PLAYER): number {
    const controlled = this.controlledNodes.get(faction) || [];
    return controlled.filter(node => node.nodeType === type).length;
  }

  /**
   * Get total controlled nodes
   */
  public getControlledNodes(faction: Faction = Faction.PLAYER): number {
    return this.controlledNodes.get(faction)?.length || 0;
  }

  /**
   * Get player spawn position
   */
  public getPlayerSpawnPosition(): { x: number; y: number } {
    // Default spawn at bottom center
    const gridPos = { x: Math.floor(this.mapWidth / 2), y: 1 };
    return this.gridToWorldPosition(gridPos);
  }

  /**
   * Get node at grid position
   */
  public getNodeAtPosition(gridPos: { x: number; y: number }): MapNode | undefined {
    const gridKey = `${gridPos.x},${gridPos.y}`;
    return this.mapGrid.get(gridKey);
  }

  /**
   * Get node by ID
   */
  public getNodeById(nodeId: string): MapNode | undefined {
    return this.allNodes.find(node => node.nodeId === nodeId);
  }

  /**
   * Get all nodes
   */
  public getAllNodes(): MapNode[] {
    return [...this.allNodes];
  }

  /**
   * Get nodes controlled by faction
   */
  public getNodesByFaction(faction: Faction): MapNode[] {
    return [...(this.controlledNodes.get(faction) || [])];
  }

  /**
   * Simple seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  /**
   * Get resource generation from controlled nodes
   */
  public getResourceGeneration(): Map<string, number> {
    const generation = new Map<string, number>();
    const playerNodes = this.controlledNodes.get(Faction.PLAYER) || [];

    playerNodes.forEach(node => {
      const current = generation.get(node.nodeType) || 0;
      generation.set(node.nodeType, current + node.resourceYield);
    });

    return generation;
  }

  /**
   * Building system
   */
  private buildings: Map<string, Building> = new Map();
  private buildableAreas: Set<string> = new Set(); // gridPosition keys

  /**
   * Place a building at world position
   */
  public placeBuilding(
    type: BuildingType,
    worldX: number,
    worldY: number,
    faction: Faction = Faction.PLAYER
  ): Building | null {
    // Convert world position to grid position
    const gridPos = this.worldToGridPosition({ x: worldX, y: worldY });
    const gridKey = `${gridPos.x},${gridPos.y}`;

    // Check if position is buildable
    if (!this.isBuildable(gridPos)) {
      return null;
    }

    // Check if position is already occupied
    if (this.buildings.has(gridKey)) {
      return null;
    }

    const building: Building = {
      id: `building_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      gridPosition: gridPos,
      worldPosition: { x: worldX, y: worldY },
      faction,
      health: this.getBuildingMaxHealth(type),
      maxHealth: this.getBuildingMaxHealth(type),
      buildProgress: 0,
      isComplete: false,
      resourceGeneration: this.getBuildingResourceGeneration(type)
    };

    this.buildings.set(gridKey, building);
    return building;
  }

  /**
   * Update buildings (construction progress, resource generation)
   */
  public updateBuildings(deltaTime: number): void {
    this.buildings.forEach((building, key) => {
      if (!building.isComplete) {
        // Update construction progress
        const buildTime = this.getBuildingBuildTime(building.type);
        building.buildProgress += deltaTime / buildTime;
        
        if (building.buildProgress >= 1.0) {
          building.buildProgress = 1.0;
          building.isComplete = true;
        }
      }
    });
  }

  /**
   * Get building resource generation
   */
  public getBuildingResourceGeneration(): Map<ResourceType, number> {
    const generation = new Map<ResourceType, number>();
    
    this.buildings.forEach(building => {
      if (building.isComplete && building.faction === Faction.PLAYER) {
        const resourceType = this.getResourceTypeForBuilding(building.type);
        if (resourceType) {
          const current = generation.get(resourceType) || 0;
          generation.set(resourceType, current + building.resourceGeneration);
        }
      }
    });

    return generation;
  }

  /**
   * Check if position is buildable
   */
  private isBuildable(gridPos: { x: number; y: number }): boolean {
    // Check if within map bounds
    if (gridPos.x < 0 || gridPos.x >= this.mapWidth ||
        gridPos.y < 0 || gridPos.y >= this.mapHeight) {
      return false;
    }

    // Check if there's a node at this position (can't build on nodes)
    const node = this.getNodeAtPosition(gridPos);
    if (node) {
      return false;
    }

    return true;
  }

  /**
   * Convert world position to grid position
   */
  private worldToGridPosition(worldPos: { x: number; y: number }): { x: number; y: number } {
    const gridX = Math.round(worldPos.x / this.nodeSpacing + this.mapWidth / 2);
    const gridY = Math.round(worldPos.y / this.nodeSpacing + this.mapHeight / 2);
    return { x: gridX, y: gridY };
  }

  /**
   * Get building max health
   */
  private getBuildingMaxHealth(type: BuildingType): number {
    const healths: Record<BuildingType, number> = {
      'MiningFacility': 200,
      'PowerPlant': 250,
      'Farm': 150,
      'ResearchLab': 300,
      'Storage': 100,
      'Defense': 500,
      'Barracks': 200
    };
    return healths[type] || 200;
  }

  /**
   * Get building build time (in seconds)
   */
  private getBuildingBuildTime(type: BuildingType): number {
    const times: Record<BuildingType, number> = {
      'MiningFacility': 15,
      'PowerPlant': 20,
      'Farm': 12,
      'ResearchLab': 25,
      'Storage': 10,
      'Defense': 30,
      'Barracks': 18
    };
    return times[type] || 15;
  }

  /**
   * Get building resource generation rate
   */
  private getBuildingResourceGeneration(type: BuildingType): number {
    const rates: Record<BuildingType, number> = {
      'MiningFacility': 20, // ore per tick
      'PowerPlant': 15, // energy per tick
      'Farm': 10, // biomass per tick
      'ResearchLab': 8, // data per tick
      'Storage': 0,
      'Defense': 0,
      'Barracks': 0
    };
    return rates[type] || 0;
  }

  /**
   * Get resource type for building
   */
  private getResourceTypeForBuilding(type: BuildingType): ResourceType | null {
    const mapping: Record<BuildingType, ResourceType | null> = {
      'MiningFacility': ResourceType.ORE,
      'PowerPlant': ResourceType.ENERGY,
      'Farm': ResourceType.BIOMASS,
      'ResearchLab': ResourceType.DATA,
      'Storage': null,
      'Defense': null,
      'Barracks': null
    };
    return mapping[type] || null;
  }

  /**
   * Get all buildings
   */
  public getBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  /**
   * Get buildings by faction
   */
  public getBuildingsByFaction(faction: Faction): Building[] {
    return this.getBuildings().filter(b => b.faction === faction);
  }

  /**
   * Damage building
   */
  public damageBuilding(buildingId: string, damage: number): boolean {
    const building = Array.from(this.buildings.values()).find(b => b.id === buildingId);
    if (!building) return false;

    building.health = Math.max(0, building.health - damage);
    
    if (building.health <= 0) {
      const gridKey = `${building.gridPosition.x},${building.gridPosition.y}`;
      this.buildings.delete(gridKey);
      return true; // Building destroyed
    }

    return false; // Building damaged but not destroyed
  }
}

/**
 * Building types
 */
export type BuildingType = 
  | 'MiningFacility'
  | 'PowerPlant'
  | 'Farm'
  | 'ResearchLab'
  | 'Storage'
  | 'Defense'
  | 'Barracks';

/**
 * Building interface
 */
export interface Building {
  id: string;
  type: BuildingType;
  gridPosition: { x: number; y: number };
  worldPosition: { x: number; y: number };
  faction: Faction;
  health: number;
  maxHealth: number;
  buildProgress: number; // 0-1
  isComplete: boolean;
  resourceGeneration: number; // Per tick
}


