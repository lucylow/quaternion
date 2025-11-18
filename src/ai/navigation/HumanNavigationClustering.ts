/**
 * Human-in-the-Loop Navigation Clustering
 * Analyzes player navigation patterns to learn human-like behaviors
 */

export interface PlayerNavigationData {
  playerId: string;
  paths: NavigationPath[];
  timestamp: number;
}

export interface NavigationPath {
  waypoints: Array<{ x: number; y: number; timestamp: number }>;
  start: { x: number; y: number };
  end: { x: number; y: number };
  purpose: string;
  duration: number;
  detours: number;
  backtracking: number;
  transportMode: string;
}

export interface NavigationFeatureVector {
  pathEfficiency: number; // 0-1, how direct the path is
  explorationTendency: number; // 0-1, how much they explore
  riskTolerance: number; // 0-1, how much risk they take
  socialPreference: number; // 0-1, preference for populated areas
  speedPreference: number; // 0-1, preference for fast routes
  scenicPreference: number; // 0-1, preference for scenic routes
  backtrackingFrequency: number; // 0-1, how often they backtrack
  detourFrequency: number; // 0-1, how often they take detours
}

export interface NavigationCluster {
  id: string;
  centroid: NavigationFeatureVector;
  members: string[]; // player IDs
  style: NavigationStyle;
  size: number;
}

export enum NavigationStyle {
  EFFICIENCY_EXPERT = 'efficiency_expert',
  EXPLORER = 'explorer',
  CAUTIOUS_NAVIGATOR = 'cautious_navigator',
  SOCIAL_NAVIGATOR = 'social_navigator',
  ADVENTUROUS = 'adventurous'
}

export class HumanNavigationClustering {
  private playerData: Map<string, PlayerNavigationData>;
  private clusters: NavigationCluster[];
  private featureVectors: Map<string, NavigationFeatureVector>;

  constructor() {
    this.playerData = new Map();
    this.clusters = [];
    this.featureVectors = new Map();
  }

  /**
   * Record player navigation path
   */
  public recordPath(playerId: string, path: NavigationPath): void {
    if (!this.playerData.has(playerId)) {
      this.playerData.set(playerId, {
        playerId,
        paths: [],
        timestamp: Date.now()
      });
    }

    const data = this.playerData.get(playerId)!;
    data.paths.push(path);

    // Keep only recent paths (last 100)
    if (data.paths.length > 100) {
      data.paths.shift();
    }

    // Update feature vector
    this.updateFeatureVector(playerId);
  }

  /**
   * Extract features from navigation paths
   */
  private extractFeatures(paths: NavigationPath[]): NavigationFeatureVector {
    if (paths.length === 0) {
      return this.getDefaultFeatureVector();
    }

    let totalEfficiency = 0;
    let totalExploration = 0;
    let totalRisk = 0;
    let totalSocial = 0;
    let totalSpeed = 0;
    let totalScenic = 0;
    let totalBacktracking = 0;
    let totalDetours = 0;

    for (const path of paths) {
      // Path efficiency (directness)
      const directDistance = this.distance(path.start, path.end);
      const actualDistance = this.calculatePathDistance(path.waypoints);
      const efficiency = directDistance / Math.max(actualDistance, 0.1);
      totalEfficiency += efficiency;

      // Exploration tendency (detours and exploration)
      const exploration = path.detours / Math.max(path.waypoints.length, 1);
      totalExploration += exploration;

      // Risk tolerance (would analyze terrain difficulty, enemy presence, etc.)
      totalRisk += 0.5; // Placeholder

      // Social preference (would analyze if path goes through populated areas)
      totalSocial += 0.5; // Placeholder

      // Speed preference (transport mode analysis)
      const speedPref = path.transportMode === 'running' || path.transportMode === 'vehicle' ? 1.0 : 0.5;
      totalSpeed += speedPref;

      // Scenic preference (would analyze if path goes through interesting terrain)
      totalScenic += 0.3; // Placeholder

      // Backtracking frequency
      totalBacktracking += path.backtracking / Math.max(path.waypoints.length, 1);

      // Detour frequency
      totalDetours += path.detours / Math.max(path.waypoints.length, 1);
    }

    const count = paths.length;

    return {
      pathEfficiency: totalEfficiency / count,
      explorationTendency: totalExploration / count,
      riskTolerance: totalRisk / count,
      socialPreference: totalSocial / count,
      speedPreference: totalSpeed / count,
      scenicPreference: totalScenic / count,
      backtrackingFrequency: totalBacktracking / count,
      detourFrequency: totalDetours / count
    };
  }

  /**
   * Update feature vector for player
   */
  private updateFeatureVector(playerId: string): void {
    const data = this.playerData.get(playerId);
    if (!data) return;

    const features = this.extractFeatures(data.paths);
    this.featureVectors.set(playerId, features);
  }

  /**
   * Cluster players by navigation style using K-means
   */
  public clusterNavigationStyles(k: number = 5): NavigationCluster[] {
    if (this.featureVectors.size < k) {
      return [];
    }

    const vectors = Array.from(this.featureVectors.entries());
    const featureArray = vectors.map(([playerId, features]) => ({
      playerId,
      features: this.featureVectorToArray(features)
    }));

    // Initialize centroids randomly
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * featureArray.length);
      centroids.push([...featureArray[randomIndex].features]);
    }

    let clusters: Map<number, string[]> = new Map();
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      // Assign points to nearest centroid
      clusters = new Map();
      for (let i = 0; i < k; i++) {
        clusters.set(i, []);
      }

      for (const { playerId, features } of featureArray) {
        let minDistance = Infinity;
        let nearestCluster = 0;

        for (let i = 0; i < k; i++) {
          const distance = this.euclideanDistance(features, centroids[i]);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = i;
          }
        }

        clusters.get(nearestCluster)!.push(playerId);
      }

      // Update centroids
      let converged = true;
      for (let i = 0; i < k; i++) {
        const members = clusters.get(i)!;
        if (members.length === 0) continue;

        const newCentroid = this.calculateCentroid(
          members.map(id => {
            const vector = this.featureVectors.get(id)!;
            return this.featureVectorToArray(vector);
          })
        );

        // Check convergence
        const oldCentroid = centroids[i];
        const distance = this.euclideanDistance(newCentroid, oldCentroid);
        if (distance > 0.01) {
          converged = false;
        }

        centroids[i] = newCentroid;
      }

      if (converged) break;
      iterations++;
    }

    // Create cluster objects
    this.clusters = [];
    for (let i = 0; i < k; i++) {
      const members = clusters.get(i) || [];
      if (members.length === 0) continue;

      const centroidFeatures = this.arrayToFeatureVector(centroids[i]);
      const style = this.identifyNavigationStyle(centroidFeatures);

      this.clusters.push({
        id: `cluster_${i}`,
        centroid: centroidFeatures,
        members,
        style,
        size: members.length
      });
    }

    return this.clusters;
  }

  /**
   * Identify navigation style from feature vector
   */
  private identifyNavigationStyle(features: NavigationFeatureVector): NavigationStyle {
    // Efficiency Expert: High efficiency, low exploration, low detours
    if (features.pathEfficiency > 0.8 && features.explorationTendency < 0.3 && features.detourFrequency < 0.2) {
      return NavigationStyle.EFFICIENCY_EXPERT;
    }

    // Explorer: Low efficiency, high exploration, high detours
    if (features.explorationTendency > 0.6 && features.detourFrequency > 0.5) {
      return NavigationStyle.EXPLORER;
    }

    // Cautious Navigator: Low risk tolerance, low speed preference
    if (features.riskTolerance < 0.3 && features.speedPreference < 0.4) {
      return NavigationStyle.CAUTIOUS_NAVIGATOR;
    }

    // Social Navigator: High social preference
    if (features.socialPreference > 0.7) {
      return NavigationStyle.SOCIAL_NAVIGATOR;
    }

    // Adventurous: High risk tolerance, high exploration
    if (features.riskTolerance > 0.7 && features.explorationTendency > 0.5) {
      return NavigationStyle.ADVENTUROUS;
    }

    // Default to efficiency expert
    return NavigationStyle.EFFICIENCY_EXPERT;
  }

  /**
   * Get navigation style for player
   */
  public getPlayerStyle(playerId: string): NavigationStyle | null {
    for (const cluster of this.clusters) {
      if (cluster.members.includes(playerId)) {
        return cluster.style;
      }
    }
    return null;
  }

  /**
   * Get feature vector for player
   */
  public getPlayerFeatures(playerId: string): NavigationFeatureVector | null {
    return this.featureVectors.get(playerId) || null;
  }

  /**
   * Train NPC to imitate player navigation style
   */
  public createImitationAgent(playerId: string): {
    style: NavigationStyle;
    features: NavigationFeatureVector;
    imitationStrategy: any;
  } | null {
    const style = this.getPlayerStyle(playerId);
    const features = this.getPlayerFeatures(playerId);

    if (!style || !features) {
      return null;
    }

    // Create imitation strategy based on style
    const imitationStrategy = this.createStrategyFromStyle(style, features);

    return {
      style,
      features,
      imitationStrategy
    };
  }

  /**
   * Create navigation strategy from style
   */
  private createStrategyFromStyle(
    style: NavigationStyle,
    features: NavigationFeatureVector
  ): any {
    switch (style) {
      case NavigationStyle.EFFICIENCY_EXPERT:
        return {
          priority: 'efficiency',
          allowDetours: false,
          riskTolerance: 0.1,
          pathStyle: 'direct'
        };

      case NavigationStyle.EXPLORER:
        return {
          priority: 'discovery',
          allowDetours: true,
          riskTolerance: 0.6,
          pathStyle: 'scenic'
        };

      case NavigationStyle.CAUTIOUS_NAVIGATOR:
        return {
          priority: 'safety',
          allowDetours: false,
          riskTolerance: 0.2,
          pathStyle: 'safe'
        };

      case NavigationStyle.SOCIAL_NAVIGATOR:
        return {
          priority: 'social',
          allowDetours: true,
          riskTolerance: 0.4,
          pathStyle: 'scenic',
          socialBehavior: 'prefer'
        };

      case NavigationStyle.ADVENTUROUS:
        return {
          priority: 'discovery',
          allowDetours: true,
          riskTolerance: 0.8,
          pathStyle: 'scenic'
        };

      default:
        return {
          priority: 'efficiency',
          allowDetours: false,
          riskTolerance: 0.5,
          pathStyle: 'direct'
        };
    }
  }

  /**
   * Helper methods
   */
  private featureVectorToArray(features: NavigationFeatureVector): number[] {
    return [
      features.pathEfficiency,
      features.explorationTendency,
      features.riskTolerance,
      features.socialPreference,
      features.speedPreference,
      features.scenicPreference,
      features.backtrackingFrequency,
      features.detourFrequency
    ];
  }

  private arrayToFeatureVector(array: number[]): NavigationFeatureVector {
    return {
      pathEfficiency: array[0],
      explorationTendency: array[1],
      riskTolerance: array[2],
      socialPreference: array[3],
      speedPreference: array[4],
      scenicPreference: array[5],
      backtrackingFrequency: array[6],
      detourFrequency: array[7]
    };
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  private calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];

    const dimensions = vectors[0].length;
    const centroid: number[] = [];

    for (let d = 0; d < dimensions; d++) {
      let sum = 0;
      for (const vector of vectors) {
        sum += vector[d];
      }
      centroid.push(sum / vectors.length);
    }

    return centroid;
  }

  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  private calculatePathDistance(waypoints: Array<{ x: number; y: number }>): number {
    let distance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      distance += this.distance(waypoints[i], waypoints[i + 1]);
    }
    return distance;
  }

  private getDefaultFeatureVector(): NavigationFeatureVector {
    return {
      pathEfficiency: 0.5,
      explorationTendency: 0.5,
      riskTolerance: 0.5,
      socialPreference: 0.5,
      speedPreference: 0.5,
      scenicPreference: 0.5,
      backtrackingFrequency: 0.5,
      detourFrequency: 0.5
    };
  }

  /**
   * Get cluster statistics
   */
  public getClusterStats(): Array<{
    style: NavigationStyle;
    size: number;
    avgFeatures: NavigationFeatureVector;
  }> {
    return this.clusters.map(cluster => ({
      style: cluster.style,
      size: cluster.size,
      avgFeatures: cluster.centroid
    }));
  }
}

