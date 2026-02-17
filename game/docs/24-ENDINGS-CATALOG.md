# Endings Catalog: Iran's Possible Futures

## Philosophy of Endings

IRAN 14XX has no single "good ending." Every ending involves tradeoffs. The game refuses to tell players which future is "correct."

**Endings are measured by:**
- Eudaimonia scores (human flourishing)
- Stability and sustainability
- Justice and reconciliation
- Player's stated values vs. achieved outcomes

**Endings are NOT measured by:**
- Whether a specific system was achieved
- Whether player's faction "won"
- Whether player survived

A player might achieve democracy but leave Iran poorer. They might create stability through authoritarianism. They might die having planted seeds that bloom after them. All of these can be meaningful endings.

---

## Ending Categories

### Category 1: Democratic Transitions

#### 1A. Federal Democratic Republic

```yaml
ENDING: federal_democratic_republic
name: "The Third Republic"
category: democratic

description: |
  Iran has become a federal democratic republic. Power is shared between
  a central government and autonomous regions. The Kurds, Azeris, Baluchis,
  and Arabs have genuine self-governance while remaining part of Iran.

  Elections are contested. Power transfers peacefully. The constitution
  protects minorities and individual rights. It's not perfect - no democracy
  is - but it's functional.

conditions:
  required:
    - democratic_transition_achieved
    - federal_structure_established
    - ethnic_autonomy_agreed
    - constitutional_protections_enacted
  typical_path:
    - broad_opposition_coalition
    - regime_collapse_or_negotiated_transition
    - constitutional_convention
    - successful_first_elections

eudaimonia_typical:
  material: 55  # Initial disruption, then growth
  health: 60    # Maintained
  freedom: 75   # Major improvement
  security: 50  # Some instability
  cohesion: 55  # Ethnic tensions managed
  culture: 70   # Flourishing
  sustainability: 65  # Depends on economic choices

who_is_happy:
  - Most opposition factions
  - Ethnic minorities (if autonomy genuine)
  - International community
  - Civil society

who_is_unhappy:
  - Regime hardliners (prosecuted or marginalized)
  - Those who wanted monarchy
  - Those who wanted more radical change
  - Some victims (if reconciliation over justice)

challenges_remaining:
  - Economic recovery
  - Dealing with regime legacy
  - Preventing democratic backsliding
  - Balancing regional and central power

historical_parallels:
  - Spain post-Franco
  - Poland post-communism
  - South Africa post-apartheid

epilogue_tone: hopeful_with_complexity
```

#### 1B. Unitary Democratic Republic

```yaml
ENDING: unitary_democratic_republic
name: "The Secular Republic"
category: democratic

description: |
  Iran has become a unitary democratic republic. The country remains
  centralized, with a strong national identity and weak regional
  governments. Secularism is constitutionally mandated.

  This path was achieved without accommodating ethnic autonomy demands.
  The result is a functioning democracy, but one that faces ongoing
  challenges from ethnic minorities who feel their demands were ignored.

conditions:
  required:
    - democratic_transition_achieved
    - centralist_faction_dominant
    - ethnic_autonomy_rejected
  typical_path:
    - persian_dominated_coalition
    - rapid_transition_without_negotiation
    - strong_central_constitution

eudaimonia_typical:
  material: 60
  health: 60
  freedom: 70
  security: 45  # Ethnic tensions
  cohesion: 40  # Significant minority discontent
  culture: 65
  sustainability: 55  # Ongoing instability

challenges_remaining:
  - Kurdish insurgency possible
  - Azeri discontent
  - Baluchi conflict
  - Long-term stability uncertain

epilogue_tone: qualified_success
```

#### 1C. Constitutional Monarchy

```yaml
ENDING: constitutional_monarchy
name: "The Restored Kingdom"
category: democratic

description: |
  Iran has restored the monarchy under Reza Pahlavi, but with genuine
  constitutional limits. The Shah reigns but does not rule. Parliament
  holds real power. Elections are competitive.

  The Pahlavi name has been rehabilitated - not whitewashed, but
  contextualized. The country has chosen continuity with reform.

conditions:
  required:
    - reza_pahlavi_returns
    - monarchy_accepted_by_majority
    - constitutional_limits_genuine
    - republican_opposition_accommodated
  typical_path:
    - monarchist_coalition_includes_moderates
    - reza_accepts_limited_role
    - referendum_on_monarchy_passes
    - first_elections_under_monarchy_succeed

eudaimonia_typical:
  material: 60
  health: 60
  freedom: 65
  security: 55
  cohesion: 50  # Divided on monarchy question
  culture: 60
  sustainability: 60

who_is_happy:
  - Monarchists
  - Conservatives wanting stability
  - Those who value continuity
  - International business interests

who_is_unhappy:
  - Republicans (fundamentally)
  - Leftists
  - Some ethnic minorities
  - Those who associate monarchy with SAVAK

historical_parallels:
  - Spain (Juan Carlos)
  - UK (constitutional evolution)
  - Cambodia (restored monarchy, imperfect)

epilogue_tone: dignified_compromise
```

---

### Category 2: Authoritarian Outcomes

#### 2A. Reformed Islamic Republic

```yaml
ENDING: reformed_islamic_republic
name: "The Second Islamic Republic"
category: authoritarian_soft

description: |
  The Islamic Republic has reformed, but survives. Mandatory hijab is
  gone. Social freedoms have expanded. Elections are somewhat more
  competitive. But the fundamental structure remains: Supreme Leader,
  Guardian Council, IRGC.

  This is reform without revolution. The hardliners were sidelined, not
  removed. The system is lighter, but it's still the system.

conditions:
  required:
    - regime_survives
    - significant_reforms_enacted
    - opposition_partially_accommodated
  typical_path:
    - reform_faction_gains_power
    - supreme_leader_permits_change
    - gradual_liberalization
    - opposition_accepts_partial_victory

eudaimonia_typical:
  material: 50
  health: 60
  freedom: 45  # Improved but limited
  security: 60  # Stable
  cohesion: 50
  culture: 55
  sustainability: 50  # Can it last?

who_is_happy:
  - Pragmatic reformists
  - Those who feared chaos
  - Regime insiders who kept position
  - International actors wanting stability

who_is_unhappy:
  - Revolutionary opposition
  - Victims wanting justice
  - Those who wanted full freedom
  - Ethnic minorities (no autonomy)

challenges_remaining:
  - Is this sustainable or delaying inevitable?
  - Justice never served
  - Fundamental freedoms still limited
  - Next Supreme Leader might reverse

epilogue_tone: ambiguous_progress
```

#### 2B. Military Dictatorship

```yaml
ENDING: military_dictatorship
name: "The Generals' Republic"
category: authoritarian_hard

description: |
  The Islamic Republic has fallen, but what replaced it is military
  rule. The IRGC (or elements of it) have taken direct control.
  They promise stability and eventually democracy. They're lying.

  The theocratic facade is gone, but power remains concentrated.
  Repression continues under different branding.

conditions:
  required:
    - regime_collapses
    - military_fills_vacuum
    - civilian_opposition_too_weak
  typical_path:
    - chaotic_transition
    - irgc_coup_during_instability
    - civilian_politicians_marginalized
    - military_"temporary"_rule_becomes_permanent

eudaimonia_typical:
  material: 45
  health: 55
  freedom: 20  # Worse than reformed IR
  security: 55  # Order through force
  cohesion: 35
  culture: 40
  sustainability: 35  # Brittle

who_is_happy:
  - Military elite
  - Those who feared chaos most
  - Some business interests (stability)

who_is_unhappy:
  - Almost everyone else
  - This is widely seen as failure

historical_parallels:
  - Egypt post-Arab Spring
  - Algeria 1990s
  - Multiple Latin American examples

epilogue_tone: tragic_irony
```

#### 2C. New Theocracy

```yaml
ENDING: new_theocracy
name: "The Third Islamic Revolution"
category: authoritarian_hard

description: |
  The Islamic Republic has fallen - but so has its replacement. In
  the chaos, a new theocratic movement has taken power. They claim
  the old regime was too soft. They intend to build true Islamic
  governance.

  This is worse than what came before.

conditions:
  required:
    - regime_collapses
    - secular_opposition_fails
    - hardline_religious_faction_rises
  typical_path:
    - chaotic_civil_war
    - moderate_factions_destroy_each_other
    - zealot_faction_fills_vacuum
    - new_repression_worse_than_old

eudaimonia_typical:
  material: 30
  health: 40
  freedom: 10
  security: 35
  cohesion: 25
  culture: 20
  sustainability: 25

epilogue_tone: tragedy
```

---

### Category 3: Fragmentation

#### 3A. Controlled Dissolution

```yaml
ENDING: controlled_dissolution
name: "The Commonwealth of Iran"
category: fragmentation

description: |
  Iran no longer exists as a unified state. Instead, there is a
  loose confederation: Kurdistan, Azerbaijan, Persia proper, possibly
  others. They share some infrastructure and coordinate on defense,
  but each is effectively independent.

  This happened through negotiation, not war. It's partition, but
  peaceful partition.

conditions:
  required:
    - ethnic_tensions_unresolved
    - federal_solution_rejected
    - negotiated_separation_agreed
  typical_path:
    - ethnic_movements_gain_strength
    - central_government_too_weak
    - international_mediation
    - managed_divorce

eudaimonia_by_region:
  kurdistan:
    overall: 65  # Better than before
  azerbaijan:
    overall: 55  # Complicated
  persia:
    overall: 50  # Trauma of losing territory
  baluchistan:
    overall: 45  # Still poor

challenges:
  - Border disputes
  - Economic disentanglement
  - Minority populations in each region
  - International recognition

historical_parallels:
  - Czechoslovakia (velvet divorce)
  - USSR dissolution (partial parallel)
  - Yugoslav dissolution (negative example)

epilogue_tone: bittersweet_acceptance
```

#### 3B. Civil War and Collapse

```yaml
ENDING: civil_war_collapse
name: "The Long Night"
category: fragmentation

description: |
  Iran has descended into civil war. Multiple factions control
  different regions. Fighting is ongoing. Millions have fled.
  No end is in sight.

  This is the worst outcome. Everything the player tried to
  prevent has happened.

conditions:
  required:
    - violent_transition_path
    - no_faction_can_win
    - international_intervention_fails_or_worsens
  typical_path:
    - escalation_to_violence
    - regime_deploys_military
    - opposition_arms
    - regional_fragmentation
    - proxy_war_intervention
    - stalemate

eudaimonia_typical:
  material: 15
  health: 25
  freedom: 20  # Chaos is not freedom
  security: 10
  cohesion: 5
  culture: 15
  sustainability: 10

historical_parallels:
  - Syria
  - Libya
  - Yemen
  - Lebanon 1975-1990

epilogue_tone: devastating
```

---

### Category 4: Stalemate

#### 4A. Frozen Conflict

```yaml
ENDING: frozen_conflict
name: "The Endless Standoff"
category: stalemate

description: |
  Nothing has fundamentally changed. The regime survived but was
  weakened. The opposition survived but couldn't win. The country
  is frozen in low-level conflict and mutual exhaustion.

  This is what happens when no one wins and no one gives up.

conditions:
  required:
    - regime_weakened_but_survives
    - opposition_weakened_but_survives
    - neither_side_can_defeat_other
    - no_negotiated_resolution

eudaimonia_typical:
  material: 35
  health: 50
  freedom: 25
  security: 40
  cohesion: 30
  culture: 35
  sustainability: 30

player_feeling: frustration

epilogue_tone: exhausted_continuation
```

#### 4B. Regime Victory

```yaml
ENDING: regime_victory
name: "The Islamic Republic Endures"
category: stalemate

description: |
  The regime has won. The opposition has been crushed. The protests
  are over. The exiles remain in exile. The prisoners remain in
  prison. Nothing has changed.

  The player's efforts, whatever they were, failed.

conditions:
  required:
    - opposition_crushed
    - regime_maintains_control
    - international_pressure_insufficient
  typical_path:
    - uprising_attempt
    - brutal_crackdown
    - opposition_scattered
    - return_to_status_quo

eudaimonia_typical:
  same_as_before: true
  maybe_worse:
    - freedom: -10 (crackdown aftermath)
    - cohesion: -15 (trauma)

player_feeling: defeat

epilogue_tone: bleak_but_seeds_planted
```

---

### Category 5: Personal Endings

These overlay the political endings - what happens to the player character.

#### 5A. Triumph

```yaml
PERSONAL_ENDING: triumph
description: |
  You lived to see change. You played a significant role. History
  will remember you as one of the architects of a new Iran.
conditions:
  - survived
  - faction_achieved_goals
  - personal_contribution_significant
```

#### 5B. Pyrrhic Victory

```yaml
PERSONAL_ENDING: pyrrhic_victory
description: |
  You achieved what you fought for, but at immense personal cost.
  Your health is broken. Your family is scattered. You're not
  sure it was worth it. But it's done.
conditions:
  - survived
  - goals_achieved
  - high_personal_cost
```

#### 5C. Martyrdom

```yaml
PERSONAL_ENDING: martyrdom
description: |
  You didn't survive. But your death mattered. It sparked something.
  Others carried forward what you started. You became a symbol.
conditions:
  - died
  - death_was_meaningful
  - movement_continued
```

#### 5D. Survival

```yaml
PERSONAL_ENDING: survival
description: |
  You survived. That's more than many can say. Whether Iran changed
  or not, you're still here. You have decades ahead. Maybe you'll
  try again. Maybe you'll rest.
conditions:
  - survived
  - goals_partially_achieved_or_failed
```

#### 5E. Exile

```yaml
PERSONAL_ENDING: exile
description: |
  You fled. You're alive, somewhere else, watching Iran from
  a distance. You couldn't change it from inside. Maybe you can
  still contribute from outside. Maybe you've given up.
conditions:
  - fled_iran
  - not_returned
```

#### 5F. Imprisonment

```yaml
PERSONAL_ENDING: imprisonment
description: |
  You were caught. You're in Evin, or somewhere worse. The game
  ends, but your story continues in captivity. Others are
  working for your release. Or they've forgotten.
conditions:
  - arrested
  - not_released
```

---

## Ending Evaluation

### The Final Assessment Screen

```
══════════════════════════════════════════════════════════
IRAN: 1418 (2039)
14 years have passed.
══════════════════════════════════════════════════════════

POLITICAL OUTCOME: Federal Democratic Republic
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Iran is now a federal democracy. The Islamic Republic fell
in 1410 after mass protests and IRGC divisions. A transitional
government gave way to elections in 1412.

The constitution protects minorities, guarantees freedoms,
and establishes autonomous regions. It's not perfect - politics
never is - but it's functional.

YOUR ROLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

As Nasrin Mohammadi, you were one of the architects of change.
Your years in prison became a rallying point. Your insistence
on non-violence shaped the movement's character. Your willingness
to include former regime pragmatists in negotiations made the
transition possible.

You now serve as a member of parliament, still fighting for
human rights, still pushing for more change.

FLOURISHING ASSESSMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    BEFORE    NOW    CHANGE
Material wellbeing    34      58      +24
Health/longevity      55      62      +7
Freedom/agency        18      72      +54
Security/order        28      52      +24
Social cohesion       38      48      +10
Cultural flourishing  30      65      +35
Sustainability        25      58      +33

COMPOSITE SCORE:      32      59      +27

Iran is measurably better off. But challenges remain.

THE COST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 4,782 people died during the transition (your estimate)
• Thousands more were imprisoned, many still not released
• The economy took years to recover
• Some of your allies were compromised along the way
• Your brother was killed in 1408; you carry that weight

WHAT MIGHT HAVE BEEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In other timelines, Iran followed different paths:
• Armed revolution led to civil war (you prevented this)
• Negotiated transition kept regime structures (you rejected this)
• Kurdish independence fractured the country (you managed this)
• Your death became martyrdom (you survived instead)

YOU MIGHT EXPLORE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Play as IRGC General - understand why regime fought so hard]
[Play as Reza Pahlavi - the monarchist path you rejected]
[Play as Supreme Leader - could reform have worked from within?]
[Replay as yourself - make different choices]

FINAL REFLECTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"The revolution is never complete. Each generation inherits
the unfinished work of those before. We did what we could.
The rest is for those who come after."

- From your memoir, published 1416

[Credits]  [New Game]  [Explore History]
```

---

## Ending Triggers and Tracking

### How Endings Are Determined

```python
class EndingEvaluator:
    """
    Determines which ending the game reaches.
    """

    def evaluate(self, state):
        """
        Evaluate current state and determine ending if reached.
        """
        # Check for immediate endings (game-ending events)
        for ending in self.immediate_endings:
            if ending.conditions_met(state):
                return ending

        # Check if game has reached natural end (time limit)
        if state.turn >= state.max_turns:
            return self.determine_natural_ending(state)

        # Check for early endings (player death, etc.)
        if self.player_eliminated(state):
            return self.determine_player_ending(state)

        return None  # Game continues

    def determine_natural_ending(self, state):
        """
        Determine ending based on final state.
        """
        # Score each possible ending
        scores = {}
        for ending in self.all_endings:
            scores[ending] = ending.calculate_fit(state)

        # Choose best fitting ending
        best_ending = max(scores, key=scores.get)

        # Add personal ending overlay
        personal = self.determine_personal_ending(state)

        return CombinedEnding(political=best_ending, personal=personal)
```

### Ending Conditions Schema

```yaml
ENDING_CONDITIONS:
  federal_democratic_republic:
    required:
      - state.regime_collapsed == True
      - state.civil_war == False
      - state.democratic_institutions >= 70
      - state.federal_structure >= 60
      - state.ethnic_autonomy >= 50
    score_modifiers:
      - stability * 0.3
      - freedom_score * 0.3
      - ethnic_satisfaction * 0.2
      - international_recognition * 0.2

  civil_war_collapse:
    required:
      - state.violence_level >= 80
      - state.faction_control_fragmented == True
      - state.central_authority < 20
    score_modifiers:
      - negative_stability * 0.5
      - death_toll * 0.3
      - refugee_crisis * 0.2
```

---

## Conclusion

IRAN 14XX has many endings because Iran has many possible futures. No ending is declared "correct" by the game. Instead, each is presented with:

1. **What happened** - The political outcome
2. **What it cost** - The human price
3. **What might have been** - Alternative paths
4. **What it means** - Reflection on tradeoffs

Players should finish the game not with certainty about what Iran "should" become, but with deeper understanding of why different futures are attractive to different people, and what each would require.

The best ending is the one the player chose consciously, understanding the costs.

---

*Last updated: February 2026*
