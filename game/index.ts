/**
 * IRAN 14XX - Main Game Module Index
 *
 * This is the main entry point for the IRAN 14XX political simulation game.
 *
 * Game Structure:
 * - engine/core/ - Core game engine (state, turns, events, consequences, factions)
 * - engine/content/ - Content loading (YAML parsing)
 * - content/ - Game content (events, characters, factions, regions)
 * - ui/ - React UI components
 * - docs/ - Design documentation
 */

// Engine exports
export * from './engine/core/types';
export { GameStateManager, getGameState, initializeGameState } from './engine/core/GameState';
export { TurnEngine, getTurnEngine, initializeTurnEngine } from './engine/core/TurnEngine';
export { EventEngine, getEventEngine, initializeEventEngine, ConditionEvaluator } from './engine/core/EventEngine';
export { ConsequenceEngine, getConsequenceEngine, initializeConsequenceEngine } from './engine/core/ConsequenceEngine';
export { FactionEngine, getFactionEngine, initializeFactionEngine } from './engine/core/FactionEngine';
export { ContentLoader, getContentLoader, initializeContentLoader } from './engine/content/ContentLoader';

// UI exports
export { Game } from './ui/Game';
export { GameProvider, useGame, Text, RTLWrapper, GameLoadingScreen } from './ui/context/GameContext';
export { useGameStore, useLanguage, useGameState, useCurrentEvent, useTurnProcessing, useNotifications, useAdvisor } from './ui/hooks/useGameStore';
export * from './ui/components';
