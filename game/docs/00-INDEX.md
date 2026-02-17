# IRAN 14XX: Game Design Bible

## Document Index

This directory contains the complete design documentation for IRAN 14XX, a comprehensive political simulation game about Iran's possible futures.

**Status Legend:**
- ✅ Complete - Document written and ready
- 📝 Planned - Document outlined, not yet written

---

### Philosophy
- ✅ `01-VISION.md` - Core vision, philosophy, and what makes this game unique
- ✅ `02-DESIGN-PRINCIPLES.md` - Guiding principles for all design decisions
- 📝 `03-EDUCATIONAL-FRAMEWORK.md` - How the game teaches without preaching

### Game Systems
- ✅ `10-CORE-LOOP.md` - The fundamental gameplay loop (turn phases, pacing, resources)
- ✅ `11-GAME-THEORY-MODEL.md` - How rational actors and incentives work
- ✅ `12-EUDAIMONIA-SYSTEM.md` - Measuring human flourishing across 7 dimensions
- ✅ `13-FACTION-SYSTEM.md` - How factions work, relationships, coalition dynamics
- ✅ `14-CHARACTER-SYSTEM.md` - Playable characters, starting positions, progression
- ✅ `15-EVENT-SYSTEM.md` - Event triggers, decisions, branching, narrative engine
- ✅ `16-CONSEQUENCE-ENGINE.md` - Delayed effects, unintended consequences, memory system
- 📝 `17-REGIONAL-SYSTEM.md` - Geography, provinces, territorial control
- 📝 `18-ECONOMIC-MODEL.md` - Economy simulation (simplified but meaningful)
- 📝 `19-INTERNATIONAL-SYSTEM.md` - Foreign powers, their interests and actions

### Content
- 📝 `20-NARRATIVE-STRUCTURE.md` - Acts, chapters, pacing
- 📝 `21-PLAYABLE-CHARACTERS.md` - Deep profiles of each playable character
- 📝 `22-NPC-PROFILES.md` - Major NPCs, their psychology and arcs
- 📝 `23-FACTION-PROFILES.md` - Deep analysis of each faction
- ✅ `24-ENDINGS-CATALOG.md` - All possible endings and how to reach them
- 📝 `25-EVENT-CATALOG.md` - Master list of all events
- 📝 `26-DECISION-CATALOG.md` - Master list of all decisions and consequences

### Characters (Deep Psychological Studies)
- ✅ `30-PSYCHOLOGY-FRAMEWORK.md` - The five foundations of character motivation
- ✅ `31-REGIME-INSIDERS.md` - Khamenei, Mojtaba, IRGC commanders, Basij, clergy, business elite
- ✅ `32-OPPOSITION-FIGURES.md` - Reza Pahlavi, monarchists, reformists, activists, MEK, labor, diaspora
- ✅ `33-ORDINARY-PEOPLE.md` - Mass psychology, collective action, cascade dynamics
- ✅ `34-ETHNIC-LEADERS.md` - Kurdish, Azeri, Baluchi, Arab leaders and movements
- 📝 `35-DIASPORA.md` - Exiles, their psychology and role
- 📝 `36-INTERNATIONAL-ACTORS.md` - US, EU, Russia, China, neighbors

### Technical
- ✅ `40-ARCHITECTURE.md` - Technical architecture (Next.js, TypeScript, project structure)
- ✅ `41-STATE-SCHEMA.md` - Complete game state data structures (TypeScript interfaces)
- 📝 `42-EVENT-FORMAT.md` - How to write events (YAML schema)
- ✅ `43-AI-INTEGRATION.md` - AI advisor system, RAG, prompt engineering
- 📝 `44-SAVE-SYSTEM.md` - Save/load, versioning, migration
- 📝 `45-LOCALIZATION.md` - Persian/English, RTL support

### Art & Audio
- 📝 `50-VISUAL-DESIGN.md` - Art direction, UI/UX
- 📝 `51-CHARACTER-ART.md` - Portrait style, specifications
- 📝 `52-MAP-DESIGN.md` - Interactive map design
- 📝 `53-AUDIO-DESIGN.md` - Music, sound, voice (if any)

### Production
- 📝 `60-ROADMAP.md` - Development phases and milestones
- 📝 `61-CONTENT-PIPELINE.md` - How content is authored and tested
- 📝 `62-TESTING-STRATEGY.md` - How we ensure quality
- 📝 `63-RELEASE-STRATEGY.md` - How we ship

---

## Progress Summary

**Completed:** 17 documents
**Planned:** 25+ documents

### Core Systems Status
All foundational systems documented:
- Vision and design philosophy ✅
- Game theory model ✅
- Eudaimonia measurement system ✅
- Faction dynamics ✅
- Character system ✅
- Core gameplay loop ✅
- Event system ✅
- Consequence engine ✅

### Character Psychology Status
Deep psychological profiles completed for:
- Regime insiders (Khamenei, IRGC, Basij, clergy) ✅
- Opposition figures (Reza Pahlavi, activists, labor, diaspora) ✅
- Ordinary people (mass psychology, cascade dynamics) ✅
- Ethnic leaders (Kurdish, Azeri, Baluchi, Arab) ✅

### Technical Status
Architecture and implementation foundations:
- Technical architecture (Next.js, TypeScript) ✅
- State schema (complete data model) ✅
- AI integration design ✅
- Endings catalog ✅

---

## How to Use This Documentation

### For Designers/Writers
Start with `01-VISION.md` to understand the philosophy. Then read `30-PSYCHOLOGY-FRAMEWORK.md` before writing any character content. Refer to `42-EVENT-FORMAT.md` for technical specifications.

### For Developers
Start with `40-ARCHITECTURE.md` for the big picture. `41-STATE-SCHEMA.md` defines all data structures. Implementation details are in `engine/` directory.

### For Artists
`50-VISUAL-DESIGN.md` is your bible. Character specifications in `51-CHARACTER-ART.md`.

### For AI/LLM Continuity
If you're an AI continuing this work:
1. Read `01-VISION.md` first - understand what we're building and why
2. Check `60-ROADMAP.md` to see current phase and progress
3. The philosophy in `02-DESIGN-PRINCIPLES.md` guides all decisions
4. When in doubt, ask: "Does this serve eudaimonia education through cause-and-effect?"

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-15 | Initial documentation structure |
| 0.2 | 2026-02-15 | Core systems documented: Vision, Design Principles, Game Theory, Eudaimonia, Factions, Characters, Core Loop |
| 0.3 | 2026-02-15 | Character psychology deep dives: Regime insiders, Opposition figures, Ordinary people, Ethnic leaders |
| 0.4 | 2026-02-15 | Event System and Consequence Engine documented |
| 0.5 | 2026-02-15 | Endings Catalog: All possible political outcomes |
| 0.6 | 2026-02-15 | Technical Architecture: Next.js, State Schema, AI Integration |

---

## For AI Continuity

If you are an AI (Claude or other LLM) continuing this work after context compression:

1. **Start here** - This index tells you what exists and what's needed
2. **Read in order:**
   - `01-VISION.md` (understand the "why")
   - `02-DESIGN-PRINCIPLES.md` (understand the "how")
   - `30-PSYCHOLOGY-FRAMEWORK.md` (understand characters)
   - Then systems docs as needed for your task

3. **Key concepts to internalize:**
   - Eudaimonia, not democracy, is the success metric
   - Every character (including villains) must be comprehensible
   - Game theory drives behavior, not authorial judgment
   - Consequences should surprise but make sense
   - Show, don't tell

4. **When creating new content:**
   - Follow the established tone and depth
   - Use YAML for technical specifications
   - Include code examples where relevant
   - Connect to historical parallels
   - Remember: Persian is primary, English is secondary

---

*Last updated: February 2026*
