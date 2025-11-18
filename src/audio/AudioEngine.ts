/**
 * Advanced Web Audio API Engine
 * Provides fine control over mixing, ducking, spatialization, and scheduled lip-sync
 */

export type AudioBufferMap = Record<string, AudioBuffer>;
export type DialogueLine = {
  id: string;
  url: string;
  text?: string;
  speaker?: string;
  visemes?: Array<{ time: number; viseme: string }>;
  duration?: number;
};

export type MusicStem = {
  id: string;
  url: string;
  volume: number;
  loop: boolean;
  buffer?: AudioBuffer;
  source?: AudioBufferSourceNode;
};

export type GameAudioState = {
  intensity: number; // 0 = calm, 1 = combat
  morality: number; // -1 = exploit, 1 = conserve
  instability: number; // 0-200
};

export default class AudioEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private musicGain: GainNode;
  private sfxGain: GainNode;
  private dialogGain: GainNode;
  private compressor: DynamicsCompressorNode;
  
  // Music stems for adaptive mixing
  private musicStems: Map<string, MusicStem> = new Map();
  private activeStems: Set<string> = new Set();
  
  // Buffers
  private buffers: AudioBufferMap = {};
  private sfxBuffers: AudioBufferMap = {};
  private dialogueBuffers: AudioBufferMap = {};
  
  // Current state
  private currentState: GameAudioState = {
    intensity: 0.3,
    morality: 0,
    instability: 0
  };
  
  // Volume levels
  private musicVolume = 0.7;
  private sfxVolume = 1.0;
  private dialogVolume = 1.0;
  
  // Dialogue ducking
  private isDucking = false;
  private duckTarget = 0.25;
  private originalMusicVolume = 0.7;

  constructor() {
    // Initialize AudioContext (handle browser prefixes)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Create gain nodes for mixing
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.dialogGain = this.ctx.createGain();
    
    // Create compressor for master bus
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    
    // Connect signal chain: channels -> master -> compressor -> destination
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.dialogGain.connect(this.master);
    this.master.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
    
    // Set initial volumes
    this.master.gain.value = 0.9; // Headroom
    this.musicGain.gain.value = this.musicVolume;
    this.sfxGain.gain.value = this.sfxVolume;
    this.dialogGain.gain.value = this.dialogVolume;
  }

  /**
   * Ensure audio context is started (required for autoplay policies)
   */
  async ensureStarted(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Load audio buffer from URL
   */
  async loadBuffer(key: string, url: string, category: 'music' | 'sfx' | 'dialogue' = 'sfx'): Promise<AudioBuffer> {
    const bufferMap = category === 'music' ? this.buffers : 
                     category === 'dialogue' ? this.dialogueBuffers : 
                     this.sfxBuffers;
    
    if (bufferMap[key]) return bufferMap[key];
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arrayBuffer);
      bufferMap[key] = buffer;
      return buffer;
    } catch (error) {
      console.error(`Failed to load audio buffer ${key} from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Load music stem
   */
  async loadMusicStem(stem: MusicStem): Promise<void> {
    const buffer = await this.loadBuffer(stem.id, stem.url, 'music');
    stem.buffer = buffer;
    this.musicStems.set(stem.id, stem);
  }

  /**
   * Play music stem
   */
  playMusicStem(stemId: string, fadeIn = 0.5): void {
    const stem = this.musicStems.get(stemId);
    if (!stem || !stem.buffer) {
      console.warn(`Music stem not loaded: ${stemId}`);
      return;
    }

    // Stop existing source if playing
    if (stem.source) {
      stem.source.stop();
    }

    const source = this.ctx.createBufferSource();
    source.buffer = stem.buffer;
    source.loop = stem.loop;
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0;
    source.connect(gainNode);
    gainNode.connect(this.musicGain);
    
    const now = this.ctx.currentTime;
    source.start(now);
    
    // Fade in
    gainNode.gain.linearRampToValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(stem.volume, now + fadeIn);
    
    stem.source = source;
    this.activeStems.add(stemId);
    
    // Handle loop end
    source.onended = () => {
      if (stem.loop && this.activeStems.has(stemId)) {
        this.playMusicStem(stemId, 0);
      }
    };
  }

  /**
   * Stop music stem
   */
  stopMusicStem(stemId: string, fadeOut = 0.5): void {
    const stem = this.musicStems.get(stemId);
    if (!stem || !stem.source) return;

    const gainNode = stem.source.context.createGain();
    const now = this.ctx.currentTime;
    
    gainNode.gain.value = stem.volume;
    gainNode.gain.linearRampToValueAtTime(0, now + fadeOut);
    
    stem.source.disconnect();
    stem.source.connect(gainNode);
    gainNode.connect(this.musicGain);
    
    setTimeout(() => {
      stem.source?.stop();
      this.activeStems.delete(stemId);
    }, fadeOut * 1000);
  }

  /**
   * Update adaptive music based on game state
   */
  updateAdaptiveMusic(state: Partial<GameAudioState>): void {
    this.currentState = { ...this.currentState, ...state };
    const { intensity, morality, instability } = this.currentState;
    
    // Map intensity to stem volumes
    // Calm: ambient only
    // Neutral: ambient + light rhythm
    // Combat: ambient + rhythm + combat accents
    
    const ambientVol = Math.max(0.3, 1 - intensity * 0.3);
    const rhythmVol = intensity > 0.3 ? (intensity - 0.3) * 1.4 : 0;
    const combatVol = intensity > 0.7 ? (intensity - 0.7) * 3.3 : 0;
    
    // Update stem volumes
    this.musicStems.forEach((stem, id) => {
      if (!stem.source) return;
      
      let targetVol = stem.volume;
      if (id.includes('ambient')) {
        targetVol = stem.volume * ambientVol;
      } else if (id.includes('rhythm')) {
        targetVol = stem.volume * rhythmVol;
      } else if (id.includes('combat')) {
        targetVol = stem.volume * combatVol;
      } else if (id.includes('harmony')) {
        // Morality affects harmony timbre (conserve = organic, exploit = industrial)
        targetVol = stem.volume * (1 - Math.abs(morality) * 0.2);
      }
      
      // Smooth volume transition
      const gainNode = stem.source.context.createGain();
      const now = this.ctx.currentTime;
      gainNode.gain.value = stem.volume;
      gainNode.gain.linearRampToValueAtTime(targetVol, now + 0.3);
      
      stem.source.disconnect();
      stem.source.connect(gainNode);
      gainNode.connect(this.musicGain);
    });
  }

  /**
   * Play SFX
   */
  playSFX(key: string, options: {
    volume?: number;
    pitch?: number;
    delay?: number;
    pan?: number;
  } = {}): AudioBufferSourceNode | null {
    const buffer = this.sfxBuffers[key];
    if (!buffer) {
      console.warn(`SFX buffer not found: ${key}`);
      return null;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    if (options.pitch !== undefined) {
      source.playbackRate.value = options.pitch;
    }
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = (options.volume ?? 1) * this.sfxVolume;
    source.connect(gainNode);
    
    // Add panning if specified
    if (options.pan !== undefined) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = options.pan;
      gainNode.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      gainNode.connect(this.sfxGain);
    }
    
    const startTime = this.ctx.currentTime + (options.delay ?? 0);
    source.start(startTime);
    
    return source;
  }

  /**
   * Duck music for dialogue
   */
  duckMusicFor(durationSeconds: number, targetGain = 0.25): void {
    if (this.isDucking) return;
    
    this.isDucking = true;
    this.originalMusicVolume = this.musicGain.gain.value;
    const now = this.ctx.currentTime;
    
    // Cancel any existing automation
    this.musicGain.gain.cancelScheduledValues(now);
    
    // Quick fade down
    this.musicGain.gain.linearRampToValueAtTime(this.originalMusicVolume, now);
    this.musicGain.gain.linearRampToValueAtTime(targetGain, now + 0.15);
    
    // Hold for duration
    this.musicGain.gain.linearRampToValueAtTime(targetGain, now + 0.15 + durationSeconds);
    
    // Return to original
    this.musicGain.gain.linearRampToValueAtTime(
      this.originalMusicVolume,
      now + 0.15 + durationSeconds + 0.4
    );
    
    // Reset ducking flag
    setTimeout(() => {
      this.isDucking = false;
    }, (durationSeconds + 0.55) * 1000);
  }

  /**
   * Play dialogue with lip-sync support
   */
  async playDialogue(
    line: DialogueLine,
    visemeCallback?: (viseme: string, time: number) => void
  ): Promise<void> {
    await this.ensureStarted();
    
    // Load buffer if not already loaded
    if (!this.dialogueBuffers[line.id]) {
      await this.loadBuffer(line.id, line.url, 'dialogue');
    }
    
    const buffer = this.dialogueBuffers[line.id];
    if (!buffer) {
      throw new Error(`Dialogue buffer not found: ${line.id}`);
    }
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.dialogGain);
    
    // Duck music for dialogue duration
    const duration = buffer.duration;
    this.duckMusicFor(duration, this.duckTarget);
    
    const startTime = this.ctx.currentTime + 0.05;
    source.start(startTime);
    
    // Schedule viseme callbacks for lip-sync
    if (line.visemes && visemeCallback) {
      line.visemes.forEach(viseme => {
        const triggerTime = startTime + viseme.time;
        const now = this.ctx.currentTime;
        const delay = Math.max(0, (triggerTime - now) * 1000);
        
        setTimeout(() => {
          visemeCallback(viseme.viseme, viseme.time);
        }, delay);
      });
    }
    
    // Return promise resolved when dialogue finishes
    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  }

  /**
   * Play TTS audio from ArrayBuffer
   */
  async playTtsArrayBuffer(
    audioBuffer: ArrayBuffer,
    options: {
      volume?: number;
      duckMusic?: boolean;
    } = {}
  ): Promise<{ id: string; stop: () => void }> {
    await this.ensureStarted();
    
    // Decode audio buffer
    const decodedBuffer = await this.ctx.decodeAudioData(audioBuffer.slice(0));
    
    // Duck music if requested
    if (options.duckMusic) {
      this.duckMusicFor(decodedBuffer.duration, this.duckTarget);
    }
    
    // Create source
    const source = this.ctx.createBufferSource();
    source.buffer = decodedBuffer;
    
    // Create gain node for volume control
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = (options.volume ?? 1.0) * this.dialogVolume;
    source.connect(gainNode);
    gainNode.connect(this.dialogGain);
    
    // Start playback
    const startTime = this.ctx.currentTime + 0.05;
    source.start(startTime);
    
    const playbackId = `tts_${Date.now()}_${Math.random()}`;
    
    return {
      id: playbackId,
      stop: () => {
        try {
          source.stop();
        } catch (e) {
          // Source may have already ended
        }
      }
    };
  }

  /**
   * Volume controls
   */
  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    this.musicGain.gain.value = this.musicVolume;
  }

  setSFXVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    this.sfxGain.gain.value = this.sfxVolume;
  }

  setDialogVolume(v: number): void {
    this.dialogVolume = Math.max(0, Math.min(1, v));
    this.dialogGain.gain.value = this.dialogVolume;
  }

  setMasterVolume(v: number): void {
    this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  /**
   * Get current volumes
   */
  getMusicVolume(): number { return this.musicVolume; }
  getSFXVolume(): number { return this.sfxVolume; }
  getDialogVolume(): number { return this.dialogVolume; }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.musicStems.forEach((stem, id) => {
      if (stem.source) {
        stem.source.stop();
        this.activeStems.delete(id);
      }
    });
  }

  /**
   * Pause/Resume context
   */
  suspend(): Promise<void> {
    return this.ctx.suspend();
  }

  resume(): Promise<void> {
    return this.ctx.resume();
  }
}

