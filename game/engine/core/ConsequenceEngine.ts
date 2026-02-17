/**
 * IRAN 14XX - Consequence Engine
 *
 * Manages delayed effects, unintended consequences, and the memory system:
 * - Scheduling consequences from decisions
 * - Evaluating trigger conditions
 * - Processing consequences when they come due
 * - Tracking cascading effects
 * - Managing the "memory" of past actions
 */

import type {
  GameState,
  Effect,
  Condition,
  ScheduledConsequence,
  LocalizedString,
  PersianDate,
  ConsequenceNarrative,
} from './types';
import { GameStateManager } from './GameState';
import { ConditionEvaluator } from './EventEngine';

// =============================================================================
// TYPES
// =============================================================================

export interface ConsequenceDefinition {
  id: string;
  sourceType: 'decision' | 'event' | 'faction' | 'system';
  sourceId: string;

  // Timing
  minDelay: number;
  maxDelay: number;
  triggerCondition: Condition | null;

  // Probability
  baseProbability: number;
  probabilityModifiers: ProbabilityModifier[];

  // Effects
  effects: Effect[];
  cascadeEffects?: CascadeEffect[];

  // Narrative
  narrative: LocalizedString;
  discoveryNarrative?: LocalizedString;

  // Visibility
  visible: boolean;
  foreshadowed: boolean;
  foreshadowingText?: LocalizedString;

  // Metadata
  tags: string[];
  severity: 'minor' | 'moderate' | 'major' | 'critical';
}

export interface ProbabilityModifier {
  condition: Condition;
  modifier: number;
}

export interface CascadeEffect {
  condition: Condition;
  consequences: string[];
  probability: number;
}

export interface ScheduledItem {
  consequence: ScheduledConsequence;
  definition: ConsequenceDefinition;
  scheduledTurn: number;
  actualProbability: number;
}

export interface ConsequenceResult {
  consequenceId: string;
  triggered: boolean;
  effects: Effect[];
  narrative: LocalizedString | ConsequenceNarrative;  // Accept both formats
  cascades: string[];
}

export interface MemoryEntry {
  id: string;
  turn: number;
  date?: PersianDate;
  type: 'decision' | 'event' | 'consequence' | MemoryType;
  sourceId?: string;
  description?: LocalizedString | ConsequenceNarrative;  // Accept both formats
  significance: number;
  tags?: string[];
  relatedEntities?: string[];
  // Additional properties for MemoryRecord compatibility
  content?: unknown;
  involvedEntities?: string[];
  importance?: number;
  lastSurfaced?: number | null;
}

// Re-export memory type for use
type MemoryType = 'promise_made' | 'promise_kept' | 'promise_broken' | 'betrayal' | 'help_given' | 'sacrifice' | 'milestone';

// =============================================================================
// CONSEQUENCE ENGINE CLASS
// =============================================================================

export class ConsequenceEngine {
  private stateManager: GameStateManager;
  private conditionEvaluator: ConditionEvaluator;
  private definitions: Map<string, ConsequenceDefinition> = new Map();
  private scheduledItems: ScheduledItem[] = [];
  private memory: MemoryEntry[] = [];

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager;
    this.conditionEvaluator = new ConditionEvaluator(stateManager);
  }

  // ---------------------------------------------------------------------------
  // DEFINITION REGISTRATION
  // ---------------------------------------------------------------------------

  registerDefinition(definition: ConsequenceDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  registerDefinitions(definitions: ConsequenceDefinition[]): void {
    for (const def of definitions) {
      this.registerDefinition(def);
    }
  }

  // ---------------------------------------------------------------------------
  // SCHEDULING CONSEQUENCES
  // ---------------------------------------------------------------------------

  scheduleConsequence(
    definitionId: string,
    sourceType: 'decision' | 'event' | 'faction' | 'system',
    sourceId: string,
    overrides?: Partial<ConsequenceDefinition>
  ): string | null {
    const baseDef = this.definitions.get(definitionId);
    if (!baseDef) {
      // Definition not found - return null to indicate scheduling failed
      return null;
    }

    const definition: ConsequenceDefinition = {
      ...baseDef,
      ...overrides,
      sourceType,
      sourceId,
    };

    const currentTurn = this.stateManager.getCurrentTurn();

    // Calculate delay
    const delay = definition.minDelay +
      Math.floor(Math.random() * (definition.maxDelay - definition.minDelay + 1));
    const scheduledTurn = currentTurn + delay;

    // Calculate probability with modifiers
    const actualProbability = this.calculateProbability(definition);

    // Create scheduled consequence
    const consequence: ScheduledConsequence = {
      id: `${definitionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceDecisionId: sourceId,
      triggerTurn: scheduledTurn,
      triggerCondition: definition.triggerCondition,
      probability: actualProbability,
      effects: definition.effects,
      narrative: definition.narrative,
      triggered: false,
    };

    // Add to state
    const state = this.stateManager.getState();
    state.history.pendingConsequences.push(consequence);

    // Track in engine
    this.scheduledItems.push({
      consequence,
      definition,
      scheduledTurn,
      actualProbability,
    });

    // Add foreshadowing if applicable
    if (definition.foreshadowed && definition.foreshadowingText) {
      this.addForeshadowing(definition);
    }

    return consequence.id;
  }

  scheduleFromDecision(
    decisionId: string,
    delayedEffects: Array<{
      delay: number;
      probability: number;
      condition?: Condition | null;
      effects: Effect[];
      narrative: LocalizedString;
    }>
  ): string[] {
    const ids: string[] = [];
    const currentTurn = this.stateManager.getCurrentTurn();

    for (const delayed of delayedEffects) {
      const consequence: ScheduledConsequence = {
        id: `decision-${decisionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourceDecisionId: decisionId,
        triggerTurn: currentTurn + delayed.delay,
        triggerCondition: delayed.condition || null,
        probability: delayed.probability,
        effects: delayed.effects,
        narrative: delayed.narrative,
        triggered: false,
      };

      const state = this.stateManager.getState();
      state.history.pendingConsequences.push(consequence);
      ids.push(consequence.id);
    }

    return ids;
  }

  private calculateProbability(definition: ConsequenceDefinition): number {
    const state = this.stateManager.getState();
    let probability = definition.baseProbability;

    for (const modifier of definition.probabilityModifiers) {
      if (this.conditionEvaluator.evaluate(modifier.condition, state)) {
        probability *= modifier.modifier;
      }
    }

    return Math.max(0, Math.min(1, probability));
  }

  private addForeshadowing(definition: ConsequenceDefinition): void {
    // Add a subtle notification or hint about the coming consequence
    const state = this.stateManager.getState();
    state.active.notifications.push({
      id: `foreshadow-${definition.id}`,
      type: 'info',
      message: definition.foreshadowingText!,
      turn: state.time.turn,
      read: false,
    });
  }

  // ---------------------------------------------------------------------------
  // PROCESSING CONSEQUENCES
  // ---------------------------------------------------------------------------

  processConsequences(): ConsequenceResult[] {
    const state = this.stateManager.getState();
    const currentTurn = state.time.turn;
    const results: ConsequenceResult[] = [];
    const toRemove: string[] = [];

    for (const consequence of state.history.pendingConsequences) {
      if (consequence.triggered) continue;
      if (consequence.triggerTurn > currentTurn) continue;

      // Check trigger condition
      if (consequence.triggerCondition) {
        const conditionMet = this.conditionEvaluator.evaluate(
          consequence.triggerCondition,
          state
        );
        if (!conditionMet) {
          // Check if we should remove or keep waiting
          if (consequence.triggerTurn + 5 < currentTurn) {
            // Expired - remove
            toRemove.push(consequence.id);
          }
          continue;
        }
      }

      // Roll for probability
      if (Math.random() > consequence.probability) {
        consequence.triggered = true;
        toRemove.push(consequence.id);
        continue;
      }

      // Execute consequence
      const result = this.executeConsequence(consequence);
      results.push(result);

      // Mark as triggered
      consequence.triggered = true;
      toRemove.push(consequence.id);
    }

    // Clean up triggered consequences
    state.history.pendingConsequences = state.history.pendingConsequences
      .filter(c => !toRemove.includes(c.id));

    // Update internal tracking
    this.scheduledItems = this.scheduledItems
      .filter(item => !toRemove.includes(item.consequence.id));

    return results;
  }

  private executeConsequence(consequence: ScheduledConsequence): ConsequenceResult {
    const effects: Effect[] = [];
    const cascades: string[] = [];

    // Apply effects
    for (const effect of consequence.effects) {
      this.stateManager.applyEffect(effect);
      effects.push(effect);
    }

    // Check for cascade effects
    const definition = this.findDefinition(consequence);
    if (definition?.cascadeEffects) {
      const state = this.stateManager.getState();

      for (const cascade of definition.cascadeEffects) {
        if (this.conditionEvaluator.evaluate(cascade.condition, state)) {
          if (Math.random() < cascade.probability) {
            for (const consequenceId of cascade.consequences) {
              const scheduled = this.scheduleConsequence(
                consequenceId,
                'system',
                consequence.id
              );
              if (scheduled) {
                cascades.push(scheduled);
              }
            }
          }
        }
      }
    }

    // Record in memory
    this.addMemory({
      id: `memory-${consequence.id}`,
      turn: this.stateManager.getCurrentTurn(),
      date: this.stateManager.getCurrentDate(),
      type: 'consequence',
      sourceId: consequence.sourceDecisionId,
      description: consequence.narrative,
      significance: this.calculateSignificance(effects),
      tags: definition?.tags || [],
      relatedEntities: this.extractRelatedEntities(effects),
    });

    return {
      consequenceId: consequence.id,
      triggered: true,
      effects,
      narrative: consequence.narrative,
      cascades,
    };
  }

  private findDefinition(consequence: ScheduledConsequence): ConsequenceDefinition | undefined {
    const item = this.scheduledItems.find(i => i.consequence.id === consequence.id);
    return item?.definition;
  }

  private calculateSignificance(effects: Effect[]): number {
    let significance = 0;

    for (const effect of effects) {
      if (typeof effect.value === 'number') {
        significance += Math.abs(effect.value);
      } else {
        significance += 10;
      }
    }

    return Math.min(100, significance);
  }

  private extractRelatedEntities(effects: Effect[]): string[] {
    const entities: string[] = [];

    for (const effect of effects) {
      if (effect.type === 'faction_trust') {
        entities.push(`faction:${effect.target}`);
      } else if (effect.target.includes('.')) {
        const parts = effect.target.split('.');
        if (parts[0] === 'world' && parts[1] === 'factions') {
          entities.push(`faction:${parts[2]}`);
        } else if (parts[0] === 'world' && parts[1] === 'regions') {
          entities.push(`region:${parts[2]}`);
        }
      }
    }

    return [...new Set(entities)];
  }

  // ---------------------------------------------------------------------------
  // MEMORY SYSTEM
  // ---------------------------------------------------------------------------

  addMemory(entry: MemoryEntry): void {
    this.memory.push(entry);

    // Also add to game state
    const state = this.stateManager.getState();
    state.history.memories.push(entry);

    // Limit memory size
    if (this.memory.length > 1000) {
      // Remove oldest low-significance memories
      this.memory.sort((a, b) => b.significance - a.significance);
      this.memory = this.memory.slice(0, 500);
    }
  }

  getRelevantMemories(tags: string[], limit: number = 10): MemoryEntry[] {
    return this.memory
      .filter(m => m.tags && tags.some(tag => m.tags!.includes(tag)))
      .sort((a, b) => b.turn - a.turn)
      .slice(0, limit);
  }

  getMemoriesByEntity(entityId: string, limit: number = 10): MemoryEntry[] {
    return this.memory
      .filter(m => m.relatedEntities && m.relatedEntities.includes(entityId))
      .sort((a, b) => b.turn - a.turn)
      .slice(0, limit);
  }

  getRecentMemories(turns: number = 5): MemoryEntry[] {
    const currentTurn = this.stateManager.getCurrentTurn();
    return this.memory
      .filter(m => m.turn >= currentTurn - turns)
      .sort((a, b) => b.turn - a.turn);
  }

  getSignificantMemories(minSignificance: number = 50): MemoryEntry[] {
    return this.memory
      .filter(m => m.significance >= minSignificance)
      .sort((a, b) => b.significance - a.significance);
  }

  // ---------------------------------------------------------------------------
  // ANALYSIS
  // ---------------------------------------------------------------------------

  getPendingConsequences(): ScheduledConsequence[] {
    return this.stateManager.getState().history.pendingConsequences;
  }

  getUpcomingConsequences(turns: number = 5): ScheduledItem[] {
    const currentTurn = this.stateManager.getCurrentTurn();
    return this.scheduledItems
      .filter(item => item.scheduledTurn <= currentTurn + turns)
      .filter(item => !item.consequence.triggered)
      .sort((a, b) => a.scheduledTurn - b.scheduledTurn);
  }

  analyzeDecisionHistory(decisionId: string): {
    consequences: ScheduledConsequence[];
    triggered: ScheduledConsequence[];
    pending: ScheduledConsequence[];
    memories: MemoryEntry[];
  } {
    const state = this.stateManager.getState();

    const allConsequences = [
      ...state.history.pendingConsequences,
      ...this.scheduledItems.map(i => i.consequence),
    ].filter(c => c.sourceDecisionId === decisionId);

    return {
      consequences: allConsequences,
      triggered: allConsequences.filter(c => c.triggered),
      pending: allConsequences.filter(c => !c.triggered),
      memories: this.memory.filter(m => m.sourceId === decisionId),
    };
  }

  // ---------------------------------------------------------------------------
  // UNINTENDED CONSEQUENCES
  // ---------------------------------------------------------------------------

  generateUnintendedConsequence(
    originalDecisionId: string,
    severity: 'minor' | 'moderate' | 'major'
  ): ConsequenceDefinition {
    const state = this.stateManager.getState();

    // Generate based on current state and decision
    const consequence: ConsequenceDefinition = {
      id: `unintended-${Date.now()}`,
      sourceType: 'decision',
      sourceId: originalDecisionId,
      minDelay: severity === 'minor' ? 1 : severity === 'moderate' ? 3 : 5,
      maxDelay: severity === 'minor' ? 3 : severity === 'moderate' ? 7 : 12,
      triggerCondition: null,
      baseProbability: 1.0,
      probabilityModifiers: [],
      effects: this.generateUnintendedEffects(severity, state),
      narrative: {
        fa: 'عواقب غیرمنتظره‌ای از تصمیم قبلی شما پدیدار شد',
        en: 'Unintended consequences emerged from your previous decision',
      },
      visible: false,
      foreshadowed: false,
      tags: ['unintended', severity],
      severity,
    };

    return consequence;
  }

  private generateUnintendedEffects(
    severity: 'minor' | 'moderate' | 'major',
    state: GameState
  ): Effect[] {
    const effects: Effect[] = [];
    const magnitude = severity === 'minor' ? 5 : severity === 'moderate' ? 10 : 20;

    // Choose random effect type
    const effectTypes = ['faction_trust', 'resource_change', 'state_change'];
    const type = effectTypes[Math.floor(Math.random() * effectTypes.length)];

    switch (type) {
      case 'faction_trust':
        const factions = Array.from(state.world.factions.keys());
        if (factions.length > 0) {
          const faction = factions[Math.floor(Math.random() * factions.length)];
          effects.push({
            type: 'faction_trust',
            target: faction,
            value: -magnitude,
          });
        }
        break;

      case 'resource_change':
        const resources = ['influence', 'money'];
        const resource = resources[Math.floor(Math.random() * resources.length)];
        effects.push({
          type: 'resource_change',
          target: resource,
          value: -magnitude * (resource === 'money' ? 10 : 1),
        });
        break;

      case 'state_change':
        const regime = state.regime || state.world?.regime;
        effects.push({
          type: 'state_change',
          target: 'regime.stability',
          value: Math.max(0, (regime?.stability ?? 50) - magnitude / 2),
        });
        break;
    }

    return effects;
  }

  // ---------------------------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------------------------

  clearAll(): void {
    this.scheduledItems = [];
    this.memory = [];
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let consequenceEngineInstance: ConsequenceEngine | null = null;

export function getConsequenceEngine(): ConsequenceEngine {
  if (!consequenceEngineInstance) {
    throw new Error('ConsequenceEngine not initialized. Call initializeConsequenceEngine first.');
  }
  return consequenceEngineInstance;
}

export function initializeConsequenceEngine(stateManager: GameStateManager): ConsequenceEngine {
  consequenceEngineInstance = new ConsequenceEngine(stateManager);
  return consequenceEngineInstance;
}
