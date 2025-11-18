/**
 * ElevenLabs Audio Integration
 * Integrates ElevenLabs TTS into the game's audio system
 * Handles voice narration, commander dialogue, and advisor voices
 */

import { ElevenLabsIntegration } from '../ai/integrations/ElevenLabsIntegration';
import { AccessibilityManager } from '../game/compliance/AccessibilityManager';

export interface VoiceEvent {
  id: string;
  text: string;
  voiceId?: string;
  voiceProfile?: string;
  priority: 'low' | 'medium' | 'high';
  interruptible: boolean;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface VoiceQueueItem extends VoiceEvent {
  audioUrl?: string;
  audioElement?: HTMLAudioElement;
  status: 'pending' | 'loading' | 'playing' | 'completed' | 'error';
}

export class ElevenLabsAudioIntegration {
  private elevenLabs: ElevenLabsIntegration;
  private accessibility: AccessibilityManager;
  private voiceQueue: VoiceQueueItem[] = [];
  private currentlyPlaying: VoiceQueueItem | null = null;
  private audioContext: AudioContext | null = null;
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private voiceProfiles: Map<string, string> = new Map();

  constructor() {
    // Initialize ElevenLabs with cloud secret
    this.elevenLabs = new ElevenLabsIntegration({
      apiKey: process.env.ElevenLabs_API_key
    });

    // Initialize accessibility for subtitles
    this.accessibility = new AccessibilityManager();
    this.accessibility.loadConfig();

    // Initialize audio context
    this.initializeAudioContext();

    // Initialize voice profiles
    this.initializeVoiceProfiles();

    // Listen for mute events
    window.addEventListener('accessibility-mute-toggle', () => {
      this.toggleMute();
    });
  }

  /**
   * Initialize Web Audio API context
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported', error);
    }
  }

  /**
   * Initialize voice profiles for different characters
   */
  private initializeVoiceProfiles(): void {
    // Commander voices
    this.voiceProfiles.set('narrator', '21m00Tcm4TlvDq8ikWAM'); // Rachel
    this.voiceProfiles.set('economist', 'EXAVITQu4vr4xnSDxMaL'); // Bella
    this.voiceProfiles.set('biologist', 'ThT5KcBeYPX3keUQqHPh'); // Dorothy
    this.voiceProfiles.set('ascendant', 'VR6AewLTigWG4xSOukaG'); // Arnold
    this.voiceProfiles.set('engineer', 'pNInz6obpgDQGcFmaJgB'); // Adam
    this.voiceProfiles.set('quaternion', 'ThT5KcBeYPX3keUQqHPh'); // Dorothy (calm)
    this.voiceProfiles.set('corp', 'VR6AewLTigWG4xSOukaG'); // Arnold (aggressive)
    this.voiceProfiles.set('remnants', 'EXAVITQu4vr4xnSDxMaL'); // Bella (mysterious)
    this.voiceProfiles.set('ascendants', 'pNInz6obpgDQGcFmaJgB'); // Adam (transcendent)
  }

  /**
   * Play voice line
   */
  async playVoiceLine(
    text: string,
    voiceProfile: string = 'narrator',
    options?: {
      priority?: 'low' | 'medium' | 'high';
      interruptible?: boolean;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    const voiceId = this.voiceProfiles.get(voiceProfile) || this.voiceProfiles.get('narrator')!;

    const event: VoiceEvent = {
      id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      voiceId,
      voiceProfile,
      priority: options?.priority || 'medium',
      interruptible: options?.interruptible !== false,
      onComplete: options?.onComplete,
      onError: options?.onError
    };

    await this.queueVoiceEvent(event);
  }

  /**
   * Queue voice event
   */
  private async queueVoiceEvent(event: VoiceEvent): Promise<void> {
    const queueItem: VoiceQueueItem = {
      ...event,
      status: 'pending'
    };

    // Insert based on priority
    if (event.priority === 'high') {
      this.voiceQueue.unshift(queueItem);
    } else {
      this.voiceQueue.push(queueItem);
    }

    // Process queue
    this.processQueue();
  }

  /**
   * Process voice queue
   */
  private async processQueue(): Promise<void> {
    // If already playing and current item is not interruptible, wait
    if (this.currentlyPlaying && !this.currentlyPlaying.interruptible) {
      return;
    }

    // If queue is empty, return
    if (this.voiceQueue.length === 0) {
      return;
    }

    // Get next item
    const nextItem = this.voiceQueue.shift()!;
    this.currentlyPlaying = nextItem;

    try {
      await this.playVoiceItem(nextItem);
    } catch (error) {
      console.error('Voice playback error', error);
      nextItem.status = 'error';
      if (nextItem.onError) {
        nextItem.onError(error as Error);
      }
      this.currentlyPlaying = null;
      // Continue processing queue
      this.processQueue();
    }
  }

  /**
   * Play voice item
   */
  private async playVoiceItem(item: VoiceQueueItem): Promise<void> {
    item.status = 'loading';

    try {
      // Generate speech
      const audioUrl = await this.elevenLabs.generateSpeechBlob(
        item.text,
        item.voiceId,
        {
          stability: 0.6,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true
        }
      );

      item.audioUrl = audioUrl;

      // Show subtitles
      this.accessibility.showSubtitles(item.text, 0); // Duration will be set after audio loads

      // Create audio element
      const audio = new Audio(audioUrl);
      audio.volume = this.isMuted ? 0 : this.volume;

      // Set up event handlers
      audio.onloadedmetadata = () => {
        // Update subtitle duration
        const duration = audio.duration * 1000; // Convert to milliseconds
        this.accessibility.showSubtitles(item.text, duration);
      };

      audio.onplay = () => {
        item.status = 'playing';
      };

      audio.onended = () => {
        item.status = 'completed';
        this.currentlyPlaying = null;
        if (item.onComplete) {
          item.onComplete();
        }
        // Process next item
        this.processQueue();
      };

      audio.onerror = (error) => {
        item.status = 'error';
        this.currentlyPlaying = null;
        if (item.onError) {
          item.onError(new Error('Audio playback failed'));
        }
        this.processQueue();
      };

      item.audioElement = audio;

      // Play audio
      await audio.play();
    } catch (error) {
      item.status = 'error';
      this.currentlyPlaying = null;
      throw error;
    }
  }

  /**
   * Stop current voice
   */
  stopCurrentVoice(): void {
    if (this.currentlyPlaying?.audioElement) {
      this.currentlyPlaying.audioElement.pause();
      this.currentlyPlaying.audioElement.currentTime = 0;
      this.currentlyPlaying.status = 'completed';
      this.currentlyPlaying = null;
    }
    this.processQueue();
  }

  /**
   * Clear voice queue
   */
  clearQueue(): void {
    this.voiceQueue = [];
    this.stopCurrentVoice();
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentlyPlaying?.audioElement) {
      this.currentlyPlaying.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.currentlyPlaying?.audioElement) {
      this.currentlyPlaying.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
  }

  /**
   * Play narrator line
   */
  async playNarratorLine(text: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    await this.playVoiceLine(text, 'narrator', { priority });
  }

  /**
   * Play commander dialogue
   */
  async playCommanderDialogue(
    text: string,
    commanderName: string,
    priority: 'low' | 'medium' | 'high' = 'high'
  ): Promise<void> {
    await this.playVoiceLine(text, commanderName.toLowerCase(), { priority });
  }

  /**
   * Play advisor voice
   */
  async playAdvisorVoice(
    text: string,
    advisorType: 'economist' | 'biologist' | 'ascendant' | 'engineer',
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    await this.playVoiceLine(text, advisorType, { priority });
  }

  /**
   * Play faction voice
   */
  async playFactionVoice(
    text: string,
    factionId: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    await this.playVoiceLine(text, factionId, { priority });
  }

  /**
   * Pre-generate voice lines (for performance)
   */
  async pregenerateVoiceLines(
    lines: Array<{ text: string; voiceProfile: string }>
  ): Promise<void> {
    for (const line of lines) {
      try {
        const voiceId = this.voiceProfiles.get(line.voiceProfile) || this.voiceProfiles.get('narrator')!;
        await this.elevenLabs.generateSpeech(line.text, voiceId);
      } catch (error) {
        console.warn(`Failed to pre-generate voice line: ${line.text}`, error);
      }
    }
  }

  /**
   * Get current playing status
   */
  isPlaying(): boolean {
    return this.currentlyPlaying?.status === 'playing';
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.voiceQueue.length;
  }

  /**
   * Register custom voice profile
   */
  registerVoiceProfile(name: string, voiceId: string): void {
    this.voiceProfiles.set(name.toLowerCase(), voiceId);
    this.elevenLabs.registerVoiceProfile({
      voiceId,
      name,
      description: `Custom voice profile: ${name}`,
      settings: {
        stability: 0.6,
        similarityBoost: 0.75
      }
    });
  }
}

