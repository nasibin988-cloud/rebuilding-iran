'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

interface MCQuestion {
  id: string;
  lecture: number;
  type: string;
  question: string;
  options: Record<string, string>;
  correct: string;
  explanation: string;
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

const LS_KEY = 'iran-quiz-scores';

export default function QuizPage() {
  const [questions, setQuestions] = useState<MCQuestion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [quizMode, setQuizMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [scores, setScores] = useState<Record<string, { correct: number; total: number }>>({});
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/data/mc-questions.json');
        const data: MCQuestion[] = await res.json();
        setQuestions(data);
      } catch {
        setQuestions([]);
      }
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        try { setScores(JSON.parse(saved)); } catch {}
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

  const startQuiz = useCallback(() => {
    // Shuffle questions
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQuestions(prev => {
      // Replace the filtered set in order
      const rest = prev.filter(q => selectedSection === 'all' || q.section !== selectedSection);
      return [...shuffled, ...rest];
    });
    setQuizMode(true);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setSessionStats({ correct: 0, total: 0 });
  }, [filtered, selectedSection]);

  const submitAnswer = useCallback((answer: string) => {
    if (selectedAnswer) return; // Already answered
    setSelectedAnswer(answer);
    const q = filtered[currentIdx];
    const isCorrect = answer === q.correct;

    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // Update persistent scores
    setScores(prev => {
      const sectionScore = prev[q.section] || { correct: 0, total: 0 };
      const next = {
        ...prev,
        [q.section]: {
          correct: sectionScore.correct + (isCorrect ? 1 : 0),
          total: sectionScore.total + 1,
        },
      };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, [selectedAnswer, filtered, currentIdx]);

  const nextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentIdx(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!quizMode) return;
    const handler = (e: KeyboardEvent) => {
      if (!selectedAnswer) {
        if (e.key === 'a' || e.key === 'A' || e.key === '1') submitAnswer('A');
        else if (e.key === 'b' || e.key === 'B' || e.key === '2') submitAnswer('B');
        else if (e.key === 'c' || e.key === 'C' || e.key === '3') submitAnswer('C');
        else if (e.key === 'd' || e.key === 'D' || e.key === '4') submitAnswer('D');
      } else {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (showExplanation) nextQuestion();
          else setShowExplanation(true);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [quizMode, selectedAnswer, showExplanation, submitAnswer, nextQuestion]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-shimmer w-48 h-6 rounded" />
      </div>
    );
  }

  // Quiz complete
  if (quizMode && currentIdx >= filtered.length) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-turquoise-100 dark:bg-turquoise-900/30 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-turquoise-500">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Quiz Complete!</h1>
        <p className="text-dark-500 dark:text-dark-400 mb-6">
          You scored {sessionStats.correct}/{sessionStats.total} ({sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%)
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setQuizMode(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors"
          >
            Back to Sections
          </button>
          <button
            onClick={startQuiz}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Quiz in progress
  if (quizMode) {
    const q = filtered[currentIdx];
    const remaining = filtered.length - currentIdx;

    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setQuizMode(false)}
            className="flex items-center gap-2 text-sm text-dark-500 hover:text-persian-600 dark:hover:text-persian-400 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Exit
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-dark-500 dark:text-dark-400">{remaining} remaining</span>
            <span className="text-2xs text-dark-400">{sessionStats.correct}/{sessionStats.total} correct</span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1 bg-dark-200 dark:bg-dark-800 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-persian-500 to-turquoise-500 rounded-full transition-all duration-300"
            style={{ width: `${filtered.length > 0 ? ((currentIdx / filtered.length) * 100) : 0}%` }}
          />
        </div>

        {/* Question */}
        <div className="glass-card rounded-xl p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xs px-2 py-0.5 rounded bg-persian-100 dark:bg-persian-900/30 text-persian-700 dark:text-persian-300">{q.type}</span>
            <span className="text-2xs text-dark-400">{q.sectionName} &middot; Lecture {q.lecture}</span>
          </div>
          <p className="text-lg leading-relaxed mb-6">{q.question}</p>

          <div className="space-y-3">
            {Object.entries(q.options).map(([key, value]) => {
              const isSelected = selectedAnswer === key;
              const isCorrect = key === q.correct;
              const showResult = selectedAnswer !== null;

              let className = 'w-full flex items-start gap-3 p-4 rounded-lg text-left text-sm transition-colors border ';
              if (showResult && isCorrect) {
                className += 'border-turquoise-500 bg-turquoise-50 dark:bg-turquoise-900/20 text-turquoise-700 dark:text-turquoise-300';
              } else if (showResult && isSelected && !isCorrect) {
                className += 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
              } else if (!showResult) {
                className += 'border-dark-200 dark:border-dark-700 hover:border-persian-400 dark:hover:border-persian-600 hover:bg-dark-50 dark:hover:bg-dark-800/60 cursor-pointer';
              } else {
                className += 'border-dark-200 dark:border-dark-700 opacity-60';
              }

              return (
                <button
                  key={key}
                  onClick={() => submitAnswer(key)}
                  disabled={selectedAnswer !== null}
                  className={className}
                >
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center shrink-0 text-xs font-bold">
                    {key}
                  </span>
                  <span className="flex-1">{value}</span>
                  {showResult && isCorrect && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation / Continue */}
        {selectedAnswer && (
          <div className="space-y-4">
            {showExplanation ? (
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-2 text-turquoise-600 dark:text-turquoise-400">Explanation</h3>
                <p className="text-sm text-dark-600 dark:text-dark-300 leading-relaxed">{q.explanation}</p>
              </div>
            ) : (
              <button
                onClick={() => setShowExplanation(true)}
                className="w-full py-2 text-sm text-persian-600 dark:text-persian-400 hover:underline"
              >
                Show Explanation
              </button>
            )}
            <button
              onClick={nextQuestion}
              className="w-full py-3 rounded-xl text-sm font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors"
            >
              {currentIdx + 1 < filtered.length ? 'Next Question (Space)' : 'Finish Quiz (Space)'}
            </button>
          </div>
        )}

        <p className="text-center text-2xs text-dark-400 mt-4">
          Keyboard: A-D to answer, Space to continue
        </p>
      </div>
    );
  }

  // Section picker
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Multiple Choice Quiz</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
            {questions.length} questions across {sections.length} sections
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-dark-500 hover:text-persian-600 dark:hover:text-persian-400 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Home
        </Link>
      </div>

      {/* Tier filter */}
      <div className="flex items-center gap-3 mb-6">
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
        <span className="text-2xs text-dark-400 ml-auto">{filtered.length} questions</span>
      </div>

      {/* Quick Quiz Options */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Quiz Me - Random 20 from all sections */}
        <button
          onClick={() => {
            setSelectedSection('all');
            // Shuffle and take 20 random questions
            const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 20);
            setQuestions(prev => [...shuffled, ...prev.filter(q => !shuffled.includes(q))]);
            setQuizMode(true);
            setCurrentIdx(0);
            setSelectedAnswer(null);
            setShowExplanation(false);
            setSessionStats({ correct: 0, total: 0 });
          }}
          className="glass-card rounded-xl p-6 text-left hover:ring-2 hover:ring-turquoise-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-turquoise-500 to-persian-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold group-hover:text-turquoise-400 transition-colors">Quiz Me!</h2>
              <p className="text-sm text-dark-500 dark:text-dark-400">20 random questions to test your knowledge</p>
            </div>
          </div>
        </button>

        {/* All sections button */}
        <button
          onClick={() => { setSelectedSection('all'); startQuiz(); }}
          className="glass-card rounded-xl p-6 text-left hover:ring-2 hover:ring-persian-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-persian-500 to-saffron-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold group-hover:text-persian-400 transition-colors">All Sections</h2>
              <p className="text-sm text-dark-500 dark:text-dark-400">{filtered.length} questions comprehensive</p>
            </div>
          </div>
        </button>
      </div>

      {/* Section cards */}
      <div className="grid gap-3">
        {sections.map(([num, name]) => {
          const count = questions.filter(q => q.section === num).length;
          const score = scores[num];
          const pct = score ? Math.round((score.correct / score.total) * 100) : null;

          return (
            <button
              key={num}
              onClick={() => { setSelectedSection(num); setTimeout(startQuiz, 0); }}
              className="glass-card rounded-lg p-4 text-left hover:ring-2 hover:ring-persian-500/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-persian-600 dark:text-persian-400 opacity-60 w-8">
                  {num}
                </span>
                <span className="flex-1 text-sm font-medium group-hover:text-persian-600 dark:group-hover:text-persian-400 transition-colors">
                  {name}
                </span>
                <span className="text-2xs text-dark-400">{count} Q</span>
                {pct !== null && (
                  <span className={`text-2xs font-medium ${pct >= 70 ? 'text-turquoise-600 dark:text-turquoise-400' : 'text-saffron-600 dark:text-saffron-400'}`}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
