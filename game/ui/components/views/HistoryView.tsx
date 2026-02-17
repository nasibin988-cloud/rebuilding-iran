'use client';

/**
 * IRAN 14XX - History View
 *
 * Shows the history of events, decisions, and their consequences.
 */

import React from 'react';
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../hooks/useGameStore';

export function HistoryView() {
  const { t } = useGame();
  const store = useGameStore();
  const gameState = store.gameState;

  // Mock history entries for display
  const mockHistory = [
    {
      turn: 3,
      date: { year: 1404, month: 3 },
      type: 'decision',
      title: { fa: 'ملاقات با دوست', en: 'Meeting with Friend' },
      outcome: { fa: 'تصمیم به ساختن ائتلاف', en: 'Decided to build coalition' },
    },
    {
      turn: 2,
      date: { year: 1404, month: 2 },
      type: 'event',
      title: { fa: 'نشانه‌های اول', en: 'First Signs' },
      outcome: { fa: 'به تجمع پیوستید', en: 'Joined the gathering' },
    },
    {
      turn: 1,
      date: { year: 1404, month: 1 },
      type: 'event',
      title: { fa: 'بیداری', en: 'Awakening' },
      outcome: { fa: 'بازی آغاز شد', en: 'Game began' },
    },
  ];

  const formatDate = (date: { year: number; month: number }) => {
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
    ];
    return store.language === 'fa'
      ? `${persianMonths[date.month - 1]} ${date.year}`
      : `Month ${date.month}, ${date.year}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {t({ fa: 'تاریخچه', en: 'History' })}
        </h2>
        <p className="text-gray-400">
          {t({
            fa: 'رویدادها و تصمیمات گذشته شما',
            en: 'Your past events and decisions',
          })}
        </p>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-700" />

          {/* Entries */}
          <div className="space-y-4">
            {mockHistory.map((entry, index) => (
              <div key={index} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2.5 top-3 w-3 h-3 rounded-full ${
                    entry.type === 'decision' ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />

                {/* Entry card */}
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{t(entry.title)}</div>
                      <div className="text-sm text-gray-400">
                        {formatDate(entry.date)} • {t({ fa: 'نوبت', en: 'Turn' })} {entry.turn}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        entry.type === 'decision'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}
                    >
                      {t(
                        entry.type === 'decision'
                          ? { fa: 'تصمیم', en: 'Decision' }
                          : { fa: 'رویداد', en: 'Event' }
                      )}
                    </span>
                  </div>
                  <div className="text-gray-300">{t(entry.outcome)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {mockHistory.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            {t({ fa: 'هنوز تاریخچه‌ای وجود ندارد', en: 'No history yet' })}
          </div>
        )}
      </div>
    </div>
  );
}
