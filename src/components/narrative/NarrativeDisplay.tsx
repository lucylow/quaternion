/**
 * Narrative Display Component
 * 
 * Displays narrative events in a scrollable panel
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, MessageSquare, Target, FileText, Brain } from 'lucide-react';
import { NarrativeEvent } from '@/game/narrative/AIStoryGenerator';
import { cn } from '@/lib/utils';

interface NarrativeDisplayProps {
  events: NarrativeEvent[];
  maxHeight?: string;
}

const getEventIcon = (type: NarrativeEvent['type']) => {
  switch (type) {
    case 'lore':
      return <BookOpen className="w-4 h-4" />;
    case 'dialogue':
      return <MessageSquare className="w-4 h-4" />;
    case 'mission':
      return <Target className="w-4 h-4" />;
    case 'chronicle':
      return <FileText className="w-4 h-4" />;
    case 'memory':
      return <Brain className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

const getToneColor = (tone: NarrativeEvent['emotionalTone']) => {
  switch (tone) {
    case 'stark':
      return 'text-gray-400';
    case 'chaotic':
      return 'text-red-400';
    case 'melancholic':
      return 'text-blue-400';
    case 'philosophical':
      return 'text-purple-400';
    case 'harmonious':
      return 'text-green-400';
    default:
      return 'text-muted-foreground';
  }
};

export function NarrativeDisplay({ events, maxHeight = '400px' }: NarrativeDisplayProps) {
  if (events.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Narrative Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No narrative events yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Narrative Events ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }} className="px-4">
          <div className="space-y-3 py-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="border-l-2 border-primary/30 pl-3 pb-3 last:pb-0"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className="mt-0.5 text-primary">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase text-primary">
                        {event.type}
                      </span>
                      {event.axis && (
                        <span className="text-xs text-muted-foreground">
                          • {event.axis}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">
                      {event.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn('text-xs', getToneColor(event.emotionalTone))}>
                        {event.emotionalTone}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

