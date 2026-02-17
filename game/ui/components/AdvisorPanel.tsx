'use client';

/**
 * IRAN 14XX - AI Advisor Panel
 *
 * Interface for interacting with the AI advisor.
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useAdvisor, useGameStore } from '../hooks/useGameStore';

export function AdvisorPanel() {
  const { t, isRTL } = useGame();
  const {
    closeAdvisor,
    askAdvisor,
    advisorQuery,
    advisorResponse,
    isAdvisorLoading,
  } = useAdvisor();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      askAdvisor(query);
    }
  };

  const suggestedQuestions = [
    { fa: 'وضعیت فعلی چگونه است؟', en: 'What is the current situation?' },
    { fa: 'چه گزینه‌هایی دارم؟', en: 'What are my options?' },
    { fa: 'بهترین استراتژی چیست؟', en: 'What is the best strategy?' },
    { fa: 'جناح‌ها چه می‌خواهند؟', en: 'What do the factions want?' },
  ];

  return (
    <div
      className="fixed inset-y-0 right-0 w-96 bg-gray-800 border-l border-gray-700 z-50 flex flex-col"
      role="dialog"
      aria-modal="false"
      aria-labelledby="advisor-panel-title"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">🤖</span>
          <div>
            <h2 id="advisor-panel-title" className="font-bold">
              {t({ fa: 'مشاور هوش مصنوعی', en: 'AI Advisor' })}
            </h2>
            <p className="text-xs text-gray-400">
              {t({ fa: 'تحلیل وضعیت و پیشنهادات', en: 'Analysis and suggestions' })}
            </p>
          </div>
        </div>
        <button
          onClick={closeAdvisor}
          className="p-2 rounded-lg hover:bg-gray-700"
          aria-label={t({ fa: 'بستن پنل مشاور', en: 'Close advisor panel' })}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Introduction */}
        {!advisorResponse && !isAdvisorLoading && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🧠</div>
            <p className="text-gray-400 mb-6">
              {t({
                fa: 'سوالات خود را درباره وضعیت سیاسی، استراتژی، یا تصمیمات بپرسید',
                en: 'Ask questions about the political situation, strategy, or decisions',
              })}
            </p>

            {/* Suggested Questions */}
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(t(q));
                    askAdvisor(t(q));
                  }}
                  className="w-full text-start p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  {t(q)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isAdvisorLoading && (
          <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
            <div
              className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
              aria-label={t({ fa: 'در حال بارگذاری پاسخ', en: 'Loading response' })}
            />
            <span className="sr-only">{t({ fa: 'در حال بارگذاری پاسخ مشاور...', en: 'Loading advisor response...' })}</span>
          </div>
        )}

        {/* Response */}
        {advisorResponse && !isAdvisorLoading && (
          <div className="space-y-4">
            {/* User Query */}
            <div className="bg-blue-600/20 rounded-lg p-3">
              <div className="text-xs text-blue-400 mb-1">
                {t({ fa: 'سوال شما', en: 'Your question' })}
              </div>
              <div>{advisorQuery}</div>
            </div>

            {/* AI Response */}
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">
                {t({ fa: 'پاسخ مشاور', en: 'Advisor response' })}
              </div>
              <div className="whitespace-pre-line">{advisorResponse}</div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700" role="search">
        <div className="flex gap-2">
          <label htmlFor="advisor-query" className="sr-only">
            {t({ fa: 'سوال خود را بنویسید', en: 'Type your question' })}
          </label>
          <input
            id="advisor-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t({ fa: 'سوال خود را بنویسید...', en: 'Type your question...' })}
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir={isRTL ? 'rtl' : 'ltr'}
            aria-describedby="advisor-help"
          />
          <button
            type="submit"
            disabled={!query.trim() || isAdvisorLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            aria-label={t({ fa: 'ارسال سوال', en: 'Send question' })}
          >
            {t({ fa: 'ارسال', en: 'Send' })}
          </button>
        </div>
        <p id="advisor-help" className="sr-only">
          {t({ fa: 'سوالات درباره وضعیت سیاسی، استراتژی یا تصمیمات بپرسید', en: 'Ask questions about political situation, strategy, or decisions' })}
        </p>
      </form>
    </div>
  );
}
