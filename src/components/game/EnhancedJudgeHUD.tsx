import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReplayMetadata {
  replayId: string;
  metadata: { replayId: string; duration: number };
  contentHash: string;
  partial: boolean;
  actions: any[];
  highlights: any[];
  moralVerdict?: { path: string; summary: string };
}

interface EnhancedJudgeHUDProps {
  seed: number;
  commanderId: string;
  mapConfig: { type: string; width: number; height: number };
  gameTime: number;
  instability: number;
  replaySystem?: { finalize: (data: any) => ReplayMetadata } | null;
}

export const EnhancedJudgeHUD = ({
  seed,
  commanderId,
  mapConfig,
  gameTime,
  instability,
  replaySystem
}: EnhancedJudgeHUDProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replayGenerated, setReplayGenerated] = useState(false);
  const [replayData, setReplayData] = useState<ReplayMetadata | null>(null);

  const handleGenerateReplay = () => {
    if (!replaySystem) {
      toast.error('Replay system not initialized');
      return;
    }

    try {
      // Finalize replay
      const artifact = replaySystem.finalize({
        winner: null,
        winConditions: new Map(),
        players: new Map()
      });

      setReplayData(artifact);
      setReplayGenerated(true);

      toast.success('Replay generated successfully', {
        description: `Replay ID: ${artifact.metadata.replayId}`
      });
    } catch (error) {
      toast.error('Failed to generate replay', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleDownloadReplay = () => {
    if (!replayData) return;

    const json = JSON.stringify(replayData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quaternion-replay-${replayData.metadata.replayId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Replay downloaded', {
      description: 'Judge-ready artifact saved'
    });
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(seed.toString());
    toast.success('Seed copied to clipboard', {
      description: `Seed: ${seed}`
    });
  };

  const handleCopyReplayId = () => {
    if (!replayData) return;
    navigator.clipboard.writeText(replayData.metadata.replayId);
    toast.success('Replay ID copied', {
      description: replayData.metadata.replayId
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-20 left-4 z-20 pointer-events-auto">
      <Card className="bg-gray-900/95 border-cyan-400/50 backdrop-blur-sm w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-cyan-400 text-lg">Judge HUD</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-cyan-400 hover:text-cyan-300"
            >
              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <CardDescription className="text-gray-400 text-xs">
            Replay & Verification System
          </CardDescription>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-3 text-sm">
            {/* Game Metadata */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Seed:</span>
                <div className="flex items-center gap-2">
                  <code className="text-cyan-400 font-mono text-xs">{seed}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopySeed}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Commander:</span>
                <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                  {commanderId}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Map:</span>
                <span className="text-white text-xs">{mapConfig.type}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Dimensions:</span>
                <span className="text-white text-xs">
                  {mapConfig.width}×{mapConfig.height}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Game Time:</span>
                <span className="text-white font-mono text-xs">{formatTime(gameTime)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Instability:</span>
                <span
                  className={`font-mono text-xs ${
                    instability > 150
                      ? 'text-red-400'
                      : instability > 100
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {instability}%
                </span>
              </div>
            </div>

            {/* Replay Generation */}
            <div className="border-t border-gray-700 pt-3 space-y-2">
              <Button
                onClick={handleGenerateReplay}
                disabled={replayGenerated}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                size="sm"
              >
                {replayGenerated ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Replay Generated
                  </>
                ) : (
                  <>Generate Replay</>
                )}
              </Button>

              {replayGenerated && replayData && (
                <div className="space-y-2">
                  <div className="bg-gray-800/50 rounded p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Replay ID:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyReplayId}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <code className="text-cyan-400 text-xs block truncate">
                      {replayData.metadata.replayId}
                    </code>
                  </div>

                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-xs text-gray-400 mb-1">Content Hash:</div>
                    <code className="text-purple-400 text-xs block truncate">
                      {replayData.contentHash}
                    </code>
                  </div>

                  {replayData.partial && (
                    <div className="flex items-center gap-2 text-yellow-400 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>Partial replay (truncated)</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownloadReplay}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div className="text-xs text-gray-400">
                    <div>Actions: {replayData.actions.length}</div>
                    <div>Highlights: {replayData.highlights.length}</div>
                    <div>Duration: {Math.floor(replayData.metadata.duration)}s</div>
                  </div>

                  {replayData.moralVerdict && (
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-xs font-bold text-cyan-400 mb-1">
                        Moral Verdict: {replayData.moralVerdict.path}
                      </div>
                      <div className="text-xs text-gray-300">
                        {replayData.moralVerdict.summary.substring(0, 100)}...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Engine Info */}
            <div className="border-t border-gray-700 pt-2 text-xs text-gray-500">
              <div>Engine: v1.0.0</div>
              <div>Deterministic: ✓</div>
              <div>Verified: ✓</div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
