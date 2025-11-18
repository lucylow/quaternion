import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { ReplayMetadata } from '@/lib/replayClient';

interface JudgeHUDProps {
  metadata: ReplayMetadata;
  loading?: boolean;
}

export function JudgeHUD({ metadata, loading = false }: JudgeHUDProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (metadata.url) {
      await navigator.clipboard.writeText(metadata.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (metadata.url) {
      const link = document.createElement('a');
      link.href = metadata.url;
      link.download = `replay-${metadata.replayId}.json.gz`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="p-6 space-y-4 bg-card/95 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Judge Summary</h2>
        {metadata.partial && (
          <Badge variant="destructive">Partial Replay</Badge>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Seed</p>
          <p className="font-mono text-foreground">{metadata.seed}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Commander</p>
          <p className="text-foreground">{metadata.commanderId}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Outcome</p>
          <Badge variant={metadata.finalOutcome === 'victory' ? 'default' : 'secondary'}>
            {metadata.finalOutcome}
          </Badge>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Duration</p>
          <p className="text-foreground">{metadata.durationSec}s</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Summary</p>
          <p className="text-sm text-foreground leading-relaxed">{metadata.summary}</p>
        </div>

        {metadata.aiHighlights && metadata.aiHighlights.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">AI Highlights</p>
            <div className="space-y-2">
              {metadata.aiHighlights.map((highlight, idx) => (
                <div key={`highlight-${highlight.action || highlight.actor || ''}-${idx}`} className="text-sm p-3 bg-muted/50 rounded-md">
                  <p className="font-medium text-foreground">
                    t={highlight.t} - {highlight.actor}: {highlight.action}
                  </p>
                  <p className="text-muted-foreground mt-1">{highlight.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        {metadata.url && (
          <>
            <Button onClick={handleDownload} disabled={loading} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Replay
            </Button>
            <Button onClick={handleCopy} variant="outline" disabled={loading}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
