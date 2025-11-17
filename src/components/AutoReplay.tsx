import { useEffect, useState } from 'react';
import { useReplay } from '@/hooks/useReplay';
import { useToast } from '@/hooks/use-toast';

interface GameEndDetail {
  seed: number;
  mapConfig: any;
  commanderId: string;
  mode?: 'fast' | 'full';
}

export function AutoReplay() {
  const { generateReplay } = useReplay();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const handler = async (e: Event) => {
      const customEvent = e as CustomEvent<GameEndDetail>;
      const detail = customEvent.detail;

      if (!detail || typeof detail.seed === 'undefined' || !detail.commanderId) {
        console.warn('AutoReplay: missing seed or commanderId in game:end detail', detail);
        return;
      }

      setGenerating(true);
      toast({
        title: 'Generating Replay',
        description: 'Creating deterministic replay artifact...',
      });

      try {
        const meta = await generateReplay({
          seed: detail.seed,
          mapConfig: detail.mapConfig || {},
          commanderId: detail.commanderId,
          runtime: {
            maxTicks: detail.mode === 'full' ? 5000 : 1000,
            maxDurationSec: 30,
          },
        });

        if (meta && meta.replayId) {
          toast({
            title: 'Replay Generated',
            description: `Replay ${meta.replayId.slice(0, 8)} created successfully`,
          });
        } else {
          toast({
            title: 'Generation Failed',
            description: 'Replay generation failed or timed out',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('AutoReplay.generate error', err);
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Replay generation error',
          variant: 'destructive',
        });
      } finally {
        setGenerating(false);
      }
    };

    window.addEventListener('game:end', handler as EventListener);
    return () => window.removeEventListener('game:end', handler as EventListener);
  }, [generateReplay, toast]);

  if (generating) {
    return (
      <div className="fixed right-4 bottom-4 z-50 p-4 bg-primary/90 text-primary-foreground rounded-lg shadow-lg animate-pulse">
        Generating replay...
      </div>
    );
  }

  return null;
}
