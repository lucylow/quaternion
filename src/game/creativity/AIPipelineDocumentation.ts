/**
 * AI Pipeline Documentation
 * Tracks AI usage, prompts, and human curation for judge presentation
 */

export interface AIPipelineStep {
  step: number;
  tool: string;
  prompt: string;
  generatedOutput: string;
  humanEdits: string[];
  finalResult: string;
  curationNotes: string;
}

export interface AIPipelineDocumentation {
  artifactId: string;
  artifactType: string;
  title: string;
  description: string;
  steps: AIPipelineStep[];
  totalGenerated: number;
  totalCurated: number;
  curationRatio: number;
  humanIntent: string;
}

export class AIPipelineDocumentationSystem {
  private pipelines: Map<string, AIPipelineDocumentation> = new Map();

  /**
   * Document AI pipeline for an artifact
   */
  documentPipeline(doc: AIPipelineDocumentation): void {
    this.pipelines.set(doc.artifactId, doc);
  }

  /**
   * Get pipeline documentation
   */
  getPipeline(artifactId: string): AIPipelineDocumentation | undefined {
    return this.pipelines.get(artifactId);
  }

  /**
   * Get all pipelines
   */
  getAllPipelines(): AIPipelineDocumentation[] {
    return Array.from(this.pipelines.values());
  }

  /**
   * Generate judge-ready AI pipeline examples
   */
  generateJudgeExamples(): AIPipelineDocumentation[] {
    return [
      // Narrative Event Generation
      {
        artifactId: 'narrative_event_001',
        artifactType: 'narrative_event',
        title: 'Reactor Overclock Narrative Event',
        description: 'LLM-generated narrative event that responds to player research choice',
        steps: [
          {
            step: 1,
            tool: 'Google AI',
            prompt: `SYSTEM: Produce one narrative event JSON for when 'Reactor Overclock' is researched.
            
OUTPUT: {"title":"", "flavor":"one-sentence", "mechanic":{"energyMultiplier":...,"sideEffect":"..."}}`,
            generatedOutput: `{
  "title": "Reactor Overclock",
  "flavor": "The reactor hums with dangerous intensity—power surges through every conduit.",
  "mechanic": {
    "energyMultiplier": 1.5,
    "sideEffect": "Bio-Seed health decreases by 10%"
  }
}`,
            humanEdits: [
              'Adjusted energy multiplier from 2.0 to 1.5 for balance',
              'Clarified side effect description',
              'Added narrative tag: "unease"'
            ],
            finalResult: `{
  "title": "Reactor Overclock",
  "flavor": "The reactor hums with dangerous intensity—power surges through every conduit.",
  "mechanic": {
    "energyMultiplier": 1.5,
    "sideEffect": "Bio-Seed health decreases by 10%"
  },
  "narrativeTag": "unease"
}`,
            curationNotes: 'Balanced power gain with meaningful consequence. Maintains moral tension.'
          }
        ],
        totalGenerated: 8,
        totalCurated: 1,
        curationRatio: 0.125,
        humanIntent: 'Create meaningful trade-off that reinforces game themes'
      },

      // Character Dialogue Generation
      {
        artifactId: 'character_dialogue_001',
        artifactType: 'character_dialogue',
        title: 'Dr. Mara Reaction to Bio-Seed Harvest',
        description: 'LLM-generated character reaction with SSML formatting',
        steps: [
          {
            step: 1,
            tool: 'Google AI',
            prompt: `SYSTEM: You are a concise sci-fi character writer. Output 4 one-line voiced lines for Dr. Mara (empathetic biologist) reacting to 'player harvests Bio-Seed'—each line 6–10 words.`,
            generatedOutput: `1. "What have we done? It remembers everything."
2. "Please, there must have been another way."
3. "The seed's memory fades... we've lost something precious."
4. "I can feel its pain. Why did we do this?"`,
            humanEdits: [
              'Selected line 1 as most impactful',
              'Added SSML prosody for emotional delivery',
              'Adjusted pacing for voice acting'
            ],
            finalResult: `<speak><voice name="Mara"><prosody rate="0.92" pitch="-1st">What have we done? <break time="250ms"/>It remembers everything.</prosody></voice></speak>`,
            curationNotes: 'Chosen for emotional impact and character voice consistency'
          }
        ],
        totalGenerated: 4,
        totalCurated: 1,
        curationRatio: 0.25,
        humanIntent: "Capture character's emotional core and moral perspective"
      },

      // Visual Concept Generation
      {
        artifactId: 'visual_concept_001',
        artifactType: 'visual_concept',
        title: 'Biotic Cathedral Concept Art',
        description: 'AI-generated concept art for Bio-Seed location',
        steps: [
          {
            step: 1,
            tool: 'DALL-E / Midjourney',
            prompt: 'Biotic cathedral: luminous Bio-Seed under glass, fungal veins, warm teal and amber lights, cinematic, high detail, 3/4 angle, concept art',
            generatedOutput: 'Generated 8 variations of concept art',
            humanEdits: [
              'Selected variation 3 for composition',
              'Enhanced lighting in Photoshop',
              'Added bioluminescent glow effects',
              'Refined color palette to match game style',
              'Cleaned up AI artifacts and inconsistencies'
            ],
            finalResult: 'Final concept art: Biotic Cathedral with refined lighting and color',
            curationNotes: 'AI provided composition and mood, human refined for consistency and polish'
          }
        ],
        totalGenerated: 8,
        totalCurated: 1,
        curationRatio: 0.125,
        humanIntent: 'Create memorable, thematically consistent location that supports narrative'
      },

      // Music Stem Generation
      {
        artifactId: 'music_stem_001',
        artifactType: 'music_stem',
        title: 'Adaptive Music Stem - Conserve State',
        description: 'AI-generated music stem that adapts to player moral state',
        steps: [
          {
            step: 1,
            tool: 'Fuser / Google AI Pro',
            prompt: `Create a 90s ambient+synth stem in three parts: (0–30) slow organ + field recordings; (30–60) rising tension with percussive clicks; (60–90) triumphant synth motif. Export stems: organ, percussion, field.`,
            generatedOutput: 'Generated 3 base stems: organ, percussion, field recordings',
            humanEdits: [
              'Mixed stems in CapCut for balance',
              'Added subtle reverb to organ stem',
              'Enhanced percussion with human-performed elements',
              'Mastered for game audio levels'
            ],
            finalResult: 'Final adaptive stem: Conserve state music with organic motifs',
            curationNotes: 'AI provided base composition, human mixed and polished for emotional impact'
          }
        ],
        totalGenerated: 3,
        totalCurated: 1,
        curationRatio: 0.33,
        humanIntent: 'Create music that emotionally supports conservation theme'
      }
    ];
  }

  /**
   * Generate judge-ready summary
   */
  generateJudgeSummary(): string {
    const pipelines = this.getAllPipelines();
    const totalGenerated = pipelines.reduce((sum, p) => sum + p.totalGenerated, 0);
    const totalCurated = pipelines.reduce((sum, p) => sum + p.totalCurated, 0);
    const avgCurationRatio = totalCurated / totalGenerated;

    return `
# AI Pipeline Documentation

## Overview
Quaternion uses AI as a creative enabler, not a replacement for human artistry. All AI-generated content undergoes human curation to ensure artistic intent and quality.

## Pipeline Statistics
- **Total Artifacts Documented**: ${pipelines.length}
- **Total AI-Generated Candidates**: ${totalGenerated}
- **Total Curated for Final Build**: ${totalCurated}
- **Average Curation Ratio**: ${(avgCurationRatio * 100).toFixed(1)}%

## Human Curation Process
Every AI-generated artifact goes through:
1. **Generation**: AI creates multiple variations
2. **Selection**: Human chooses best candidates
3. **Refinement**: Human edits for consistency and quality
4. **Integration**: Final artifact integrated into game

## AI Tools Used
- **LLM (Google AI Pro)**: Narrative events, character dialogue, quest generation
- **Image AI (DALL-E/Midjourney)**: Concept art, visual references
- **Music AI (Fuser/Google)**: Adaptive music stems
- **TTS (ElevenLabs)**: Voice narration with SSML

## Examples
${pipelines.map(p => `
### ${p.title}
- **Type**: ${p.artifactType}
- **Generated**: ${p.totalGenerated} candidates
- **Curated**: ${p.totalCurated} final
- **Ratio**: ${(p.curationRatio * 100).toFixed(1)}%
- **Human Intent**: ${p.humanIntent}
`).join('\n')}
    `.trim();
  }
}

