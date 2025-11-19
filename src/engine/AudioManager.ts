// AudioManager.ts
// Unified audio manager that uses Phaser sound when available, falls back to HTML5 Audio

export class AudioManager {
  phaserSoundManager: Phaser.Sound.BaseSoundManager | null = null;
  private htmlAudioCache: Map<string, HTMLAudioElement> = new Map();

  registerPhaser(soundManager: Phaser.Sound.BaseSoundManager) {
    this.phaserSoundManager = soundManager;
  }

  play(soundKey: string, opts: { volume?: number; loop?: boolean } = {}) {
    try {
      if (this.phaserSoundManager && this.phaserSoundManager.play) {
        const sound = this.phaserSoundManager.play(soundKey, {
          volume: opts.volume ?? 0.8,
          loop: opts.loop ?? false
        });
        return sound;
      }
    } catch (e) {
      console.warn('AudioManager: Phaser sound failed, fallback to HTMLAudio', e);
    }

    // Fallback: play file from /public/audio/...
    const url = `/audio/${soundKey}.ogg`; // Try .ogg first
    const cached = this.htmlAudioCache.get(url);
    
    if (cached) {
      cached.currentTime = 0; // Reset to start
      cached.volume = opts.volume ?? 0.8;
      cached.loop = opts.loop ?? false;
      cached.play().catch((err) => console.warn('AudioManager: HTMLAudio play fail', err));
      return cached;
    }

    const a = new Audio(url);
    a.volume = opts.volume ?? 0.8;
    a.loop = opts.loop ?? false;
    a.play().catch((err) => {
      // Try .mp3 if .ogg fails
      const mp3Url = `/audio/${soundKey}.mp3`;
      const mp3Audio = new Audio(mp3Url);
      mp3Audio.volume = opts.volume ?? 0.8;
      mp3Audio.loop = opts.loop ?? false;
      mp3Audio.play().catch((err2) => console.warn('AudioManager: Audio play fail', err2));
      this.htmlAudioCache.set(mp3Url, mp3Audio);
    });
    this.htmlAudioCache.set(url, a);
    return a;
  }

  loop(soundKey: string, opts: { volume?: number } = {}) {
    if (this.phaserSoundManager && this.phaserSoundManager.add) {
      const s = this.phaserSoundManager.add(soundKey, { 
        loop: true, 
        volume: opts.volume ?? 0.4 
      });
      s.play();
      return s;
    }

    // Fallback HTML5 audio
    const url = `/audio/${soundKey}.ogg`;
    const cached = this.htmlAudioCache.get(url);
    
    if (cached) {
      cached.loop = true;
      cached.volume = opts.volume ?? 0.4;
      cached.play().catch(() => {});
      return cached;
    }

    const a = new Audio(url);
    a.loop = true;
    a.volume = opts.volume ?? 0.4;
    a.play().catch(() => {
      // Try .mp3 fallback
      const mp3Url = `/audio/${soundKey}.mp3`;
      const mp3Audio = new Audio(mp3Url);
      mp3Audio.loop = true;
      mp3Audio.volume = opts.volume ?? 0.4;
      mp3Audio.play().catch(() => {});
      this.htmlAudioCache.set(mp3Url, mp3Audio);
    });
    this.htmlAudioCache.set(url, a);
    return a;
  }

  stop(soundKey: string) {
    // Stop Phaser sound
    if (this.phaserSoundManager) {
      const sound = this.phaserSoundManager.get(soundKey);
      if (sound && sound.isPlaying) {
        sound.stop();
      }
    }

    // Stop HTML5 audio
    const url = `/audio/${soundKey}.ogg`;
    const cached = this.htmlAudioCache.get(url);
    if (cached) {
      cached.pause();
      cached.currentTime = 0;
    }
  }

  stopAll() {
    // Stop all Phaser sounds
    if (this.phaserSoundManager) {
      this.phaserSoundManager.stopAll();
    }

    // Stop all HTML5 audio
    this.htmlAudioCache.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }
}

export const audioManager = new AudioManager();

