/**
 * Alternative Victories Display
 * Shows progress toward creative victory conditions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Leaf, Users, Brain, Zap, Handshake } from 'lucide-react';
import { VictoryCondition } from '@/ai/creative/AlternativeVictoryConditions';

interface AlternativeVictoriesDisplayProps {
  victories: VictoryCondition[];
}

const victoryIcons = {
  ecological: Leaf,
  cultural: Users,
  technological: Brain,
  diplomatic: Handshake,
  symbiotic: Zap,
  military: Trophy
};

const victoryColors = {
  ecological: 'text-green-400',
  cultural: 'text-purple-400',
  technological: 'text-blue-400',
  diplomatic: 'text-yellow-400',
  symbiotic: 'text-cyan-400',
  military: 'text-red-400'
};

export const AlternativeVictoriesDisplay = ({ victories }: AlternativeVictoriesDisplayProps) => {
  if (victories.length === 0) return null;

  return (
    <Card className="bg-card/90 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Alternative Victory Conditions
        </CardTitle>
        <CardDescription>
          Creative ways to achieve victory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {victories.map(victory => {
          const Icon = victoryIcons[victory.type] || Trophy;
          const colorClass = victoryColors[victory.type] || 'text-gray-400';
          
          return (
            <div
              key={victory.id}
              className="p-3 bg-gray-800/50 rounded-lg border border-cyan-400/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${colorClass}`} />
                <h4 className={`text-sm font-semibold ${colorClass}`}>
                  {victory.name}
                </h4>
                <span className="text-xs text-gray-500 ml-auto">
                  {Math.floor(victory.progress * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-300 mb-2">{victory.description}</p>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${colorClass.replace('text-', 'bg-')}`}
                  style={{ width: `${victory.progress * 100}%` }}
                />
              </div>
              {victory.requirements.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  <div className="font-semibold mb-1">Requirements:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {victory.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

