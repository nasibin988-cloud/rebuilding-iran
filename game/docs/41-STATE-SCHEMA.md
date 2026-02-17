# State Schema: Complete Game Data Model

## Overview

This document defines all data structures used in IRAN 14XX. The schema serves as:
- Technical specification for implementation
- Contract between engine components
- Save file format definition
- Content validation reference

---

## Root State

```typescript
/**
 * Complete game state - everything needed to represent
 * the game at any point in time.
 */
interface GameState {
  // Meta
  meta: GameMeta;

  // Time
  time: TimeState;

  // Player
  player: PlayerState;

  // World State
  world: WorldState;

  // Systems
  eudaimonia: EudaimoniaState;
  economy: EconomyState;
  international: InternationalState;

  // History
  history: HistoryState;

  // Active State
  active: ActiveState;
}

interface GameMeta {
  version: string;           // Schema version
  saveId: string;            // Unique save identifier
  createdAt: string;         // ISO timestamp
  lastSavedAt: string;       // ISO timestamp
  playTime: number;          // Total play time in seconds
  characterId: CharacterId;  // Playable character
  difficulty: Difficulty;
  settings: GameSettings;
}

interface TimeState {
  turn: number;              // Current turn number (0-based)
  date: PersianDate;         // Current in-game date
  phase: TurnPhase;          // Current phase within turn
  speed: TimeSpeed;          // Normal, fast, etc.
}

type TurnPhase =
  | 'briefing'
  | 'events'
  | 'decisions'
  | 'advisor'
  | 'resolution'
  | 'factions'
  | 'scores';

interface PersianDate {
  year: number;              // Persian year (e.g., 1404)
  month: number;             // 1-12
  day: number;               // 1-31
}
```

---

## Player State

```typescript
interface PlayerState {
  // Character reference
  characterId: CharacterId;
  characterData: CharacterInstance;

  // Resources
  resources: PlayerResources;

  // Position
  position: PlayerPosition;

  // Relationships
  relationships: Map<EntityId, RelationshipState>;

  // Knowledge
  knowledge: KnowledgeState;

  // Personal
  personal: PersonalState;
}

interface PlayerResources {
  // Political capital
  influence: number;         // 0-100, ability to make things happen

  // Financial
  money: number;             // In-game currency units

  // Time
  actionsRemaining: number;  // Actions this turn
  actionsPerTurn: number;    // Base actions per turn

  // Networks
  networks: NetworkResource[];
}

interface NetworkResource {
  id: string;
  name: string;
  type: 'political' | 'economic' | 'social' | 'intelligence';
  strength: number;          // 0-100
  reach: RegionId[];         // Where it operates
  contacts: CharacterId[];   // Key people
}

interface PlayerPosition {
  // Location
  location: RegionId;
  isInIran: boolean;
  isPublic: boolean;         // Are they a public figure?

  // Institutional
  officialRole: string | null;
  factionMemberships: FactionId[];

  // Safety
  arrested: boolean;
  inHiding: boolean;
  regimeAttention: number;   // 0-100, how much they're watched

  // Profile
  publicProfile: number;     // 0-100, how well known
  internationalProfile: number;
}

interface KnowledgeState {
  // What the player knows
  knownEvents: EventId[];
  knownSecrets: SecretId[];
  knownCharacterTraits: Map<CharacterId, string[]>;

  // Intelligence quality
  intelligenceAccuracy: number;  // 0-100
  informationSources: string[];

  // What they've seen
  visitedRegions: RegionId[];
  metCharacters: CharacterId[];
}

interface PersonalState {
  health: number;            // 0-100
  stress: number;            // 0-100
  age: number;
  family: FamilyState;
  traits: Trait[];
  beliefs: BeliefState;
}

interface FamilyState {
  members: FamilyMember[];
  safetyLevel: number;       // 0-100
  outsideIran: boolean;
  beingUsedAsLeverage: boolean;
}

interface FamilyMember {
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling';
  status: 'safe' | 'at_risk' | 'arrested' | 'deceased';
  location: string;
}

interface BeliefState {
  // What the player character believes
  ideology: IdeologyPosition;
  priorities: PriorityWeight[];
  redLines: string[];        // Things they won't do
}

interface IdeologyPosition {
  // Spectrum positions
  economicLeft: number;      // 0-100 (0=free market, 100=socialist)
  socialLiberal: number;     // 0-100 (0=conservative, 100=liberal)
  nationalist: number;       // 0-100 (0=cosmopolitan, 100=nationalist)
  religious: number;         // 0-100 (0=secular, 100=religious)
  democratic: number;        // 0-100 (0=authoritarian, 100=democratic)
}
```

---

## World State

```typescript
interface WorldState {
  // Actors
  factions: Map<FactionId, FactionState>;
  characters: Map<CharacterId, CharacterState>;

  // Geography
  regions: Map<RegionId, RegionState>;

  // Regime
  regime: RegimeState;

  // Global flags
  flags: Map<string, FlagValue>;
}
```

### Faction State

```typescript
interface FactionState {
  // Identity
  id: FactionId;
  name: LocalizedString;
  type: FactionType;

  // Power
  power: FactionPower;

  // Relationships
  relationships: Map<FactionId, FactionRelationship>;

  // Internal state
  internal: FactionInternal;

  // Objectives
  objectives: FactionObjective[];

  // Members
  leaders: CharacterId[];
  memberCount: number;       // Approximate
}

type FactionType =
  | 'regime_core'
  | 'regime_institutional'
  | 'regime_affiliate'
  | 'opposition_political'
  | 'opposition_armed'
  | 'civil_society'
  | 'ethnic'
  | 'international';

interface FactionPower {
  military: number;          // 0-100
  economic: number;          // 0-100
  political: number;         // 0-100
  social: number;            // 0-100
  international: number;     // 0-100

  // Derived
  overall: number;           // Calculated composite
}

interface FactionRelationship {
  factionId: FactionId;
  trust: number;             // -100 to 100
  alignment: number;         // -100 to 100 (ideological)
  cooperation: number;       // 0-100 (operational)
  history: RelationshipEvent[];
}

interface FactionInternal {
  unity: number;             // 0-100
  morale: number;            // 0-100
  resources: number;         // 0-100
  leadership: LeadershipState;
}

interface LeadershipState {
  stability: number;         // 0-100
  successionClarity: number; // 0-100
  internalConflicts: string[];
}

interface FactionObjective {
  id: string;
  type: ObjectiveType;
  description: LocalizedString;
  priority: number;          // 1-10
  progress: number;          // 0-100
  deadline: number | null;   // Turn number
}

type ObjectiveType =
  | 'survival'
  | 'power_gain'
  | 'resource_acquisition'
  | 'ideological'
  | 'territorial'
  | 'relationship';
```

### Character State

```typescript
interface CharacterState {
  // Identity
  id: CharacterId;
  name: LocalizedString;
  type: CharacterType;
  isPlayable: boolean;

  // Position
  position: CharacterPosition;

  // Psychology
  psychology: CharacterPsychology;

  // Relationships
  relationships: Map<EntityId, number>;  // Trust values

  // Status
  status: CharacterStatus;

  // History
  history: CharacterHistory;
}

type CharacterType =
  | 'historical'     // Real person
  | 'composite'      // Fictional, based on type
  | 'fictional';     // Entirely fictional

interface CharacterPosition {
  factions: FactionId[];
  role: string;
  location: RegionId;
  publicProfile: number;
}

interface CharacterPsychology {
  // The five foundations
  survivalFears: Fear[];
  interests: InterestProfile;
  beliefs: BeliefProfile;
  identity: IdentityProfile;
  constraints: Constraint[];

  // Behavioral
  negotiationStyle: NegotiationStyle;
  riskTolerance: number;     // 0-100
  loyaltyType: LoyaltyType;
}

interface Fear {
  type: FearType;
  intensity: number;         // 0-100
  description: string;
}

type FearType =
  | 'physical'
  | 'economic'
  | 'social'
  | 'family'
  | 'existential';

interface InterestProfile {
  survival: number;          // 1-10 priority
  material: number;
  status: number;
  power: number;
  belonging: number;
  meaning: number;
  justice: number;
  freedom: number;
}

interface CharacterStatus {
  alive: boolean;
  health: number;
  arrested: boolean;
  inExile: boolean;
  publicStanding: number;
  regimeRelation: number;    // -100 to 100
}
```

### Region State

```typescript
interface RegionState {
  id: RegionId;
  name: LocalizedString;
  type: RegionType;

  // Demographics
  demographics: RegionDemographics;

  // Control
  control: ControlState;

  // Conditions
  conditions: RegionConditions;

  // Activity
  activity: RegionActivity;
}

type RegionType =
  | 'capital'
  | 'major_city'
  | 'province'
  | 'border_region';

interface RegionDemographics {
  population: number;
  ethnicComposition: Map<Ethnicity, number>;  // Percentages
  urbanization: number;      // 0-100
  religiosity: number;       // 0-100
  educationLevel: number;    // 0-100
}

interface ControlState {
  regimeControl: number;     // 0-100
  oppositionPresence: number;
  militaryPresence: number;
  ethnicMovementControl: number;
  contestedZones: string[];
}

interface RegionConditions {
  economicHealth: number;    // 0-100
  infrastructure: number;    // 0-100
  publicServices: number;    // 0-100
  environmentalHealth: number;
  publicSentiment: number;   // -100 to 100
}

interface RegionActivity {
  protestLevel: number;      // 0-100
  strikeActivity: number;    // 0-100
  civilSocietyStrength: number;
  insurgency: number;        // 0-100 (armed opposition)
}
```

### Regime State

```typescript
interface RegimeState {
  // Leadership
  supremeLeader: SupremeLeaderState;
  government: GovernmentState;

  // Institutions
  institutions: Map<InstitutionId, InstitutionState>;

  // Metrics
  legitimacy: number;        // 0-100
  stability: number;         // 0-100
  coherence: number;         // 0-100 (internal agreement)

  // Capacity
  repressiveCapacity: number;
  administrativeCapacity: number;
  economicCapacity: number;
}

interface SupremeLeaderState {
  characterId: CharacterId;
  health: number;
  yearsInPower: number;
  successionClarity: number;
  possibleSuccessors: CharacterId[];
}

interface InstitutionState {
  id: InstitutionId;
  name: string;
  head: CharacterId;
  power: number;
  loyalty: number;
  functionality: number;
}
```

---

## Eudaimonia State

```typescript
interface EudaimoniaState {
  // Composite
  composite: number;
  trend: Trend;

  // Dimensions
  dimensions: EudaimoniaDimensions;

  // Regional breakdown
  regional: Map<RegionId, EudaimoniaDimensions>;

  // Historical
  history: EudaimoniaRecord[];

  // Player weights
  playerWeights: DimensionWeights;
}

interface EudaimoniaDimensions {
  materialWellbeing: DimensionScore;
  healthLongevity: DimensionScore;
  freedomAgency: DimensionScore;
  securityOrder: DimensionScore;
  socialCohesion: DimensionScore;
  culturalFlourishing: DimensionScore;
  sustainability: DimensionScore;
}

interface DimensionScore {
  value: number;             // 0-100
  components: Map<string, number>;  // Sub-scores
  trend: Trend;
  contributors: string[];    // What's affecting this
}

type Trend = 'improving' | 'stable' | 'declining';

interface DimensionWeights {
  materialWellbeing: number;
  healthLongevity: number;
  freedomAgency: number;
  securityOrder: number;
  socialCohesion: number;
  culturalFlourishing: number;
  sustainability: number;
}

interface EudaimoniaRecord {
  turn: number;
  date: PersianDate;
  composite: number;
  dimensions: EudaimoniaDimensions;
}
```

---

## History State

```typescript
interface HistoryState {
  // Events that have occurred
  events: EventRecord[];

  // Decisions made
  decisions: DecisionRecord[];

  // Consequences pending
  pendingConsequences: ScheduledConsequence[];

  // Memories (for narrative surfacing)
  memories: MemoryRecord[];

  // Relationships over time
  relationshipHistory: Map<EntityId, RelationshipChange[]>;
}

interface EventRecord {
  id: string;
  eventId: EventId;
  turn: number;
  date: PersianDate;
  involvedEntities: EntityId[];
  outcome: string;
}

interface DecisionRecord {
  id: string;
  eventId: EventId;
  decisionId: string;
  turn: number;
  date: PersianDate;
  choiceId: string;
  immediateEffects: Effect[];
  scheduledEffects: ScheduledConsequence[];
}

interface ScheduledConsequence {
  id: string;
  sourceDecisionId: string;
  triggerTurn: number;
  triggerCondition: Condition | null;
  probability: number;
  effects: Effect[];
  narrative: ConsequenceNarrative;
  triggered: boolean;
}

interface MemoryRecord {
  id: string;
  type: MemoryType;
  turn: number;
  content: any;
  involvedEntities: EntityId[];
  importance: number;
  lastSurfaced: number | null;
}

type MemoryType =
  | 'promise_made'
  | 'promise_kept'
  | 'promise_broken'
  | 'betrayal'
  | 'help_given'
  | 'sacrifice'
  | 'milestone';
```

---

## Active State

```typescript
interface ActiveState {
  // Current turn processing
  currentTurn: CurrentTurnState | null;

  // Active dialogs
  activeDialog: DialogState | null;

  // Pending notifications
  notifications: Notification[];

  // UI state
  ui: UIState;
}

interface CurrentTurnState {
  turn: number;
  phase: TurnPhase;
  eventsToProcess: GameEvent[];
  eventsProcessed: EventRecord[];
  currentEvent: GameEvent | null;
  awaitingDecision: boolean;
}

interface DialogState {
  type: DialogType;
  data: any;
  callbacks: DialogCallbacks;
}

interface UIState {
  currentView: ViewType;
  selectedRegion: RegionId | null;
  selectedFaction: FactionId | null;
  selectedCharacter: CharacterId | null;
  panelStates: Map<string, boolean>;
}
```

---

## Common Types

```typescript
// Identifiers
type CharacterId = string;
type FactionId = string;
type RegionId = string;
type EventId = string;
type EntityId = CharacterId | FactionId;

// Localization
interface LocalizedString {
  fa: string;                // Persian
  en: string;                // English
}

// Effects
interface Effect {
  type: EffectType;
  target: string;
  value: number | string | boolean;
  duration?: number;
}

type EffectType =
  | 'state_change'
  | 'faction_trust'
  | 'faction_power'
  | 'character_relationship'
  | 'resource_change'
  | 'flag_set'
  | 'flag_clear'
  | 'trigger_event'
  | 'block_event';

// Conditions
interface Condition {
  type: ConditionType;
  path: string;
  operator: ComparisonOperator;
  value: any;
}

type ConditionType =
  | 'state_check'
  | 'event_happened'
  | 'event_not_happened'
  | 'faction_check'
  | 'character_check'
  | 'flag_check';

type ComparisonOperator =
  | '=='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'contains'
  | 'not_contains';

// Relationships
interface RelationshipState {
  trust: number;             // -100 to 100
  history: RelationshipEvent[];
}

interface RelationshipEvent {
  turn: number;
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  trustChange: number;
}

interface RelationshipChange {
  turn: number;
  oldValue: number;
  newValue: number;
  reason: string;
}

// Settings
interface GameSettings {
  language: 'fa' | 'en';
  autoSave: boolean;
  autoSaveInterval: number;
  showTutorial: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  aiAdvisor: boolean;
}

type Difficulty = 'normal' | 'challenging' | 'brutal';
type TimeSpeed = 'paused' | 'normal' | 'fast';
```

---

## Serialization

### Save File Format

```typescript
interface SaveFile {
  // Header
  version: string;           // Schema version
  timestamp: string;         // ISO timestamp
  checksum: string;          // Integrity check

  // State
  state: SerializedGameState;

  // Metadata
  metadata: SaveMetadata;
}

interface SaveMetadata {
  characterName: string;
  turn: number;
  date: string;
  playTime: number;
  lastEvent: string;
  thumbnail: string | null;  // Base64 encoded
}

// Serialization functions
function serializeState(state: GameState): SerializedGameState {
  return {
    ...state,
    // Convert Maps to arrays of [key, value]
    world: {
      ...state.world,
      factions: Array.from(state.world.factions.entries()),
      characters: Array.from(state.world.characters.entries()),
      regions: Array.from(state.world.regions.entries()),
    },
    // Convert Sets to arrays
    // ... etc
  };
}

function deserializeState(serialized: SerializedGameState): GameState {
  return {
    ...serialized,
    // Convert arrays back to Maps
    world: {
      ...serialized.world,
      factions: new Map(serialized.world.factions),
      characters: new Map(serialized.world.characters),
      regions: new Map(serialized.world.regions),
    },
    // ... etc
  };
}
```

### Version Migration

```typescript
interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  migrate: (state: any) => any;
}

const migrations: MigrationStep[] = [
  {
    fromVersion: '1.0',
    toVersion: '1.1',
    migrate: (state) => {
      // Add new fields with defaults
      return {
        ...state,
        newField: defaultValue,
      };
    },
  },
  // ... more migrations
];

function migrateState(saveFile: SaveFile): GameState {
  let state = saveFile.state;
  let version = saveFile.version;

  while (version !== CURRENT_VERSION) {
    const migration = migrations.find(m => m.fromVersion === version);
    if (!migration) {
      throw new Error(`No migration path from ${version}`);
    }
    state = migration.migrate(state);
    version = migration.toVersion;
  }

  return deserializeState(state);
}
```

---

## Validation

### JSON Schema

```yaml
# schemas/game-state.schema.yaml

$schema: "https://json-schema.org/draft/2020-12/schema"
$id: "iran14xx/game-state"
title: "IRAN 14XX Game State"

type: object
required:
  - meta
  - time
  - player
  - world
  - eudaimonia
  - history
  - active

properties:
  meta:
    $ref: "#/$defs/GameMeta"

  time:
    $ref: "#/$defs/TimeState"

  # ... etc

$defs:
  GameMeta:
    type: object
    required: [version, saveId, createdAt, characterId]
    properties:
      version:
        type: string
        pattern: "^\\d+\\.\\d+$"
      saveId:
        type: string
        format: uuid
      # ... etc
```

### Runtime Validation

```typescript
import Ajv from 'ajv';
import gameStateSchema from './schemas/game-state.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(gameStateSchema);

function validateGameState(state: any): ValidationResult {
  const valid = validate(state);
  if (!valid) {
    return {
      valid: false,
      errors: validate.errors,
    };
  }
  return { valid: true, errors: [] };
}
```

---

## Conclusion

This schema defines the complete data model for IRAN 14XX. It enables:

1. **Type Safety** - All data has clear types
2. **Persistence** - State can be serialized and restored
3. **Migration** - State can evolve across versions
4. **Validation** - State integrity can be verified
5. **Documentation** - Serves as reference for all components

The schema is designed to be:
- **Complete** - Everything needed for full game state
- **Extensible** - New fields can be added
- **Serializable** - Works with JSON/IndexedDB
- **Performant** - Minimizes redundancy

---

*Last updated: February 2026*
