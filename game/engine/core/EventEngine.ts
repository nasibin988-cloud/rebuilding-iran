/**
 * IRAN 14XX - Event Engine
 *
 * Manages event generation, triggering, and evaluation:
 * - Loading events from YAML content
 * - Evaluating trigger conditions
 * - Managing event queues and priorities
 * - Processing event outcomes
 */

import type {
  GameState,
  GameEvent,
  Decision,
  Effect,
  Condition,
  EventCategory,
  EventRecord,
  CharacterId,
  FactionId,
  RegionId,
  LocalizedString,
} from './types';
import { GameStateManager } from './GameState';

// =============================================================================
// TYPES
// =============================================================================

export interface EventDefinition {
  id: string;
  category: EventCategory;
  title: LocalizedString;
  description: LocalizedString;
  image?: string;

  // Triggering
  triggers: EventTrigger[];
  priority: number;
  weight: number;

  // One-time vs repeatable
  once: boolean;
  cooldown?: number;

  // Requirements
  requirements: Condition[];

  // Content
  decisions: DecisionDefinition[];

  // Metadata
  tags: string[];
  relatedEvents?: string[];
}

export interface EventTrigger {
  type: 'turn' | 'date' | 'condition' | 'flag' | 'random';
  value: unknown;
}

export interface DecisionDefinition {
  id: string;
  label: LocalizedString;
  description: LocalizedString;

  // Requirements to see/choose this option
  requirements: Condition[];
  visible: Condition[];

  // Effects
  effects: {
    immediate: Effect[];
    delayed: DelayedEffectDefinition[];
  };

  // Narrative feedback
  outcome: LocalizedString;

  // Tags for AI and analytics
  tags: string[];
}

export interface DelayedEffectDefinition {
  delay: number;
  probability: number;
  condition?: Condition;
  effects: Effect[];
  narrative: LocalizedString;
}

export interface EvaluatedEvent {
  definition: EventDefinition;
  event: GameEvent;
  priority: number;
  relevanceScore: number;
}

// =============================================================================
// CONDITION EVALUATOR
// =============================================================================

export class ConditionEvaluator {
  constructor(private stateManager: GameStateManager) {}

  evaluate(condition: Condition, state: GameState): boolean {
    switch (condition.type) {
      case 'flag':
        return this.evaluateFlagCondition(condition, state);
      case 'stat':
        return this.evaluateStatCondition(condition, state);
      case 'relationship':
        return this.evaluateRelationshipCondition(condition, state);
      case 'event':
        return this.evaluateEventCondition(condition, state);
      case 'resource':
        return this.evaluateResourceCondition(condition, state);
      case 'and':
        return this.evaluateAndCondition(condition, state);
      case 'or':
        return this.evaluateOrCondition(condition, state);
      case 'not':
        return this.evaluateNotCondition(condition, state);
      default:
        // Unknown condition type - return true for forward compatibility
        return true;
    }
  }

  private evaluateFlagCondition(condition: Condition, state: GameState): boolean {
    const target = condition.target || condition.path || '';
    const flagValue = state.world.flags.get(target);

    switch (condition.operator) {
      case 'exists':
        return flagValue !== undefined;
      case 'not_exists':
        return flagValue === undefined;
      case 'equals':
        return flagValue === condition.value;
      case 'not_equals':
        return flagValue !== condition.value;
      default:
        return flagValue === condition.value;
    }
  }

  private evaluateStatCondition(condition: Condition, state: GameState): boolean {
    const statTarget = condition.target || condition.path || '';
    const value = this.getStatValue(statTarget, state);
    const targetValue = condition.value as number;

    switch (condition.operator) {
      case 'greater_than':
        return value > targetValue;
      case 'less_than':
        return value < targetValue;
      case 'greater_equal':
        return value >= targetValue;
      case 'less_equal':
        return value <= targetValue;
      case 'equals':
        return value === targetValue;
      case 'not_equals':
        return value !== targetValue;
      case 'between':
        const [min, max] = condition.value as [number, number];
        return value >= min && value <= max;
      default:
        return false;
    }
  }

  private getStatValue(path: string, state: GameState): number {
    const parts = path.split('.');
    let obj: unknown = state;

    for (const part of parts) {
      if (obj === null || obj === undefined) return 0;
      obj = (obj as Record<string, unknown>)[part];
    }

    return typeof obj === 'number' ? obj : 0;
  }

  private evaluateRelationshipCondition(condition: Condition, state: GameState): boolean {
    const target = condition.target || condition.path || '';
    const [entityType, entityId] = target.split(':');
    const targetValue = condition.value as number;

    if (entityType === 'faction') {
      const relationship = state.player.relationships.get(entityId as FactionId);
      if (!relationship) return false;

      const value = relationship.trust;
      return this.compareValues(value, targetValue, condition.operator);
    }

    // Add character relationships if needed
    return false;
  }

  private evaluateEventCondition(condition: Condition, state: GameState): boolean {
    const eventId = condition.target || condition.path || '';
    const hasOccurred = state.history.events.some(e => e.eventId === eventId);

    if (condition.operator === 'occurred') {
      return hasOccurred;
    } else if (condition.operator === 'not_occurred') {
      return !hasOccurred;
    } else if (condition.operator === 'outcome_was') {
      const record = state.history.events.find(e => e.eventId === eventId);
      return record?.outcome === condition.value;
    }

    return hasOccurred;
  }

  private evaluateResourceCondition(condition: Condition, state: GameState): boolean {
    const resourcePath = condition.target || condition.path || '';
    const resource = resourcePath as keyof typeof state.player.resources;
    const value = state.player.resources[resource] as number;
    const targetNum = condition.value as number;

    return this.compareValues(value, targetNum, condition.operator);
  }

  private evaluateAndCondition(condition: Condition, state: GameState): boolean {
    const subConditions = condition.value as Condition[];
    return subConditions.every(c => this.evaluate(c, state));
  }

  private evaluateOrCondition(condition: Condition, state: GameState): boolean {
    const subConditions = condition.value as Condition[];
    return subConditions.some(c => this.evaluate(c, state));
  }

  private evaluateNotCondition(condition: Condition, state: GameState): boolean {
    const subCondition = condition.value as Condition;
    return !this.evaluate(subCondition, state);
  }

  private compareValues(
    value: number,
    target: number,
    operator: string | undefined
  ): boolean {
    switch (operator) {
      case 'greater_than':
        return value > target;
      case 'less_than':
        return value < target;
      case 'greater_equal':
        return value >= target;
      case 'less_equal':
        return value <= target;
      case 'equals':
        return value === target;
      case 'not_equals':
        return value !== target;
      default:
        return value >= target;
    }
  }
}

// =============================================================================
// EVENT ENGINE CLASS
// =============================================================================

export class EventEngine {
  private stateManager: GameStateManager;
  private conditionEvaluator: ConditionEvaluator;
  private eventDefinitions: Map<string, EventDefinition> = new Map();
  private eventCooldowns: Map<string, number> = new Map();

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager;
    this.conditionEvaluator = new ConditionEvaluator(stateManager);
  }

  // ---------------------------------------------------------------------------
  // EVENT REGISTRATION
  // ---------------------------------------------------------------------------

  registerEvent(definition: EventDefinition): void {
    this.eventDefinitions.set(definition.id, definition);
  }

  registerEvents(definitions: EventDefinition[]): void {
    for (const def of definitions) {
      this.registerEvent(def);
    }
  }

  // ---------------------------------------------------------------------------
  // EVENT GENERATION
  // ---------------------------------------------------------------------------

  generateEventsForTurn(): GameEvent[] {
    const state = this.stateManager.getState();
    const currentTurn = state.time.turn;
    const candidates: EvaluatedEvent[] = [];

    for (const [id, definition] of this.eventDefinitions) {
      // Check if event is on cooldown
      const cooldownUntil = this.eventCooldowns.get(id);
      if (cooldownUntil && currentTurn < cooldownUntil) {
        continue;
      }

      // Check if one-time event already occurred
      if (definition.once) {
        const hasOccurred = state.history.events.some(e => e.eventId === id);
        if (hasOccurred) continue;
      }

      // Check requirements
      const meetsRequirements = definition.requirements.every(req =>
        this.conditionEvaluator.evaluate(req, state)
      );
      if (!meetsRequirements) continue;

      // Check triggers
      const triggered = this.checkTriggers(definition, state);
      if (!triggered) continue;

      // Calculate relevance score
      const relevanceScore = this.calculateRelevance(definition, state);

      // Convert to GameEvent
      const event = this.createGameEvent(definition, state);

      candidates.push({
        definition,
        event,
        priority: definition.priority,
        relevanceScore,
      });
    }

    // Sort by priority and relevance
    candidates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.relevanceScore - a.relevanceScore;
    });

    // Select events (limit per turn)
    const maxEventsPerTurn = 3;
    const selectedEvents = candidates.slice(0, maxEventsPerTurn);

    // Update cooldowns
    for (const selected of selectedEvents) {
      if (selected.definition.cooldown) {
        this.eventCooldowns.set(
          selected.definition.id,
          currentTurn + selected.definition.cooldown
        );
      }
    }

    return selectedEvents.map(e => e.event);
  }

  private checkTriggers(definition: EventDefinition, state: GameState): boolean {
    for (const trigger of definition.triggers) {
      if (this.evaluateTrigger(trigger, state)) {
        return true;
      }
    }
    return false;
  }

  private evaluateTrigger(trigger: EventTrigger, state: GameState): boolean {
    switch (trigger.type) {
      case 'turn':
        const targetTurn = trigger.value as number;
        return state.time.turn === targetTurn;

      case 'date':
        const targetDate = trigger.value as { year?: number; month?: number };
        const currentDate = state.time.date;
        if (targetDate.year && currentDate.year !== targetDate.year) return false;
        if (targetDate.month && currentDate.month !== targetDate.month) return false;
        return true;

      case 'condition':
        const condition = trigger.value as Condition;
        return this.conditionEvaluator.evaluate(condition, state);

      case 'flag':
        const flagName = trigger.value as string;
        return state.world.flags.has(flagName);

      case 'random':
        const probability = trigger.value as number;
        return Math.random() < probability;

      default:
        return false;
    }
  }

  private calculateRelevance(definition: EventDefinition, state: GameState): number {
    let score = definition.weight;

    // Boost for events related to player's current situation
    if (definition.tags.includes('player_location:' + state.player.position.location)) {
      score *= 1.5;
    }

    // Boost for events related to player's factions
    for (const factionId of state.player.position.factionMemberships) {
      if (definition.tags.includes('faction:' + factionId)) {
        score *= 1.3;
      }
    }

    // Boost for urgent situations
    const regime = state.regime || state.world?.regime;
    if (regime && regime.stability < 30 && definition.tags.includes('crisis')) {
      score *= 2.0;
    }

    // Add some randomness
    score *= 0.8 + Math.random() * 0.4;

    return score;
  }

  private createGameEvent(definition: EventDefinition, state: GameState): GameEvent {
    const decisions = definition.decisions
      .filter(d => {
        // Filter by visibility conditions
        return d.visible.every(cond =>
          this.conditionEvaluator.evaluate(cond, state)
        );
      })
      .map(d => this.createDecision(d, state));

    return {
      id: definition.id,
      type: definition.category,
      category: definition.category,
      title: definition.title,
      description: definition.description,
      image: definition.image,
      decisions,
      metadata: {
        priority: definition.priority,
        tags: definition.tags,
        relatedEvents: definition.relatedEvents,
      },
    };
  }

  private createDecision(definition: DecisionDefinition, state: GameState): Decision {
    const available = definition.requirements.every(req =>
      this.conditionEvaluator.evaluate(req, state)
    );

    return {
      id: definition.id,
      label: definition.label,
      description: definition.description,
      available,
      requirements: definition.requirements,
      effects: {
        immediate: definition.effects.immediate,
        delayed: definition.effects.delayed.map(d => ({
          delay: d.delay,
          probability: d.probability,
          condition: d.condition || undefined,
          effects: d.effects,
          narrative: d.narrative,
        })),
      },
      tags: definition.tags,
    };
  }

  // ---------------------------------------------------------------------------
  // STORY EVENTS
  // ---------------------------------------------------------------------------

  getStoryEvent(eventId: string): GameEvent | null {
    const definition = this.eventDefinitions.get(eventId);
    if (!definition) return null;

    const state = this.stateManager.getState();
    return this.createGameEvent(definition, state);
  }

  // ---------------------------------------------------------------------------
  // RANDOM EVENTS
  // ---------------------------------------------------------------------------

  generateRandomEvent(category?: EventCategory): GameEvent | null {
    const state = this.stateManager.getState();

    const candidates = Array.from(this.eventDefinitions.values())
      .filter(def => {
        if (category && def.category !== category) return false;

        // Must have random trigger
        if (!def.triggers.some(t => t.type === 'random')) return false;

        // Must meet requirements
        return def.requirements.every(req =>
          this.conditionEvaluator.evaluate(req, state)
        );
      });

    if (candidates.length === 0) return null;

    // Weighted random selection
    const totalWeight = candidates.reduce((sum, def) => sum + def.weight, 0);
    let random = Math.random() * totalWeight;

    for (const def of candidates) {
      random -= def.weight;
      if (random <= 0) {
        return this.createGameEvent(def, state);
      }
    }

    return this.createGameEvent(candidates[0], state);
  }

  // ---------------------------------------------------------------------------
  // FACTION EVENTS
  // ---------------------------------------------------------------------------

  generateFactionEvents(factionId: FactionId): GameEvent[] {
    const state = this.stateManager.getState();
    const faction = state.world.factions.get(factionId);
    if (!faction) return [];

    const events: GameEvent[] = [];

    // Look for faction-specific events
    for (const [id, definition] of this.eventDefinitions) {
      if (!definition.tags.includes(`faction:${factionId}`)) continue;

      const meetsRequirements = definition.requirements.every(req =>
        this.conditionEvaluator.evaluate(req, state)
      );
      if (!meetsRequirements) continue;

      const triggered = this.checkTriggers(definition, state);
      if (!triggered) continue;

      events.push(this.createGameEvent(definition, state));
    }

    return events;
  }

  // ---------------------------------------------------------------------------
  // EVENT ANALYSIS (for AI advisor)
  // ---------------------------------------------------------------------------

  analyzeDecisionConsequences(eventId: string, decisionId: string): string {
    const definition = this.eventDefinitions.get(eventId);
    if (!definition) return 'Event not found';

    const decision = definition.decisions.find(d => d.id === decisionId);
    if (!decision) return 'Decision not found';

    const consequences: string[] = [];

    // Analyze immediate effects
    for (const effect of decision.effects.immediate) {
      consequences.push(this.describeEffect(effect));
    }

    // Analyze delayed effects
    for (const delayed of decision.effects.delayed) {
      const prob = Math.round(delayed.probability * 100);
      consequences.push(
        `${prob}% chance in ${delayed.delay} turns: ${delayed.narrative.en}`
      );
    }

    return consequences.join('\n');
  }

  private describeEffect(effect: Effect): string {
    switch (effect.type) {
      case 'state_change':
        return `Changes ${effect.target} to ${effect.value}`;
      case 'faction_trust':
        const sign = (effect.value as number) > 0 ? '+' : '';
        return `${sign}${effect.value} trust with ${effect.target}`;
      case 'resource_change':
        const rsign = (effect.value as number) > 0 ? '+' : '';
        return `${rsign}${effect.value} ${effect.target}`;
      case 'flag_set':
        return `Sets flag: ${effect.target}`;
      default:
        return `${effect.type}: ${effect.target}`;
    }
  }

  // ---------------------------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------------------------

  getEventDefinition(eventId: string): EventDefinition | undefined {
    return this.eventDefinitions.get(eventId);
  }

  getEventsByCategory(category: EventCategory): EventDefinition[] {
    return Array.from(this.eventDefinitions.values())
      .filter(def => def.category === category);
  }

  getEventsByTag(tag: string): EventDefinition[] {
    return Array.from(this.eventDefinitions.values())
      .filter(def => def.tags.includes(tag));
  }

  clearCooldowns(): void {
    this.eventCooldowns.clear();
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let eventEngineInstance: EventEngine | null = null;

export function getEventEngine(): EventEngine {
  if (!eventEngineInstance) {
    throw new Error('EventEngine not initialized. Call initializeEventEngine first.');
  }
  return eventEngineInstance;
}

export function initializeEventEngine(stateManager: GameStateManager): EventEngine {
  eventEngineInstance = new EventEngine(stateManager);
  return eventEngineInstance;
}
