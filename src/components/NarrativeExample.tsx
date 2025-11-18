/**
 * Narrative Generation Example Component
 * Demonstrates how to use the narrative generation system with AI commanders
 */

import { useState } from 'react';
import { useBattleIntro, useDialogueGeneration, useStrategyComment } from '../hooks/useNarrativeGeneration';
import { AICommanderArchetypes, type CommanderProfile } from '../ai/opponents/AICommanderArchetypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NarrativeExample() {
  const [commanderProfile, setCommanderProfile] = useState<CommanderProfile | null>(null);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const battleIntroMutation = useBattleIntro();
  const dialogueMutation = useDialogueGeneration();
  const strategyMutation = useStrategyComment();

  const handleCreateCommander = (archetype: 'THE_INNOVATOR' | 'THE_BUTCHER' | 'THE_SPIDER' | 'THE_MIRROR') => {
    const profile = AICommanderArchetypes.createCommander(archetype, Date.now());
    setCommanderProfile(profile);
  };

  const handleGenerateBattleIntro = async () => {
    if (!commanderProfile) return;

    setLoading(true);
    try {
      const opponent = AICommanderArchetypes.createCommander('THE_TACTICIAN', Date.now() + 1);
      const result = await battleIntroMutation.mutateAsync({
        commanderProfile,
        opponentProfile: opponent,
        mapTheme: 'the desolate wasteland'
      });
      setGeneratedText(`Battle: ${result.title}\n\n${result.description}\n\nCommander: "${result.commanderIntro}"\n\n${result.battlefieldDescription}`);
    } catch (error) {
      console.error('Failed to generate battle intro:', error);
      setGeneratedText('Failed to generate narrative. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDialogue = async () => {
    if (!commanderProfile) return;

    setLoading(true);
    try {
      const result = await dialogueMutation.mutateAsync({
        commanderProfile,
        context: {
          gameState: {
            militaryAdvantage: 0.5,
            resourceAdvantage: -0.2,
            unitCount: 15,
            buildingCount: 5
          },
          gamePhase: 'mid'
        }
      });
      setGeneratedText(result.text);
    } catch (error) {
      console.error('Failed to generate dialogue:', error);
      setGeneratedText('Failed to generate dialogue. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStrategyComment = async () => {
    if (!commanderProfile) return;

    setLoading(true);
    try {
      const result = await strategyMutation.mutateAsync({
        commanderProfile,
        strategy: 'tech_rush',
        gameState: {
          unitCount: 8,
          buildingCount: 3
        }
      });
      setGeneratedText(result.text);
    } catch (error) {
      console.error('Failed to generate strategy comment:', error);
      setGeneratedText('Failed to generate strategy comment. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Narrative Generation Example</CardTitle>
          <CardDescription>
            Generate dynamic narratives for AI commanders using Google AI Studio (Gemini API)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Select Commander Archetype</h3>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => handleCreateCommander('THE_INNOVATOR')}
                variant={commanderProfile?.archetype === 'THE_INNOVATOR' ? 'default' : 'outline'}
              >
                The Innovator
              </Button>
              <Button 
                onClick={() => handleCreateCommander('THE_BUTCHER')}
                variant={commanderProfile?.archetype === 'THE_BUTCHER' ? 'default' : 'outline'}
              >
                The Butcher
              </Button>
              <Button 
                onClick={() => handleCreateCommander('THE_SPIDER')}
                variant={commanderProfile?.archetype === 'THE_SPIDER' ? 'default' : 'outline'}
              >
                The Spider
              </Button>
              <Button 
                onClick={() => handleCreateCommander('THE_MIRROR')}
                variant={commanderProfile?.archetype === 'THE_MIRROR' ? 'default' : 'outline'}
              >
                The Mirror
              </Button>
            </div>
          </div>

          {commanderProfile && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">{commanderProfile.archetype}</h4>
              <p className="text-sm text-muted-foreground">{commanderProfile.behavior}</p>
              <p className="text-xs mt-1">Voice: {commanderProfile.voiceProfile.tone}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Generate Narratives</h3>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleGenerateBattleIntro}
                disabled={!commanderProfile || loading}
              >
                Battle Intro
              </Button>
              <Button 
                onClick={handleGenerateDialogue}
                disabled={!commanderProfile || loading}
                variant="outline"
              >
                Dialogue
              </Button>
              <Button 
                onClick={handleGenerateStrategyComment}
                disabled={!commanderProfile || loading}
                variant="outline"
              >
                Strategy Comment
              </Button>
            </div>
          </div>

          {generatedText && (
            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="font-semibold mb-2">Generated Narrative</h4>
              <p className="whitespace-pre-wrap text-sm">{generatedText}</p>
            </div>
          )}

          {loading && (
            <div className="text-center text-muted-foreground">
              Generating narrative...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

