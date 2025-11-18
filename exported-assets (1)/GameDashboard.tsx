// pages/GameDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAIGame, useAIStrategy } from './useAIGame';
import { AIGameUIPanel } from './AIGameUI';
import { GameMapCanvas, UnitPanel, ResourceDisplay, BuildingInfo } from './GameComponents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Play, Square, RotateCcw } from 'lucide-react';
import type { CommanderArchetype } from '@/ai/opponents/AICommanderArchetypes';

export const GameDashboard: React.FC = () => {
  const {
    gameState,
    aiAnalytics,
    isLoading,
    error,
    isGameActive,
    initializeGame,
    startGame,
    stopGame,
    moveUnits,
    attackUnit,
    gatherResources,
  } = useAIGame({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    pollInterval: 100,
  });

  const {
    config: aiConfig,
    updateDifficulty,
    updateAggressiveness,
    updateDefensiveness,
  } = useAIStrategy();

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedCommander, setSelectedCommander] = useState<CommanderArchetype>('THE_TACTICIAN');

  const selectedUnit = gameState?.units.find(u => u.id === selectedUnitId) || null;
  const selectedBuilding = gameState?.buildings.find(b => b.id === selectedBuildingId) || null;

  const handleGameStart = async () => {
    try {
      await initializeGame(64, 64, aiConfig.difficulty, selectedCommander);
      await startGame();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleGameStop = async () => {
    try {
      await stopGame();
      setSelectedUnitId(null);
      setSelectedBuildingId(null);
    } catch (err) {
      console.error('Failed to stop game:', err);
    }
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedBuildingId(null);
  };

  const handleMapClick = (x: number, y: number) => {
    if (selectedUnit && selectedUnit.playerId === 1) {
      moveUnits([selectedUnit.id], x, y);
    }
  };

  const player1 = gameState?.players[0];
  const player2 = gameState?.players[1];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Game Control Center</h1>
            <p className="text-muted-foreground mt-2">Chroma Strategy Game - AI Opponent Management</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Commander:</label>
              <Select value={selectedCommander} onValueChange={(value) => setSelectedCommander(value as CommanderArchetype)}>
                <SelectTrigger className="w-40">
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
            <Button
              onClick={handleGameStart}
              disabled={isGameActive || isLoading}
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
            <Button
              onClick={handleGameStop}
              disabled={!isGameActive || isLoading}
              variant="destructive"
              size="lg"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Game
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - AI Control */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Adjust AI behavior in real-time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Difficulty</label>
                  <div className="flex gap-2 mt-2">
                    {(['easy', 'medium', 'hard'] as const).map(diff => (
                      <Button
                        key={diff}
                        variant={aiConfig.difficulty === diff ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateDifficulty(diff)}
                        className="flex-1 capitalize"
                      >
                        {diff}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Aggressiveness: {aiConfig.aggressiveness}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={aiConfig.aggressiveness}
                    onChange={e => updateAggressiveness(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Defensiveness: {aiConfig.defensiveness}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={aiConfig.defensiveness}
                    onChange={e => updateDefensiveness(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {gameState && player1 && player2 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-sm mb-3">Resources</h3>
                    <ResourceDisplay
                      player1Resources={{
                        minerals: player1.minerals,
                        gas: player1.gas,
                      }}
                      player2Resources={{
                        minerals: player2.minerals,
                        gas: player2.gas,
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center - Game Map */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Game Map</CardTitle>
                <CardDescription>Click units to select, click map to move</CardDescription>
              </CardHeader>
              <CardContent>
                {gameState ? (
                  <div className="border rounded-lg overflow-hidden bg-slate-900 p-2">
                    <GameMapCanvas
                      gameState={gameState}
                      selectedUnitId={selectedUnitId}
                      onUnitSelect={handleUnitSelect}
                      onPositionClick={handleMapClick}
                      scale={8}
                    />
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center bg-secondary rounded-lg text-muted-foreground">
                    {isLoading ? 'Initializing game...' : 'Start a game to view the map'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unit/Building Details */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Unit</CardTitle>
                </CardHeader>
                <CardContent>
                  <UnitPanel unit={selectedUnit} isLoading={isLoading} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Building</CardTitle>
                </CardHeader>
                <CardContent>
                  <BuildingInfo building={selectedBuilding} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Game Statistics */}
        {gameState && aiAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle>Game Statistics</CardTitle>
              <CardDescription>Current game tick and AI metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="units">Units</TabsTrigger>
                  <TabsTrigger value="buildings">Buildings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Game Tick" value={gameState.tick} />
                    <StatCard label="Total Units" value={gameState.units.length} />
                    <StatCard label="Total Buildings" value={gameState.buildings.length} />
                    <StatCard label="Resources" value={gameState.resources.length} />
                  </div>
                </TabsContent>

                <TabsContent value="units" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {gameState.units.slice(0, 10).map(unit => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={() => handleUnitSelect(unit.id)}
                      >
                        <div>
                          <p className="font-medium capitalize">{unit.type}</p>
                          <p className="text-xs text-muted-foreground">{unit.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {unit.hp}/{unit.maxHp} HP
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{unit.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="buildings" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {gameState.buildings.slice(0, 10).map(building => (
                      <div
                        key={building.id}
                        className="flex items-center justify-between p-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={() => setSelectedBuildingId(building.id)}
                      >
                        <div>
                          <p className="font-medium capitalize">{building.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {building.playerId === 1 ? 'Player 1' : 'AI'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {building.hp}/{building.maxHp} HP
                          </p>
                          <p className="text-xs text-muted-foreground">{building.progress}% built</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* AI Management Panel */}
        <AIGameUIPanel />
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className="border rounded-lg p-3">
    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default GameDashboard;