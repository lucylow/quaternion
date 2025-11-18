/**
 * Keyboard Shortcuts Hook
 * 
 * Provides visual feedback and handling for keyboard shortcuts
 */

import { useEffect, useState, useCallback } from 'react';
import { InteractionAudio } from '@/audio/InteractionAudio';

export interface KeyboardShortcut {
  key: string;
  command: string;
  description: string;
  enabled?: () => boolean;
  onPress: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [interactionAudio, setInteractionAudio] = useState<InteractionAudio | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      const audio = InteractionAudio.instance();
      await audio.init();
      setInteractionAudio(audio);
    };
    initAudio();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      const shortcut = shortcuts.find(s => s.key.toUpperCase() === key);

      if (shortcut) {
        // Check if shortcut is enabled
        if (shortcut.enabled && !shortcut.enabled()) {
          return;
        }

        e.preventDefault();
        setPressedKey(key);
        
        if (interactionAudio) {
          interactionAudio.play('command', { volume: 0.6 });
        }

        shortcut.onPress();
      }
    };

    const handleKeyUp = () => {
      setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shortcuts, interactionAudio]);

  return {
    pressedKey,
    isKeyPressed: (key: string) => pressedKey === key.toUpperCase()
  };
};

/**
 * Hook for showing keyboard shortcut hints
 */
export const useKeyboardHint = (key: string, description: string) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toUpperCase() === key.toUpperCase() && e.ctrlKey) {
        setShowHint(true);
        setTimeout(() => setShowHint(false), 2000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key]);

  return showHint;
};

