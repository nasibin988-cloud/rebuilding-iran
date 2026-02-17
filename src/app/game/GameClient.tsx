'use client';

/**
 * IRAN 14XX - Game Client Component
 *
 * This is the Next.js client entry point for the game.
 * It dynamically imports the game to ensure it only loads on the client.
 */

import dynamic from 'next/dynamic';

// Dynamically import the game with no SSR
// This is necessary because the game uses browser APIs and Zustand
const Game = dynamic(
  () => import('../../../game/ui/Game').then((mod) => mod.Game),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">IRAN 14XX</h1>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    ),
  }
);

export default function GameClient() {
  return <Game />;
}
