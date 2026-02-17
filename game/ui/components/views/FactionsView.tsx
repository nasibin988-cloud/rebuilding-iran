'use client';

/**
 * IRAN 14XX - Factions View
 *
 * Displays all factions, their relationships, and the player's standing.
 */

import React from 'react';
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../hooks/useGameStore';
import type { FactionId } from '../../../engine/core/types';

export function FactionsView() {
  const { t } = useGame();
  const store = useGameStore();
  const gameState = store.gameState;
  const player = store.getPlayer();

  const factionCategories = [
    { id: 'regime', label: { fa: 'جناح‌های حکومتی', en: 'Regime Factions' } },
    { id: 'opposition', label: { fa: 'اپوزیسیون', en: 'Opposition' } },
    { id: 'society', label: { fa: 'نیروهای اجتماعی', en: 'Social Forces' } },
  ];

  // Mock faction data for display
  const mockFactions = [
    {
      id: 'supreme_leader_office',
      name: { fa: 'بیت رهبری', en: 'Supreme Leader Office' },
      category: 'regime',
      power: 95,
      trust: -10,
    },
    {
      id: 'irgc',
      name: { fa: 'سپاه پاسداران', en: 'IRGC' },
      category: 'regime',
      power: 85,
      trust: -30,
    },
    {
      id: 'reformists',
      name: { fa: 'اصلاح‌طلبان', en: 'Reformists' },
      category: 'opposition',
      power: 25,
      trust: 60,
    },
    {
      id: 'students',
      name: { fa: 'جنبش دانشجویی', en: 'Student Movement' },
      category: 'society',
      power: 20,
      trust: 50,
    },
  ];

  const getTrustColor = (trust: number) => {
    if (trust >= 50) return 'text-green-400';
    if (trust >= 20) return 'text-blue-400';
    if (trust >= -20) return 'text-gray-400';
    if (trust >= -50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTrustLabel = (trust: number) => {
    if (trust >= 70) return { fa: 'متحد', en: 'Allied' };
    if (trust >= 40) return { fa: 'دوستانه', en: 'Friendly' };
    if (trust >= 10) return { fa: 'مثبت', en: 'Positive' };
    if (trust >= -10) return { fa: 'خنثی', en: 'Neutral' };
    if (trust >= -40) return { fa: 'منفی', en: 'Negative' };
    if (trust >= -70) return { fa: 'خصمانه', en: 'Hostile' };
    return { fa: 'دشمن', en: 'Enemy' };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {t({ fa: 'جناح‌ها و گروه‌ها', en: 'Factions & Groups' })}
        </h2>
        <p className="text-gray-400">
          {t({
            fa: 'بازیگران اصلی صحنه سیاسی ایران و روابط شما با آنها',
            en: 'Major political actors in Iran and your relationships with them',
          })}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {factionCategories.map((category) => (
          <div key={category.id} className="mb-6">
            <h3 className="text-lg font-medium text-gray-300 mb-3">
              {t(category.label)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockFactions
                .filter((f) => f.category === category.id)
                .map((faction) => (
                  <div
                    key={faction.id}
                    onClick={() => store.selectFaction(faction.id as FactionId)}
                    className={`bg-gray-800 rounded-xl p-4 cursor-pointer transition-colors hover:bg-gray-750 ${
                      store.selectedFaction === faction.id
                        ? 'ring-2 ring-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium">{t(faction.name)}</div>
                        <div className="text-sm text-gray-400">
                          {t({ fa: 'قدرت', en: 'Power' })}: {faction.power}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getTrustColor(faction.trust)}`}>
                          {faction.trust > 0 ? '+' : ''}{faction.trust}
                        </div>
                        <div className="text-xs text-gray-400">
                          {t(getTrustLabel(faction.trust))}
                        </div>
                      </div>
                    </div>

                    {/* Trust Bar */}
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          faction.trust >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.abs(faction.trust)}%`,
                          marginLeft: faction.trust < 0 ? `${100 - Math.abs(faction.trust)}%` : '0',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Faction Details */}
      {store.selectedFaction && (
        <div className="mt-4 bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
              {t({ fa: 'جزئیات جناح', en: 'Faction Details' })}
            </h3>
            <button
              onClick={() => store.selectFaction(null)}
              className="p-1 rounded hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-700 rounded p-2">
              <div className="text-gray-400">{t({ fa: 'ایدئولوژی', en: 'Ideology' })}</div>
              <div className="font-medium">{t({ fa: 'محافظه‌کار', en: 'Conservative' })}</div>
            </div>
            <div className="bg-gray-700 rounded p-2">
              <div className="text-gray-400">{t({ fa: 'اعضا', en: 'Members' })}</div>
              <div className="font-medium">~50,000</div>
            </div>
            <div className="bg-gray-700 rounded p-2">
              <div className="text-gray-400">{t({ fa: 'منابع', en: 'Resources' })}</div>
              <div className="font-medium">{t({ fa: 'زیاد', en: 'High' })}</div>
            </div>
            <div className="bg-gray-700 rounded p-2">
              <div className="text-gray-400">{t({ fa: 'رهبر', en: 'Leader' })}</div>
              <div className="font-medium">-</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
