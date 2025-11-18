// src/utils/audioManager.ts
import { Howl, Howler } from 'howler';

/**
 * Central audio manager
 * - holds background music, sfx map, and VO queue
 * - supports preloading and caching remote VO urls
 */
type SFXKey = 'click' | 'select' | 'confirm' | string;

class AudioManager {
  private bg?: Howl;
  private sfxMap = new Map<SFXKey, Howl>();
  private voQueue: string[] = []; // URLs
  private voPlaying = false;

  init() {
    // global Howler mute controls etc
    Howler.volume(1.0);
  }

  // preload small SFX (local static assets)
  preloadSFX(map: Record<SFXKey, string>) {
    Object.entries(map).forEach(([k, src]) => {
      this.sfxMap.set(k, new Howl({ src: [src], volume: 0.9 }));
    });
  }

  playSFX(key: SFXKey) {
    const s = this.sfxMap.get(key);
    if (s) {
      s.play();
    } else {
      console.warn('[AudioManager] SFX missing:', key);
    }
  }

  // background music: looped Howl
  playBackground(src: string, opts?: { volume?: number }) {
    if (this.bg) {
      this.bg.stop();
      this.bg.unload();
    }
    this.bg = new Howl({
      src: [src],
      loop: true,
      volume: opts?.volume ?? 0.6,
      html5: true // stream large file
    });
    this.bg.play();
  }

  stopBackground() {
    this.bg?.stop();
  }

  // text-to-speech VO: either already a cached file or remote URL -> queue for sequential play
  async queueVoice(url: string) {
    this.voQueue.push(url);
    if (!this.voPlaying) {
      await this.playQueue();
    }
  }

  private async playQueue() {
    if (this.voPlaying) return;
    this.voPlaying = true;
    while (this.voQueue.length) {
      const url = this.voQueue.shift()!;
      try {
        await this.playUrl(url);
      } catch (e) {
        console.error('[AudioManager] VO playback failed', e);
      }
    }
    this.voPlaying = false;
  }

  private playUrl(url: string) {
    return new Promise<void>((resolve, reject) => {
      const h = new Howl({
        src: [url],
        volume: 1.0,
        html5: true,
        onend: () => resolve(),
        onloaderror: (_, err) => reject(err),
        onplayerror: (_, err) => {
          h.once('unlock', () => h.play());
        }
      });
      h.play();
    });
  }
}

const audioManager = new AudioManager();
export default audioManager;

