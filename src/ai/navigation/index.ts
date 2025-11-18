/**
 * Open-World AI Navigation & Interaction System
 * Comprehensive navigation system for intelligent NPCs in open worlds
 */

export { HierarchicalPathfinding } from './HierarchicalPathfinding';
export type {
  ChunkCoord,
  Cluster,
  AbstractNode,
  ClusterConnection,
  MacroPath,
  DetailedPath
} from './HierarchicalPathfinding';

export { RLNavigationAgent } from './RLNavigationAgent';
export type {
  NavigationState,
  DynamicObstacle,
  NavigationMemory,
  NavigationAction,
  NavigationExperience
} from './RLNavigationAgent';
export { UrgencyLevel } from './RLNavigationAgent';

export { ContextAwareNavigation } from './ContextAwareNavigation';
export type {
  NavigationContext,
  SocialConstraints,
  EnvironmentalFactors,
  HistoricalPattern,
  AgentCapabilities,
  NavigationStrategy,
  NavigationRequest,
  NavigationPlan
} from './ContextAwareNavigation';
export { NavigationPurpose, TransportMode } from './ContextAwareNavigation';

export { HumanNavigationClustering } from './HumanNavigationClustering';
export type {
  PlayerNavigationData,
  NavigationPath,
  NavigationFeatureVector,
  NavigationCluster
} from './HumanNavigationClustering';
export { NavigationStyle } from './HumanNavigationClustering';

export { MultiModalTransport } from './MultiModalTransport';
export type {
  TransportOption,
  TransportDecision,
  DecisionFactors,
  TransportRequirements
} from './MultiModalTransport';

export { DynamicWorldAdaptation } from './DynamicWorldAdaptation';
export type {
  WorldChange,
  RouteDiscovery,
  RouteDiscoveryMethod
} from './DynamicWorldAdaptation';
export { WorldChangeType } from './DynamicWorldAdaptation';

export { OpenWorldNavigationManager } from './OpenWorldNavigationManager';
export type {
  NavigationConfig,
  NavigationResult
} from './OpenWorldNavigationManager';

