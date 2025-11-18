/**
 * Automated Balance Detection System
 * 
 * Detects game balance issues including:
 * - Win rate imbalances (strategies with >55% or <45% win rate)
 * - Pickrate vs Winrate coupling (high pickrate + high winrate = imbalance)
 * - Difficulty curve spikes (violations of smooth progression)
 * - Resource imbalances
 * - Unit/build strategy dominance
 * 
 * Based on research from:
 * - Jaffe et al., "Evaluating Competitive Game Balance with Restricted Play"
 * - Politowski et al., "Assessing Video Game Balance using Autonomous Agents"
 */

import { PlaytestResult, BalanceIssue, DifficultySpike } from './PlaytestingAgent';
import { PersonaType } from './ProceduralPersona';

export interface BalanceMetrics {
  winRates: Map<string, number>; // Strategy/unit -> win rate
  pickRates: Map<string, number>;  // Strategy/unit -> pick rate
  averageGameDuration: number;
  difficultyCurve: DifficultyPoint[];
  resourceEfficiency: Map<string, number>;
  strategyDominance: Map<string, number>;
}

export interface DifficultyPoint {
  tick: number;
  difficulty: number;
  expectedDifficulty: number;
  deviation: number; // Standard deviations from expected
}

export interface BalanceReport {
  overallBalance: 'balanced' | 'slightly_imbalanced' | 'imbalanced' | 'severely_imbalanced';
  issues: BalanceIssue[];
  metrics: BalanceMetrics;
  recommendations: string[];
}

/**
 * Balance Detection System
 */
export class BalanceDetector {
  private playtestResults: PlaytestResult[] = [];
  private strategyStats: Map<string, StrategyStats> = new Map();

  /**
   * Add playtest results for analysis
   */
  addPlaytestResults(results: PlaytestResult[]): void {
    this.playtestResults.push(...results);
    this.updateStrategyStats(results);
  }

  /**
   * Analyze balance and generate report
   */
  analyzeBalance(): BalanceReport {
    const metrics = this.calculateMetrics();
    const issues = this.detectIssues(metrics);
    const overallBalance = this.assessOverallBalance(issues, metrics);
    const recommendations = this.generateRecommendations(issues, metrics);

    return {
      overallBalance,
      issues,
      metrics,
      recommendations
    };
  }

  /**
   * Calculate balance metrics from playtest results
   */
  private calculateMetrics(): BalanceMetrics {
    const winRates = new Map<string, number>();
    const pickRates = new Map<string, number>();
    const resourceEfficiency = new Map<string, number>();
    const strategyDominance = new Map<string, number>();
    const difficultyCurve: DifficultyPoint[] = [];
    
    let totalDuration = 0;
    let gameCount = 0;

    // Aggregate statistics by strategy/unit type
    const strategyWins = new Map<string, number>();
    const strategyGames = new Map<string, number>();
    const strategyPicks = new Map<string, number>();
    const resourceEfficiencySum = new Map<string, number>();
    const resourceEfficiencyCount = new Map<string, number>();

    // Collect all difficulty spikes
    const difficultySpikesByTick = new Map<number, number[]>();

    for (const result of this.playtestResults) {
      gameCount++;
      totalDuration += result.duration;

      // Analyze strategy used (based on persona and actions)
      const strategy = this.identifyStrategy(result);
      strategyGames.set(strategy, (strategyGames.get(strategy) || 0) + 1);
      strategyPicks.set(strategy, (strategyPicks.get(strategy) || 0) + 1);
      
      if (result.outcome === 'win') {
        strategyWins.set(strategy, (strategyWins.get(strategy) || 0) + 1);
      }

      // Resource efficiency
      const efficiency = result.metrics.averageResourceEfficiency || 0;
      resourceEfficiencySum.set(strategy, (resourceEfficiencySum.get(strategy) || 0) + efficiency);
      resourceEfficiencyCount.set(strategy, (resourceEfficiencyCount.get(strategy) || 0) + 1);

      // Collect difficulty spikes
      for (const spike of result.metrics.difficultySpikes) {
        if (!difficultySpikesByTick.has(spike.tick)) {
          difficultySpikesByTick.set(spike.tick, []);
        }
        difficultySpikesByTick.get(spike.tick)!.push(spike.severity);
      }
    }

    // Calculate win rates
    for (const [strategy, games] of strategyGames.entries()) {
      const wins = strategyWins.get(strategy) || 0;
      winRates.set(strategy, wins / games);
    }

    // Calculate pick rates
    const totalPicks = Array.from(strategyPicks.values()).reduce((a, b) => a + b, 0);
    for (const [strategy, picks] of strategyPicks.entries()) {
      pickRates.set(strategy, picks / totalPicks);
    }

    // Calculate resource efficiency
    for (const [strategy, sum] of resourceEfficiencySum.entries()) {
      const count = resourceEfficiencyCount.get(strategy) || 1;
      resourceEfficiency.set(strategy, sum / count);
    }

    // Calculate strategy dominance (win rate * pick rate)
    for (const [strategy, winRate] of winRates.entries()) {
      const pickRate = pickRates.get(strategy) || 0;
      strategyDominance.set(strategy, winRate * pickRate);
    }

    // Build difficulty curve
    const maxTick = Math.max(...this.playtestResults.map(r => r.duration), 0);
    const expectedDifficulty = this.calculateExpectedDifficulty(maxTick);
    
    for (const [tick, severities] of difficultySpikesByTick.entries()) {
      const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
      const expected = expectedDifficulty(tick);
      const deviation = this.calculateDeviation(avgSeverity, expected, severities);
      
      difficultyCurve.push({
        tick,
        difficulty: avgSeverity,
        expectedDifficulty: expected,
        deviation
      });
    }

    return {
      winRates,
      pickRates,
      averageGameDuration: totalDuration / Math.max(1, gameCount),
      difficultyCurve,
      resourceEfficiency,
      strategyDominance
    };
  }

  /**
   * Identify strategy from playtest result
   */
  private identifyStrategy(result: PlaytestResult): string {
    // Use persona type as base strategy
    let strategy = result.personaType;

    // Refine based on actions
    const actionTypes = result.actions.map(a => a.action.type);
    const hasRush = actionTypes.some(a => a === 'army_action' && a.action === 'attack') && 
                    result.duration < 2000; // Early attack
    const hasTurtle = actionTypes.filter(a => a === 'army_action' && a.action === 'defend').length > 5;
    const hasTech = actionTypes.some(a => a === 'research');
    const hasExpand = actionTypes.some(a => a === 'build_building' && a.action.buildingType === 'BASE');

    if (hasRush) strategy = `${strategy}_rush` as PersonaType;
    if (hasTurtle) strategy = `${strategy}_turtle` as PersonaType;
    if (hasTech) strategy = `${strategy}_tech` as PersonaType;
    if (hasExpand) strategy = `${strategy}_expand` as PersonaType;

    return strategy;
  }

  /**
   * Calculate expected difficulty at a given tick (smooth progression)
   */
  private calculateExpectedDifficulty(maxTick: number): (tick: number) => number {
    // Expected difficulty follows a smooth curve: starts low, increases gradually
    return (tick: number) => {
      // Normalize tick to 0-1
      const progress = Math.min(1, tick / maxTick);
      // Smooth S-curve: slow start, acceleration in middle, plateau at end
      return 0.2 + (progress * progress * 0.6) + (progress * 0.2);
    };
  }

  /**
   * Calculate standard deviation from expected
   */
  private calculateDeviation(actual: number, expected: number, values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    return Math.abs(actual - expected) / stdDev;
  }

  /**
   * Detect balance issues
   */
  private detectIssues(metrics: BalanceMetrics): BalanceIssue[] {
    const issues: BalanceIssue[] = [];

    // 1. Win rate imbalances
    for (const [strategy, winRate] of metrics.winRates.entries()) {
      if (winRate > 0.55) {
        issues.push({
          type: 'imbalance',
          severity: winRate > 0.65 ? 'critical' : (winRate > 0.60 ? 'high' : 'medium'),
          description: `Strategy "${strategy}" has ${(winRate * 100).toFixed(1)}% win rate (target: 45-55%)`,
          evidence: {
            strategy,
            winRate,
            threshold: 0.55
          }
        });
      } else if (winRate < 0.45 && metrics.pickRates.get(strategy)! > 0.1) {
        // Only flag if it's actually being used
        issues.push({
          type: 'imbalance',
          severity: winRate < 0.35 ? 'high' : 'medium',
          description: `Strategy "${strategy}" has ${(winRate * 100).toFixed(1)}% win rate (underpowered)`,
          evidence: {
            strategy,
            winRate,
            threshold: 0.45
          }
        });
      }
    }

    // 2. Pickrate vs Winrate coupling
    for (const [strategy, pickRate] of metrics.pickRates.entries()) {
      const winRate = metrics.winRates.get(strategy) || 0;
      const dominance = metrics.strategyDominance.get(strategy) || 0;

      // High pickrate + high winrate = dominant strategy
      if (pickRate > 0.5 && winRate > 0.55) {
        issues.push({
          type: 'imbalance',
          severity: dominance > 0.4 ? 'critical' : 'high',
          description: `Strategy "${strategy}" is dominant: ${(pickRate * 100).toFixed(0)}% pick rate, ${(winRate * 100).toFixed(1)}% win rate`,
          evidence: {
            strategy,
            pickRate,
            winRate,
            dominance
          }
        });
      }
    }

    // 3. Difficulty spikes
    for (const point of metrics.difficultyCurve) {
      if (point.deviation > 2.0) {
        issues.push({
          type: 'difficulty_spike',
          severity: point.deviation > 3.0 ? 'high' : 'medium',
          description: `Difficulty spike at tick ${point.tick}: ${point.deviation.toFixed(1)} standard deviations above expected`,
          tick: point.tick,
          evidence: {
            tick: point.tick,
            difficulty: point.difficulty,
            expected: point.expectedDifficulty,
            deviation: point.deviation
          }
        });
      }
    }

    // 4. Resource efficiency imbalances
    const efficiencyValues = Array.from(metrics.resourceEfficiency.values());
    if (efficiencyValues.length > 1) {
      const avgEfficiency = efficiencyValues.reduce((a, b) => a + b, 0) / efficiencyValues.length;
      const maxEfficiency = Math.max(...efficiencyValues);
      const minEfficiency = Math.min(...efficiencyValues);

      if (maxEfficiency / minEfficiency > 2.0) {
        issues.push({
          type: 'imbalance',
          severity: 'medium',
          description: `Resource efficiency varies significantly: ${minEfficiency.toFixed(2)} to ${maxEfficiency.toFixed(2)}`,
          evidence: {
            minEfficiency,
            maxEfficiency,
            ratio: maxEfficiency / minEfficiency
          }
        });
      }
    }

    // 5. Unwinnable or trivial games
    const winCount = this.playtestResults.filter(r => r.outcome === 'win').length;
    const lossCount = this.playtestResults.filter(r => r.outcome === 'loss').length;
    const totalGames = this.playtestResults.length;

    if (totalGames > 0) {
      const winRate = winCount / totalGames;
      if (winRate < 0.05) {
        issues.push({
          type: 'unwinnable',
          severity: 'critical',
          description: `Game appears unwinnable: only ${(winRate * 100).toFixed(1)}% win rate across all personas`,
          evidence: { winRate, totalGames }
        });
      } else if (winRate > 0.95) {
        issues.push({
          type: 'trivial',
          severity: 'high',
          description: `Game appears too easy: ${(winRate * 100).toFixed(1)}% win rate across all personas`,
          evidence: { winRate, totalGames }
        });
      }
    }

    return issues;
  }

  /**
   * Assess overall balance
   */
  private assessOverallBalance(issues: BalanceIssue[], metrics: BalanceMetrics): BalanceReport['overallBalance'] {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    if (criticalIssues > 0) return 'severely_imbalanced';
    if (highIssues >= 3) return 'imbalanced';
    if (highIssues > 0 || mediumIssues >= 5) return 'slightly_imbalanced';
    return 'balanced';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(issues: BalanceIssue[], metrics: BalanceMetrics): string[] {
    const recommendations: string[] = [];

    // Win rate issues
    const winRateIssues = issues.filter(i => i.type === 'imbalance' && i.evidence.winRate);
    for (const issue of winRateIssues) {
      if (issue.evidence.winRate > 0.55) {
        recommendations.push(`Nerf strategy "${issue.evidence.strategy}": reduce effectiveness or increase cost`);
      } else {
        recommendations.push(`Buff strategy "${issue.evidence.strategy}": increase effectiveness or reduce cost`);
      }
    }

    // Difficulty spikes
    const spikeIssues = issues.filter(i => i.type === 'difficulty_spike');
    if (spikeIssues.length > 0) {
      recommendations.push(`Smooth difficulty curve: ${spikeIssues.length} significant spikes detected`);
    }

    // Resource efficiency
    const efficiencyValues = Array.from(metrics.resourceEfficiency.values());
    if (efficiencyValues.length > 1) {
      const variance = this.calculateVariance(efficiencyValues);
      if (variance > 0.1) {
        recommendations.push('Balance resource generation rates across different strategies');
      }
    }

    // Overall recommendations
    if (recommendations.length === 0) {
      recommendations.push('Game balance appears healthy. Continue monitoring with more playtests.');
    }

    return recommendations;
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Update strategy statistics
   */
  private updateStrategyStats(results: PlaytestResult[]): void {
    for (const result of results) {
      const strategy = this.identifyStrategy(result);
      
      if (!this.strategyStats.has(strategy)) {
        this.strategyStats.set(strategy, {
          games: 0,
          wins: 0,
          totalDuration: 0,
          averageScore: 0
        });
      }

      const stats = this.strategyStats.get(strategy)!;
      stats.games++;
      if (result.outcome === 'win') stats.wins++;
      stats.totalDuration += result.duration;
      stats.averageScore = (stats.averageScore * (stats.games - 1) + result.finalScore) / stats.games;
    }
  }
}

interface StrategyStats {
  games: number;
  wins: number;
  totalDuration: number;
  averageScore: number;
}

