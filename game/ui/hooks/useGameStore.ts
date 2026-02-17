/**
 * IRAN 14XX - Game Store (Zustand)
 *
 * Central state management for the game UI using Zustand.
 * Provides reactive state updates and actions for all game systems.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type {
  GameState,
  GameEvent,
  Decision,
  TurnPhase,
  CharacterId,
  FactionId,
  FactionState,
  LocalizedString,
  PersianDate,
  Condition,
} from '../../engine/core/types';
import { GameStateManager, initializeGameState } from '../../engine/core/GameState';
import { TurnEngine, initializeTurnEngine } from '../../engine/core/TurnEngine';
import { EventEngine, initializeEventEngine } from '../../engine/core/EventEngine';
import { ConsequenceEngine, initializeConsequenceEngine } from '../../engine/core/ConsequenceEngine';
import { FactionEngine, initializeFactionEngine } from '../../engine/core/FactionEngine';
import { ContentLoader, initializeContentLoader, type EndingContent } from '../../engine/content/ContentLoader';
import { getSaveService } from '../../services/SaveService';

// =============================================================================
// TYPES
// =============================================================================

export interface GameUIState {
  // Initialization
  isInitialized: boolean;
  isLoading: boolean;
  loadingMessage: LocalizedString | null;
  error: string | null;

  // Current language
  language: 'fa' | 'en';

  // Game state (mirror of engine state)
  gameState: GameState | null;

  // Current event being displayed
  currentEvent: GameEvent | null;
  isEventDialogOpen: boolean;

  // Turn processing
  isTurnProcessing: boolean;
  turnPhase: TurnPhase | null;

  // UI State
  selectedView: 'map' | 'factions' | 'eudaimonia' | 'history' | 'settings';
  selectedFaction: FactionId | null;
  selectedRegion: string | null;
  isPaused: boolean;

  // Notifications
  notifications: Notification[];

  // Character selection
  isCharacterSelectOpen: boolean;
  selectedCharacter: CharacterId | null;

  // AI Advisor
  isAdvisorOpen: boolean;
  advisorQuery: string;
  advisorResponse: string | null;
  isAdvisorLoading: boolean;

  // Game Endings
  isGameOver: boolean;
  currentEnding: EndingContent | null;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'urgent' | 'success';
  message: LocalizedString;
  timestamp: number;
  read: boolean;
}

export interface GameActions {
  // Initialization
  initializeGame: () => Promise<void>;
  startNewGame: (characterId: CharacterId, difficulty: string) => Promise<void>;
  loadGame: (saveData: string) => Promise<void>;
  saveGame: () => string;

  // Language
  setLanguage: (lang: 'fa' | 'en') => void;
  getText: (text: LocalizedString | undefined) => string;

  // Turn Processing
  processTurn: () => Promise<void>;
  advanceTurn: () => void;

  // Event Handling
  showEvent: (event: GameEvent) => void;
  closeEvent: () => void;
  submitDecision: (decisionId: string) => Promise<void>;

  // UI Navigation
  setView: (view: GameUIState['selectedView']) => void;
  selectFaction: (factionId: FactionId | null) => void;
  selectRegion: (regionId: string | null) => void;
  togglePause: () => void;

  // Character Selection
  openCharacterSelect: () => void;
  closeCharacterSelect: () => void;
  selectCharacter: (characterId: CharacterId) => void;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // AI Advisor
  openAdvisor: () => void;
  closeAdvisor: () => void;
  askAdvisor: (query: string) => Promise<void>;

  // Game Endings
  checkForEnding: () => EndingContent | null;
  triggerEnding: (ending: EndingContent) => void;
  restartGame: () => void;

  // State Queries
  getEudaimonia: () => GameState['eudaimonia'] | null;
  getFaction: (id: FactionId) => FactionState | null;
  getPlayer: () => GameState['player'] | null;
  getCurrentTurn: () => number;
  getCurrentDate: () => PersianDate | null;
}

type GameStore = GameUIState & GameActions;

// =============================================================================
// ENGINE INSTANCES
// =============================================================================

let stateManager: GameStateManager | null = null;
let turnEngine: TurnEngine | null = null;
let eventEngine: EventEngine | null = null;
let consequenceEngine: ConsequenceEngine | null = null;
let factionEngine: FactionEngine | null = null;
let contentLoader: ContentLoader | null = null;

// Helper function to evaluate ending conditions
function evaluateEndingConditions(ending: EndingContent, gameState: GameState): boolean {
  if (!ending.conditions || ending.conditions.length === 0) {
    return false;
  }

  for (const condition of ending.conditions) {
    if (!evaluateCondition(condition, gameState)) {
      return false;
    }
  }

  return true;
}

function evaluateCondition(condition: Condition, gameState: GameState): boolean {
  const { type, operator, value } = condition;
  const target = condition.target || condition.path || '';

  let actualValue: number | boolean | string | undefined;

  // Helper to resolve a dot-path, handling path remapping for YAML conventions
  const resolvePath = (path: string): unknown => {
    // Remap common YAML path patterns to actual state structure
    let resolvedPath = path;

    // "regime.X" -> "world.regime.X"
    if (path.startsWith('regime.')) {
      resolvedPath = 'world.' + path;
    }
    // "eudaimonia.freedomAgency" -> "eudaimonia.dimensions.freedomAgency.value"
    else if (path.startsWith('eudaimonia.') && !path.includes('dimensions')) {
      const dimension = path.split('.')[1];
      if (dimension && !['composite', 'trend', 'regional', 'history', 'playerWeights'].includes(dimension)) {
        resolvedPath = `eudaimonia.dimensions.${dimension}.value`;
      }
    }

    const parts = resolvedPath.split('.');
    let current: unknown = gameState;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;

      // Special handling for Map objects (like factions)
      if (current instanceof Map) {
        current = current.get(part);
      } else if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  };

  // Type-safe accessors using Record type for dynamic property access
  const getRegimeStat = (t: string): number | undefined => {
    const regime = gameState.world.regime as unknown as Record<string, number>;
    return regime[t];
  };
  const getPlayerResource = (t: string): number | undefined => {
    const resources = gameState.player.resources as unknown as Record<string, number>;
    return resources[t];
  };
  const getPlayerPosition = (t: string): string | undefined => {
    const position = gameState.player.position as unknown as Record<string, string>;
    return position[t];
  };
  const getEudaimonia = (t: string): number | undefined => {
    const eudaimonia = gameState.eudaimonia as unknown as Record<string, number>;
    return eudaimonia[t];
  };

  switch (type) {
    case 'regime_stat':
      actualValue = getRegimeStat(target);
      break;
    case 'player_resource':
      actualValue = getPlayerResource(target);
      break;
    case 'player_position':
      actualValue = getPlayerPosition(target);
      break;
    case 'eudaimonia':
      actualValue = getEudaimonia(target);
      break;
    case 'stat': {
      // Handle paths like "regime.stability", "eudaimonia.freedomAgency", etc.
      const resolved = resolvePath(target);
      actualValue = typeof resolved === 'number' ? resolved : undefined;
      break;
    }
    case 'relationship':
    case 'state_check':
    case 'faction_check':
    case 'character_check':
      // These condition types need more complex evaluation - return FALSE to prevent false triggers
      return false;
    case 'turn':
      actualValue = gameState.time.turn;
      break;
    case 'flag':
      actualValue = gameState.meta.flags?.get(target);
      break;
    default:
      return false;
  }

  if (actualValue === undefined) return false;

  switch (operator) {
    case '>':
    case 'gt':
    case 'greaterThan':
      return Number(actualValue) > Number(value);
    case '<':
    case 'lt':
    case 'lessThan':
      return Number(actualValue) < Number(value);
    case '>=':
    case 'gte':
    case 'greaterThanOrEqual':
      return Number(actualValue) >= Number(value);
    case '<=':
    case 'lte':
    case 'lessThanOrEqual':
      return Number(actualValue) <= Number(value);
    case '==':
    case 'eq':
    case 'equals':
      return actualValue === value;
    case '!=':
    case 'neq':
    case 'notEquals':
      return actualValue !== value;
    default:
      return false;
  }
}

// =============================================================================
// STORE CREATION
// =============================================================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial State
      isInitialized: false,
      isLoading: false,
      loadingMessage: null,
      error: null,
      language: 'fa',
      gameState: null,
      currentEvent: null,
      isEventDialogOpen: false,
      isTurnProcessing: false,
      turnPhase: null,
      selectedView: 'map',
      selectedFaction: null,
      selectedRegion: null,
      isPaused: false,
      notifications: [],
      isCharacterSelectOpen: false,
      selectedCharacter: null,
      isAdvisorOpen: false,
      advisorQuery: '',
      advisorResponse: null,
      isAdvisorLoading: false,
      isGameOver: false,
      currentEnding: null,

      // Actions
      initializeGame: async () => {
        set({
          isLoading: true,
          loadingMessage: { fa: 'در حال بارگذاری...', en: 'Loading...' },
        });

        try {
          // Initialize content loader
          contentLoader = initializeContentLoader('/game/content');
          await contentLoader.loadAll();

          // Initialize state manager
          stateManager = initializeGameState();

          // Initialize engines
          turnEngine = initializeTurnEngine(stateManager);
          eventEngine = initializeEventEngine(stateManager);
          consequenceEngine = initializeConsequenceEngine(stateManager);
          factionEngine = initializeFactionEngine(stateManager);

          // Register events from content
          const content = contentLoader.getContent();
          eventEngine.registerEvents(Array.from(content.events.values()));

          set({
            isInitialized: true,
            isLoading: false,
            loadingMessage: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize game',
          });
        }
      },

      startNewGame: async (characterId, difficulty) => {
        if (!stateManager) {
          throw new Error('Game not initialized');
        }

        set({
          isLoading: true,
          loadingMessage: { fa: 'شروع بازی جدید...', en: 'Starting new game...' },
        });

        try {
          // Initialize for character
          stateManager.initializeForCharacter(characterId, difficulty as 'normal' | 'challenging' | 'brutal');

          // Get initial state
          const gameState = stateManager.getState();

          set({
            gameState,
            isLoading: false,
            loadingMessage: null,
            isCharacterSelectOpen: false,
            selectedCharacter: characterId,
          });

          // Process first turn
          await get().processTurn();
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to start game',
          });
        }
      },

      loadGame: async (saveData) => {
        set({
          isLoading: true,
          loadingMessage: { fa: 'در حال بارگذاری...', en: 'Loading save...' },
        });

        try {
          const loadedState = GameStateManager.deserialize(saveData);
          stateManager = initializeGameState(loadedState);

          // Re-initialize engines with loaded state
          turnEngine = initializeTurnEngine(stateManager);
          eventEngine = initializeEventEngine(stateManager);
          consequenceEngine = initializeConsequenceEngine(stateManager);
          factionEngine = initializeFactionEngine(stateManager);

          set({
            gameState: loadedState,
            isLoading: false,
            loadingMessage: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load game',
          });
        }
      },

      saveGame: () => {
        if (!stateManager) {
          throw new Error('Game not initialized');
        }
        return stateManager.serialize();
      },

      setLanguage: (lang) => {
        set({ language: lang });
        if (stateManager) {
          const state = stateManager.getState();
          state.meta.settings.language = lang;
        }
      },

      getText: (text) => {
        if (!text) return '';
        const lang = get().language;
        return text[lang] || text.en || text.fa || '';
      },

      processTurn: async () => {
        if (!turnEngine || !stateManager) {
          throw new Error('Game not initialized');
        }

        set({ isTurnProcessing: true });

        try {
          const result = await turnEngine.processTurn();
          const currentState = stateManager.getState();

          // Update state
          set({
            gameState: currentState,
            isTurnProcessing: false,
          });

          // Autosave after each turn (silent failure is acceptable)
          try {
            const saveService = getSaveService();
            saveService.autosave(currentState);
          } catch {
            // Autosave failure is non-critical - continue silently
          }

          // Check for events
          if (eventEngine) {
            const events = eventEngine.generateEventsForTurn();
            if (events.length > 0) {
              get().showEvent(events[0]);
            }
          }

          // Check for game ending
          const ending = get().checkForEnding();
          if (ending) {
            get().triggerEnding(ending);
            return;
          }

          // Check for game ending from turn result
          if (!result.continueGame) {
            get().addNotification({
              type: 'urgent',
              message: {
                fa: 'بازی به پایان رسید',
                en: 'Game has ended',
              },
            });
          }
        } catch (error) {
          set({
            isTurnProcessing: false,
            error: error instanceof Error ? error.message : 'Turn processing failed',
          });
        }
      },

      advanceTurn: () => {
        if (!stateManager) return;
        stateManager.advanceTurn();
        set({ gameState: stateManager.getState() });
      },

      showEvent: (event) => {
        set({
          currentEvent: event,
          isEventDialogOpen: true,
        });
      },

      closeEvent: () => {
        set({
          currentEvent: null,
          isEventDialogOpen: false,
        });
      },

      submitDecision: async (decisionId) => {
        if (!turnEngine || !stateManager) {
          throw new Error('Game not initialized');
        }

        try {
          const result = await turnEngine.submitDecision(decisionId);

          // Update state
          set({
            gameState: stateManager.getState(),
            isEventDialogOpen: false,
            currentEvent: null,
          });

          // Show outcome notification
          const decision = result.decision;
          if (decision) {
            get().addNotification({
              type: 'info',
              message: decision.description,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Decision submission failed',
          });
        }
      },

      setView: (view) => {
        set({ selectedView: view });
      },

      selectFaction: (factionId) => {
        set({ selectedFaction: factionId });
      },

      selectRegion: (regionId) => {
        set({ selectedRegion: regionId });
      },

      togglePause: () => {
        set((state) => ({ isPaused: !state.isPaused }));
      },

      openCharacterSelect: () => {
        set({ isCharacterSelectOpen: true });
      },

      closeCharacterSelect: () => {
        set({ isCharacterSelectOpen: false });
      },

      selectCharacter: (characterId) => {
        set({ selectedCharacter: characterId });
      },

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}`,
          timestamp: Date.now(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      openAdvisor: () => {
        set({ isAdvisorOpen: true });
      },

      closeAdvisor: () => {
        set({ isAdvisorOpen: false, advisorResponse: null, advisorQuery: '' });
      },

      askAdvisor: async (query) => {
        set({ advisorQuery: query, isAdvisorLoading: true });

        try {
          // Build game state context for the advisor
          const gameState = get().gameState;
          const contextState = gameState ? {
            turn: gameState.time.turn,
            player: {
              resources: gameState.player.resources,
              position: gameState.player.position,
            },
            regime: gameState.world.regime,
            factions: Object.fromEntries(
              Array.from(gameState.world.factions.entries()).map(([id, faction]) => [
                id,
                { trust: faction.trust, power: faction.power }
              ])
            ),
            currentEvent: get().currentEvent ? {
              title: get().currentEvent?.title,
              description: get().currentEvent?.description,
            } : null,
            history: (gameState.meta.history ?? []).slice(-5).map(h => ({
              turn: h.turn,
              type: h.type,
              summary: h.summary,
              decisionId: h.decisionId,
            })),
          } : null;

          // Call the AI advisor API
          const response = await fetch('/api/advisor', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: query,
              gameState: contextState,
              conversationHistory: [], // Could track conversation history if needed
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get advisor response');
          }

          const data = await response.json();

          set({
            advisorResponse: data.response,
            isAdvisorLoading: false,
          });
        } catch (error) {
          // Error is displayed to user via advisorResponse
          set({
            advisorResponse: get().language === 'fa'
              ? `خطا در تماس با مشاور: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`
              : `Error contacting advisor: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isAdvisorLoading: false,
          });
        }
      },

      checkForEnding: () => {
        const gameState = get().gameState;
        if (!gameState || !contentLoader) return null;

        const endings = contentLoader.getContent().endings;

        for (const [, ending] of endings) {
          if (evaluateEndingConditions(ending, gameState)) {
            return ending;
          }
        }

        return null;
      },

      triggerEnding: (ending) => {
        set({
          isGameOver: true,
          currentEnding: ending,
        });

        get().addNotification({
          type: 'urgent',
          message: ending.title,
        });
      },

      restartGame: () => {
        // Reset all game state
        stateManager = null;
        turnEngine = null;
        eventEngine = null;
        consequenceEngine = null;
        factionEngine = null;

        set({
          isInitialized: false,
          gameState: null,
          currentEvent: null,
          isEventDialogOpen: false,
          selectedCharacter: null,
          isGameOver: false,
          currentEnding: null,
          notifications: [],
        });

        // Re-initialize
        get().initializeGame();
      },

      getEudaimonia: () => {
        const state = get().gameState;
        return state?.eudaimonia || null;
      },

      getFaction: (id) => {
        const state = get().gameState;
        return state?.world.factions.get(id) || null;
      },

      getPlayer: () => {
        const state = get().gameState;
        return state?.player || null;
      },

      getCurrentTurn: () => {
        const state = get().gameState;
        return state?.time.turn || 0;
      },

      getCurrentDate: () => {
        const state = get().gameState;
        return state?.time.date || null;
      },
    }),
    {
      name: 'iran-14xx-game',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        // Don't persist full game state - use explicit save/load
      }),
    }
  )
);

// =============================================================================
// HELPER HOOKS
// =============================================================================

export function useLanguage() {
  return useGameStore(useShallow((state) => ({
    language: state.language,
    setLanguage: state.setLanguage,
    getText: state.getText,
  })));
}

export function useGameState() {
  return useGameStore(useShallow((state) => ({
    gameState: state.gameState,
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
  })));
}

export function useCurrentEvent() {
  return useGameStore(useShallow((state) => ({
    currentEvent: state.currentEvent,
    isEventDialogOpen: state.isEventDialogOpen,
    showEvent: state.showEvent,
    closeEvent: state.closeEvent,
    submitDecision: state.submitDecision,
  })));
}

export function useTurnProcessing() {
  return useGameStore(useShallow((state) => ({
    isTurnProcessing: state.isTurnProcessing,
    turnPhase: state.turnPhase,
    processTurn: state.processTurn,
    advanceTurn: state.advanceTurn,
  })));
}

export function useNotifications() {
  return useGameStore(useShallow((state) => ({
    notifications: state.notifications,
    addNotification: state.addNotification,
    markNotificationRead: state.markNotificationRead,
    clearNotifications: state.clearNotifications,
  })));
}

export function useAdvisor() {
  return useGameStore(useShallow((state) => ({
    isAdvisorOpen: state.isAdvisorOpen,
    advisorQuery: state.advisorQuery,
    advisorResponse: state.advisorResponse,
    isAdvisorLoading: state.isAdvisorLoading,
    openAdvisor: state.openAdvisor,
    closeAdvisor: state.closeAdvisor,
    askAdvisor: state.askAdvisor,
  })));
}
