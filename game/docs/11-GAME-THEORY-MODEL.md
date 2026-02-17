# Game Theory Model

## Overview

Iran's political situation is a game-theoretic equilibrium - stable not because it's good, but because no actor can unilaterally improve their position. Understanding this is essential to understanding why change is hard and what might enable it.

This document explains how game theory principles are implemented in IRAN 14XX.

---

## Core Concept: Everyone Is Rational (From Their Perspective)

**Rationality doesn't mean wisdom.** It means:
- Actors have preferences (things they want)
- Actors have beliefs (what they think is true)
- Actors choose actions that, given their beliefs, they expect to advance their preferences

A Basiji who beats protesters is rational if:
- He believes protesters threaten everything he values
- He believes beating them protects the system that provides his livelihood
- He believes God rewards those who defend the Islamic Republic

**His beliefs may be wrong. His values may be repugnant. But his behavior follows logically from them.**

The game models this. Every actor has:
- `preferences`: What they want (ordered by priority)
- `beliefs`: What they think is true about the world
- `information`: What they actually know
- `constraints`: What limits their options

---

## The Payoff Matrix: What Do Actors Want?

### Universal Human Motivations

Every character is motivated by some combination of:

| Motivation | Description | Example |
|------------|-------------|---------|
| **Survival** | Physical safety for self and family | Avoiding execution, imprisonment |
| **Material** | Wealth, property, economic security | Keeping their home, feeding family |
| **Status** | Recognition, respect, social standing | Being honored, not humiliated |
| **Power** | Ability to shape outcomes | Controlling decisions, institutions |
| **Belonging** | Connection to group, identity | Being part of the IRGC brotherhood |
| **Meaning** | Purpose, significance, legacy | Serving God, nation, revolution |
| **Justice** | Fairness, redress of wrongs | Punishing oppressors, helping victims |
| **Freedom** | Autonomy, self-determination | Speaking freely, living as one wishes |

Characters weight these differently. A true believer weights Meaning highly. A careerist weights Material and Status. A revolutionary weights Justice and Freedom.

### Faction-Level Motivations

Factions have institutional interests:

```
FACTION: IRGC

INSTITUTIONAL INTERESTS:
├── Survival: Avoid dissolution, prosecution
├── Power: Maintain control over security, economy
├── Resources: Protect business empire, budget
├── Ideology: Defend revolutionary values (varies by faction)
└── Autonomy: Resist civilian oversight

THREATS TO INTERESTS:
├── Democratic transition → prosecution, dissolution
├── Economic reform → loss of business empire
├── Military reform → loss of autonomy
├── Reconciliation → loss of enemy that justifies existence
└── Secularization → loss of ideological legitimacy
```

**Key insight:** The IRGC's resistance to change isn't irrational. Their interests are genuinely threatened by reform. Understanding this suggests strategies: what assurances might change their calculation?

---

## The Commitment Problem

**Why can't enemies just make peace?**

The core problem of political transitions:
1. The regime could step down peacefully
2. The opposition could promise amnesty
3. Both would be better off than civil war
4. But neither can credibly commit

**Why?**

The regime fears: "Once we give up power, they'll punish us anyway. The promise means nothing without power to enforce it."

The opposition fears: "If we promise amnesty, the regime will use the breathing room to crack down harder. We can't trust them."

This is the commitment problem - the inability to make credible promises about future behavior.

### How the game models this:

```yaml
# When negotiating with regime figures

NEGOTIATION_DYNAMICS:
  regime_concerns:
    - Will promises of amnesty be kept after transition?
    - Can opposition leaders control their base?
    - What prevents future prosecution?

  opposition_concerns:
    - Will regime use talks to buy time?
    - Will agreements be honored?
    - How do we satisfy victims demanding justice?

  credibility_factors:
    - Track record of keeping promises
    - Institutional guarantees (international backing?)
    - Personal relationships and trust
    - Costly signals (giving something up to show seriousness)
```

**Gameplay implication:** Building credibility is a mechanic. Break promises and future commitments aren't believed. Keep them and doors open.

---

## Coordination Problems

**Why can't the opposition unite?**

Everyone agrees the regime should go. But:
- Who leads after?
- What system do we build?
- Who gets prosecuted?
- What happens to religion?
- What about ethnic minorities?

These disagreements make coordination hard. Each faction fears the other will dominate post-transition.

### The game models this:

```yaml
OPPOSITION_COORDINATION:
  shared_goal: End Islamic Republic

  disagreements:
    - Monarchists vs Republicans
    - Secular vs Religious reformers
    - Centralists vs Federalists
    - Maximalists (prosecution) vs Reconcilers (amnesty)
    - Leftists vs Liberals
    - Ethnic autonomy vs National unity

  coordination_failure_modes:
    - One faction defects to regime for concessions
    - Factions fight each other instead of regime
    - No agreement on successor institutions
    - External actors back different factions
```

**Gameplay implication:** Coalition management is central. You can't defeat the regime with a fractured opposition. But unity requires compromises that alienate parts of your base.

---

## Collective Action Problems

**Why don't the masses simply rise up?**

The people outnumber the regime 1000 to 1. Why don't they simply overthrow it?

The problem:
- Each individual risks everything by protesting
- The benefit (regime change) is shared by all, whether they protested or not
- So each individual has incentive to free-ride: "Let others take the risk"
- If everyone reasons this way, no one protests

This is the collective action problem.

### How it's overcome (in reality and in game):

1. **Focal points:** An event that signals "now is the time" (Mahsa Amini's death)
2. **Tipping points:** Enough people protesting that joining seems safer than abstaining
3. **Selective incentives:** Rewards for participating, punishments for not (community pressure)
4. **Identity:** Protesting becomes part of who you are, not a calculated decision
5. **Information:** Seeing others protest reveals others' willingness to act

### The game models this:

```yaml
MASS_MOBILIZATION:
  factors:
    - Grievance level (how angry are people?)
    - Opportunity (is there a focal event?)
    - Organization (are there networks to mobilize?)
    - Expectation (do people expect others to act?)
    - Repression cost (how dangerous is protesting?)
    - Regime legitimacy (do people believe regime will last?)

  tipping_dynamics:
    - Small protests can grow exponentially if they're not crushed
    - Early victories create bandwagon effects
    - Early defeats create demobilization
    - Information about protest sizes matters enormously
```

**Gameplay implication:** As opposition, you're trying to create conditions for mass mobilization. As regime, you're trying to prevent tipping points through selective repression and information control.

---

## Information Asymmetry

**No one knows everything.**

Key information problems:
- Regime doesn't know who's truly loyal vs. secretly opposed
- Opposition doesn't know regime's true strength vs. bluff
- Everyone's uncertain about what happens if regime falls
- Foreign actors have their own intelligence, often wrong

### The game models this:

```yaml
INFORMATION_STATES:
  player_knows:
    - Own resources and capabilities
    - Own faction's true loyalty
    - What player has directly observed

  player_uncertain_about:
    - Other factions' true strength
    - Other characters' true loyalties
    - What's happening in other regions
    - Foreign actors' true intentions

  can_learn_through:
    - Intelligence operations
    - Trusted advisors
    - Events that reveal information
    - Costly signals from other actors
```

**Gameplay implication:** Intelligence matters. What you don't know can kill you. Decisions made with wrong beliefs lead to bad outcomes - but you might not know your beliefs were wrong until too late.

---

## Signaling and Cheap Talk

**Actions speak louder than words.**

Problem: Anyone can say anything. How do you know who to trust?

Solution: Costly signals - actions that would be costly if you were lying.

Examples:
- Regime offering amnesty = cheap talk (easy to promise, easy to break)
- Regime releasing prisoners = costly signal (gives up leverage)
- Opposition promising peace = cheap talk
- Opposition disbanding militia = costly signal (gives up capability)

### The game models this:

```yaml
CREDIBILITY_SYSTEM:
  cheap_talk:
    - Promises
    - Public statements
    - Negotiations
    weight: low (unless track record supports)

  costly_signals:
    - Releasing prisoners/hostages
    - Withdrawing forces
    - Sharing intelligence
    - Accepting international monitoring
    - Public commitments that burn bridges
    weight: high (hard to fake)

  track_record:
    - Past promises kept → future promises more credible
    - Past promises broken → future promises discounted
    - Builds over time through observed behavior
```

**Gameplay implication:** Building credibility requires costly actions. Reputation is a resource that takes time to build and moments to destroy.

---

## Nash Equilibria and Escape Routes

### The Current Equilibrium

Iran's current political situation is a Nash equilibrium:

```
CURRENT EQUILIBRIUM:

Regime strategy: Maintain power through repression, co-optation, ideology
Opposition strategy: Survive, protest when possible, wait for opportunity
Population strategy: Comply publicly, resist privately, pursue individual exit

Why it's stable:
- Regime can't liberalize (would empower opposition, threaten insiders)
- Opposition can't overthrow (lacks coordination, faces repression)
- Population can't revolt (collective action problem)

Each actor is doing their "best response" given others' strategies.
No one can unilaterally improve their position.
```

### How Equilibria Break

Equilibria can shift through:

1. **Exogenous shocks:** Economic collapse, leader death, external intervention
2. **Focal points:** Events that coordinate expectations (Mahsa Amini)
3. **Commitment devices:** Institutions that make promises credible
4. **Coalition shifts:** Defection of key regime supporters
5. **Information revelation:** Hidden preferences revealed (people discover others share their views)

### The game models this:

```yaml
EQUILIBRIUM_DYNAMICS:
  stability_factors:
    - Regime cohesion
    - Economic performance
    - Repressive capacity
    - Opposition fragmentation
    - Population quiescence
    - International pressure (or lack thereof)

  shock_events:
    - Leader death/incapacity
    - Economic crisis
    - Military defeat
    - Mass casualty event
    - External intervention

  tipping_conditions:
    - When enough stability factors erode, system becomes fragile
    - Small events can then trigger cascades
    - Timing and sequence matter enormously
```

**Gameplay implication:** You're trying to shift the equilibrium. This requires understanding what holds it in place and what might destabilize it. Frontal assault usually fails. Finding leverage points works better.

---

## Practical Application: Why Is Change So Hard?

Let's trace through why an obviously desirable change (e.g., democratic transition) is so hard:

1. **Regime elites** fear prosecution, loss of wealth, loss of status. They'll fight to prevent transition.

2. **Security forces** fear dissolution, prosecution, revenge. They'll maintain repression.

3. **Regime supporters** (beneficiaries of current system) fear loss of privileges. They'll oppose change.

4. **Opposition factions** can't agree on what comes next. They undermine each other.

5. **Population** faces collective action problem. Each individual waits for others to act.

6. **International actors** have conflicting interests. Some support regime, some support different opposition factions.

7. **Everyone** faces commitment problems. Promises about post-transition are cheap talk.

**The game teaches this by making you experience it.** You're not told change is hard. You try to make change and discover why it's hard.

---

## Modeled Game Theory Concepts

For reference, here are all game theory concepts explicitly modeled:

| Concept | Implementation |
|---------|----------------|
| Rational actors | Every character has preferences, beliefs, information |
| Payoff matrices | Faction interests, character motivations |
| Nash equilibrium | System stability, why current situation persists |
| Commitment problems | Regime-opposition negotiations, amnesty credibility |
| Coordination problems | Opposition fragmentation, coalition management |
| Collective action | Mass mobilization dynamics, protest tipping points |
| Information asymmetry | Intelligence, uncertainty, revelation through events |
| Signaling | Costly vs cheap signals, reputation building |
| Focal points | Events that coordinate expectations |
| Tipping points | Cascade dynamics, bandwagon effects |

---

## For Content Authors

When writing events and decisions, always ask:
1. What does each actor want?
2. What do they believe?
3. What information do they have?
4. What constrains their options?
5. What would they do given 1-4?

If a character acts against their interests without explanation, something is wrong.

If a player action produces an outcome that doesn't follow from the game theory, something is wrong.

**The game should feel like a strategic puzzle where understanding your opponents is the key to success.**

---

*Last updated: February 2026*
