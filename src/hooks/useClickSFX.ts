// src/hooks/useClickSFX.ts
import { audioManager } from '@/engine/AudioManager';

export function useClickSFX(sfx: string = 'click') {
  return () => audioManager.play(`sfx/${sfx}`, { volume: 0.9 });
}

