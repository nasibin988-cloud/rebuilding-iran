'use client';

/**
 * IRAN 14XX - Status Bar
 *
 * Top bar showing current date, turn, and quick stats.
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { useGameStore, useNotifications } from '../hooks/useGameStore';

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const englishMonths = [
  'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand',
];

export function StatusBar() {
  const { t, language } = useGame();
  const store = useGameStore();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const gameState = store.gameState;
  const date = store.getCurrentDate();
  const turn = store.getCurrentTurn();
  const eudaimonia = store.getEudaimonia();

  // Helper to get composite value regardless of eudaimonia format
  const getComposite = (): number => {
    if (!eudaimonia) return 50;
    if ('composite' in eudaimonia) return eudaimonia.composite;
    // EudaimoniaSimple - calculate average
    const e = eudaimonia;
    return (
      e.materialWellbeing +
      e.healthLongevity +
      e.freedomAgency +
      e.securityOrder +
      e.socialCohesion +
      e.culturalFlourishing +
      e.sustainability
    ) / 7;
  };

  // Helper to get trend
  const getTrend = (): string => {
    if (!eudaimonia) return 'stable';
    return 'trend' in eudaimonia ? eudaimonia.trend : 'stable';
  };

  const composite = getComposite();

  const formatDate = () => {
    if (!date) return '';
    const months = language === 'fa' ? persianMonths : englishMonths;
    return `${months[date.month - 1]} ${date.year}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };

  return (
    <header
      className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-6"
      role="banner"
      aria-label={t({ fa: 'نوار وضعیت بازی', en: 'Game status bar' })}
    >
      {/* Date and Turn */}
      <div className="flex items-center gap-4" role="group" aria-label={t({ fa: 'تاریخ و نوبت', en: 'Date and turn' })}>
        <div className="flex items-center gap-2">
          <span className="text-gray-400" aria-hidden="true">📅</span>
          <span className="font-medium" aria-label={t({ fa: `تاریخ: ${formatDate()}`, en: `Date: ${formatDate()}` })}>{formatDate()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">
            {t({ fa: 'نوبت', en: 'Turn' })}:
          </span>
          <span className="font-medium">{turn}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-600" />

      {/* Quick Stats */}
      {eudaimonia && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              {t({ fa: 'شاخص رفاه', en: 'Flourishing' })}:
            </span>
            <span
              className={`font-medium ${
                composite > 50
                  ? 'text-green-400'
                  : composite > 30
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {Math.round(composite)}
            </span>
            <span>{getTrendIcon(getTrend())}</span>
          </div>
        </div>
      )}

      {/* Regime Stability */}
      {gameState && gameState.regime && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400">
            {t({ fa: 'ثبات رژیم', en: 'Regime Stability' })}:
          </span>
          <span
            className={`font-medium ${
              (gameState.regime.stability ?? 50) > 60
                ? 'text-green-400'
                : (gameState.regime.stability ?? 50) > 30
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}
          >
            {gameState.regime.stability ?? 50}%
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <button
        className="relative p-2 rounded-lg hover:bg-gray-700 transition-colors"
        onClick={() => {
          // Toggle notifications panel
        }}
        aria-label={t({
          fa: unreadCount > 0 ? `${unreadCount} اعلان خوانده نشده` : 'اعلان‌ها',
          en: unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'
        })}
      >
        <span className="text-xl" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center" aria-hidden="true">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Pause Button */}
      <button
        onClick={() => store.togglePause()}
        className={`p-2 rounded-lg transition-colors ${
          store.isPaused ? 'bg-yellow-600 hover:bg-yellow-700' : 'hover:bg-gray-700'
        }`}
        aria-label={t({
          fa: store.isPaused ? 'ادامه بازی' : 'مکث بازی',
          en: store.isPaused ? 'Resume game' : 'Pause game'
        })}
        aria-pressed={store.isPaused}
      >
        <span className="text-xl" aria-hidden="true">{store.isPaused ? '▶️' : '⏸️'}</span>
      </button>

      {/* Language Toggle */}
      <button
        onClick={() => store.setLanguage(language === 'fa' ? 'en' : 'fa')}
        className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm font-medium"
        aria-label={t({
          fa: 'تغییر زبان به انگلیسی',
          en: 'Switch language to Persian'
        })}
      >
        {language === 'fa' ? 'EN' : 'فا'}
      </button>
    </header>
  );
}
