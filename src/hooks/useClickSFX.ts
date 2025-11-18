// src/hooks/useClickSFX.ts
import audioManager from '../utils/audioManager';

export function useClickSFX(sfx: string = 'click') {
  return () => audioManager.playSFX(sfx);
}

