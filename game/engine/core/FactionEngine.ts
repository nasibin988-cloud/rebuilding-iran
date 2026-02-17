/**
 * IRAN 14XX - Faction Engine
 *
 * Manages faction AI and behavior:
 * - Faction decision-making based on interests
 * - Coalition formation and dissolution
 * - Faction actions and their effects
 * - Relationship dynamics
 * - Power struggles and balance of power
 */

import type {
  GameState,
  FactionId,
  FactionState,
  Effect,
  Condition,
  CharacterId,
  LocalizedString,
} from './types';
import { GameStateManager } from './GameState';
import { ConditionEvaluator } from './EventEngine';

// =============================================================================
// TYPES
// =============================================================================

export interface FactionAction {
  id: string;
  type: FactionActionType;
  label: LocalizedString;
  description: LocalizedString;

  // Requirements
  requirements: Condition[];
  cooldown: number;

  // Costs
  costs: {
    power?: number;
    resources?: number;
  };

  // Effects
  effects: Effect[];

  // Targeting
  targetType: 'none' | 'faction' | 'character' | 'region' | 'player';
  targetRequirements?: Condition[];

  // AI weights
  aiPriority: number;
  aiConditions: Condition[];
}

export type FactionActionType =
  | 'negotiate'
  | 'ally'
  | 'betray'
  | 'attack'
  | 'defend'
  | 'recruit'
  | 'propaganda'
  | 'economic'
  | 'intelligence'
  | 'mobilize'
  | 'suppress'
  | 'reform'
  | 'wait';

export interface CoalitionProposal {
  initiator: FactionId;
  target: FactionId;
  type: 'alliance' | 'non_aggression' | 'coordination' | 'merger';
  terms: CoalitionTerms;
  expirationTurn: number;
}

export interface CoalitionTerms {
  duration: number;
  mutualDefense: boolean;
  shareIntelligence: boolean;
  coordinateActions: boolean;
  resourceSharing: number;
  conditions: Condition[];
}

export interface Coalition {
  id: string;
  members: FactionId[];
  leader: FactionId;
  type: 'alliance' | 'non_aggression' | 'coordination' | 'merger';
  terms: CoalitionTerms;
  formedTurn: number;
  strength: number;
}

export interface FactionTurnResult {
  factionId: FactionId;
  actions: FactionActionResult[];
  coalitionChanges: CoalitionChange[];
  powerChange: number;
}

export interface FactionActionResult {
  action: FactionAction;
  target?: string;
  success: boolean;
  effects: Effect[];
  narrative: LocalizedString;
}

export interface CoalitionChange {
  type: 'formed' | 'joined' | 'left' | 'dissolved';
  coalitionId: string;
  factions: FactionId[];
}

export interface FactionInterest {
  type: 'survival' | 'power' | 'ideology' | 'resources' | 'protection';
  priority: number;
  description: LocalizedString;
  satisfiedBy: Condition[];
  threatenedBy: Condition[];
}

// =============================================================================
// FACTION ENGINE CLASS
// =============================================================================

export class FactionEngine {
  private stateManager: GameStateManager;
  private conditionEvaluator: ConditionEvaluator;
  private actionDefinitions: Map<string, FactionAction> = new Map();
  private coalitions: Map<string, Coalition> = new Map();
  private pendingProposals: CoalitionProposal[] = [];
  private actionCooldowns: Map<string, number> = new Map();

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager;
    this.conditionEvaluator = new ConditionEvaluator(stateManager);
    this.initializeDefaultActions();
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  private initializeDefaultActions(): void {
    const defaultActions: FactionAction[] = [
      {
        id: 'negotiate',
        type: 'negotiate',
        label: { fa: 'مذاکره', en: 'Negotiate' },
        description: { fa: 'تلاش برای بهبود روابط', en: 'Attempt to improve relations' },
        requirements: [],
        cooldown: 2,
        costs: { resources: 10 },
        effects: [],
        targetType: 'faction',
        aiPriority: 60,
        aiConditions: [],
      },
      {
        id: 'ally',
        type: 'ally',
        label: { fa: 'اتحاد', en: 'Form Alliance' },
        description: { fa: 'پیشنهاد اتحاد رسمی', en: 'Propose formal alliance' },
        requirements: [
          { type: 'relationship', target: '$target', operator: 'greater_than', value: 30 },
        ],
        cooldown: 5,
        costs: { power: 5 },
        effects: [],
        targetType: 'faction',
        aiPriority: 70,
        aiConditions: [
          { type: 'stat', target: 'regime.stability', operator: 'less_than', value: 50 },
        ],
      },
      {
        id: 'attack',
        type: 'attack',
        label: { fa: 'حمله', en: 'Attack' },
        description: { fa: 'حمله به منافع رقیب', en: 'Attack rival interests' },
        requirements: [
          { type: 'stat', target: '$self.power.military', operator: 'greater_than', value: 20 },
        ],
        cooldown: 3,
        costs: { power: 15, resources: 50 },
        effects: [],
        targetType: 'faction',
        aiPriority: 40,
        aiConditions: [
          { type: 'relationship', target: '$target', operator: 'less_than', value: -30 },
        ],
      },
      {
        id: 'propaganda',
        type: 'propaganda',
        label: { fa: 'تبلیغات', en: 'Propaganda' },
        description: { fa: 'کمپین تبلیغاتی', en: 'Launch propaganda campaign' },
        requirements: [],
        cooldown: 2,
        costs: { resources: 30 },
        effects: [
          { type: 'state_change', target: '$self.support.popular', value: 5 },
        ],
        targetType: 'none',
        aiPriority: 55,
        aiConditions: [],
      },
      {
        id: 'recruit',
        type: 'recruit',
        label: { fa: 'جذب نیرو', en: 'Recruit' },
        description: { fa: 'جذب اعضای جدید', en: 'Recruit new members' },
        requirements: [],
        cooldown: 3,
        costs: { resources: 40 },
        effects: [
          { type: 'state_change', target: '$self.power.base', value: 3 },
        ],
        targetType: 'none',
        aiPriority: 50,
        aiConditions: [],
      },
      {
        id: 'suppress',
        type: 'suppress',
        label: { fa: 'سرکوب', en: 'Suppress' },
        description: { fa: 'سرکوب مخالفان', en: 'Suppress opposition' },
        requirements: [
          { type: 'stat', target: '$self.power.military', operator: 'greater_than', value: 30 },
          { type: 'flag', target: '$self.isRegime', operator: 'equals', value: true },
        ],
        cooldown: 4,
        costs: { power: 20 },
        effects: [],
        targetType: 'faction',
        aiPriority: 45,
        aiConditions: [
          { type: 'stat', target: 'regime.stability', operator: 'less_than', value: 40 },
        ],
      },
      {
        id: 'mobilize',
        type: 'mobilize',
        label: { fa: 'بسیج', en: 'Mobilize' },
        description: { fa: 'بسیج نیروها', en: 'Mobilize forces' },
        requirements: [],
        cooldown: 5,
        costs: { power: 10, resources: 60 },
        effects: [
          { type: 'state_change', target: '$self.power.military', value: 10 },
        ],
        targetType: 'none',
        aiPriority: 35,
        aiConditions: [
          { type: 'stat', target: 'regime.stability', operator: 'less_than', value: 30 },
        ],
      },
      {
        id: 'wait',
        type: 'wait',
        label: { fa: 'انتظار', en: 'Wait' },
        description: { fa: 'بدون اقدام', en: 'Take no action' },
        requirements: [],
        cooldown: 0,
        costs: {},
        effects: [],
        targetType: 'none',
        aiPriority: 20,
        aiConditions: [],
      },
    ];

    for (const action of defaultActions) {
      this.actionDefinitions.set(action.id, action);
    }
  }

  registerAction(action: FactionAction): void {
    this.actionDefinitions.set(action.id, action);
  }

  // ---------------------------------------------------------------------------
  // FACTION TURN PROCESSING
  // ---------------------------------------------------------------------------

  async processFactionTurns(): Promise<FactionTurnResult[]> {
    const state = this.stateManager.getState();
    const results: FactionTurnResult[] = [];

    // Process each faction
    for (const [factionId, faction] of state.world.factions) {
      const result = await this.processFactionTurn(factionId, faction, state);
      results.push(result);
    }

    // Process coalition dynamics
    this.processCoalitions(state);

    // Update cooldowns
    this.updateCooldowns();

    return results;
  }

  private async processFactionTurn(
    factionId: FactionId,
    faction: FactionState,
    state: GameState
  ): Promise<FactionTurnResult> {
    const actions: FactionActionResult[] = [];
    const coalitionChanges: CoalitionChange[] = [];

    // Determine faction's strategic situation
    const situation = this.assessSituation(factionId, faction, state);

    // Decide on actions based on situation and interests
    const plannedActions = this.planActions(factionId, faction, situation, state);

    // Execute actions
    for (const planned of plannedActions) {
      const result = this.executeAction(factionId, planned.action, planned.target, state);
      actions.push(result);
    }

    // Consider coalition changes
    const coalitionDecisions = this.evaluateCoalitions(factionId, faction, state);
    coalitionChanges.push(...coalitionDecisions);

    // Calculate power change
    const powerChange = this.calculatePowerChange(factionId, actions, state);

    return {
      factionId,
      actions,
      coalitionChanges,
      powerChange,
    };
  }

  // ---------------------------------------------------------------------------
  // STRATEGIC ASSESSMENT
  // ---------------------------------------------------------------------------

  private assessSituation(
    factionId: FactionId,
    faction: FactionState,
    state: GameState
  ): FactionSituation {
    // Calculate threat level
    const threats = this.identifyThreats(factionId, faction, state);
    const threatLevel = this.calculateThreatLevel(threats);

    // Calculate opportunities
    const opportunities = this.identifyOpportunities(factionId, faction, state);
    const opportunityScore = this.calculateOpportunityScore(opportunities);

    // Assess power position
    const powerPosition = this.assessPowerPosition(factionId, state);

    // Evaluate regime stability
    const regime = state.regime || state.world?.regime;
    const regimeStability = regime?.stability ?? 50;

    return {
      threats,
      threatLevel,
      opportunities,
      opportunityScore,
      powerPosition,
      regimeStability,
      recommendedPosture: this.determinePosture(threatLevel, opportunityScore, powerPosition),
    };
  }

  private identifyThreats(
    factionId: FactionId,
    faction: FactionState,
    state: GameState
  ): FactionThreat[] {
    const threats: FactionThreat[] = [];

    // Check hostile factions
    for (const [otherId, other] of state.world.factions) {
      if (otherId === factionId) continue;

      const relationship = this.getRelationship(factionId, otherId, state);
      if (relationship < -30) {
        const otherPower = this.calculateTotalPower(other);
        const selfPower = this.calculateTotalPower(faction);

        if (otherPower > selfPower * 0.7) {
          threats.push({
            type: 'hostile_faction',
            source: otherId,
            severity: Math.abs(relationship) * (otherPower / selfPower),
          });
        }
      }
    }

    // Check regime threats (for opposition)
    const regime = state.regime || state.world?.regime;
    if (faction.category === 'opposition' && regime) {
      threats.push({
        type: 'regime_repression',
        source: 'regime',
        severity: (regime.repressiveCapacity ?? 50) * (100 - (regime.stability ?? 50)) / 100,
      });
    }

    // Check internal threats
    const cohesion = faction.cohesion ?? 50;
    if (cohesion < 50) {
      threats.push({
        type: 'internal_division',
        source: 'internal',
        severity: (100 - cohesion) / 2,
      });
    }

    return threats;
  }

  private identifyOpportunities(
    factionId: FactionId,
    faction: FactionState,
    state: GameState
  ): FactionOpportunity[] {
    const opportunities: FactionOpportunity[] = [];
    const regime = state.regime || state.world?.regime;
    const regimeStability = regime?.stability ?? 50;

    // Low regime stability = opportunity for opposition
    if (faction.category === 'opposition' && regimeStability < 40) {
      opportunities.push({
        type: 'regime_weakness',
        target: 'regime',
        potential: (100 - regimeStability) / 2,
      });
    }

    // Potential allies
    for (const [otherId, other] of state.world.factions) {
      if (otherId === factionId) continue;

      const relationship = this.getRelationship(factionId, otherId, state);
      const ideologicalDistance = this.calculateIdeologicalDistance(faction, other);

      if (relationship > 20 && ideologicalDistance < 30) {
        opportunities.push({
          type: 'potential_alliance',
          target: otherId,
          potential: relationship + (30 - ideologicalDistance),
        });
      }
    }

    // Weak rivals
    for (const [otherId, other] of state.world.factions) {
      if (otherId === factionId) continue;

      const relationship = this.getRelationship(factionId, otherId, state);
      if (relationship < 0) {
        const otherPower = this.calculateTotalPower(other);
        const selfPower = this.calculateTotalPower(faction);

        if (selfPower > otherPower * 1.5) {
          opportunities.push({
            type: 'weak_rival',
            target: otherId,
            potential: (selfPower - otherPower) / 10,
          });
        }
      }
    }

    return opportunities;
  }

  private calculateThreatLevel(threats: FactionThreat[]): number {
    return threats.reduce((sum, t) => sum + t.severity, 0);
  }

  private calculateOpportunityScore(opportunities: FactionOpportunity[]): number {
    return opportunities.reduce((sum, o) => sum + o.potential, 0);
  }

  private assessPowerPosition(factionId: FactionId, state: GameState): 'dominant' | 'strong' | 'moderate' | 'weak' | 'critical' {
    const faction = state.world.factions.get(factionId);
    if (!faction) return 'critical';

    const totalPower = this.calculateTotalPower(faction);
    const averagePower = this.calculateAverageFactionPower(state);

    if (totalPower > averagePower * 2) return 'dominant';
    if (totalPower > averagePower * 1.3) return 'strong';
    if (totalPower > averagePower * 0.7) return 'moderate';
    if (totalPower > averagePower * 0.3) return 'weak';
    return 'critical';
  }

  private determinePosture(
    threatLevel: number,
    opportunityScore: number,
    powerPosition: string
  ): 'aggressive' | 'opportunistic' | 'defensive' | 'consolidating' {
    if (threatLevel > 50 && powerPosition === 'weak') return 'defensive';
    if (opportunityScore > 60 && powerPosition !== 'critical') return 'aggressive';
    if (opportunityScore > threatLevel) return 'opportunistic';
    return 'consolidating';
  }

  // ---------------------------------------------------------------------------
  // ACTION PLANNING
  // ---------------------------------------------------------------------------

  private planActions(
    factionId: FactionId,
    faction: FactionState,
    situation: FactionSituation,
    state: GameState
  ): Array<{ action: FactionAction; target?: string }> {
    const planned: Array<{ action: FactionAction; target?: string }> = [];
    const currentTurn = state.time.turn;

    // Get available actions
    const availableActions = this.getAvailableActions(factionId, faction, currentTurn, state);

    // Score each action based on situation
    const scoredActions: Array<{ action: FactionAction; target?: string; score: number }> = [];

    for (const action of availableActions) {
      if (action.targetType === 'none') {
        const score = this.scoreAction(factionId, action, undefined, situation, state);
        scoredActions.push({ action, score });
      } else if (action.targetType === 'faction') {
        // Evaluate against each potential target
        for (const [targetId] of state.world.factions) {
          if (targetId === factionId) continue;
          const score = this.scoreAction(factionId, action, targetId, situation, state);
          scoredActions.push({ action, target: targetId, score });
        }
      }
    }

    // Sort by score and select top actions
    scoredActions.sort((a, b) => b.score - a.score);

    // Select 1-2 actions per turn
    const maxActions = faction.resources && faction.resources > 50 ? 2 : 1;
    for (let i = 0; i < Math.min(maxActions, scoredActions.length); i++) {
      if (scoredActions[i].score > 0) {
        planned.push({
          action: scoredActions[i].action,
          target: scoredActions[i].target,
        });
      }
    }

    // Always have at least one action (wait if nothing else)
    if (planned.length === 0) {
      const waitAction = this.actionDefinitions.get('wait');
      if (waitAction) {
        planned.push({ action: waitAction });
      }
    }

    return planned;
  }

  private getAvailableActions(
    factionId: FactionId,
    faction: FactionState,
    currentTurn: number,
    state: GameState
  ): FactionAction[] {
    const available: FactionAction[] = [];

    for (const [id, action] of this.actionDefinitions) {
      // Check cooldown
      const cooldownKey = `${factionId}-${id}`;
      const cooldownUntil = this.actionCooldowns.get(cooldownKey);
      if (cooldownUntil && currentTurn < cooldownUntil) continue;

      // Check requirements
      const meetsRequirements = action.requirements.every(req => {
        const resolvedReq = this.resolveConditionVariables(req, factionId, state);
        return this.conditionEvaluator.evaluate(resolvedReq, state);
      });
      if (!meetsRequirements) continue;

      // Check costs
      if (action.costs.power && this.calculateTotalPower(faction) < action.costs.power) continue;
      if (action.costs.resources && (!faction.resources || faction.resources < action.costs.resources)) continue;

      available.push(action);
    }

    return available;
  }

  private scoreAction(
    factionId: FactionId,
    action: FactionAction,
    target: string | undefined,
    situation: FactionSituation,
    state: GameState
  ): number {
    let score = action.aiPriority;

    // Check AI conditions
    for (const condition of action.aiConditions) {
      const resolvedCond = this.resolveConditionVariables(condition, factionId, state, target);
      if (this.conditionEvaluator.evaluate(resolvedCond, state)) {
        score += 20;
      }
    }

    // Adjust based on situation
    switch (situation.recommendedPosture) {
      case 'aggressive':
        if (['attack', 'suppress', 'mobilize'].includes(action.type)) score += 30;
        break;
      case 'opportunistic':
        if (['ally', 'negotiate', 'recruit'].includes(action.type)) score += 25;
        break;
      case 'defensive':
        if (['ally', 'mobilize', 'wait'].includes(action.type)) score += 20;
        break;
      case 'consolidating':
        if (['recruit', 'propaganda', 'wait'].includes(action.type)) score += 15;
        break;
    }

    // Target-specific adjustments
    if (target) {
      const relationship = this.getRelationship(factionId, target, state);

      if (action.type === 'attack' && relationship < -50) score += 20;
      if (action.type === 'ally' && relationship > 30) score += 20;
      if (action.type === 'negotiate' && relationship > -30 && relationship < 30) score += 15;
    }

    // Add some randomness
    score += Math.random() * 10 - 5;

    return Math.max(0, score);
  }

  // ---------------------------------------------------------------------------
  // ACTION EXECUTION
  // ---------------------------------------------------------------------------

  private executeAction(
    factionId: FactionId,
    action: FactionAction,
    target: string | undefined,
    state: GameState
  ): FactionActionResult {
    // Apply costs
    const faction = state.world.factions.get(factionId);
    if (faction) {
      if (action.costs.power && faction.power?.base !== undefined) {
        faction.power.base = Math.max(0, faction.power.base - action.costs.power);
      }
      if (action.costs.resources && faction.resources !== undefined) {
        faction.resources -= action.costs.resources;
      }
    }

    // Determine success
    const success = this.determineSuccess(factionId, action, target, state);

    // Apply effects
    const effects: Effect[] = [];
    if (success) {
      for (const effect of action.effects) {
        const resolvedEffect = this.resolveEffectVariables(effect, factionId, target);
        this.stateManager.applyEffect(resolvedEffect);
        effects.push(resolvedEffect);
      }

      // Apply type-specific effects
      this.applyActionTypeEffects(factionId, action, target, state, effects);
    }

    // Set cooldown
    const cooldownKey = `${factionId}-${action.id}`;
    this.actionCooldowns.set(cooldownKey, state.time.turn + action.cooldown);

    // Generate narrative
    const narrative = this.generateActionNarrative(factionId, action, target, success, state);

    return {
      action,
      target,
      success,
      effects,
      narrative,
    };
  }

  private determineSuccess(
    factionId: FactionId,
    action: FactionAction,
    target: string | undefined,
    state: GameState
  ): boolean {
    const faction = state.world.factions.get(factionId);
    if (!faction) return false;

    let successChance = 0.5;

    // Base on faction power
    const power = this.calculateTotalPower(faction);
    successChance += power / 200;

    // Adjust for target
    if (target) {
      const targetFaction = state.world.factions.get(target as FactionId);
      if (targetFaction) {
        const targetPower = this.calculateTotalPower(targetFaction);
        successChance += (power - targetPower) / 200;
      }
    }

    // Action type modifiers
    if (action.type === 'wait') return true;
    if (action.type === 'negotiate') successChance += 0.2;
    if (action.type === 'attack') successChance -= 0.1;

    return Math.random() < Math.max(0.1, Math.min(0.9, successChance));
  }

  private applyActionTypeEffects(
    factionId: FactionId,
    action: FactionAction,
    target: string | undefined,
    state: GameState,
    effects: Effect[]
  ): void {
    const targetId = target as FactionId;

    switch (action.type) {
      case 'negotiate':
        if (targetId) {
          this.modifyRelationship(factionId, targetId, 10, state);
          effects.push({
            type: 'faction_trust',
            target: targetId,
            value: 10,
          });
        }
        break;

      case 'ally':
        if (targetId) {
          this.modifyRelationship(factionId, targetId, 25, state);
          // Potentially form coalition
          this.proposeCoalition(factionId, targetId, 'alliance');
        }
        break;

      case 'attack':
        if (targetId) {
          this.modifyRelationship(factionId, targetId, -30, state);
          const targetFaction = state.world.factions.get(targetId);
          if (targetFaction && targetFaction.power?.base !== undefined) {
            targetFaction.power.base = Math.max(0, targetFaction.power.base - 5);
          }
          // Regime instability
          const regime = state.regime || state.world?.regime;
          if (state.world.factions.get(targetId)?.category === 'regime' && regime) {
            regime.stability = Math.max(0, (regime.stability ?? 50) - 3);
          }
        }
        break;

      case 'suppress':
        if (targetId) {
          this.modifyRelationship(factionId, targetId, -40, state);
          const targetFaction = state.world.factions.get(targetId);
          if (targetFaction && targetFaction.power?.base !== undefined) {
            targetFaction.power.base = Math.max(0, targetFaction.power.base - 10);
            const cohesion = targetFaction.cohesion ?? 50;
            targetFaction.cohesion = Math.max(0, cohesion - 5);
          }
          // International reaction
          state.international.internationalIsolation += 2;
        }
        break;
    }
  }

  private generateActionNarrative(
    factionId: FactionId,
    action: FactionAction,
    target: string | undefined,
    success: boolean,
    state: GameState
  ): LocalizedString {
    const faction = state.world.factions.get(factionId);
    const factionName = faction?.name || { fa: factionId, en: factionId };

    const targetFaction = target ? state.world.factions.get(target as FactionId) : null;
    const targetName = targetFaction?.name || { fa: target || '', en: target || '' };

    if (success) {
      return {
        fa: `${factionName.fa} ${action.label.fa} انجام داد${target ? ` علیه ${targetName.fa}` : ''}`,
        en: `${factionName.en} performed ${action.label.en}${target ? ` against ${targetName.en}` : ''}`,
      };
    } else {
      return {
        fa: `تلاش ${factionName.fa} برای ${action.label.fa} ناموفق بود`,
        en: `${factionName.en}'s attempt to ${action.label.en} failed`,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // COALITION MANAGEMENT
  // ---------------------------------------------------------------------------

  private proposeCoalition(
    initiator: FactionId,
    target: FactionId,
    type: 'alliance' | 'non_aggression' | 'coordination'
  ): void {
    const proposal: CoalitionProposal = {
      initiator,
      target,
      type,
      terms: {
        duration: 10,
        mutualDefense: type === 'alliance',
        shareIntelligence: type !== 'non_aggression',
        coordinateActions: type === 'coordination' || type === 'alliance',
        resourceSharing: type === 'alliance' ? 0.1 : 0,
        conditions: [],
      },
      expirationTurn: this.stateManager.getCurrentTurn() + 3,
    };

    this.pendingProposals.push(proposal);
  }

  private evaluateCoalitions(
    factionId: FactionId,
    faction: FactionState,
    state: GameState
  ): CoalitionChange[] {
    const changes: CoalitionChange[] = [];

    // Check pending proposals to this faction
    const proposals = this.pendingProposals.filter(p => p.target === factionId);

    for (const proposal of proposals) {
      if (this.shouldAcceptProposal(factionId, proposal, state)) {
        const coalition = this.formCoalition(proposal);
        changes.push({
          type: 'formed',
          coalitionId: coalition.id,
          factions: coalition.members,
        });
      }
    }

    // Remove processed proposals
    this.pendingProposals = this.pendingProposals.filter(
      p => p.target !== factionId && p.expirationTurn > state.time.turn
    );

    // Check if should leave existing coalitions
    for (const [coalitionId, coalition] of this.coalitions) {
      if (coalition.members.includes(factionId)) {
        if (this.shouldLeaveCoalition(factionId, coalition, state)) {
          changes.push({
            type: 'left',
            coalitionId,
            factions: [factionId],
          });
          coalition.members = coalition.members.filter(m => m !== factionId);
          if (coalition.members.length < 2) {
            changes.push({
              type: 'dissolved',
              coalitionId,
              factions: coalition.members,
            });
            this.coalitions.delete(coalitionId);
          }
        }
      }
    }

    return changes;
  }

  private shouldAcceptProposal(
    factionId: FactionId,
    proposal: CoalitionProposal,
    state: GameState
  ): boolean {
    const relationship = this.getRelationship(factionId, proposal.initiator, state);

    // Basic requirements
    if (relationship < 20) return false;

    // Check ideological compatibility
    const self = state.world.factions.get(factionId);
    const other = state.world.factions.get(proposal.initiator);
    if (!self || !other) return false;

    const ideologicalDistance = this.calculateIdeologicalDistance(self, other);
    if (ideologicalDistance > 50) return false;

    // Strategic value
    const otherPower = this.calculateTotalPower(other);
    const selfPower = this.calculateTotalPower(self);

    // More likely to accept if other faction is strong
    const powerRatio = otherPower / selfPower;
    const acceptChance = 0.3 + relationship / 200 + (powerRatio > 1 ? 0.2 : 0);

    return Math.random() < acceptChance;
  }

  private shouldLeaveCoalition(
    factionId: FactionId,
    coalition: Coalition,
    state: GameState
  ): boolean {
    // Check relationships with other members
    for (const memberId of coalition.members) {
      if (memberId === factionId) continue;

      const relationship = this.getRelationship(factionId, memberId, state);
      if (relationship < -20) {
        return true;
      }
    }

    return false;
  }

  private formCoalition(proposal: CoalitionProposal): Coalition {
    const coalition: Coalition = {
      id: `coalition-${Date.now()}`,
      members: [proposal.initiator, proposal.target],
      leader: proposal.initiator,
      type: proposal.type,
      terms: proposal.terms,
      formedTurn: this.stateManager.getCurrentTurn(),
      strength: 0,
    };

    this.coalitions.set(coalition.id, coalition);
    return coalition;
  }

  private processCoalitions(state: GameState): void {
    // Update coalition strength
    for (const [id, coalition] of this.coalitions) {
      let totalPower = 0;
      for (const memberId of coalition.members) {
        const member = state.world.factions.get(memberId);
        if (member) {
          totalPower += this.calculateTotalPower(member);
        }
      }
      coalition.strength = totalPower;

      // Check duration
      if (state.time.turn > coalition.formedTurn + coalition.terms.duration) {
        this.coalitions.delete(id);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  private calculateTotalPower(faction: FactionState): number {
    const power = faction.power || {};
    return (
      (power.base ?? 0) +
      (power.military ?? 0) * 2 +
      (power.economic ?? 0) +
      (power.religious ?? 0) +
      (power.popular ?? 0) * 0.5
    );
  }

  private calculateAverageFactionPower(state: GameState): number {
    let total = 0;
    let count = 0;
    for (const [, faction] of state.world.factions) {
      total += this.calculateTotalPower(faction);
      count++;
    }
    return count > 0 ? total / count : 0;
  }

  private getRelationship(faction1: FactionId, faction2: FactionId, state: GameState): number {
    const f1 = state.world.factions.get(faction1);
    if (!f1) return 0;

    const rel = f1.relationships.get(faction2);
    return rel?.trust || 0;
  }

  private modifyRelationship(
    faction1: FactionId,
    faction2: FactionId,
    change: number,
    state: GameState
  ): void {
    const f1 = state.world.factions.get(faction1);
    const f2 = state.world.factions.get(faction2);

    if (f1) {
      const rel = f1.relationships.get(faction2) || { factionId: faction2, trust: 0, alignment: 0, cooperation: 50, history: [] };
      rel.trust = Math.max(-100, Math.min(100, rel.trust + change));
      f1.relationships.set(faction2, rel);
    }

    if (f2) {
      const rel = f2.relationships.get(faction1) || { factionId: faction1, trust: 0, alignment: 0, cooperation: 50, history: [] };
      rel.trust = Math.max(-100, Math.min(100, rel.trust + change * 0.7));
      f2.relationships.set(faction1, rel);
    }
  }

  private calculateIdeologicalDistance(f1: FactionState, f2: FactionState): number {
    if (!f1.ideology || !f2.ideology) return 50;

    let distance = 0;
    const dimensions = ['economicLeft', 'socialLiberal', 'nationalist', 'religious', 'democratic'] as const;

    for (const dim of dimensions) {
      const d1 = f1.ideology[dim] ?? 50;
      const d2 = f2.ideology[dim] ?? 50;
      distance += Math.abs(d1 - d2);
    }

    return distance / dimensions.length;
  }

  private resolveConditionVariables(
    condition: Condition,
    factionId: FactionId,
    state: GameState,
    targetId?: string
  ): Condition {
    const resolved = { ...condition };

    if (typeof resolved.target === 'string') {
      resolved.target = resolved.target
        .replace('$self', `world.factions.${factionId}`)
        .replace('$target', targetId ? `world.factions.${targetId}` : '');
    }

    return resolved;
  }

  private resolveEffectVariables(
    effect: Effect,
    factionId: FactionId,
    targetId?: string
  ): Effect {
    const resolved = { ...effect };

    if (typeof resolved.target === 'string') {
      resolved.target = resolved.target
        .replace('$self', `world.factions.${factionId}`)
        .replace('$target', targetId ? `world.factions.${targetId}` : '');
    }

    return resolved;
  }

  private updateCooldowns(): void {
    // Cooldowns are turn-based, already handled in executeAction
  }

  private calculatePowerChange(
    factionId: FactionId,
    actions: FactionActionResult[],
    state: GameState
  ): number {
    let change = 0;

    for (const result of actions) {
      if (result.success) {
        for (const effect of result.effects) {
          if (effect.target.includes('power') && typeof effect.value === 'number') {
            change += effect.value;
          }
        }
      }
    }

    return change;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC ACCESSORS
  // ---------------------------------------------------------------------------

  getCoalitions(): Coalition[] {
    return Array.from(this.coalitions.values());
  }

  getFactionCoalitions(factionId: FactionId): Coalition[] {
    return Array.from(this.coalitions.values())
      .filter(c => c.members.includes(factionId));
  }

  getAvailableActionsForFaction(factionId: FactionId): FactionAction[] {
    const state = this.stateManager.getState();
    const faction = state.world.factions.get(factionId);
    if (!faction) return [];

    return this.getAvailableActions(factionId, faction, state.time.turn, state);
  }
}

// =============================================================================
// INTERNAL TYPES
// =============================================================================

interface FactionSituation {
  threats: FactionThreat[];
  threatLevel: number;
  opportunities: FactionOpportunity[];
  opportunityScore: number;
  powerPosition: 'dominant' | 'strong' | 'moderate' | 'weak' | 'critical';
  regimeStability: number;
  recommendedPosture: 'aggressive' | 'opportunistic' | 'defensive' | 'consolidating';
}

interface FactionThreat {
  type: string;
  source: string;
  severity: number;
}

interface FactionOpportunity {
  type: string;
  target: string;
  potential: number;
}

// =============================================================================
// SINGLETON
// =============================================================================

let factionEngineInstance: FactionEngine | null = null;

export function getFactionEngine(): FactionEngine {
  if (!factionEngineInstance) {
    throw new Error('FactionEngine not initialized. Call initializeFactionEngine first.');
  }
  return factionEngineInstance;
}

export function initializeFactionEngine(stateManager: GameStateManager): FactionEngine {
  factionEngineInstance = new FactionEngine(stateManager);
  return factionEngineInstance;
}
