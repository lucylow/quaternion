/**
 * Narrative Generation API Endpoint
 * Secure backend endpoint for Gemini API calls
 */

import express from 'express';

const router = express.Router();

// Get Gemini API key
const getApiKey = () => {
  const apiKey = process.env.GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set GEMINI_AI_API_KEY or GOOGLE_AI_API_KEY');
  }
  return apiKey;
};

/**
 * POST /api/narrative/generate
 * Generate narrative using Gemini API
 */
router.post('/generate', async (req: express.Request, res: express.Response) => {
  try {
    const {
      commanderProfile,
      context,
      narrativeType,
      options
    } = req.body;

    if (!commanderProfile) {
      return res.status(400).json({ error: 'commanderProfile is required' });
    }

    const apiKey = getApiKey();
    const model = options?.model || 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Build prompt based on narrative type
    const prompt = buildPrompt(commanderProfile, context, narrativeType);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: options?.temperature ?? 0.8,
          maxOutputTokens: options?.maxTokens ?? 500,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini API error: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse response based on type
    const narrative = parseNarrativeResponse(text, commanderProfile, narrativeType);

    res.json({
      success: true,
      narrative,
      metadata: {
        archetype: commanderProfile.archetype,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Narrative generation error:', error);
    res.status(500).json({
      error: 'Failed to generate narrative',
      message: error.message
    });
  }
});

/**
 * POST /api/narrative/battle-intro
 * Generate battle intro narrative
 */
router.post('/battle-intro', async (req: express.Request, res: express.Response) => {
  try {
    const { commanderProfile, opponentProfile, mapTheme } = req.body;

    if (!commanderProfile || !opponentProfile) {
      return res.status(400).json({ error: 'commanderProfile and opponentProfile are required' });
    }

    const apiKey = getApiKey();
    const model = 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = buildBattleIntroPrompt(commanderProfile, opponentProfile, mapTheme || 'a strategic battlefield');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini API error: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const battleIntro = parseBattleIntroResponse(text, commanderProfile, opponentProfile);

    res.json({
      success: true,
      battleIntro,
      metadata: {
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Battle intro generation error:', error);
    res.status(500).json({
      error: 'Failed to generate battle intro',
      message: error.message
    });
  }
});

// Helper functions

function buildPrompt(
  commanderProfile: any,
  context: any,
  narrativeType: string
): string {
  let prompt = `Generate ${narrativeType} narrative for commander "${commanderProfile.archetype}".

Commander profile:
- Behavior: ${commanderProfile.behavior}
- Voice: ${commanderProfile.voiceProfile?.tone || 'neutral'}, ${commanderProfile.voiceProfile?.speechPattern || 'normal'}
- Traits: ${JSON.stringify(commanderProfile.traits || {})}
`;

  if (commanderProfile.voiceProfile?.catchphrases) {
    prompt += `- Catchphrases style: ${commanderProfile.voiceProfile.catchphrases.slice(0, 2).join(', ')}\n`;
  }

  if (context?.gameState) {
    prompt += `\nGame state: ${JSON.stringify(context.gameState)}\n`;
  }

  if (context?.recentAction) {
    prompt += `\nRecent action: ${context.recentAction}\n`;
  }

  const typeInstructions: Record<string, string> = {
    dialogue: 'Generate situational dialogue (max 15 words)',
    taunt: 'Generate a taunt (max 15 words)',
    victory: 'Generate victory declaration (max 15 words)',
    defeat: 'Generate defeat acknowledgment (max 15 words)',
    strategy_comment: 'Generate strategic commentary (max 15 words)',
    event: 'Generate narrative for a game event (max 20 words)',
  };

  prompt += `\n${typeInstructions[narrativeType] || 'Generate narrative (max 15 words)'}\n`;
  prompt += `Return only the text, no quotes, no JSON. Match their voice exactly.`;

  return prompt;
}

function buildBattleIntroPrompt(
  commander: any,
  opponent: any,
  mapTheme: string
): string {
  return `Generate an epic battle intro for a sci-fi RTS game.

Commander "${commander.archetype}" characteristics:
- Personality: ${commander.behavior}
- Voice tone: ${commander.voiceProfile?.tone || 'neutral'}
- Speech pattern: ${commander.voiceProfile?.speechPattern || 'normal'}
- Traits: ${JSON.stringify(commander.traits || {})}
${commander.voiceProfile?.catchphrases ? `- Catchphrases style: ${commander.voiceProfile.catchphrases.slice(0, 2).join(', ')}` : ''}

Opponent: "${opponent.archetype}" - ${opponent.behavior}
Battlefield: ${mapTheme}

Generate a dramatic intro in JSON format:
{
  "title": "Brief battle title (5-7 words)",
  "description": "Epic 2-sentence description of the coming battle",
  "commanderIntro": "Commander's opening line reflecting their personality (max 15 words)",
  "battlefieldDescription": "Atmospheric description of the battlefield (max 20 words)"
}

Make it dramatic, immersive, and true to the commander's personality.`;
}

function parseNarrativeResponse(
  text: string,
  commanderProfile: any,
  type: string
): any {
  const cleaned = text.trim().replace(/^["']|["']$/g, '').trim();
  
  return {
    type: type || 'dialogue',
    text: cleaned || commanderProfile.voiceProfile?.catchphrases?.[0] || 'Let the battle begin.',
    tone: commanderProfile.voiceProfile?.tone || 'neutral',
    timing: 'mid_game'
  };
}

function parseBattleIntroResponse(
  text: string,
  commander: any,
  opponent: any
): any {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || `Battle: ${commander.archetype} vs ${opponent.archetype}`,
        description: parsed.description || 'Two commanders clash in an epic battle.',
        commanderIntro: parsed.commanderIntro || commander.voiceProfile?.catchphrases?.[0] || 'Let the battle begin.',
        battlefieldDescription: parsed.battlefieldDescription || 'A strategic battlefield awaits.'
      };
    }
  } catch (e) {
    console.warn('Failed to parse battle intro JSON', e);
  }
  
  // Fallback
  return {
    title: `${commander.archetype} vs ${opponent.archetype}`,
    description: `Two legendary commanders prepare for battle. Only one will emerge victorious.`,
    commanderIntro: commander.voiceProfile?.catchphrases?.[0] || 'Let the battle begin.',
    battlefieldDescription: 'The battlefield awaits the clash of titans.'
  };
}

export default router;

