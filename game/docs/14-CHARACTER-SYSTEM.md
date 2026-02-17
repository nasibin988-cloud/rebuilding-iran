# Character System: Playable Perspectives

## Philosophy

Every playable character offers a fundamentally different experience. Playing as Khamenei is not the same game as playing as a student activist. The world is the same; the perspective, resources, constraints, and goals are entirely different.

**The educational purpose:** By playing multiple characters, players understand:
- Why different actors behave as they do
- How the same events look from different positions
- That rationality depends on information and values
- That their political opponents are also humans making difficult choices

---

## Character Categories

### Category 1: Regime Insiders

**The experience:** Managing a system, facing reform dilemmas, balancing factions, confronting your own legacy.

```yaml
REGIME_INSIDER_CHARACTERS:
  supreme_leader:
    name: "Ali Khamenei" (or successor)
    starting_position: Apex of power
    core_experience: "The burden of absolute power"
    unique_mechanics:
      - Faction balancing (hardliners vs. pragmatists)
      - Succession planning
      - Legacy management
      - Information filtered through yes-men
    what_player_learns:
      - Why authoritarian reform is so hard
      - The regime's internal logic
      - How information distortion affects decisions

  irgc_general:
    name: "General Hossein Ahmadi" (fictional composite)
    starting_position: Military elite
    core_experience: "The warrior's dilemma"
    unique_mechanics:
      - Military operations
      - Economic empire management
      - Loyalty vs. self-interest
      - Generational conflict within IRGC
    what_player_learns:
      - Why security forces defend regimes
      - How military organizations think
      - The path from idealist to protector of system

  regime_son:
    name: "Mojtaba Khamenei" (or equivalent)
    starting_position: Elite by birth
    core_experience: "The inheritance question"
    unique_mechanics:
      - Navigating father's shadow
      - Managing expectations
      - Building independent power base
      - Deciding what you actually want
    what_player_learns:
      - Second generation psychology
      - Trap of inherited position
      - Possibility of elite defection

  pragmatic_insider:
    name: "Mohammad Karimi" (fictional reformist)
    starting_position: Inside but doubting
    core_experience: "The trapped reformer"
    unique_mechanics:
      - Working within constraints
      - Building gradual change
      - Managing regime suspicion and opposition distrust
      - The defection decision
    what_player_learns:
      - Why people stay in bad systems
      - How incremental change works (or fails)
      - The cost of leaving vs. staying
```

### Category 2: Opposition Leaders

**The experience:** Building movements, managing coalitions, risking everything, confronting difficult choices about means and ends.

```yaml
OPPOSITION_LEADER_CHARACTERS:
  crown_prince:
    name: "Reza Pahlavi"
    starting_position: Famous exile
    core_experience: "The man without a country"
    unique_mechanics:
      - International relations
      - Managing diaspora expectations
      - Coalition building across ideologies
      - Monarchy question (full restoration vs. symbolic vs. renounce)
    what_player_learns:
      - Diaspora politics
      - The burden of a name
      - Why opposition unity is so hard

  activist_leader:
    name: "Nasrin Sotoudeh" (or fictional equivalent)
    starting_position: Inside Iran, targeted
    core_experience: "The voice that won't be silenced"
    unique_mechanics:
      - Operating under surveillance
      - Prison sequences
      - Building civil society
      - International attention
    what_player_learns:
      - What activism actually costs
      - How civil society builds power
      - The personal price of resistance

  labor_organizer:
    name: "Hassan Kargar" (fictional)
    starting_position: Working class, organizing
    core_experience: "The power of the workers"
    unique_mechanics:
      - Union building (illegal)
      - Strike organization
      - Navigating political factions
      - Economic demands vs. political transformation
    what_player_learns:
      - Labor movement dynamics
      - Class dimensions of change
      - How economic power translates to political power

  ethnic_leader:
    name: "Kamran Hosseini" (fictional Kurdish leader)
    starting_position: Ethnic minority perspective
    core_experience: "A people within a people"
    unique_mechanics:
      - Balancing autonomy demands with coalition building
      - Managing armed vs. peaceful factions
      - International connections
      - The independence question
    what_player_learns:
      - Ethnic minority experience
      - Why federalism/autonomy matters
      - The Kurdish (and ethnic) question's centrality
```

### Category 3: The Nobody

**The experience:** Starting from zero, building influence, becoming significant (or not).

```yaml
NOBODY_CHARACTERS:
  young_activist:
    name: "Yasaman Rostami" (fictional)
    starting_position: Nobody, just angry
    core_experience: "Finding your voice"
    unique_mechanics:
      - Building from nothing
      - First arrests, first victories
      - Network building
      - Rapid radicalization or gradual growth
    what_player_learns:
      - How movements form
      - The path from normal person to activist
      - What motivates Generation Z

  diaspora_youth:
    name: "Sara Yazdi" (fictional)
    starting_position: Born outside Iran
    core_experience: "Finding your Iran"
    unique_mechanics:
      - Identity discovery
      - Diaspora activism
      - Connecting to homeland
      - The return question
    what_player_learns:
      - Diaspora psychology
      - Second generation identity
      - Distance and connection

  bazaari_merchant:
    name: "Hossein Karimi" (fictional)
    starting_position: Small business owner
    core_experience: "The economy is political"
    unique_mechanics:
      - Economic survival
      - Gradual politicization
      - Bazaar networks
      - Strike decision
    what_player_learns:
      - Economic dimension of politics
      - Middle class politics
      - How apolitical people become political

  religious_student:
    name: "Mohammad Abbasi" (fictional)
    starting_position: Seminary student
    core_experience: "Faith meets power"
    unique_mechanics:
      - Religious questioning
      - Navigate between quietism and politics
      - Reform or defend?
      - The religious legitimacy battle
    what_player_learns:
      - Religious dimensions of politics
      - Not all clergy support regime
      - Islamic reform possibilities
```

---

## Character Attributes

### Core Attributes

Every character has:

```yaml
CHARACTER_ATTRIBUTES:
  # Identity
  identity:
    name: string
    age: number
    gender: male | female | other
    ethnicity: persian | azeri | kurd | arab | baluch | other
    religion: shia | sunni | secular | other
    class: upper | middle | working | poor
    location: tehran | provincial_city | rural | diaspora

  # Position
  position:
    institutional_role: string or null
    faction_affiliations: list[Faction]
    public_profile: 0-100  # How well-known
    regime_attention: 0-100  # How much they're watching

  # Resources
  resources:
    money: number
    networks: list[Contact]
    information_quality: 0-100
    time_availability: number (actions per turn)

  # Personal
  personal:
    health: 0-100
    stress: 0-100
    family_status: list[Relationship]
    outside_iran_escape: boolean
```

### Character-Specific Mechanics

Each character has unique mechanics:

```yaml
SUPREME_LEADER_MECHANICS:
  succession_planning:
    # Must groom successor
    candidates: list[Character]
    candidate_loyalty: 0-100
    candidate_capability: 0-100
    time_pressure: increases with age

  faction_balance:
    # Must keep factions from fighting
    hardliner_satisfaction: 0-100
    pragmatist_satisfaction: 0-100
    balance_needed: true

  information_bubble:
    # Doesn't get accurate information
    information_accuracy: 30-60%
    yes_men_factor: high
    special_action: "Seek ground truth" (costly)

ACTIVIST_MECHANICS:
  arrest_risk:
    # Every action risks arrest
    visibility: 0-100
    regime_attention: 0-100
    arrest_probability: f(visibility, attention)

  prison_sequences:
    # If arrested, playable prison experience
    interrogation: mini-game
    cell_relationships: characters
    release_negotiations: events

  network_building:
    # Must build support from scratch
    trusted_contacts: list
    recruitment_actions: available
    betrayal_risk: always present
```

---

## Starting Positions

### Supreme Leader Start

```yaml
KHAMENEI_START:
  year: 1404 (2025)
  age: Late 80s
  health: Declining

  power:
    institutional: 95  # Highest possible
    military_loyalty: 80
    clerical_legitimacy: 60 (declining)
    popular_support: 25 (low)

  challenges:
    - Succession unclear
    - Economy failing
    - Youth alienated
    - Reformist faction crushed but resentful
    - IRGC increasingly autonomous
    - International isolation

  immediate_decisions:
    - Successor choice: Mojtaba? Raisi successor? Council?
    - Response to protests: Crush or accommodate?
    - Nuclear question: Deal or resist?
    - Economic reform: Risk or stagnate?

  unique_dilemma:
    - Reform threatens your power base
    - Stagnation guarantees eventual collapse
    - You might not live to see consequences
    - Your legacy is being written now
```

### Activist Start

```yaml
ACTIVIST_START:
  year: 1404 (2025)
  age: Early 20s
  location: Tehran

  power:
    institutional: 0
    networks: 5 (minimal)
    public_profile: 5
    resources: 10 (broke)

  advantages:
    - Nothing to lose
    - Connected to generation
    - Not yet known to regime
    - Energy and commitment

  challenges:
    - No resources
    - No protection
    - Family at risk
    - No clear path forward

  immediate_decisions:
    - Join existing group or build own?
    - How public to be?
    - Risk family or protect them?
    - Violence or nonviolence?

  unique_dilemma:
    - You have moral clarity but no power
    - Power requires compromise
    - How do you gain power without becoming what you fight?
```

---

## Character Progression

### How Characters Grow

```yaml
PROGRESSION_PATHS:
  power_accumulation:
    - Each success increases influence
    - Networks expand through action
    - Reputation builds over time
    - Resources grow (or deplete)

  skill_development:
    - Learn from experience
    - Better decisions with practice
    - Unlock new action types
    - Develop specializations

  relationship_evolution:
    - Trust builds slowly
    - Betrayal has permanent effects
    - Some relationships unlock opportunities
    - Others create obligations

  psychological_change:
    - Trauma affects character
    - Success can corrupt
    - Failure can strengthen
    - Character arc emerges from choices
```

### Character Arc Examples

```yaml
ACTIVIST_ARC_EXAMPLE:
  year_1:
    - Nobody with nothing
    - First protest, first fear
    - First network connections
    - First arrest (possibly)

  year_5:
    - Known figure in movement
    - Leadership responsibilities
    - Difficult coalition choices
    - Personal costs mounting

  year_10:
    - Elder of movement (if survived)
    - Younger generation challenging
    - Compromise or maintain purity?
    - Transition role possibilities

SUPREME_LEADER_ARC_EXAMPLE:
  year_1:
    - Peak of power, declining health
    - Succession pressure
    - Economic crisis
    - Reform or repress?

  year_5:
    - (If survived) Consequences of choices
    - Successor positioned (or chaos)
    - System stable or crumbling
    - Legacy crystallizing

  end:
    - Death (inevitable at this age)
    - Game continues as successor
    - Or: Country transforms around you
    - How are you remembered?
```

---

## Character Selection

### Selection Interface

```
══════════════════════════════════════════════════════════
CHOOSE YOUR PATH
══════════════════════════════════════════════════════════

WHO DO YOU WANT TO UNDERSTAND?

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ THE SYSTEM      │ │ THE OPPOSITION  │ │ THE PEOPLE      │
│                 │ │                 │ │                 │
│ Play as those   │ │ Play as those   │ │ Play as those   │
│ who hold power  │ │ fighting power  │ │ caught between  │
│                 │ │                 │ │                 │
│ [View options]  │ │ [View options]  │ │ [View options]  │
└─────────────────┘ └─────────────────┘ └─────────────────┘

First playthrough recommended: Opposition figure
For challenge: Start as nobody
For perspective shift: Play opposite of your sympathies
```

### Character Detail View

```
┌─────────────────────────────────────────────────────────┐
│ SUPREME LEADER: Ali Khamenei                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Portrait]                                              │
│                                                         │
│ "I have held this nation together for 35 years.        │
│ The revolution is my life's work. I will not see       │
│ it destroyed - by enemies or by my own failures."      │
│                                                         │
│ EXPERIENCE LEVEL: ████████░░ Advanced                   │
│ Recommended for players who have completed at least    │
│ one opposition playthrough.                             │
│                                                         │
│ WHAT YOU'LL LEARN:                                      │
│ • Why authoritarian leaders resist reform               │
│ • How information bubbles distort decisions             │
│ • The burden of absolute power                          │
│ • Why succession is so dangerous                        │
│                                                         │
│ STARTING POSITION:                                      │
│ • Maximum institutional power                           │
│ • Declining health (time pressure)                      │
│ • Economy in crisis                                     │
│ • Youth completely alienated                            │
│ • No clear successor                                    │
│                                                         │
│ UNIQUE MECHANICS:                                       │
│ • Faction balancing                                     │
│ • Succession planning                                   │
│ • Information uncertainty                               │
│ • Legacy calculation                                    │
│                                                         │
│ [Select this character]  [Back to selection]            │
└─────────────────────────────────────────────────────────┘
```

---

## Cross-Character Features

### Meeting Yourself

When playing as Character A, Character B (a potential playable character) appears as an NPC. This creates:
- Recognition from previous playthroughs
- Deeper understanding of interactions
- "Oh, THAT's why they did that"

```yaml
CROSS_CHARACTER_MOMENTS:
  example:
    playing_as: Supreme Leader
    encounter: Student activist
    player_thought: "I played as someone like her. I know why she's doing this."
    design_goal: Empathy through perspective shift
```

### Unlockable Characters

Some characters unlock after completing others:

```yaml
CHARACTER_UNLOCKS:
  base_characters:
    - Activist (recommended first)
    - Crown Prince
    - IRGC General

  unlocked_after_regime_playthrough:
    - Supreme Leader
    - Mojtaba Khamenei

  unlocked_after_opposition_playthrough:
    - Regime pragmatist
    - Labor organizer

  unlocked_after_ethnic_content:
    - Kurdish leader
    - Azeri activist
    - Baluch fighter

  special_unlocks:
    - "The Nobody" (after any full playthrough)
    - Historical characters (after understanding present)
```

---

## Technical Implementation

### Character Data Model

```python
@dataclass
class PlayableCharacter:
    # Identity
    id: str
    name: str
    type: CharacterType
    portrait: str  # Asset path

    # Starting state
    starting_position: Position
    starting_resources: Resources
    starting_relationships: dict[str, Relationship]

    # Unique mechanics
    special_mechanics: list[Mechanic]
    unique_actions: list[Action]
    unique_events: list[EventTrigger]

    # Narrative
    backstory: str
    voice: VoiceProfile  # For dialogue generation
    arc_possibilities: list[ArcTemplate]

    # Meta
    difficulty: int
    unlock_requirements: list[Requirement]
    recommended_experience: str
```

### Character Selection Flow

```python
def character_selection(player_profile):
    # Get available characters
    available = get_unlocked_characters(player_profile)

    # Generate recommendations
    recommendations = generate_recommendations(
        player_profile.previous_playthroughs,
        player_profile.preferences
    )

    # Present selection
    selected = present_selection(available, recommendations)

    # Initialize game with character
    game_state = initialize_game(selected)

    return game_state
```

---

## Conclusion

The Character System is the heart of IRAN 14XX's perspectival approach. By making every major actor playable, the game teaches that:

- **Everyone has reasons** - Even the people you hate have comprehensible motivations
- **Position shapes perception** - The same event looks different from different places
- **Power comes with constraints** - Having power doesn't mean having freedom
- **Change requires understanding** - You cannot defeat what you do not understand

Through multiple playthroughs as different characters, players don't just learn about Iran. They learn about politics itself - the eternal dance of power, interest, ideology, and human frailty.

---

*Last updated: February 2026*
