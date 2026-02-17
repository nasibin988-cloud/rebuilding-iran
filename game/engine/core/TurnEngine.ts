/**
 * IRAN 14XX - Turn Engine
 *
 * Manages the turn-by-turn gameplay loop, processing:
 * - Turn phases
 * - Events
 * - Decisions
 * - Faction actions
 * - Score updates
 */

import type {
  GameState,
  GameEvent,
  Decision,
  TurnPhase,
  EventRecord,
  Effect,
  ScheduledConsequence,
  PersianDate,
  LocalizedString,
  FactionState,
  EudaimoniaState,
} from './types';
import { GameStateManager, getGameState } from './GameState';
import { EventEngine, EventDefinition } from './EventEngine';
import { FactionEngine } from './FactionEngine';
import { getContentLoader } from '../content/ContentLoader';

// =============================================================================
// TYPES
// =============================================================================

export interface TurnPhaseResult {
  phase: TurnPhase;
  data: unknown;
  success: boolean;
  message?: string;
}

export interface EventPhaseResult {
  event: GameEvent;
  decision: Decision | null;
  effects: Effect[];
}

export interface TurnResult {
  turn: number;
  phases: TurnPhaseResult[];
  ending: unknown | null;
  continueGame: boolean;
}

export interface BriefingData {
  summary: LocalizedString;
  alerts: Array<{
    type: 'urgent' | 'warning' | 'info';
    message: LocalizedString;
  }>;
  changes: Array<{
    category: string;
    description: LocalizedString;
    trend: 'positive' | 'negative' | 'neutral';
  }>;
  dateDisplay: string;
}

// =============================================================================
// TURN ENGINE CLASS
// =============================================================================

export class TurnEngine {
  private stateManager: GameStateManager;
  private eventEngine: EventEngine;
  private factionEngine: FactionEngine;
  private eventQueue: GameEvent[] = [];
  private processedEvents: EventRecord[] = [];
  private awaitingDecision: boolean = false;
  private currentEvent: GameEvent | null = null;
  private initialized: boolean = false;

  constructor(stateManager?: GameStateManager) {
    this.stateManager = stateManager || getGameState();
    this.eventEngine = new EventEngine(this.stateManager);
    this.factionEngine = new FactionEngine(this.stateManager);
  }

  /**
   * Initialize the turn engine with content from ContentLoader.
   * Must be called after ContentLoader has loaded content.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const contentLoader = getContentLoader();
      const content = contentLoader.getContent();

      // Register all events from content
      for (const [, eventDef] of content.events) {
        this.eventEngine.registerEvent(eventDef);
      }

      this.initialized = true;
    } catch (error) {
      // Content loader may not be initialized yet - that's OK
      // Events will be registered when content becomes available
    }
  }

  // ---------------------------------------------------------------------------
  // MAIN TURN PROCESSING
  // ---------------------------------------------------------------------------

  async processTurn(): Promise<TurnResult> {
    const turn = this.stateManager.getCurrentTurn();
    const phases: TurnPhaseResult[] = [];

    // Phase 1: Briefing
    this.stateManager.setPhase('briefing');
    phases.push(await this.executeBriefingPhase());

    // Phase 2: Process pending consequences
    phases.push(await this.processConsequences());

    // Phase 3: Generate and queue events
    const events = await this.generateEvents();
    this.eventQueue = events;

    // Phase 4: Process events (yields for player decisions)
    this.stateManager.setPhase('events');
    for (const event of this.eventQueue) {
      phases.push(await this.processEvent(event));
    }

    // Phase 5: Faction turns
    this.stateManager.setPhase('factions');
    phases.push(await this.processFactionTurns());

    // Phase 6: Update scores
    this.stateManager.setPhase('scores');
    phases.push(await this.updateScores());

    // Check for endings
    const ending = this.checkForEnding();
    if (ending) {
      return { turn, phases, ending, continueGame: false };
    }

    // Advance to next turn
    this.stateManager.advanceTurn();

    return { turn, phases, ending: null, continueGame: true };
  }

  // ---------------------------------------------------------------------------
  // PHASE IMPLEMENTATIONS
  // ---------------------------------------------------------------------------

  private async executeBriefingPhase(): Promise<TurnPhaseResult> {
    const state = this.stateManager.getState();
    const briefing = this.generateBriefing(state);

    return {
      phase: 'briefing',
      data: briefing,
      success: true,
    };
  }

  private generateBriefing(state: GameState): BriefingData {
    const { turn, date } = state.time;

    // Generate summary based on recent events and changes
    const alerts: BriefingData['alerts'] = [];
    const changes: BriefingData['changes'] = [];

    // Check for urgent conditions
    const regime = state.regime || state.world?.regime;
    if (regime && regime.stability < 30) {
      alerts.push({
        type: 'warning',
        message: {
          fa: 'ثبات رژیم در حال کاهش است',
          en: 'Regime stability is declining',
        },
      });
    }

    const eudaimoniaComposite = 'composite' in state.eudaimonia ? state.eudaimonia.composite : 50;
    if (eudaimoniaComposite < 30) {
      alerts.push({
        type: 'urgent',
        message: {
          fa: 'شاخص رفاه در سطح بحرانی است',
          en: 'Flourishing index at critical level',
        },
      });
    }

    // Track changes from previous turn
    const eudaimoniaTrend = 'trend' in state.eudaimonia ? state.eudaimonia.trend : undefined;
    if (eudaimoniaTrend === 'improving') {
      changes.push({
        category: 'eudaimonia',
        description: {
          fa: 'شاخص‌های رفاه در حال بهبود',
          en: 'Flourishing indicators improving',
        },
        trend: 'positive',
      });
    } else if (eudaimoniaTrend === 'declining') {
      changes.push({
        category: 'eudaimonia',
        description: {
          fa: 'شاخص‌های رفاه در حال کاهش',
          en: 'Flourishing indicators declining',
        },
        trend: 'negative',
      });
    }

    return {
      summary: {
        fa: `نوبت ${turn} - ${this.formatPersianDate(date)}`,
        en: `Turn ${turn} - ${this.formatDate(date)}`,
      },
      alerts,
      changes,
      dateDisplay: this.formatPersianDate(date),
    };
  }

  private formatPersianDate(date: PersianDate): string {
    const months = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
    ];
    return `${months[date.month - 1]} ${date.year}`;
  }

  private formatDate(date: PersianDate): string {
    const months = [
      'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
      'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand',
    ];
    return `${months[date.month - 1]} ${date.year}`;
  }

  private async processConsequences(): Promise<TurnPhaseResult> {
    const state = this.stateManager.getState();
    const currentTurn = state.time.turn;
    const triggered: ScheduledConsequence[] = [];
    const remaining: ScheduledConsequence[] = [];

    for (const consequence of state.history.pendingConsequences) {
      if (consequence.triggered) continue;

      // Check if should trigger
      const shouldTrigger =
        consequence.triggerTurn <= currentTurn &&
        this.evaluateCondition(consequence.triggerCondition, state);

      if (shouldTrigger) {
        // Roll for probability
        if (Math.random() < consequence.probability) {
          // Apply effects
          for (const effect of consequence.effects) {
            this.stateManager.applyEffect(effect);
          }
          consequence.triggered = true;
          triggered.push(consequence);
        }
      } else if (consequence.triggerTurn > currentTurn) {
        remaining.push(consequence);
      }
    }

    // Update pending consequences
    state.history.pendingConsequences = remaining;

    return {
      phase: 'resolution',
      data: { triggered, remaining: remaining.length },
      success: true,
    };
  }

  private async generateEvents(): Promise<GameEvent[]> {
    // Ensure we're initialized with content
    await this.initialize();

    // Use EventEngine to generate events based on current state
    // This checks triggered events, scheduled events, and random events
    const events = this.eventEngine.generateEventsForTurn();

    return events;
  }

  private async processEvent(event: GameEvent): Promise<TurnPhaseResult> {
    this.currentEvent = event;
    this.awaitingDecision = true;

    // In a real implementation, this would:
    // 1. Present the event to the player
    // 2. Wait for player decision (async)
    // 3. Apply effects
    // 4. Record in history

    // Placeholder
    return {
      phase: 'events',
      data: { event },
      success: true,
    };
  }

  public async submitDecision(decisionId: string): Promise<EventPhaseResult> {
    if (!this.currentEvent) {
      throw new Error('No current event');
    }

    const decision = this.currentEvent.decisions.find((d) => d.id === decisionId);
    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }

    const effects: Effect[] = [];

    // Apply immediate effects
    for (const effect of decision.effects.immediate) {
      this.stateManager.applyEffect(effect);
      effects.push(effect);
    }

    // Schedule delayed effects
    for (const delayed of decision.effects.delayed) {
      const consequence: ScheduledConsequence = {
        id: `${this.currentEvent.id}-${decisionId}-${Date.now()}`,
        sourceDecisionId: decisionId,
        triggerTurn: this.stateManager.getCurrentTurn() + delayed.delay,
        triggerCondition: delayed.condition || null,
        probability: delayed.probability,
        effects: delayed.effects,
        narrative: delayed.narrative,
        triggered: false,
      };

      this.stateManager.getState().history.pendingConsequences.push(consequence);
    }

    // Record decision in history
    const record: EventRecord = {
      id: `event-${Date.now()}`,
      eventId: this.currentEvent.id,
      turn: this.stateManager.getCurrentTurn(),
      date: this.stateManager.getCurrentDate(),
      involvedEntities: [],
      outcome: decisionId,
    };
    this.stateManager.getState().history.events.push(record);

    this.awaitingDecision = false;
    const result = {
      event: this.currentEvent,
      decision,
      effects,
    };
    this.currentEvent = null;

    return result;
  }

  private async processFactionTurns(): Promise<TurnPhaseResult> {
    // Use FactionEngine to process all faction turns
    // This handles faction AI, action selection, and execution
    const results = await this.factionEngine.processFactionTurns();

    // Convert results to the format expected by TurnPhaseResult
    const factionActions = results.map(result => ({
      factionId: result.factionId,
      actions: result.actions.map(a => ({
        action: a.action.id,
        success: a.success,
        narrative: a.narrative,
      })),
      powerChange: result.powerChange,
    }));

    return {
      phase: 'factions',
      data: { actions: factionActions, results },
      success: true,
    };
  }

  private determineFactionAction(faction: FactionState, state: GameState): string | null {
    // This method is now deprecated in favor of FactionEngine.processFactionTurns()
    // Keeping for backwards compatibility
    const availableActions = this.factionEngine.getAvailableActionsForFaction(faction.id);
    if (availableActions.length === 0) return null;

    // Return the highest priority action
    const sorted = [...availableActions].sort((a, b) => b.aiPriority - a.aiPriority);
    return sorted[0]?.id || null;
  }

  private async updateScores(): Promise<TurnPhaseResult> {
    const state = this.stateManager.getState();

    // Calculate new eudaimonia scores
    const newScores = this.calculateEudaimonia(state);

    // Update state - only spread properties that exist
    if ('dimensions' in state.eudaimonia && newScores.dimensions) {
      // EudaimoniaState - full update with proper type narrowing
      const eudaimoniaState = state.eudaimonia as EudaimoniaState;
      eudaimoniaState.composite = newScores.composite;
      eudaimoniaState.trend = newScores.trend;
      eudaimoniaState.dimensions = newScores.dimensions;

      // Record in history
      if (eudaimoniaState.history) {
        eudaimoniaState.history.push({
          turn: state.time.turn,
          date: state.time.date,
          composite: newScores.composite,
          dimensions: newScores.dimensions,
        });
      }
    }
    // For EudaimoniaSimple, the values are direct properties - no update needed here

    return {
      phase: 'scores',
      data: { eudaimonia: newScores },
      success: true,
    };
  }

  private calculateEudaimonia(state: GameState) {
    // Calculate each dimension based on current state
    // This is simplified - full implementation would have complex calculations

    // Check if we're using EudaimoniaState (with dimensions) or EudaimoniaSimple
    if (!('dimensions' in state.eudaimonia)) {
      // EudaimoniaSimple - calculate composite from direct values
      const e = state.eudaimonia;
      const composite = (
        e.materialWellbeing +
        e.healthLongevity +
        e.freedomAgency +
        e.securityOrder +
        e.socialCohesion +
        e.culturalFlourishing +
        e.sustainability
      ) / 7;
      return {
        composite,
        trend: 'stable' as const,
        dimensions: undefined,
      };
    }

    const dimensions = state.eudaimonia.dimensions;
    const weights = state.eudaimonia.playerWeights;

    // Determine trends
    const previousComposite =
      state.eudaimonia.history.length > 0
        ? state.eudaimonia.history[state.eudaimonia.history.length - 1].composite
        : state.eudaimonia.composite;

    const composite =
      dimensions.materialWellbeing.value * weights.materialWellbeing +
      dimensions.healthLongevity.value * weights.healthLongevity +
      dimensions.freedomAgency.value * weights.freedomAgency +
      dimensions.securityOrder.value * weights.securityOrder +
      dimensions.socialCohesion.value * weights.socialCohesion +
      dimensions.culturalFlourishing.value * weights.culturalFlourishing +
      dimensions.sustainability.value * weights.sustainability;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (composite > previousComposite + 2) {
      trend = 'improving';
    } else if (composite < previousComposite - 2) {
      trend = 'declining';
    }

    return {
      composite,
      trend,
      dimensions,
    };
  }

  // ---------------------------------------------------------------------------
  // ENDING CHECKS
  // ---------------------------------------------------------------------------

  private checkForEnding(): unknown | null {
    const state = this.stateManager.getState();

    // Check for game-ending conditions
    // Returns ending object if game should end, null otherwise

    // Player death
    if (state.player.personal.health <= 0) {
      return { type: 'player_death' };
    }

    // Regime collapse
    const regime = state.regime || state.world?.regime;
    if (regime && regime.stability <= 0) {
      return { type: 'regime_collapse' };
    }

    // Civil war
    // Check for conditions that trigger civil war ending

    // Time limit (30 years from start)
    if (state.time.date.year >= 1434) {
      return { type: 'time_limit' };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // CONDITION EVALUATION
  // ---------------------------------------------------------------------------

  private evaluateCondition(
    condition: unknown | null,
    state: GameState
  ): boolean {
    if (!condition) return true;

    // Full condition evaluation would go here
    return true;
  }

  // ---------------------------------------------------------------------------
  // ACCESSORS
  // ---------------------------------------------------------------------------

  isAwaitingDecision(): boolean {
    return this.awaitingDecision;
  }

  getCurrentEvent(): GameEvent | null {
    return this.currentEvent;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let turnEngineInstance: TurnEngine | null = null;

export function getTurnEngine(): TurnEngine {
  if (!turnEngineInstance) {
    turnEngineInstance = new TurnEngine();
  }
  return turnEngineInstance;
}

export function initializeTurnEngine(stateManager: GameStateManager): TurnEngine {
  turnEngineInstance = new TurnEngine(stateManager);
  return turnEngineInstance;
}
