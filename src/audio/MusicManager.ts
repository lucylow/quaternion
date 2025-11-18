// src/audio/MusicManager.ts
import AudioManager from './AudioManager';

type Stem = { 
  key: string, 
  buffer?: AudioBuffer, 
  source?: AudioBufferSourceNode, 
  gain?: GainNode,
  compressor?: DynamicsCompressorNode,
  eq?: {
    lowShelf: BiquadFilterNode;
    highShelf: BiquadFilterNode;
  }
};

export default class MusicManager {
  private static _instance: MusicManager | null = null;
  static instance() { if (!this._instance) this._instance = new MusicManager(); return this._instance; }

  private stems: Record<string, Stem> = {}; // e.g., 'ambient','tension','triumph'
  private active = false;
  private crossfadeTime = 1.5; // Default crossfade time in seconds

  private getAudioContext() {
    return AudioManager.instance().getAudioContext();
  }

  async loadStems(list: { id: string, url: string }[]) {
    const am = AudioManager.instance();
    await am.preload(list.map(x => ({ key: x.id, url: x.url })));
    list.forEach(x => {
      const buf = am.getBuffer(x.id);
      this.stems[x.id] = { key: x.id, buffer: buf };
    });
  }

  // start playing baseline stems (looped). Stems will be played via bufferSource + gain nodes.
  playBase(stemIds: string[]) {
    const am = AudioManager.instance();
    const ctx = this.getAudioContext();

    // stop existing stems
    this.stopAll();

    stemIds.forEach(id => {
      const s = this.stems[id];
      if (!s || !s.buffer) return;
      
      // Create source
      const src = ctx.createBufferSource();
      src.buffer = s.buffer;
      src.loop = true;

      // Create processing chain: EQ -> Compressor -> Gain
      const eq = {
        lowShelf: ctx.createBiquadFilter(),
        highShelf: ctx.createBiquadFilter()
      };
      eq.lowShelf.type = 'lowshelf';
      eq.lowShelf.frequency.value = 200;
      eq.lowShelf.gain.value = 0;
      eq.highShelf.type = 'highshelf';
      eq.highShelf.frequency.value = 4000;
      eq.highShelf.gain.value = 0;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 10;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.2;

      const gain = ctx.createGain();
      gain.gain.value = 0; // start silent for crossfade-in

      // Connect: source -> EQ -> compressor -> gain -> music output
      src.connect(eq.lowShelf);
      eq.lowShelf.connect(eq.highShelf);
      eq.highShelf.connect(compressor);
      compressor.connect(gain);
      gain.connect(am.getMusicGainNode());

      src.start();
      s.source = src;
      s.gain = gain;
      s.compressor = compressor;
      s.eq = eq;

      // Smooth ramp up
      const now = ctx.currentTime;
      gain.gain.linearRampToValueAtTime(1.0, now + this.crossfadeTime);
    });

    this.active = true;
  }

  // morph stems by policy object: { ambient:0.8, tension:0.2 }
  setStemVolumes(volumes: Record<string, number>, ramp?: number) {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const rampTime = ramp ?? this.crossfadeTime;
    
    Object.entries(volumes).forEach(([id, v]) => {
      const s = this.stems[id];
      if (!s || !s.gain) return;
      const clampedVolume = Math.max(0, Math.min(1, v));
      s.gain.gain.cancelScheduledValues(now);
      s.gain.gain.setValueAtTime(s.gain.gain.value, now);
      s.gain.gain.linearRampToValueAtTime(clampedVolume, now + rampTime);
    });
  }

  // Set EQ for a specific stem
  setStemEQ(stemId: string, low: number = 0, high: number = 0) {
    const s = this.stems[stemId];
    if (!s || !s.eq) return;
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    s.eq.lowShelf.gain.cancelScheduledValues(now);
    s.eq.lowShelf.gain.setValueAtTime(low, now);
    s.eq.highShelf.gain.cancelScheduledValues(now);
    s.eq.highShelf.gain.setValueAtTime(high, now);
  }

  // Set crossfade time
  setCrossfadeTime(time: number) {
    this.crossfadeTime = Math.max(0.1, Math.min(5.0, time));
  }

  stopAll() {
    Object.values(this.stems).forEach(s => {
      try { s.source?.stop(); } catch(e) {
        // Ignore stop errors
      }
      try { s.gain?.disconnect(); } catch(e) {
        // Ignore disconnect errors
      }
      try { s.compressor?.disconnect(); } catch(e) {
        // Ignore disconnect errors
      }
      try { s.eq?.lowShelf.disconnect(); } catch(e) {
        // Ignore disconnect errors
      }
      try { s.eq?.highShelf.disconnect(); } catch(e) {
        // Ignore disconnect errors
      }
      s.source = undefined; 
      s.gain = undefined;
      s.compressor = undefined;
      s.eq = undefined;
    });
    this.active = false;
  }

  // Example high-level: switch state by moral axis (-1 exploit -> +1 conserve)
  setMoralState(value: number) {
    // clamp -1..1
    const v = Math.max(-1, Math.min(1, value));
    // map to volumes
    // ambient grows with conserve, tension grows with exploit
    this.setStemVolumes({
      ambient: Math.max(0, 0.2 + 0.8 * (v > 0 ? v : 0)),
      tension: Math.max(0, 0.2 + 0.8 * (v < 0 ? -v : 0)),
      pulse: 0.3 + Math.abs(v) * 0.7
    });
  }

  isActive(): boolean {
    return this.active;
  }
}

