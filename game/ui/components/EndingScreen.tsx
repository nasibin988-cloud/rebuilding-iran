'use client';

/**
 * IRAN 14XX - Ending Screen
 *
 * Displays the game ending with epilogue and stats.
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { useGameStore } from '../hooks/useGameStore';
import type { EndingContent } from '../../engine/content/ContentLoader';
import type { EudaimoniaState, EudaimoniaSimple, EudaimoniaDimensions, DimensionScore } from '../../engine/core/types';

// Type for eudaimonia dimension keys
type EudaimoniaDimensionKey = keyof EudaimoniaDimensions;

interface EndingScreenProps {
  ending: EndingContent;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function EndingScreen({ ending, onRestart, onMainMenu }: EndingScreenProps) {
  const { t, isRTL } = useGame();
  const gameState = useGameStore((state) => state.gameState);

  // Get category color and icon
  const getCategoryStyle = () => {
    switch (ending.category) {
      case 'democratic':
        return { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: '🕊️' };
      case 'authoritarian':
        return { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: '⛓️' };
      case 'fragmentation':
        return { color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: '💔' };
      case 'stalemate':
        return { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: '⏳' };
      case 'personal':
        return { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: '👤' };
      default:
        return { color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: '📜' };
    }
  };

  const style = getCategoryStyle();

  // Calculate final eudaimonia - handle both EudaimoniaState and EudaimoniaSimple
  const eudaimonia = gameState?.eudaimonia;

  // Helper to get eudaimonia values regardless of format
  const getEudaimoniaValue = (key: EudaimoniaDimensionKey): number => {
    if (!eudaimonia) return 50;

    // Check if using EudaimoniaState (has dimensions)
    if ('dimensions' in eudaimonia && eudaimonia.dimensions) {
      const eudaimoniaState = eudaimonia as EudaimoniaState;
      const dim: DimensionScore | undefined = eudaimoniaState.dimensions[key];
      return dim?.value ?? 50;
    }

    // EudaimoniaSimple - direct values
    const simple = eudaimonia as EudaimoniaSimple;
    return simple[key] ?? 50;
  };

  // Simple values object for type checking
  const simpleValues = {
    freedomAgency: 0,
    securityOrder: 0,
    materialWellbeing: 0,
    healthLongevity: 0,
    socialCohesion: 0,
    culturalFlourishing: 0,
    sustainability: 0,
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-3xl w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`p-8 ${style.bgColor} text-center`}>
          <div className="text-6xl mb-4">{style.icon}</div>
          <h1 className={`text-3xl font-bold ${style.color}`}>
            {t(ending.title)}
          </h1>
          <div className="text-gray-400 mt-2">
            {t({
              fa: `نوبت ${gameState?.time.turn || 0}`,
              en: `Turn ${gameState?.time.turn || 0}`,
            })}
          </div>
        </div>

        {/* Description */}
        <div className="p-8 border-b border-gray-800">
          <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
            {t(ending.description)}
          </p>
        </div>

        {/* Epilogue */}
        <div className="p-8 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-xl font-bold mb-4">
            {t({ fa: 'سرانجام', en: 'Epilogue' })}
          </h2>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line italic">
            {t(ending.epilogue)}
          </p>
        </div>

        {/* Eudaimonia Stats */}
        {eudaimonia && (
          <div className="p-8 border-b border-gray-800">
            <h2 className="text-xl font-bold mb-4">
              {t({ fa: 'شاخص شکوفایی انسانی', en: 'Human Flourishing Index' })}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EudaimoniaBar
                label={t({ fa: 'آزادی', en: 'Freedom' })}
                value={getEudaimoniaValue('freedomAgency')}
                color="bg-blue-500"
              />
              <EudaimoniaBar
                label={t({ fa: 'عدالت', en: 'Justice' })}
                value={getEudaimoniaValue('securityOrder')}
                color="bg-purple-500"
              />
              <EudaimoniaBar
                label={t({ fa: 'رفاه', en: 'Prosperity' })}
                value={getEudaimoniaValue('materialWellbeing')}
                color="bg-yellow-500"
              />
              <EudaimoniaBar
                label={t({ fa: 'سلامت', en: 'Health' })}
                value={getEudaimoniaValue('healthLongevity')}
                color="bg-green-500"
              />
              <EudaimoniaBar
                label={t({ fa: 'جامعه', en: 'Community' })}
                value={getEudaimoniaValue('socialCohesion')}
                color="bg-pink-500"
              />
              <EudaimoniaBar
                label={t({ fa: 'فرهنگ', en: 'Culture' })}
                value={getEudaimoniaValue('culturalFlourishing')}
                color="bg-indigo-500"
              />
              <EudaimoniaBar
                label={t({ fa: 'پایداری', en: 'Sustainability' })}
                value={getEudaimoniaValue('sustainability')}
                color="bg-teal-500"
              />
            </div>
          </div>
        )}

        {/* Achievement */}
        {ending.achievement && (
          <div className="p-6 bg-yellow-500/10 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🏆</div>
              <div>
                <div className="text-sm text-yellow-400">
                  {t({ fa: 'دستاورد کسب شد', en: 'Achievement Unlocked' })}
                </div>
                <div className="text-lg font-bold">{ending.achievement}</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            {t({ fa: 'بازی مجدد', en: 'Play Again' })}
          </button>
          <button
            onClick={onMainMenu}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            {t({ fa: 'منوی اصلی', en: 'Main Menu' })}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for eudaimonia bars
function EudaimoniaBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-medium">{Math.round(value)}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default EndingScreen;
