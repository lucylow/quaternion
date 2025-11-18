/**
 * Gemini Narrative Display Component
 * React component for displaying AI-generated narrative content in campaigns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, MessageSquare, MapPin, Sparkles } from 'lucide-react';
import type { NarrativeEvent } from '@/game/campaigns/CampaignSystem';
import type { CampaignStorytellingIntegration } from '@/game/campaigns/CampaignStorytellingIntegration';

interface GeminiNarrativeDisplayProps {
  storytellingIntegration: CampaignStorytellingIntegration;
  onEventGenerated?: (event: NarrativeEvent) => void;
}

export const GeminiNarrativeDisplay: React.FC<GeminiNarrativeDisplayProps> = ({
  storytellingIntegration,
  onEventGenerated
}) => {
  const [currentEvent, setCurrentEvent] = useState<NarrativeEvent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lore, setLore] = useState<any>(null);
  const [showLore, setShowLore] = useState(false);

  // Load campaign lore on mount
  useEffect(() => {
    loadCampaignLore();
  }, []);

  const loadCampaignLore = async () => {
    try {
      const campaignLore = await storytellingIntegration.generateCampaignLore();
      setLore(campaignLore);
    } catch (error) {
      console.error('Failed to load campaign lore:', error);
    }
  };

  const generateEvent = async () => {
    setIsGenerating(true);
    try {
      const event = await storytellingIntegration.generateEventForCurrentBeat();
      if (event) {
        setCurrentEvent(event);
        onEventGenerated?.(event);
      }
    } catch (error) {
      console.error('Failed to generate narrative event:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDialogue = async (characterId: string, situation: string) => {
    setIsGenerating(true);
    try {
      const dialogue = await storytellingIntegration.generateCharacterDialogue(
        characterId,
        situation
      );
      // Display dialogue (you can implement a dialogue modal here)
      console.log('Generated dialogue:', dialogue);
    } catch (error) {
      console.error('Failed to generate dialogue:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Campaign Lore Toggle */}
      {lore && (
        <Card className="bg-primary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Campaign Lore
            </CardTitle>
          </CardHeader>
          {showLore && (
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">Setting</h3>
                <p className="text-sm text-muted-foreground">{lore.setting}</p>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-2">History</h3>
                <p className="text-sm text-muted-foreground">{lore.history}</p>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-2">Factions</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {lore.factions.map((faction: string, i: number) => (
                    <li key={i}>{faction}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-2">Mysteries</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {lore.mysteries.map((mystery: string, i: number) => (
                    <li key={i}>{mystery}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-2">Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {lore.themes.map((theme: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-primary/20 text-primary rounded text-xs"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLore(!showLore)}
            >
              {showLore ? 'Hide Lore' : 'Show Lore'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Narrative Event Generation */}
      <Card className="bg-card/70 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Narrative Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={generateEvent}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Narrative...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Narrative Event
              </>
            )}
          </Button>

          {currentEvent && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/30 space-y-3">
              <div>
                <h3 className="font-bold text-primary mb-2">{currentEvent.event}</h3>
                {currentEvent.flavor && (
                  <p className="text-sm text-muted-foreground italic mb-2">
                    {currentEvent.flavor}
                  </p>
                )}
              </div>
              
              {currentEvent.narrativeTag && (
                <div>
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                    {currentEvent.narrativeTag}
                  </span>
                </div>
              )}

              {Object.keys(currentEvent.effect).length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Consequences:</h4>
                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                    {Object.entries(currentEvent.effect).map(([key, value]) => (
                      <li key={key}>
                        {key}: {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card/70 border-primary/30">
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => generateDialogue('mara', 'Character interaction moment')}
            disabled={isGenerating}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Generate Character Dialogue
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              setIsGenerating(true);
              try {
                const envNarrative = await storytellingIntegration.generateEnvironmentalNarrative(
                  'Current Location',
                  'Player action'
                );
                console.log('Environmental narrative:', envNarrative);
                // Display in a modal or toast
              } catch (error) {
                console.error('Failed to generate environmental narrative:', error);
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Generate Environmental Narrative
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeminiNarrativeDisplay;

