'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const DEBATE_TOPICS = [
  {
    id: 'federalism',
    title: 'Federalism vs. Centralism',
    description: 'Should post-transition Iran adopt a federal system with significant regional autonomy, or maintain a centralized unitary state?',
    positions: ['Pro-Federalism', 'Pro-Centralism'],
  },
  {
    id: 'monarchy',
    title: 'Constitutional Monarchy vs. Republic',
    description: 'Should Iran restore a constitutional monarchy (perhaps with the Pahlavi dynasty) or establish a new republic?',
    positions: ['Constitutional Monarchy', 'Republic'],
  },
  {
    id: 'secularism',
    title: 'Strict Secularism vs. Religious Accommodation',
    description: 'Should the new Iran adopt strict French-style laïcité or a more accommodating approach to religion in public life?',
    positions: ['Strict Secularism', 'Religious Accommodation'],
  },
  {
    id: 'economy',
    title: 'Free Market vs. Social Democracy',
    description: 'Should Iran prioritize rapid liberalization and free markets, or adopt a Nordic-style social democratic model?',
    positions: ['Free Market', 'Social Democracy'],
  },
  {
    id: 'justice',
    title: 'Transitional Justice Approaches',
    description: 'How should Iran handle accountability for the Islamic Republic era - truth commissions, prosecutions, or amnesty?',
    positions: ['Prosecution-focused', 'Reconciliation-focused'],
  },
];

export default function DebatePage() {
  const [selectedTopic, setSelectedTopic] = useState<typeof DEBATE_TOPICS[0] | null>(null);
  const [userPosition, setUserPosition] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('iran-openai-key');
    if (saved) setApiKey(saved);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('iran-openai-key', key);
    setShowSettings(false);
  };

  const startDebate = (topic: typeof DEBATE_TOPICS[0], position: string) => {
    setSelectedTopic(topic);
    setUserPosition(position);

    const aiPosition = topic.positions.find(p => p !== position) || topic.positions[1];

    const systemPrompt = `You are a debate partner in the "Rebuilding Iran" educational curriculum - a platform designed to prepare thoughtful Iranians for civic participation in a future democratic Iran.

CONTEXT: This curriculum teaches Iranian history (from ancient Persia through the Islamic Republic), political philosophy (Plato, Aristotle, Locke, Mill), the science of democratic transitions, and practical governance. Users have studied these materials and are practicing defending positions on contested questions.

Topic: ${topic.title}
Description: ${topic.description}

The user is arguing for: ${position}
You are arguing for: ${aiPosition}

YOUR APPROACH:
1. Draw SPECIFICALLY from:
   - Iranian history (Achaemenid administration, Constitutional Revolution, Pahlavi era, etc.)
   - Comparative transitions (Spain, Poland, South Korea, South Africa - both successes and failures)
   - Political philosophy the curriculum covers (virtue ethics, social contract theory, constitutionalism)
   - Iran's specific challenges (ethnic diversity, oil economy, regional geopolitics, diaspora)

2. Be intellectually honest:
   - Acknowledge genuine tradeoffs and uncertainties
   - Steelman the user's position before critiquing
   - Avoid false certainty on genuinely contested questions
   - Note when experts disagree

3. Stay curriculum-aligned:
   - The goal is a democratic, pluralistic Iran that respects human rights
   - Avoid defending authoritarianism, theocracy, or ethnic nationalism
   - Frame debates as "how best to achieve good governance" not "whether to have it"

4. Be pedagogically useful:
   - Ask follow-up questions that deepen thinking
   - Point out assumptions that need defending
   - After each exchange, briefly note (1-5) the strength of the user's argument and why

5. Do NOT:
   - Give generic ChatGPT-style "both sides" non-answers
   - Pretend all positions are equally valid when they aren't
   - Ignore Iran-specific context in favor of abstract theory
   - Be sycophantic - challenge weak arguments respectfully

Start by presenting your opening argument for ${aiPosition} in 2-3 focused paragraphs, drawing on specific historical or theoretical evidence from the curriculum's scope.`;

    setMessages([{ role: 'system', content: systemPrompt }]);

    // Get AI opening
    fetchAIResponse([{ role: 'system', content: systemPrompt }]);
  };

  const fetchAIResponse = async (messageHistory: Message[]) => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: messageHistory.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.8,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error.message}` }]);
      } else {
        const aiMessage = data.choices[0].message.content;
        setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Check your API key.' }]);
    }
    setLoading(false);
  };

  const sendMessage = () => {
    if (!input.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    fetchAIResponse(newMessages);
  };

  const resetDebate = () => {
    setSelectedTopic(null);
    setUserPosition('');
    setMessages([]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Topic selection
  if (!selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Debate Simulator</h1>
            <p className="text-dark-400">Practice defending positions on contested topics about Iran's future</p>
          </div>
          <Link href="/" className="text-sm text-dark-400 hover:text-persian-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </Link>
        </div>

        {!apiKey && (
          <div className="glass-card rounded-xl p-4 mb-6 border-l-4 border-saffron-500">
            <p className="text-sm">
              <span className="font-medium text-saffron-400">API Key Required:</span>{' '}
              You'll need an OpenAI API key for the debate simulator.{' '}
              <button onClick={() => setShowSettings(true)} className="text-persian-400 hover:underline">
                Add key
              </button>
            </p>
          </div>
        )}

        <div className="space-y-4">
          {DEBATE_TOPICS.map(topic => (
            <div key={topic.id} className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-bold mb-2">{topic.title}</h2>
              <p className="text-sm text-dark-400 mb-4">{topic.description}</p>
              <div className="flex flex-wrap gap-2">
                {topic.positions.map(pos => (
                  <button
                    key={pos}
                    onClick={() => startDebate(topic, pos)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-persian-600 hover:bg-persian-700 text-white transition-colors"
                  >
                    Argue for: {pos}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="font-semibold mb-4">OpenAI API Key</h3>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg mb-4"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-lg text-sm bg-dark-700 hover:bg-dark-600">
                  Cancel
                </button>
                <button onClick={() => saveApiKey(apiKey)} className="px-4 py-2 rounded-lg text-sm bg-persian-600 hover:bg-persian-700 text-white">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Debate in progress
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="font-bold">{selectedTopic.title}</h1>
            <p className="text-2xs text-dark-400">
              You: <span className="text-persian-400">{userPosition}</span> vs AI: <span className="text-saffron-400">{selectedTopic.positions.find(p => p !== userPosition)}</span>
            </p>
          </div>
          <button onClick={resetDebate} className="text-sm text-dark-400 hover:text-white">
            End Debate
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.filter(m => m.role !== 'system').map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-persian-600 text-white'
                    : 'glass-card'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass-card rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-dark-400">
                  <div className="w-2 h-2 bg-persian-500 rounded-full animate-pulse" />
                  AI is thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Present your argument..."
            className="flex-1 px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-sm focus:outline-none focus:border-persian-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-xl bg-persian-600 hover:bg-persian-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
