/**
 * IRAN 14XX - Game State Manager
 *
 * Manages the central game state, providing methods for:
 * - Initialization
 * - State updates
 * - State queries
 * - Change tracking
 */

import type {
  GameState,
  GameMeta,
  TimeState,
  PlayerState,
  WorldState,
  EudaimoniaState,
  EconomyState,
  InternationalState,
  HistoryState,
  ActiveState,
  CharacterId,
  FactionId,
  RegionId,
  Effect,
  PersianDate,
  TurnPhase,
  GameSettings,
  Difficulty,
  DimensionWeights,
} from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

export const CURRENT_VERSION = '1.0';

const DEFAULT_SETTINGS: GameSettings = {
  language: 'fa',
  autoSave: true,
  autoSaveInterval: 5,
  showTutorial: true,
  animationSpeed: 'normal',
  aiAdvisor: true,
};

const DEFAULT_WEIGHTS: DimensionWeights = {
  materialWellbeing: 1 / 7,
  healthLongevity: 1 / 7,
  freedomAgency: 1 / 7,
  securityOrder: 1 / 7,
  socialCohesion: 1 / 7,
  culturalFlourishing: 1 / 7,
  sustainability: 1 / 7,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentPersianDate(): PersianDate {
  // Start in 1404 (2025)
  return { year: 1404, month: 1, day: 1 };
}

// =============================================================================
// STATE MANAGER CLASS
// =============================================================================

export class GameStateManager {
  private state: GameState;
  private changeListeners: Array<(state: GameState) => void> = [];
  private pendingChanges: Effect[] = [];

  constructor(initialState?: GameState) {
    this.state = initialState || this.createDefaultState();
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  private createDefaultState(): GameState {
    return {
      meta: this.createDefaultMeta(),
      time: this.createDefaultTime(),
      player: this.createDefaultPlayer(),
      world: this.createDefaultWorld(),
      eudaimonia: this.createDefaultEudaimonia(),
      economy: this.createDefaultEconomy(),
      international: this.createDefaultInternational(),
      history: this.createDefaultHistory(),
      active: this.createDefaultActive(),
    };
  }

  private createDefaultMeta(): GameMeta {
    return {
      version: CURRENT_VERSION,
      saveId: generateId(),
      createdAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
      playTime: 0,
      characterId: '',
      difficulty: 'normal',
      settings: { ...DEFAULT_SETTINGS },
    };
  }

  private createDefaultTime(): TimeState {
    return {
      turn: 0,
      date: getCurrentPersianDate(),
      phase: 'briefing',
      speed: 'normal',
    };
  }

  private createDefaultPlayer(): PlayerState {
    // Will be populated when character is selected
    return {
      characterId: '',
      characterData: {
        id: '',
        name: { fa: '', en: '' },
        portrait: '',
      },
      resources: {
        influence: 50,
        money: 1000,
        actionsRemaining: 3,
        actionsPerTurn: 3,
        networks: [],
      },
      position: {
        location: 'tehran',
        isInIran: true,
        isPublic: false,
        officialRole: null,
        factionMemberships: [],
        arrested: false,
        inHiding: false,
        regimeAttention: 0,
        publicProfile: 0,
        internationalProfile: 0,
      },
      relationships: new Map(),
      knowledge: {
        knownEvents: [],
        knownSecrets: [],
        knownCharacterTraits: new Map(),
        intelligenceAccuracy: 50,
        informationSources: [],
        visitedRegions: ['tehran'],
        metCharacters: [],
      },
      personal: {
        health: 100,
        stress: 0,
        age: 30,
        family: {
          members: [],
          safetyLevel: 100,
          outsideIran: false,
          beingUsedAsLeverage: false,
        },
        traits: [],
        beliefs: {
          ideology: {
            economicLeft: 50,
            socialLiberal: 50,
            nationalist: 50,
            religious: 50,
            democratic: 50,
          },
          priorities: [],
          redLines: [],
        },
      },
    };
  }

  private createDefaultWorld(): WorldState {
    return {
      factions: new Map(),
      characters: new Map(),
      regions: new Map(),
      regime: {
        supremeLeader: {
          characterId: 'khamenei',
          health: 40,
          yearsInPower: 35,
          successionClarity: 30,
          possibleSuccessors: ['mojtaba'],
        },
        government: {
          president: '',
          cabinet: [],
          functionality: 50,
        },
        institutions: new Map(),
        legitimacy: 35,
        stability: 50,
        coherence: 45,
        repressiveCapacity: 70,
        administrativeCapacity: 40,
        economicCapacity: 30,
      },
      flags: new Map(),
    };
  }

  private createDefaultEudaimonia(): EudaimoniaState {
    const defaultDimension = {
      value: 35,
      components: new Map(),
      trend: 'stable' as const,
      contributors: [],
    };

    return {
      composite: 35,
      trend: 'stable',
      dimensions: {
        materialWellbeing: { ...defaultDimension, value: 35 },
        healthLongevity: { ...defaultDimension, value: 55 },
        freedomAgency: { ...defaultDimension, value: 18 },
        securityOrder: { ...defaultDimension, value: 28 },
        socialCohesion: { ...defaultDimension, value: 38 },
        culturalFlourishing: { ...defaultDimension, value: 30 },
        sustainability: { ...defaultDimension, value: 25 },
      },
      regional: new Map(),
      history: [],
      playerWeights: { ...DEFAULT_WEIGHTS },
    };
  }

  private createDefaultEconomy(): EconomyState {
    return {
      gdpGrowth: -2,
      inflation: 45,
      unemployment: 25,
      oilPrice: 75,
      oilProduction: 2.5, // million barrels/day
      sanctions: 70,
      foreignInvestment: 10,
      currencyValue: 10, // relative to historical
    };
  }

  private createDefaultInternational(): InternationalState {
    return {
      relations: new Map(),
      sanctionsLevel: 70,
      internationalIsolation: 60,
      diasporaInfluence: 40,
    };
  }

  private createDefaultHistory(): HistoryState {
    return {
      events: [],
      decisions: [],
      pendingConsequences: [],
      memories: [],
      relationshipHistory: new Map(),
    };
  }

  private createDefaultActive(): ActiveState {
    return {
      currentTurn: null,
      activeDialog: null,
      notifications: [],
      ui: {
        currentView: 'map',
        selectedRegion: null,
        selectedFaction: null,
        selectedCharacter: null,
        panelStates: new Map(),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // STATE ACCESS
  // ---------------------------------------------------------------------------

  getState(): GameState {
    return this.state;
  }

  getPlayer(): PlayerState {
    return this.state.player;
  }

  getFaction(id: FactionId) {
    return this.state.world.factions.get(id);
  }

  getCharacter(id: CharacterId) {
    return this.state.world.characters.get(id);
  }

  getRegion(id: RegionId) {
    return this.state.world.regions.get(id);
  }

  getCurrentTurn(): number {
    return this.state.time.turn;
  }

  getCurrentDate(): PersianDate {
    return this.state.time.date;
  }

  getCurrentPhase(): TurnPhase {
    return this.state.time.phase;
  }

  getEudaimonia() {
    return this.state.eudaimonia;
  }

  // ---------------------------------------------------------------------------
  // STATE UPDATES
  // ---------------------------------------------------------------------------

  updatePlayer(updates: Partial<PlayerState>): void {
    this.state.player = { ...this.state.player, ...updates };
    this.notifyListeners();
  }

  updateTime(updates: Partial<TimeState>): void {
    this.state.time = { ...this.state.time, ...updates };
    this.notifyListeners();
  }

  setPhase(phase: TurnPhase): void {
    this.state.time.phase = phase;
    this.notifyListeners();
  }

  advanceTurn(): void {
    this.state.time.turn += 1;
    this.advanceDate();
    this.state.time.phase = 'briefing';
    this.state.player.resources.actionsRemaining = this.state.player.resources.actionsPerTurn;
    this.notifyListeners();
  }

  private advanceDate(): void {
    // Advance by approximately 1-3 months per turn
    const date = this.state.time.date;
    date.month += 2;
    if (date.month > 12) {
      date.year += Math.floor(date.month / 12);
      date.month = ((date.month - 1) % 12) + 1;
    }
  }

  setFlag(key: string, value: string | number | boolean): void {
    this.state.world.flags.set(key, value);
    this.notifyListeners();
  }

  getFlag(key: string) {
    return this.state.world.flags.get(key);
  }

  // ---------------------------------------------------------------------------
  // EFFECT APPLICATION
  // ---------------------------------------------------------------------------

  applyEffect(effect: Effect): void {
    switch (effect.type) {
      case 'state_change':
        this.applyStateChange(effect);
        break;
      case 'faction_trust':
        this.applyFactionTrust(effect);
        break;
      case 'resource_change':
        this.applyResourceChange(effect);
        break;
      case 'flag_set':
        this.setFlag(effect.target, effect.value);
        break;
      case 'flag_clear':
        this.state.world.flags.delete(effect.target);
        break;
      default:
        // Unknown effect type - silently ignore for forward compatibility
        break;
    }
    this.notifyListeners();
  }

  private applyStateChange(effect: Effect): void {
    // Parse path and apply change
    const parts = effect.target.split('.');
    let obj: unknown = this.state;

    for (let i = 0; i < parts.length - 1; i++) {
      obj = (obj as Record<string, unknown>)[parts[i]];
    }

    const lastKey = parts[parts.length - 1];
    (obj as Record<string, unknown>)[lastKey] = effect.value;
  }

  private applyFactionTrust(effect: Effect): void {
    const factionId = effect.target as FactionId;
    const change = effect.value as number;

    const relationship = this.state.player.relationships.get(factionId);
    if (relationship) {
      relationship.trust = Math.max(-100, Math.min(100, relationship.trust + change));
    } else {
      this.state.player.relationships.set(factionId, {
        trust: change,
        history: [],
      });
    }
  }

  private applyResourceChange(effect: Effect): void {
    const resource = effect.target as keyof PlayerState['resources'];
    const change = effect.value as number;

    if (resource === 'influence' || resource === 'money' || resource === 'actionsRemaining') {
      this.state.player.resources[resource] += change;
    }
  }

  // ---------------------------------------------------------------------------
  // CHANGE TRACKING
  // ---------------------------------------------------------------------------

  subscribe(listener: (state: GameState) => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      const index = this.changeListeners.indexOf(listener);
      if (index > -1) {
        this.changeListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    for (const listener of this.changeListeners) {
      listener(this.state);
    }
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION FROM CHARACTER
  // ---------------------------------------------------------------------------

  initializeForCharacter(characterId: CharacterId, difficulty: Difficulty): void {
    // Reset to default
    this.state = this.createDefaultState();

    // Set character and difficulty
    this.state.meta.characterId = characterId;
    this.state.meta.difficulty = difficulty;
    this.state.player.characterId = characterId;

    // Load character-specific initialization
    // This would load from content files in a full implementation
    this.loadCharacterData(characterId);

    this.notifyListeners();
  }

  private loadCharacterData(characterId: CharacterId): void {
    // Placeholder - in full implementation, this loads from YAML content
    // Character data loaded for: characterId
  }

  // ---------------------------------------------------------------------------
  // SERIALIZATION
  // ---------------------------------------------------------------------------

  serialize(): string {
    return JSON.stringify(this.state, (key, value) => {
      if (value instanceof Map) {
        return {
          __type: 'Map',
          value: Array.from(value.entries()),
        };
      }
      return value;
    });
  }

  static deserialize(json: string): GameState {
    return JSON.parse(json, (key, value) => {
      if (value && value.__type === 'Map') {
        return new Map(value.value);
      }
      return value;
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let gameStateInstance: GameStateManager | null = null;

export function getGameState(): GameStateManager {
  if (!gameStateInstance) {
    gameStateInstance = new GameStateManager();
  }
  return gameStateInstance;
}

export function initializeGameState(state?: GameState): GameStateManager {
  gameStateInstance = new GameStateManager(state);
  return gameStateInstance;
}
