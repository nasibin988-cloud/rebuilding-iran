/**
 * IRAN 14XX - Audio Hook
 *
 * React hook for managing game audio.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAudioService, type MusicTrack, type SoundEffect } from '../../services/AudioService';

interface AudioState {
  isInitialized: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

interface UseAudioReturn extends AudioState {
  // Initialization
  initAudio: () => void;

  // Music
  playMusic: (track: MusicTrack) => void;
  startBackgroundMusic: () => void;
  stopMusic: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;

  // Sound effects
  playSfx: (effect: SoundEffect) => void;

  // Settings
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
}

export function useAudio(): UseAudioReturn {
  const [state, setState] = useState<AudioState>({
    isInitialized: false,
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true
  });

  // Get service instance
  const audioService = typeof window !== 'undefined' ? getAudioService() : null;

  // Load settings on mount
  useEffect(() => {
    if (audioService) {
      const settings = audioService.getSettings();
      setState(prev => ({
        ...prev,
        ...settings
      }));
    }
  }, [audioService]);

  // Initialize audio (requires user interaction)
  const initAudio = useCallback(() => {
    if (audioService && !state.isInitialized) {
      audioService.init();
      setState(prev => ({ ...prev, isInitialized: true }));
    }
  }, [audioService, state.isInitialized]);

  // Music controls
  const playMusic = useCallback((track: MusicTrack) => {
    if (!state.isInitialized) initAudio();
    audioService?.playMusic(track);
  }, [audioService, state.isInitialized, initAudio]);

  const stopMusic = useCallback(() => {
    audioService?.stopMusic();
  }, [audioService]);

  const pauseMusic = useCallback(() => {
    audioService?.pauseMusic();
  }, [audioService]);

  const resumeMusic = useCallback(() => {
    audioService?.resumeMusic();
  }, [audioService]);

  // Start constant background music
  const startBackgroundMusic = useCallback(() => {
    if (!state.isInitialized) initAudio();
    audioService?.startBackgroundMusic();
  }, [audioService, state.isInitialized, initAudio]);

  // Sound effects
  const playSfx = useCallback((effect: SoundEffect) => {
    if (!state.isInitialized) initAudio();
    audioService?.playSfx(effect);
  }, [audioService, state.isInitialized, initAudio]);

  // Volume controls
  const setMasterVolume = useCallback((volume: number) => {
    audioService?.setMasterVolume(volume);
    setState(prev => ({ ...prev, masterVolume: volume }));
  }, [audioService]);

  const setMusicVolume = useCallback((volume: number) => {
    audioService?.setMusicVolume(volume);
    setState(prev => ({ ...prev, musicVolume: volume }));
  }, [audioService]);

  const setSfxVolume = useCallback((volume: number) => {
    audioService?.setSfxVolume(volume);
    setState(prev => ({ ...prev, sfxVolume: volume }));
  }, [audioService]);

  // Toggles
  const toggleMusic = useCallback(() => {
    audioService?.toggleMusic();
    setState(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  }, [audioService]);

  const toggleSfx = useCallback(() => {
    audioService?.toggleSfx();
    setState(prev => ({ ...prev, sfxEnabled: !prev.sfxEnabled }));
  }, [audioService]);

  return {
    ...state,
    initAudio,
    playMusic,
    startBackgroundMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    playSfx,
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    toggleMusic,
    toggleSfx
  };
}

export default useAudio;
