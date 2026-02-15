'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SCENARIOS, Scenario } from '@/lib/scenarios';

const CATEGORY_LABELS: Record<string, string> = {
  civic: 'Civic Participation',
  economic: 'Economic Transition',
  social: 'Social Responsibility',
  political: 'Political Leadership',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function ScenariosClient() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const categories = Array.from(new Set(SCENARIOS.map(s => s.category)));
  const difficulties = ['beginner', 'intermediate', 'advanced'];

  const filteredScenarios = SCENARIOS.filter(scenario => {
    if (selectedCategory && scenario.category !== selectedCategory) return false;
    if (selectedDifficulty && scenario.difficulty !== selectedDifficulty) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Scenario Assessments
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Practice ethical decision-making through interactive scenarios. Navigate complex situations and learn from the consequences of your choices.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === null
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedDifficulty === null
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {difficulties.map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredScenarios.map(scenario => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>

      {filteredScenarios.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No scenarios match your filters.
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <Link
      href={`/scenarios/${scenario.id}`}
      className="block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLORS[scenario.difficulty]}`}>
          {scenario.difficulty}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {scenario.estimatedTime}
        </span>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {scenario.title}
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
        {scenario.description}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          {CATEGORY_LABELS[scenario.category] || scenario.category}
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1">
          Start Scenario
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
