/**
 * Narrative Event Display Component
 * Shows narrative events with flavor text and effects
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NarrativeEvent {
  event: string;
  trigger: string;
  flavor: string;
  effect: Record<string, any>;
  narrativeTag?: string;
}

interface NarrativeEventDisplayProps {
  event: NarrativeEvent;
  onDismiss?: () => void;
  autoDismiss?: number; // milliseconds
}

export function NarrativeEventDisplay({ 
  event, 
  onDismiss, 
  autoDismiss = 5000 
}: NarrativeEventDisplayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  if (!visible) return null;

  const getTagColor = (tag?: string) => {
    switch (tag) {
      case 'guilt':
      case 'greed':
        return 'bg-red-500';
      case 'hope':
      case 'resilience':
        return 'bg-green-500';
      case 'unease':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="fixed top-4 right-4 w-96 z-50 animate-in slide-in-from-right">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{event.event}</h3>
              {event.narrativeTag && (
                <Badge className={getTagColor(event.narrativeTag)}>
                  {event.narrativeTag}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground italic mb-3">
              {event.flavor}
            </p>
            {Object.keys(event.effect).length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Effects: </span>
                {Object.entries(event.effect).map(([key, value], i) => (
                  <span key={key}>
                    {i > 0 && ', '}
                    {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setVisible(false);
                onDismiss();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

