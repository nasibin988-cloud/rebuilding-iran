'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

interface RubricItem {
  criterion: string;
  weight: number;
  name?: string;
  description?: string;
}

interface AIQuestion {
  id: string;
  lecture: number;
  type: string;
  question: string;
  context: string;
  model_answer: string;
  grading_rubric: RubricItem[] | { criteria: RubricItem[]; passing_score: number };
  section: string;
  sectionName: string;
  sectionCode: string;
  tier?: string;
}

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'standard', label: 'Standard' },
  { value: 'extended', label: 'Extended' },
  { value: 'scholarly', label: 'Scholarly' },
];

interface AIFeedback {
  score: number;
  criterionScores: { criterion: string; score: number; comment: string }[];
  strengths: string[];
  improvements: string[];
  overallComment: string;
}

interface HistoryEntry {
  questionId: string;
  date: number;
  score: number;
  response: string;
  feedback: AIFeedback;
}

const LS_KEY_HISTORY = 'iran-practice-history';
const LS_KEY_API = 'iran-openai-key';
const MAX_HISTORY = 50;

function getRubricItems(rubric: AIQuestion['grading_rubric']): RubricItem[] {
  if (Array.isArray(rubric)) return rubric;
  if (rubric && 'criteria' in rubric) return rubric.criteria;
  return [];
}

function getRubricText(items: RubricItem[]): string {
  return items.map(r => {
    const label = r.criterion || r.name || r.description || '';
    return `- ${label} (${Math.round(r.weight * 100)}%)`;
  }).join('\n');
}

function scoreColor(score: number): string {
  if (score <= 3) return 'text-red-500';
  if (score <= 6) return 'text-saffron-500';
  if (score <= 8) return 'text-emerald-500';
  return 'text-turquoise-500';
}

function scoreBg(score: number): string {
  if (score <= 3) return 'bg-red-100 dark:bg-red-900/30';
  if (score <= 6) return 'bg-saffron-100 dark:bg-saffron-900/30';
  if (score <= 8) return 'bg-emerald-100 dark:bg-emerald-900/30';
  return 'bg-turquoise-100 dark:bg-turquoise-900/30';
}

export default function PracticePage() {
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<AIQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showModel, setShowModel] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [view, setView] = useState<'browse' | 'question' | 'history'>('browse');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/data/ai-questions.json');
        const data: AIQuestion[] = await res.json();
        setQuestions(data);
      } catch {
        setQuestions([]);
      }
      // Load API key
      const envKey = typeof window !== 'undefined' ? (window as unknown as Record<string, string>).__NEXT_PUBLIC_OPENAI_API_KEY : undefined;
      const savedKey = localStorage.getItem(LS_KEY_API) || '';
      setApiKey(envKey || savedKey);
      // Load history
      const savedHistory = localStorage.getItem(LS_KEY_HISTORY);
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch {}
      }
      setLoaded(true);
    }
    load();
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) {
      if (!map.has(q.section)) map.set(q.section, q.sectionName);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (selectedSection !== 'all' && q.section !== selectedSection) return false;
      if (selectedTier !== 'all' && (q.tier || 'standard') !== selectedTier) return false;
      return true;
    });
  }, [questions, selectedSection, selectedTier]);

  const wordCount = useMemo(() => {
    return userAnswer.split(/\s+/).filter(w => w).length;
  }, [userAnswer]);

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem(LS_KEY_API, key);
    setShowApiKeyInput(false);
  }, []);

  const gradeAnswer = useCallback(async () => {
    if (!selectedQuestion || !apiKey || wordCount < 50) return;

    setGrading(true);
    setGradingError(null);
    setFeedback(null);

    const rubricItems = getRubricItems(selectedQuestion.grading_rubric);
    const rubricText = getRubricText(rubricItems);

    const systemPrompt = `You are an assessor for "Rebuilding Iran," an educational curriculum preparing Iranians for civic participation in a future democratic Iran.

THE CURRICULUM covers:
- Iranian history from ancient Persia through the Islamic Republic
- Political philosophy (Plato, Aristotle, social contract theory, liberalism)
- Democratic transitions (Spain, Poland, South Korea, South Africa)
- Economics, governance, and nation-building
- The goal: a democratic, pluralistic Iran respecting human rights

GRADING PRINCIPLES:
1. Value SPECIFICITY - reward answers citing Iranian history, named scholars, or concrete examples
2. Value NUANCE - good answers acknowledge complexity and tradeoffs
3. Value APPLICATION - connecting theory to Iran's specific context
4. Penalize VAGUENESS - generic statements without evidence
5. Penalize CONTRADICTION - positions that undermine curriculum's democratic values
6. Do NOT expect Western-centric answers - valid arguments may draw from Persian/Islamic tradition

Return your evaluation as JSON:
{
  "score": <number 1-10>,
  "criterionScores": [
    {"criterion": "<name>", "score": <1-10>, "comment": "<brief>"}
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "overallComment": "<2-3 sentences>"
}

SCORING GUIDE:
- 9-10: Exceptional - specific evidence, nuanced analysis, Iran-specific application
- 7-8: Solid - demonstrates understanding, some specificity, minor gaps
- 5-6: Adequate - basic understanding but vague or incomplete
- 3-4: Weak - significant misunderstandings or mostly generic
- 1-2: Poor - fails to engage with the question meaningfully`;

    const userPrompt = `QUESTION: ${selectedQuestion.question}

CONTEXT: ${selectedQuestion.context || 'None provided'}

GRADING RUBRIC:
${rubricText}

MODEL ANSWER (for reference — the student's answer need not match this exactly):
${selectedQuestion.model_answer}

STUDENT'S RESPONSE:
${userAnswer}

Grade this response. Return ONLY the JSON object.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format from AI');

      const parsed = JSON.parse(jsonMatch[0]) as AIFeedback;
      if (!parsed.score || parsed.score < 1 || parsed.score > 10) {
        throw new Error('Invalid score from AI');
      }

      setFeedback(parsed);

      // Save to history
      const entry: HistoryEntry = {
        questionId: selectedQuestion.id,
        date: Date.now(),
        score: parsed.score,
        response: userAnswer,
        feedback: parsed,
      };
      setHistory(prev => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY);
        localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(next));
        return next;
      });
    } catch (err) {
      setGradingError(err instanceof Error ? err.message : 'Failed to grade response');
    } finally {
      setGrading(false);
    }
  }, [selectedQuestion, apiKey, userAnswer, wordCount]);

  const openQuestion = useCallback((q: AIQuestion) => {
    setSelectedQuestion(q);
    setUserAnswer('');
    setShowModel(false);
    setFeedback(null);
    setGradingError(null);
    setView('question');
  }, []);

  const backToBrowse = useCallback(() => {
    setSelectedQuestion(null);
    setView('browse');
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-shimmer w-48 h-6 rounded" />
      </div>
    );
  }

  // API Key Input Modal
  if (showApiKeyInput) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="glass-card rounded-xl p-8">
          <h2 className="text-lg font-bold mb-4">OpenAI API Key</h2>
          <p className="text-sm text-dark-500 dark:text-dark-400 mb-4">
            Enter your OpenAI API key to enable AI grading. Your key is stored locally and never sent to any server other than OpenAI.
          </p>
          <input
            type="password"
            placeholder="sk-..."
            defaultValue={apiKey}
            className="w-full px-4 py-3 rounded-lg text-sm bg-dark-100 dark:bg-dark-800 outline-none focus:ring-2 focus:ring-persian-500/50 mb-4"
            onKeyDown={e => {
              if (e.key === 'Enter') saveApiKey((e.target as HTMLInputElement).value);
            }}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                if (input?.value) saveApiKey(input.value);
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors"
            >
              Save Key
            </button>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // History view
  if (view === 'history') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Practice History</h1>
            <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">{history.length} graded responses</p>
          </div>
          <button
            onClick={() => setView('browse')}
            className="flex items-center gap-2 text-sm text-dark-500 hover:text-persian-600 dark:hover:text-persian-400 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16 text-dark-400">No graded responses yet. Answer a question and use AI grading to get started.</div>
        ) : (
          <div className="space-y-3">
            {history.map((entry, i) => {
              const q = questions.find(q => q.id === entry.questionId);
              return (
                <div key={i} className="glass-card rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${scoreBg(entry.score)} flex items-center justify-center`}>
                      <span className={`text-lg font-bold ${scoreColor(entry.score)}`}>{entry.score}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{q?.question || entry.questionId}</p>
                      <p className="text-2xs text-dark-400 mt-0.5">
                        {q?.sectionName || ''} &middot; {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {entry.feedback.overallComment && (
                    <p className="text-sm text-dark-500 dark:text-dark-400 mt-3 leading-relaxed">{entry.feedback.overallComment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Question detail view
  if (view === 'question' && selectedQuestion) {
    const rubricItems = getRubricItems(selectedQuestion.grading_rubric);

    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={backToBrowse}
          className="flex items-center gap-2 text-sm text-dark-500 hover:text-persian-600 dark:hover:text-persian-400 transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Back to Questions
        </button>

        <div className="glass-card rounded-xl p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xs px-2 py-0.5 rounded bg-persian-100 dark:bg-persian-900/30 text-persian-700 dark:text-persian-300">
              {selectedQuestion.type}
            </span>
            <span className="text-2xs text-dark-400">
              {selectedQuestion.sectionName} &middot; Lecture {selectedQuestion.lecture}
            </span>
          </div>

          <h2 className="text-lg font-bold leading-relaxed mb-4">{selectedQuestion.question}</h2>

          {selectedQuestion.context && (
            <div className="bg-dark-100 dark:bg-dark-800/60 rounded-lg p-4 mb-6">
              <h3 className="text-2xs font-semibold uppercase tracking-wider text-dark-400 mb-2">Context</h3>
              <p className="text-sm text-dark-600 dark:text-dark-300 leading-relaxed">{selectedQuestion.context}</p>
            </div>
          )}

          {/* Answer area */}
          <textarea
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="Write your answer here..."
            className="w-full h-48 bg-dark-50 dark:bg-dark-800/40 rounded-lg p-4 outline-none text-sm leading-relaxed placeholder:text-dark-400 resize-y border border-dark-200 dark:border-dark-700 focus:ring-2 focus:ring-persian-500/50"
            disabled={grading}
          />

          <div className="flex items-center justify-between mt-4">
            <span className={`text-2xs ${wordCount < 50 ? 'text-dark-400' : 'text-turquoise-600 dark:text-turquoise-400'}`}>
              {wordCount} words {wordCount < 50 ? '(minimum 50)' : ''}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModel(!showModel)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
              >
                {showModel ? 'Hide' : 'Show'} Model Answer
              </button>
              {apiKey ? (
                <button
                  onClick={gradeAnswer}
                  disabled={grading || wordCount < 50}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors disabled:opacity-50"
                >
                  {grading ? 'Grading...' : 'Grade My Answer'}
                </button>
              ) : (
                <button
                  onClick={() => setShowApiKeyInput(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors"
                >
                  Set API Key to Grade
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grading error */}
        {gradingError && (
          <div className="glass-card rounded-xl p-4 mb-4 border border-red-300 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{gradingError}</p>
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="text-2xs text-persian-600 dark:text-persian-400 hover:underline mt-2"
            >
              Update API Key
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {grading && (
          <div className="glass-card rounded-xl p-8 mb-4 text-center">
            <div className="loading-shimmer w-32 h-4 rounded mx-auto mb-3" />
            <p className="text-sm text-dark-400">AI is evaluating your response...</p>
          </div>
        )}

        {/* AI Feedback */}
        {feedback && (
          <div className="space-y-4 mb-6">
            {/* Score */}
            <div className={`glass-card rounded-xl p-6 ${scoreBg(feedback.score)}`}>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${scoreColor(feedback.score)}`}>{feedback.score}</div>
                  <div className="text-2xs text-dark-400 mt-1">out of 10</div>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{feedback.overallComment}</p>
                </div>
              </div>
            </div>

            {/* Criterion scores */}
            {feedback.criterionScores && feedback.criterionScores.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-3 text-persian-600 dark:text-persian-400">Criterion Breakdown</h3>
                <div className="space-y-3">
                  {feedback.criterionScores.map((cs, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{cs.criterion}</span>
                        <span className={`text-sm font-bold ${scoreColor(cs.score)}`}>{cs.score}/10</span>
                      </div>
                      <p className="text-2xs text-dark-500 dark:text-dark-400">{cs.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-4">
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2 text-turquoise-600 dark:text-turquoise-400">Strengths</h3>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-2xs text-dark-600 dark:text-dark-300 flex items-start gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-turquoise-500 shrink-0 mt-0.5"><path d="M20 6L9 17l-5-5"/></svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2 text-saffron-600 dark:text-saffron-400">Areas to Improve</h3>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-2xs text-dark-600 dark:text-dark-300 flex items-start gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-saffron-500 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Model answer */}
        {showModel && (
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-3 text-turquoise-600 dark:text-turquoise-400">Model Answer</h3>
              <p className="text-sm text-dark-600 dark:text-dark-300 leading-relaxed whitespace-pre-line">{selectedQuestion.model_answer}</p>
            </div>

            {rubricItems.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-3 text-saffron-600 dark:text-saffron-400">Grading Rubric</h3>
                <div className="space-y-2">
                  {rubricItems.map((r, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-2xs font-mono text-dark-400 shrink-0 mt-0.5">
                        {Math.round(r.weight * 100)}%
                      </span>
                      <span className="text-sm text-dark-600 dark:text-dark-300">{r.criterion || r.name || r.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Browse view
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Practice Questions</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
            {questions.length} essay questions across {sections.length} sections
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('history')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            History ({history.length})
          </button>
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            {apiKey ? 'API Key Set' : 'Set API Key'}
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-dark-500 hover:text-persian-600 dark:hover:text-persian-400 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Home
          </Link>
        </div>
      </div>

      {/* Tier + Section filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {TIER_OPTIONS.map(t => (
          <button
            key={t.value}
            onClick={() => setSelectedTier(t.value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              selectedTier === t.value
                ? 'bg-persian-600 text-white'
                : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700'
            }`}
          >
            {t.label}
          </button>
        ))}
        <select
          value={selectedSection}
          onChange={e => setSelectedSection(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm bg-dark-100 dark:bg-dark-800 outline-none"
        >
          <option value="all">All Sections</option>
          {sections.map(([num, name]) => (
            <option key={num} value={num}>{num}. {name}</option>
          ))}
        </select>
        <span className="text-2xs text-dark-400">{filtered.length} questions</span>
      </div>

      {/* Questions grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-dark-400">No questions available.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const pastAttempts = history.filter(h => h.questionId === q.id);
            const bestScore = pastAttempts.length > 0 ? Math.max(...pastAttempts.map(h => h.score)) : null;

            return (
              <button
                key={q.id}
                onClick={() => openQuestion(q)}
                className="w-full glass-card rounded-lg p-4 text-left hover:ring-2 hover:ring-persian-500/30 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-dark-400 shrink-0 mt-0.5">{q.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-persian-600 dark:group-hover:text-persian-400 transition-colors leading-relaxed">
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xs text-dark-400">{q.sectionName}</span>
                      <span className="text-2xs text-dark-400">&middot;</span>
                      <span className="text-2xs text-dark-400">Lecture {q.lecture}</span>
                    </div>
                  </div>
                  {bestScore !== null && (
                    <span className={`text-sm font-bold ${scoreColor(bestScore)} shrink-0`}>
                      {bestScore}/10
                    </span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-400 shrink-0 mt-1">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
