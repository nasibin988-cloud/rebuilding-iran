'use client';

/**
 * IRAN 14XX - Game Context Provider
 *
 * React context for game state and actions.
 * Wraps the application with game functionality.
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import type { LocalizedString } from '../../engine/core/types';

// =============================================================================
// CONTEXT TYPES
// =============================================================================

interface GameContextValue {
  // State
  isReady: boolean;
  isLoading: boolean;
  error: string | null;

  // Language
  language: 'fa' | 'en';
  setLanguage: (lang: 'fa' | 'en') => void;
  t: (text: LocalizedString | undefined) => string;
  isRTL: boolean;

  // Game Actions
  initialize: () => Promise<void>;
  startGame: (characterId: string, difficulty: string) => Promise<void>;
}

// =============================================================================
// CONTEXT
// =============================================================================

const GameContext = createContext<GameContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const store = useGameStore();

  // Auto-initialize on mount
  useEffect(() => {
    if (!store.isInitialized && !store.isLoading) {
      store.initializeGame();
    }
  }, [store.isInitialized, store.isLoading]);

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = store.language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = store.language;
  }, [store.language]);

  const contextValue: GameContextValue = {
    isReady: store.isInitialized,
    isLoading: store.isLoading,
    error: store.error,
    language: store.language,
    setLanguage: store.setLanguage,
    t: store.getText,
    isRTL: store.language === 'fa',
    initialize: store.initializeGame,
    startGame: store.startNewGame,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface TextProps {
  children: LocalizedString;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function Text({ children, className, as: Component = 'span' }: TextProps) {
  const { t } = useGame();
  return <Component className={className}>{t(children)}</Component>;
}

interface RTLWrapperProps {
  children: ReactNode;
  className?: string;
}

export function RTLWrapper({ children, className }: RTLWrapperProps) {
  const { isRTL } = useGame();

  return (
    <div
      className={className}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// LOADING COMPONENT
// =============================================================================

export function GameLoadingScreen() {
  const { isLoading, error, t, isRTL } = useGame();
  const store = useGameStore();

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="text-red-500 text-xl mb-4">
          {t({ fa: 'خطا', en: 'Error' })}
        </div>
        <div className="text-gray-400">{error}</div>
        <button
          onClick={() => store.initializeGame()}
          className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          {t({ fa: 'تلاش مجدد', en: 'Try Again' })}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-xl">
          {store.loadingMessage ? t(store.loadingMessage) : t({ fa: 'در حال بارگذاری...', en: 'Loading...' })}
        </div>
      </div>
    );
  }

  return null;
}
