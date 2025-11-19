// AudioManager.ts
// Unified audio manager that uses Phaser sound when available, falls back to HTML5 Audio

export class AudioManager {
  phaserSoundManager: Phaser.Sound.BaseSoundManager | null = null;
  private htmlAudioCache: Map<string, HTMLAudioElement> = new Map();
  private phaserSoundFailed: Set<string> = new Set(); // Track sounds that failed in Phaser

  registerPhaser(soundManager: Phaser.Sound.BaseSoundManager) {
    this.phaserSoundManager = soundManager;
    this.phaserSoundFailed.clear(); // Reset failures when re-registering
  }

  private tryPhaserSound(soundKey: string, opts: { volume?: number; loop?: boolean } = {}): any | null {
    // Skip if we know this sound failed before
    if (this.phaserSoundFailed.has(soundKey)) {
      return null;
    }

    if (!this.phaserSoundManager) {
      return null;
    }

    try {
      // Check if sound exists in Phaser - try to get it first
      // Phaser sound manager has a 'get' method that returns null if sound doesn't exist
      const existingSound = (this.phaserSoundManager as any).get?.(soundKey);
      
      // Also check cache if available
      const scene = (this.phaserSoundManager as any).scene;
      const cache = scene?.cache?.audio;
      const soundExists = existingSound !== null && existingSound !== undefined;
      const cacheExists = cache ? cache.exists(soundKey) : true; // Assume exists if no cache available
      
      if (!soundExists && cache && !cacheExists) {
        // Sound not loaded in Phaser, mark as failed and fallback
        this.phaserSoundFailed.add(soundKey);
        return null;
      }

      // Try to play with Phaser
      if (this.phaserSoundManager.play) {
        const sound = this.phaserSoundManager.play(soundKey, {
          volume: opts.volume ?? 0.8,
          loop: opts.loop ?? false
        });
        
        // Check if play actually returned a valid sound
        // Phaser play() can return null/undefined if sound doesn't exist
        if (sound && typeof sound === 'object' && sound !== null) {
          // Verify it's actually a Phaser sound object
          if ('play' in sound || 'isPlaying' in sound || sound.constructor?.name?.includes('Sound')) {
            return sound;
          }
        }
        
        // If play returned null/undefined, sound doesn't exist
        this.phaserSoundFailed.add(soundKey);
        return null;
      }
    } catch (e) {
      console.warn(`AudioManager: Phaser sound '${soundKey}' failed, will use HTML5 fallback:`, e);
      this.phaserSoundFailed.add(soundKey);
    }

    return null;
  }

  play(soundKey: string, opts: { volume?: number; loop?: boolean } = {}): Promise<any> {
    // Try Phaser first
    const phaserSound = this.tryPhaserSound(soundKey, opts);
    if (phaserSound) {
      // Return a resolved promise for Phaser sounds (they start immediately)
      return Promise.resolve(phaserSound);
    }

    // Fallback: play file from /public/audio/...
    return this.playHTML5Audio(soundKey, opts);
  }

  private playHTML5Audio(soundKey: string, opts: { volume?: number; loop?: boolean } = {}): Promise<HTMLAudioElement> {
    const url = `/audio/${soundKey}.ogg`; // Try .ogg first
    const cached = this.htmlAudioCache.get(url);
    
    if (cached) {
      cached.currentTime = 0; // Reset to start
      cached.volume = opts.volume ?? 0.8;
      cached.loop = opts.loop ?? false;
      return cached.play().catch((err) => {
        console.warn(`AudioManager: HTMLAudio play failed for ${soundKey}, trying .mp3:`, err);
        // Try .mp3 if .ogg fails
        return this.tryMP3Fallback(soundKey, opts);
      }).then(() => cached);
    }

    const a = new Audio(url);
    a.volume = opts.volume ?? 0.8;
    a.loop = opts.loop ?? false;
    
    // Set up error handler before playing
    this.htmlAudioCache.set(url, a);
    return a.play().catch((err) => {
      console.warn(`AudioManager: HTMLAudio .ogg play failed for ${soundKey}, trying .mp3:`, err);
      // Try .mp3 if .ogg fails
      return this.tryMP3Fallback(soundKey, opts);
    }).then(() => a);
  }

  private tryMP3Fallback(soundKey: string, opts: { volume?: number; loop?: boolean } = {}): Promise<HTMLAudioElement> {
    const mp3Url = `/audio/${soundKey}.mp3`;
    const cached = this.htmlAudioCache.get(mp3Url);
    
    if (cached) {
      cached.currentTime = 0;
      cached.volume = opts.volume ?? 0.8;
      cached.loop = opts.loop ?? false;
      return cached.play().catch((err2) => {
        console.warn(`AudioManager: All audio formats failed for ${soundKey}:`, err2);
        throw err2; // Re-throw so caller knows it failed
      }).then(() => cached);
    }

    const mp3Audio = new Audio(mp3Url);
    mp3Audio.volume = opts.volume ?? 0.8;
    mp3Audio.loop = opts.loop ?? false;
    this.htmlAudioCache.set(mp3Url, mp3Audio);
    return mp3Audio.play().catch((err2) => {
      console.warn(`AudioManager: All audio formats failed for ${soundKey}:`, err2);
      throw err2; // Re-throw so caller knows it failed
    }).then(() => mp3Audio);
  }

  loop(soundKey: string, opts: { volume?: number } = {}) {
    // Try Phaser first
    if (!this.phaserSoundFailed.has(soundKey) && this.phaserSoundManager) {
      try {
        // Check if sound exists in Phaser
        const scene = (this.phaserSoundManager as any).scene;
        const cache = scene?.cache?.audio;
        const existingSound = (this.phaserSoundManager as any).get?.(soundKey);
        const soundExists = existingSound !== null && existingSound !== undefined;
        const cacheExists = cache ? cache.exists(soundKey) : true;
        
        if (soundExists || cacheExists) {
          if (this.phaserSoundManager.add) {
            const s = this.phaserSoundManager.add(soundKey, { 
              loop: true, 
              volume: opts.volume ?? 0.4 
            });
            if (s && typeof s === 'object' && s !== null) {
              s.play();
              return s;
            }
          }
        } else {
          // Sound not in cache, mark as failed
          this.phaserSoundFailed.add(soundKey);
        }
      } catch (e) {
        console.warn(`AudioManager: Phaser loop '${soundKey}' failed, using HTML5 fallback:`, e);
        this.phaserSoundFailed.add(soundKey);
      }
    }

    // Fallback HTML5 audio
    const url = `/audio/${soundKey}.ogg`;
    const cached = this.htmlAudioCache.get(url);
    
    if (cached) {
      cached.loop = true;
      cached.volume = opts.volume ?? 0.4;
      cached.play().catch((err) => {
        console.warn(`AudioManager: HTMLAudio loop failed for ${soundKey}, trying .mp3:`, err);
        this.tryMP3LoopFallback(soundKey, opts);
      });
      return cached;
    }

    const a = new Audio(url);
    a.loop = true;
    a.volume = opts.volume ?? 0.4;
    a.play().catch((err) => {
      console.warn(`AudioManager: HTMLAudio loop .ogg failed for ${soundKey}, trying .mp3:`, err);
      this.tryMP3LoopFallback(soundKey, opts);
    });
    this.htmlAudioCache.set(url, a);
    return a;
  }

  private tryMP3LoopFallback(soundKey: string, opts: { volume?: number } = {}) {
    const mp3Url = `/audio/${soundKey}.mp3`;
    const cached = this.htmlAudioCache.get(mp3Url);
    
    if (cached) {
      cached.loop = true;
      cached.volume = opts.volume ?? 0.4;
      cached.play().catch(() => {});
      return cached;
    }

    const mp3Audio = new Audio(mp3Url);
    mp3Audio.loop = true;
    mp3Audio.volume = opts.volume ?? 0.4;
    mp3Audio.play().catch(() => {});
    this.htmlAudioCache.set(mp3Url, mp3Audio);
    return mp3Audio;
  }

  stop(soundKey: string) {
    // Stop Phaser sound
    if (this.phaserSoundManager) {
      const sound = this.phaserSoundManager.get(soundKey);
      if (sound && sound.isPlaying) {
        sound.stop();
      }
    }

    // Stop HTML5 audio (try both .ogg and .mp3)
    const oggUrl = `/audio/${soundKey}.ogg`;
    const mp3Url = `/audio/${soundKey}.mp3`;
    
    const oggCached = this.htmlAudioCache.get(oggUrl);
    if (oggCached) {
      oggCached.pause();
      oggCached.currentTime = 0;
    }
    
    const mp3Cached = this.htmlAudioCache.get(mp3Url);
    if (mp3Cached) {
      mp3Cached.pause();
      mp3Cached.currentTime = 0;
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

