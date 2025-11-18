/**
 * Hierarchical Pathfinding (HPA*) for Open-World Navigation
 * Scales pathfinding to massive worlds by using chunk-based abstraction
 */

import { ChunkManager, Chunk } from '../../map/ChunkManager';
import { Tile, GameState } from '../terrain/AITileEvaluator';

export interface ChunkCoord {
  x: number;
  y: number;
}

export interface Cluster {
  chunkCoords: ChunkCoord[];
  abstractNode: AbstractNode;
  connections: Map<string, ClusterConnection>;
}

export interface AbstractNode {
  id: string;
  position: { x: number; y: number };
  chunkCoord: ChunkCoord;
  passability: number;
  connections: string[];
}

export interface ClusterConnection {
  fromCluster: string;
  toCluster: string;
  entryPoint: { x: number; y: number };
  exitPoint: { x: number; y: number };
  cost: number;
  path: Array<{ x: number; y: number }>;
}

export interface MacroPath {
  chunkPath: ChunkCoord[];
  entryPoints: Array<{ x: number; y: number }>;
  exitPoints: Array<{ x: number; y: number }>;
  estimatedCost: number;
}

export interface DetailedPath {
  waypoints: Array<{ x: number; y: number }>;
  chunkSequence: ChunkCoord[];
  totalCost: number;
  reasoning: string;
}

export class HierarchicalPathfinding {
  private chunkManager: ChunkManager;
  private chunkSize: number;
  private abstractGraph: Map<string, Cluster>;
  private chunkPassabilityCache: Map<string, number>;
  private dynamicObstacleMap: Map<string, Set<string>>; // chunkKey -> set of blocked tiles

  constructor(chunkManager: ChunkManager, chunkSize: number = 32) {
    this.chunkManager = chunkManager;
    this.chunkSize = chunkSize;
    this.abstractGraph = new Map();
    this.chunkPassabilityCache = new Map();
    this.dynamicObstacleMap = new Map();
  }

  /**
   * Convert world coordinates to chunk coordinates
   */
  public worldToChunk(worldX: number, worldY: number): ChunkCoord {
    return {
      x: Math.floor(worldX / this.chunkSize),
      y: Math.floor(worldY / this.chunkSize)
    };
  }

  /**
   * Convert chunk coordinates to world coordinates (chunk center)
   */
  public chunkToWorld(chunkCoord: ChunkCoord): { x: number; y: number } {
    return {
      x: chunkCoord.x * this.chunkSize + this.chunkSize / 2,
      y: chunkCoord.y * this.chunkSize + this.chunkSize / 2
    };
  }

  /**
   * Find path using hierarchical approach
   */
  public findPath(
    start: { x: number; y: number },
    end: { x: number; y: number },
    state: GameState,
    options: {
      avoidThreats?: boolean;
      preferCover?: boolean;
      urgency?: 'low' | 'medium' | 'high' | 'critical';
    } = {}
  ): DetailedPath | null {
    const startChunk = this.worldToChunk(start.x, start.y);
    const endChunk = this.worldToChunk(end.x, end.y);

    // Phase 1: Chunk-level pathfinding (macro path)
    const macroPath = this.findMacroPath(startChunk, endChunk, state, options);
    if (!macroPath || macroPath.chunkPath.length === 0) {
      return null;
    }

    // Phase 2: Refine chunk path into detailed waypoints
    const detailedPath = this.refineChunkPath(macroPath, start, end, state, options);

    return detailedPath;
  }

  /**
   * Phase 1: Find path at chunk level (abstract graph)
   */
  private findMacroPath(
    startChunk: ChunkCoord,
    endChunk: ChunkCoord,
    state: GameState,
    options: any
  ): MacroPath | null {
    // If same chunk, skip macro pathfinding
    if (startChunk.x === endChunk.x && startChunk.y === endChunk.y) {
      return {
        chunkPath: [startChunk],
        entryPoints: [],
        exitPoints: [],
        estimatedCost: 0
      };
    }

    // Build or update abstract graph for relevant chunks
    this.updateAbstractGraph([startChunk, endChunk], state);

    // A* on abstract graph
    const chunkPath = this.aStarChunks(startChunk, endChunk, state, options);
    if (!chunkPath || chunkPath.length === 0) {
      return null;
    }

    // Calculate entry/exit points between chunks
    const entryPoints: Array<{ x: number; y: number }> = [];
    const exitPoints: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < chunkPath.length - 1; i++) {
      const currentChunk = chunkPath[i];
      const nextChunk = chunkPath[i + 1];
      
      const connection = this.findChunkConnection(currentChunk, nextChunk, state);
      if (connection) {
        if (i === 0) {
          entryPoints.push(connection.entryPoint);
        }
        exitPoints.push(connection.exitPoint);
        if (i < chunkPath.length - 2) {
          entryPoints.push(connection.exitPoint); // Exit becomes entry for next
        }
      }
    }

    const estimatedCost = this.estimateChunkPathCost(chunkPath, state);

    return {
      chunkPath,
      entryPoints,
      exitPoints,
      estimatedCost
    };
  }

  /**
   * Phase 2: Refine chunk path into detailed waypoints
   */
  private refineChunkPath(
    macroPath: MacroPath,
    start: { x: number; y: number },
    end: { x: number; y: number },
    state: GameState,
    options: any
  ): DetailedPath {
    const waypoints: Array<{ x: number; y: number }> = [start];
    let currentPos = start;

    for (let i = 0; i < macroPath.chunkPath.length; i++) {
      const chunk = macroPath.chunkPath[i];
      const isFirst = i === 0;
      const isLast = i === macroPath.chunkPath.length - 1;

      let targetPos: { x: number; y: number };
      if (isLast) {
        targetPos = end;
      } else if (macroPath.exitPoints[i]) {
        targetPos = macroPath.exitPoints[i];
      } else {
        const nextChunk = macroPath.chunkPath[i + 1];
        targetPos = this.findBestChunkExit(chunk, nextChunk, currentPos, state);
      }

      // Find detailed path within chunk
      const chunkPath = this.findIntraChunkPath(
        currentPos,
        targetPos,
        chunk,
        state,
        options
      );

      if (chunkPath && chunkPath.length > 0) {
        // Add waypoints (skip first to avoid duplicate)
        waypoints.push(...chunkPath.slice(1));
      }

      currentPos = targetPos;
    }

    const totalCost = this.calculatePathCost(waypoints, state);
    const reasoning = this.generatePathReasoning(macroPath, waypoints, options);

    return {
      waypoints,
      chunkSequence: macroPath.chunkPath,
      totalCost,
      reasoning
    };
  }

  /**
   * A* pathfinding on chunk-level abstract graph
   */
  private aStarChunks(
    start: ChunkCoord,
    end: ChunkCoord,
    state: GameState,
    options: any
  ): ChunkCoord[] | null {
    const openSet: Array<{ coord: ChunkCoord; f: number; g: number; h: number; parent: ChunkCoord | null }> = [];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, ChunkCoord | null>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    const startKey = this.chunkKey(start);
    const endKey = this.chunkKey(end);

    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristicChunk(start, end));
    openSet.push({ coord: start, f: fScore.get(startKey)!, g: 0, h: fScore.get(startKey)!, parent: null });

    while (openSet.length > 0) {
      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = this.chunkKey(current.coord);

      if (currentKey === endKey) {
        // Reconstruct path
        const path: ChunkCoord[] = [];
        let node: ChunkCoord | null = current.coord;
        while (node) {
          path.unshift(node);
          const parentKey = this.chunkKey(node);
          node = cameFrom.get(parentKey) || null;
        }
        return path;
      }

      closedSet.add(currentKey);

      // Check neighbors
      const neighbors = this.getChunkNeighbors(current.coord, state);
      for (const neighbor of neighbors) {
        const neighborKey = this.chunkKey(neighbor);
        if (closedSet.has(neighborKey)) continue;

        const tentativeG = (gScore.get(currentKey) || Infinity) + this.getChunkCost(current.coord, neighbor, state, options);

        if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)!) {
          cameFrom.set(neighborKey, current.coord);
          gScore.set(neighborKey, tentativeG);
          const h = this.heuristicChunk(neighbor, end);
          fScore.set(neighborKey, tentativeG + h);

          const existing = openSet.find(n => this.chunkKey(n.coord) === neighborKey);
          if (existing) {
            existing.f = fScore.get(neighborKey)!;
            existing.g = tentativeG;
            existing.h = h;
          } else {
            openSet.push({ coord: neighbor, f: fScore.get(neighborKey)!, g: tentativeG, h, parent: current.coord });
          }
        }
      }
    }

    return null; // No path found
  }

  /**
   * Find detailed path within a single chunk
   */
  private findIntraChunkPath(
    start: { x: number; y: number },
    end: { x: number; y: number },
    chunk: ChunkCoord,
    state: GameState,
    options: any
  ): Array<{ x: number; y: number }> | null {
    // Simplified A* within chunk bounds
    const waypoints: Array<{ x: number; y: number }> = [start];
    let current = start;
    const visited = new Set<string>();
    visited.add(`${current.x},${current.y}`);

    const maxIterations = this.chunkSize * 2;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      const dx = end.x - current.x;
      const dy = end.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 1.5) {
        waypoints.push(end);
        break;
      }

      // Move towards target with obstacle avoidance
      const stepX = Math.sign(dx) * Math.min(1, Math.abs(dx));
      const stepY = Math.sign(dy) * Math.min(1, Math.abs(dy));

      const nextX = current.x + stepX;
      const nextY = current.y + stepY;
      const nextKey = `${nextX},${nextY}`;

      if (!visited.has(nextKey)) {
        const tile = state.map.getTile(nextX, nextY);
        const chunkKey = this.chunkKey(chunk);
        const blockedTiles = this.dynamicObstacleMap.get(chunkKey);

        if (tile && (tile.passability || 1) > 0.3) {
          // Check if tile is dynamically blocked
          if (!blockedTiles || !blockedTiles.has(nextKey)) {
            current = { x: nextX, y: nextY };
            waypoints.push(current);
            visited.add(nextKey);
            continue;
          }
        }

        // Try alternative directions
        const alternatives = [
          { x: current.x + stepX, y: current.y },
          { x: current.x, y: current.y + stepY },
          { x: current.x - stepX, y: current.y },
          { x: current.x, y: current.y - stepY }
        ];

        let found = false;
        for (const alt of alternatives) {
          const altKey = `${alt.x},${alt.y}`;
          if (!visited.has(altKey)) {
            const altTile = state.map.getTile(alt.x, alt.y);
            if (altTile && (altTile.passability || 1) > 0.3) {
              if (!blockedTiles || !blockedTiles.has(altKey)) {
                current = alt;
                waypoints.push(current);
                visited.add(altKey);
                found = true;
                break;
              }
            }
          }
        }

        if (!found) break;
      } else {
        break;
      }
    }

    return waypoints.length > 1 ? waypoints : null;
  }

  /**
   * Update abstract graph for given chunks
   */
  private updateAbstractGraph(chunks: ChunkCoord[], state: GameState): void {
    for (const chunk of chunks) {
      const key = this.chunkKey(chunk);
      if (!this.abstractGraph.has(key)) {
        this.buildCluster(chunk, state);
      }
    }
  }

  /**
   * Build cluster (abstract node) for a chunk
   */
  private buildCluster(chunk: ChunkCoord, state: GameState): void {
    const key = this.chunkKey(chunk);
    const passability = this.calculateChunkPassability(chunk, state);
    
    const abstractNode: AbstractNode = {
      id: key,
      position: this.chunkToWorld(chunk),
      chunkCoord: chunk,
      passability,
      connections: []
    };

    const cluster: Cluster = {
      chunkCoords: [chunk],
      abstractNode,
      connections: new Map()
    };

    this.abstractGraph.set(key, cluster);
    this.chunkPassabilityCache.set(key, passability);
  }

  /**
   * Calculate average passability of a chunk
   */
  private calculateChunkPassability(chunk: ChunkCoord, state: GameState): number {
    const key = this.chunkKey(chunk);
    if (this.chunkPassabilityCache.has(key)) {
      return this.chunkPassabilityCache.get(key)!;
    }

    let totalPassability = 0;
    let count = 0;
    const worldStart = this.chunkToWorld(chunk);
    const worldStartX = chunk.x * this.chunkSize;
    const worldStartY = chunk.y * this.chunkSize;

    // Sample tiles in chunk
    const sampleSize = Math.min(10, this.chunkSize);
    const step = Math.max(1, Math.floor(this.chunkSize / sampleSize));

    for (let y = 0; y < this.chunkSize; y += step) {
      for (let x = 0; x < this.chunkSize; x += step) {
        const tile = state.map.getTile(worldStartX + x, worldStartY + y);
        if (tile) {
          totalPassability += tile.passability || 1.0;
          count++;
        }
      }
    }

    const avgPassability = count > 0 ? totalPassability / count : 0.5;
    this.chunkPassabilityCache.set(key, avgPassability);
    return avgPassability;
  }

  /**
   * Get neighboring chunks
   */
  private getChunkNeighbors(chunk: ChunkCoord, state: GameState): ChunkCoord[] {
    return [
      { x: chunk.x - 1, y: chunk.y },
      { x: chunk.x + 1, y: chunk.y },
      { x: chunk.x, y: chunk.y - 1 },
      { x: chunk.x, y: chunk.y + 1 }
    ];
  }

  /**
   * Get cost to move from one chunk to another
   */
  private getChunkCost(
    from: ChunkCoord,
    to: ChunkCoord,
    state: GameState,
    options: any
  ): number {
    const fromKey = this.chunkKey(from);
    const toKey = this.chunkKey(to);
    
    const fromPassability = this.calculateChunkPassability(from, state);
    const toPassability = this.calculateChunkPassability(to, state);
    
    // Base cost is inverse of passability
    let cost = (1 / (fromPassability + 0.1)) + (1 / (toPassability + 0.1));
    
    // Urgency modifier
    if (options.urgency === 'critical') {
      cost *= 0.5; // Faster path for critical urgency
    } else if (options.urgency === 'low') {
      cost *= 1.2; // Can take longer scenic routes
    }

    return cost;
  }

  /**
   * Heuristic for chunk distance
   */
  private heuristicChunk(a: ChunkCoord, b: ChunkCoord): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Find connection between two chunks
   */
  private findChunkConnection(
    from: ChunkCoord,
    to: ChunkCoord,
    state: GameState
  ): ClusterConnection | null {
    // Find best entry/exit points on chunk boundaries
    const fromWorld = this.chunkToWorld(from);
    const toWorld = this.chunkToWorld(to);
    
    // Determine boundary direction
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    let entryPoint: { x: number; y: number };
    let exitPoint: { x: number; y: number };

    if (dx > 0) {
      // Moving right
      entryPoint = { x: from.x * this.chunkSize + this.chunkSize - 1, y: from.y * this.chunkSize + this.chunkSize / 2 };
      exitPoint = { x: to.x * this.chunkSize, y: to.y * this.chunkSize + this.chunkSize / 2 };
    } else if (dx < 0) {
      // Moving left
      entryPoint = { x: from.x * this.chunkSize, y: from.y * this.chunkSize + this.chunkSize / 2 };
      exitPoint = { x: to.x * this.chunkSize + this.chunkSize - 1, y: to.y * this.chunkSize + this.chunkSize / 2 };
    } else if (dy > 0) {
      // Moving down
      entryPoint = { x: from.x * this.chunkSize + this.chunkSize / 2, y: from.y * this.chunkSize + this.chunkSize - 1 };
      exitPoint = { x: to.x * this.chunkSize + this.chunkSize / 2, y: to.y * this.chunkSize };
    } else {
      // Moving up
      entryPoint = { x: from.x * this.chunkSize + this.chunkSize / 2, y: from.y * this.chunkSize };
      exitPoint = { x: to.x * this.chunkSize + this.chunkSize / 2, y: to.y * this.chunkSize + this.chunkSize - 1 };
    }

    return {
      fromCluster: this.chunkKey(from),
      toCluster: this.chunkKey(to),
      entryPoint,
      exitPoint,
      cost: this.heuristicChunk(from, to),
      path: [entryPoint, exitPoint]
    };
  }

  /**
   * Find best exit point from chunk to next chunk
   */
  private findBestChunkExit(
    currentChunk: ChunkCoord,
    nextChunk: ChunkCoord,
    currentPos: { x: number; y: number },
    state: GameState
  ): { x: number; y: number } {
    const connection = this.findChunkConnection(currentChunk, nextChunk, state);
    return connection ? connection.exitPoint : this.chunkToWorld(nextChunk);
  }

  /**
   * Estimate cost of chunk path
   */
  private estimateChunkPathCost(chunkPath: ChunkCoord[], state: GameState): number {
    let cost = 0;
    for (let i = 0; i < chunkPath.length - 1; i++) {
      cost += this.heuristicChunk(chunkPath[i], chunkPath[i + 1]);
    }
    return cost;
  }

  /**
   * Calculate detailed path cost
   */
  private calculatePathCost(waypoints: Array<{ x: number; y: number }>, state: GameState): number {
    let cost = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i];
      const b = waypoints[i + 1];
      const distance = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
      const tile = state.map.getTile(b.x, b.y);
      const passability = tile?.passability || 1.0;
      cost += distance / passability;
    }
    return cost;
  }

  /**
   * Generate reasoning for path
   */
  private generatePathReasoning(
    macroPath: MacroPath,
    waypoints: Array<{ x: number; y: number }>,
    options: any
  ): string {
    const reasons: string[] = [];
    
    if (macroPath.chunkPath.length > 1) {
      reasons.push(`${macroPath.chunkPath.length} chunks`);
    }
    
    if (options.urgency === 'critical') {
      reasons.push('critical urgency');
    }
    
    if (waypoints.length > 0) {
      reasons.push(`${waypoints.length} waypoints`);
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Standard path';
  }

  /**
   * Register dynamic obstacle (e.g., construction, player-created blockages)
   */
  public registerDynamicObstacle(
    position: { x: number; y: number },
    isBlocked: boolean
  ): void {
    const chunk = this.worldToChunk(position.x, position.y);
    const chunkKey = this.chunkKey(chunk);
    const tileKey = `${position.x},${position.y}`;

    if (!this.dynamicObstacleMap.has(chunkKey)) {
      this.dynamicObstacleMap.set(chunkKey, new Set());
    }

    const blockedTiles = this.dynamicObstacleMap.get(chunkKey)!;
    if (isBlocked) {
      blockedTiles.add(tileKey);
    } else {
      blockedTiles.delete(tileKey);
    }

    // Invalidate chunk cache
    this.chunkPassabilityCache.delete(chunkKey);
  }

  /**
   * Optimize chunk sizes based on player density and terrain complexity
   */
  public optimizeChunkSizes(
    region: { center: { x: number; y: number }; radius: number },
    playerDensity: number,
    terrainComplexity: number
  ): void {
    // Adaptive chunking - smaller chunks in busy/complex areas
    const threshold = 0.5;
    if (playerDensity > threshold || terrainComplexity > threshold) {
      // Use smaller chunks for more precision
      this.chunkSize = Math.max(16, Math.floor(this.chunkSize * 0.75));
    } else {
      // Use larger chunks for less overhead
      this.chunkSize = Math.min(64, Math.floor(this.chunkSize * 1.25));
    }
  }

  /**
   * Helper: Get chunk key
   */
  private chunkKey(chunk: ChunkCoord): string {
    return `${chunk.x},${chunk.y}`;
  }
}

