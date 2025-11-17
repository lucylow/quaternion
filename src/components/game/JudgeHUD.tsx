import { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Share2, FileJson, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useReplayGenerator } from '@/hooks/useReplayGenerator';

interface JudgeHUDProps {
  seed: number;
  commanderId: string;
  mapConfig: {
    type: string;
    width: number;
    height: number;
  };
  outcome?: string;
}

export function JudgeHUD({ seed, commanderId, mapConfig, outcome }: JudgeHUDProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { metadata, loading, error, generateReplay, downloadReplay, shareReplay } = useReplayGenerator();

  const handleGenerate = () => {
    generateReplay({
      seed,
      commanderId,
      mapConfig,
      mode: 'fast',
    });
  };

  const truncateText = (text: string, maxLength: number = 140) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TooltipProvider>
      <aside 
        className="fixed top-20 right-4 z-40 w-96 bg-game-panel/95 backdrop-blur-md border border-game-panel-border/50 rounded-lg shadow-game-panel"
        role="complementary"
        aria-label="Judge replay controls"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-game-panel-border/30">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Judge Replay</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div className="p-4 space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Seed:</span>
                <div className="font-mono text-foreground">{seed}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Commander:</span>
                <div className="font-semibold text-foreground">{commanderId}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Map Type:</span>
                <div className="text-foreground">{mapConfig.type}</div>
              </div>
              {outcome && (
                <div>
                  <span className="text-muted-foreground">Outcome:</span>
                  <div className="text-foreground">{outcome}</div>
                </div>
              )}
              {metadata?.meta?.engineCommit && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Engine:</span>
                  <div className="font-mono text-xs text-foreground">{metadata.meta.engineCommit.substring(0, 8)}</div>
                </div>
              )}
            </div>

            {/* Partial Warning */}
            {metadata?.meta?.partial && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold text-yellow-500">Partial Replay</div>
                    <div className="text-yellow-500/80">
                      {metadata.meta.nonDeterminism?.reason || 'Some ticks were summarized'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            {metadata?.summary && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{metadata.summary}</p>
              </div>
            )}

            {/* AI Highlights */}
            {metadata?.aiHighlights && metadata.aiHighlights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Top AI Highlights</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {metadata.aiHighlights.slice(0, 3).map((highlight, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <div className="p-2 bg-game-panel/50 rounded border border-game-panel-border/30 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-xs">{highlight.t}s</Badge>
                              <span className="text-primary">{highlight.actor}</span>
                            </div>
                            <div className="text-foreground font-medium">{highlight.action}</div>
                            <div className="text-muted-foreground">{truncateText(highlight.reason)}</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{highlight.reason}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Recent Actions */}
            {metadata?.actions && metadata.actions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Recent Actions</h4>
                <ScrollArea className="h-24">
                  <div className="space-y-1">
                    {metadata.actions.slice(0, 8).map((action, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{action.timestamp}s</span>
                        <span className="text-foreground">{action.type}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-destructive mt-0.5" />
                  <div className="text-sm text-destructive">{error}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1"
                aria-label="Generate judge-ready replay"
              >
                {loading ? 'Generating...' : 'Generate Replay'}
              </Button>
            </div>

            {metadata && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReplay(metadata.replayId, metadata.url)}
                  className="flex-1"
                  aria-label="Download replay artifact"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareReplay(metadata.replayId, metadata.url)}
                  className="flex-1"
                  aria-label="Share replay link"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            )}

            {/* JSON Preview Dialog */}
            {metadata && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    <FileJson className="w-4 h-4 mr-2" />
                    View Full JSON
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Replay Details</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96">
                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </ScrollArea>
                  <Button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `replay-${metadata.replayId}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download JSON
                  </Button>
                </DialogContent>
              </Dialog>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="text-xs text-center text-muted-foreground">
                Generating judge-ready replay (deterministic) — optimizing for small downloadable artifact...
              </div>
            )}
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
