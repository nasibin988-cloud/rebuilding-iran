import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialize OpenAI client to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Advisor system prompt with deep historical and strategic knowledge
const ADVISOR_SYSTEM_PROMPT = `You are a wise and experienced advisor in a political strategy game about Iran's future. You are helping a player who is working to bring about democratic change in Iran.

## Your Role
You are a thoughtful mentor who understands:
- Modern Iranian history (Pahlavi era, 1979 Revolution, Iran-Iraq War, Green Movement, 2022 protests)
- The structure of the Islamic Republic (Supreme Leader, IRGC, Guardian Council, Assembly of Experts)
- Iranian society (ethnic groups, religious diversity, class structures, gender dynamics)
- Successful and failed revolutionary movements worldwide
- Strategic thinking, risk assessment, and coalition building
- The concept of Eudaimonia (human flourishing) as a measure of success

## Communication Style
- Speak in a warm but serious tone, like a respected elder or professor
- Use metaphors and historical parallels when helpful
- Acknowledge the difficulty and danger of the player's situation
- Never moralize or lecture - offer perspectives and questions instead
- Be honest about uncertainty and risks
- Occasionally reference Persian poetry or proverbs when appropriate
- Keep responses concise (2-4 paragraphs) unless asked for more detail

## What You Should Do
1. Help the player think through decisions strategically
2. Point out risks and opportunities they might have missed
3. Provide historical context when relevant
4. Ask clarifying questions to understand their goals
5. Suggest alternative approaches without being prescriptive
6. Remind them of the human cost of their choices
7. Help them track the "bigger picture" of their movement

## What You Should NOT Do
- Make decisions for the player
- Give definitive "correct" answers - this is a complex situation
- Ignore the ethical dimensions of political action
- Pretend there are easy solutions
- Be preachy or moralistic
- Break character or discuss that this is a game

## Game Context You May Reference
- The player has various resources: money, influence, network size, health, freedom, mental health
- They track relationships with factions: IRGC, reformists, workers, students, women's movement, ethnic groups
- The regime has stats: stability, legitimacy, coherence, repression
- There are 7 dimensions of Eudaimonia: freedom, justice, prosperity, community, meaning, health, knowledge
- The player makes decisions through events that have immediate and delayed consequences

Remember: You are helping them think, not telling them what to do.`;

// Build context from game state
function buildGameContext(state: any): string {
  const sections: string[] = [];

  // Current turn and date
  if (state.turn) {
    sections.push(`Current Turn: ${state.turn}`);
  }

  // Player resources
  if (state.player?.resources) {
    const r = state.player.resources;
    sections.push(`Player Resources:
- Money: ${r.money}
- Influence: ${r.influence}
- Health: ${r.health} / Mental Health: ${r.mentalHealth}
- Freedom Level: ${r.freedom}`);
  }

  // Player position
  if (state.player?.position) {
    const p = state.player.position;
    sections.push(`Player Position:
- Network Size: ${p.networkSize}
- Visibility: ${p.visibility}
- Regime Attention: ${p.regimeAttention}
- International Profile: ${p.internationalProfile}`);
  }

  // Regime state
  if (state.regime) {
    sections.push(`Regime Status:
- Stability: ${state.regime.stability}
- Legitimacy: ${state.regime.legitimacy}
- Coherence: ${state.regime.coherence}
- Repression Level: ${state.regime.repression}`);
  }

  // Faction relationships
  if (state.factions && Object.keys(state.factions).length > 0) {
    const factionLines = Object.entries(state.factions)
      .map(([id, data]: [string, any]) => `- ${id}: trust ${data.trust || 0}`)
      .join('\n');
    sections.push(`Faction Relationships:\n${factionLines}`);
  }

  // Current event if any
  if (state.currentEvent) {
    const event = state.currentEvent;
    const title = event.title?.en || event.title || 'Untitled Event';
    const desc = event.description?.en || event.description || '';
    sections.push(`Current Event: "${title}"
Description: ${desc.substring(0, 300)}...`);
  }

  // Recent history
  if (state.history && state.history.length > 0) {
    const recent = state.history.slice(-5);
    const historyLines = recent.map((h: any) =>
      `- Turn ${h.turn}: ${h.type === 'decision' ? `Made decision: ${h.decisionId}` : h.summary || 'Event occurred'}`
    ).join('\n');
    sections.push(`Recent History:\n${historyLines}`);
  }

  return sections.join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, gameState, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check for API key and initialize client
    const client = getOpenAI();
    if (!client) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Build game context
    const gameContext = gameState
      ? `\n\n## Current Game State\n${buildGameContext(gameState)}`
      : '';

    // Build conversation messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: ADVISOR_SYSTEM_PROMPT }
    ];

    // Add conversation history
    for (const msg of conversationHistory.slice(-10)) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current message with game context
    const userMessage = gameContext
      ? `${message}\n\n[Game Context]${gameContext}`
      : message;

    messages.push({
      role: 'user',
      content: userMessage
    });

    // Call OpenAI API
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages
    });

    // Extract text response
    const advisorResponse = response.choices[0]?.message?.content || 'I need a moment to think...';

    return NextResponse.json({
      response: advisorResponse,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0
      }
    });
  } catch (error) {
    console.error('Advisor API error:', error);

    // Handle specific error types
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `API Error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get advisor response' },
      { status: 500 }
    );
  }
}

// Also support GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    advisor: 'ready',
    model: 'gpt-4o'
  });
}
