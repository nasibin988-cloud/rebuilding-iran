# AI Integration: Where and How LLMs Enhance the Game

## Philosophy

**AI augments human craft; it doesn't replace it.**

Core narrative, events, and decisions are human-authored because:
- Quality control is essential for sensitive political content
- Consistency requires authorial vision
- Persian language requires native fluency
- Historical accuracy requires expert review

AI provides depth on demand:
- Advisor conversations that respond to context
- Historical parallels drawn dynamically
- Extended explanations when players want more
- Post-decision reflection and analysis

---

## AI-Appropriate Use Cases

### 1. Advisor Conversations

**What it does:** Dynamic, context-aware dialogue with in-game advisors.

```yaml
ADVISOR_SYSTEM:
  purpose: |
    Players can ask questions and receive contextual advice.
    Advisors have distinct personalities and perspectives.
    Conversations feel natural, not scripted.

  advisors:
    strategic:
      persona: "Analytical, focused on power and leverage"
      examples:
        - "What's the strategic value of this alliance?"
        - "How can we exploit the regime's divisions?"

    ethical:
      persona: "Principled, focused on justice and human rights"
      examples:
        - "Is this the right thing to do?"
        - "What about the people who will be harmed?"

    pragmatic:
      persona: "Realistic, focused on achievability"
      examples:
        - "Can we actually pull this off?"
        - "What are the risks we're not seeing?"

    historical:
      persona: "Comparative, draws on historical cases"
      examples:
        - "Has something like this happened before?"
        - "What can we learn from the Spanish transition?"

  implementation:
    model: Claude 3.5 Sonnet (fast, capable)
    context: Current game state, event, player history
    constraints:
      - Never breaks character
      - Never reveals AI nature
      - Never gives "right answer"
      - Stays within historical accuracy
```

**Example Interaction:**

```
PLAYER: Should I ally with the monarchists?

STRATEGIC ADVISOR:
The monarchists offer real advantages: name recognition,
diaspora funding, some international connections. Their
weakness is inside Iran, where "monarchy" remains
controversial after 45 years of republican propaganda.

If your strategy depends on inside-Iran legitimacy,
monarchist association may cost more than it provides.
If you're building an exile coalition for international
pressure, they're valuable allies.

The question is: what's your theory of change?
International pressure forcing regime negotiation?
Inside-Iran mass mobilization? Armed resistance?
The answer shapes whether the monarchists are useful.

PLAYER: What about the moral question?

ETHICAL ADVISOR:
You're asking whether to ally with people whose family
was responsible for SAVAK, for repression, for the
concentration of wealth that fueled the revolution.

There are two ways to think about this:

1. The sins of the father. Reza Pahlavi didn't run SAVAK.
   He's spent his life in exile, not power. Should he
   be held responsible for his father's regime?

2. The symbolism matters. Allying with the crown
   legitimizes monarchy as an institution. Whatever
   Reza's personal qualities, you're rehabilitating
   what the revolution rejected.

I can't tell you which matters more. What do you believe
about inheritance, about symbols, about reconciliation?
```

### 2. Learn More Content

**What it does:** Provides deeper context when players want it.

```yaml
LEARN_MORE_SYSTEM:
  purpose: |
    When players click "Learn More," AI provides contextual
    educational content drawn from authoritative sources.

  types:
    historical_parallel:
      description: "What happened elsewhere that's similar?"
      sources: Academic literature, historical accounts
      length: 2-3 paragraphs

    political_science:
      description: "What do scholars say about this dynamic?"
      sources: Academic research, theory
      length: 2-3 paragraphs

    iranian_context:
      description: "What's the specific Iranian background?"
      sources: Iran studies literature, history
      length: 2-3 paragraphs

    factual_detail:
      description: "What are the facts about this issue?"
      sources: Reports, data, primary sources
      length: 1-2 paragraphs

  implementation:
    approach: Retrieval-Augmented Generation (RAG)
    corpus: Pre-indexed educational content
    model: Claude 3.5 Sonnet
    validation: Content reviewed for accuracy
```

### 3. Post-Decision Reflection

**What it does:** After major decisions, AI offers reflection.

```yaml
REFLECTION_SYSTEM:
  purpose: |
    Help players understand what they just did and why
    it matters, without judging them.

  triggers:
    - Major story decisions
    - Turning points
    - Morally complex choices

  format:
    - Brief observation about the choice
    - What this reveals about player values
    - Questions to consider
    - (Not a lecture, not judgment)

  example: |
    REFLECTION: The Amnesty Decision

    You chose to offer amnesty to regime pragmatists.
    This suggests you weight stability and coalition
    over justice and accountability.

    Some thoughts:
    - Every transition faces this tradeoff
    - Spain chose forgetting; Argentina chose trials
    - Neither path is "right"; both have costs
    - Victims will feel betrayed; perpetrators relieved
    - History will judge - but history is written later

    What do you believe about justice? About peace?
    About what societies owe to victims and to futures?
```

### 4. Character Voice

**What it does:** Makes NPC dialogue feel natural and consistent.

```yaml
CHARACTER_VOICE:
  purpose: |
    When players have extended conversations with NPCs,
    AI generates contextual dialogue in character voice.

  constraints:
    - Character psychology defined in YAML
    - AI follows character constraints
    - Core story beats are pre-authored
    - AI fills in natural conversation

  implementation:
    system_prompt: |
      You are [CHARACTER NAME], a [ROLE] in IRAN 14XX.
      Your psychology: [from YAML]
      Your current state: [from game state]
      Your relationship with player: [from game state]

      Respond as this character would. Be consistent
      with your defined psychology. Never break character.
      Never reveal information the character wouldn't know.
      Never act against character interests without reason.

  example:
    character: Hassan Kargar (labor leader)
    context: Player is asking about strike strategy
    dialogue: |
      HASSAN: "Strategy? Look, I've been organizing
      for twenty years. The regime knows one language:
      strength. We have strength when we shut down
      production. That's our leverage.

      But I won't throw my workers into a battle
      they can't win. I've seen what happens. Families
      destroyed. Men broken in prison.

      So tell me: if we strike, who has our backs?
      What happens when the Sepah comes? Do we have
      international attention? Do we have allies?

      Because I'll tell you what we don't have:
      we don't have trust. We've been promised before.
      Promised by reformists, by politicians, by exiles.
      They all used us and abandoned us.

      Why should I believe you're different?"
```

---

## AI-Inappropriate Use Cases

### What AI Does NOT Do

```yaml
AI_RESTRICTIONS:
  core_narrative:
    what: Main story events, key decision points
    why: Quality control, consistency, sensitivity
    approach: Human-authored, AI-assisted editing only

  decision_content:
    what: Decision options and their consequences
    why: Balance, historical accuracy, game design
    approach: Human-authored, tested

  character_definitions:
    what: Core psychology, background, traits
    why: Consistency, cultural accuracy
    approach: Human-authored, AI may suggest

  historical_facts:
    what: Specific dates, events, statistics
    why: Accuracy is paramount
    approach: Human-verified sources only

  persian_core_content:
    what: Primary narrative in Persian
    why: Native fluency required
    approach: Human native speaker authorship

  sensitive_content:
    what: Torture, violence, specific atrocities
    why: Requires extreme care
    approach: Human-authored with review
```

---

## Implementation Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     GAME CLIENT                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Advisor   │  │  Learn More │  │  Character  │     │
│  │   Panel     │  │   System    │  │  Dialogue   │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          ▼                              │
│                ┌─────────────────┐                      │
│                │   AI Service    │                      │
│                │    Interface    │                      │
│                └────────┬────────┘                      │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     AI SERVICE                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Prompt    │  │   Context   │  │   Response  │     │
│  │   Builder   │  │   Manager   │  │   Parser    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          ▼                              │
│                ┌─────────────────┐                      │
│                │   Claude API    │                      │
│                └─────────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### Code Implementation

```typescript
// engine/ai/AdvisorService.ts

interface AdvisorService {
  getAdvice(request: AdvisorRequest): Promise<AdvisorResponse>;
  continueConversation(
    conversationId: string,
    message: string
  ): Promise<AdvisorResponse>;
}

interface AdvisorRequest {
  advisorType: AdvisorType;
  context: AdvisorContext;
  question: string;
}

interface AdvisorContext {
  currentEvent: GameEvent;
  gameState: GameStateSummary;
  playerHistory: PlayerHistorySummary;
  conversationHistory: Message[];
}

class AdvisorServiceImpl implements AdvisorService {
  private anthropic: Anthropic;
  private promptBuilder: PromptBuilder;
  private conversations: Map<string, ConversationState>;

  async getAdvice(request: AdvisorRequest): Promise<AdvisorResponse> {
    // Build prompt
    const systemPrompt = this.getAdvisorSystemPrompt(request.advisorType);
    const contextPrompt = this.promptBuilder.buildContext(request.context);
    const userPrompt = this.promptBuilder.buildQuestion(request.question);

    // Call API
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: contextPrompt + '\n\n' + userPrompt }
      ]
    });

    // Parse and validate
    const parsed = this.parseResponse(response);

    // Store for conversation continuity
    const conversationId = this.storeConversation(request, parsed);

    return {
      advice: parsed.content,
      advisorType: request.advisorType,
      conversationId,
    };
  }

  private getAdvisorSystemPrompt(type: AdvisorType): string {
    const prompts = {
      strategic: `You are a strategic advisor in IRAN 14XX, a political
        simulation about Iran's future. You analyze situations in terms
        of power, leverage, and strategic advantage.

        Guidelines:
        - Be direct and analytical
        - Focus on what advances the player's goals
        - Consider second-order effects
        - Never moralize; leave ethics to the ethical advisor
        - Never reveal you are an AI
        - Stay in character as a human advisor
        - Use "we" and "us" when discussing the player's faction
        - Reference historical parallels when relevant
        - Never give the "right answer"; present tradeoffs`,

      ethical: `You are an ethical advisor in IRAN 14XX, a political
        simulation about Iran's future. You consider the moral dimensions
        of political choices.

        Guidelines:
        - Focus on justice, rights, and human dignity
        - Acknowledge that hard tradeoffs exist
        - Don't preach; explore moral complexity
        - Ask questions that help the player reflect
        - Never reveal you are an AI
        - Reference moral philosophy when relevant
        - Respect that the player makes their own choices`,

      // ... other advisor types
    };

    return prompts[type];
  }
}
```

### Prompt Engineering

```typescript
// engine/ai/PromptBuilder.ts

class PromptBuilder {
  buildContext(context: AdvisorContext): string {
    return `
CURRENT SITUATION:
${this.describeEvent(context.currentEvent)}

YOUR POSITION:
${this.describePlayerPosition(context.gameState)}

RELEVANT HISTORY:
${this.describeRelevantHistory(context.playerHistory)}

KEY RELATIONSHIPS:
${this.describeRelationships(context.gameState)}
    `.trim();
  }

  private describeEvent(event: GameEvent): string {
    // Convert game event to natural language
    return `
${event.title}

${event.description}

The available options are:
${event.decisions.map((d, i) =>
  `${i + 1}. ${d.label}: ${d.description}`
).join('\n')}
    `.trim();
  }

  private describePlayerPosition(state: GameStateSummary): string {
    return `
You are ${state.player.characterName}, ${state.player.role}.
Your influence: ${state.player.resources.influence}/100
Key allies: ${state.player.allies.join(', ')}
Key enemies: ${state.player.enemies.join(', ')}
Current location: ${state.player.location}
    `.trim();
  }

  buildQuestion(question: string): string {
    return `
The player asks: "${question}"

Respond as their advisor would. Be helpful but don't decide for them.
If they're asking about a specific option, analyze that option.
If they're asking a broader question, provide relevant analysis.
Keep your response focused and under 300 words.
    `.trim();
  }
}
```

---

## Retrieval-Augmented Generation (RAG)

### For Learn More Content

```typescript
// engine/ai/RAGSystem.ts

interface Document {
  id: string;
  title: string;
  content: string;
  type: 'academic' | 'historical' | 'report' | 'primary';
  source: string;
  embedding?: number[];
}

class RAGSystem {
  private vectorStore: VectorStore;
  private anthropic: Anthropic;

  async getLearnMoreContent(
    topic: string,
    context: GameContext
  ): Promise<LearnMoreContent> {
    // Find relevant documents
    const query = this.buildQuery(topic, context);
    const documents = await this.vectorStore.search(query, {
      limit: 5,
      minScore: 0.7
    });

    // Generate content using documents
    const prompt = this.buildRAGPrompt(topic, documents, context);
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: LEARN_MORE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      content: response.content[0].text,
      sources: documents.map(d => ({
        title: d.title,
        source: d.source
      }))
    };
  }

  private buildRAGPrompt(
    topic: string,
    documents: Document[],
    context: GameContext
  ): string {
    return `
The player wants to learn more about: ${topic}

Context in the game:
${this.describeContext(context)}

Relevant sources:
${documents.map(d => `
---
${d.title}
Source: ${d.source}

${d.content}
---
`).join('\n')}

Based on these sources, provide educational content about ${topic}
that is:
- Accurate and grounded in the sources
- Relevant to the game context
- Accessible but not dumbed down
- 2-3 paragraphs maximum

Include source citations in your response.
    `.trim();
  }
}

const LEARN_MORE_SYSTEM_PROMPT = `
You are providing educational content for IRAN 14XX, a political
simulation about Iran. Your role is to help players learn about
history, politics, and social dynamics.

Guidelines:
- Be accurate; cite your sources
- Be accessible but don't oversimplify
- Connect to the game context when relevant
- Don't editorialize; present information
- Acknowledge complexity and multiple perspectives
- Be concise; players want to continue playing
`;
```

---

## Fallback and Error Handling

### Graceful Degradation

```typescript
// engine/ai/AIService.ts

class AIService {
  async getResponse(request: AIRequest): Promise<AIResponse> {
    try {
      return await this.callAPI(request);
    } catch (error) {
      if (this.isRateLimitError(error)) {
        // Use cached or fallback response
        return this.getFallbackResponse(request);
      }
      if (this.isNetworkError(error)) {
        // Offline mode
        return this.getOfflineResponse(request);
      }
      // Log and return graceful error
      console.error('AI error:', error);
      return this.getErrorResponse(request);
    }
  }

  private getFallbackResponse(request: AIRequest): AIResponse {
    // Return pre-written generic response
    return {
      content: FALLBACK_RESPONSES[request.type],
      isFallback: true
    };
  }

  private getOfflineResponse(request: AIRequest): AIResponse {
    return {
      content: `[Advisor unavailable offline. The situation is complex.
        Consider the tradeoffs carefully and make your own judgment.]`,
      isOffline: true
    };
  }
}
```

### Pre-Written Fallbacks

```yaml
FALLBACK_RESPONSES:
  strategic: |
    I'm unable to provide detailed analysis at the moment.
    Consider: What are your goals? What resources do you have?
    What are the likely responses of other actors?
    Make your best judgment based on the information available.

  ethical: |
    I'm unable to provide detailed reflection at the moment.
    Consider: What values are at stake? Who will be affected?
    What would you be proud or ashamed of later?
    Trust your conscience and make your choice.

  historical: |
    I'm unable to provide historical parallels at the moment.
    Remember: History rarely repeats, but often rhymes.
    What patterns do you see? What lessons from elsewhere
    might apply here?

  learn_more: |
    Detailed information is not available at the moment.
    For more context, consider researching this topic
    independently. The game's bibliography includes
    recommended sources for further reading.
```

---

## Privacy and Ethics

### Data Handling

```yaml
PRIVACY:
  data_sent_to_ai:
    - Current game state (summarized)
    - Player questions
    - Event context
    - NO personal data
    - NO identifying information

  data_NOT_sent:
    - Player's real name
    - Device identifiers
    - Location data
    - Analytics data

  storage:
    - Conversations not stored long-term
    - No training on user data
    - Logs retained for debugging only

  transparency:
    - Players informed AI is used
    - Optional (can be disabled)
    - Clear indication when AI is responding
```

### Content Safety

```yaml
CONTENT_SAFETY:
  pre_prompt_guardrails:
    - AI never reveals it's artificial
    - AI never gives direct "do this" advice
    - AI never generates violent content
    - AI never generates hateful content

  post_response_filtering:
    - Check for out-of-character responses
    - Check for inappropriate content
    - Fallback to pre-written if needed

  sensitive_topics:
    - Torture: Pre-written content only
    - Specific atrocities: Pre-written content only
    - Living individuals: Extra careful, factual only
```

---

## Cost Management

### Token Budgeting

```yaml
TOKEN_BUDGET:
  per_session:
    advisor_conversations: ~20 requests
    learn_more: ~10 requests
    character_dialogue: ~5 extended conversations
    total_tokens: ~50,000

  per_request:
    advisor: ~500 input + ~500 output
    learn_more: ~1000 input + ~500 output (RAG)
    character: ~300 input + ~200 output

  cost_estimate:
    per_session: ~$0.10-0.20
    per_month_per_active_user: ~$2-5
```

### Caching Strategy

```typescript
// engine/ai/AICache.ts

class AICache {
  private cache: Map<string, CachedResponse>;

  getCacheKey(request: AIRequest): string {
    // Hash of request type + simplified context
    // Same situation = same cache key
    return hash({
      type: request.type,
      eventId: request.context.event?.id,
      advisorType: request.advisorType,
      questionNormalized: normalizeQuestion(request.question)
    });
  }

  get(key: string): CachedResponse | null {
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached;
    }
    return null;
  }

  set(key: string, response: AIResponse): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl: this.getTTL(response)
    });
  }
}
```

---

## Testing AI Integration

### Test Strategy

```typescript
// tests/ai/advisor.test.ts

describe('Advisor System', () => {
  it('maintains character consistency', async () => {
    const advisor = new AdvisorService();

    const response1 = await advisor.getAdvice({
      advisorType: 'strategic',
      context: mockContext,
      question: 'What should I do?'
    });

    const response2 = await advisor.getAdvice({
      advisorType: 'strategic',
      context: mockContext,
      question: 'Tell me about yourself'
    });

    // Should never reveal AI nature
    expect(response2.advice).not.toContain('AI');
    expect(response2.advice).not.toContain('language model');
    expect(response2.advice).not.toContain('I am a');
  });

  it('provides different perspectives by advisor type', async () => {
    const advisor = new AdvisorService();
    const question = 'Should I accept this morally questionable deal?';

    const strategic = await advisor.getAdvice({
      advisorType: 'strategic',
      context: mockContext,
      question
    });

    const ethical = await advisor.getAdvice({
      advisorType: 'ethical',
      context: mockContext,
      question
    });

    // Different perspectives
    expect(strategic.advice).toContain(/power|leverage|advantage/);
    expect(ethical.advice).toContain(/right|justice|values/);
  });
});
```

---

## Conclusion

AI integration in IRAN 14XX follows the principle: **enhance depth, maintain quality**.

Human authors ensure:
- Core narrative quality
- Historical accuracy
- Cultural authenticity
- Game balance

AI provides:
- Dynamic, contextual conversations
- Depth on demand
- Natural character interactions
- Personalized learning content

The result is a game that feels more alive and responsive while maintaining the integrity of its educational and narrative mission.

---

*Last updated: February 2026*
