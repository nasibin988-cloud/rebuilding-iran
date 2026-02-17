# Consequence Engine: How Choices Echo Through Time

## Philosophy

**Every action has consequences. But consequences are not immediate, not obvious, and not always what you expect.**

This is the central teaching of IRAN 14XX. The Consequence Engine makes this visceral by:
- Delaying effects so players experience the disconnect between action and result
- Surfacing unintended consequences that make players reconsider their choices
- Creating chains of causation where one decision leads to another to another
- Making players live with their choices, for better or worse

---

## Core Principles

### 1. Time Delay Is Educational

**Problem with immediate consequences:** If you press a button and immediately see the result, you learn the mechanical relationship but not the real-world pattern. Politics doesn't work that way.

**The lesson of delayed consequences:**
- You make a choice in Turn 5
- You move on to other things
- In Turn 15, something happens
- The game shows you: "Remember your choice in Turn 5? This is the result."
- You think: "Oh. I didn't see that coming. But now that I think about it..."

This is how political learning actually works. You learn that actions echo through time, that short-term victories may have long-term costs, that patience and foresight matter.

### 2. Unintended Consequences Are the Point

**What players expect:** "I'll support the workers, workers will support me, we win."

**What actually happens:** "You supported the workers. This radicalized the movement. Six months later, they're demanding things you can't deliver. Your more moderate allies are nervous. The workers feel betrayed when you don't meet their expectations. Your support created dependency."

This isn't punishment. This is realism. Supporting workers is still probably right. But the player learns that good actions have complex effects.

### 3. Choices Compound

Early choices constrain later options:

```
Turn 1: You ally with monarchists for their resources
Turn 5: Monarchists expect you to support crown prince
Turn 10: You want to bring republicans into coalition
Turn 15: Republicans demand you distance from monarchists
Turn 20: You must choose - lose monarchists or lose republicans
         (You could have avoided this if you'd been careful in Turn 1)
```

### 4. Nothing Is Forgotten

The game remembers everything:
- Promises made
- Betrayals committed
- People helped
- People abandoned
- Principles upheld
- Principles violated

This information emerges at appropriate moments, creating a sense that history matters.

---

## Consequence Types

### 1. Delayed Direct Effects

Effects that happen later but are directly connected to the choice.

```yaml
DELAYED_DIRECT:
  example:
    turn_0_choice: "Free political prisoners as gesture of goodwill"
    turn_3_effect: "Released prisoners have reorganized opposition networks"
    mechanism: Direct causal connection
    lesson: "Actions have predictable but delayed effects"

  parameters:
    delay: 1-20 turns
    certainty: 0.5-1.0 (some delayed effects are probabilistic)
    visibility: shown | hidden (player knows it's coming or surprised)
```

### 2. Compounding Effects

Effects that grow over time.

```yaml
COMPOUNDING:
  example:
    turn_0_choice: "Ignore corruption investigation"
    turn_1_effect: "Corruption continues (small)"
    turn_5_effect: "Corruption is normalized (medium)"
    turn_10_effect: "Systemic corruption undermines legitimacy (large)"
    mechanism: Small tolerance grows into big problem
    lesson: "Problems ignored don't stay small"

  parameters:
    growth_rate: per-turn multiplier
    ceiling: maximum accumulated effect
    reversibility: can trend be reversed? at what cost?
```

### 3. Second-Order Effects

Effects on things connected to the direct target.

```yaml
SECOND_ORDER:
  example:
    turn_0_choice: "Crack down on protesters"
    first_order: "Protests suppressed (short term)"
    second_order_1: "International condemnation increases"
    second_order_2: "Regime supporters feel validated"
    second_order_3: "Moderate opposition radicalized"
    second_order_4: "Diaspora funding for opposition increases"
    mechanism: Action affects network of connected things
    lesson: "Every action ripples outward"

  parameters:
    network_depth: how many degrees of connection
    strength_decay: effects weaken with distance
    timing_spread: different second-order effects arrive at different times
```

### 4. Conditional Consequences

Effects that only manifest if other conditions are met.

```yaml
CONDITIONAL:
  example:
    turn_0_choice: "Accept weapons from foreign power"
    condition: "If later accused of being foreign puppet"
    consequence: "Evidence of foreign weapons is devastating"
    mechanism: Creating vulnerability that might not be exploited
    lesson: "Some choices create risks that may or may not manifest"

  parameters:
    trigger_condition: what activates the consequence
    probability: how likely is the trigger?
    severity: how bad is it if triggered?
    mitigation: can the vulnerability be reduced later?
```

### 5. Relationship Echoes

Effects on how others perceive and treat you.

```yaml
RELATIONSHIP_ECHO:
  example:
    turn_0_choice: "Break promise to ally"
    immediate: "Ally relationship damaged"
    echo_1: "Other allies wonder if you'll betray them too"
    echo_2: "Enemies learn you can be turned"
    echo_3: "Future negotiations start with suspicion"
    echo_4: "Your word is worth less in any context"
    mechanism: Reputation ripples through all relationships
    lesson: "Character is destiny; reputation is consequential"

  parameters:
    spread: who learns about this?
    interpretation: how do different actors interpret it?
    persistence: how long do they remember?
    recovery: can reputation be rebuilt?
```

### 6. Path Dependency

Choices that open or close future paths.

```yaml
PATH_DEPENDENCY:
  example:
    turn_0_choice: "Execute prominent regime figure"
    path_closed: "Negotiated transition with regime buy-in"
    paths_opened:
      - "Revolution and full regime replacement"
      - "Civil war"
    mechanism: Some choices make other choices impossible
    lesson: "You can't uncommit from certain paths"

  parameters:
    permanence: reversible | difficult_to_reverse | permanent
    alternatives_blocked: what becomes impossible
    alternatives_enabled: what becomes possible
    pivot_points: when is it too late to change?
```

---

## The Memory System

### What the Game Remembers

```yaml
MEMORY_CATEGORIES:
  promises:
    structure:
      - who: recipient of promise
        what: content of promise
        when: when made
        deadline: when due
        status: kept | broken | pending
    effects:
      - breaking_promise: trust damage, narrative event
      - keeping_promise: trust building, narrative event

  actions_against_people:
    structure:
      - target: who was affected
        action: what happened
        severity: how serious
        justification: what player said (if anything)
    effects:
      - targets_remember: forever
      - witnesses_remember: based on relationship
      - future_interactions_affected: trust, willingness

  alliances_and_betrayals:
    structure:
      - with: faction or character
        type: alliance | betrayal | abandonment
        context: circumstances
        public: was it visible?
    effects:
      - pattern_recognition: others see patterns in your behavior
      - reputation_building: develops over time

  principles_stated:
    structure:
      - principle: what you said you stood for
        context: when you said it
        subsequent_behavior: did you live up to it?
    effects:
      - consistency_bonus: if you're consistent
      - hypocrisy_penalty: if you contradict yourself
```

### Memory Retrieval

The game surfaces memories at appropriate moments:

```python
class MemorySystem:
    def check_relevant_memories(self, current_event, player_state):
        """
        Find memories relevant to current situation.
        """
        relevant = []

        # Check for broken promises
        for promise in player_state.promises:
            if promise.is_relevant_to(current_event):
                relevant.append(MemoryReference(
                    type="promise",
                    content=promise,
                    relevance=calculate_relevance(promise, current_event)
                ))

        # Check for past actions toward involved parties
        for party in current_event.involved_parties:
            past_actions = player_state.actions_toward(party)
            for action in past_actions:
                relevant.append(MemoryReference(
                    type="past_action",
                    content=action,
                    relevance=calculate_relevance(action, current_event)
                ))

        # Check for pattern consistency
        patterns = self.detect_patterns(player_state.action_history)
        current_options = current_event.decision_options
        for option in current_options:
            consistency = self.check_pattern_consistency(option, patterns)
            if consistency.notable:
                relevant.append(MemoryReference(
                    type="pattern",
                    content=consistency,
                    relevance=consistency.importance
                ))

        return sorted(relevant, key=lambda x: x.relevance, reverse=True)
```

### Memory Surfacing

Memories appear in the narrative:

```
══════════════════════════════════════════════════════════
EVENT: Coalition Partner Demands Accountability
══════════════════════════════════════════════════════════

The Republican faction has called an emergency meeting.
Their leader, Dr. Tehrani, looks grim.

"We need to discuss the labor situation," he begins.

[MEMORY SURFACED]
┌─────────────────────────────────────────────────────────┐
│ 8 months ago, you promised Dr. Tehrani that worker     │
│ demands would be addressed "within the first year."    │
│ That deadline has passed. The workers are still        │
│ waiting. He is clearly thinking about this.            │
└─────────────────────────────────────────────────────────┘

"You made commitments," he continues. "Our base believed you."
```

---

## Consequence Chains

### How Effects Link Together

```yaml
CHAIN_EXAMPLE:
  name: "The Price of Expedience"

  link_1:
    turn: 3
    choice: "Accept IRGC defector without full vetting"
    immediate: "Gain valuable intelligence"
    set_up: "Defector has complex loyalties"

  link_2:
    turn: 7
    event: "Defector provides critical information"
    effect: "You trust the defector more"
    set_up: "Building false confidence"

  link_3:
    turn: 12
    event: "Defector's information leads to successful operation"
    effect: "Defector is promoted in your organization"
    set_up: "Defector has access to sensitive plans"

  link_4:
    turn: 18
    event: "Major operation fails catastrophically"
    revelation: "Defector was double agent all along"
    effect:
      - "Organization infiltrated"
      - "Allies arrested"
      - "Your judgment questioned"
      - "Trust in defectors generally damaged"

  player_experience:
    - Each link seemed reasonable at the time
    - Final revelation is shocking but, in retrospect, foreseeable
    - Player thinks: "I should have been more careful in Turn 3"
    - Next playthrough: player approaches defectors differently
```

### Chain Types

```yaml
CHAIN_TYPES:
  escalation:
    description: Each step increases intensity
    example: "Harsh words → heated conflict → violence → civil war"

  corruption:
    description: Small compromises lead to large ones
    example: "One exception → pattern of exceptions → systematic corruption"

  trust_building:
    description: Consistent actions build toward major opportunity
    example: "Small kept promises → medium kept promises → ally risks everything for you"

  trust_destruction:
    description: Betrayals compound until relationship impossible
    example: "Minor slight → broken promise → public criticism → permanent enmity"

  capability_building:
    description: Investments pay off over time
    example: "Train organizers → build networks → develop leadership → mass mobilization capacity"

  capability_atrophy:
    description: Neglect leads to loss
    example: "Ignore network → members drift away → capacity diminishes → when needed, not available"
```

---

## Unintended Consequences Catalog

### Categories of Unintended Effects

```yaml
UNINTENDED_CONSEQUENCES:
  opposite_effect:
    description: Action produces opposite of intention
    example:
      action: "Crack down on protest to restore order"
      intention: "End protests, restore stability"
      actual: "Protests spread, become more radical"
    mechanism: "Repression creates martyrs and solidarity"

  success_creates_problems:
    description: Getting what you want creates new challenges
    example:
      action: "Build mass movement"
      success: "Movement grows beyond expectations"
      problem: "Movement is now too large to control, has factions you don't want"
    mechanism: "Success changes the situation"

  allies_become_obstacles:
    description: Those who helped you now constrain you
    example:
      action: "Accept help from powerful faction"
      success: "Their resources help you grow"
      problem: "They now expect influence you don't want to give"
    mechanism: "Debts come due"

  precedent_set:
    description: What you did becomes expected
    example:
      action: "Amnesty for defectors"
      success: "Defectors join your side"
      problem: "Victims expect amnesty is general policy; future hardliners expect escape"
    mechanism: "Actions set expectations"

  information_revealed:
    description: Action reveals something you wanted hidden
    example:
      action: "Make deal with foreign power"
      success: "Get resources you needed"
      problem: "Deal becomes known, damages nationalist credibility"
    mechanism: "Actions communicate information"

  capability_atrophy:
    description: Focusing on one thing weakens another
    example:
      action: "Focus all energy on political coalition"
      success: "Coalition strengthens"
      problem: "Neglected grassroots networks decay"
    mechanism: "Attention is finite"
```

### Implementing Unintended Consequences

```python
class UnintendedConsequenceEngine:
    """
    Generates realistic unintended consequences.
    """

    def analyze_action(self, action, state):
        """
        Determine what unintended effects an action might have.
        """
        consequences = []

        # Check for opposite effects
        if action.type == "repression":
            consequences.append(PotentialConsequence(
                type="opposite_effect",
                description="Repression could backfire",
                probability=self.calculate_backfire_probability(action, state),
                effect=RepressiveBackfireEffect(action),
                delay=3  # turns
            ))

        # Check for ally obligations
        for ally in action.allies_involved:
            consequences.append(PotentialConsequence(
                type="ally_obligation",
                description=f"{ally.name} will expect reciprocation",
                probability=0.9,
                effect=AllyExpectationEffect(ally, action),
                delay=5
            ))

        # Check for precedent
        if action.sets_precedent:
            consequences.append(PotentialConsequence(
                type="precedent",
                description="This will be expected again",
                probability=0.8,
                effect=PrecedentEffect(action),
                delay=10
            ))

        # Check for information revelation
        if action.visibility > 0.5:
            for observer in self.get_observers(action, state):
                consequences.append(PotentialConsequence(
                    type="information_revealed",
                    description=f"{observer.name} learns something",
                    probability=action.visibility,
                    effect=InformationRevealedEffect(observer, action),
                    delay=1
                ))

        return consequences
```

---

## Consequence Presentation

### How Players Learn What Happened

```yaml
CONSEQUENCE_PRESENTATION:
  immediate_feedback:
    # Right after decision
    content: "Your choice has been made. Here's what happens immediately."
    detail_level: high
    connection_to_choice: explicit

  delayed_reveal:
    # When delayed effect triggers
    content: "Remember when you [X]? Here's what that led to."
    detail_level: high
    connection_to_choice: explicit with reminder

  pattern_emergence:
    # When multiple effects combine
    content: "A pattern has emerged from your choices..."
    detail_level: medium
    connection_to_choices: connects multiple past decisions

  historical_judgment:
    # In endgame/epilogue
    content: "Looking back, your decision to [X] led to [Y]..."
    detail_level: high
    connection_to_choice: comprehensive retrospective
```

### Consequence Notification UI

```
┌─────────────────────────────────────────────────────────┐
│ ⏳ CONSEQUENCE ARRIVED                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ "The Workers Remember"                                  │
│                                                         │
│ 6 months ago, you encouraged workers to wait rather    │
│ than strike. At the time, it seemed prudent.           │
│                                                         │
│ The workers waited. The regime didn't negotiate.       │
│ Conditions worsened. And now the workers remember      │
│ who told them to be patient.                           │
│                                                         │
│ EFFECT:                                                 │
│ • Labor Movement trust: -20                             │
│ • Worker organizations less likely to follow your lead │
│ • Radical labor factions gaining influence              │
│                                                         │
│ WHAT YOU MIGHT HAVE DONE DIFFERENTLY:                   │
│ Supporting the strike would have been riskier in the   │
│ short term, but might have built lasting trust.        │
│                                                         │
│ This is not to say your choice was "wrong." The strike │
│ might have been crushed. We'll never know.             │
│                                                         │
│ [Continue]                                              │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Consequence Scheduler

```python
class ConsequenceScheduler:
    """
    Manages delayed consequences.
    """

    def __init__(self):
        self.pending = []  # List of scheduled consequences
        self.resolved = []  # List of resolved consequences

    def schedule(self, consequence):
        """
        Add a consequence to be triggered later.
        """
        scheduled = ScheduledConsequence(
            id=generate_id(),
            consequence=consequence,
            trigger_turn=current_turn + consequence.delay,
            trigger_condition=consequence.condition,
            created_turn=current_turn,
            source_event=consequence.source,
            probability=consequence.probability
        )
        self.pending.append(scheduled)
        return scheduled.id

    def process_turn(self, current_turn, state):
        """
        Check for consequences that should trigger this turn.
        """
        triggered = []
        still_pending = []

        for scheduled in self.pending:
            should_trigger = False

            # Check turn-based trigger
            if scheduled.trigger_turn <= current_turn:
                should_trigger = True

            # Check condition-based trigger
            if scheduled.trigger_condition:
                if scheduled.trigger_condition.evaluate(state):
                    should_trigger = True

            if should_trigger:
                # Roll for probability
                if random.random() < scheduled.probability:
                    result = self.execute_consequence(scheduled, state)
                    triggered.append(result)
                    self.resolved.append(scheduled)
                else:
                    # Consequence didn't happen (probabilistic failure)
                    self.resolved.append(scheduled)
            else:
                still_pending.append(scheduled)

        self.pending = still_pending
        return triggered

    def execute_consequence(self, scheduled, state):
        """
        Execute a consequence and return the result.
        """
        consequence = scheduled.consequence

        # Apply effects
        effects = consequence.apply(state)

        # Generate narrative
        narrative = consequence.generate_narrative(scheduled.source_event)

        # Record in history
        record = ConsequenceRecord(
            consequence=consequence,
            effects=effects,
            narrative=narrative,
            triggered_turn=current_turn,
            source_turn=scheduled.created_turn,
            source_event=scheduled.source_event
        )

        return record
```

### Consequence Definition Format

```yaml
CONSEQUENCE_DEFINITION:
  id: worker_disillusionment
  type: delayed_relationship

  source_actions:
    - encouraged_workers_to_wait
    - failed_to_support_strike

  delay:
    type: turns
    value: 6-8  # Range adds unpredictability

  condition:  # Optional additional condition
    state: labor_conditions_not_improved
    probability_modifier: +0.2

  probability: 0.7

  effects:
    - type: faction_trust
      target: labor_movement
      value: -20
    - type: set_flag
      flag: workers_disillusioned
    - type: trigger_event
      event: radical_labor_emerges
      probability: 0.4

  narrative:
    title: "The Workers Remember"
    description: |
      6 months ago, you encouraged workers to wait rather than strike...
    mood: somber

  learning:
    what_player_learns: |
      Patience has costs too. Workers who are told to wait
      may lose faith in those who counsel caution.
    historical_parallel: |
      Compare to moderate labor leaders in revolutionary moments
      who were outflanked by more radical voices...
```

---

## Design Guidelines

### Consequence Quality Checklist

```yaml
QUALITY_CHECKLIST:
  fairness:
    - [ ] Player could have anticipated this (with thought)
    - [ ] Connection to original choice is clear
    - [ ] Not punitive; reflects realistic dynamics
    - [ ] Player has options to respond

  educational_value:
    - [ ] Teaches something about politics
    - [ ] Illustrates a real pattern
    - [ ] Makes player think differently

  narrative_quality:
    - [ ] Consequence is interesting, not just mechanical
    - [ ] Character and story are involved
    - [ ] Emotional resonance

  balance:
    - [ ] Not game-breaking
    - [ ] Proportionate to original choice
    - [ ] Recovery is possible (usually)
```

### Common Mistakes to Avoid

```yaml
MISTAKES:
  gotcha_consequences:
    wrong: "You couldn't have known, but your choice was wrong!"
    right: "You could have thought about this; here's why it matters"

  punitive_consequences:
    wrong: "You made a bad choice; suffer!"
    right: "Choices have tradeoffs; here's this one's"

  random_consequences:
    wrong: "Random bad thing happens because we needed drama"
    right: "This follows logically from what came before"

  disconnected_consequences:
    wrong: "Something happened; it's vaguely related to something you did"
    right: "Here is exactly how your choice led to this result"
```

---

## Conclusion

The Consequence Engine is what makes IRAN 14XX more than a choose-your-own-adventure. It creates the feeling that:

1. **Actions matter** - What you do echoes through time
2. **The world is complex** - Effects are not always what you expect
3. **History has weight** - The past shapes the present
4. **Character is consequential** - Who you are determines what happens
5. **Learning is possible** - By seeing consequences, you understand better

Players should finish a game session thinking about their choices - not just "did I win?" but "what did I do? what did it mean? what would I do differently?"

That reflection is the game's deepest educational purpose.

---

*Last updated: February 2026*
