import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Brain, Zap, TrendingUp, Target, Shield, Sword, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIGame } from './useAIGame';
import type { CommanderArchetype } from '@/ai/opponents/AICommanderArchetypes';

interface AIConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  aggressiveness: number;
  defensiveness: number;
  expansionRate: number;
  reactionTime: number;
  commanderArchetype?: CommanderArchetype;
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
  commanderProfile?: {
    archetype: string;
    description: string;
    difficulty: string;
    traits: {
      aggression: number;
      caution: number;
      adaptability: number;
      innovation: number;
      ruthlessness: number;
      predictability: number;
    };
  };
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

  // Connect to real AI game hook
  const { gameState, aiAnalytics, isGameActive, initializeGame } = useAIGame({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    pollInterval: 100,
    analyticsPollInterval: 2000,
  });

  // Update commander profile from analytics
  useEffect(() => {
    if (aiAnalytics?.commanderProfile) {
      setAiState(prev => ({
        ...prev,
        commanderProfile: aiAnalytics.commanderProfile,
      }));
    }
  }, [aiAnalytics]);

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

  // Update AI state from real analytics
  useEffect(() => {
    if (aiAnalytics) {
      // Update threat level from analytics
      setAiState(prev => ({
        ...prev,
        threatLevel: aiAnalytics.threatLevel * 100,
        currentStrategy: aiAnalytics.decisions[0]?.reasoning || prev.currentStrategy,
      }));

      // Update metrics
      setAiMetrics(prev => ({
        ...prev,
        strategicDecisions: aiAnalytics.decisions.length,
      }));
    }
  }, [aiAnalytics]);

  // Update AI state from game state
  useEffect(() => {
    if (gameState && gameState.players) {
      const aiPlayer = gameState.players.find(p => p.playerId === 2);
      if (aiPlayer) {
        // Calculate resource efficiency
        const totalResources = aiPlayer.minerals + aiPlayer.gas;
        const timeMinutes = gameState.tick / 3600; // Assuming 60 ticks per second
        const resourcesPerMin = timeMinutes > 0 ? totalResources / timeMinutes : 0;

        setAiMetrics(prev => ({
          ...prev,
          averageResourcesPerMinute: Math.round(resourcesPerMin),
          unitsProduced: aiPlayer.units.length,
          buildingsConstructed: aiPlayer.buildings.length,
        }));

        // Determine AI status from game state
        const aiUnits = gameState.units.filter(u => u.playerId === 2);
        const attackingUnits = aiUnits.filter(u => u.status === 'attacking');
        const movingUnits = aiUnits.filter(u => u.status === 'moving');

        let status: AIState['status'] = 'idle';
        if (attackingUnits.length > 0) {
          status = 'attacking';
        } else if (movingUnits.length > 0) {
          status = 'executing';
        } else if (aiUnits.length > 0) {
          status = 'thinking';
        }

        setAiState(prev => ({
          ...prev,
          status,
        }));
      }
    }
  }, [gameState]);

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
          {/* AI Selection & Commander */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">AI Commander</CardTitle>
              <CardDescription>Select AI opponent type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              
              {/* Commander Archetype Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Commander Archetype</label>
                <Select 
                  value={aiConfig.commanderArchetype || 'THE_TACTICIAN'} 
                  onValueChange={(value) => setAiConfig(prev => ({ ...prev, commanderArchetype: value as CommanderArchetype }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THE_INNOVATOR">The Innovator</SelectItem>
                    <SelectItem value="THE_BUTCHER">The Butcher</SelectItem>
                    <SelectItem value="THE_SPIDER">The Spider</SelectItem>
                    <SelectItem value="THE_MIRROR">The Mirror</SelectItem>
                    <SelectItem value="THE_TACTICIAN">The Tactician</SelectItem>
                    <SelectItem value="THE_ECONOMIST">The Economist</SelectItem>
                    <SelectItem value="THE_WILDCARD">The Wildcard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Commander Profile Display */}
              {aiState.commanderProfile && (
                <div className="border rounded-lg p-3 space-y-2 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-semibold">{aiState.commanderProfile.archetype.replace(/_/g, ' ')}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {aiState.commanderProfile.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{aiState.commanderProfile.description}</p>
                </div>
              )}
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
                {aiAnalytics && aiAnalytics.decisions.length > 0 ? (
                  aiAnalytics.decisions.slice(0, 10).map((decision, idx) => {
                    const timestamp = idx === 0 ? 'Just now' : `${idx * 2} seconds ago`;
                    return (
                      <div key={idx} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {decision.type}
                            </Badge>
                            {decision.deception && (
                              <Badge variant="destructive" className="text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Deception
                              </Badge>
                            )}
                            {decision.emotionalTrigger && (
                              <Badge variant="secondary" className="text-xs">
                                Emotional
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{decision.action}</p>
                          <p className="text-xs text-muted-foreground mt-1 italic">{decision.reasoning}</p>
                          <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono">{Math.round(decision.confidence * 100)}%</div>
                          <Progress value={decision.confidence * 100} className="w-24 h-1 mt-1" />
                          {decision.priority && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Priority: {Math.round(decision.priority * 100)}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No AI decisions available yet. Start a game to see strategic decisions.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              {aiState.commanderProfile ? (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {aiState.commanderProfile.archetype.replace(/_/g, ' ')} commander detected. 
                      {aiState.commanderProfile.traits.aggression > 0.7 && ' High aggression detected.'}
                      {aiState.commanderProfile.traits.caution > 0.7 && ' Defensive posture active.'}
                      {aiState.commanderProfile.traits.innovation > 0.7 && ' Unconventional strategies likely.'}
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-2 gap-4">
                    <BehaviorCard 
                      label="Aggression" 
                      value={`${Math.round(aiState.commanderProfile.traits.aggression * 100)}%`} 
                    />
                    <BehaviorCard 
                      label="Caution" 
                      value={`${Math.round(aiState.commanderProfile.traits.caution * 100)}%`} 
                    />
                    <BehaviorCard 
                      label="Adaptability" 
                      value={`${Math.round(aiState.commanderProfile.traits.adaptability * 100)}%`} 
                    />
                    <BehaviorCard 
                      label="Innovation" 
                      value={`${Math.round(aiState.commanderProfile.traits.innovation * 100)}%`} 
                    />
                    <BehaviorCard 
                      label="Ruthlessness" 
                      value={`${Math.round(aiState.commanderProfile.traits.ruthlessness * 100)}%`} 
                    />
                    <BehaviorCard 
                      label="Predictability" 
                      value={`${Math.round(aiState.commanderProfile.traits.predictability * 100)}%`} 
                    />
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Commander profile not loaded. Start a game to see personality traits.
                  </AlertDescription>
                </Alert>
              )}
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