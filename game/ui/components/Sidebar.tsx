'use client';

/**
 * IRAN 14XX - Sidebar Navigation
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { useGameStore } from '../hooks/useGameStore';

const navItems = [
  {
    id: 'map' as const,
    icon: '🗺️',
    label: { fa: 'نقشه', en: 'Map' },
  },
  {
    id: 'factions' as const,
    icon: '👥',
    label: { fa: 'جناح‌ها', en: 'Factions' },
  },
  {
    id: 'eudaimonia' as const,
    icon: '📊',
    label: { fa: 'شاخص رفاه', en: 'Flourishing' },
  },
  {
    id: 'history' as const,
    icon: '📜',
    label: { fa: 'تاریخچه', en: 'History' },
  },
  {
    id: 'settings' as const,
    icon: '⚙️',
    label: { fa: 'تنظیمات', en: 'Settings' },
  },
];

export function Sidebar() {
  const { t, isRTL } = useGame();
  const store = useGameStore();
  const player = store.getPlayer();

  return (
    <aside
      className="w-64 bg-gray-800 border-gray-700 flex flex-col"
      style={{ borderWidth: isRTL ? '0 0 0 1px' : '0 1px 0 0' }}
      role="complementary"
      aria-label={t({ fa: 'نوار کناری بازی', en: 'Game sidebar' })}
    >
      {/* Logo / Title */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-center">
          {t({ fa: 'ایران ۱۴XX', en: 'IRAN 14XX' })}
        </h1>
        <p className="text-sm text-gray-400 text-center mt-1">
          {t({ fa: 'شبیه‌سازی سیاسی', en: 'Political Simulation' })}
        </p>
      </div>

      {/* Player Info */}
      {player && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {t(player.characterData.name)}
              </div>
              <div className="text-sm text-gray-400">
                {t({ fa: 'نفوذ', en: 'Influence' })}: {player.resources.influence}
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-700 rounded p-2">
              <div className="text-gray-400">
                {t({ fa: 'پول', en: 'Money' })}
              </div>
              <div className="font-medium">
                {player.resources.money.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-700 rounded p-2">
              <div className="text-gray-400">
                {t({ fa: 'اقدامات', en: 'Actions' })}
              </div>
              <div className="font-medium">
                {player.resources.actionsRemaining}/{player.resources.actionsPerTurn}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2" aria-label={t({ fa: 'ناوبری اصلی', en: 'Main navigation' })}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => store.setView(item.id)}
            aria-current={store.selectedView === item.id ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              store.selectedView === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            <span>{t(item.label)}</span>
          </button>
        ))}
      </nav>

      {/* AI Advisor Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => store.openAdvisor()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
          aria-label={t({ fa: 'باز کردن پنل مشاور هوش مصنوعی', en: 'Open AI Advisor panel' })}
        >
          <span className="text-xl" aria-hidden="true">🤖</span>
          <span>{t({ fa: 'مشاور هوش مصنوعی', en: 'AI Advisor' })}</span>
        </button>
      </div>

      {/* Turn Actions */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => store.processTurn()}
          disabled={store.isTurnProcessing}
          className="w-full px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          aria-label={t({ fa: 'پایان نوبت فعلی و پردازش رویدادها', en: 'End current turn and process events' })}
        >
          {t({ fa: 'پایان نوبت', en: 'End Turn' })}
        </button>
      </div>
    </aside>
  );
}
