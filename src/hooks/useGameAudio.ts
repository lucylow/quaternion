/**
 * React Hook for Game Audio
 * Provides easy access to game audio functionality in React components
 */

import { useEffect, useRef, useState } from 'react';
import { GameAudioIntegration } from '../audio/GameAudioIntegration';
import { EnhancedNarrativeSystem } from '../game/narrative/EnhancedNarrativeSystem';

export interface UseGameAudioReturn {
  playNarrativeEvent: (text: string, voiceProfile?: string) => Promise<void>;
  playCommanderDialogue: (text: string, commanderName: string) => Promise<void>;
  playAdvisorVoice: (
    text: string,
    advisorType: 'economist' | 'biologist' | 'ascendant' | 'engineer'
  ) => Promise<void>;
  playFactionVoice: (text: string, factionId: string) => Promise<void>;
  playTerrainEvent: (text: string) => Promise<void>;
  playVictoryNarration: (text: string) => Promise<void>;
  playDefeatNarration: (text: string) => Promise<void>;
  stopAll: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  isPlaying: boolean;
  queueLength: number;
}

/**
 * Hook for game audio integration
 */
export function useGameAudio(
  narrativeSystem?: EnhancedNarrativeSystem
): UseGameAudioReturn {
  const audioIntegrationRef = useRef<GameAudioIntegration | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    // Initialize audio integration
    audioIntegrationRef.current = new GameAudioIntegration(narrativeSystem);

    // Set up polling for status updates
    const interval = setInterval(() => {
      if (audioIntegrationRef.current) {
        const audio = audioIntegrationRef.current.getAudioIntegration();
        setIsPlaying(audio.isPlaying());
        setQueueLength(audio.getQueueLength());
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (audioIntegrationRef.current) {
        audioIntegrationRef.current.stopAll();
      }
    };
  }, [narrativeSystem]);

  const playNarrativeEvent = async (text: string, voiceProfile?: string) => {
    if (audioIntegrationRef.current) {
      await audioIntegrationRef.current.playNarrativeEvent(text, voiceProfile);
    }
  };

  const playCommanderDialogue = async (text: string, commanderName: string) => {
    if (audioIntegrationRef.current) {
      await audioIntegrationRef.current.playCommanderDialogue(text, commanderName);
    }
  };

  const playAdvisorVoice = async (
    text: string,
    advisorType: 'economist' | 'biologist' | 'ascendant' | 'engineer'
  ) => {
    if (audioIntegrationRef.current) {
      await audioIntegrationRef.current.playAdvisorVoice(text, advisorType);
    }
  };

  const playFactionVoice = async (text: string, factionId: string) => {
    if (audioIntegrationRef.current) {
      await audioIntegrationRef.current.playFactionVoice(text, factionId);
    }
  };

  const playTerrainEvent = async (text: string) => {
    if (audioIntegrationRef.current) {
      await audioIntegrationRef.current.playTerrainEvent(text);
    }
  };

  const playVictoryNarration = async (text: string) => {
    if (audioIntegrationRef.current) {
      await audioIntegrationRef.current.playVictoryNarration(text);
    }
  };

  const playDefeatNarration = async (text: string) => {
    if (audioIntegrationRef.current) {
      await audioIntegrationRef.current.playDefeatNarration(text);
    }
  };

  const stopAll = () => {
    if (audioIntegrationRef.current) {
      audioIntegrationRef.current.stopAll();
    }
  };

  const setVolume = (volume: number) => {
    if (audioIntegrationRef.current) {
      audioIntegrationRef.current.setVolume(volume);
    }
  };

  const toggleMute = () => {
    if (audioIntegrationRef.current) {
      audioIntegrationRef.current.toggleMute();
    }
  };

  return {
    playNarrativeEvent,
    playCommanderDialogue,
    playAdvisorVoice,
    playFactionVoice,
    playTerrainEvent,
    playVictoryNarration,
    playDefeatNarration,
    stopAll,
    setVolume,
    toggleMute,
    isPlaying,
    queueLength
  };
}

