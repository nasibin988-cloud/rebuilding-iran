'use client';

/**
 * IRAN 14XX - Eudaimonia View
 *
 * Displays the 7 dimensions of human flourishing and their current values.
 */

import React from 'react';
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../hooks/useGameStore';
import type { EudaimoniaState, EudaimoniaSimple, EudaimoniaDimensions, DimensionScore } from '../../../engine/core/types';

// Type for eudaimonia dimension keys
type EudaimoniaDimensionKey = keyof EudaimoniaDimensions;

const dimensionConfig = [
  {
    key: 'materialWellbeing' as const,
    icon: '💰',
    name: { fa: 'رفاه مادی', en: 'Material Wellbeing' },
    description: {
      fa: 'سطح زندگی، درآمد، مسکن، و دسترسی به کالاها',
      en: 'Living standards, income, housing, and access to goods',
    },
    color: 'from-amber-500 to-yellow-600',
  },
  {
    key: 'healthLongevity' as const,
    icon: '❤️',
    name: { fa: 'سلامت و طول عمر', en: 'Health & Longevity' },
    description: {
      fa: 'امید به زندگی، دسترسی به بهداشت، و سلامت عمومی',
      en: 'Life expectancy, healthcare access, and general health',
    },
    color: 'from-red-500 to-pink-600',
  },
  {
    key: 'freedomAgency' as const,
    icon: '🗽',
    name: { fa: 'آزادی و عاملیت', en: 'Freedom & Agency' },
    description: {
      fa: 'آزادی بیان، آزادی سیاسی، و حق انتخاب',
      en: 'Freedom of expression, political freedom, and choice',
    },
    color: 'from-blue-500 to-cyan-600',
  },
  {
    key: 'securityOrder' as const,
    icon: '🛡️',
    name: { fa: 'امنیت و نظم', en: 'Security & Order' },
    description: {
      fa: 'امنیت شخصی، حاکمیت قانون، و ثبات',
      en: 'Personal safety, rule of law, and stability',
    },
    color: 'from-green-500 to-emerald-600',
  },
  {
    key: 'socialCohesion' as const,
    icon: '🤝',
    name: { fa: 'انسجام اجتماعی', en: 'Social Cohesion' },
    description: {
      fa: 'اعتماد اجتماعی، همبستگی، و شبکه‌های حمایتی',
      en: 'Social trust, solidarity, and support networks',
    },
    color: 'from-purple-500 to-violet-600',
  },
  {
    key: 'culturalFlourishing' as const,
    icon: '🎭',
    name: { fa: 'شکوفایی فرهنگی', en: 'Cultural Flourishing' },
    description: {
      fa: 'هنر، آموزش، هویت، و میراث فرهنگی',
      en: 'Art, education, identity, and cultural heritage',
    },
    color: 'from-orange-500 to-amber-600',
  },
  {
    key: 'sustainability' as const,
    icon: '🌱',
    name: { fa: 'پایداری', en: 'Sustainability' },
    description: {
      fa: 'محیط زیست، منابع طبیعی، و آینده‌نگری',
      en: 'Environment, natural resources, and future outlook',
    },
    color: 'from-teal-500 to-green-600',
  },
];

export function EudaimoniaView() {
  const { t } = useGame();
  const store = useGameStore();
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
  const trend = getTrend();

  // Helper to get dimension value
  const getDimensionValue = (key: EudaimoniaDimensionKey): number => {
    if (!eudaimonia) return 50;
    if ('dimensions' in eudaimonia && eudaimonia.dimensions) {
      const eudaimoniaState = eudaimonia as EudaimoniaState;
      const dim: DimensionScore | undefined = eudaimoniaState.dimensions[key];
      return dim?.value ?? 50;
    }
    // EudaimoniaSimple - direct values
    const simple = eudaimonia as EudaimoniaSimple;
    return simple[key] ?? 50;
  };

  // Helper to get dimension trend
  const getDimensionTrend = (key: EudaimoniaDimensionKey): string => {
    if (!eudaimonia) return 'stable';
    if ('dimensions' in eudaimonia && eudaimonia.dimensions) {
      const eudaimoniaState = eudaimonia as EudaimoniaState;
      const dim: DimensionScore | undefined = eudaimoniaState.dimensions[key];
      return dim?.trend ?? 'stable';
    }
    return 'stable';
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

  const getValueColor = (value: number) => {
    if (value >= 70) return 'text-green-400';
    if (value >= 50) return 'text-blue-400';
    if (value >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {t({ fa: 'شاخص رفاه ملی', en: 'National Flourishing Index' })}
        </h2>
        <p className="text-gray-400">
          {t({
            fa: 'هفت بُعد رفاه و شکوفایی انسانی در ایران',
            en: 'Seven dimensions of human flourishing in Iran',
          })}
        </p>
      </div>

      {/* Composite Score */}
      {eudaimonia && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 mb-1">
                {t({ fa: 'شاخص ترکیبی', en: 'Composite Score' })}
              </div>
              <div className={`text-5xl font-bold ${getValueColor(composite)}`}>
                {Math.round(composite)}
              </div>
            </div>
            <div className="text-4xl">
              {getTrendIcon(trend)}
            </div>
          </div>
          <div className="mt-4">
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
                style={{ width: `${composite}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>
      )}

      {/* Dimensions Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensionConfig.map((dim) => {
            const value = getDimensionValue(dim.key);
            const dimTrend = getDimensionTrend(dim.key);

            return (
              <div
                key={dim.key}
                className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dim.icon}</span>
                    <div>
                      <div className="font-medium">{t(dim.name)}</div>
                      <div className="text-xs text-gray-400">{t(dim.description)}</div>
                    </div>
                  </div>
                  <span className="text-lg">{getTrendIcon(dimTrend)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${getValueColor(value)}`}>
                    {Math.round(value)}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${dim.color} transition-all duration-500`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mini sparkline would go here */}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Weights */}
      {eudaimonia && 'playerWeights' in eudaimonia && eudaimonia.playerWeights && (
        <div className="mt-6 bg-gray-800 rounded-xl p-4">
          <h3 className="font-medium mb-3">
            {t({ fa: 'اولویت‌های شما', en: 'Your Priorities' })}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {t({
              fa: 'این وزن‌ها تعیین می‌کنند که هر بُعد چقدر در شاخص ترکیبی تاثیر دارد',
              en: 'These weights determine how much each dimension affects your composite score',
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            {dimensionConfig.map((dim) => {
              const eudaimoniaState = eudaimonia as EudaimoniaState;
              const weights = eudaimoniaState.playerWeights;
              const weight = weights?.[dim.key] || 1 / 7;
              const percentage = Math.round(weight * 100);

              return (
                <div
                  key={dim.key}
                  className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-1.5"
                >
                  <span>{dim.icon}</span>
                  <span className="text-sm">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
