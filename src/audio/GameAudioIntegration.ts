/**
 * Game Audio Integration
 * Connects ElevenLabs audio to game events
 * Handles voice narration for game events, commander dialogue, and narrative events
 */

import { ElevenLabsAudioIntegration } from './ElevenLabsAudioIntegration';
import { EnhancedNarrativeSystem } from '../game/narrative/EnhancedNarrativeSystem';

export interface GameAudioEvent {
  type: 'narrative' | 'commander' | 'advisor' | 'faction' | 'terrain' | 'victory' | 'defeat';
  text: string;
  context?: any;
}

export class GameAudioIntegration {
  private audioIntegration: ElevenLabsAudioIntegration;
  private narrativeSystem?: EnhancedNarrativeSystem;
  private eventListeners: Map<string, ((event: GameAudioEvent) => void)[]> = new Map();

  constructor(narrativeSystem?: EnhancedNarrativeSystem) {
    this.audioIntegration = new ElevenLabsAudioIntegration();
    this.narrativeSystem = narrativeSystem;

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for game events
   */
  private setupEventListeners(): void {
    // Listen for game events
    window.addEventListener('game-narrative-event', ((e: CustomEvent<GameAudioEvent>) => {
      this.handleGameEvent(e.detail);
    }) as EventListener);

    window.addEventListener('game-commander-dialogue', ((e: CustomEvent<GameAudioEvent>) => {
      this.handleCommanderDialogue(e.detail);
    }) as EventListener);

    window.addEventListener('game-advisor-voice', ((e: CustomEvent<GameAudioEvent>) => {
      this.handleAdvisorVoice(e.detail);
    }) as EventListener);

    window.addEventListener('game-terrain-event', ((e: CustomEvent<GameAudioEvent>) => {
      this.handleTerrainEvent(e.detail);
    }) as EventListener);

    window.addEventListener('game-victory', ((e: CustomEvent<GameAudioEvent>) => {
      this.handleVictory(e.detail);
    }) as EventListener);

    window.addEventListener('game-defeat', ((e: CustomEvent<GameAudioEvent>) => {
      this.handleDefeat(e.detail);
    }) as EventListener);
  }

  /**
   * Handle narrative event
   */
  private async handleNarrativeEvent(event: GameAudioEvent): Promise<void> {
    await this.audioIntegration.playNarratorLine(event.text, 'medium');
  }

  /**
   * Handle commander dialogue
   */
  private async handleCommanderDialogue(event: GameAudioEvent): Promise<void> {
    const commanderName = event.context?.commanderName || 'narrator';
    await this.audioIntegration.playCommanderDialogue(event.text, commanderName, 'high');
  }

  /**
   * Handle advisor voice
   */
  private async handleAdvisorVoice(event: GameAudioEvent): Promise<void> {
    const advisorType = event.context?.advisorType || 'economist';
    await this.audioIntegration.playAdvisorVoice(
      event.text,
      advisorType as 'economist' | 'biologist' | 'ascendant' | 'engineer',
      'medium'
    );
  }

  /**
   * Handle terrain event
   */
  private async handleTerrainEvent(event: GameAudioEvent): Promise<void> {
    await this.audioIntegration.playNarratorLine(event.text, 'low');
  }

  /**
   * Handle victory
   */
  private async handleVictory(event: GameAudioEvent): Promise<void> {
    await this.audioIntegration.playNarratorLine(event.text, 'high');
  }

  /**
   * Handle defeat
   */
  private async handleDefeat(event: GameAudioEvent): Promise<void> {
    await this.audioIntegration.playNarratorLine(event.text, 'high');
  }

  /**
   * Handle generic game event
   */
  private async handleGameEvent(event: GameAudioEvent): Promise<void> {
    switch (event.type) {
      case 'narrative':
        await this.handleNarrativeEvent(event);
        break;
      case 'commander':
        await this.handleCommanderDialogue(event);
        break;
      case 'advisor':
        await this.handleAdvisorVoice(event);
        break;
      case 'terrain':
        await this.handleTerrainEvent(event);
        break;
      case 'victory':
        await this.handleVictory(event);
        break;
      case 'defeat':
        await this.handleDefeat(event);
        break;
      default:
        await this.audioIntegration.playNarratorLine(event.text, 'medium');
    }
  }

  /**
   * Play narrative event with voice
   */
  async playNarrativeEvent(narrativeText: string, voiceProfile?: string): Promise<void> {
    await this.audioIntegration.playVoiceLine(
      narrativeText,
      voiceProfile || 'narrator',
      { priority: 'medium' }
    );
  }

  /**
   * Play commander dialogue
   */
  async playCommanderDialogue(text: string, commanderName: string): Promise<void> {
    await this.audioIntegration.playCommanderDialogue(text, commanderName, 'high');
  }

  /**
   * Play advisor voice
   */
  async playAdvisorVoice(
    text: string,
    advisorType: 'economist' | 'biologist' | 'ascendant' | 'engineer'
  ): Promise<void> {
    await this.audioIntegration.playAdvisorVoice(text, advisorType, 'medium');
  }

  /**
   * Play faction voice
   */
  async playFactionVoice(text: string, factionId: string): Promise<void> {
    await this.audioIntegration.playFactionVoice(text, factionId, 'medium');
  }

  /**
   * Play terrain event narration
   */
  async playTerrainEvent(text: string): Promise<void> {
    await this.audioIntegration.playNarratorLine(text, 'low');
  }

  /**
   * Play victory narration
   */
  async playVictoryNarration(text: string): Promise<void> {
    await this.audioIntegration.playNarratorLine(text, 'high');
  }

  /**
   * Play defeat narration
   */
  async playDefeatNarration(text: string): Promise<void> {
    await this.audioIntegration.playNarratorLine(text, 'high');
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.audioIntegration.clearQueue();
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.audioIntegration.setVolume(volume);
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.audioIntegration.toggleMute();
  }

  /**
   * Get audio integration instance
   */
  getAudioIntegration(): ElevenLabsAudioIntegration {
    return this.audioIntegration;
  }

  /**
   * Dispatch game event for voice
   */
  dispatchGameEvent(type: GameAudioEvent['type'], text: string, context?: any): void {
    const event = new CustomEvent(`game-${type}`, {
      detail: { type, text, context } as GameAudioEvent
    });
    window.dispatchEvent(event);
  }
}

