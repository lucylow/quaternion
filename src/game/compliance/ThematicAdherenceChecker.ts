/**
 * Thematic Adherence Checker
 * Ensures game meets Chroma Awards requirements and category standards
 * Designed for Puzzle/Strategy category compliance
 */

export interface ComplianceCheck {
  id: string;
  category: 'submission' | 'category' | 'legal' | 'accessibility' | 'ai_usage';
  requirement: string;
  status: 'pass' | 'fail' | 'warning' | 'not_checked';
  details?: string;
  fix?: string;
}

export interface CategoryRequirements {
  playableInBrowser: boolean;
  noDownloadRequired: boolean;
  noSignUpRequired: boolean;
  completableInMinutes: number; // Should be < 30
  hasSinglePlayer: boolean;
  hasDemoMission: boolean;
  hasPlayInstructions: boolean;
  uniqueMechanics: string[];
}

export interface AccessibilityFeatures {
  englishSubtitles: boolean;
  colorblindFriendly: boolean;
  clearUIReadouts: boolean;
  triggerWarnings: boolean;
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
}

export interface AIUsageStatement {
  toolsUsed: string[];
  aiProduced: string[];
  humanCuration: string[];
  proofArtifacts: string[];
}

export class ThematicAdherenceChecker {
  private complianceChecks: ComplianceCheck[] = [];
  private categoryRequirements: CategoryRequirements;
  private accessibilityFeatures: AccessibilityFeatures;
  private aiUsageStatement: AIUsageStatement;

  constructor() {
    this.categoryRequirements = {
      playableInBrowser: true,
      noDownloadRequired: true,
      noSignUpRequired: true,
      completableInMinutes: 15, // Recommended: 3-15 minutes
      hasSinglePlayer: true,
      hasDemoMission: true,
      hasPlayInstructions: true,
      uniqueMechanics: [
        'Resource puzzles (4-axis balance)',
        'Tech-tree puzzles (strategic research)',
        'Terrain-based puzzles (dynamic tiles)',
        'Faction philosophy choices'
      ]
    };

    this.accessibilityFeatures = {
      englishSubtitles: true,
      colorblindFriendly: true,
      clearUIReadouts: true,
      triggerWarnings: false, // Add if needed
      keyboardNavigation: true,
      screenReaderSupport: true
    };

    this.aiUsageStatement = {
      toolsUsed: [
        'ElevenLabs (voice lines)',
        'OpenArt & ImagineArt (concept & UI art)',
        'Luma AI (3D variants)',
        'Dreamina (lip-sync for 2D cutscenes)',
        'Google AI Pro (LLM event generation)',
        'Fuser (music stems)',
        'Saga AI (narrative generation)'
      ],
      aiProduced: [
        'Voice lines for faction commanders and advisors',
        'Concept art for units, buildings, and terrain',
        'UI art elements and icons',
        'Narrative events and dialogue',
        'Music stems for adaptive soundtrack',
        'World-building lore and faction descriptions',
        'Environmental storytelling narratives'
      ],
      humanCuration: [
        'Edited and curated all AI-generated assets',
        'Post-processed images for consistency',
        'Mixed and balanced audio tracks',
        'Integrated AI content into game systems',
        'Wrote game code and balanced mechanics',
        'Designed UI/UX and user interactions',
        'Tested and polished final experience'
      ],
      proofArtifacts: [
        'Prompt logs for LLM narrative generation',
        'ElevenLabs voice generation samples',
        'OpenArt/ImagineArt concept art outputs',
        'Fuser music stem exports',
        'Google AI Pro API call logs',
        'Before/after asset curation examples'
      ]
    };

    this.runComplianceChecks();
  }

  /**
   * Run all compliance checks
   */
  private runComplianceChecks(): void {
    this.complianceChecks = [
      // Submission Requirements
      {
        id: 'submission_001',
        category: 'submission',
        requirement: 'Project submitted via Devpost',
        status: 'not_checked',
        details: 'Must be submitted on Chroma competition page'
      },
      {
        id: 'submission_002',
        category: 'submission',
        requirement: 'Playable web build hosted on allowed platform',
        status: this.categoryRequirements.playableInBrowser ? 'pass' : 'fail',
        details: 'Must be on Itch.io, Rosebud AI, R/GamesOnReddit, or own domain'
      },
      {
        id: 'submission_003',
        category: 'submission',
        requirement: 'No download required',
        status: this.categoryRequirements.noDownloadRequired ? 'pass' : 'fail'
      },
      {
        id: 'submission_004',
        category: 'submission',
        requirement: 'No login/sign-up required',
        status: this.categoryRequirements.noSignUpRequired ? 'pass' : 'fail'
      },
      {
        id: 'submission_005',
        category: 'submission',
        requirement: 'Category: Games → Puzzle/Strategy selected',
        status: 'not_checked',
        details: 'Must select correct category on Devpost'
      },
      {
        id: 'submission_006',
        category: 'submission',
        requirement: 'English voice OR English subtitles',
        status: this.accessibilityFeatures.englishSubtitles ? 'pass' : 'fail'
      },
      {
        id: 'submission_007',
        category: 'submission',
        requirement: 'All assets licensed or created',
        status: 'not_checked',
        details: 'Must verify all assets are original or properly licensed'
      },
      {
        id: 'submission_008',
        category: 'submission',
        requirement: 'Tool Tags listed for Sponsor Awards',
        status: 'not_checked',
        details: 'List tools used: ElevenLabs, Luma AI, OpenArt, etc.'
      },
      {
        id: 'submission_009',
        category: 'submission',
        requirement: 'Short "How AI was used" statement included',
        status: 'pass',
        details: 'AI usage statement prepared'
      },
      {
        id: 'submission_010',
        category: 'submission',
        requirement: 'Trailer/video uploaded publicly',
        status: 'not_checked',
        details: '60-90s trailer on YouTube/Vimeo with link in Devpost'
      },

      // Category-Specific Requirements
      {
        id: 'category_001',
        category: 'category',
        requirement: 'Playable in web browser',
        status: this.categoryRequirements.playableInBrowser ? 'pass' : 'fail'
      },
      {
        id: 'category_002',
        category: 'category',
        requirement: 'Completable in < 30 minutes',
        status: this.categoryRequirements.completableInMinutes < 30 ? 'pass' : 'warning',
        details: `Current: ${this.categoryRequirements.completableInMinutes} minutes (recommended: 3-15)`
      },
      {
        id: 'category_003',
        category: 'category',
        requirement: 'Unique mechanics emphasized',
        status: this.categoryRequirements.uniqueMechanics.length > 0 ? 'pass' : 'fail',
        details: `${this.categoryRequirements.uniqueMechanics.length} unique mechanics identified`
      },
      {
        id: 'category_004',
        category: 'category',
        requirement: 'Single-player mode available',
        status: this.categoryRequirements.hasSinglePlayer ? 'pass' : 'fail'
      },
      {
        id: 'category_005',
        category: 'category',
        requirement: 'Demo mission included',
        status: this.categoryRequirements.hasDemoMission ? 'pass' : 'fail',
        details: 'Curated seed + recommended strategy'
      },
      {
        id: 'category_006',
        category: 'category',
        requirement: 'Play instructions included',
        status: this.categoryRequirements.hasPlayInstructions ? 'pass' : 'fail'
      },

      // Legal & Community Rules
      {
        id: 'legal_001',
        category: 'legal',
        requirement: 'No unauthorized third-party IP',
        status: 'not_checked',
        details: 'Must verify no StarCraft assets, franchise characters, or brand logos'
      },
      {
        id: 'legal_002',
        category: 'legal',
        requirement: 'Music & audio properly licensed',
        status: 'not_checked',
        details: 'Only original, licensed stock, or AI-generated with proper license'
      },
      {
        id: 'legal_003',
        category: 'legal',
        requirement: 'No deepfakes or unauthorized likenesses',
        status: 'pass',
        details: 'No real person likenesses used'
      },
      {
        id: 'legal_004',
        category: 'legal',
        requirement: 'Community guidelines respected',
        status: 'pass',
        details: 'No hateful content, exploitation, or obscene material'
      },

      // Accessibility
      {
        id: 'accessibility_001',
        category: 'accessibility',
        requirement: 'English subtitles for all spoken content',
        status: this.accessibilityFeatures.englishSubtitles ? 'pass' : 'fail'
      },
      {
        id: 'accessibility_002',
        category: 'accessibility',
        requirement: 'Colorblind-friendly UI',
        status: this.accessibilityFeatures.colorblindFriendly ? 'pass' : 'fail',
        details: 'Uses symbols + color for differentiation'
      },
      {
        id: 'accessibility_003',
        category: 'accessibility',
        requirement: 'Clear UI readouts',
        status: this.accessibilityFeatures.clearUIReadouts ? 'pass' : 'fail'
      },
      {
        id: 'accessibility_004',
        category: 'accessibility',
        requirement: 'Keyboard navigation',
        status: this.accessibilityFeatures.keyboardNavigation ? 'pass' : 'fail'
      },
      {
        id: 'accessibility_005',
        category: 'accessibility',
        requirement: 'Screen reader support',
        status: this.accessibilityFeatures.screenReaderSupport ? 'pass' : 'fail'
      }
    ];
  }

  /**
   * Get compliance report
   */
  getComplianceReport(): {
    summary: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
      notChecked: number;
    };
    checks: ComplianceCheck[];
    categoryRequirements: CategoryRequirements;
    accessibilityFeatures: AccessibilityFeatures;
    aiUsageStatement: AIUsageStatement;
  } {
    const summary = {
      total: this.complianceChecks.length,
      passed: this.complianceChecks.filter(c => c.status === 'pass').length,
      failed: this.complianceChecks.filter(c => c.status === 'fail').length,
      warnings: this.complianceChecks.filter(c => c.status === 'warning').length,
      notChecked: this.complianceChecks.filter(c => c.status === 'not_checked').length
    };

    return {
      summary,
      checks: this.complianceChecks,
      categoryRequirements: this.categoryRequirements,
      accessibilityFeatures: this.accessibilityFeatures,
      aiUsageStatement: this.aiUsageStatement
    };
  }

  /**
   * Get AI usage statement for Devpost
   */
  getAIUsageStatement(): string {
    return `How we used AI: Quaternion uses AI to augment creative production and generate procedural variety. 

Tools used: ${this.aiUsageStatement.toolsUsed.join(', ')}.

AI produced: ${this.aiUsageStatement.aiProduced.join('; ')}.

Human curation: ${this.aiUsageStatement.humanCuration.join('; ')}.

We include prompt logs, generated assets, and final files in our submission assets to verify usage if requested.`;
  }

  /**
   * Get tool tags for Sponsor Awards
   */
  getToolTags(): string {
    return this.aiUsageStatement.toolsUsed
      .map(tool => tool.split('(')[0].trim())
      .join(', ');
  }

  /**
   * Check if game meets category requirements
   */
  meetsCategoryRequirements(): boolean {
    return (
      this.categoryRequirements.playableInBrowser &&
      this.categoryRequirements.noDownloadRequired &&
      this.categoryRequirements.noSignUpRequired &&
      this.categoryRequirements.completableInMinutes < 30 &&
      this.categoryRequirements.hasSinglePlayer &&
      this.categoryRequirements.hasDemoMission &&
      this.categoryRequirements.hasPlayInstructions &&
      this.categoryRequirements.uniqueMechanics.length > 0
    );
  }

  /**
   * Check if game meets accessibility requirements
   */
  meetsAccessibilityRequirements(): boolean {
    return (
      this.accessibilityFeatures.englishSubtitles &&
      this.accessibilityFeatures.colorblindFriendly &&
      this.accessibilityFeatures.clearUIReadouts &&
      this.accessibilityFeatures.keyboardNavigation
    );
  }

  /**
   * Get failed checks
   */
  getFailedChecks(): ComplianceCheck[] {
    return this.complianceChecks.filter(c => c.status === 'fail');
  }

  /**
   * Get warnings
   */
  getWarnings(): ComplianceCheck[] {
    return this.complianceChecks.filter(c => c.status === 'warning');
  }

  /**
   * Get not-checked items
   */
  getNotCheckedItems(): ComplianceCheck[] {
    return this.complianceChecks.filter(c => c.status === 'not_checked');
  }
}

