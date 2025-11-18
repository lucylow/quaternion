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

  private buffers: AudioBufferMap = {};
  private playingMusicHandle: { id: string; nodes: AudioNode[] } | null = null;

  private duckingGainTarget = 0.35; // voice priority reduces music to 35%
  private duckingDuration = 0.25; // seconds

  private nextId = 1;

  private constructor() { /* singleton */ }

  async init({ enableAnalyzer = false } = {}) {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Gains: master > (music, sfx, voice)
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 1;
    this.sfxGain = this.audioCtx.createGain(); this.sfxGain.gain.value = 1;
    this.musicGain = this.audioCtx.createGain(); this.musicGain.gain.value = 1;
    this.voiceGain = this.audioCtx.createGain(); this.voiceGain.gain.value = 1;

    // Routing
    this.sfxGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.voiceGain.connect(this.masterGain);
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
}

