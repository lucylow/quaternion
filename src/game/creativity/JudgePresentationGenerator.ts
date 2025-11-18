/**
 * Judge Presentation Generator
 * Creates complete judge-ready presentation materials
 */

import { CreativityShowcase } from './CreativityShowcase';
import { CharacterVignetteGenerator } from './CharacterVignetteGenerator';
import { StyleGuide } from './StyleGuide';
import { AIPipelineDocumentationSystem } from './AIPipelineDocumentation';

export interface JudgePresentation {
  summary: string;
  characterVignettes: any[];
  alternateEndings: any[];
  musicDemos: any[];
  styleGuide: string;
  aiPipelineDocs: string;
  metrics: any;
  artifacts: any[];
}

export class JudgePresentationGenerator {
  private showcase: CreativityShowcase;
  private vignetteGenerator: CharacterVignetteGenerator;
  private styleGuide: StyleGuide;
  private aiPipelineDocs: AIPipelineDocumentationSystem;

  constructor() {
    this.showcase = new CreativityShowcase();
    this.vignetteGenerator = new CharacterVignetteGenerator();
    this.styleGuide = new StyleGuide();
    this.aiPipelineDocs = new AIPipelineDocumentationSystem();

    this.initializeJudgeContent();
  }

  /**
   * Initialize judge-ready content
   */
  private initializeJudgeContent(): void {
    // Register pre-written vignettes
    const vignettes = this.vignetteGenerator.getJudgeReadyVignettes();
    vignettes.forEach(vignette => {
      this.showcase.registerCharacterVignette(vignette.characterId, {
        characterId: vignette.characterId,
        characterName: vignette.characterName,
        choiceContext: vignette.choiceContext,
        reaction: vignette.reaction,
        duration: this.estimateDuration(vignette.reaction),
        ssml: vignette.ssml
      });
    });

    // Register alternate endings
    this.showcase.registerAlternateEnding({
      id: 'ending_harvest',
      title: 'The Price of Progress',
      description: 'Player chose to harvest Bio-Seed for immediate resources',
      playerChoices: ['Harvest Bio-Seed', 'Prioritize short-term gains'],
      consequences: [
        'Immediate resource boost',
        'Bio-Seed health decreased',
        'Long-term ecosystem damage',
        'Dr. Mara expresses sorrow',
        'World becomes more industrial'
      ],
      duration: 30
    });

    this.showcase.registerAlternateEnding({
      id: 'ending_conserve',
      title: 'The Patient Path',
      description: 'Player chose to conserve Bio-Seed for long-term benefits',
      playerChoices: ['Conserve Bio-Seed', 'Prioritize sustainability'],
      consequences: [
        'Slower initial progress',
        'Bio-Seed health maintained',
        'Long-term ecosystem benefits',
        'Dr. Mara expresses gratitude',
        'World becomes more balanced'
      ],
      duration: 30
    });

    // Register AI pipeline docs
    const pipelineExamples = this.aiPipelineDocs.generateJudgeExamples();
    pipelineExamples.forEach(doc => {
      this.aiPipelineDocs.documentPipeline(doc);
      this.showcase.registerAIPipeline({
        artifactId: doc.artifactId,
        tool: doc.steps[0]?.tool || 'Unknown',
        prompt: doc.steps[0]?.prompt || '',
        generatedOutput: doc.steps[0]?.generatedOutput || '',
        humanEdits: doc.steps[0]?.humanEdits || [],
        finalResult: doc.steps[0]?.finalResult || '',
        curationRatio: doc.curationRatio
      });
    });
  }

  /**
   * Estimate audio duration from text
   */
  private estimateDuration(text: string): number {
    // Rough estimate: 150 words per minute = 2.5 words per second
    const words = text.split(' ').length;
    return Math.max(10, Math.min(20, words / 2.5));
  }

  /**
   * Generate complete judge presentation
   */
  generatePresentation(): JudgePresentation {
    const presentation = this.showcase.getJudgePresentation();

    return {
      summary: this.showcase.generateJudgeSummary(),
      characterVignettes: Array.from(presentation.characterVignettes.entries()).map(([charId, vignettes]) => ({
        characterId: charId,
        vignettes: vignettes.map(v => ({
          choiceContext: v.choiceContext,
          reaction: v.reaction,
          duration: v.duration
        }))
      })),
      alternateEndings: presentation.alternateEndings.map(e => ({
        title: e.title,
        description: e.description,
        playerChoices: e.playerChoices,
        consequences: e.consequences
      })),
      musicDemos: presentation.musicDemos,
      styleGuide: this.styleGuide.generateStyleGuideDocument(),
      aiPipelineDocs: this.aiPipelineDocs.generateJudgeSummary(),
      metrics: presentation.metrics,
      artifacts: presentation.artifacts
    };
  }

  /**
   * Generate Devpost-ready summary
   */
  generateDevpostSummary(): string {
    const presentation = this.generatePresentation();
    const metrics = presentation.metrics;

    return `
# Creativity & Originality - Quaternion

## Original Characters
Quaternion features three bespoke POV characters with unique personalities and reactions:
- **Commander Lian**: Pragmatic military leader
- **Dr. Mara Kest**: Empathetic biologist and moral anchor  
- **Patch**: Wry drone with observational humor

Each character has ${metrics.characterVignettes} unique voiced vignettes that react differently to the same player choices, demonstrating meaningful character depth.

## Original Setting
**Quantum Battlefields**: War-scarred archived ecosystems where resources are semi-sentient:
- Bio-Seeds that remember player actions
- Lava vents with memory
- Sensor-fog vaults with agency
- Resources have narrative weight, not just mechanical value

## Emergent Storylines
Storylines arise from mechanics, not just scripted sequences:
- Player choices about resource use create distinct moral outcomes
- ${metrics.alternateEndings} documented alternate endings
- Branching micro-stories that emerge from gameplay
- Example: Reactor Overclock unlocks arc where survivors prosper but Bio-Seed weakens

## AI-Enhanced Creativity
AI is used as a creative enabler, not a replacement:

**Narrative Events**: ${metrics.uniqueLLMEvents} unique LLM-generated events that respond to player state
**Visual Concepts**: ${metrics.aiGeneratedImages} AI-generated concept images, human-curated
**Music Stems**: ${metrics.uniqueMusicStems} adaptive music stems that react to moral state
**Human Curation**: ${(metrics.humanCurationRatio * 100).toFixed(1)}% curation ratio demonstrates artistic intent

## Visual Language
**Coherent Aesthetic**: Two dominant palettes signal moral state
- Biotic (muted greens, warm glows) = Conservation
- Industrial (acid neon, cold chrome) = Exploitation

**Unique Iconography**: ${presentation.artifacts.filter(a => a.type === 'visual_concept').length} custom icons with consistent visual metaphors (veins = life, lattice = tech)

## Decision Diversity
${(metrics.decisionDiversity * 100).toFixed(0)}% of players made different moral paths in the same seed, demonstrating meaningful choice.

## Total Creative Artifacts
${metrics.uniqueArtifacts} unique artifacts showcasing original IP, characters, settings, and creative language.
    `.trim();
  }

  /**
   * Generate judge pitch paragraph
   */
  generateJudgePitch(): string {
    return `Creativity & Originality: Quaternion blends original characters (Commander Lian, Dr. Mara Kest, Patch) and a novel world where resources have agency. The game's storylines are emergent — player decisions about resource use, terrain control, and tech sequencing create distinct moral outcomes. Music and voice are generated and curated via AI to be adaptive and expressive; visuals combine AI concepting with human polish to produce a coherent, memorable aesthetic. AI isn't a shortcut — it unlocks variety, responsiveness, and creative exploration that would be impossible to craft by hand for every seeded playthrough.`;
  }
}

