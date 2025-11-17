/**
 * Example component demonstrating the new API client integration
 * This shows how to use the useGameApi hook in a React component
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameApi } from '@/hooks/useGameApi';
import { toast } from 'sonner';
import { Loader2, Play, Square, Trash2, RefreshCw } from 'lucide-react';

export function GameAPIExample() {
  const {
    gameId,
    gameState,
    loading,
    error,
    isRunning,
    createGame,
    startGame,
    stopGame,
    deleteGame,
    refreshState,
    moveUnits,
    clearError,
  } = useGameApi(true, 200); // Auto-poll every 200ms

  const handleCreateGame = async () => {
    try {
      await createGame({
        mapWidth: 64,
        mapHeight: 64,
        aiDifficulty: 'medium',
        mapType: 'standard',
      });
      toast.success('Game created successfully!');
    } catch (err: any) {
      toast.error(`Failed to create game: ${err.message}`);
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
      toast.success('Game started!');
    } catch (err: any) {
      toast.error(`Failed to start game: ${err.message}`);
    }
  };

  const handleStopGame = async () => {
    try {
      await stopGame();
      toast.success('Game stopped!');
    } catch (err: any) {
      toast.error(`Failed to stop game: ${err.message}`);
    }
  };

  const handleDeleteGame = async () => {
    try {
      await deleteGame();
      toast.success('Game deleted!');
    } catch (err: any) {
      toast.error(`Failed to delete game: ${err.message}`);
    }
  };

  const handleMoveUnits = async () => {
    if (!gameState?.players[0]?.units || gameState.players[0].units.length === 0) {
      toast.error('No units available to move');
      return;
    }

    try {
      const unitIds = gameState.players[0].units.slice(0, 2).map((u: any) => u.id);
      await moveUnits(unitIds, 100, 100);
      toast.success('Units moved!');
    } catch (err: any) {
      toast.error(`Failed to move units: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Game API Integration Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <div className="flex justify-between items-center">
                <p className="text-destructive">{error}</p>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCreateGame}
              disabled={loading || !!gameId}
              variant="default"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Game
            </Button>

            <Button
              onClick={handleStartGame}
              disabled={loading || !gameId || isRunning}
              variant="default"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Game
            </Button>

            <Button
              onClick={handleStopGame}
              disabled={loading || !gameId || !isRunning}
              variant="secondary"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop Game
            </Button>

            <Button
              onClick={handleDeleteGame}
              disabled={loading || !gameId}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Game
            </Button>

            <Button
              onClick={refreshState}
              disabled={loading || !gameId}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              onClick={handleMoveUnits}
              disabled={loading || !gameId || !isRunning}
              variant="outline"
            >
              Move Units
            </Button>
          </div>

          {/* Game Info */}
          {gameId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Game Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Game ID:</span>
                  <span className="font-mono text-xs">{gameId}</span>
                </div>
                {gameState && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tick:</span>
                      <span className="font-mono">{gameState.tick}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={isRunning ? 'text-green-500' : 'text-yellow-500'}>
                        {isRunning ? 'Running' : 'Stopped'}
                      </span>
                    </div>
                    {gameState.players && gameState.players.length > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Players:</span>
                          <span>{gameState.players.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Player 1 Units:</span>
                          <span>{gameState.players[0]?.units?.length || 0}</span>
                        </div>
                        {gameState.players[0]?.resources && (
                          <div className="mt-2 pt-2 border-t space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground">
                              Resources:
                            </div>
                            {Object.entries(gameState.players[0].resources).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-mono">{value as number}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!gameId && !loading && (
            <div className="text-center p-8 text-muted-foreground">
              <p>No game active. Create a new game to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

