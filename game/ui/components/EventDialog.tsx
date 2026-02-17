'use client';

/**
 * IRAN 14XX - Event Dialog
 *
 * Modal dialog for displaying events and collecting player decisions.
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import type { GameEvent, Decision } from '../../engine/core/types';

interface EventDialogProps {
  event: GameEvent;
  onClose: () => void;
  onDecision: (decisionId: string) => Promise<void>;
}

export function EventDialog({ event, onClose, onDecision }: EventDialogProps) {
  const { t, isRTL } = useGame();
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const handleDecision = async (decisionId: string) => {
    setIsSubmitting(true);
    try {
      await onDecision(decisionId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-dialog-title"
      aria-describedby="event-dialog-description"
    >
      <div
        className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-blue-400 mb-1">
                {t({
                  fa: event.category === 'story' ? 'رویداد داستانی' : 'رویداد',
                  en: event.category === 'story' ? 'Story Event' : 'Event',
                })}
              </div>
              <h2 id="event-dialog-title" className="text-2xl font-bold">{t(event.title)}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              aria-label={t({ fa: 'بستن', en: 'Close' })}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Event Image */}
          {event.image && (
            <div className="mb-6 rounded-lg overflow-hidden bg-gray-700 aspect-video flex items-center justify-center">
              <span className="text-6xl">🖼️</span>
              {/* In production, render actual image */}
            </div>
          )}

          {/* Description */}
          <div id="event-dialog-description" className="prose prose-invert max-w-none mb-8">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {t(event.description)}
            </p>
          </div>

          {/* Decisions */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-400 mb-3">
              {t({ fa: 'تصمیم شما چیست؟', en: 'What will you do?' })}
            </h3>

            {event.decisions.map((decision) => (
              <div key={decision.id} className="relative">
                <button
                  onClick={() => {
                    setSelectedDecision(decision.id);
                    setShowDetails(decision.id);
                  }}
                  disabled={!decision.available || isSubmitting}
                  className={`w-full text-start p-4 rounded-lg border-2 transition-all ${
                    selectedDecision === decision.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : decision.available
                      ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                      : 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium mb-1">{t(decision.label)}</div>
                  <div className="text-sm text-gray-400">
                    {t(decision.description)}
                  </div>

                  {!decision.available && (
                    <div className="text-xs text-red-400 mt-2">
                      {t({ fa: 'شرایط لازم برآورده نشده', en: 'Requirements not met' })}
                    </div>
                  )}

                  {/* Decision Tags */}
                  {decision.tags && decision.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {decision.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>

                {/* Expanded Details */}
                {showDetails === decision.id && decision.available && (
                  <div className="mt-2 p-3 bg-gray-700/50 rounded-lg text-sm">
                    <div className="text-gray-400 mb-2">
                      {t({ fa: 'تاثیرات احتمالی:', en: 'Potential effects:' })}
                    </div>

                    {/* Immediate Effects Preview */}
                    {decision.effects.immediate.length > 0 && (
                      <div className="space-y-1">
                        {decision.effects.immediate.slice(0, 3).map((effect, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-yellow-400">•</span>
                            <span className="text-gray-300">
                              {formatEffect(effect, t)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Delayed Effects Warning */}
                    {decision.effects.delayed.length > 0 && (
                      <div className="mt-2 text-yellow-500/80 text-xs">
                        ⚠️ {t({
                          fa: 'این تصمیم ممکن است عواقب آینده داشته باشد',
                          en: 'This decision may have future consequences',
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            {t({ fa: 'بعداً', en: 'Later' })}
          </button>
          <button
            onClick={() => selectedDecision && handleDecision(selectedDecision)}
            disabled={!selectedDecision || isSubmitting}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting
              ? t({ fa: 'در حال پردازش...', en: 'Processing...' })
              : t({ fa: 'تایید تصمیم', en: 'Confirm Decision' })}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format effects for display
function formatEffect(
  effect: { type: string; target: string; value: unknown },
  t: (text: { fa: string; en: string }) => string
): string {
  const value = typeof effect.value === 'number' ? effect.value : 0;
  const sign = value > 0 ? '+' : '';

  switch (effect.type) {
    case 'faction_trust':
      return t({
        fa: `${sign}${value} اعتماد با ${effect.target}`,
        en: `${sign}${value} trust with ${effect.target}`,
      });
    case 'resource_change':
      return t({
        fa: `${sign}${value} ${effect.target}`,
        en: `${sign}${value} ${effect.target}`,
      });
    case 'state_change':
      return t({
        fa: `تغییر در ${effect.target}`,
        en: `Change in ${effect.target}`,
      });
    case 'flag_set':
      return t({
        fa: `تنظیم پرچم: ${effect.target}`,
        en: `Set flag: ${effect.target}`,
      });
    default:
      return `${effect.type}: ${effect.target}`;
  }
}
