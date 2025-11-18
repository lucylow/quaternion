import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Brain, Zap, TrendingUp, Target, Shield, Sword } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  aggressiveness: number;
  defensiveness: number;
  expansionRate: number;
  reactionTime: number;
}

interface AIMetrics {
  winRate: number;
  averageResourcesPerMinute: number;
  unitsProduced: number;
  buildingsConstructed: number;
  strategicDecisions: number;
}

interface AIState {
  status: 'idle' | 'thinking' | 'executing' | 'attacking' | 'defending';
  currentStrategy: string;
  resourceAllocation: {
    military: number;
    economy: number;
    expansion: number;
  };
  threatLevel: number;
}

export const AIGameUIPanel: React.FC = () => {
  const [selectedAI, setSelectedAI] = useState<'opponent' | 'ally'>('opponent');
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    difficulty: 'medium',
    aggressiveness: 50,
    defensiveness: 50,
    expansionRate: 50,
    reactionTime: 1000,
  });

  const [aiState, setAiState] = useState<AIState>({
    status: 'idle',
    currentStrategy: 'Gathering resources',
    resourceAllocation: {
      military: 30,
      economy: 50,
      expansion: 20,
    },
    threatLevel: 35,
  });

  const [aiMetrics, setAiMetrics] = useState<AIMetrics>({
    winRate: 62,
    averageResourcesPerMinute: 145,
    unitsProduced: 0,
    buildingsConstructed: 0,
    strategicDecisions: 0,
  });

  // Simulate AI state changes
  useEffect(() => {
    const interval = setInterval(() => {
      setAiState(prev => ({
        ...prev,
        threatLevel: Math.max(0, Math.min(100, prev.threatLevel + (Math.random() - 0.5) * 20)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleDifficultyChange = (difficulty: string) => {
    const difficultyMap: Record<string, AIConfig['difficulty']> = {
      easy: 'easy',
      medium: 'medium',
      hard: 'hard',
    };

    const config = difficultyMap[difficulty] as AIConfig['difficulty'];
    setAiConfig(prev => ({
      ...prev,
      difficulty: config,
      aggressiveness: config === 'easy' ? 30 : config === 'medium' ? 50 : 80,
      defensiveness: config === 'easy' ? 70 : config === 'medium' ? 50 : 40,
      reactionTime: config === 'easy' ? 3000 : config === 'medium' ? 1500 : 500,
    }));
  };

  const handleSliderChange = (key: keyof Omit<AIConfig, 'difficulty' | 'reactionTime'>, value: number[]) => {
    setAiConfig(prev => ({
      ...prev,
      [key]: value[0],
    }));
  };

  const getThreatColor = (level: number) => {
    if (level < 33) return 'bg-green-500';
    if (level < 66) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: AIState['status']) => {
    switch (status) {
      case 'thinking':
        return <Brain className="w-4 h-4 animate-pulse" />;
      case 'attacking':
        return <Sword className="w-4 h-4 text-red-500" />;
      case 'defending':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'executing':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Game Management</h1>
          <p className="text-muted-foreground mt-2">Configure, monitor, and analyze AI opponent behavior</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Real-time Monitoring
        </Badge>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-1 space-y-4">
          {/* AI Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">AI Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={selectedAI === 'opponent' ? 'default' : 'outline'}
                  className="flex-1 text-sm"
                  onClick={() => setSelectedAI('opponent')}
                >
                  Opponent
                </Button>
                <Button
                  variant={selectedAI === 'ally' ? 'default' : 'outline'}
                  className="flex-1 text-sm"
                  onClick={() => setSelectedAI('ally')}
                >
                  Ally
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Difficulty Settings</CardTitle>
              <CardDescription>Adjust AI behavior parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                <Select value={aiConfig.difficulty} onValueChange={handleDifficultyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Aggressiveness</label>
                  <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                    {aiConfig.aggressiveness}%
                  </span>
                </div>
                <Slider
                  value={[aiConfig.aggressiveness]}
                  onValueChange={value => handleSliderChange('aggressiveness', value)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Defensiveness</label>
                  <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                    {aiConfig.defensiveness}%
                  </span>
                </div>
                <Slider
                  value={[aiConfig.defensiveness]}
                  onValueChange={value => handleSliderChange('defensiveness', value)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Expansion Rate</label>
                  <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                    {aiConfig.expansionRate}%
                  </span>
                </div>
                <Slider
                  value={[aiConfig.expansionRate]}
                  onValueChange={value => handleSliderChange('expansionRate', value)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm">
                <Zap className="w-4 h-4 mr-2" />
                Boost AI Processing
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Reset Statistics
              </Button>
              <Button variant="destructive" className="w-full justify-start text-sm">
                Disable AI
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Monitoring & Metrics */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Status Overview
              </CardTitle>
              <CardDescription>Current AI state and decision-making process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Current Status */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Current Status
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(aiState.status)}
                    <span className="capitalize font-semibold text-sm">{aiState.status}</span>
                  </div>
                </div>

                {/* Threat Level */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Threat Level
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{aiState.threatLevel.toFixed(0)}%</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          aiState.threatLevel < 33 ? 'bg-green-50' : aiState.threatLevel < 66 ? 'bg-yellow-50' : 'bg-red-50'
                        )}
                      >
                        {aiState.threatLevel < 33 ? 'Low' : aiState.threatLevel < 66 ? 'Medium' : 'High'}
                      </Badge>
                    </div>
                    <Progress value={aiState.threatLevel} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Current Strategy */}
              <div className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                  Current Strategy
                </div>
                <p className="text-sm font-medium">{aiState.currentStrategy}</p>
              </div>

              {/* Resource Allocation */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Resource Allocation
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium">Military</label>
                      <span className="text-xs font-mono">{aiState.resourceAllocation.military}%</span>
                    </div>
                    <Progress value={aiState.resourceAllocation.military} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium">Economy</label>
                      <span className="text-xs font-mono">{aiState.resourceAllocation.economy}%</span>
                    </div>
                    <Progress value={aiState.resourceAllocation.economy} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium">Expansion</label>
                      <span className="text-xs font-mono">{aiState.resourceAllocation.expansion}%</span>
                    </div>
                    <Progress value={aiState.resourceAllocation.expansion} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>AI statistics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard
                  label="Win Rate"
                  value={`${aiMetrics.winRate}%`}
                  trend="+2.5%"
                  positive
                />
                <MetricCard
                  label="Resources/min"
                  value={aiMetrics.averageResourcesPerMinute}
                  trend="+12"
                  positive
                />
                <MetricCard
                  label="Units Built"
                  value={aiMetrics.unitsProduced}
                  trend="+5"
                  positive
                />
                <MetricCard
                  label="Buildings"
                  value={aiMetrics.buildingsConstructed}
                  trend="+1"
                  positive
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advanced Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced AI Analysis</CardTitle>
          <CardDescription>Detailed insights into AI decision-making patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="decisions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="decisions">Strategic Decisions</TabsTrigger>
              <TabsTrigger value="behavior">Behavior Patterns</TabsTrigger>
              <TabsTrigger value="learning">Learning Curve</TabsTrigger>
            </TabsList>

            <TabsContent value="decisions" className="space-y-4">
              <div className="space-y-3">
                {[
                  { decision: 'Expand to sector 3', confidence: 92, timestamp: '2 seconds ago' },
                  { decision: 'Build 3 soldiers', confidence: 78, timestamp: '5 seconds ago' },
                  { decision: 'Defend main base', confidence: 85, timestamp: '8 seconds ago' },
                  { decision: 'Gather from mineral deposit', confidence: 88, timestamp: '12 seconds ago' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.decision}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.timestamp}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">{item.confidence}%</div>
                      <Progress value={item.confidence} className="w-24 h-1 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  AI has adopted an aggressive expansion strategy with 80% confidence. Military pressure increasing.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-4">
                <BehaviorCard label="Expansion Tendency" value="70%" />
                <BehaviorCard label="Combat Aggression" value="65%" />
                <BehaviorCard label="Economic Focus" value="85%" />
                <BehaviorCard label="Defensive Posture" value="45%" />
              </div>
            </TabsContent>

            <TabsContent value="learning" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Overall Learning Progress</label>
                    <span className="text-xs font-mono">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Strategy Refinement</label>
                    <span className="text-xs font-mono">54%</span>
                  </div>
                  <Progress value={54} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Counter-Strategy Recognition</label>
                    <span className="text-xs font-mono">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  positive?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, positive }) => (
  <div className="border rounded-lg p-3 space-y-2">
    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
    <div className="flex items-end justify-between">
      <span className="text-2xl font-bold">{value}</span>
      {trend && (
        <span className={cn('text-xs font-medium', positive ? 'text-green-600' : 'text-red-600')}>
          {trend}
        </span>
      )}
    </div>
  </div>
);

interface BehaviorCardProps {
  label: string;
  value: string;
}

const BehaviorCard: React.FC<BehaviorCardProps> = ({ label, value }) => (
  <div className="border rounded-lg p-3">
    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">{label}</p>
    <div className="flex items-center justify-between">
      <div className="text-lg font-bold">{value}</div>
      <Progress value={parseInt(value)} className="w-20 h-2" />
    </div>
  </div>
);

export default AIGameUIPanel;