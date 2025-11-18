/**
 * Playtest Dashboard Component
 * 
 * React component for visualizing playtest results, balance reports, and recommendations.
 * Provides a UI for developers to review automated playtesting results.
 */

import React from 'react';
import { PlaytestSession, PlaytestSummary } from './PlaytestingCoordinator';
import { BalanceReport } from './BalanceDetector';
import { ExploitDetection } from './ExploitDetector';

interface PlaytestDashboardProps {
  session: PlaytestSession;
  summary: PlaytestSummary;
}

export const PlaytestDashboard: React.FC<PlaytestDashboardProps> = ({ session, summary }) => {
  const balanceReport = session.balanceReport;
  const exploits = session.exploitDetections;

  return (
    <div className="playtest-dashboard p-6 space-y-6">
      <h1 className="text-3xl font-bold">Playtest Results</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          title="Total Games"
          value={summary.totalGames}
          color="blue"
        />
        <SummaryCard
          title="Balance Status"
          value={summary.balanceStatus.replace('_', ' ').toUpperCase()}
          color={getBalanceColor(summary.balanceStatus)}
        />
        <SummaryCard
          title="Critical Issues"
          value={summary.criticalIssues}
          color="red"
        />
        <SummaryCard
          title="Exploits Found"
          value={summary.exploitsFound}
          color="orange"
        />
      </div>

      {/* Balance Report */}
      {balanceReport && (
        <BalanceReportSection report={balanceReport} />
      )}

      {/* Exploit Detections */}
      {exploits.length > 0 && (
        <ExploitSection exploits={exploits} />
      )}

      {/* Recommendations */}
      {balanceReport && balanceReport.recommendations.length > 0 && (
        <RecommendationsSection recommendations={balanceReport.recommendations} />
      )}

      {/* Metrics */}
      <MetricsSection session={session} />
    </div>
  );
};

const SummaryCard: React.FC<{ title: string; value: string | number; color: string }> = ({ 
  title, 
  value, 
  color 
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color] || 'bg-gray-100'}`}>
      <div className="text-sm font-medium opacity-75">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

const BalanceReportSection: React.FC<{ report: BalanceReport }> = ({ report }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Balance Analysis</h2>
      
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          report.overallBalance === 'balanced' ? 'bg-green-100 text-green-800' :
          report.overallBalance === 'slightly_imbalanced' ? 'bg-yellow-100 text-yellow-800' :
          report.overallBalance === 'imbalanced' ? 'bg-orange-100 text-orange-800' :
          'bg-red-100 text-red-800'
        }`}>
          {report.overallBalance.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {report.issues.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Issues Found</h3>
          {report.issues.map((issue, idx) => (
            <div key={idx} className={`p-3 rounded border-l-4 ${
              issue.severity === 'critical' ? 'border-red-500 bg-red-50' :
              issue.severity === 'high' ? 'border-orange-500 bg-orange-50' :
              issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-gray-500 bg-gray-50'
            }`}>
              <div className="font-medium">{issue.description}</div>
              <div className="text-sm text-gray-600 mt-1">
                Type: {issue.type.replace('_', ' ')} | Severity: {issue.severity}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Win Rates Table */}
      {report.metrics.winRates.size > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Win Rates by Strategy</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Strategy</th>
                <th className="border p-2 text-right">Win Rate</th>
                <th className="border p-2 text-right">Pick Rate</th>
                <th className="border p-2 text-right">Dominance</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(report.metrics.winRates.entries()).map(([strategy, winRate]) => (
                <tr key={strategy}>
                  <td className="border p-2">{strategy}</td>
                  <td className="border p-2 text-right">
                    <span className={winRate > 0.55 || winRate < 0.45 ? 'text-red-600 font-bold' : ''}>
                      {(winRate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="border p-2 text-right">
                    {(report.metrics.pickRates.get(strategy) || 0 * 100).toFixed(1)}%
                  </td>
                  <td className="border p-2 text-right">
                    {(report.metrics.strategyDominance.get(strategy) || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ExploitSection: React.FC<{ exploits: ExploitDetection[] }> = ({ exploits }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Exploit Detections</h2>
      
      <div className="space-y-3">
        {exploits.map((exploit, idx) => (
          <div key={idx} className={`p-4 rounded border-l-4 ${
            exploit.severity === 'critical' ? 'border-red-500 bg-red-50' :
            exploit.severity === 'high' ? 'border-orange-500 bg-orange-50' :
            exploit.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
            'border-gray-500 bg-gray-50'
          }`}>
            <div className="font-medium">{exploit.description}</div>
            <div className="text-sm text-gray-600 mt-1">
              Type: {exploit.exploitType.replace('_', ' ')} | Severity: {exploit.severity}
            </div>
            {exploit.tick && (
              <div className="text-xs text-gray-500 mt-1">Detected at tick {exploit.tick}</div>
            )}
            {exploit.reproductionSteps && exploit.reproductionSteps.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium">Reproduction Steps:</div>
                <ol className="list-decimal list-inside text-xs text-gray-600">
                  {exploit.reproductionSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const RecommendationsSection: React.FC<{ recommendations: string[] }> = ({ recommendations }) => {
  return (
    <div className="bg-blue-50 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
      <ul className="list-disc list-inside space-y-2">
        {recommendations.map((rec, idx) => (
          <li key={idx} className="text-gray-700">{rec}</li>
        ))}
      </ul>
    </div>
  );
};

const MetricsSection: React.FC<{ session: PlaytestSession }> = ({ session }) => {
  const avgDuration = session.results.length > 0
    ? session.results.reduce((sum, r) => sum + r.duration, 0) / session.results.length
    : 0;

  const outcomes = {
    win: session.results.filter(r => r.outcome === 'win').length,
    loss: session.results.filter(r => r.outcome === 'loss').length,
    draw: session.results.filter(r => r.outcome === 'draw').length,
    timeout: session.results.filter(r => r.outcome === 'timeout').length
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Session Metrics</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600">Average Game Duration</div>
          <div className="text-2xl font-bold">{avgDuration.toFixed(0)} ticks</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Session Time</div>
          <div className="text-2xl font-bold">
            {session.endTime 
              ? `${((session.endTime - session.startTime) / 1000).toFixed(1)}s`
              : 'Running...'
            }
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-2">Outcomes</div>
        <div className="flex gap-4">
          <div className="text-green-600">Wins: {outcomes.win}</div>
          <div className="text-red-600">Losses: {outcomes.loss}</div>
          <div className="text-gray-600">Draws: {outcomes.draw}</div>
          <div className="text-yellow-600">Timeouts: {outcomes.timeout}</div>
        </div>
      </div>
    </div>
  );
};

function getBalanceColor(balance: string): string {
  switch (balance) {
    case 'balanced': return 'green';
    case 'slightly_imbalanced': return 'yellow';
    case 'imbalanced': return 'orange';
    case 'severely_imbalanced': return 'red';
    default: return 'gray';
  }
}


