'use client';

/**
 * IRAN 14XX - Game Shell
 *
 * The main game interface wrapper containing:
 * - Navigation sidebar
 * - Main content area
 * - Status bar
 * - Event dialogs
 */

import React, { useEffect, useState } from 'react';
import { useGame, Text, RTLWrapper } from '../context/GameContext';
import { useGameStore, useCurrentEvent, useNotifications } from '../hooks/useGameStore';
import { useAudio } from '../hooks/useAudio';
import { EventDialog } from './EventDialog';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { MapView } from './views/MapView';
import { FactionsView } from './views/FactionsView';
import { EudaimoniaView } from './views/EudaimoniaView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { NotificationPanel } from './NotificationPanel';
import { AdvisorPanel } from './AdvisorPanel';
import { EndingScreen } from './EndingScreen';

// Navigation items for the bottom bar
const navItems = [
  { id: 'map' as const, icon: '🗺️', label: { fa: 'نقشه', en: 'Map' } },
  { id: 'factions' as const, icon: '👥', label: { fa: 'جناح‌ها', en: 'Factions' } },
  { id: 'eudaimonia' as const, icon: '📊', label: { fa: 'رفاه', en: 'Flourishing' } },
  { id: 'history' as const, icon: '📜', label: { fa: 'تاریخچه', en: 'History' } },
  { id: 'settings' as const, icon: '⚙️', label: { fa: 'تنظیمات', en: 'Settings' } },
];

export function GameShell() {
  const { isRTL, t } = useGame();
  const store = useGameStore();
  const { currentEvent, isEventDialogOpen, closeEvent, submitDecision } = useCurrentEvent();
  const { startBackgroundMusic, isInitialized: audioInitialized } = useAudio();
  const isGameOver = useGameStore((state) => state.isGameOver);
  const currentEnding = useGameStore((state) => state.currentEnding);
  const restartGame = useGameStore((state) => state.restartGame);

  // Start background music on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!audioInitialized) {
        startBackgroundMusic();
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [audioInitialized, startBackgroundMusic]);

  // Render current view
  const renderMainContent = () => {
    switch (store.selectedView) {
      case 'map':
        return <MapView />;
      case 'factions':
        return <FactionsView />;
      case 'eudaimonia':
        return <EudaimoniaView />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <MapView />;
    }
  };

  return (
    <RTLWrapper className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Status Bar */}
      <StatusBar />

      {/* Main Content - Full Screen */}
      <main
        className="flex-1 overflow-auto"
        role="main"
        aria-label={t({ fa: 'محتوای اصلی بازی', en: 'Main game content' })}
      >
        {renderMainContent()}
      </main>

      {/* Bottom Navigation Bar */}
      <nav
        className="h-16 bg-gray-800 border-t border-gray-700 flex items-center justify-around px-2"
        aria-label={t({ fa: 'ناوبری اصلی', en: 'Main navigation' })}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => store.setView(item.id)}
            aria-current={store.selectedView === item.id ? 'page' : undefined}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors ${
              store.selectedView === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            <span className="text-xs mt-1">{t(item.label)}</span>
          </button>
        ))}

        {/* AI Advisor Button */}
        <button
          onClick={() => store.openAdvisor()}
          className="flex flex-col items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-colors"
          aria-label={t({ fa: 'مشاور هوش مصنوعی', en: 'AI Advisor' })}
        >
          <span className="text-xl" aria-hidden="true">🤖</span>
          <span className="text-xs mt-1">{t({ fa: 'مشاور', en: 'Advisor' })}</span>
        </button>

        {/* End Turn Button */}
        <button
          onClick={() => store.processTurn()}
          disabled={store.isTurnProcessing}
          className="flex flex-col items-center justify-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={t({ fa: 'پایان نوبت', en: 'End Turn' })}
        >
          <span className="text-xl" aria-hidden="true">▶️</span>
          <span className="text-xs mt-1">{t({ fa: 'پایان', en: 'End' })}</span>
        </button>
      </nav>

      {/* Notifications Panel - Live region for screen readers */}
      <NotificationPanel />

      {/* AI Advisor Panel */}
      {store.isAdvisorOpen && <AdvisorPanel />}

      {/* Event Dialog */}
      {isEventDialogOpen && currentEvent && (
        <EventDialog
          event={currentEvent}
          onClose={closeEvent}
          onDecision={submitDecision}
        />
      )}

      {/* Turn Processing Overlay */}
      {store.isTurnProcessing && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={t({ fa: 'در حال پردازش', en: 'Processing' })}
        >
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              role="status"
              aria-label={t({ fa: 'در حال بارگذاری', en: 'Loading' })}
            />
            <div className="text-lg" aria-live="polite">
              {t({ fa: 'در حال پردازش نوبت...', en: 'Processing turn...' })}
            </div>
          </div>
        </div>
      )}

      {/* Game Ending Screen */}
      {isGameOver && currentEnding && (
        <EndingScreen
          ending={currentEnding}
          onRestart={restartGame}
          onMainMenu={restartGame}
        />
      )}
    </RTLWrapper>
  );
}
