/**
 * IRAN 14XX - Core Type Definitions
 *
 * This file defines all the core types used throughout the game engine.
 * Based on the State Schema documented in 41-STATE-SCHEMA.md
 */

// =============================================================================
// IDENTIFIERS
// =============================================================================

export type CharacterId = string;
export type FactionId = string;
export type RegionId = string;
export type EventId = string;
export type EntityId = CharacterId | FactionId;

// =============================================================================
// LOCALIZATION
// =============================================================================

export interface LocalizedString {
  fa: string; // Persian
  en: string; // English
}

// =============================================================================
// TIME
// =============================================================================

export interface PersianDate {
  year: number; // Persian year (e.g., 1404)
  month: number; // 1-12
  day: number; // 1-31
}

export type TurnPhase =
  | 'briefing'
  | 'events'
  | 'decisions'
  | 'advisor'
  | 'resolution'
  | 'factions'
  | 'scores';

export type TimeSpeed = 'paused' | 'normal' | 'fast';

export interface TimeState {
  turn: number;
  date: PersianDate;
  phase: TurnPhase;
  speed: TimeSpeed;
}

// =============================================================================
// GAME META
// =============================================================================

export type Difficulty = 'normal' | 'challenging' | 'brutal';

export interface GameSettings {
  language: 'fa' | 'en';
  autoSave: boolean;
  autoSaveInterval: number;
  showTutorial: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  aiAdvisor: boolean;
}

export interface GameMeta {
  version: string;
  saveId: string;
  createdAt: string;
  lastSavedAt: string;
  playTime: number;
  characterId: CharacterId;
  difficulty: Difficulty;
  settings: GameSettings;
}

// =============================================================================
// PLAYER STATE
// =============================================================================

export interface NetworkResource {
  id: string;
  name: string;
  type: 'political' | 'economic' | 'social' | 'intelligence';
  strength: number;
  reach: RegionId[];
  contacts: CharacterId[];
}

export interface PlayerResources {
  influence: number;
  money: number;
  actionsRemaining: number;
  actionsPerTurn: number;
  networks: NetworkResource[];
}

export interface PlayerPosition {
  location: RegionId;
  isInIran: boolean;
  isPublic: boolean;
  officialRole: string | null;
  factionMemberships: FactionId[];
  arrested: boolean;
  inHiding: boolean;
  regimeAttention: number;
  publicProfile: number;
  internationalProfile: number;
}

export interface KnowledgeState {
  knownEvents: EventId[];
  knownSecrets: string[];
  knownCharacterTraits: Map<CharacterId, string[]>;
  intelligenceAccuracy: number;
  informationSources: string[];
  visitedRegions: RegionId[];
  metCharacters: CharacterId[];
}

export type FamilyMemberRelationship = 'spouse' | 'child' | 'parent' | 'sibling';
export type FamilyMemberStatus = 'safe' | 'at_risk' | 'arrested' | 'deceased';

export interface FamilyMember {
  name: string;
  relationship: FamilyMemberRelationship;
  status: FamilyMemberStatus;
  location: string;
}

export interface FamilyState {
  members: FamilyMember[];
  safetyLevel: number;
  outsideIran: boolean;
  beingUsedAsLeverage: boolean;
}

export interface IdeologyPosition {
  economicLeft: number; // 0=free market, 100=socialist
  socialLiberal: number; // 0=conservative, 100=liberal
  nationalist: number; // 0=cosmopolitan, 100=nationalist
  religious: number; // 0=secular, 100=religious
  democratic: number; // 0=authoritarian, 100=democratic
}

export interface PriorityWeight {
  name: string;
  weight: number;
}

export interface BeliefState {
  ideology: IdeologyPosition;
  priorities: PriorityWeight[];
  redLines: string[];
}

export interface Trait {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  effects: Effect[];
}

export interface PersonalState {
  health: number;
  stress: number;
  age: number;
  family: FamilyState;
  traits: Trait[];
  beliefs: BeliefState;
}

export interface RelationshipEvent {
  turn: number;
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  trustChange: number;
}

export interface RelationshipState {
  trust: number;
  history: RelationshipEvent[];
}

export interface CharacterInstance {
  id: CharacterId;
  name: LocalizedString;
  portrait: string;
  // Full character data loaded from content
}

export interface PlayerState {
  characterId: CharacterId;
  characterData: CharacterInstance;
  resources: PlayerResources;
  position: PlayerPosition;
  relationships: Map<EntityId, RelationshipState>;
  knowledge: KnowledgeState;
  personal: PersonalState;
}

// =============================================================================
// FACTION STATE
// =============================================================================

export type FactionType =
  | 'regime_core'
  | 'regime_institutional'
  | 'regime_affiliate'
  | 'opposition_political'
  | 'opposition_armed'
  | 'civil_society'
  | 'ethnic'
  | 'international';

export interface FactionPower {
  base?: number;  // For engine compatibility
  military: number;
  economic: number;
  political: number;
  social: number;
  international: number;
  overall: number;
  religious?: number;  // For engine compatibility
  popular?: number;    // For engine compatibility
}

export interface FactionRelationship {
  factionId: FactionId;
  trust: number;
  alignment: number;
  cooperation: number;
  history: RelationshipEvent[];
}

export interface LeadershipState {
  stability: number;
  successionClarity: number;
  internalConflicts: string[];
}

export interface FactionInternal {
  unity: number;
  morale: number;
  resources: number;
  leadership: LeadershipState;
}

export type ObjectiveType =
  | 'survival'
  | 'power_gain'
  | 'resource_acquisition'
  | 'ideological'
  | 'territorial'
  | 'relationship';

export interface FactionObjective {
  id: string;
  type: ObjectiveType;
  description: LocalizedString;
  priority: number;
  progress: number;
  deadline: number | null;
}

export interface FactionIdeology {
  economicLeft: number;
  socialLiberal: number;
  nationalist: number;
  religious: number;
  democratic: number;
}

export interface FactionState {
  id: FactionId;
  name: LocalizedString;
  type: FactionType;
  category?: 'regime' | 'opposition' | 'society' | 'external' | 'underground';  // For engine compatibility
  power: FactionPower;
  trust: number;  // Player trust level with this faction
  relationships: Map<FactionId, FactionRelationship>;
  internal: FactionInternal;
  objectives: FactionObjective[];
  leaders: CharacterId[];
  memberCount: number;
  resources?: number;  // For engine compatibility
  cohesion?: number;   // For engine compatibility
  ideology?: FactionIdeology;  // For engine compatibility
}

// =============================================================================
// CHARACTER STATE (NPC)
// =============================================================================

export type CharacterType = 'historical' | 'composite' | 'fictional';

export interface CharacterPosition {
  factions: FactionId[];
  role: string;
  location: RegionId;
  publicProfile: number;
}

export type FearType = 'physical' | 'economic' | 'social' | 'family' | 'existential';

export interface Fear {
  type: FearType;
  intensity: number;
  description: string;
}

export interface InterestProfile {
  survival: number;
  material: number;
  status: number;
  power: number;
  belonging: number;
  meaning: number;
  justice: number;
  freedom: number;
}

export type NegotiationStyle = 'hard_bargainer' | 'collaborative' | 'avoidant' | 'accommodating';
export type LoyaltyType = 'conditional' | 'principled' | 'opportunistic';

export interface CharacterPsychology {
  survivalFears: Fear[];
  interests: InterestProfile;
  beliefs: BeliefState;
  identity: string[];
  constraints: string[];
  negotiationStyle: NegotiationStyle;
  riskTolerance: number;
  loyaltyType: LoyaltyType;
}

export interface CharacterStatus {
  alive: boolean;
  health: number;
  arrested: boolean;
  inExile: boolean;
  publicStanding: number;
  regimeRelation: number;
}

export interface CharacterHistory {
  majorEvents: string[];
  decisionsMade: string[];
}

export interface CharacterState {
  id: CharacterId;
  name: LocalizedString;
  type: CharacterType;
  isPlayable: boolean;
  position: CharacterPosition;
  psychology: CharacterPsychology;
  relationships: Map<EntityId, number>;
  status: CharacterStatus;
  history: CharacterHistory;
}

// =============================================================================
// REGION STATE
// =============================================================================

export type RegionType = 'capital' | 'major_city' | 'province' | 'border_region';

export type Ethnicity = 'persian' | 'azeri' | 'kurd' | 'arab' | 'baluch' | 'lur' | 'turkmen' | 'other';

export interface RegionDemographics {
  population: number;
  ethnicComposition: Map<Ethnicity, number>;
  urbanization: number;
  religiosity: number;
  educationLevel: number;
}

export interface ControlState {
  regimeControl: number;
  oppositionPresence: number;
  militaryPresence: number;
  ethnicMovementControl: number;
  contestedZones: string[];
}

export interface RegionConditions {
  economicHealth: number;
  infrastructure: number;
  publicServices: number;
  environmentalHealth: number;
  publicSentiment: number;
}

export interface RegionActivity {
  protestLevel: number;
  strikeActivity: number;
  civilSocietyStrength: number;
  insurgency: number;
}

export interface RegionState {
  id: RegionId;
  name: LocalizedString;
  type: RegionType;
  demographics: RegionDemographics;
  control: ControlState;
  conditions: RegionConditions;
  activity: RegionActivity;
}

// =============================================================================
// REGIME STATE
// =============================================================================

export interface SupremeLeaderState {
  characterId: CharacterId;
  health: number;
  yearsInPower: number;
  successionClarity: number;
  possibleSuccessors: CharacterId[];
}

export interface InstitutionState {
  id: string;
  name: string;
  head: CharacterId;
  power: number;
  loyalty: number;
  functionality: number;
}

export interface GovernmentState {
  president: CharacterId;
  cabinet: CharacterId[];
  functionality: number;
}

export interface RegimeState {
  supremeLeader: SupremeLeaderState;
  government: GovernmentState;
  institutions: Map<string, InstitutionState>;
  legitimacy: number;
  stability: number;
  coherence: number;
  repressiveCapacity: number;
  administrativeCapacity: number;
  economicCapacity: number;
}

// =============================================================================
// EUDAIMONIA STATE
// =============================================================================

export type Trend = 'improving' | 'stable' | 'declining';

export interface DimensionScore {
  value: number;
  components: Map<string, number>;
  trend: Trend;
  contributors: string[];
}

export interface EudaimoniaDimensions {
  materialWellbeing: DimensionScore;
  healthLongevity: DimensionScore;
  freedomAgency: DimensionScore;
  securityOrder: DimensionScore;
  socialCohesion: DimensionScore;
  culturalFlourishing: DimensionScore;
  sustainability: DimensionScore;
}

export interface DimensionWeights {
  materialWellbeing: number;
  healthLongevity: number;
  freedomAgency: number;
  securityOrder: number;
  socialCohesion: number;
  culturalFlourishing: number;
  sustainability: number;
}

export interface EudaimoniaRecord {
  turn: number;
  date: PersianDate;
  composite: number;
  dimensions: EudaimoniaDimensions;
}

export interface EudaimoniaState {
  composite: number;
  trend: Trend;
  dimensions: EudaimoniaDimensions;
  regional: Map<RegionId, EudaimoniaDimensions>;
  history: EudaimoniaRecord[];
  playerWeights: DimensionWeights;
}

// =============================================================================
// ECONOMY STATE
// =============================================================================

export interface EconomyState {
  gdpGrowth: number;
  inflation: number;
  unemployment: number;
  oilPrice: number;
  oilProduction: number;
  sanctions: number;
  foreignInvestment: number;
  currencyValue: number;
}

// =============================================================================
// INTERNATIONAL STATE
// =============================================================================

export interface CountryRelation {
  countryId: string;
  diplomaticLevel: number;
  economicTies: number;
  militaryCooperation: number;
  publicSentiment: number;
}

export interface InternationalState {
  relations: Map<string, CountryRelation>;
  sanctionsLevel: number;
  internationalIsolation: number;
  diasporaInfluence: number;
}

// =============================================================================
// HISTORY STATE
// =============================================================================

export interface EventRecord {
  id: string;
  eventId: EventId;
  turn: number;
  date: PersianDate;
  involvedEntities: EntityId[];
  outcome: string;
}

export interface DecisionRecord {
  id: string;
  eventId: EventId;
  decisionId: string;
  turn: number;
  date: PersianDate;
  choiceId: string;
  immediateEffects: Effect[];
  scheduledEffects: ScheduledConsequence[];
}

export interface ConsequenceNarrative {
  title: LocalizedString;
  description: LocalizedString;
  mood: 'positive' | 'negative' | 'neutral';
}

export interface ScheduledConsequence {
  id: string;
  sourceDecisionId: string;
  triggerTurn: number;
  triggerCondition: Condition | null;
  probability: number;
  effects: Effect[];
  narrative: ConsequenceNarrative | LocalizedString;  // Accept both formats
  triggered: boolean;
}

export type MemoryType =
  | 'promise_made'
  | 'promise_kept'
  | 'promise_broken'
  | 'betrayal'
  | 'help_given'
  | 'sacrifice'
  | 'milestone';

export interface MemoryRecord {
  id: string;
  type: MemoryType;
  turn: number;
  content: unknown;
  involvedEntities: EntityId[];
  importance: number;
  lastSurfaced: number | null;
}

// Alias for backward compatibility
export interface MemoryEntry extends MemoryRecord {}

export interface RelationshipChange {
  turn: number;
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface HistoryState {
  events: EventRecord[];
  decisions: DecisionRecord[];
  pendingConsequences: ScheduledConsequence[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  memories: any[];  // Accept various memory formats from different engines
  relationshipHistory: Map<EntityId, RelationshipChange[]>;
}

// =============================================================================
// ACTIVE STATE
// =============================================================================

export interface CurrentTurnState {
  turn: number;
  phase: TurnPhase;
  eventsToProcess: GameEvent[];
  eventsProcessed: EventRecord[];
  currentEvent: GameEvent | null;
  awaitingDecision: boolean;
}

export type DialogType = 'advisor' | 'character' | 'system' | 'learn_more';

export interface DialogCallbacks {
  onClose: () => void;
  onResponse?: (response: string) => void;
}

export interface DialogState {
  type: DialogType;
  data: unknown;
  callbacks: DialogCallbacks;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title?: string | LocalizedString;
  message: string | LocalizedString;
  timestamp?: number;
  turn?: number;  // For engine compatibility
  read: boolean;
}

export type ViewType = 'map' | 'factions' | 'characters' | 'economy' | 'international' | 'history';

export interface UIState {
  currentView: ViewType;
  selectedRegion: RegionId | null;
  selectedFaction: FactionId | null;
  selectedCharacter: CharacterId | null;
  panelStates: Map<string, boolean>;
}

export interface ActiveState {
  currentTurn: CurrentTurnState | null;
  activeDialog: DialogState | null;
  notifications: Notification[];
  ui: UIState;
}

// =============================================================================
// WORLD STATE
// =============================================================================

export type FlagValue = string | number | boolean;

export interface WorldState {
  factions: Map<FactionId, FactionState>;
  characters: Map<CharacterId, CharacterState>;
  regions: Map<RegionId, RegionState>;
  regime: RegimeState;
  flags: Map<string, FlagValue>;
}

// =============================================================================
// EFFECTS AND CONDITIONS
// =============================================================================

export type EffectType =
  | 'state_change'
  | 'faction_trust'
  | 'faction_power'
  | 'character_relationship'
  | 'resource_change'
  | 'flag_set'
  | 'flag_clear'
  | 'trigger_event'
  | 'block_event';

export interface Effect {
  type: EffectType;
  target: string;
  value: number | string | boolean;
  duration?: number;
}

export type ConditionType =
  | 'state_check'
  | 'event_happened'
  | 'event_not_happened'
  | 'faction_check'
  | 'character_check'
  | 'flag_check'
  // Extended types for engine compatibility
  | 'flag'
  | 'stat'
  | 'relationship'
  | 'event'
  | 'resource'
  | 'and'
  | 'or'
  | 'not'
  | 'regime_stat'
  | 'player_resource'
  | 'player_position'
  | 'eudaimonia'
  | 'turn';

export type ComparisonOperator =
  | '=='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'contains'
  | 'not_contains'
  // Extended operators for engine compatibility
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'eq'
  | 'neq'
  | 'exists'
  // Verbose operators used in YAML
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'equals'
  | 'notEquals'
  | 'not_exists'
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'between'
  | 'occurred'
  | 'not_occurred'
  | 'outcome_was';

export interface Condition {
  type: ConditionType;
  path?: string;
  target?: string;  // For engine compatibility
  operator: ComparisonOperator;
  value: unknown;
  conditions?: Condition[];  // For 'and', 'or', 'not' types
}

// =============================================================================
// EVENTS
// =============================================================================

export type EventType = 'story' | 'triggered' | 'scheduled' | 'random' | 'faction';
export type EventCategory = EventType; // Alias for backward compatibility

export interface DecisionEffects {
  immediate: Effect[];
  delayed: Array<{
    delay: number;
    probability: number;
    effects: Effect[];
    narrative: ConsequenceNarrative | LocalizedString;  // Accept both formats
    condition?: Condition;
  }>;
}

export interface Decision {
  id: string;
  label: LocalizedString;
  description: LocalizedString;
  available?: boolean;
  requirements: Condition[];
  effects: DecisionEffects;
  factionReactions?: Map<FactionId, { trustChange: number; triggersResponse?: string }>;
  tone?: 'pragmatic' | 'principled' | 'ruthless' | 'compassionate';
  advisorOpinions?: Map<string, string>;
  tags?: string[];
}

export type EventTriggerType = 'random' | 'turn' | 'date' | 'condition' | 'flag';

export interface EventTrigger {
  type: EventTriggerType;
  value: unknown;
}

export interface EventTriggers {
  conditions: Condition[];
  probability: number;
  priority: number;
  cooldown: number;
  maxOccurrences: number;
}

export interface EventTiming {
  when: 'immediate' | 'start_of_turn' | 'end_of_turn' | 'scheduled';
  scheduledDate?: PersianDate;
  duration: number;
  deadline: number;
}

export interface LearnMoreTopic {
  title: LocalizedString;
  content: LocalizedString;
  sources: string[];
}

export interface EventPresentation {
  image: string;
  mood: 'tense' | 'hopeful' | 'tragic' | 'triumphant' | 'neutral';
  musicCue?: string;
}

export interface EventContext {
  whatHappened: LocalizedString;
  whyItMatters: LocalizedString;
  whoIsInvolved: CharacterId[];
  historicalParallel?: string;
}

export interface GameEvent {
  id: EventId;
  title: LocalizedString;
  type: EventType;
  category?: EventCategory;  // Alias for type, for engine compatibility
  description: LocalizedString;
  context?: EventContext;
  triggers?: EventTriggers;
  timing?: EventTiming;
  decisions: Decision[];
  presentation?: EventPresentation;
  learnMore?: LearnMoreTopic[];
  // Additional properties for converted events
  image?: string;
  metadata?: {
    priority?: number;
    tags?: string[];
    relatedEvents?: string[];
  };
}

// =============================================================================
// ENDINGS
// =============================================================================

export type EndingCategory =
  | 'democratic'
  | 'authoritarian_soft'
  | 'authoritarian_hard'
  | 'fragmentation'
  | 'stalemate';

export type PersonalEndingType =
  | 'triumph'
  | 'pyrrhic_victory'
  | 'martyrdom'
  | 'survival'
  | 'exile'
  | 'imprisonment';

export interface PoliticalEnding {
  id: string;
  name: LocalizedString;
  category: EndingCategory;
  description: LocalizedString;
  conditions: Condition[];
  eudaimoniaTypical: EudaimoniaDimensions;
  epilogueTone: string;
}

export interface PersonalEnding {
  type: PersonalEndingType;
  description: LocalizedString;
  conditions: Condition[];
}

export interface CombinedEnding {
  political: PoliticalEnding;
  personal: PersonalEnding;
}

// =============================================================================
// ROOT GAME STATE
// =============================================================================

export interface GameState {
  meta: GameMeta & { flags?: Map<string, FlagValue>; history?: HistoryRecord[] };  // Extended meta
  time: TimeState;
  player: PlayerState;
  world: WorldState;
  regime?: RegimeState;  // Shortcut alias to world.regime for engine compatibility
  eudaimonia: EudaimoniaState | EudaimoniaSimple;  // Support both formats
  economy: EconomyState;
  international: InternationalState;
  history: HistoryState;
  active: ActiveState;
}

// Simplified eudaimonia format used by some components
export interface EudaimoniaSimple {
  materialWellbeing: number;
  healthLongevity: number;
  freedomAgency: number;
  securityOrder: number;
  socialCohesion: number;
  culturalFlourishing: number;
  sustainability: number;
}

// History record for meta.history
export interface HistoryRecord {
  turn: number;
  type: string;
  summary?: string;
  decisionId?: string;
}

// =============================================================================
// SAVE FILE
// =============================================================================

export interface SaveMetadata {
  characterName: string;
  turn: number;
  date: string;
  playTime: number;
  lastEvent: string;
  thumbnail: string | null;
}

export interface SaveFile {
  version: string;
  timestamp: string;
  checksum: string;
  state: GameState;
  metadata: SaveMetadata;
}
