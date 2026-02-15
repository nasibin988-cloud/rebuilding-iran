'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface FlashCard {
  id: string;
  section: string;
  sectionName: string;
  lecture: string;
  type: string;
  front: string;
  back: string;
  fullText: string;
  tier?: string;
  tags: string[];
}

interface CardState {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: number;
}

const LS_KEY = 'iran-srs-state';

function sm2(card: CardState, quality: number): CardState {
  const q = Math.max(0, Math.min(5, quality));
  let { interval, repetitions, easeFactor } = card;

  if (q >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { interval, repetitions, easeFactor, nextReview };
}

const QUALITY_LABELS = [
  { value: 1, label: 'Again', color: 'bg-red-500 hover:bg-red-600' },
  { value: 3, label: 'Hard', color: 'bg-saffron-500 hover:bg-saffron-600' },
  { value: 4, label: 'Good', color: 'bg-persian-500 hover:bg-persian-600' },
  { value: 5, label: 'Easy', color: 'bg-turquoise-500 hover:bg-turquoise-600' },
];

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'standard', label: 'Standard' },
  { value: 'extended', label: 'Extended' },
  { value: 'scholarly', label: 'Scholarly' },
];

const TIER_COLORS: Record<string, string> = {
  standard: 'bg-persian-100 dark:bg-persian-900/30 text-persian-700 dark:text-persian-300',
  extended: 'bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-700 dark:text-turquoise-300',
  scholarly: 'bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-300',
};

export default function ReviewPage() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [dueCards, setDueCards] = useState<FlashCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [tierFilter, setTierFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  // Derive unique sections from loaded cards
  const sections = cards.length > 0
    ? Array.from(new Map(cards.map(c => [c.section, c.sectionName])).entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  useEffect(() => {
    async function loadCards() {
      try {
        const res = await fetch('/data/flashcards.json');
        const data: FlashCard[] = await res.json();
        setCards(data);
      } catch {
        setCards([]);
      }

      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        try {
          setCardStates(JSON.parse(saved));
        } catch {}
      }
      setLoaded(true);
    }
    loadCards();
  }, []);

  useEffect(() => {
    if (!loaded || cards.length === 0) return;
    const now = Date.now();

    // Apply filters
    const filtered = cards.filter(c => {
      if (tierFilter !== 'all' && (c.tier || 'standard') !== tierFilter) return false;
      if (sectionFilter !== 'all' && c.section !== sectionFilter) return false;
      return true;
    });

    const due = filtered.filter(c => {
      const state = cardStates[c.id];
      return !state || state.nextReview <= now;
    });

    // Shuffle
    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [due[i], due[j]] = [due[j], due[i]];
    }
    setDueCards(due);
    setCurrentIdx(0);
    setShowAnswer(false);
  }, [loaded, cards, cardStates, tierFilter, sectionFilter]);

  const rateCard = useCallback((quality: number) => {
    const card = dueCards[currentIdx];
    if (!card) return;

    const current = cardStates[card.id] || {
      interval: 0,
      repetitions: 0,
      easeFactor: 2.5,
      nextReview: 0,
    };

    const updated = sm2(current, quality);
    const newStates = { ...cardStates, [card.id]: updated };
    setCardStates(newStates);
    localStorage.setItem(LS_KEY, JSON.stringify(newStates));

    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (quality >= 3 ? 1 : 0),
    }));

    setShowAnswer(false);
    setCurrentIdx(prev => prev + 1);
  }, [dueCards, currentIdx, cardStates]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!showAnswer && e.key === ' ') {
        e.preventDefault();
        setShowAnswer(true);
      }
      if (showAnswer) {
        if (e.key === '1') rateCard(1);
        else if (e.key === '2') rateCard(3);
        else if (e.key === '3') rateCard(4);
        else if (e.key === '4') rateCard(5);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showAnswer, rateCard]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-shimmer w-48 h-6 rounded" />
      </div>
    );
  }

  const currentCard = dueCards[currentIdx];
  const remaining = dueCards.length - currentIdx;

  // Filter controls shown at top
  const filterBar = (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      <select
        value={tierFilter}
        onChange={e => setTierFilter(e.target.value)}
        className="px-3 py-2 rounded-lg text-xs font-medium bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 outline-none"
      >
        {TIER_OPTIONS.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <select
        value={sectionFilter}
        onChange={e => setSectionFilter(e.target.value)}
        className="px-3 py-2 rounded-lg text-xs font-medium bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 outline-none"
      >
        <option value="all">All Sections</option>
        {sections.map(([num, name]) => (
          <option key={num} value={num}>{num} - {name}</option>
        ))}
      </select>
      <span className="text-2xs text-dark-400">
        {cards.filter(c => {
          if (tierFilter !== 'all' && (c.tier || 'standard') !== tierFilter) return false;
          if (sectionFilter !== 'all' && c.section !== sectionFilter) return false;
          return true;
        }).length} cards in pool
      </span>
    </div>
  );

  if (!currentCard || remaining <= 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        {filterBar}
        <div className="w-16 h-16 rounded-full bg-turquoise-100 dark:bg-turquoise-900/30 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-turquoise-500">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">All Caught Up!</h1>
        <p className="text-dark-500 dark:text-dark-400 mb-6">
          {sessionStats.reviewed > 0
            ? `You reviewed ${sessionStats.reviewed} cards (${sessionStats.correct} correct).`
            : cards.length === 0
              ? 'No flashcards available yet. Complete the curriculum to unlock review cards.'
              : 'No cards are due for review right now. Come back later!'}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors">
            Back to Curriculum
          </Link>
        </div>
        {sessionStats.reviewed > 0 && (
          <div className="mt-8 glass-card rounded-xl p-4 text-left">
            <h3 className="text-sm font-semibold mb-2">Session Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-persian-600 dark:text-persian-400">{sessionStats.reviewed}</div>
                <div className="text-2xs text-dark-400">Cards Reviewed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-turquoise-600 dark:text-turquoise-400">
                  {sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0}%
                </div>
                <div className="text-2xs text-dark-400">Accuracy</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const displayText = showAnswer ? currentCard.fullText : currentCard.front.replace(/\[\.\.\.]/g, '______');
  const answer = currentCard.back;
  const cardTier = currentCard.tier || 'standard';

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="flex items-center gap-2 text-sm text-dark-500 hover:text-persian-600 dark:hover:text-persian-400 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-dark-500 dark:text-dark-400">{remaining} remaining</span>
          <span className="text-2xs text-dark-400">Session: {sessionStats.reviewed} reviewed</span>
        </div>
      </div>

      {filterBar}

      {/* Progress bar */}
      <div className="h-1 bg-dark-200 dark:bg-dark-800 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-persian-500 to-turquoise-500 rounded-full transition-all duration-300"
          style={{ width: `${dueCards.length > 0 ? ((currentIdx / dueCards.length) * 100) : 0}%` }}
        />
      </div>

      {/* Card */}
      <div className="glass-card rounded-xl p-8 mb-6 min-h-[300px] flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-0.5 rounded text-2xs font-medium ${TIER_COLORS[cardTier] || TIER_COLORS.standard}`}>
            {cardTier}
          </span>
          <span className={`tier-badge tier-badge-tier2`}>{currentCard.type}</span>
          <span className="text-2xs text-dark-400">{currentCard.sectionName}</span>
        </div>
        <div
          className="flex-1 text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
        {showAnswer && (
          <div className="mt-6 pt-4 border-t border-dark-200 dark:border-dark-700">
            <div className="text-sm text-turquoise-600 dark:text-turquoise-400 font-medium">
              {answer}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {!showAnswer ? (
        <button
          onClick={() => setShowAnswer(true)}
          className="w-full py-3 rounded-xl text-sm font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors"
        >
          Show Answer (Space)
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {QUALITY_LABELS.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => rateCard(value)}
              className={`py-3 rounded-xl text-sm font-medium text-white transition-colors ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-2xs text-dark-400 mt-4">
        Keyboard: Space to reveal, 1-4 to rate
      </p>
    </div>
  );
}
