'use client';

import { useState, useEffect, useMemo } from 'react';
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
  tier?: string;
}

interface FlashCard {
  id: string;
  front: string;
  back: string;
  fullText: string;
  type: string;
  section: string;
  lecture: string;
  tier?: string;
}

interface AIQuestion {
  id: string;
  lecture: number;
  type: string;
  question: string;
  context?: string;
  model_answer: string;
  grading_rubric: { criterion: string; weight: number }[];
  section: string;
  tier?: string;
}

interface StudyPanelProps {
  sectionNum: string;
  lectureNum: number;
  tier: string;
}

type Tab = 'quiz' | 'flashcards' | 'practice';

export default function StudyPanel({ sectionNum, lectureNum, tier }: StudyPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('quiz');
  const [allMC, setAllMC] = useState<MCQuestion[]>([]);
  const [allCards, setAllCards] = useState<FlashCard[]>([]);
  const [allAI, setAllAI] = useState<AIQuestion[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(0);

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Practice state
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // Load data on mount
  useEffect(() => {
    Promise.all([
      fetch('/data/mc-questions.json').then(r => r.json()),
      fetch('/data/flashcards.json').then(r => r.json()),
      fetch('/data/ai-questions.json').then(r => r.json()),
    ]).then(([mc, cards, ai]) => {
      setAllMC(mc);
      setAllCards(cards);
      setAllAI(ai);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // Filter data by section + lecture + tier
  const lecturePadded = String(lectureNum).padStart(3, '0');

  const mcQuestions = useMemo(() =>
    allMC.filter(q => q.section === sectionNum && q.lecture === lectureNum && q.tier === tier),
    [allMC, sectionNum, lectureNum, tier]
  );

  const flashcards = useMemo(() =>
    allCards.filter(c => c.section === sectionNum && c.lecture === lecturePadded && c.tier === tier),
    [allCards, sectionNum, lecturePadded, tier]
  );

  const aiQuestions = useMemo(() =>
    allAI.filter(q => q.section === sectionNum && q.lecture === lectureNum && q.tier === tier),
    [allAI, sectionNum, lectureNum, tier]
  );

  // Reset state when tier or lecture changes
  useEffect(() => {
    setQuizIndex(0);
    setSelectedAnswer(null);
    setQuizCorrect(0);
    setQuizAnswered(0);
    setCardIndex(0);
    setShowAnswer(false);
    setShowModelAnswer(false);
  }, [tier, sectionNum, lectureNum]);

  const handleAnswer = (letter: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(letter);
    setQuizAnswered(prev => prev + 1);
    if (letter === mcQuestions[quizIndex]?.correct) {
      setQuizCorrect(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setQuizIndex(prev => prev + 1);
    setSelectedAnswer(null);
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelectedAnswer(null);
    setQuizCorrect(0);
    setQuizAnswered(0);
  };

  const nextCard = () => {
    setCardIndex(prev => prev + 1);
    setShowAnswer(false);
  };

  const resetCards = () => {
    setCardIndex(0);
    setShowAnswer(false);
  };

  if (!expanded) {
    return (
      <div className="mt-12">
        <button
          onClick={() => setExpanded(true)}
          className="w-full glass-card rounded-xl p-5 flex items-center justify-between hover:bg-white/20 dark:hover:bg-white/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-persian-500">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <span className="font-semibold text-sm">Study This Lecture</span>
            {loaded && (
              <span className="text-2xs text-dark-400">
                {mcQuestions.length} questions &middot; {flashcards.length} cards
                {aiQuestions.length > 0 && ' \u00B7 1 practice'}
              </span>
            )}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-400 group-hover:text-persian-500 transition-colors">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>
    );
  }

  const currentQ = mcQuestions[quizIndex];
  const currentCard = flashcards[cardIndex];
  const aiQ = aiQuestions[0];
  const quizDone = quizIndex >= mcQuestions.length;
  const cardsDone = cardIndex >= flashcards.length;

  return (
    <div className="mt-12">
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-dark-200/50 dark:border-dark-700/50">
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-persian-500">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <span className="font-semibold text-sm">Study This Lecture</span>
            <span className={`px-2 py-0.5 rounded text-2xs font-medium ${
              tier === 'scholarly' ? 'bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-300'
                : tier === 'extended' ? 'bg-persian-100 dark:bg-persian-900/30 text-persian-700 dark:text-persian-300'
                : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400'
            }`}>
              {tier}
            </span>
          </div>
          <button onClick={() => setExpanded(false)} className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 15l6-6 6 6"/></svg>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 px-5 py-3 border-b border-dark-200/50 dark:border-dark-700/50">
          {[
            { key: 'quiz' as Tab, label: 'Quiz', count: mcQuestions.length },
            { key: 'flashcards' as Tab, label: 'Flashcards', count: flashcards.length },
            { key: 'practice' as Tab, label: 'Practice', count: aiQuestions.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-persian-600 text-white'
                  : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 ${activeTab === tab.key ? 'text-white/70' : 'text-dark-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {!loaded ? (
            <div className="text-center py-8 text-dark-400 text-sm">Loading study materials...</div>
          ) : activeTab === 'quiz' ? (
            /* ─── Quiz Tab ─── */
            mcQuestions.length === 0 ? (
              <div className="text-center py-8 text-dark-400 text-sm">No quiz questions available for this lecture at the {tier} tier.</div>
            ) : quizDone ? (
              <div className="text-center py-8">
                <div className="text-4xl font-bold mb-2">
                  <span className={quizCorrect === mcQuestions.length ? 'text-turquoise-500' : quizCorrect > 0 ? 'text-saffron-500' : 'text-red-500'}>
                    {quizCorrect}
                  </span>
                  <span className="text-dark-400">/{mcQuestions.length}</span>
                </div>
                <p className="text-sm text-dark-400 mb-4">
                  {quizCorrect === mcQuestions.length ? 'Perfect score!' : quizCorrect > 0 ? 'Good effort!' : 'Keep studying!'}
                </p>
                <button onClick={resetQuiz} className="px-4 py-2 rounded-lg text-xs font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors">
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xs text-dark-400">Question {quizIndex + 1} of {mcQuestions.length}</span>
                  <div className="flex gap-1">
                    {mcQuestions.map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < quizIndex ? 'bg-persian-500' : i === quizIndex ? 'bg-persian-400 animate-pulse' : 'bg-dark-300 dark:bg-dark-700'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-medium mb-4">{currentQ.question}</p>
                <div className="space-y-2">
                  {Object.entries(currentQ.options).map(([letter, text]) => {
                    const isSelected = selectedAnswer === letter;
                    const isCorrect = letter === currentQ.correct;
                    const answered = selectedAnswer !== null;
                    return (
                      <button
                        key={letter}
                        onClick={() => handleAnswer(letter)}
                        disabled={answered}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-start gap-3 transition-colors text-sm ${
                          answered && isCorrect
                            ? 'bg-turquoise-50 dark:bg-turquoise-900/20 border border-turquoise-400 dark:border-turquoise-600'
                            : answered && isSelected && !isCorrect
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-600'
                            : answered
                            ? 'bg-dark-50 dark:bg-dark-800/50 border border-dark-200 dark:border-dark-700 opacity-60'
                            : 'bg-dark-50 dark:bg-dark-800/50 border border-dark-200 dark:border-dark-700 hover:border-persian-400 dark:hover:border-persian-600 cursor-pointer'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold shrink-0 mt-0.5 ${
                          answered && isCorrect
                            ? 'bg-turquoise-500 text-white'
                            : answered && isSelected && !isCorrect
                            ? 'bg-red-500 text-white'
                            : 'bg-dark-200 dark:bg-dark-700'
                        }`}>
                          {answered && isCorrect ? '\u2713' : answered && isSelected && !isCorrect ? '\u2717' : letter}
                        </span>
                        <span>{text}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedAnswer && (
                  <div className="mt-4">
                    <div className={`rounded-lg p-3 text-sm ${
                      selectedAnswer === currentQ.correct
                        ? 'bg-turquoise-50 dark:bg-turquoise-900/10 text-turquoise-800 dark:text-turquoise-200'
                        : 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200'
                    }`}>
                      {currentQ.explanation}
                    </div>
                    <div className="flex justify-end mt-3">
                      <button onClick={nextQuestion} className="px-4 py-2 rounded-lg text-xs font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors">
                        {quizIndex < mcQuestions.length - 1 ? 'Next Question' : 'See Results'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : activeTab === 'flashcards' ? (
            /* ─── Flashcards Tab ─── */
            flashcards.length === 0 ? (
              <div className="text-center py-8 text-dark-400 text-sm">No flashcards available for this lecture at the {tier} tier.</div>
            ) : cardsDone ? (
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-persian-500 mb-2">{flashcards.length}</div>
                <p className="text-sm text-dark-400 mb-4">cards reviewed</p>
                <button onClick={resetCards} className="px-4 py-2 rounded-lg text-xs font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors">
                  Review Again
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xs text-dark-400">Card {cardIndex + 1} of {flashcards.length}</span>
                  <span className="text-2xs px-2 py-0.5 rounded bg-dark-100 dark:bg-dark-800 text-dark-500">{currentCard.type}</span>
                </div>
                <div className="bg-dark-50 dark:bg-dark-800/50 rounded-lg p-5 min-h-[120px]">
                  <div
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: showAnswer
                        ? currentCard.fullText
                        : currentCard.front.replace(/\[\.\.\.]/g, '<span class="inline-block px-3 py-0.5 bg-persian-100 dark:bg-persian-900/30 rounded text-persian-600 dark:text-persian-400 font-mono text-xs">______</span>')
                    }}
                  />
                  {showAnswer && (
                    <div className="mt-4 pt-3 border-t border-dark-200 dark:border-dark-700">
                      <span className="text-xs text-dark-400 mr-2">Answer:</span>
                      <span className="text-sm font-medium text-turquoise-600 dark:text-turquoise-400">{currentCard.back}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-3">
                  {!showAnswer ? (
                    <button onClick={() => setShowAnswer(true)} className="px-4 py-2 rounded-lg text-xs font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors">
                      Show Answer
                    </button>
                  ) : (
                    <button onClick={nextCard} className="px-4 py-2 rounded-lg text-xs font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors">
                      {cardIndex < flashcards.length - 1 ? 'Next Card' : 'Done'}
                    </button>
                  )}
                </div>
              </div>
            )
          ) : (
            /* ─── Practice Tab ─── */
            aiQuestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-dark-400 mb-2">No practice question for this lecture.</p>
                <p className="text-2xs text-dark-500">AI practice questions are available for lectures 2, 4, 6, 8, and 10.</p>
                <Link href="/practice" className="inline-block mt-4 px-4 py-2 rounded-lg text-xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors">
                  Browse All Practice Questions
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-2xs text-dark-400 mb-3">{aiQ.type === 'analytical_essay' ? 'Analytical Essay' : 'Short Answer'}</p>
                <p className="text-sm font-medium mb-4">{aiQ.question}</p>
                {aiQ.context && (
                  <div className="bg-dark-100 dark:bg-dark-900/50 rounded-lg p-4 mb-4 text-sm text-dark-600 dark:text-dark-400">
                    {aiQ.context}
                  </div>
                )}
                {aiQ.grading_rubric && Array.isArray(aiQ.grading_rubric) && (
                  <div className="mb-4">
                    <p className="text-2xs font-medium text-dark-400 mb-2">Grading Criteria:</p>
                    <div className="space-y-1">
                      {aiQ.grading_rubric.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-2xs text-dark-500">
                          <span className="shrink-0 font-mono text-dark-400">{Math.round(r.weight * 100)}%</span>
                          <span>{r.criterion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowModelAnswer(!showModelAnswer)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors mb-4"
                >
                  {showModelAnswer ? 'Hide Model Answer' : 'Show Model Answer'}
                </button>
                {showModelAnswer && (
                  <div className="bg-turquoise-50 dark:bg-turquoise-900/10 rounded-lg p-4 text-sm leading-relaxed border border-turquoise-200 dark:border-turquoise-800">
                    <p className="text-2xs font-semibold text-turquoise-600 dark:text-turquoise-400 mb-2">Model Answer</p>
                    {aiQ.model_answer}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-dark-200/50 dark:border-dark-700/50">
                  <Link href="/practice" className="text-xs text-persian-600 dark:text-persian-400 hover:underline">
                    For AI-graded feedback, visit the Practice page &rarr;
                  </Link>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
