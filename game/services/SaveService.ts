/**
 * IRAN 14XX - Save Service
 *
 * Handles saving and loading game state, with cloud sync support.
 */

import type { GameState } from '../engine/core/types';

// Types
export interface SaveMetadata {
  id: string;
  name: string;
  characterId: string;
  turn: number;
  createdAt: string;
  updatedAt: string;
  isCloud: boolean;
}

export interface SaveData extends SaveMetadata {
  data: string;
}

// Generate a session ID for anonymous users
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('iran14xx_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('iran14xx_session_id', sessionId);
  }
  return sessionId;
}

// Local storage keys
const LOCAL_SAVES_KEY = 'iran14xx_local_saves';
const AUTOSAVE_KEY = 'iran14xx_autosave';

/**
 * Save Service class
 */
export class SaveService {
  private sessionId: string;

  constructor() {
    this.sessionId = getSessionId();
  }

  // ============================================
  // LOCAL SAVES
  // ============================================

  /**
   * Get all local saves
   */
  getLocalSaves(): SaveMetadata[] {
    if (typeof window === 'undefined') return [];

    try {
      const saves = localStorage.getItem(LOCAL_SAVES_KEY);
      if (!saves) return [];

      const parsed = JSON.parse(saves) as SaveData[];
      return parsed.map(({ data, ...meta }) => meta);
    } catch {
      return [];
    }
  }

  /**
   * Save game locally
   */
  saveLocal(name: string, gameState: GameState): SaveMetadata {
    if (typeof window === 'undefined') {
      throw new Error('Cannot save in server context');
    }

    const saveData: SaveData = {
      id: `local_${Date.now()}`,
      name,
      characterId: gameState.player.characterId,
      turn: gameState.time.turn,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCloud: false,
      data: this.serializeState(gameState)
    };

    // Get existing saves
    const existingSaves = this.getAllLocalSaveData();

    // Add new save
    existingSaves.push(saveData);

    // Keep only last 20 saves
    const trimmedSaves = existingSaves.slice(-20);

    // Store
    localStorage.setItem(LOCAL_SAVES_KEY, JSON.stringify(trimmedSaves));

    return {
      id: saveData.id,
      name: saveData.name,
      characterId: saveData.characterId,
      turn: saveData.turn,
      createdAt: saveData.createdAt,
      updatedAt: saveData.updatedAt,
      isCloud: false
    };
  }

  /**
   * Load game from local storage
   */
  loadLocal(saveId: string): GameState | null {
    if (typeof window === 'undefined') return null;

    const saves = this.getAllLocalSaveData();
    const save = saves.find(s => s.id === saveId);

    if (!save) return null;

    return this.deserializeState(save.data);
  }

  /**
   * Delete local save
   */
  deleteLocal(saveId: string): boolean {
    if (typeof window === 'undefined') return false;

    const saves = this.getAllLocalSaveData();
    const filtered = saves.filter(s => s.id !== saveId);

    localStorage.setItem(LOCAL_SAVES_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Autosave game
   */
  autosave(gameState: GameState): void {
    if (typeof window === 'undefined') return;

    const autosaveData = {
      timestamp: Date.now(),
      data: this.serializeState(gameState)
    };

    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData));
  }

  /**
   * Load autosave
   */
  loadAutosave(): GameState | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(AUTOSAVE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return this.deserializeState(parsed.data);
    } catch {
      return null;
    }
  }

  /**
   * Check if autosave exists
   */
  hasAutosave(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(AUTOSAVE_KEY) !== null;
  }

  // ============================================
  // CLOUD SAVES
  // ============================================

  /**
   * Get all cloud saves
   */
  async getCloudSaves(): Promise<SaveMetadata[]> {
    try {
      const response = await fetch(`/api/saves?session_id=${this.sessionId}`);

      if (!response.ok) {
        // Cloud unavailable - return empty array, local saves will still work
        return [];
      }

      const data = await response.json();

      if (data.saves) {
        return data.saves.map((save: SaveMetadata & { character_id?: string; created_at?: string; updated_at?: string }) => ({
          id: save.id,
          name: save.name,
          characterId: save.character_id || save.characterId,
          turn: save.turn,
          createdAt: save.created_at || save.createdAt,
          updatedAt: save.updated_at || save.updatedAt,
          isCloud: true
        }));
      }

      return [];
    } catch {
      // Network error - return empty array, local saves will still work
      return [];
    }
  }

  /**
   * Save game to cloud
   */
  async saveCloud(name: string, gameState: GameState): Promise<SaveMetadata | null> {
    try {
      const response = await fetch('/api/saves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          name,
          character_id: gameState.player.characterId,
          turn: gameState.time.turn,
          save_data: this.serializeState(gameState)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save to cloud');
      }

      const data = await response.json();

      return {
        id: data.id,
        name,
        characterId: gameState.player.characterId,
        turn: gameState.time.turn,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCloud: true
      };
    } catch {
      // Cloud save failed - caller should handle null return
      return null;
    }
  }

  /**
   * Load game from cloud
   */
  async loadCloud(saveId: string): Promise<GameState | null> {
    try {
      const response = await fetch(`/api/saves/${saveId}`);

      if (!response.ok) {
        throw new Error('Failed to load from cloud');
      }

      const data = await response.json();

      if (data.save && data.save.save_data) {
        return this.deserializeState(data.save.save_data);
      }

      return null;
    } catch {
      // Cloud load failed - caller should handle null return
      return null;
    }
  }

  /**
   * Delete cloud save
   */
  async deleteCloud(saveId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/saves?id=${saveId}`, {
        method: 'DELETE'
      });

      return response.ok;
    } catch {
      // Cloud delete failed - return false
      return false;
    }
  }

  // ============================================
  // UNIFIED INTERFACE
  // ============================================

  /**
   * Get all saves (local + cloud)
   */
  async getAllSaves(): Promise<SaveMetadata[]> {
    const localSaves = this.getLocalSaves();
    const cloudSaves = await this.getCloudSaves();

    // Merge and sort by date
    const allSaves = [...localSaves, ...cloudSaves];
    allSaves.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return allSaves;
  }

  /**
   * Load save by ID (auto-detects local vs cloud)
   */
  async loadSave(saveId: string): Promise<GameState | null> {
    if (saveId.startsWith('local_')) {
      return this.loadLocal(saveId);
    } else {
      return this.loadCloud(saveId);
    }
  }

  /**
   * Delete save by ID (auto-detects local vs cloud)
   */
  async deleteSave(saveId: string): Promise<boolean> {
    if (saveId.startsWith('local_')) {
      return this.deleteLocal(saveId);
    } else {
      return this.deleteCloud(saveId);
    }
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  private serializeState(state: GameState): string {
    // Convert Maps to objects for JSON serialization
    const serializable = {
      ...state,
      world: {
        ...state.world,
        factions: Object.fromEntries(state.world.factions),
        regions: Object.fromEntries(state.world.regions),
        characters: Object.fromEntries(state.world.characters),
        flags: Object.fromEntries(state.world.flags),
      }
    };

    return JSON.stringify(serializable);
  }

  private deserializeState(data: string): GameState {
    const parsed = JSON.parse(data);

    // Reconstruct Maps
    return {
      ...parsed,
      world: {
        ...parsed.world,
        factions: new Map(Object.entries(parsed.world.factions || {})),
        regions: new Map(Object.entries(parsed.world.regions || {})),
        characters: new Map(Object.entries(parsed.world.characters || {})),
        flags: new Map(Object.entries(parsed.world.flags || {})),
      }
    };
  }

  private getAllLocalSaveData(): SaveData[] {
    try {
      const saves = localStorage.getItem(LOCAL_SAVES_KEY);
      if (!saves) return [];
      return JSON.parse(saves) as SaveData[];
    } catch {
      return [];
    }
  }
}

// Singleton instance
let saveServiceInstance: SaveService | null = null;

export function getSaveService(): SaveService {
  if (!saveServiceInstance) {
    saveServiceInstance = new SaveService();
  }
  return saveServiceInstance;
}

export default SaveService;
