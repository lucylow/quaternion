/**
 * Example Usage of Playtesting System
 * 
 * This file demonstrates how to use the automated playtesting system
 * to test game balance and detect exploits.
 */

import { 
  PlaytestingCoordinator, 
  PersonaType,
  PlaytestingAgent,
  BalanceDetector,
  ExploitDetector
} from './index';
import { QuaternionGameState } from '../../game/QuaternionGameState';

/**
 * Example 1: Run a full playtesting session
 */
export async function exampleFullPlaytest() {
  const coordinator = new PlaytestingCoordinator();

  // Run playtest with multiple personas
  const session = await coordinator.runPlaytestSession(
    (seed) => {
      return new QuaternionGameState({
        seed,
        mapWidth: 64,
        mapHeight: 64,
        aiDifficulty: 'medium',
        commanderId: 'AUREN'
      });
    },
    {
      personas: [
        PersonaType.EFFICIENCY_EXPERT,
        PersonaType.AGGRESSIVE_RUSHER,
        PersonaType.DEFENSIVE_TURTLER,
        PersonaType.TECH_FOCUSED
      ],
      gamesPerPersona: 5,
      maxTicks: 5000,
      parallel: false // Set to true for faster testing
    }
  );

  // Generate summary
  const summary = coordinator.generateSummary(session);

  console.log('=== Playtest Summary ===');
  console.log(`Total Games: ${summary.totalGames}`);
  console.log(`Balance Status: ${summary.balanceStatus}`);
  console.log(`Critical Issues: ${summary.criticalIssues}`);
  console.log(`High Issues: ${summary.highIssues}`);
  console.log(`Exploits Found: ${summary.exploitsFound}`);
  console.log('\nRecommendations:');
  summary.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });

  return session;
}

/**
 * Example 2: Test a specific game configuration
 */
export async function exampleSpecificConfig() {
  const coordinator = new PlaytestingCoordinator();

  // Test with all personas to get comprehensive coverage
  const session = await coordinator.runPlaytestSession(
    (seed) => {
      return new QuaternionGameState({
        seed,
        mapWidth: 40,
        mapHeight: 40,
        aiDifficulty: 'hard',
        commanderId: 'VIREL'
      });
    },
    {
      personas: Object.values(PersonaType), // All personas
      gamesPerPersona: 3,
      maxTicks: 3000
    }
  );

  // Analyze balance
  if (session.balanceReport) {
    console.log('\n=== Balance Report ===');
    console.log(`Overall Balance: ${session.balanceReport.overallBalance}`);
    console.log(`Issues Found: ${session.balanceReport.issues.length}`);
    
    // Show win rates
    console.log('\nWin Rates:');
    for (const [strategy, winRate] of session.balanceReport.metrics.winRates.entries()) {
      const pickRate = session.balanceReport.metrics.pickRates.get(strategy) || 0;
      console.log(`  ${strategy}: ${(winRate * 100).toFixed(1)}% win rate, ${(pickRate * 100).toFixed(1)}% pick rate`);
    }
  }

  // Show exploits
  if (session.exploitDetections.length > 0) {
    console.log('\n=== Exploits Detected ===');
    session.exploitDetections.forEach((exploit, i) => {
      console.log(`${i + 1}. [${exploit.severity.toUpperCase()}] ${exploit.description}`);
    });
  }

  return session;
}

/**
 * Example 3: Use individual agent for custom testing
 */
export function exampleIndividualAgent() {
  // Create agent with specific persona
  const agent = new PlaytestingAgent(PersonaType.EXPLORER, 2);

  // Simulate game loop
  const gameState = new QuaternionGameState({
    seed: 12345,
    mapWidth: 64,
    mapHeight: 64,
    aiDifficulty: 'medium'
  });

  // Run for a few ticks
  for (let tick = 0; tick < 100; tick++) {
    gameState.tick++;
    
    // Update agent
    agent.update(gameState);

    // Get action
    const action = agent.getBestAction();
    if (action) {
      console.log(`Tick ${tick}: ${action.type} - ${JSON.stringify(action)}`);
      // Execute action in game...
    }

    // Simulate game update
    // gameState.update();
  }

  // Get result
  const result = agent.getPlaytestResult('timeout', 0);
  console.log('\n=== Agent Result ===');
  console.log(`Persona: ${agent.getPersona().name}`);
  console.log(`Actions Taken: ${result.actions.length}`);
  console.log(`Final Score: ${result.finalScore}`);
}

/**
 * Example 4: Analyze existing playtest results
 */
export function exampleAnalyzeResults(results: any[]) {
  // Balance analysis
  const balanceDetector = new BalanceDetector();
  balanceDetector.addPlaytestResults(results);
  const balanceReport = balanceDetector.analyzeBalance();

  console.log('=== Balance Analysis ===');
  console.log(`Overall: ${balanceReport.overallBalance}`);
  console.log(`Issues: ${balanceReport.issues.length}`);
  
  balanceReport.issues.forEach((issue, i) => {
    console.log(`\n${i + 1}. [${issue.severity}] ${issue.description}`);
  });

  // Exploit detection
  const exploitDetector = new ExploitDetector();
  const exploits = exploitDetector.analyzeForExploits(results);

  console.log('\n=== Exploit Detection ===');
  console.log(`Exploits Found: ${exploits.length}`);
  
  exploits.forEach((exploit, i) => {
    console.log(`\n${i + 1}. [${exploit.severity}] ${exploit.description}`);
    if (exploit.reproductionSteps) {
      console.log('   Reproduction:');
      exploit.reproductionSteps.forEach((step, j) => {
        console.log(`     ${j + 1}. ${step}`);
      });
    }
  });
}

/**
 * Example 5: Quick balance check
 */
export async function exampleQuickBalanceCheck() {
  const coordinator = new PlaytestingCoordinator();

  // Quick test with 2 personas, 3 games each
  const session = await coordinator.runPlaytestSession(
    (seed) => new QuaternionGameState({
      seed,
      mapWidth: 64,
      mapHeight: 64,
      aiDifficulty: 'medium'
    }),
    {
      personas: [PersonaType.EFFICIENCY_EXPERT, PersonaType.AGGRESSIVE_RUSHER],
      gamesPerPersona: 3,
      maxTicks: 2000,
      parallel: true
    }
  );

  const summary = coordinator.generateSummary(session);

  // Quick assessment
  if (summary.criticalIssues > 0) {
    console.log('⚠️  CRITICAL: Game has critical balance issues!');
  } else if (summary.highIssues > 0) {
    console.log('⚠️  WARNING: Game has high-priority balance issues');
  } else if (summary.balanceStatus === 'balanced') {
    console.log('✅ Game balance appears healthy');
  } else {
    console.log('⚠️  Game has minor balance issues');
  }

  return summary;
}

// Run examples (uncomment to test)
// exampleFullPlaytest().catch(console.error);
// exampleSpecificConfig().catch(console.error);
// exampleIndividualAgent();
// exampleQuickBalanceCheck().catch(console.error);

