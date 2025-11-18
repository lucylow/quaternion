import { Card } from '@/components/ui/card';
import { Trophy, Target, Sparkles } from 'lucide-react';

export interface AlternativeVictory {
  id: string;
  type: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  unlocked?: boolean;
  // Legacy support
  name?: string;
}

interface AlternativeVictoriesDisplayProps {
  victories: AlternativeVictory[];
}

export function AlternativeVictoriesDisplay({ victories }: AlternativeVictoriesDisplayProps) {
  if (victories.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="font-semibold text-lg">Alternative Victory Conditions</h3>
      </div>
      
      {victories.map((victory) => (
        <Card
          key={victory.id}
          className={`p-4 ${
            victory.unlocked
              ? 'bg-yellow-900/20 border-yellow-500/50'
              : 'bg-background/50 border-border'
          }`}
        >
          <div className="flex items-start gap-3">
            {victory.unlocked ? (
              <Trophy className="w-5 h-5 text-yellow-400 mt-0.5" />
            ) : (
              <Target className="w-5 h-5 text-muted-foreground mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className={`font-semibold ${victory.unlocked ? 'text-yellow-200' : ''}`}>
                  {victory.title}
                </h4>
                {victory.unlocked && (
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{victory.description}</p>
              
              {!victory.unlocked && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>
                      {victory.progress} / {victory.maxProgress}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (victory.progress / victory.maxProgress) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
