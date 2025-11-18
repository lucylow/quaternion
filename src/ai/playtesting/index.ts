/**
 * General Game-Playing AI for Testing & Balancing
 * 
 * This module provides automated playtesting capabilities using:
 * - Procedural Personas: Different player archetypes for diverse testing
 * - MCTS-based agents: General game-playing without prior specific knowledge
 * - Balance Detection: Automated identification of balance issues
 * - Exploit Detection: Adversarial testing for vulnerabilities
 * 
 * Based on research from:
 * - General Video Game AI (GVGAI) Framework
 * - Monte Carlo Tree Search (MCTS)
 * - Automated Playtesting with Procedural Personas
 */

export { ProceduralPersona, PersonaType, PersonaFactory, PersonaTraits } from './ProceduralPersona';
export { PlaytestingAgent, PlaytestResult, PlaytestMetrics, BalanceIssue, DifficultySpike } from './PlaytestingAgent';
export { BalanceDetector, BalanceReport, BalanceMetrics } from './BalanceDetector';
export { ExploitDetector, ExploitDetection } from './ExploitDetector';
export { PlaytestingCoordinator, PlaytestConfig, PlaytestSession, PlaytestSummary } from './PlaytestingCoordinator';

/**
 * Quick start example:
 * 
 * ```typescript
 * import { PlaytestingCoordinator, PersonaType } from './ai/playtesting';
 * 
 * const coordinator = new PlaytestingCoordinator();
 * 
 * const session = await coordinator.runPlaytestSession(
 *   (seed) => new QuaternionGameState({ seed, ... }),
 *   {
 *     personas: [PersonaType.EFFICIENCY_EXPERT, PersonaType.AGGRESSIVE_RUSHER],
 *     gamesPerPersona: 10,
 *     maxTicks: 5000
 *   }
 * );
 * 
 * const summary = coordinator.generateSummary(session);
 * console.log('Balance Status:', summary.balanceStatus);
 * console.log('Issues Found:', summary.criticalIssues + summary.highIssues);
 * console.log('Recommendations:', summary.recommendations);
 * ```
 */

