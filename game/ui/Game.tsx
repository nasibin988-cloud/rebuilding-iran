'use client';

/**
 * IRAN 14XX - Main Game Component
 *
 * Entry point for the game UI. Handles:
 * - Initialization
 * - Loading states
 * - Character selection
 * - Main game loop
 */

import React from 'react';
import { GameProvider, GameLoadingScreen, useGame } from './context/GameContext';
import { useGameStore } from './hooks/useGameStore';
import { CharacterSelect } from './components/CharacterSelect';
import { GameShell } from './components/GameShell';

function GameContent() {
  const { isReady, isLoading, error } = useGame();
  const store = useGameStore();

  // Show loading screen
  if (isLoading || !isReady) {
    return <GameLoadingScreen />;
  }

  // Show error
  if (error) {
    return <GameLoadingScreen />;
  }

  // Show character select if no game in progress
  if (!store.gameState || !store.selectedCharacter) {
    return <CharacterSelect />;
  }

  // Show main game
  return <GameShell />;
}

export function Game() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

export default Game;
