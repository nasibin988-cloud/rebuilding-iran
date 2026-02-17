/**
 * IRAN 14XX - Save Service Hook
 *
 * React hook for managing game saves with autosave functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSaveService, type SaveMetadata } from '../../services/SaveService';
import type { GameState } from '../../engine/core/types';

interface UseSaveServiceReturn {
  // State
  saves: SaveMetadata[];
  isLoading: boolean;
  lastSaveTime: number | null;
  hasAutosave: boolean;
  error: string | null;

  // Actions
  saveGame: (name: string, gameState: GameState, toCloud?: boolean) => Promise<SaveMetadata | null>;
  loadGame: (saveId: string) => Promise<GameState | null>;
  deleteGame: (saveId: string) => Promise<boolean>;
  loadAutosave: () => GameState | null;
  autosave: (gameState: GameState) => void;
  refreshSaves: () => Promise<void>;
  clearError: () => void;
}

export function useSaveService(): UseSaveServiceReturn {
  const [saves, setSaves] = useState<SaveMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [hasAutosave, setHasAutosave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveService = typeof window !== 'undefined' ? getSaveService() : null;
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Check for autosave on mount
  useEffect(() => {
    if (saveService) {
      setHasAutosave(saveService.hasAutosave());
    }
  }, [saveService]);

  // Load all saves
  const refreshSaves = useCallback(async () => {
    if (!saveService) return;

    setIsLoading(true);
    setError(null);
    try {
      const allSaves = await saveService.getAllSaves();
      setSaves(allSaves);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saves');
    } finally {
      setIsLoading(false);
    }
  }, [saveService]);

  // Initial load
  useEffect(() => {
    refreshSaves();
  }, [refreshSaves]);

  // Save game
  const saveGame = useCallback(async (
    name: string,
    gameState: GameState,
    toCloud: boolean = false
  ): Promise<SaveMetadata | null> => {
    if (!saveService) return null;

    setIsLoading(true);
    setError(null);
    try {
      let result: SaveMetadata | null;

      if (toCloud) {
        result = await saveService.saveCloud(name, gameState);
      } else {
        result = saveService.saveLocal(name, gameState);
      }

      if (result) {
        setLastSaveTime(Date.now());
        await refreshSaves();
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [saveService, refreshSaves]);

  // Load game
  const loadGame = useCallback(async (saveId: string): Promise<GameState | null> => {
    if (!saveService) return null;

    setIsLoading(true);
    setError(null);
    try {
      return await saveService.loadSave(saveId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [saveService]);

  // Delete game
  const deleteGame = useCallback(async (saveId: string): Promise<boolean> => {
    if (!saveService) return false;

    setIsLoading(true);
    setError(null);
    try {
      const success = await saveService.deleteSave(saveId);
      if (success) {
        await refreshSaves();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete save');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveService, refreshSaves]);

  // Load autosave
  const loadAutosave = useCallback((): GameState | null => {
    if (!saveService) return null;
    return saveService.loadAutosave();
  }, [saveService]);

  // Autosave (debounced)
  const autosave = useCallback((gameState: GameState) => {
    if (!saveService) return;

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Debounce autosave
    autosaveTimeoutRef.current = setTimeout(() => {
      saveService.autosave(gameState);
      setLastSaveTime(Date.now());
      setHasAutosave(true);
    }, 1000);
  }, [saveService]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    saves,
    isLoading,
    lastSaveTime,
    hasAutosave,
    error,
    saveGame,
    loadGame,
    deleteGame,
    loadAutosave,
    autosave,
    refreshSaves,
    clearError,
  };
}

export default useSaveService;
