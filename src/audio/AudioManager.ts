// src/audio/AudioManager.ts

// TypeScript - central WebAudio manager for SFX, TTS playback, ducking, volume groups.

// Usage: await AudioManager.instance().init(); AudioManager.instance().playSfx('boom', { volume: 0.8 });

type AudioBufferMap = Record<string, AudioBuffer>;

type PlaybackHandle = { id: string, stop: () => void };

export default class AudioManager {
  private static _instance: AudioManager | null = null;
  public static instance() {
    if (!this._instance) this._instance = new AudioManager();
    return this._instance;
  }

  private audioCtx!: AudioContext;
  private masterGain!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private voiceGain!: GainNode;
  private analyser?: AnalyserNode;

  // Master processing chain
  private masterCompressor?: DynamicsCompressorNode;
  private masterEQ?: {
    lowShelf: BiquadFilterNode;
    midPeak: BiquadFilterNode;
    highShelf: BiquadFilterNode;
  };
  private masterReverb?: ConvolverNode;
  private masterReverbGain?: GainNode;
  private masterDelay?: DelayNode;
  private masterDelayGain?: GainNode;
  private masterDelayFeedback?: GainNode;

  private buffers: AudioBufferMap = {};
  private playingMusicHandle: { id: string; nodes: AudioNode[] } | null = null;

  private duckingGainTarget = 0.35; // voice priority reduces music to 35%
  private duckingDuration = 0.25; // seconds

  private nextId = 1;

  private constructor() { /* singleton */ }

  /**
   * Create reverb impulse response
   */
  private createReverbImpulse(ctx: AudioContext, duration: number = 2.0, decay: number = 2.0): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = length - i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      }
    }
    
    return impulse;
  }

  async init({ enableAnalyzer = false, enableMasterProcessing = true } = {}) {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Gains: master > (music, sfx, voice)
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 1;
    this.sfxGain = this.audioCtx.createGain(); this.sfxGain.gain.value = 1;
    this.musicGain = this.audioCtx.createGain(); this.musicGain.gain.value = 1;
    this.voiceGain = this.audioCtx.createGain(); this.voiceGain.gain.value = 1;

    // Mix all sources into a pre-master gain
    const preMasterGain = this.audioCtx.createGain();
    preMasterGain.gain.value = 1.0;
    this.sfxGain.connect(preMasterGain);
    this.musicGain.connect(preMasterGain);
    this.voiceGain.connect(preMasterGain);

    // Master processing chain (if enabled)
    let processingChain: AudioNode = preMasterGain;

    if (enableMasterProcessing) {
      // Compressor for dynamic range control
      this.masterCompressor = this.audioCtx.createDynamicsCompressor();
      this.masterCompressor.threshold.value = -24; // dB
      this.masterCompressor.knee.value = 30; // dB
      this.masterCompressor.ratio.value = 12; // 12:1 ratio
      this.masterCompressor.attack.value = 0.003; // 3ms attack
      this.masterCompressor.release.value = 0.25; // 250ms release
      processingChain.connect(this.masterCompressor);
      processingChain = this.masterCompressor;

      // 3-band EQ
      this.masterEQ = {
        lowShelf: this.audioCtx.createBiquadFilter(),
        midPeak: this.audioCtx.createBiquadFilter(),
        highShelf: this.audioCtx.createBiquadFilter()
      };

      // Low shelf (bass)
      this.masterEQ.lowShelf.type = 'lowshelf';
      this.masterEQ.lowShelf.frequency.value = 250;
      this.masterEQ.lowShelf.gain.value = 0; // No boost/cut by default

      // Mid peak (mids)
      this.masterEQ.midPeak.type = 'peaking';
      this.masterEQ.midPeak.frequency.value = 2000;
      this.masterEQ.midPeak.Q.value = 1.0;
      this.masterEQ.midPeak.gain.value = 0;

      // High shelf (treble)
      this.masterEQ.highShelf.type = 'highshelf';
      this.masterEQ.highShelf.frequency.value = 5000;
      this.masterEQ.highShelf.gain.value = 0;

      // Chain EQ
      processingChain.connect(this.masterEQ.lowShelf);
      this.masterEQ.lowShelf.connect(this.masterEQ.midPeak);
      this.masterEQ.midPeak.connect(this.masterEQ.highShelf);
      processingChain = this.masterEQ.highShelf;

      // Delay for depth (parallel)
      this.masterDelay = this.audioCtx.createDelay(0.5);
      this.masterDelay.delayTime.value = 0.1; // 100ms delay
      this.masterDelayGain = this.audioCtx.createGain();
      this.masterDelayGain.gain.value = 0.15; // Subtle delay
      this.masterDelayFeedback = this.audioCtx.createGain();
      this.masterDelayFeedback.gain.value = 0.3; // Feedback amount

      // Delay routing
      processingChain.connect(this.masterDelay);
      this.masterDelay.connect(this.masterDelayGain);
      this.masterDelay.connect(this.masterDelayFeedback);
      this.masterDelayFeedback.connect(this.masterDelay); // Feedback loop
      this.masterDelayGain.connect(this.masterGain);

      // Reverb for space (parallel)
      this.masterReverb = this.audioCtx.createConvolver();
      this.masterReverb.buffer = this.createReverbImpulse(this.audioCtx, 1.8, 2.2);
      this.masterReverbGain = this.audioCtx.createGain();
      this.masterReverbGain.gain.value = 0.12; // Subtle reverb

      processingChain.connect(this.masterReverb);
      this.masterReverb.connect(this.masterReverbGain);
      this.masterReverbGain.connect(this.masterGain);
    }

    // Connect processing chain to master gain
    processingChain.connect(this.masterGain);
    this.masterGain.connect(this.audioCtx.destination);

    if (enableAnalyzer) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.masterGain.connect(this.analyser);
    }
  }

  // loadBuffer: load one audio file (ogg/wav/webm)
  async loadBuffer(key: string, url: string) {
    if (this.buffers[key]) return;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch audio ${url}`);
    const arr = await resp.arrayBuffer();
    const buf = await this.audioCtx.decodeAudioData(arr.slice(0)); // decode copy
    this.buffers[key] = buf;
  }

  // preload many assets (useful at loading screen)
  async preload(list: { key: string, url: string }[]) {
    await Promise.all(list.map(x => this.loadBuffer(x.key, x.url)));
  }

  // play SFX by key (buffer must be loaded)
  playSfx(key: string, opts: { volume?: number, loop?: boolean } = {}): PlaybackHandle {
    const buf = this.buffers[key];
    if (!buf) { console.warn('Missing sfx', key); return { id: '0', stop: () => {} }; }
    const src = this.audioCtx.createBufferSource();
    src.buffer = buf;
    if (opts.loop) src.loop = true;
    const gain = this.audioCtx.createGain();
    gain.gain.value = typeof opts.volume === 'number' ? opts.volume : 1;
    src.connect(gain);
    gain.connect(this.sfxGain);

    const id = `sfx-${this.nextId++}`;
    src.start();
    const stop = () => {
      try { src.stop(); } catch(e){/*ignore*/ }
      src.disconnect();
      gain.disconnect();
    };
    // clean up on ended
    src.onended = () => { gain.disconnect(); src.disconnect(); };
    return { id, stop };
  }

  // play raw AudioBuffer (for TTS response)
  playBuffer(buf: AudioBuffer, opts: { volume?: number } = {}): PlaybackHandle {
    const src = this.audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = this.audioCtx.createGain();
    gain.gain.value = typeof opts.volume === 'number' ? opts.volume : 1;
    src.connect(gain);
    gain.connect(this.voiceGain);
    src.start();
    const id = `buf-${this.nextId++}`;
    const stop = () => {
      try { src.stop(); } catch(e) {}
      src.disconnect(); gain.disconnect();
    };
    src.onended = () => { gain.disconnect(); src.disconnect(); };
    return { id, stop };
  }

  // TTS streaming helper: given ArrayBuffer of audio data (ogg/wav), decode -> play
  async playTtsArrayBuffer(arr: ArrayBuffer, opts: { volume?: number, duckMusic?: boolean } = {}) {
    const audioBuf = await this.audioCtx.decodeAudioData(arr.slice(0));
    if (opts.duckMusic) this.duckMusic(true);
    const handle = this.playBuffer(audioBuf, { volume: opts.volume ?? 1 });
    // when finished, restore music
    // note: buffer.samplingRate may differ; we rely on onended handler in playBuffer
    // We'll schedule an unduck after estimated duration
    const seconds = audioBuf.duration || 0;
    setTimeout(() => this.duckMusic(false), (seconds + 0.05) * 1000);
    return handle;
  }

  // duck/un-duck music (smooth)
  duckMusic(enable: boolean) {
    const now = this.audioCtx.currentTime;
    const to = enable ? this.duckingGainTarget : 1.0;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(to, now + this.duckingDuration);
  }

  // Music control helpers (connect external nodes; MusicManager uses this.musicGain)
  getMusicGainNode() { return this.musicGain; }
  getSfxGainNode() { return this.sfxGain; }
  getVoiceGainNode() { return this.voiceGain; }

  // global set volumes
  setMasterVolume(v: number) { this.masterGain.gain.value = v; }
  setSfxVolume(v: number) { this.sfxGain.gain.value = v; }
  setMusicVolume(v: number) { this.musicGain.gain.value = v; }
  setVoiceVolume(v: number) { this.voiceGain.gain.value = v; }

  // Master EQ controls
  setMasterEQ(low: number = 0, mid: number = 0, high: number = 0) {
    if (!this.masterEQ) return;
    const now = this.audioCtx.currentTime;
    this.masterEQ.lowShelf.gain.cancelScheduledValues(now);
    this.masterEQ.lowShelf.gain.setValueAtTime(low, now);
    this.masterEQ.midPeak.gain.cancelScheduledValues(now);
    this.masterEQ.midPeak.gain.setValueAtTime(mid, now);
    this.masterEQ.highShelf.gain.cancelScheduledValues(now);
    this.masterEQ.highShelf.gain.setValueAtTime(high, now);
  }

  // Master reverb control
  setMasterReverb(amount: number) {
    if (!this.masterReverbGain) return;
    const now = this.audioCtx.currentTime;
    this.masterReverbGain.gain.cancelScheduledValues(now);
    this.masterReverbGain.gain.setValueAtTime(Math.max(0, Math.min(1, amount)), now);
  }

  // Master delay control
  setMasterDelay(time: number, feedback: number = 0.3) {
    if (!this.masterDelay || !this.masterDelayFeedback) return;
    const now = this.audioCtx.currentTime;
    this.masterDelay.delayTime.cancelScheduledValues(now);
    this.masterDelay.delayTime.setValueAtTime(Math.max(0, Math.min(0.5, time)), now);
    this.masterDelayFeedback.gain.cancelScheduledValues(now);
    this.masterDelayFeedback.gain.setValueAtTime(Math.max(0, Math.min(0.9, feedback)), now);
  }

  // crossfade helper (from current music to new node)
  async crossfadeToNewMusicNode(createNodeCb: (ctx: AudioContext) => AudioNode, crossfadeTime = 1.0) {
    const now = this.audioCtx.currentTime;
    // fade out current
    if (this.playingMusicHandle) {
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.0, now + crossfadeTime);
      // schedule stop after crossfade
      setTimeout(() => {
        if (this.playingMusicHandle) {
          this.playingMusicHandle.nodes.forEach(n => {
            try { (n as any).disconnect?.(); } catch(e) {}
          });
          this.playingMusicHandle = null;
        }
      }, (crossfadeTime + 0.1) * 1000);
    }

    // create new node & connect to musicGain
    const node = createNodeCb(this.audioCtx);
    node.connect(this.musicGain);
    this.musicGain.gain.setValueAtTime(0.0, now);
    this.musicGain.gain.linearRampToValueAtTime(1.0, now + crossfadeTime);
    const id = `music-${this.nextId++}`;
    this.playingMusicHandle = { id, nodes: [node] };
    return id;
  }

  // Expose audio context for advanced usage
  getAudioContext() {
    return this.audioCtx;
  }

  // Expose buffers for MusicManager access
  getBuffer(key: string): AudioBuffer | undefined {
    return this.buffers[key];
  }

  /**
   * Update listener position for 3D spatial audio
   * Call this from the game loop with camera position
   */
  setListenerPosition(x: number, y: number, z: number = 0): void {
    if (!this.audioCtx || !this.audioCtx.listener) return;
    
    const listener = this.audioCtx.listener;
    
    // Update position (using legacy API for compatibility)
    if ((listener as any).positionX) {
      // Modern API
      (listener as any).positionX.value = x;
      (listener as any).positionY.value = y;
      (listener as any).positionZ.value = z;
    } else if ((listener as any).setPosition) {
      // Legacy API
      (listener as any).setPosition(x, y, z);
    }
  }

  /**
   * Update listener orientation for 3D spatial audio
   * Forward vector and up vector for proper 3D audio
   */
  setListenerOrientation(
    forwardX: number, forwardY: number, forwardZ: number,
    upX: number = 0, upY: number = 0, upZ: number = 1
  ): void {
    if (!this.audioCtx || !this.audioCtx.listener) return;
    
    const listener = this.audioCtx.listener;
    
    // Update orientation (using legacy API for compatibility)
    if ((listener as any).forwardX) {
      // Modern API
      (listener as any).forwardX.value = forwardX;
      (listener as any).forwardY.value = forwardY;
      (listener as any).forwardZ.value = forwardZ;
      (listener as any).upX.value = upX;
      (listener as any).upY.value = upY;
      (listener as any).upZ.value = upZ;
    } else if ((listener as any).setOrientation) {
      // Legacy API
      (listener as any).setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
    }
  }
}

