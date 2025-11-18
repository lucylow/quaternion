/**
 * Accessibility Manager
 * Ensures game meets accessibility requirements for Chroma Awards
 * Implements colorblind support, subtitles, keyboard navigation, etc.
 */

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  position: 'bottom' | 'top' | 'center';
  maxWidth: number;
}

export interface ColorblindConfig {
  enabled: boolean;
  type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  useSymbols: boolean;
  highContrast: boolean;
}

export interface KeyboardNavigationConfig {
  enabled: boolean;
  shortcuts: Map<string, string>; // key -> action
}

export class AccessibilityManager {
  private subtitleConfig: SubtitleConfig;
  private colorblindConfig: ColorblindConfig;
  private keyboardConfig: KeyboardNavigationConfig;
  private currentSubtitles: string[] = [];
  private subtitleElement: HTMLElement | null = null;

  constructor() {
    this.subtitleConfig = {
      enabled: true,
      fontSize: 18,
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textColor: '#ffffff',
      position: 'bottom',
      maxWidth: 800
    };

    this.colorblindConfig = {
      enabled: false,
      type: 'protanopia',
      useSymbols: true,
      highContrast: false
    };

    this.keyboardConfig = {
      enabled: true,
      shortcuts: new Map([
        ['Space', 'Pause/Resume'],
        ['M', 'Toggle Mute'],
        ['S', 'Toggle Subtitles'],
        ['C', 'Toggle Colorblind Mode'],
        ['H', 'Show Help'],
        ['Esc', 'Open Menu']
      ])
    };

    this.initializeSubtitles();
    this.initializeKeyboardNavigation();
  }

  /**
   * Initialize subtitle system
   */
  private initializeSubtitles(): void {
    // Create subtitle element
    this.subtitleElement = document.createElement('div');
    this.subtitleElement.id = 'game-subtitles';
    this.subtitleElement.style.cssText = `
      position: fixed;
      ${this.subtitleConfig.position}: 20px;
      left: 50%;
      transform: translateX(-50%);
      max-width: ${this.subtitleConfig.maxWidth}px;
      padding: 12px 24px;
      background: ${this.subtitleConfig.backgroundColor};
      color: ${this.subtitleConfig.textColor};
      font-size: ${this.subtitleConfig.fontSize}px;
      font-family: ${this.subtitleConfig.fontFamily};
      border-radius: 8px;
      text-align: center;
      z-index: 10000;
      display: ${this.subtitleConfig.enabled ? 'block' : 'none'};
      pointer-events: none;
      line-height: 1.5;
    `;
    document.body.appendChild(this.subtitleElement);
  }

  /**
   * Show subtitles
   */
  showSubtitles(text: string, duration: number = 3000): void {
    if (!this.subtitleConfig.enabled || !this.subtitleElement) return;

    this.currentSubtitles.push(text);
    this.updateSubtitleDisplay();

    // Auto-hide after duration
    setTimeout(() => {
      this.currentSubtitles = this.currentSubtitles.filter(t => t !== text);
      this.updateSubtitleDisplay();
    }, duration);
  }

  /**
   * Update subtitle display
   */
  private updateSubtitleDisplay(): void {
    if (!this.subtitleElement) return;

    if (this.currentSubtitles.length === 0) {
      this.subtitleElement.style.display = 'none';
      return;
    }

    this.subtitleElement.style.display = 'block';
    this.subtitleElement.textContent = this.currentSubtitles.join('\n');
  }

  /**
   * Toggle subtitles
   */
  toggleSubtitles(): void {
    this.subtitleConfig.enabled = !this.subtitleConfig.enabled;
    if (this.subtitleElement) {
      this.subtitleElement.style.display = this.subtitleConfig.enabled ? 'block' : 'none';
    }
    this.saveConfig();
  }

  /**
   * Initialize keyboard navigation
   */
  private initializeKeyboardNavigation(): void {
    if (!this.keyboardConfig.enabled) return;

    document.addEventListener('keydown', (e) => {
      const action = this.keyboardConfig.shortcuts.get(e.key);
      if (action) {
        this.handleKeyboardAction(action, e);
      }
    });
  }

  /**
   * Handle keyboard action
   */
  private handleKeyboardAction(action: string, event: KeyboardEvent): void {
    event.preventDefault();

    switch (action) {
      case 'Toggle Subtitles':
        this.toggleSubtitles();
        break;
      case 'Toggle Colorblind Mode':
        this.toggleColorblindMode();
        break;
      case 'Toggle Mute':
        // Dispatch custom event for game to handle
        window.dispatchEvent(new CustomEvent('accessibility-mute-toggle'));
        break;
      case 'Show Help':
        this.showHelp();
        break;
      case 'Open Menu':
        window.dispatchEvent(new CustomEvent('accessibility-menu-open'));
        break;
      case 'Pause/Resume':
        window.dispatchEvent(new CustomEvent('accessibility-pause-toggle'));
        break;
    }
  }

  /**
   * Toggle colorblind mode
   */
  toggleColorblindMode(): void {
    this.colorblindConfig.enabled = !this.colorblindConfig.enabled;
    this.applyColorblindFilters();
    this.saveConfig();
  }

  /**
   * Apply colorblind filters
   */
  private applyColorblindFilters(): void {
    const gameCanvas = document.querySelector('canvas');
    if (!gameCanvas) return;

    if (this.colorblindConfig.enabled) {
      const filter = this.getColorblindFilter(this.colorblindConfig.type);
      gameCanvas.style.filter = filter;
    } else {
      gameCanvas.style.filter = 'none';
    }
  }

  /**
   * Get colorblind filter CSS
   */
  private getColorblindFilter(type: ColorblindConfig['type']): string {
    // Simplified filters - in production, use proper color matrices
    const filters: Record<string, string> = {
      protanopia: 'contrast(1.2) saturate(0.8)',
      deuteranopia: 'contrast(1.2) saturate(0.8)',
      tritanopia: 'contrast(1.1) saturate(0.9)',
      achromatopsia: 'grayscale(1) contrast(1.5)'
    };
    return filters[type] || 'none';
  }

  /**
   * Show help dialog
   */
  private showHelp(): void {
    const helpText = Array.from(this.keyboardConfig.shortcuts.entries())
      .map(([key, action]) => `${key}: ${action}`)
      .join('\n');

    alert(`Keyboard Shortcuts:\n\n${helpText}`);
  }

  /**
   * Apply colorblind-friendly UI changes
   */
  applyColorblindFriendlyUI(): void {
    if (!this.colorblindConfig.useSymbols) return;

    // Add symbols to color-coded elements
    const resourceElements = document.querySelectorAll('[data-resource-type]');
    resourceElements.forEach((el) => {
      const type = el.getAttribute('data-resource-type');
      const symbol = this.getResourceSymbol(type || '');
      if (symbol && !el.textContent?.includes(symbol)) {
        el.textContent = `${symbol} ${el.textContent}`;
      }
    });
  }

  /**
   * Get resource symbol
   */
  private getResourceSymbol(type: string): string {
    const symbols: Record<string, string> = {
      matter: '⚫',
      energy: '⚡',
      life: '🌱',
      knowledge: '📚'
    };
    return symbols[type.toLowerCase()] || '';
  }

  /**
   * Save configuration
   */
  private saveConfig(): void {
    localStorage.setItem('accessibility-config', JSON.stringify({
      subtitles: this.subtitleConfig,
      colorblind: this.colorblindConfig,
      keyboard: {
        enabled: this.keyboardConfig.enabled
      }
    }));
  }

  /**
   * Load configuration
   */
  loadConfig(): void {
    const saved = localStorage.getItem('accessibility-config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        this.subtitleConfig = { ...this.subtitleConfig, ...config.subtitles };
        this.colorblindConfig = { ...this.colorblindConfig, ...config.colorblind };
        if (config.keyboard) {
          this.keyboardConfig.enabled = config.keyboard.enabled;
        }
      } catch (error) {
        console.warn('Failed to load accessibility config', error);
      }
    }
  }

  /**
   * Get subtitle config
   */
  getSubtitleConfig(): SubtitleConfig {
    return { ...this.subtitleConfig };
  }

  /**
   * Update subtitle config
   */
  updateSubtitleConfig(config: Partial<SubtitleConfig>): void {
    this.subtitleConfig = { ...this.subtitleConfig, ...config };
    this.saveConfig();
  }

  /**
   * Get colorblind config
   */
  getColorblindConfig(): ColorblindConfig {
    return { ...this.colorblindConfig };
  }

  /**
   * Update colorblind config
   */
  updateColorblindConfig(config: Partial<ColorblindConfig>): void {
    this.colorblindConfig = { ...this.colorblindConfig, ...config };
    this.applyColorblindFilters();
    this.saveConfig();
  }
}

