import { useState } from 'react';
import { AutoReplay } from '@/components/AutoReplay';
import { JudgeHUD } from '@/components/JudgeHUD';
import { useReplay } from '@/hooks/useReplay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { state, generateReplay } = useReplay();
  const [demoSeed] = useState(Math.floor(Math.random() * 100000));

  const handleGenerateDemo = async () => {
    await generateReplay({
      seed: demoSeed,
      mapConfig: { type: 'jagged_island', width: 64, height: 64 },
      commanderId: 'cautious_geologist',
      runtime: { maxTicks: 1000, maxDurationSec: 30 },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-8">
      <AutoReplay />
      
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Quaternion AI Battle System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deterministic AI replay system with judge-ready artifacts and transparency
          </p>
        </header>

        <Card className="p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Demo Controls</h2>
            <p className="text-muted-foreground">
              Generate a deterministic replay to see the Judge HUD in action. Each replay is reproducible
              using the same seed and commander configuration.
            </p>
            
            <Button 
              onClick={handleGenerateDemo} 
              disabled={state.loading}
              size="lg"
              className="w-full sm:w-auto"
            >
              {state.loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Demo Replay (Seed: {demoSeed})
            </Button>
          </div>

          {state.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-destructive font-medium">Error: {state.error}</p>
            </div>
          )}
        </Card>

        {state.metadata && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <JudgeHUD metadata={state.metadata} loading={state.loading} />
          </div>
        )}

        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold mb-3 text-foreground">Integration Guide</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>To trigger replay generation from your game code:</p>
            <pre className="p-4 bg-background rounded-md overflow-x-auto text-xs">
{`window.dispatchEvent(new CustomEvent('game:end', {
  detail: {
    seed: currentSeed,
    mapConfig: currentMapConfig,
    commanderId: currentCommanderId,
    mode: 'fast'
  }
}));`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
