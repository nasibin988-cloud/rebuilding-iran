# The Eudaimonia System: Measuring What Matters

## Philosophy

**The goal of governance is not democracy. It is human flourishing.**

Democracy is often the best path to flourishing. But:
- A chaotic democracy that produces misery is a failure
- A stable authoritarianism that produces flourishing is... complicated
- History offers examples of both

The game doesn't tell players what to value. It measures flourishing across multiple dimensions and lets players discover the tradeoffs themselves.

**The uncomfortable truth this game teaches:** You can have high freedom and low security. High material wealth and low social cohesion. A democracy that collapses into civil war. A dictatorship that raises living standards. The world is not simple.

---

## The Seven Dimensions of Flourishing

### Overview

```yaml
EUDAIMONIA_INDEX:
  dimensions:
    - material_wellbeing     # Can people eat, work, have homes?
    - health_longevity       # Do people live long, healthy lives?
    - freedom_agency         # Can people speak, worship, associate, love?
    - security_order         # Are people safe from violence and arbitrary power?
    - social_cohesion        # Do people trust each other? Is society unified?
    - cultural_flourishing   # Do arts, education, identity thrive?
    - sustainability         # Will this last? Or is it mortgaging the future?

  composite_score:
    calculation: weighted_average(dimensions)
    range: 0-100
    weights: player_chosen  # Players set their own weights

  historical_comparison:
    pahlavi_era: ~45
    islamic_republic_peak: ~55
    islamic_republic_2025: ~35
    regional_comparison: varies
```

### 1. Material Wellbeing

**What it measures:** Can people meet their material needs?

```yaml
MATERIAL_WELLBEING:
  components:
    gdp_per_capita:
      weight: 0.25
      current_iran: ~$4,000 (official) to ~$12,000 (PPP)
      benchmark_poor: <$2,000
      benchmark_good: >$20,000

    poverty_rate:
      weight: 0.25
      current_iran: ~25-40% (estimates vary)
      benchmark_poor: >50%
      benchmark_good: <10%

    unemployment:
      weight: 0.20
      current_iran: ~10-15% (official), ~25% (real)
      benchmark_poor: >30%
      benchmark_good: <8%

    inequality_gini:
      weight: 0.15
      current_iran: ~0.40-0.45
      benchmark_poor: >0.50
      benchmark_good: <0.30

    inflation_stability:
      weight: 0.15
      current_iran: ~40-50% annual
      benchmark_poor: >100%
      benchmark_good: <5%

  calculation: weighted_average(components)
  range: 0-100
```

**Gameplay dynamics:**
- Sanctions reduce material wellbeing
- Economic reforms take time to show results
- Rapid changes can cause short-term disruption
- Corruption siphons off gains
- Oil dependence creates volatility

---

### 2. Health and Longevity

**What it measures:** Do people live long, healthy lives?

```yaml
HEALTH_LONGEVITY:
  components:
    life_expectancy:
      weight: 0.30
      current_iran: ~77 years
      benchmark_poor: <65
      benchmark_good: >80

    infant_mortality:
      weight: 0.20
      current_iran: ~12 per 1000
      benchmark_poor: >50
      benchmark_good: <5

    healthcare_access:
      weight: 0.25
      current_iran: Medium (good in cities, poor in rural)
      benchmark_poor: Very limited
      benchmark_good: Universal quality care

    mental_health:
      weight: 0.15
      current_iran: Poor (high depression/anxiety)
      note: Often neglected in metrics

    environmental_health:
      weight: 0.10
      current_iran: Deteriorating (air, water)
      note: Long-term impact

  calculation: weighted_average(components)
  range: 0-100
```

**Gameplay dynamics:**
- Healthcare systems take time to build
- Environmental damage has delayed effects
- War/conflict destroys health infrastructure
- Mental health affected by political conditions
- Brain drain affects medical capacity

---

### 3. Freedom and Agency

**What it measures:** Can people live as they choose?

```yaml
FREEDOM_AGENCY:
  components:
    political_freedom:
      weight: 0.25
      aspects:
        - Free and fair elections
        - Right to organize politically
        - Press freedom
        - Opposition permitted
      current_iran: Very low

    civil_liberties:
      weight: 0.25
      aspects:
        - Freedom of speech
        - Freedom of assembly
        - Freedom of religion
        - Right to privacy
      current_iran: Very low

    personal_freedom:
      weight: 0.20
      aspects:
        - Dress and appearance choices
        - Romantic and sexual choices
        - Movement freedom
        - Lifestyle choices
      current_iran: Low (gender-specific)

    economic_freedom:
      weight: 0.15
      aspects:
        - Property rights
        - Business freedom
        - Labor rights
        - Contract enforcement
      current_iran: Medium-low

    judicial_independence:
      weight: 0.15
      aspects:
        - Fair trials
        - Due process
        - Protection from arbitrary detention
        - Equal treatment under law
      current_iran: Very low

  calculation: weighted_average(components)
  range: 0-100
```

**Gameplay dynamics:**
- Freedom can be expanded or contracted quickly
- But expanding freedom may reduce stability short-term
- Different freedoms can conflict (religious freedom vs. gender equality)
- Freedom without security is chaos
- Authoritarian efficiency vs. democratic freedom: a real tradeoff

---

### 4. Security and Order

**What it measures:** Are people safe?

```yaml
SECURITY_ORDER:
  components:
    personal_safety:
      weight: 0.25
      aspects:
        - Crime rates
        - Violence rates
        - Safety for women
        - Safety at night/public spaces
      current_iran: Medium (varies by area)

    state_violence:
      weight: 0.25
      aspects:
        - Torture
        - Extrajudicial killing
        - Mass imprisonment
        - Collective punishment
      current_iran: High (negative scoring)
      note: This SUBTRACTS from security

    protection_from_external_threats:
      weight: 0.20
      aspects:
        - Invasion risk
        - Foreign interference
        - Border security
        - Defense capacity
      current_iran: Medium

    rule_of_law:
      weight: 0.15
      aspects:
        - Laws applied consistently
        - Corruption controlled
        - Property protected
        - Contracts enforced
      current_iran: Low

    stability_predictability:
      weight: 0.15
      aspects:
        - Political stability
        - Economic predictability
        - Social order
        - Transition risk
      current_iran: Low-medium

  calculation: weighted_average(components) - state_violence_penalty
  range: 0-100
```

**The security paradox:**
- The regime claims to provide security
- But the regime IS a major source of insecurity (state violence)
- The game explicitly scores state violence as NEGATIVE security
- A free society with some crime may be MORE secure than a police state

**Gameplay dynamics:**
- Rapid political change often reduces stability temporarily
- Security apparatus can be repurposed or disbanded
- Transitional periods are vulnerable to violence
- Different security philosophies have different tradeoffs

---

### 5. Social Cohesion

**What it measures:** Is society unified? Do people trust each other?

```yaml
SOCIAL_COHESION:
  components:
    interpersonal_trust:
      weight: 0.25
      aspects:
        - Trust between strangers
        - Trust within communities
        - Business trust
        - Social capital
      current_iran: Low (declining)

    ethnic_harmony:
      weight: 0.20
      aspects:
        - Inter-ethnic relations
        - Minority integration
        - Ethnic violence (negative)
        - Shared national identity
      current_iran: Strained

    class_relations:
      weight: 0.15
      aspects:
        - Elite-mass relations
        - Economic resentment levels
        - Social mobility
        - Sense of fairness
      current_iran: Poor

    religious_harmony:
      weight: 0.15
      aspects:
        - Sect relations
        - Religious-secular relations
        - Religious coercion (negative)
        - Freedom within religion
      current_iran: Poor

    family_community:
      weight: 0.15
      aspects:
        - Family cohesion
        - Community bonds
        - Intergenerational relations
        - Support networks
      current_iran: Medium (family strong, community varies)

    trauma_healing:
      weight: 0.10
      aspects:
        - Historical trauma addressed
        - Reconciliation processes
        - Memory and justice
        - Forward-looking consensus
      current_iran: Very low

  calculation: weighted_average(components)
  range: 0-100
```

**Gameplay dynamics:**
- Social cohesion takes decades to build
- Can be destroyed quickly by conflict
- Transitional justice affects healing
- Ethnic/religious policies have long-term effects
- Economic inequality strains cohesion

---

### 6. Cultural Flourishing

**What it measures:** Do arts, education, and identity thrive?

```yaml
CULTURAL_FLOURISHING:
  components:
    education_quality:
      weight: 0.25
      aspects:
        - Literacy rates
        - Education access
        - Educational quality
        - Critical thinking
        - Academic freedom
      current_iran: Medium (access good, quality/freedom poor)

    artistic_expression:
      weight: 0.20
      aspects:
        - Arts freedom
        - Cultural production
        - Film, music, literature
        - International recognition
      current_iran: Heavily restricted

    cultural_identity:
      weight: 0.20
      aspects:
        - Persian heritage maintained
        - Minority cultures respected
        - Historical connection
        - Future orientation
      current_iran: Contested

    media_information:
      weight: 0.20
      aspects:
        - Press freedom
        - Information access
        - Media diversity
        - Truth-telling capacity
      current_iran: Very low

    innovation_creativity:
      weight: 0.15
      aspects:
        - Scientific research
        - Entrepreneurship
        - Patents/discoveries
        - Brain drain (negative)
      current_iran: Declining (brain drain)

  calculation: weighted_average(components)
  range: 0-100
```

**Gameplay dynamics:**
- Cultural restrictions are immediately changeable
- But rebuilding cultural institutions takes time
- Brain drain is hard to reverse
- Education reform takes a generation
- Cultural liberation can cause backlash

---

### 7. Sustainability

**What it measures:** Will this last?

```yaml
SUSTAINABILITY:
  components:
    environmental:
      weight: 0.25
      aspects:
        - Water security (CRITICAL for Iran)
        - Air quality
        - Ecosystem health
        - Climate adaptation
      current_iran: Deteriorating rapidly

    economic:
      weight: 0.25
      aspects:
        - Oil dependence (negative)
        - Diversification
        - Debt levels
        - Investment rates
      current_iran: Poor

    demographic:
      weight: 0.20
      aspects:
        - Population structure
        - Fertility rates
        - Brain drain (negative)
        - Dependency ratio
      current_iran: Challenging (low birth rate, emigration)

    institutional:
      weight: 0.15
      aspects:
        - Government capacity
        - Rule of law
        - Corruption levels (negative)
        - State legitimacy
      current_iran: Declining

    political:
      weight: 0.15
      aspects:
        - Regime stability
        - Succession clarity
        - Elite cohesion
        - Popular legitimacy
      current_iran: Fragile

  calculation: weighted_average(components)
  range: 0-100
```

**Gameplay dynamics:**
- Sustainability problems are often invisible until crisis
- Environmental damage is hardest to reverse
- Brain drain effects compound over time
- Institutional building is slow
- Short-term gains may mortgage long-term flourishing

---

## Composite Scoring

### The Flourishing Index

```python
def calculate_flourishing_index(state, weights):
    """
    Calculate overall flourishing score.
    Weights are player-determined or default.
    """
    dimensions = {
        'material': calculate_material_wellbeing(state),
        'health': calculate_health_longevity(state),
        'freedom': calculate_freedom_agency(state),
        'security': calculate_security_order(state),
        'cohesion': calculate_social_cohesion(state),
        'culture': calculate_cultural_flourishing(state),
        'sustainability': calculate_sustainability(state)
    }

    # Player-determined weights (or default equal)
    if weights is None:
        weights = {k: 1/7 for k in dimensions.keys()}

    score = sum(
        dimensions[k] * weights[k]
        for k in dimensions.keys()
    )

    return {
        'composite': score,
        'dimensions': dimensions,
        'weights': weights
    }
```

### Historical Benchmarks

```yaml
HISTORICAL_BENCHMARKS:
  iran_scenarios:
    pahlavi_1977:
      material: 45
      health: 35
      freedom: 25
      security: 40
      cohesion: 50
      culture: 40
      sustainability: 35
      composite: ~38

    islamic_republic_1990:
      material: 40
      health: 45
      freedom: 15
      security: 45
      cohesion: 55
      culture: 25
      sustainability: 40
      composite: ~38

    islamic_republic_2025:
      material: 35
      health: 55
      freedom: 15
      security: 30
      cohesion: 35
      culture: 30
      sustainability: 25
      composite: ~32

  regional_comparison:
    turkey_2025: ~55
    uae_2025: ~65
    iraq_2025: ~35
    afghanistan_2025: ~20
    south_korea_2025: ~80

  global_reference:
    norway: ~90
    usa: ~75
    brazil: ~55
    russia: ~50
    iran_potential: ???  # Player determines this
```

### Tradeoff Visualization

```yaml
TRADEOFF_EXAMPLES:
  rapid_democratization:
    short_term:
      freedom: +30
      security: -20
      stability: -25
    long_term:
      freedom: +35
      security: +10 (if successful)
      stability: +20 (if successful)
      OR:
      security: -40 (if civil war)
      stability: -50 (if collapse)

  authoritarian_stability:
    short_term:
      freedom: -10
      security: +20
      material: +10
    long_term:
      freedom: -20 (entrenches)
      sustainability: -30 (breeds resentment)
      cohesion: -20 (repression divides)

  economic_liberalization:
    short_term:
      material: -10 (disruption)
      cohesion: -15 (inequality)
    long_term:
      material: +25 (if successful)
      sustainability: +20 (diversification)
      OR:
      material: +5 (if captured by oligarchs)
      cohesion: -30 (extreme inequality)
```

---

## Gameplay Integration

### How Players Interact with Eudaimonia

**1. Setting Priorities**
- Players choose weights for dimensions
- A player who values freedom above all will weight it heavily
- A player who values stability will weight security
- No "right" answer; different values produce different strategies

**2. Seeing Consequences**
- Every decision shows projected eudaimonia effects
- Short-term vs. long-term tradeoffs made explicit
- Uncertainty acknowledged (projections, not guarantees)

**3. Comparative Analysis**
- Players can compare their Iran to historical cases
- "Your freedom score is now higher than Pahlavi-era, but security is lower"
- Grounds abstract metrics in historical reality

**4. Narrative Integration**
- Numbers are accompanied by stories
- "Your economic reforms have raised material wellbeing, but here's a story about a factory worker who lost his job during the transition"
- Humanizes the metrics

### Example Decision Interface

```
DECISION: Amnesty for Former Regime Officials

PROJECTED EFFECTS:

                    SHORT-TERM    LONG-TERM
Security            +10          +15
Cohesion            +5           +20
Freedom             0            +5
Material            0            +5

BUT ALSO:
Justice concerns    -15 cohesion (among victims)
Precedent set       ??? (depends on who's watching)

HISTORICAL PARALLEL:
Spain's Pact of Forgetting (1977) - similar tradeoff
Learn More →

WHAT ADVISORS SAY:
- Reformist: "We must move forward. Vengeance destroys societies."
- Victim Advocate: "This is betrayal. The dead demand justice."
- Pragmatist: "The generals won't defect without guarantees."
- Historian: "Spain achieved stability. Argentina achieved justice. Both are still debating."

YOUR VALUES (from settings):
You weighted Justice (cohesion) highly.
This decision may conflict with your stated values.

[ Proceed with Amnesty ]  [ Reject Amnesty ]  [ Negotiate Terms ]
```

---

## Philosophical Grounding

### Why Eudaimonia?

**Aristotle's insight:** The goal of human life is eudaimonia - flourishing, living well, fulfilling human potential. Not just pleasure (that's hedonism). Not just freedom (that's libertarianism). Not just equality (that's one value among many). But the full flourishing of human beings.

**Applied to governance:** A government succeeds if it creates conditions for human flourishing. Democracy often does this. But democracy is a means, not an end.

**The game's teaching:** By measuring flourishing multi-dimensionally, players learn:
- Tradeoffs are real
- There is no perfect system
- Different values lead to different choices
- Outcomes matter more than ideology

### The Challenge to Players

**To the democrat:** What if your democracy produces chaos, poverty, and war?

**To the authoritarian:** What if your order produces stagnation, resentment, and eventual collapse?

**To the revolutionary:** What if your revolution devours its children?

**To the conservative:** What if your preservation maintains injustice?

**The game doesn't answer these questions.** It forces players to confront them and decide for themselves what they value and what they're willing to sacrifice.

---

## Technical Implementation

### Data Model

```yaml
EudaimoniaState:
  timestamp: datetime
  dimensions:
    material_wellbeing: Score
    health_longevity: Score
    freedom_agency: Score
    security_order: Score
    social_cohesion: Score
    cultural_flourishing: Score
    sustainability: Score
  composite: float
  player_weights: dict[str, float]
  regional_scores:
    tehran: EudaimoniaState
    kurdistan: EudaimoniaState
    khuzestan: EudaimoniaState
    # etc for each region
  trend: "improving" | "stable" | "declining"
  historical: list[EudaimoniaState]  # Past states for comparison

Score:
  value: float  # 0-100
  components: dict[str, float]  # Sub-scores
  confidence: float  # How certain are we?
  sources: list[str]  # What factors affected this?
```

### Update Logic

```python
def update_eudaimonia(current_state, events, decisions, time_delta):
    """
    Update eudaimonia state based on events and decisions.
    """
    new_state = copy(current_state)

    # Apply immediate effects
    for decision in decisions:
        effects = calculate_decision_effects(decision)
        new_state = apply_effects(new_state, effects)

    # Apply event effects
    for event in events:
        effects = calculate_event_effects(event)
        new_state = apply_effects(new_state, effects)

    # Apply time-based changes
    new_state = apply_trends(new_state, time_delta)

    # Apply delayed effects from past decisions
    delayed = get_delayed_effects(current_state.timestamp, time_delta)
    for effect in delayed:
        new_state = apply_effects(new_state, effect)

    # Calculate regional variation
    for region in new_state.regional_scores:
        new_state.regional_scores[region] = calculate_regional(
            new_state, region
        )

    # Update composite
    new_state.composite = calculate_composite(
        new_state.dimensions,
        new_state.player_weights
    )

    # Record history
    new_state.historical.append(current_state)

    return new_state
```

---

## Conclusion

The Eudaimonia System is the heart of the game's measurement. It embodies the core philosophy:

1. **Flourishing, not ideology** - Success is measured by human outcomes, not system type
2. **Multiple dimensions** - No single metric captures what matters
3. **Tradeoffs are real** - Every gain comes with costs
4. **Player values matter** - What you weight shapes what you pursue
5. **Consequences accumulate** - Today's choices shape tomorrow's scores

Players who master this system understand something profound about governance: **there are no perfect solutions, only better and worse tradeoffs for what you value.**

---

*Last updated: February 2026*
