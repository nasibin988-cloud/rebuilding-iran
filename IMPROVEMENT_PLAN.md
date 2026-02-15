# Rebuilding Iran App - Improvement Plan

## Overview
This document tracks major improvements planned for the app. Created to persist across context compaction.

## Key Decisions Made
- **Anonymity:** Option C - Both email accounts AND username-only accounts available
- **Data Jurisdiction:** EU servers (for user safety)
- **Moderation:** Single admin (user), rules defined below
- **Deployment:** Self-hosted
- **Existing Users:** None yet (not deployed)

---

## 1. Citation Verification & Content Rewrite
**Status:** Pending - requires source materials from user
**Priority:** High

**Problem:** The scholarly tier cites scholars and sources that are AI-generated and likely contain fabrications. This undermines credibility.

**Solution:**
- User will provide authoritative PDFs/sources organized by topic
- Rewrite/finalize lectures with:
  - Verbatim quotations
  - Actual page numbers
  - Proper academic citations
- This replaces the current AI-generated scholarly content with properly sourced material

**Action Required:** User to provide source materials

---

## 2. Scenario-Based Assessments
**Status:** To be implemented
**Priority:** High

**Problem:** Current MC quizzes test recall, not judgment. Real civic participation requires weighing tradeoffs with incomplete information.

**Solution:** Create `/scenarios` page with:
- Branching decision trees
- Interactive case studies
- Consequence analysis showing tradeoffs
- Real governance dilemmas (e.g., "You're advising transitional government, economy collapsing, ethnic tensions rising - analyze three proposals")

**Implementation Notes:**
- Distinct from quizzes - these are interactive narratives
- Should draw on curriculum content (history provides examples of what worked/failed)
- AI grading for open-ended responses (curriculum-aligned, not generic)

---

## 3. Community Features (Full-Stack)
**Status:** To be implemented - requires backend
**Priority:** High

**Problem:** Political participation is inherently social. The app is currently a solitary experience.

**Solution - Full Stack Implementation:**

### User System
- User accounts (email/password, possibly social login)
- Profile with:
  - Progress/completion status
  - Achievements
  - Study interests
  - Optional: location (diaspora city), background
- Privacy controls (what's visible to others)

### Discussion Features
- Discussion threads on contested topics
- Threaded comments on lectures
- Upvoting/moderation system
- Report functionality

### Study Groups
- Create/join study groups
- Group progress tracking
- Shared notes/highlights within groups
- Group discussion spaces

### Peer Features
- Peer review of practice essays
- Debate partner matching
- "Find others in your city" for in-person study groups

---

## 4. Emotional Weight / Trauma Acknowledgment
**Status:** DECLINED by user
**Notes:** User considers this "snowflake stuff" - not implementing

---

## 5. Learning-to-Action Bridge (Full-Stack)
**Status:** To be implemented - requires backend
**Priority:** High

**Problem:** The curriculum ends with "The Blueprint" but provides no bridge to action. Graduates have knowledge but no path forward.

**Solution:**

### Graduate Network
- Registry of curriculum completers
- Searchable directory (with privacy controls)
- "I've completed this" credential that can be shared/verified

### Next Steps Integration
- Curated list of diaspora organizations
- Civic initiatives people can join
- Suggested actions based on location/interests

### Cohort System
- Cohort-based learning (people progress together)
- Graduation ceremonies (virtual)
- Alumni network

### Verification
- Completion certificates (verifiable)
- Badge system that means something (not just gamification)

---

## 6. Security, Offline, and Distribution
**Status:** To be tested and implemented
**Priority:** High

**Problem:** If this is for Iranians (including inside Iran):
- Must work through filtered internet
- Must not leave traces that endanger users
- Must work fully offline
- Should be distributable via Telegram (key Iranian platform)

**Testing Required:**
- [ ] Test current offline functionality
- [ ] Verify no tracking/analytics that could endanger users
- [ ] Test through VPN/proxy scenarios

**Distribution Options to Explore:**
1. **Telegram Bot** - Serves lectures through Telegram
2. **Telegram Channel** - Content packaged for channels (limited formatting)
3. **Telegram Web App** - Optimized for Telegram's in-app browser
4. **PWA** - Downloadable app that works fully offline
5. **Sneakernet** - USB-distributable version

**Implementation Notes:**
- PWA is already partially implemented (manifest.json exists)
- Need to ensure all content is cached for offline use
- Consider content encryption for sensitive distribution

---

## 7. News Channel with AI Processing
**Status:** To be implemented
**Priority:** High

**Concept:** Admin forwards news from Telegram channels → AI layer processes → Professional news feed in app

### Why This Matters
- Connects curriculum to current events
- Keeps graduates engaged (daily return reason)
- Drives community discussion
- Demonstrates applied thinking ("here's what's happening, here's how curriculum helps you understand it")

### Admin Interface
- Simple form to paste Telegram forwards
- Bulk import capability
- Source attribution (which Telegram channel)
- Category tagging (politics, economy, society, diaspora, etc.)

### AI Processing Pipeline
1. **Deduplication** - Same story from multiple channels → merge
2. **Language cleanup** - Telegram-speak → professional prose
3. **Style transformation** - Match professional journalism standards
4. **Fact extraction** - Who, what, when, where, why
5. **Curriculum linking** - "This relates to Section X: [topic]" (automatic cross-references)
6. **Bias flagging** - Note source biases, provide context

### User-Facing Features
- `/news` page with chronological feed
- Category filters
- "Related curriculum" sidebar for each story
- Discussion threads per story
- "Explain this" button (AI explains context using curriculum)
- Daily/weekly digest option

### Technical Implementation
- Admin-only submission interface
- OpenAI/Claude API for processing
- Queue system for processing (don't block on AI)
- Caching processed articles
- RSS feed generation (for external consumption)

### Content Policy for News
- No editorializing by AI (present facts, note biases)
- Source attribution required
- Corrections mechanism
- No regime propaganda (filter/flag)

---

## 8. Theory of Change
**Status:** To be addressed through content/features
**Priority:** Medium

**Problem:** Educated individuals can still collectively make bad decisions. Knowledge ≠ good outcomes.

**Solution - Content & Features:**

### Historical Case Studies
- Explicit study of how educated populations went wrong
  - Weimar Germany
  - Revolutionary Iran (intellectuals who enabled theocracy)
  - Other cautionary examples

### Bias Exposure
- Exercises that expose users to their own reasoning biases
- Self-assessment tools

### Collective Action Content
- Content on coordination failures
- How good intentions lead to bad outcomes
- Game theory basics (prisoner's dilemma, tragedy of commons)

### Red Team Mode
- Users must argue AGAINST their preferred positions
- Steelman opposing views before critiquing
- Built into debate simulator and practice mode

---

## Community Moderation Rules

### Prohibited Content
1. **Regime support/propaganda** - Defending Islamic Republic, IRGC, or associated figures
2. **Doxxing** - Revealing personal information of any user
3. **Threats/harassment** - Personal attacks, intimidation
4. **Ethnic/religious hatred** - Attacks on Kurds, Baloch, Azeris, Baha'is, etc.
5. **Spam/commercial content** - Advertising, scams
6. **Misinformation** - Deliberately false claims (distinguish from good-faith errors)

### Allowed (even if controversial)
- Criticism of opposition figures/strategies
- Debate on post-transition governance (monarchy vs republic, federalism, etc.)
- Religious discussion (respectful)
- Diaspora politics

### Enforcement
- Report button on all user content
- Admin review queue
- Warn → 24h ban → permanent ban escalation
- Immediate permanent ban for doxxing/threats

### Anonymity Protections
- No requirement to reveal real identity
- IP addresses not visible to other users
- Admin can see IPs only for abuse investigation
- Users can request full data deletion

---

## Infrastructure for Self-Hosting

### What You Need to Purchase/Set Up

#### 1. VPS (Virtual Private Server)
**Recommended:** Hetzner (EU-based, good privacy, cheap)
- **Minimum specs:** 2 vCPU, 4GB RAM, 40GB SSD (~€7/month)
- **Better:** 4 vCPU, 8GB RAM, 80GB SSD (~€14/month)

**Alternatives:**
- DigitalOcean (US company but has EU datacenters)
- Linode (now Akamai)
- OVH (French, very private)

**Action:** Sign up for Hetzner Cloud, create a server in Nuremberg or Falkenstein (Germany)

#### 2. Domain Name
**Recommended registrars (privacy-friendly):**
- Njalla (anonymous registration)
- Porkbun (cheap, good privacy)
- Cloudflare Registrar (at-cost pricing)

**Choose a domain** - something memorable, possibly .org or country-neutral TLD
- Example: `rebuildingiran.org`, `iranacademy.org`, etc.

**Action:** Register domain, you'll configure DNS later

#### 3. Supabase Project
As discussed - create on supabase.com with **EU region (Frankfurt)**

#### 4. Email Service (for auth emails)
**Recommended:** Resend.com
- Free tier: 3,000 emails/month (plenty for auth)
- Simple setup
- Good deliverability

**Action:** Sign up at resend.com, verify your domain

### What You'll Provide Me

| Item | Where to get it | When needed |
|------|-----------------|-------------|
| VPS IP address | Hetzner dashboard after server creation | Before deployment |
| VPS SSH access | Create SSH key, add to server | Before deployment |
| Domain name | Your registrar | Before deployment |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API | Now |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API | Now |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API | Now |
| Resend API key | Resend dashboard | Before production |
| OpenAI/Anthropic API key | For news AI processing | When implementing news |

### Deployment Stack (I will set up)
- **Docker** - Containerized deployment
- **Caddy** - Reverse proxy + automatic HTTPS
- **PostgreSQL** - Via Supabase (managed)
- **Next.js** - App itself

### DNS Configuration (you'll do this)
Once I give you the server IP, add these records at your registrar:

```
Type    Name    Value           TTL
A       @       [SERVER_IP]     3600
A       www     [SERVER_IP]     3600
```

For email (Resend), they'll give you specific records to add.

---

## Technical Architecture for Full-Stack

### Current Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Static site generation
- localStorage for progress

### Proposed Additions

#### Database
Options:
- **PostgreSQL** (via Supabase, Neon, or self-hosted)
- **SQLite** (via Turso for edge deployment)
- **PlanetScale** (MySQL-compatible, serverless)

Recommendation: **Supabase** - includes auth, realtime, storage, and PostgreSQL

#### Authentication
Options:
- **NextAuth.js** - flexible, many providers
- **Supabase Auth** - if using Supabase for DB
- **Clerk** - polished UI, good DX

Recommendation: **Supabase Auth** - unified with database

#### ORM
- **Prisma** - type-safe, great DX
- **Drizzle** - lighter weight, SQL-like

Recommendation: **Prisma**

#### Realtime (for discussions/community)
- Supabase Realtime (if using Supabase)
- Pusher
- Socket.io (requires server)

#### File Storage (for user uploads, certificates)
- Supabase Storage
- Cloudflare R2
- AWS S3

### Data Migration
- Export current localStorage schema
- Map to database tables
- Provide migration path for existing users

### Database Schema (Draft)

```
Users
- id
- email
- password_hash
- display_name
- bio
- location (optional)
- created_at
- last_active
- privacy_settings (JSON)

Progress
- user_id
- lecture_slug
- completed_at
- tier_viewed
- time_spent

Notes
- user_id
- lecture_slug
- content
- created_at
- updated_at

Highlights
- user_id
- lecture_slug
- text
- color
- note
- created_at

Bookmarks
- user_id
- lecture_slug
- created_at

QuizAttempts
- user_id
- section_num
- score
- answers (JSON)
- created_at

ScenarioAttempts
- user_id
- scenario_id
- choices (JSON)
- outcome
- created_at

StudyGroups
- id
- name
- description
- created_by
- is_private
- created_at

GroupMembers
- group_id
- user_id
- role (admin/member)
- joined_at

Discussions
- id
- lecture_slug (optional, for lecture comments)
- topic_id (optional, for general discussions)
- parent_id (for threading)
- user_id
- content
- upvotes
- created_at

GraduateRegistry
- user_id
- completed_at
- certificate_hash
- is_public
```

---

## Implementation Order

### Phase 1: Foundation
1. Set up Supabase client in app
2. Implement Prisma schema
3. Add authentication (sign up with email OR username-only, login, logout)
4. User profiles with privacy controls
5. Progress sync to database

### Phase 2: Community
1. Lecture comments/discussions
2. Discussion threads (general topics)
3. Study groups (create, join, group chat)
4. Moderation tools (admin panel, report queue)

### Phase 3: News Channel
1. Admin submission interface
2. AI processing pipeline (dedupe, transform, link to curriculum)
3. Public news feed (`/news`)
4. News discussion threads
5. "Explain with curriculum" feature

### Phase 4: Advanced Features
1. Scenario-based assessments
2. Peer matching for debates
3. Graduate registry
4. Verifiable certificates

### Phase 5: Distribution & Security
1. Full PWA (installable, offline)
2. Telegram bot / web app
3. Security audit
4. VPS deployment with Docker/Caddy

### Phase 6: Content Improvements
1. Citation verification (requires source materials)
2. Theory of change additions
3. Red team exercises in debate mode

---

## Notes
- All community features must be consistent with curriculum's goals
- Privacy is paramount given the audience
- Content moderation needed for user-generated content
- Consider: anonymous participation options for users inside Iran
