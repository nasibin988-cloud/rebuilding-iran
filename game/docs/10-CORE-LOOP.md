# Core Game Loop: How IRAN 14XX Plays

## Overview

The game proceeds through a series of turns, each representing time passing in Iran. Every turn, the player receives information, makes decisions, and witnesses consequences. The cumulative effect of decisions over many turns determines Iran's fate.

---

## Time Structure

### The Game Clock

```yaml
TIME_STRUCTURE:
  turn_length: 1-3 months (variable based on events)
  game_span: 10-30 years (depends on scenario and choices)

  phases_per_turn:
    - briefing         # What happened since last turn
    - events           # Random and triggered events
    - decisions        # Player choices
    - advisor_input    # Consultation (optional)
    - resolution       # What happens as result
    - faction_update   # How factions respond
    - score_update     # Eudaimonia changes

  pacing:
    - Quiet periods: 3-month turns
    - Crisis periods: 1-month or even week-based turns
    - Key moments: Can slow to single decisions
```

### Example Turn Flow

```
══════════════════════════════════════════════════════════
TURN 15: Mehr 1404 (September 2025)
══════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│ BRIEFING                                                │
├─────────────────────────────────────────────────────────┤
│ Since last turn:                                        │
│ • Oil prices dropped 15% (economic pressure)            │
│ • Three activists released from Evin (regime signal?)   │
│ • Protests in Zahedan (ongoing Baluch tensions)         │
│ • Kurdish parties announced coordination meeting        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ EVENT: Worker Strike Spreads                            │
├─────────────────────────────────────────────────────────┤
│ Steel workers in Isfahan have joined the Ahvaz oil      │
│ refinery strike. Together they represent significant    │
│ economic leverage.                                      │
│                                                         │
│ The strike leaders are requesting a meeting.            │
│                                                         │
│ > [Meet with strike leaders]                            │
│   [Support strike publicly]                             │
│   [Encourage workers to wait]                           │
│   [Ignore - focus on other priorities]                  │
│                                                         │
│ [Ask advisor for input]  [Learn more about labor]       │
└─────────────────────────────────────────────────────────┘
```

---

## The Five Phases

### Phase 1: Briefing

**Purpose:** Orient the player to what's happened

```yaml
BRIEFING_CONTENT:
  summary:
    - Key events since last turn
    - Changes in faction positions
    - Economic indicators
    - International developments

  alerts:
    - Urgent matters requiring attention
    - Deadlines approaching
    - Opportunities expiring

  retrospective:
    - Effects of previous decisions now materializing
    - "3 months ago you decided X; here's what happened"

  mood:
    - General sense of whether things are improving/declining
    - Regional variations
```

**UI Design:**
- Clean, newspaper-style layout
- Important items highlighted
- Expandable details for those who want depth
- Quick-scan possible for experienced players

---

### Phase 2: Events

**Purpose:** Present situations requiring response

Events come from several sources:

```yaml
EVENT_SOURCES:
  triggered:
    # Result of previous decisions
    - type: consequence
      example: "Your alliance with monarchists has angered republican partners"

  scheduled:
    # Known upcoming events
    - type: scheduled
      example: "The Supreme Leader's birthday celebration" (annual)

  random:
    # Probability-based events
    - type: random
      probability: weighted by conditions
      example: "Earthquake in Kermanshah" (geographic probability)

  faction_driven:
    # Factions taking actions
    - type: faction_action
      example: "IRGC announces new economic initiative"

  international:
    # External events
    - type: international
      example: "US announces new sanctions package"
```

**Event Structure:**

```yaml
EVENT:
  id: worker_strike_spreading
  title: "Worker Strike Spreads"
  type: economic | political | social | military | international

  description: |
    Steel workers in Isfahan have joined the Ahvaz oil refinery strike.
    Together they represent significant economic leverage...

  context:
    - Why this matters
    - What led to this
    - Who's involved

  decisions:
    - id: meet_leaders
      label: "Meet with strike leaders"
      requirements: []  # Player can always choose this
      effects:
        - faction_trust: labor +15
        - regime_suspicion: +20
        - time_cost: 1 week

    - id: support_publicly
      label: "Support strike publicly"
      requirements: [public_profile > 50]
      effects:
        - labor_momentum: +25
        - regime_targeting: +30
        - popular_support: +10

    - id: encourage_wait
      label: "Encourage workers to wait"
      requirements: []
      effects:
        - labor_trust: -10
        - regime_pressure: -5
        - momentum_preserved: 0.7

    - id: ignore
      label: "Ignore - focus on other priorities"
      requirements: []
      effects:
        - labor_trust: -20
        - opportunity_lost: true
        - other_priorities: +1 action

  deadline: 2 turns  # Must decide within 2 turns or default

  related_events:  # May trigger these
    - strike_success
    - strike_failure
    - strike_crackdown
```

---

### Phase 3: Decisions

**Purpose:** Player makes choices

Decisions come in several types:

```yaml
DECISION_TYPES:
  reactive:
    # Responding to events
    - Must respond (or consciously ignore)
    - Often time-sensitive
    - Example: How to respond to protest crackdown

  proactive:
    # Initiating actions
    - Player-driven
    - Resource-constrained
    - Example: Launch new coalition initiative

  strategic:
    # Long-term direction
    - Sets parameters for future
    - Hard to reverse
    - Example: Commit to federalism as policy

  resource_allocation:
    # Distributing limited resources
    - Time, money, attention
    - Opportunity costs matter
    - Example: Focus on Tehran or provinces?

  relationship:
    # Managing allies and enemies
    - Trust-building or breaking
    - Signaling intentions
    - Example: Accept controversial ally into coalition
```

**Decision Interface:**

```
┌─────────────────────────────────────────────────────────┐
│ DECISION: Worker Strike Response                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ OPTIONS:                                                │
│                                                         │
│ [1] Meet with strike leaders                            │
│     • Builds labor trust (+15)                          │
│     • Increases regime attention (+20)                  │
│     • Takes time (1 week)                               │
│                                                         │
│ [2] Support strike publicly                             │
│     • Major momentum boost (+25)                        │
│     • High risk: Regime may target you (+30)            │
│     • Requires: Public profile > 50                     │
│     ✗ [Currently unavailable - profile too low]         │
│                                                         │
│ [3] Encourage workers to wait                           │
│     • Preserves relationship somewhat (-10 trust)       │
│     • Reduces immediate regime pressure                 │
│     • Risk: Momentum may dissipate                      │
│                                                         │
│ [4] Focus on other priorities                           │
│     • Workers feel abandoned (-20 trust)                │
│     • Frees up time for other work                      │
│     • Opportunity lost permanently                      │
│                                                         │
│ ADVISOR VIEWS:                                          │
│ "The workers have real power. Use it." - Labor advisor  │
│ "Too soon. The regime will crush this." - Pragmatist    │
│                                                         │
│ HISTORICAL PARALLEL:                                    │
│ "Poland's Solidarity began as a workers' movement..."   │
│ [Learn more]                                            │
│                                                         │
│ [Decide]                                                │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 4: Advisor Input (Optional)

**Purpose:** Provide depth and multiple perspectives

Players can consult advisors before deciding:

```yaml
ADVISOR_SYSTEM:
  advisors:
    - type: strategic
      perspective: "What advances our goals?"
      style: analytical

    - type: ethical
      perspective: "What's right?"
      style: principled

    - type: pragmatic
      perspective: "What's actually achievable?"
      style: realistic

    - type: historical
      perspective: "What does history teach?"
      style: comparative

    - type: factional
      perspective: "What does our faction want?"
      style: partisan

  interaction:
    - Ask general question
    - Ask about specific option
    - Explore historical parallel
    - Request more information

  ai_integration:
    - Advisors can have dynamic conversations
    - Draw on historical database
    - Provide context-sensitive advice
    - Never make decision for player
```

**Advisor Dialogue Example:**

```
PLAYER: "What do you think about supporting the workers?"

STRATEGIC ADVISOR: "The workers have genuine leverage - the oil
sector especially. Supporting them could be our best path to
economic pressure on the regime. However, the regime knows this
too. They'll respond harshly. The question is: can the movement
survive the response?"

PLAYER: "Has this worked before?"

STRATEGIC ADVISOR: "Poland's Solidarity is the closest parallel.
Workers formed the backbone of change. But note: it took a decade
from Solidarity's formation to regime change. And they had the
Catholic Church as institutional backing. What's our equivalent?"

PLAYER: "What if we wait?"

STRATEGIC ADVISOR: "Moments pass. Workers who feel abandoned don't
wait around. The same applies to all movements - momentum is fragile.
But sometimes patience is strategic. It depends on your theory of
change. Do you believe in accumulating small wins, or waiting for
the decisive moment?"
```

---

### Phase 5: Resolution

**Purpose:** Show immediate consequences of decisions

```yaml
RESOLUTION:
  immediate_effects:
    - Faction trust changes
    - Resource expenditure
    - Position shifts
    - Relationship updates

  narrative_outcome:
    - What happened as a result
    - Short description of consequences
    - Seeds for future events

  hidden_effects:
    - Some consequences aren't shown immediately
    - "Your decision will have consequences you don't yet see"
    - Creates suspense and realism
```

**Resolution Display:**

```
══════════════════════════════════════════════════════════
OUTCOME: Meeting with Strike Leaders
══════════════════════════════════════════════════════════

You traveled to Isfahan in secret, meeting the strike
committee in a supporter's home. The workers were
cautiously hopeful - finally, someone from outside
taking their struggle seriously.

EFFECTS:
• Labor Movement trust: +15 [████████░░] 65
• Regime surveillance: +20 (you're being watched more closely)
• New contact: Hassan Kargar, oil worker leader

WHAT HAPPENS NEXT:
The strike continues. The regime is monitoring. Your
involvement may embolden the workers - or make them
targets. The next few weeks will be critical.

[Continue to faction updates]
```

---

### Phase 6: Faction Update

**Purpose:** Show how all factions are responding

Each turn, factions take their own actions:

```yaml
FACTION_UPDATE:
  for_each_faction:
    - Show significant moves
    - Explain faction logic (if player has intelligence)
    - Update relationships with player
    - Update inter-faction relationships

  presentation:
    - Brief summary for most factions
    - Detailed for player's allies and key enemies
    - Option to drill down for more

  hidden_information:
    - Some faction moves aren't visible
    - Intelligence operations can reveal more
    - Creates fog of war
```

**Faction Update Display:**

```
┌─────────────────────────────────────────────────────────┐
│ FACTION MOVEMENTS: Mehr 1404                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ REGIME FACTIONS:                                        │
│ ▪ IRGC: Increased presence in Isfahan (strike response)│
│ ▪ Judiciary: 3 labor activists arrested in Tehran      │
│ ▪ President: Called for "dialogue" (signal or trap?)   │
│                                                         │
│ OPPOSITION FACTIONS:                                    │
│ ▪ Monarchists: Issued statement supporting workers     │
│ ▪ Republicans: Internal debate about strike support    │
│ ▪ Kurdish parties: Watching, considering parallel action│
│                                                         │
│ CIVIL SOCIETY:                                          │
│ ▪ Student groups: Planning solidarity protests         │
│ ▪ Women's movement: Linking hijab to economic struggle │
│                                                         │
│ INTERNATIONAL:                                          │
│ ▪ US: "Monitoring situation" (standard non-response)   │
│ ▪ EU: Called for "restraint from all sides"            │
│                                                         │
│ [Detailed intelligence on specific faction]            │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 7: Score Update

**Purpose:** Track long-term flourishing changes

```yaml
SCORE_UPDATE:
  eudaimonia_changes:
    - Each dimension updated
    - Trend indicators (improving/stable/declining)
    - Regional breakdowns

  key_metrics:
    - Regime stability
    - Opposition strength
    - International situation
    - Economic indicators

  milestone_tracking:
    - Progress toward endings
    - Paths opening/closing
    - Warnings about trajectories
```

**Score Display:**

```
┌─────────────────────────────────────────────────────────┐
│ IRAN STATUS: Mehr 1404                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ FLOURISHING INDEX: 34 (-1 from last turn)              │
│ ▪ Material wellbeing:   32 ↓  (economic pressure)       │
│ ▪ Health/longevity:     55 →  (stable)                  │
│ ▪ Freedom/agency:       18 →  (stable)                  │
│ ▪ Security/order:       28 ↓  (strike instability)      │
│ ▪ Social cohesion:      38 ↑  (solidarity moment)       │
│ ▪ Cultural flourishing: 30 →  (stable)                  │
│ ▪ Sustainability:       25 ↓  (continued decline)       │
│                                                         │
│ REGIME STABILITY: 58 [██████░░░░] Stressed              │
│ OPPOSITION UNITY: 42 [████░░░░░░] Fragile               │
│ INTERNATIONAL PRESSURE: 55 [██████░░░░] Moderate        │
│                                                         │
│ TRAJECTORY: CONTESTED                                   │
│ Current path could lead to: Managed transition OR       │
│ prolonged stalemate OR regime crackdown                 │
│                                                         │
│ [Detailed analysis]                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Resource Management

### Player Resources

```yaml
PLAYER_RESOURCES:
  time:
    # Limited attention each turn
    - Major actions per turn: 2-4
    - Minor actions: unlimited
    - Crisis turns: forced focus

  influence:
    # Political capital
    - Spent on: Major decisions, faction management
    - Gained from: Success, allies, reputation
    - Lost from: Failure, broken promises

  money:
    # Financial resources
    - Varies by character
    - Used for: Organization, communication, survival

  networks:
    # Relationships and connections
    - Each contact is a resource
    - Can be spent (asking favors)
    - Must be maintained

  information:
    # Intelligence quality
    - Better info = better decisions
    - Costs resources to gather
    - Can be manipulated by enemies
```

### Resource Tradeoffs

Every action has opportunity cost:

```
This turn you can:
▪ Meet with strike leaders (takes 1 week)
  OR
▪ Travel abroad for international meetings (takes 2 weeks)
  OR
▪ Focus on coalition-building in Tehran (takes 1 week)
  OR
▪ Rest and recover from previous crisis (reduces stress)

You cannot do everything. Choose wisely.
```

---

## Pacing and Rhythm

### Normal Periods

- Turns pass smoothly
- Multiple events per turn
- Time for strategic thinking
- Relationship building

### Crisis Periods

- Time slows down
- Single decisions become turns
- High stakes, little margin
- Exhausting but critical

### Resolution Periods

- After major events
- Time for consequences to land
- Reflection opportunities
- New equilibrium forming

### The Rhythm

```
[Normal] → [Building tension] → [CRISIS] → [Resolution] → [New normal]

Example:
Turns 1-10: Building opposition coalition (Normal)
Turns 11-15: Regime crackdown begins (Tension)
Turn 16-20: Mass protests erupt (Crisis)
Turns 21-25: Negotiations or conflict (Resolution)
Turns 26+: New political landscape (New normal)
```

---

## Endings and Victory

### How Games End

```yaml
GAME_ENDINGS:
  types:
    - Political victory (your faction dominates)
    - Political defeat (your faction destroyed)
    - Compromise (negotiated settlement)
    - Chaos (civil war, fragmentation)
    - Status quo (nothing changed)

  timing:
    - Some endings come quickly (regime crushes opposition)
    - Some take decades (gradual reform)
    - Player death can end game (age, assassination)

  multiplicity:
    - Multiple endings possible from same position
    - Path matters as much as destination
    - Same outcome via different paths = different experience
```

### Victory Conditions

There is no single "win" condition. Instead:

```yaml
SUCCESS_MEASUREMENT:
  eudaimonia_score:
    - Did Iran flourish under your leadership/influence?
    - Compare to historical benchmarks
    - Compare to counterfactual (what if you'd done nothing?)

  faction_goals:
    - Did your faction achieve its objectives?
    - At what cost to other values?

  personal_goals:
    - Did your character achieve their goals?
    - Did they survive?
    - How are they remembered?

  moral_assessment:
    - What did you do along the way?
    - Did you stay true to your values?
    - What compromises did you make?
```

### The Final Assessment

```
══════════════════════════════════════════════════════════
GAME END: 1418 (2039)
══════════════════════════════════════════════════════════

After 14 years, your journey as Maryam Tehrani, labor
organizer turned political figure, has ended.

IRAN'S FATE:
The Islamic Republic fell in 1410, replaced by a federal
republic after three years of transitional government.
The path was not bloodless, but civil war was avoided.

YOUR LEGACY:
You are remembered as one of the architects of transition,
particularly for your role in securing labor support for
the general strike of 1408. Your insistence on economic
justice shaped the new constitution's labor provisions.

THE COST:
You spent 2 years in prison. Your brother was killed in
the 1407 protests. Your marriage did not survive your
activism. You now live quietly in Shiraz, watching the
new generation build what you fought for.

FLOURISHING INDEX:
• 1404 (start): 34
• 1418 (end):   61  [+27]
Iran is measurably better off, though far from perfect.

PATHS NOT TAKEN:
What if you had allied with the monarchists?
What if you had supported armed resistance?
What if you had accepted the regime's deal in 1406?

[Play again as different character]
[Explore alternative paths]
[View detailed history]
```

---

## Technical Implementation

### Turn Engine

```python
class Turn:
    def __init__(self, game_state, turn_number):
        self.state = game_state
        self.number = turn_number
        self.events = []
        self.decisions = []
        self.outcomes = []

    def execute(self):
        # Phase 1: Briefing
        briefing = self.generate_briefing()
        yield TurnPhase("briefing", briefing)

        # Phase 2: Events
        self.events = self.generate_events()
        for event in self.events:
            yield TurnPhase("event", event)

        # Phase 3: Decisions
        for event in self.events:
            if event.requires_decision:
                decision = yield TurnPhase("decision", event)
                self.decisions.append(decision)

        # Phase 4: Resolution
        for decision in self.decisions:
            outcome = self.resolve_decision(decision)
            self.outcomes.append(outcome)
            yield TurnPhase("resolution", outcome)

        # Phase 5: Faction Update
        faction_actions = self.process_faction_turns()
        yield TurnPhase("factions", faction_actions)

        # Phase 6: Score Update
        new_scores = self.update_scores()
        yield TurnPhase("scores", new_scores)

        # Update game state
        self.state.advance_turn(self.outcomes, faction_actions)
```

---

## Conclusion

The Core Game Loop is the heartbeat of IRAN 14XX. Each turn:
1. **Informs** the player about the world
2. **Challenges** them with events and decisions
3. **Supports** them with advisors and information
4. **Shows** consequences of their choices
5. **Evolves** the world based on all actions

Through hundreds of turns, players experience the texture of political change - the slow accumulation of small decisions, the sudden crises that reshape everything, the long arcs of history that transcend any individual.

**The loop teaches the core lesson:** Politics is not a single battle. It is an endless series of choices, each one shaping what comes next. There is no final victory, only the ongoing work of building a better future.

---

*Last updated: February 2026*
