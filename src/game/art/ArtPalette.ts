/**
 * Quaternion Art Palette
 * Fourfold thematic visual palette for each Quaternion axis
 */

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface ColorHex {
  hex: string;
  alpha?: number;
}

export interface ArtPalette {
  base: ColorRGB;
  accent: ColorRGB;
  dark: ColorRGB;
  light: ColorRGB;
  emissive: ColorRGB;
}

export class QuaternionArtPalette {
  // Matter: Industrial steel blues and grays with mechanical textures
  static readonly MATTER: ArtPalette = {
    base: { r: 0.12, g: 0.23, b: 0.31 }, // Steel blue
    accent: { r: 0.6, g: 0.7, b: 0.8 }, // Light steel
    dark: { r: 0.05, g: 0.1, b: 0.15 }, // Dark steel
    light: { r: 0.8, g: 0.85, b: 0.9 }, // Bright steel
    emissive: { r: 0.4, g: 0.6, b: 0.9 } // Electric blue
  };

  // Energy: Intense warm hues like fiery reds, electric oranges
  static readonly ENERGY: ArtPalette = {
    base: { r: 0.35, g: 0.05, b: 0.02 }, // Dark red
    accent: { r: 1.0, g: 0.45, b: 0.02 }, // Orange
    dark: { r: 0.15, g: 0.02, b: 0.01 }, // Deep red
    light: { r: 1.0, g: 0.7, b: 0.3 }, // Bright orange
    emissive: { r: 1.0, g: 0.6, b: 0.1 } // Fire orange
  };

  // Life: Earthy greens and browns, organic shapes
  static readonly LIFE: ArtPalette = {
    base: { r: 0.06, g: 0.3, b: 0.12 }, // Dark green
    accent: { r: 0.48, g: 0.98, b: 0.65 }, // Bioluminescent green
    dark: { r: 0.03, g: 0.15, b: 0.06 }, // Deep green
    light: { r: 0.6, g: 1.0, b: 0.7 }, // Bright green
    emissive: { r: 0.3, g: 1.0, b: 0.5 } // Glowing green
  };

  // Knowledge: Futuristic neon blues and purples, glowing circuitry
  static readonly KNOWLEDGE: ArtPalette = {
    base: { r: 0.03, g: 0.08, b: 0.18 }, // Deep blue
    accent: { r: 0.45, g: 0.64, b: 1.0 }, // Neon blue
    dark: { r: 0.01, g: 0.03, b: 0.08 }, // Very dark blue
    light: { r: 0.6, g: 0.75, b: 1.0 }, // Light blue
    emissive: { r: 0.4, g: 0.7, b: 1.0 } // Bright cyan
  };

  // Neutral palette for balanced states
  static readonly NEUTRAL: ArtPalette = {
    base: { r: 0.2, g: 0.2, b: 0.2 }, // Gray
    accent: { r: 0.5, g: 0.5, b: 0.5 }, // Light gray
    dark: { r: 0.1, g: 0.1, b: 0.1 }, // Dark gray
    light: { r: 0.7, g: 0.7, b: 0.7 }, // Light gray
    emissive: { r: 0.5, g: 0.5, b: 0.5 } // Gray glow
  };

  /**
   * Convert RGB to Phaser color integer
   */
  static toPhaserColor(color: ColorRGB): number {
    return Phaser.Display.Color.GetColor32(
      Math.floor(color.r * 255),
      Math.floor(color.g * 255),
      Math.floor(color.b * 255),
      color.a !== undefined ? Math.floor(color.a * 255) : 255
    );
  }

  /**
   * Convert RGB to hex string
   */
  static toHex(color: ColorRGB): string {
    const r = Math.floor(color.r * 255).toString(16).padStart(2, '0');
    const g = Math.floor(color.g * 255).toString(16).padStart(2, '0');
    const b = Math.floor(color.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  /**
   * Convert RGB to CSS rgba string
   */
  static toRGBA(color: ColorRGB): string {
    return `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${color.a !== undefined ? color.a : 1})`;
  }

  /**
   * Get palette by quaternion axis name
   */
  static getPalette(axis: 'matter' | 'energy' | 'life' | 'knowledge' | 'neutral'): ArtPalette {
    switch (axis.toLowerCase()) {
      case 'matter':
        return this.MATTER;
      case 'energy':
        return this.ENERGY;
      case 'life':
        return this.LIFE;
      case 'knowledge':
        return this.KNOWLEDGE;
      default:
        return this.NEUTRAL;
    }
  }

  /**
   * Blend two palettes based on dominance
   */
  static blendPalettes(
    palette1: ArtPalette,
    palette2: ArtPalette,
    ratio: number // 0-1, where 0 = palette1, 1 = palette2
  ): ArtPalette {
    const blendColor = (c1: ColorRGB, c2: ColorRGB): ColorRGB => ({
      r: c1.r * (1 - ratio) + c2.r * ratio,
      g: c1.g * (1 - ratio) + c2.g * ratio,
      b: c1.b * (1 - ratio) + c2.b * ratio,
      a: c1.a !== undefined && c2.a !== undefined
        ? c1.a * (1 - ratio) + c2.a * ratio
        : undefined
    });

    return {
      base: blendColor(palette1.base, palette2.base),
      accent: blendColor(palette1.accent, palette2.accent),
      dark: blendColor(palette1.dark, palette2.dark),
      light: blendColor(palette1.light, palette2.light),
      emissive: blendColor(palette1.emissive, palette2.emissive)
    };
  }

  /**
   * Get palette based on resource dominance
   */
  static getPaletteFromResources(resources: {
    matter?: number;
    energy?: number;
    life?: number;
    knowledge?: number;
  }): ArtPalette {
    const total = (resources.matter || 0) + (resources.energy || 0) + 
                  (resources.life || 0) + (resources.knowledge || 0);
    
    if (total === 0) return this.NEUTRAL;

    const matterRatio = (resources.matter || 0) / total;
    const energyRatio = (resources.energy || 0) / total;
    const lifeRatio = (resources.life || 0) / total;
    const knowledgeRatio = (resources.knowledge || 0) / total;

    // Find dominant resource
    const ratios = [
      { axis: 'matter', ratio: matterRatio },
      { axis: 'energy', ratio: energyRatio },
      { axis: 'life', ratio: lifeRatio },
      { axis: 'knowledge', ratio: knowledgeRatio }
    ];

    ratios.sort((a, b) => b.ratio - a.ratio);
    const dominant = ratios[0];

    if (dominant.ratio < 0.4) {
      // No clear dominant, blend
      const second = ratios[1];
      return this.blendPalettes(
        this.getPalette(dominant.axis as any),
        this.getPalette(second.axis as any),
        second.ratio / (dominant.ratio + second.ratio)
      );
    }

    return this.getPalette(dominant.axis as any);
  }
}

// Export for use in Phaser scenes
export default QuaternionArtPalette;


