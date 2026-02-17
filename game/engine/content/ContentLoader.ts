/**
 * IRAN 14XX - Content Loader
 *
 * Loads game content from YAML files:
 * - Events (story, triggered, scheduled, random)
 * - Characters (playable and NPCs)
 * - Factions
 * - Regions
 * - Endings
 *
 * Handles validation, localization, and content relationships.
 */

import * as yaml from 'yaml';
import type {
  LocalizedString,
  CharacterId,
  FactionId,
  RegionId,
  Condition,
  Effect,
  EventCategory,
} from '../core/types';
import type { EventDefinition, DecisionDefinition, EventTrigger } from '../core/EventEngine';

type EventTriggerType = EventTrigger['type'];

// =============================================================================
// TYPES
// =============================================================================

export interface CharacterContent {
  id: CharacterId;
  name: LocalizedString;
  title?: LocalizedString;
  portrait: string;
  biography: LocalizedString;

  // Starting conditions (required for playable, optional for NPCs)
  startingPosition?: {
    location: RegionId;
    officialRole?: string;
    factionMemberships: Array<{
      factionId: FactionId;
      role: string;
      trust: number;
    }>;
  };

  startingResources?: {
    influence: number;
    money: number;
    actionsPerTurn: number;
  };

  // Personal attributes (required for playable, optional for NPCs)
  personal?: {
    age: number;
    traits: string[];
    beliefs: {
      economicLeft: number;
      socialLiberal: number;
      nationalist: number;
      religious: number;
      democratic: number;
    };
    priorities: string[];
    redLines: string[];
  };

  // Narrative (required for playable, optional for NPCs)
  backstory?: LocalizedString;
  motivations?: LocalizedString;
  challenges?: LocalizedString[];

  // Game balance
  difficulty?: 'easy' | 'normal' | 'hard' | 'expert';
  tags: string[];

  // NPC-specific fields
  role?: string;
  personality?: {
    traits: string[];
    beliefs: {
      economicLeft: number;
      socialLiberal: number;
      nationalist: number;
      religious: number;
      democratic: number;
    };
  };
  relationships?: Array<{
    characterId: CharacterId;
    type: string;
    trust: number;
    description?: LocalizedString;
  }>;
  status?: {
    health: number;
    influence: number;
    visibility: string;
    security: string;
  };
  goals?: string[];
  fears?: string[];
  triggers?: unknown[];
}

export interface FactionContent {
  id: FactionId;
  name: LocalizedString;
  shortName: LocalizedString;
  description: LocalizedString;

  // Classification
  category: 'regime' | 'opposition' | 'society' | 'external' | 'underground';
  subcategory: string;

  // Power and influence
  power: {
    base: number;
    military: number;
    economic: number;
    religious: number;
    popular: number;
  };

  // Ideological position
  ideology: {
    economicLeft: number;
    socialLiberal: number;
    nationalist: number;
    religious: number;
    democratic: number;
  };

  // Interests and goals
  interests: {
    survival: string[];
    shortTerm: string[];
    longTerm: string[];
    redLines: string[];
  };

  // Leadership
  leaders: CharacterId[];
  keyMembers: CharacterId[];

  // Relationships
  relationships: Array<{
    factionId: FactionId;
    type: 'ally' | 'rival' | 'enemy' | 'neutral';
    trust: number;
    reason: LocalizedString;
  }>;

  // Behavior
  behavior: {
    aggression: number;
    cooperation: number;
    riskTolerance: number;
    pragmatism: number;
  };

  // Visual
  color: string;
  icon: string;

  tags: string[];
}

export interface RegionContent {
  id: RegionId;
  name: LocalizedString;
  capital: string;
  population: number;

  // Demographics
  demographics: {
    persian: number;
    azeri: number;
    kurd: number;
    arab: number;
    baluch: number;
    other: number;
  };

  // Economy
  economy: {
    gdpContribution: number;
    mainIndustries: string[];
    unemployment: number;
    oilProduction?: number;
  };

  // Politics
  politics: {
    regimeControl: number;
    oppositionStrength: number;
    dominantFactions: FactionId[];
    grievances: string[];
  };

  // Geography
  geography: {
    borders: RegionId[];
    terrain: string;
    strategicImportance: number;
    borderCountries?: string[];
  };

  tags: string[];
}

export interface EndingContent {
  id: string;
  category: 'democratic' | 'authoritarian' | 'fragmentation' | 'stalemate' | 'personal';
  title: LocalizedString;
  description: LocalizedString;

  conditions: Condition[];

  epilogue: LocalizedString;

  eudaimoniaModifiers: {
    materialWellbeing?: number;
    healthLongevity?: number;
    freedomAgency?: number;
    securityOrder?: number;
    socialCohesion?: number;
    culturalFlourishing?: number;
    sustainability?: number;
  };

  unlocks?: string[];
  achievement?: string;

  tags: string[];
}

export interface ContentManifest {
  version: string;
  events: string[];
  characters: string[];
  factions: string[];
  regions: string[];
  endings: string[];
}

export interface LoadedContent {
  events: Map<string, EventDefinition>;
  characters: Map<CharacterId, CharacterContent>;
  factions: Map<FactionId, FactionContent>;
  regions: Map<RegionId, RegionContent>;
  endings: Map<string, EndingContent>;
}

// =============================================================================
// CONTENT LOADER CLASS
// =============================================================================

export class ContentLoader {
  private content: LoadedContent = {
    events: new Map(),
    characters: new Map(),
    factions: new Map(),
    regions: new Map(),
    endings: new Map(),
  };

  private basePath: string;
  private errors: string[] = [];

  constructor(basePath: string = '/game/content') {
    this.basePath = basePath;
  }

  // ---------------------------------------------------------------------------
  // LOADING METHODS
  // ---------------------------------------------------------------------------

  async loadAll(): Promise<LoadedContent> {
    // Load manifest
    const manifest = await this.loadManifest();

    // Load all content in parallel
    await Promise.all([
      this.loadAllEvents(manifest.events),
      this.loadAllCharacters(manifest.characters),
      this.loadAllFactions(manifest.factions),
      this.loadAllRegions(manifest.regions),
      this.loadAllEndings(manifest.endings),
    ]);

    // Validate relationships
    this.validateRelationships();

    // Errors are stored in this.errors for later retrieval via getErrors()

    return this.content;
  }

  private async loadManifest(): Promise<ContentManifest> {
    try {
      const response = await fetch(`${this.basePath}/manifest.yaml`);
      const text = await response.text();
      return yaml.parse(text) as ContentManifest;
    } catch (error) {
      // Return default manifest for development
      return {
        version: '1.0',
        events: [
          'story/prologue.yaml',
          'triggered/regime_crisis.yaml',
          'scheduled/elections.yaml',
          'random/daily.yaml',
        ],
        characters: [
          'playable/reformer.yaml',
          'playable/activist.yaml',
          'npc/khamenei.yaml',
        ],
        factions: [
          'regime/supreme_leader_office.yaml',
          'regime/irgc.yaml',
          'opposition/reformists.yaml',
        ],
        regions: ['tehran.yaml', 'isfahan.yaml'],
        endings: ['democratic.yaml', 'authoritarian.yaml'],
      };
    }
  }

  private async loadAllEvents(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        const events = await this.loadEventFile(`${this.basePath}/events/${path}`);
        for (const event of events) {
          this.content.events.set(event.id, event);
        }
      } catch (error) {
        this.errors.push(`Failed to load events from ${path}: ${error}`);
      }
    }
  }

  private async loadEventFile(path: string): Promise<EventDefinition[]> {
    try {
      const response = await fetch(path);
      const text = await response.text();
      const data = yaml.parse(text) as Record<string, unknown>;

      if (Array.isArray(data)) {
        return data.map((e: Record<string, unknown>) => this.parseEvent(e));
      } else if (data.events && Array.isArray(data.events)) {
        return (data.events as Record<string, unknown>[]).map(e => this.parseEvent(e));
      } else {
        return [this.parseEvent(data)];
      }
    } catch (error) {
      throw new Error(`Error loading ${path}: ${error}`);
    }
  }

  private parseEvent(data: Record<string, unknown>): EventDefinition {
    return {
      id: data.id as string,
      category: (data.category as EventCategory) || 'triggered',
      title: this.parseLocalizedString(data.title),
      description: this.parseLocalizedString(data.description),
      image: data.image as string | undefined,

      triggers: this.parseTriggers(data.triggers),
      priority: (data.priority as number) || 50,
      weight: (data.weight as number) || 1.0,

      once: (data.once as boolean) ?? true,
      cooldown: data.cooldown as number | undefined,

      requirements: this.parseConditions(data.requirements),
      decisions: this.parseDecisions(data.decisions),

      tags: (data.tags as string[]) || [],
      relatedEvents: data.relatedEvents as string[] | undefined,
    };
  }

  private parseTriggers(data: unknown): EventTrigger[] {
    if (!data) {
      return [{ type: 'condition' as EventTriggerType, value: { type: 'flag', target: 'always_true' } }];
    }
    if (!Array.isArray(data)) {
      const trigger = data as { type: string; value: unknown };
      return [{ type: trigger.type as EventTriggerType, value: trigger.value }];
    }
    return data.map((t: { type: string; value: unknown }) => ({
      type: t.type as EventTriggerType,
      value: t.value,
    }));
  }

  private parseConditions(data: unknown): Condition[] {
    if (!data) return [];
    if (!Array.isArray(data)) return [data as Condition];
    return data as Condition[];
  }

  private parseDecisions(data: unknown): DecisionDefinition[] {
    if (!data || !Array.isArray(data)) return [];

    return data.map((d: Record<string, unknown>) => ({
      id: d.id as string,
      label: this.parseLocalizedString(d.label),
      description: this.parseLocalizedString(d.description),
      requirements: this.parseConditions(d.requirements),
      visible: this.parseConditions(d.visible),
      effects: {
        immediate: this.parseEffects(
          (d.effects as Record<string, unknown>)?.immediate
        ),
        delayed: this.parseDelayedEffects(
          (d.effects as Record<string, unknown>)?.delayed
        ),
      },
      outcome: this.parseLocalizedString(d.outcome),
      tags: (d.tags as string[]) || [],
    }));
  }

  private parseEffects(data: unknown): Effect[] {
    if (!data || !Array.isArray(data)) return [];
    return data as Effect[];
  }

  private parseDelayedEffects(data: unknown): Array<{
    delay: number;
    probability: number;
    condition?: Condition;
    effects: Effect[];
    narrative: LocalizedString;
  }> {
    if (!data || !Array.isArray(data)) return [];

    return data.map((d: Record<string, unknown>) => ({
      delay: (d.delay as number) || 1,
      probability: (d.probability as number) || 1.0,
      condition: d.condition as Condition | undefined,
      effects: this.parseEffects(d.effects),
      narrative: this.parseLocalizedString(d.narrative),
    }));
  }

  private async loadAllCharacters(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        const response = await fetch(`${this.basePath}/characters/${path}`);
        const text = await response.text();
        const data = yaml.parse(text);
        const character = this.parseCharacter(data);
        this.content.characters.set(character.id, character);
      } catch (error) {
        this.errors.push(`Failed to load character from ${path}: ${error}`);
      }
    }
  }

  private parseCharacter(data: Record<string, unknown>): CharacterContent {
    // Detect if this is an NPC (has 'role' or 'personality' fields) vs playable character
    const isNPC = !data.startingPosition && (data.role || data.personality);

    // Base fields common to both
    const base: CharacterContent = {
      id: data.id as CharacterId,
      name: this.parseLocalizedString(data.name),
      title: data.title ? this.parseLocalizedString(data.title) : undefined,
      portrait: (data.portrait as string) || 'default.png',
      biography: this.parseLocalizedString(data.biography),
      tags: (data.tags as string[]) || [],
    };

    if (isNPC) {
      // NPC-specific parsing
      return {
        ...base,
        role: data.role as string,
        personality: data.personality as CharacterContent['personality'],
        relationships: data.relationships as CharacterContent['relationships'],
        status: data.status as CharacterContent['status'],
        goals: data.goals as string[],
        fears: data.fears as string[],
        triggers: data.triggers as unknown[],
      };
    } else {
      // Playable character parsing
      return {
        ...base,
        startingPosition: data.startingPosition as CharacterContent['startingPosition'],
        startingResources: {
          influence: 50,
          money: 1000,
          actionsPerTurn: 3,
          ...(data.startingResources as object),
        },
        personal: data.personal as CharacterContent['personal'],
        backstory: data.backstory ? this.parseLocalizedString(data.backstory) : undefined,
        motivations: data.motivations ? this.parseLocalizedString(data.motivations) : undefined,
        challenges: data.challenges
          ? ((data.challenges as unknown[]) || []).map(c => this.parseLocalizedString(c))
          : undefined,
        difficulty: (data.difficulty as CharacterContent['difficulty']) || 'normal',
      };
    }
  }

  private async loadAllFactions(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        const response = await fetch(`${this.basePath}/factions/${path}`);
        const text = await response.text();
        const data = yaml.parse(text);
        const faction = this.parseFaction(data);
        this.content.factions.set(faction.id, faction);
      } catch (error) {
        this.errors.push(`Failed to load faction from ${path}: ${error}`);
      }
    }
  }

  private parseFaction(data: Record<string, unknown>): FactionContent {
    return {
      id: data.id as FactionId,
      name: this.parseLocalizedString(data.name),
      shortName: this.parseLocalizedString(data.shortName || data.name),
      description: this.parseLocalizedString(data.description),
      category: data.category as FactionContent['category'],
      subcategory: (data.subcategory as string) || '',
      power: data.power as FactionContent['power'],
      ideology: data.ideology as FactionContent['ideology'],
      interests: data.interests as FactionContent['interests'],
      leaders: (data.leaders as CharacterId[]) || [],
      keyMembers: (data.keyMembers as CharacterId[]) || [],
      relationships: (data.relationships as FactionContent['relationships']) || [],
      behavior: {
        aggression: 50,
        cooperation: 50,
        riskTolerance: 50,
        pragmatism: 50,
        ...(data.behavior as object),
      },
      color: (data.color as string) || '#666666',
      icon: (data.icon as string) || 'default',
      tags: (data.tags as string[]) || [],
    };
  }

  private async loadAllRegions(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        const response = await fetch(`${this.basePath}/regions/${path}`);
        const text = await response.text();
        const data = yaml.parse(text);
        const region = this.parseRegion(data);
        this.content.regions.set(region.id, region);
      } catch (error) {
        this.errors.push(`Failed to load region from ${path}: ${error}`);
      }
    }
  }

  private parseRegion(data: Record<string, unknown>): RegionContent {
    return {
      id: data.id as RegionId,
      name: this.parseLocalizedString(data.name),
      capital: (data.capital as string) || '',
      population: (data.population as number) || 0,
      demographics: data.demographics as RegionContent['demographics'],
      economy: data.economy as RegionContent['economy'],
      politics: data.politics as RegionContent['politics'],
      geography: data.geography as RegionContent['geography'],
      tags: (data.tags as string[]) || [],
    };
  }

  private async loadAllEndings(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        const response = await fetch(`${this.basePath}/endings/${path}`);
        const text = await response.text();
        const data = yaml.parse(text);

        if (Array.isArray(data)) {
          for (const ending of data) {
            const parsed = this.parseEnding(ending);
            this.content.endings.set(parsed.id, parsed);
          }
        } else if (data.endings) {
          for (const ending of data.endings) {
            const parsed = this.parseEnding(ending);
            this.content.endings.set(parsed.id, parsed);
          }
        } else {
          const parsed = this.parseEnding(data);
          this.content.endings.set(parsed.id, parsed);
        }
      } catch (error) {
        this.errors.push(`Failed to load ending from ${path}: ${error}`);
      }
    }
  }

  private parseEnding(data: Record<string, unknown>): EndingContent {
    return {
      id: data.id as string,
      category: data.category as EndingContent['category'],
      title: this.parseLocalizedString(data.title),
      description: this.parseLocalizedString(data.description),
      conditions: this.parseConditions(data.conditions),
      epilogue: this.parseLocalizedString(data.epilogue),
      eudaimoniaModifiers: (data.eudaimoniaModifiers as EndingContent['eudaimoniaModifiers']) || {},
      unlocks: data.unlocks as string[] | undefined,
      achievement: data.achievement as string | undefined,
      tags: (data.tags as string[]) || [],
    };
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  private parseLocalizedString(data: unknown): LocalizedString {
    if (typeof data === 'string') {
      return { fa: data, en: data };
    }
    if (data && typeof data === 'object') {
      const obj = data as Record<string, string>;
      return {
        fa: obj.fa || obj.en || '',
        en: obj.en || obj.fa || '',
      };
    }
    return { fa: '', en: '' };
  }

  private validateRelationships(): void {
    // Validate faction relationships reference valid factions
    for (const [id, faction] of this.content.factions) {
      for (const rel of faction.relationships) {
        if (!this.content.factions.has(rel.factionId)) {
          this.errors.push(
            `Faction ${id} references unknown faction ${rel.factionId}`
          );
        }
      }

      // Validate leader references
      for (const leaderId of faction.leaders) {
        if (!this.content.characters.has(leaderId)) {
          this.errors.push(
            `Faction ${id} references unknown leader ${leaderId}`
          );
        }
      }
    }

    // Validate event references
    for (const [id, event] of this.content.events) {
      if (event.relatedEvents) {
        for (const relatedId of event.relatedEvents) {
          if (!this.content.events.has(relatedId)) {
            this.errors.push(
              `Event ${id} references unknown event ${relatedId}`
            );
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // ACCESSORS
  // ---------------------------------------------------------------------------

  getContent(): LoadedContent {
    return this.content;
  }

  getEvent(id: string): EventDefinition | undefined {
    return this.content.events.get(id);
  }

  getCharacter(id: CharacterId): CharacterContent | undefined {
    return this.content.characters.get(id);
  }

  getFaction(id: FactionId): FactionContent | undefined {
    return this.content.factions.get(id);
  }

  getRegion(id: RegionId): RegionContent | undefined {
    return this.content.regions.get(id);
  }

  getEnding(id: string): EndingContent | undefined {
    return this.content.endings.get(id);
  }

  getErrors(): string[] {
    return this.errors;
  }

  // ---------------------------------------------------------------------------
  // CONTENT QUERIES
  // ---------------------------------------------------------------------------

  getPlayableCharacters(): CharacterContent[] {
    return Array.from(this.content.characters.values())
      .filter(c => c.tags.includes('playable'));
  }

  getFactionsByCategory(category: FactionContent['category']): FactionContent[] {
    return Array.from(this.content.factions.values())
      .filter(f => f.category === category);
  }

  getEventsByCategory(category: EventCategory): EventDefinition[] {
    return Array.from(this.content.events.values())
      .filter(e => e.category === category);
  }

  getEndingsByCategory(category: EndingContent['category']): EndingContent[] {
    return Array.from(this.content.endings.values())
      .filter(e => e.category === category);
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let contentLoaderInstance: ContentLoader | null = null;

export function getContentLoader(): ContentLoader {
  if (!contentLoaderInstance) {
    contentLoaderInstance = new ContentLoader();
  }
  return contentLoaderInstance;
}

export function initializeContentLoader(basePath?: string): ContentLoader {
  contentLoaderInstance = new ContentLoader(basePath);
  return contentLoaderInstance;
}
