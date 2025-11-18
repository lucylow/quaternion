// src/audio/MusicManager.ts
import AudioManager from './AudioManager';

type Stem = { key: string, buffer?: AudioBuffer, source?: AudioBufferSourceNode, gain?: GainNode };

export default class MusicManager {
  private static _instance: MusicManager | null = null;
  static instance() { if (!this._instance) this._instance = new MusicManager(); return this._instance; }

  private stems: Record<string, Stem> = {}; // e.g., 'ambient','tension','triumph'
  private active = false;

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
      const src = ctx.createBufferSource();
      src.buffer = s.buffer;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0; // start silent for crossfade-in
      src.connect(gain);
      gain.connect(am.getMusicGainNode());
      src.start();
      s.source = src; s.gain = gain;
      // ramp up
      const now = ctx.currentTime;
      gain.gain.linearRampToValueAtTime(1.0, now + 1.2);
    });

    this.active = true;
  }

  // morph stems by policy object: { ambient:0.8, tension:0.2 }
  setStemVolumes(volumes: Record<string, number>, ramp = 0.5) {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    Object.entries(volumes).forEach(([id, v]) => {
      const s = this.stems[id];
      if (!s || !s.gain) return;
      s.gain.gain.cancelScheduledValues(now);
      s.gain.gain.setValueAtTime(s.gain.gain.value, now);
      s.gain.gain.linearRampToValueAtTime(v, now + ramp);
    });
  }

  stopAll() {
    Object.values(this.stems).forEach(s => {
      try { s.source?.stop(); } catch(e) { /* Ignore stop errors */ }
      try { s.gain?.disconnect(); } catch(e) { /* Ignore disconnect errors */ }
      s.source = undefined; s.gain = undefined;
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

