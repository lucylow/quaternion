/**
 * Epilogue Display Component
 * Shows campaign ending epilogue
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, RotateCcw } from 'lucide-react';

interface EpilogueDisplayProps {
  epilogue: string;
  tone?: 'somber' | 'hopeful' | 'mixed';
  onReplay?: () => void;
  onContinue?: () => void;
}

export function EpilogueDisplay({ epilogue, tone, onReplay, onContinue }: EpilogueDisplayProps) {
  const getToneColor = () => {
    switch (tone) {
      case 'somber':
        return 'text-red-400';
      case 'hopeful':
        return 'text-green-400';
      case 'mixed':
        return 'text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Campaign Epilogue
        </CardTitle>
        <CardDescription>Your choices have shaped the outcome...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className={`text-lg leading-relaxed ${getToneColor()}`}>
            {epilogue}
          </p>
          
          <div className="flex gap-4 pt-4">
            {onReplay && (
              <Button variant="outline" onClick={onReplay}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Replay Campaign
              </Button>
            )}
            {onContinue && (
              <Button onClick={onContinue}>
                Continue
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


