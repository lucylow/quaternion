/**
 * Resource Advisor Panel
 * Displays AI advisor recommendations
 */

import { Brain, AlertCircle, TrendingUp, TrendingDown, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdvisorResponse } from '@/game/puzzles/ResourceAdvisor';
import { AdvisorPersonality } from '@/game/puzzles/ResourceAdvisor';

interface ResourceAdvisorPanelProps {
  advisor: AdvisorPersonality;
  advice: AdvisorResponse | null;
  onDismiss?: () => void;
}

export const ResourceAdvisorPanel = ({
  advisor,
  advice,
  onDismiss
}: ResourceAdvisorPanelProps) => {
  if (!advice) return null;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-400 border-red-500/50';
      case 'medium':
        return 'text-yellow-400 border-yellow-500/50';
      default:
        return 'text-green-400 border-green-500/50';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <TrendingDown className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <Card
      className={`p-3 bg-gray-800/95 border-2 ${getUrgencyColor(advice.urgency)} absolute bottom-24 left-4 z-30 max-w-sm`}
    >
      <div className="flex items-start gap-2">
        <Brain className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-cyan-400">{advisor.name}</h4>
            <span className="text-xs text-gray-400">({advisor.style})</span>
            <div className="ml-auto flex items-center gap-1">
              {getUrgencyIcon(advice.urgency)}
              <span className="text-xs text-gray-400 capitalize">{advice.urgency}</span>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-gray-400 hover:text-white ml-1"
                onClick={onDismiss}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          <p className="text-sm text-white mb-1">{advice.adviceText}</p>
          {advice.reasoning && (
            <p className="text-xs text-gray-400 italic">{advice.reasoning}</p>
          )}
          <div className="mt-2 text-xs text-gray-500">
            Confidence: {Math.round(advice.confidence * 100)}%
          </div>
        </div>
      </div>
    </Card>
  );
};


