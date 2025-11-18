/**
 * Quaternion Style Guide
 * Documents the creative language and aesthetic choices
 * for judge presentation
 */

export interface ColorPalette {
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    emissive: string;
  };
  usage: string;
}

export interface IconSet {
  name: string;
  description: string;
  icons: IconDefinition[];
}

export interface IconDefinition {
  id: string;
  name: string;
  description: string;
  visualMetaphor: string;
  usage: string;
}

export interface Typography {
  primary: FontDefinition;
  secondary: FontDefinition;
  sizes: {
    base: number;
    subtitle: number;
    heading: number;
    title: number;
  };
}

export interface FontDefinition {
  name: string;
  usage: string;
  characteristics: string;
}

export class StyleGuide {
  /**
   * Get complete style guide for judges
   */
  getStyleGuide(): {
    palettes: ColorPalette[];
    iconography: IconSet;
    typography: Typography;
    visualLanguage: string;
    aestheticPrinciples: string[];
  } {
    return {
      palettes: this.getColorPalettes(),
      iconography: this.getIconography(),
      typography: this.getTypography(),
      visualLanguage: this.getVisualLanguage(),
      aestheticPrinciples: this.getAestheticPrinciples()
    };
  }

  /**
   * Get color palettes
   */
  private getColorPalettes(): ColorPalette[] {
    return [
      {
        name: 'Biotic (Conserve)',
        description: 'Represents life, growth, and conservation',
        colors: {
          primary: '#0F3A3A', // Deep Teal
          secondary: '#7DF9B6', // Chroma Neon
          accent: '#FFD36B', // Reactor Gold (accent)
          background: '#1A2E2E', // Dark teal
          text: '#E8F5E9', // Light green
          emissive: '#7DF9B6' // Glowing neon
        },
        usage: 'Used when player chooses conservation, life-focused strategies, or balanced gameplay'
      },
      {
        name: 'Industrial (Exploit)',
        description: 'Represents technology, extraction, and exploitation',
        colors: {
          primary: '#263238', // Slate
          secondary: '#FFD36B', // Reactor Gold
          accent: '#FF7BA9', // Soft Pink (warning)
          background: '#1A1F23', // Dark slate
          text: '#ECEFF1', // Light gray
          emissive: '#FFD36B' // Glowing gold
        },
        usage: 'Used when player chooses exploitation, tech-focused strategies, or aggressive gameplay'
      },
      {
        name: 'Neutral (Balance)',
        description: 'Represents equilibrium and neutrality',
        colors: {
          primary: '#263238', // Slate
          secondary: '#6B6B6B', // Mid Gray
          accent: '#7DF9B6', // Subtle teal
          background: '#0B0C10', // Off Black
          text: '#FFFFFF', // White
          emissive: '#6ED3FF' // Glow Blue
        },
        usage: 'Default state, balanced gameplay, neutral choices'
      }
    ];
  }

  /**
   * Get iconography
   */
  private getIconography(): IconSet {
    return {
      name: 'Quaternion Icon System',
      description: 'Unique iconography that uses visual metaphors to represent game concepts',
      icons: [
        {
          id: 'bio_seed',
          name: 'Bio-Seed Sigil',
          description: 'Organic, pulsing icon representing life and growth',
          visualMetaphor: 'Veins = life, pulsing = heartbeat',
          usage: 'Represents Bio-Seeds, life resources, conservation choices'
        },
        {
          id: 'reactor',
          name: 'Reactor Core',
          description: 'Geometric, angular icon representing energy and technology',
          visualMetaphor: 'Lattice = structure, angular = industrial',
          usage: 'Represents energy, reactors, tech resources'
        },
        {
          id: 'quaternion',
          name: 'Quaternion Symbol',
          description: 'Four-part symbol representing the four axes',
          visualMetaphor: 'Four vectors = balance, convergence = unity',
          usage: 'Main game symbol, balance indicator, core concept'
        },
        {
          id: 'harvest',
          name: 'Harvest Icon',
          description: 'Extraction symbol with resource flow',
          visualMetaphor: 'Downward flow = extraction, angular = mechanical',
          usage: 'Harvest actions, resource extraction'
        },
        {
          id: 'conserve',
          name: 'Conserve Icon',
          description: 'Protection symbol with growth',
          visualMetaphor: 'Circle = protection, upward = growth',
          usage: 'Conservation actions, preservation choices'
        },
        {
          id: 'matter',
          name: 'Matter Icon',
          description: 'Crystalline structure',
          visualMetaphor: 'Crystals = solidity, structure = matter',
          usage: 'Matter resources, material concepts'
        },
        {
          id: 'energy',
          name: 'Energy Icon',
          description: 'Radiating waves',
          visualMetaphor: 'Waves = energy, radiating = power',
          usage: 'Energy resources, power concepts'
        },
        {
          id: 'life',
          name: 'Life Icon',
          description: 'Organic branching pattern',
          visualMetaphor: 'Branches = growth, organic = life',
          usage: 'Life resources, biological concepts'
        },
        {
          id: 'knowledge',
          name: 'Knowledge Icon',
          description: 'Neural network pattern',
          visualMetaphor: 'Network = connections, nodes = knowledge',
          usage: 'Knowledge resources, information concepts'
        },
        {
          id: 'kaiju',
          name: 'Kaiju Symbol',
          description: 'Threatening, massive creature silhouette',
          visualMetaphor: 'Size = threat, silhouette = mystery',
          usage: 'Kaiju events, major threats, boss encounters'
        }
      ]
    };
  }

  /**
   * Get typography
   */
  private getTypography(): Typography {
    return {
      primary: {
        name: 'Inter',
        usage: 'Primary UI text, readable and modern',
        characteristics: 'Clear, legible, good for UI elements and body text'
      },
      secondary: {
        name: 'Orbitron',
        usage: 'Sci-fi headings, titles, dramatic moments',
        characteristics: 'Futuristic, geometric, good for headings and emphasis'
      },
      sizes: {
        base: 16, // Desktop
        subtitle: 14, // Compact UI
        heading: 18, // Section headers
        title: 22 // Cinematic titles
      }
    };
  }

  /**
   * Get visual language description
   */
  private getVisualLanguage(): string {
    return `
Quaternion's visual language is built on the tension between two opposing forces:

**Biotic vs Industrial**: The game uses two dominant palettes that signal moral state:
- Biotic (muted greens, warm glows) = Conservation, life, growth
- Industrial (acid neon, cold chrome) = Exploitation, technology, extraction

**Visual Metaphors**:
- Veins = Life, growth, organic systems
- Lattice = Technology, structure, industrial systems
- Convergence = Balance, unity, the quaternion concept
- Pulsing = Living systems, dynamic state
- Angular = Mechanical, rigid, industrial

**Aesthetic Principles**:
- High contrast for legibility at small sizes
- Clear visual hierarchy (ground > walkable > resource > hazard > objective)
- Bioluminescent elements that pulse and react
- Clean vector art with glow accents for important elements
- Consistent iconography that tells stories through symbols
    `.trim();
  }

  /**
   * Get aesthetic principles
   */
  private getAestheticPrinciples(): string[] {
    return [
      'Every visual element supports the core theme: balance vs exploitation',
      'Color palette shifts dynamically based on player choices',
      'Resources have visual agency (pulsing, glowing, reacting)',
      'UI elements use holographic effects for sci-fi immersion',
      'Terrain tells stories through environmental storytelling',
      'Icons use consistent visual metaphors (veins = life, lattice = tech)',
      'High contrast ensures readability at all sizes',
      'Bioluminescent effects create living, breathing world feel'
    ];
  }

  /**
   * Generate judge-ready style guide document
   */
  generateStyleGuideDocument(): string {
    const guide = this.getStyleGuide();
    
    return `
# Quaternion Style Guide

## Color Palettes

${guide.palettes.map(palette => `
### ${palette.name}
**Description**: ${palette.description}

**Colors**:
- Primary: ${palette.colors.primary}
- Secondary: ${palette.colors.secondary}
- Accent: ${palette.colors.accent}
- Background: ${palette.colors.background}
- Text: ${palette.colors.text}
- Emissive: ${palette.colors.emissive}

**Usage**: ${palette.usage}
`).join('\n')}

## Iconography

${guide.iconography.icons.map(icon => `
### ${icon.name}
- **Visual Metaphor**: ${icon.visualMetaphor}
- **Usage**: ${icon.usage}
`).join('\n')}

## Typography

- **Primary Font**: ${guide.typography.primary.name} - ${guide.typography.primary.usage}
- **Secondary Font**: ${guide.typography.secondary.name} - ${guide.typography.secondary.usage}

**Sizes**:
- Base: ${guide.typography.sizes.base}px
- Subtitle: ${guide.typography.sizes.subtitle}px
- Heading: ${guide.typography.sizes.heading}px
- Title: ${guide.typography.sizes.title}px

## Visual Language

${guide.visualLanguage}

## Aesthetic Principles

${guide.aestheticPrinciples.map((principle, i) => `${i + 1}. ${principle}`).join('\n')}
    `.trim();
  }
}

