'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Scenario, ScenarioNode, ScenarioChoice, getScenarioNode } from '@/lib/scenarios';

interface HistoryEntry {
  nodeId: string;
  choiceId?: string;
  choiceText?: string;
  consequence?: string;
  score?: number;
}

export default function ScenarioPlayerClient({ scenario }: { scenario: Scenario }) {
  const [currentNodeId, setCurrentNodeId] = useState(scenario.startNodeId);
  const [history, setHistory] = useState<HistoryEntry[]>([{ nodeId: scenario.startNodeId }]);
  const [totalScore, setTotalScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showConsequence, setShowConsequence] = useState(false);

  const currentNode = getScenarioNode(scenario, currentNodeId);

  const handleChoiceSelect = useCallback((choice: ScenarioChoice) => {
    setSelectedChoice(choice.id);
    setShowConsequence(true);

    // Add to history and update score
    setTimeout(() => {
      setHistory(prev => [...prev, {
        nodeId: currentNodeId,
        choiceId: choice.id,
        choiceText: choice.text,
        consequence: choice.consequence,
        score: choice.score,
      }]);
      setTotalScore(prev => prev + choice.score);

      if (choice.nextNodeId) {
        setCurrentNodeId(choice.nextNodeId);
        setSelectedChoice(null);
        setShowConsequence(false);
      } else {
        // End of scenario - show review
        setShowReview(true);
      }
    }, 2000);
  }, [currentNodeId]);

  const handleRestart = useCallback(() => {
    setCurrentNodeId(scenario.startNodeId);
    setHistory([{ nodeId: scenario.startNodeId }]);
    setTotalScore(0);
    setShowReview(false);
    setSelectedChoice(null);
    setShowConsequence(false);
  }, [scenario.startNodeId]);

  if (!currentNode) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-red-500">Error: Node not found</p>
        <button onClick={handleRestart} className="mt-4 text-emerald-600 hover:underline">
          Restart Scenario
        </button>
      </div>
    );
  }

  // Review screen
  if (showReview || currentNode.type === 'outcome') {
    return (
      <ReviewScreen
        scenario={scenario}
        history={history}
        totalScore={totalScore}
        finalNode={currentNode}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/scenarios"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Exit Scenario</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step {history.length}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            totalScore >= 0
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            Score: {totalScore > 0 ? '+' : ''}{totalScore}
          </div>
        </div>
      </div>

      {/* Scenario Title */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {scenario.title}
      </h1>

      {/* Progress Indicators */}
      <div className="flex gap-1 mb-8">
        {history.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full ${
              idx < history.length - 1
                ? 'bg-emerald-500'
                : 'bg-emerald-300 dark:bg-emerald-700'
            }`}
          />
        ))}
        {/* Placeholder for remaining steps (estimate) */}
        {Array.from({ length: Math.max(0, 5 - history.length) }).map((_, idx) => (
          <div
            key={`future-${idx}`}
            className="h-1 flex-1 rounded-full bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>

      {/* Situation Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            currentNode.type === 'situation'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
          }`}>
            {currentNode.type === 'situation' ? 'Situation' : 'Reflection'}
          </span>
        </div>

        <p className="text-lg text-gray-900 dark:text-white leading-relaxed">
          {currentNode.content}
        </p>

        {currentNode.context && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-600 pl-4">
            {currentNode.context}
          </p>
        )}
      </div>

      {/* Choices */}
      {currentNode.choices && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            What do you do?
          </h2>
          {currentNode.choices.map((choice) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              isSelected={selectedChoice === choice.id}
              showConsequence={showConsequence && selectedChoice === choice.id}
              disabled={selectedChoice !== null}
              onSelect={() => handleChoiceSelect(choice)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChoiceButton({
  choice,
  isSelected,
  showConsequence,
  disabled,
  onSelect,
}: {
  choice: ScenarioChoice;
  isSelected: boolean;
  showConsequence: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-gray-800'
      } ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <p className="text-gray-900 dark:text-white font-medium">
        {choice.text}
      </p>

      {showConsequence && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {choice.consequence}
          </p>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              choice.score > 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : choice.score < 0
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {choice.score > 0 ? '+' : ''}{choice.score} points
            </span>
            {choice.principles.map(p => (
              <span
                key={p}
                className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

function ReviewScreen({
  scenario,
  history,
  totalScore,
  finalNode,
  onRestart,
}: {
  scenario: Scenario;
  history: HistoryEntry[];
  totalScore: number;
  finalNode: ScenarioNode;
  onRestart: () => void;
}) {
  const outcome = finalNode.outcome;
  const maxPossibleScore = 12; // Approximate
  const scorePercentage = Math.min(100, Math.max(0, ((totalScore + maxPossibleScore) / (maxPossibleScore * 2)) * 100));

  const getScoreLabel = (score: number) => {
    if (score >= 8) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 4) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 0) return { label: 'Fair', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Needs Improvement', color: 'text-red-600 dark:text-red-400' };
  };

  const scoreInfo = getScoreLabel(totalScore);

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Scenario Complete
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {scenario.title}
        </p>
      </div>

      {/* Outcome Card */}
      {outcome && (
        <div className="bg-gradient-to-br from-emerald-50 to-turquoise-50 dark:from-emerald-900/20 dark:to-turquoise-900/20 rounded-xl p-6 mb-8 border border-emerald-200 dark:border-emerald-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {outcome.title}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {outcome.description}
          </p>

          <div className="mt-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Lessons Learned:</h3>
            <ul className="space-y-2">
              {outcome.lessonsLearned.map((lesson, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {lesson}
                </li>
              ))}
            </ul>
          </div>

          {outcome.relatedLectures.length > 0 && (
            <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Related Lectures:</h3>
              <div className="flex flex-wrap gap-2">
                {outcome.relatedLectures.map(slug => (
                  <Link
                    key={slug}
                    href={`/lecture/${slug}`}
                    className="px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    Lecture {slug}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Performance</h2>

        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 dark:text-gray-400">Final Score</span>
          <span className={`text-2xl font-bold ${scoreInfo.color}`}>
            {totalScore > 0 ? '+' : ''}{totalScore}
          </span>
        </div>

        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-turquoise-500 transition-all duration-500"
            style={{ width: `${scorePercentage}%` }}
          />
        </div>

        <p className={`text-center font-medium ${scoreInfo.color}`}>
          {scoreInfo.label}
        </p>
      </div>

      {/* Decision History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Decisions</h2>

        <div className="space-y-4">
          {history.filter(h => h.choiceText).map((entry, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                (entry.score ?? 0) > 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : (entry.score ?? 0) < 0
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {entry.choiceText}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {entry.consequence}
                </p>
              </div>
              <span className={`text-sm font-medium ${
                (entry.score ?? 0) > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : (entry.score ?? 0) < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {(entry.score ?? 0) > 0 ? '+' : ''}{entry.score ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
        >
          Try Again
        </button>
        <Link
          href="/scenarios"
          className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium text-center"
        >
          More Scenarios
        </Link>
      </div>
    </div>
  );
}
