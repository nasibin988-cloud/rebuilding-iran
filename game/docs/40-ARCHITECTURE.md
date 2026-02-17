# Technical Architecture

## Overview

IRAN 14XX is a web-based political simulation game built with modern technologies optimized for:
- **Mobile-first** design (many users in Iran on phones)
- **Offline capability** (unreliable internet)
- **Persian-first** with RTL support
- **AI integration** for dynamic content
- **Extensible content** via YAML-based event system

---

## Technology Stack

### Frontend

```yaml
FRONTEND:
  framework: Next.js 14+ (App Router)
  language: TypeScript
  styling: Tailwind CSS + shadcn/ui
  state: Zustand (with persistence)
  i18n: next-intl
  rtl: Native CSS support + tailwind-rtl

  rationale:
    - Next.js: SSG for initial load, hydration for interactivity
    - TypeScript: Type safety for complex game state
    - Tailwind: Rapid UI development, RTL support
    - Zustand: Simple state management, localStorage persistence
```

### Backend

```yaml
BACKEND:
  runtime: Edge Runtime (Cloudflare Workers / Vercel Edge)
  api: tRPC or REST endpoints
  ai: Claude API (Anthropic)
  database: SQLite (Turso) or Cloudflare D1

  rationale:
    - Edge: Low latency globally, including Middle East
    - Minimal backend: Most game logic client-side
    - AI: Dynamic advisor conversations, content generation
```

### Content

```yaml
CONTENT:
  format: YAML
  storage: Static files (compiled into app)
  localization: Separate Persian/English files
  validation: JSON Schema

  rationale:
    - YAML: Human-readable, author-friendly
    - Static: No database needed for content
    - Compiled: Validated at build time
```

---

## Project Structure

```
iran-14xx/
├── app/                          # Next.js app router
│   ├── [locale]/                 # Localized routes
│   │   ├── page.tsx              # Landing/start
│   │   ├── game/
│   │   │   ├── page.tsx          # Main game
│   │   │   └── [character]/
│   │   │       └── page.tsx      # Character-specific start
│   │   ├── learn/
│   │   │   └── page.tsx          # Educational content
│   │   └── about/
│   │       └── page.tsx          # About the game
│   ├── api/                      # API routes
│   │   ├── ai/
│   │   │   └── route.ts          # AI advisor endpoints
│   │   └── analytics/
│   │       └── route.ts          # Anonymous analytics
│   └── layout.tsx                # Root layout
│
├── engine/                       # Game engine (core logic)
│   ├── core/
│   │   ├── GameState.ts          # Central state management
│   │   ├── TurnEngine.ts         # Turn processing
│   │   ├── EventEngine.ts        # Event evaluation/triggering
│   │   ├── ConsequenceEngine.ts  # Delayed effects
│   │   ├── FactionEngine.ts      # Faction AI
│   │   └── EudaimoniaEngine.ts   # Scoring system
│   ├── content/
│   │   ├── ContentLoader.ts      # YAML loading
│   │   ├── EventParser.ts        # Event parsing
│   │   └── ValidationSchema.ts   # Content validation
│   ├── ai/
│   │   ├── AdvisorSystem.ts      # AI advisor integration
│   │   └── PromptTemplates.ts    # Prompt engineering
│   └── save/
│       ├── SaveManager.ts        # Save/load
│       └── Migration.ts          # Save file migration
│
├── content/                      # Game content (YAML)
│   ├── events/
│   │   ├── story/                # Story events
│   │   ├── triggered/            # Conditional events
│   │   ├── scheduled/            # Calendar events
│   │   └── random/               # Probabilistic events
│   ├── characters/
│   │   ├── playable/             # Playable character definitions
│   │   └── npc/                  # NPC definitions
│   ├── factions/                 # Faction definitions
│   ├── endings/                  # Ending definitions
│   └── learn-more/               # Educational content
│
├── components/                   # React components
│   ├── game/
│   │   ├── GameContainer.tsx     # Main game container
│   │   ├── TurnPhase.tsx         # Turn phase display
│   │   ├── EventCard.tsx         # Event presentation
│   │   ├── DecisionPanel.tsx     # Decision interface
│   │   ├── AdvisorPanel.tsx      # AI advisor
│   │   ├── FactionPanel.tsx      # Faction status
│   │   ├── EudaimoniaDisplay.tsx # Score display
│   │   └── MapView.tsx           # Interactive map
│   ├── ui/                       # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ... (shadcn components)
│   └── layout/
│       ├── Header.tsx
│       ├── Navigation.tsx
│       └── Footer.tsx
│
├── hooks/                        # React hooks
│   ├── useGameState.ts
│   ├── useTurn.ts
│   ├── useAdvisor.ts
│   └── useSave.ts
│
├── lib/                          # Utilities
│   ├── i18n.ts                   # Internationalization
│   ├── rtl.ts                    # RTL utilities
│   └── analytics.ts              # Privacy-respecting analytics
│
├── public/
│   ├── assets/
│   │   ├── portraits/            # Character portraits
│   │   ├── events/               # Event images
│   │   ├── maps/                 # Map assets
│   │   └── audio/                # Sound/music
│   └── locales/
│       ├── fa/                   # Persian translations
│       └── en/                   # English translations
│
├── docs/                         # Design documentation (this directory)
│
└── tests/
    ├── unit/                     # Unit tests
    ├── integration/              # Integration tests
    └── e2e/                      # End-to-end tests
```

---

## Core Engine Architecture

### Game State

```typescript
// engine/core/GameState.ts

interface GameState {
  // Meta
  version: string;
  saveId: string;
  createdAt: Date;
  lastPlayed: Date;

  // Time
  turn: number;
  date: PersianDate;
  phase: TurnPhase;

  // Player
  player: PlayerState;

  // World
  factions: Map<FactionId, FactionState>;
  characters: Map<CharacterId, CharacterState>;
  regions: Map<RegionId, RegionState>;

  // Systems
  eudaimonia: EudaimoniaState;
  economy: EconomyState;
  international: InternationalState;

  // History
  eventHistory: EventRecord[];
  decisionHistory: DecisionRecord[];
  consequenceQueue: ScheduledConsequence[];

  // Flags
  flags: Map<string, any>;
}

interface PlayerState {
  characterId: CharacterId;
  resources: Resources;
  relationships: Map<string, Relationship>;
  position: Position;
  traits: Trait[];
  memories: Memory[];
}

interface FactionState {
  id: FactionId;
  power: PowerMetrics;
  relationships: Map<FactionId, FactionRelationship>;
  objectives: Objective[];
  unity: number;
  morale: number;
}
```

### Turn Engine

```typescript
// engine/core/TurnEngine.ts

class TurnEngine {
  private state: GameState;
  private eventEngine: EventEngine;
  private consequenceEngine: ConsequenceEngine;
  private factionEngine: FactionEngine;

  async processTurn(): Promise<TurnResult> {
    const phases: TurnPhaseResult[] = [];

    // Phase 1: Briefing
    phases.push(await this.executeBriefingPhase());

    // Phase 2: Process consequences from previous turns
    phases.push(await this.processConsequences());

    // Phase 3: Generate and present events
    const events = await this.eventEngine.generateEvents(this.state);
    for (const event of events) {
      phases.push(await this.processEvent(event));
    }

    // Phase 4: Faction AI turns
    phases.push(await this.factionEngine.processFactionTurns(this.state));

    // Phase 5: Update scores
    phases.push(await this.updateScores());

    // Phase 6: Check for endings
    const ending = this.checkForEnding();
    if (ending) {
      return { phases, ending, continueGame: false };
    }

    // Advance turn
    this.advanceTurn();

    return { phases, ending: null, continueGame: true };
  }

  private async processEvent(event: GameEvent): Promise<EventPhaseResult> {
    // Present event to player
    const presentation = this.presentEvent(event);

    // Wait for player decision
    const decision = await this.awaitPlayerDecision(event);

    // Apply immediate effects
    this.applyEffects(event, decision);

    // Schedule delayed effects
    this.consequenceEngine.scheduleEffects(event, decision);

    // Record in history
    this.recordDecision(event, decision);

    return { event, decision, effects: this.state.getChanges() };
  }
}
```

### Event Engine

```typescript
// engine/core/EventEngine.ts

class EventEngine {
  private eventLibrary: EventLibrary;
  private evaluator: ConditionEvaluator;

  async generateEvents(state: GameState): Promise<GameEvent[]> {
    const candidates: GameEvent[] = [];

    // Story events (pre-scripted, condition-based)
    candidates.push(...this.getTriggeredStoryEvents(state));

    // Scheduled events (calendar-based)
    candidates.push(...this.getScheduledEvents(state.date));

    // Faction events (faction AI actions)
    candidates.push(...this.generateFactionEvents(state));

    // Random events (probability-based)
    candidates.push(...this.generateRandomEvents(state));

    // Prioritize and limit
    return this.prioritizeEvents(candidates, state);
  }

  private getTriggeredStoryEvents(state: GameState): GameEvent[] {
    return this.eventLibrary.storyEvents
      .filter(event => {
        // Check all conditions
        return event.conditions.every(condition =>
          this.evaluator.evaluate(condition, state)
        );
      })
      .filter(event => {
        // Check cooldown and occurrence limits
        return this.checkEventLimits(event, state);
      });
  }

  private generateFactionEvents(state: GameState): GameEvent[] {
    const events: GameEvent[] = [];

    for (const [factionId, faction] of state.factions) {
      if (this.factionWillAct(faction, state)) {
        const action = this.chooseFactionAction(faction, state);
        const event = this.createFactionEvent(faction, action);
        events.push(event);
      }
    }

    return events;
  }
}
```

### Consequence Engine

```typescript
// engine/core/ConsequenceEngine.ts

interface ScheduledConsequence {
  id: string;
  sourceEventId: string;
  sourceDecisionId: string;
  triggerTurn: number;
  triggerCondition?: Condition;
  probability: number;
  effects: Effect[];
  narrative: ConsequenceNarrative;
}

class ConsequenceEngine {
  private queue: ScheduledConsequence[] = [];

  scheduleEffects(event: GameEvent, decision: Decision): void {
    const effects = decision.effects.delayed;

    for (const effect of effects) {
      this.queue.push({
        id: generateId(),
        sourceEventId: event.id,
        sourceDecisionId: decision.id,
        triggerTurn: this.state.turn + effect.delay,
        triggerCondition: effect.condition,
        probability: effect.probability ?? 1.0,
        effects: effect.effects,
        narrative: effect.narrative,
      });
    }
  }

  processConsequences(state: GameState): ConsequenceResult[] {
    const triggered: ConsequenceResult[] = [];
    const remaining: ScheduledConsequence[] = [];

    for (const consequence of this.queue) {
      // Check if should trigger
      const shouldTrigger =
        consequence.triggerTurn <= state.turn &&
        (!consequence.triggerCondition ||
          this.evaluator.evaluate(consequence.triggerCondition, state));

      if (shouldTrigger) {
        // Roll for probability
        if (Math.random() < consequence.probability) {
          // Execute consequence
          const result = this.executeConsequence(consequence, state);
          triggered.push(result);
        }
      } else if (consequence.triggerTurn > state.turn) {
        // Keep for later
        remaining.push(consequence);
      }
      // else: condition not met, discard
    }

    this.queue = remaining;
    return triggered;
  }

  private executeConsequence(
    consequence: ScheduledConsequence,
    state: GameState
  ): ConsequenceResult {
    // Apply effects
    for (const effect of consequence.effects) {
      this.applyEffect(effect, state);
    }

    // Generate narrative
    const narrative = this.generateNarrative(consequence);

    return {
      consequence,
      narrative,
      stateChanges: state.getChanges(),
    };
  }
}
```

---

## Content System

### YAML Event Format

```yaml
# content/events/story/labor/worker_strike.yaml

id: isfahan_steel_strike
type: story
category: labor

metadata:
  author: content_team
  version: 1.0
  last_updated: 2026-02-15
  test_coverage: [test_labor_001, test_labor_002]

triggers:
  conditions:
    - type: state_check
      path: economy.labor_unrest
      operator: ">="
      value: 60
    - type: event_happened
      event: ahvaz_refinery_strike
    - type: event_not_happened
      event: strike_crushed_recently
  priority: 80
  probability: 0.8

content:
  title:
    fa: "اعتصاب کارگران فولاد"
    en: "Steel Workers Strike"

  description:
    fa: |
      اعتصاب کارخانه فولاد اصفهان وارد سومین هفته شده است...
    en: |
      The strike at Isfahan Steel has entered its third week...

  image: assets/events/isfahan_strike.jpg
  mood: tense

decisions:
  - id: meet_leaders
    label:
      fa: "ملاقات با رهبران اعتصاب"
      en: "Meet with strike leaders"

    effects:
      immediate:
        - type: faction_trust
          faction: labor_movement
          change: 15
        - type: state_change
          path: player.regime_attention
          change: 20

      delayed:
        - type: relationship
          target: hassan_kargar
          change: 25
          delay: 1

    narrative:
      fa: "شما به اصفهان سفر کردید..."
      en: "You traveled to Isfahan..."

learn_more:
  - topic: labor_history
    title:
      fa: "تاریخچه اعتصابات کارگری در ایران"
      en: "History of Labor Strikes in Iran"
    content:
      fa: |
        اعتصاب کارگران نفت در سال ۱۳۵۷...
      en: |
        The oil workers' strike of 1978...
```

### Content Loader

```typescript
// engine/content/ContentLoader.ts

class ContentLoader {
  private cache: Map<string, any> = new Map();

  async loadEvents(): Promise<EventLibrary> {
    const library: EventLibrary = {
      storyEvents: [],
      scheduledEvents: [],
      randomEvents: [],
    };

    // Load all YAML files from content/events
    const eventFiles = await this.glob('content/events/**/*.yaml');

    for (const file of eventFiles) {
      const content = await this.loadYaml(file);
      const validated = this.validateEvent(content);

      switch (validated.type) {
        case 'story':
          library.storyEvents.push(validated);
          break;
        case 'scheduled':
          library.scheduledEvents.push(validated);
          break;
        case 'random':
          library.randomEvents.push(validated);
          break;
      }
    }

    return library;
  }

  private validateEvent(content: any): GameEvent {
    // Validate against JSON Schema
    const errors = this.validator.validate(content, EventSchema);
    if (errors.length > 0) {
      throw new ContentValidationError(errors);
    }

    return content as GameEvent;
  }
}
```

---

## AI Integration

### Advisor System

```typescript
// engine/ai/AdvisorSystem.ts

interface AdvisorRequest {
  type: 'decision_advice' | 'question' | 'historical_parallel';
  context: {
    event: GameEvent;
    decision?: Decision;
    question?: string;
  };
  state: GameState;
  advisorType: 'strategic' | 'ethical' | 'pragmatic' | 'historical';
}

class AdvisorSystem {
  private anthropic: Anthropic;
  private promptBuilder: PromptBuilder;

  async getAdvice(request: AdvisorRequest): Promise<AdvisorResponse> {
    const prompt = this.promptBuilder.build(request);

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: this.getSystemPrompt(request.advisorType),
      messages: [{ role: 'user', content: prompt }],
    });

    return this.parseResponse(response);
  }

  private getSystemPrompt(advisorType: string): string {
    const prompts = {
      strategic: `You are a strategic advisor in a political simulation game
        about Iran. You analyze situations in terms of power, leverage,
        and strategic advantage. You are direct and analytical.
        Never break character. Never mention you are an AI.`,

      ethical: `You are an ethical advisor who considers the moral dimensions
        of political choices. You think about justice, human rights, and
        the wellbeing of ordinary people. You acknowledge hard tradeoffs.`,

      pragmatic: `You are a pragmatic advisor focused on what's achievable.
        You think about risks, unintended consequences, and the gap between
        intentions and outcomes. You're not cynical, but you're realistic.`,

      historical: `You are a historical advisor who sees patterns across
        time and place. You draw parallels to other transitions and
        movements. You help players learn from history.`,
    };

    return prompts[advisorType] || prompts.strategic;
  }
}
```

### Prompt Templates

```typescript
// engine/ai/PromptTemplates.ts

const DECISION_ADVICE_PROMPT = `
You are advising on a decision in the political simulation IRAN 14XX.

CURRENT SITUATION:
{eventDescription}

THE DECISION:
{decisionOptions}

RELEVANT CONTEXT:
- Player's current position: {playerPosition}
- Key faction relationships: {factionRelationships}
- Recent events: {recentEvents}

As a {advisorType} advisor, provide brief (2-3 paragraphs) analysis of
this decision. Consider:
- What does each option achieve?
- What are the risks?
- What would you recommend, and why?

Stay in character. Be direct. Don't hedge excessively.
`;

const HISTORICAL_PARALLEL_PROMPT = `
The player has encountered this situation in IRAN 14XX:

{eventDescription}

Briefly (2-3 paragraphs) explain a historical parallel that helps
illuminate this situation. Consider:
- What happened in the historical case?
- What can we learn from it?
- How is Iran's situation similar or different?

Focus on one clear parallel. Be specific, not generic.
`;
```

---

## Offline and PWA

### Service Worker Strategy

```typescript
// public/sw.js

const CACHE_NAME = 'iran-14xx-v1';
const STATIC_ASSETS = [
  '/',
  '/game',
  '/offline',
  '/assets/portraits/*',
  '/assets/maps/*',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Serve from cache, fall back to network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      });
    }).catch(() => {
      // Return offline page if available
      return caches.match('/offline');
    })
  );
});
```

### Save System (IndexedDB)

```typescript
// engine/save/SaveManager.ts

class SaveManager {
  private db: IDBDatabase;

  async saveGame(state: GameState): Promise<void> {
    const saveData: SaveFile = {
      version: SAVE_VERSION,
      timestamp: new Date().toISOString(),
      state: this.serializeState(state),
      checksum: this.calculateChecksum(state),
    };

    await this.db.put('saves', saveData, state.saveId);

    // Also save to localStorage as backup
    localStorage.setItem(
      `save_${state.saveId}`,
      JSON.stringify(saveData)
    );
  }

  async loadGame(saveId: string): Promise<GameState> {
    const saveData = await this.db.get('saves', saveId);

    if (!saveData) {
      // Try localStorage backup
      const backup = localStorage.getItem(`save_${saveId}`);
      if (backup) {
        return this.deserializeState(JSON.parse(backup).state);
      }
      throw new SaveNotFoundError(saveId);
    }

    // Verify checksum
    if (!this.verifyChecksum(saveData)) {
      throw new SaveCorruptedError(saveId);
    }

    // Migrate if needed
    if (saveData.version !== SAVE_VERSION) {
      return this.migrateState(saveData);
    }

    return this.deserializeState(saveData.state);
  }
}
```

---

## Performance Considerations

### Optimization Strategies

```yaml
PERFORMANCE:
  initial_load:
    - Static generation of game shell
    - Lazy load content per character/chapter
    - Progressive image loading (low-res → high-res)

  runtime:
    - Game state updates batched
    - React memo for expensive components
    - Web Workers for complex calculations (faction AI)

  content:
    - YAML compiled to JSON at build time
    - Content chunked by chapter/region
    - Unused content tree-shaken

  assets:
    - Images optimized (WebP with fallback)
    - Responsive images for different devices
    - Audio compressed and lazy-loaded
```

### Bundle Strategy

```yaml
BUNDLE_STRATEGY:
  core:
    # Always loaded
    - Game engine
    - Basic UI
    - First chapter content
    size_target: <500KB gzipped

  character_content:
    # Per-character bundles
    - Character-specific events
    - Character-specific NPCs
    size_per_character: <200KB gzipped

  chapter_content:
    # Progressive loading
    - Events for chapter N loaded when chapter N-1 completes
    size_per_chapter: <300KB gzipped

  ai:
    # Optional, loaded on demand
    - Advisor system
    - AI prompts
    size: <100KB gzipped
```

---

## Testing Strategy

### Test Layers

```yaml
TESTING:
  unit:
    - Game engine logic
    - State transitions
    - Condition evaluation
    - Effect application
    coverage_target: 80%

  integration:
    - Event chains work correctly
    - Saves load properly
    - AI integration functions
    coverage_target: 60%

  e2e:
    - Full game playthrough
    - Different character paths
    - Edge cases and endings
    scenarios: 20+

  content:
    - All events validate
    - All conditions are reachable
    - All decisions have effects
    - Localization complete
```

### Content Testing

```typescript
// tests/content/event-validation.test.ts

describe('Event Validation', () => {
  it('all events have valid schema', async () => {
    const events = await loadAllEvents();
    for (const event of events) {
      expect(validateEvent(event)).toHaveNoErrors();
    }
  });

  it('all event conditions are reachable', async () => {
    const events = await loadAllEvents();
    for (const event of events) {
      expect(conditionIsReachable(event.conditions)).toBe(true);
    }
  });

  it('all decisions have effects', async () => {
    const events = await loadAllEvents();
    for (const event of events) {
      for (const decision of event.decisions) {
        expect(decision.effects).not.toBeEmpty();
      }
    }
  });
});
```

---

## Deployment

### Infrastructure

```yaml
DEPLOYMENT:
  hosting: Vercel or Cloudflare Pages
  edge_locations: Automatic global distribution
  cdn: Built-in with hosting provider

  environment:
    production:
      domain: iran14xx.com
      ai: enabled
      analytics: enabled

    staging:
      domain: staging.iran14xx.com
      ai: enabled
      analytics: disabled

    development:
      domain: localhost:3000
      ai: mock mode available
      analytics: disabled
```

### CI/CD Pipeline

```yaml
PIPELINE:
  on_push:
    - Lint
    - Type check
    - Unit tests
    - Content validation
    - Build

  on_pr:
    - All above
    - Deploy preview
    - Integration tests

  on_merge_to_main:
    - All above
    - Deploy to staging
    - E2E tests

  on_release:
    - Deploy to production
    - Smoke tests
    - Notify team
```

---

## Conclusion

This architecture is designed for:

1. **Player Experience** - Fast, responsive, works offline
2. **Content Authoring** - YAML-based, human-readable, validated
3. **AI Integration** - Seamless advisor conversations
4. **Persian-First** - RTL native, Persian as default
5. **Maintainability** - Clear separation, strong typing, tested

The system is complex because the game is complex. But the complexity is managed through clear boundaries, strong types, and comprehensive testing.

---

*Last updated: February 2026*
